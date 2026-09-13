import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthError } from '../../api/auth.js'
import AuthAlert from '../../components/auth/AuthAlert.jsx'
import AuthField from '../../components/auth/AuthField.jsx'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import AuthSuccess from '../../components/auth/AuthSuccess.jsx'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { images } from '../../data/images.js'
import { emailError, maskEmail } from '../../utils/authValidation.js'

function ForgotPassword() {
  const { requestReset } = useAuth()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [sentEmail, setSentEmail] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const fieldError = touched ? emailError(email) : ''

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched(true)
    setFormError('')
    if (emailError(email)) return

    setBusy(true)
    try {
      await requestReset(email)
      setSentEmail(email.trim())
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout variant="card" image={images.authKitchen} imageAlt="">
      {sentEmail ? (
        <AuthSuccess
          eyebrow="Account"
          title="Check your inbox"
          copy={`If an account exists for ${maskEmail(sentEmail)}, password reset instructions have been sent. Follow the email link to choose a new password.`}
        >
          <p className="auth__hint">
            For security, we do not reveal whether an account exists for that address.
          </p>
          <Button to="/login" className="auth__submit">
            BACK TO LOGIN
          </Button>
        </AuthSuccess>
      ) : (
        <>
          <p className="auth__eyebrow">Account</p>
          <h1 className="auth__title">Reset Your Password</h1>
          <p className="auth__copy">
            Enter your email address and we’ll help you regain access to your account.
          </p>

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            <AuthAlert>{formError}</AuthAlert>

            <AuthField
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@email.com"
              value={email}
              error={fieldError}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
            />

            <Button type="submit" className="auth__submit" disabled={busy} aria-busy={busy}>
              {busy ? 'Please wait' : 'SEND RESET LINK'}
            </Button>
          </form>

          <p className="auth__switch">
            <Link className="auth__text-link" to="/login">
              BACK TO LOGIN
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
