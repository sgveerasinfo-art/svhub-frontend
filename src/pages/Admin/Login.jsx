import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthError, readToken } from '../../api/auth.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { AdminButton, FormField } from '../../components/admin/ui.jsx'
import { Icon } from '../../components/admin/icons.jsx'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import { adminIdentifierError, clearAdminLocalState, hasAdminAccess } from '../../utils/adminPermissions.js'
import '../../components/admin/admin.css'

function safeFrom(path) {
  if (!path || !path.startsWith('/admin') || path === '/admin/login' || path.startsWith('/admin/setup')) {
    return '/admin'
  }
  return path
}

function AdminLogin() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeFrom(location.state?.from)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [touched, setTouched] = useState({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    document.documentElement.classList.add('admin-open')
    clearAdminLocalState()
    try {
      const notice = window.sessionStorage.getItem('svhub.auth.notice')
      if (notice) {
        window.sessionStorage.removeItem('svhub.auth.notice')
        setFormError(notice)
      }
    } catch {
      /* ignore */
    }
    return () => document.documentElement.classList.remove('admin-open')
  }, [])

  useEffect(() => {
    if (hasAdminAccess(user) && readToken()) {
      navigate(from, { replace: true })
    }
  }, [user, from, navigate])

  const emailErr = touched.email ? adminIdentifierError(email) : ''
  const passwordErr = touched.password && !password ? 'Enter your password.' : ''

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setFormError('')

    const nextEmail = adminIdentifierError(email)
    const nextPassword = password ? '' : 'Enter your password.'
    if (nextEmail || nextPassword) return

    setBusy(true)
    try {
      const session = await login({ identifier: email.trim(), password })
      if (!hasAdminAccess(session)) {
        await logout()
        clearAdminLocalState()
        setFormError('This account does not have operations access.')
        return
      }
      navigate(from, { replace: true })
    } catch (error) {
      clearAdminLocalState()
      setFormError(
        error instanceof AuthError ? error.message : 'Could not sign in. Check your details and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <aside className="admin-login__aside" aria-hidden="true">
        <div className="admin-login__brand">
          <img className="admin-brand__img" src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
          <span className="admin-login__lockup">
            <span className="admin-login__name">SV Hub</span>
            <span className="admin-login__tag">Admin</span>
          </span>
        </div>
        <p className="admin-login__aside-copy">Catalogue, orders and inventory for authorised staff.</p>
      </aside>

      <main className="admin-login__main">
        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
          <header className="admin-login__head">
            <p className="admin-login__eyebrow">Operations</p>
            <h1 className="admin-title">Admin Login</h1>
            <p className="admin-login__copy">Sign in with your staff email and password.</p>
          </header>

          {formError ? (
            <p className="admin-login__alert" role="alert">
              <Icon name="alert" size={15} />
              <span>{formError}</span>
            </p>
          ) : null}

          <FormField label="Email" error={emailErr}>
            <input
              id="admin-login-email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="you@company.com"
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            />
          </FormField>

          <div className={`admin-field${passwordErr ? ' admin-field--error' : ''}`}>
            <label htmlFor="admin-login-password">Password</label>
            <div className={`admin-login__secret${passwordErr ? ' is-invalid' : ''}`}>
              <input
                id="admin-login-password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              />
              <button
                type="button"
                className="admin-login__reveal"
                onClick={() => setVisible((open) => !open)}
                disabled={busy}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                aria-controls="admin-login-password"
              >
                {visible ? 'Hide' : 'Show'}
              </button>
            </div>
            {passwordErr ? <em>{passwordErr}</em> : null}
          </div>

          <AdminButton type="submit" className="admin-login__submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Signing in…' : 'LOGIN'}
          </AdminButton>

          <p className="admin-login__note">Restricted access. Unauthorised use is not permitted.</p>
        </form>
      </main>
    </div>
  )
}

export default AdminLogin
