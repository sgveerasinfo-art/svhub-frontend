import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthError } from '../../api/auth.js'
import AuthAlert from '../../components/auth/AuthAlert.jsx'
import AuthField from '../../components/auth/AuthField.jsx'
import AuthGoogleButton from '../../components/auth/AuthGoogleButton.jsx'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import AuthSuccess from '../../components/auth/AuthSuccess.jsx'
import PasswordField from '../../components/auth/PasswordField.jsx'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { images } from '../../data/images.js'
import { loginIdentifierError } from '../../utils/authValidation.js'

function safeFrom(path) {
  if (!path || path === '/login' || path === '/register') return '/'
  return path
}

function Login() {
  const { user, login, loginWithGoogle, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectParam = new URLSearchParams(location.search).get('redirect')
  const from = safeFrom(location.state?.from || redirectParam)
  const infoMessage = location.state?.message || ''
  const justRegistered = Boolean(location.state?.registered)

  const [identifier, setIdentifier] = useState(location.state?.email || '')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [googleCreated, setGoogleCreated] = useState(false)
  const hadSession = useRef(Boolean(user))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [googleCreated])

  useEffect(() => {
    if (!hadSession.current) return undefined
    hadSession.current = false
    logout()
    return undefined
  }, [logout])

  useEffect(() => {
    if (!googleCreated) return undefined
    const timer = window.setTimeout(() => navigate(from, { replace: true }), 1800)
    return () => window.clearTimeout(timer)
  }, [googleCreated, from, navigate])

  const identifierErr = touched.identifier ? loginIdentifierError(identifier) : ''
  const passwordErr = touched.password && !password ? 'Enter your password.' : ''

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched({ identifier: true, password: true })
    setFormError('')

    const nextIdentifier = loginIdentifierError(identifier)
    const nextPassword = password ? '' : 'Enter your password.'
    if (nextIdentifier || nextPassword) return

    setBusy(true)
    try {
      await login({ identifier, password })
      navigate(from, { replace: true })
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

  async function handleGoogle() {
    setFormError('')
    setBusy(true)
    try {
      const result = await loginWithGoogle()
      if (result.created) {
        setGoogleCreated(true)
        return
      }
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : 'Google Sign-In didn’t work. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout variant="split" image={images.authKitchen} imageAlt="Home-cooked rice and curry">
      {googleCreated ? (
        <AuthSuccess
          eyebrow="Account"
          title="Successfully registered"
          copy="Your SV Hub account is ready. Taking you into the site."
        >
          <Button className="auth__submit" onClick={() => navigate(from, { replace: true })}>
            CONTINUE
          </Button>
        </AuthSuccess>
      ) : (
        <>
          <p className="auth__eyebrow">Account</p>
          <h1 className="auth__title">Welcome Back</h1>

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {justRegistered ? (
              <AuthAlert tone="success">
                Registration successful. Please log in to continue.
              </AuthAlert>
            ) : null}
            {infoMessage ? (
              <AuthAlert tone="info">
                {infoMessage}
              </AuthAlert>
            ) : null}
            <AuthAlert>{formError}</AuthAlert>

            <AuthField
              id="login-identifier"
              label="Email or mobile number"
              type="text"
              autoComplete="username"
              inputMode="email"
              placeholder="you@email.com or 10-digit mobile"
              value={identifier}
              error={identifierErr}
              onChange={(event) => setIdentifier(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, identifier: true }))}
            />

            <PasswordField
              id="login-password"
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              error={passwordErr}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            />

            <div className="auth__row">
              <Link className="auth__text-link" to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="auth__submit"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? 'Please wait' : 'LOGIN'}
            </Button>
          </form>

          <AuthGoogleButton busy={busy} onClick={handleGoogle} />

          <p className="auth__switch">
            Don’t have an account?
            <Link className="auth__text-link" to="/register" state={{ from }}>
              CREATE ACCOUNT
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default Login
