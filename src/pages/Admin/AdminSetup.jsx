import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { acceptAdminSetup, validateAdminSetup } from '../../api/adminAccess.js'
import { ApiError } from '../../api/client.js'
import { AdminButton, FormField } from '../../components/admin/ui.jsx'
import { Icon } from '../../components/admin/icons.jsx'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import { passwordError } from '../../utils/passwordPolicy.js'
import { roleLabel } from '../../utils/adminPermissions.js'
import '../../components/admin/admin.css'

export default function AdminSetup() {
  const [params] = useSearchParams()
  const token = useMemo(() => String(params.get('token') || ''), [params])
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('admin-open')
    return () => document.documentElement.classList.remove('admin-open')
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      if (!token) {
        setLoadError('Invitation expired. Please request a new invitation.')
        setLoading(false)
        return
      }
      try {
        const res = await validateAdminSetup(token)
        if (cancelled) return
        setInvite(res.data)
      } catch (error) {
        if (cancelled) return
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Invitation expired. Please request a new invitation.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const issue = passwordError(password)
    if (issue) {
      setFormError(issue)
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await acceptAdminSetup({ token, password })
      setDone(true)
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Could not create your password. Request a new invitation.',
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
        <p className="admin-login__aside-copy">Create your own staff password to finish setup.</p>
      </aside>

      <main className="admin-login__main">
        {loading ? (
          <p className="admin-login__copy">Checking invitation…</p>
        ) : loadError ? (
          <div className="admin-login__form">
            <h1 className="admin-title">Invitation unavailable</h1>
            <p className="admin-login__alert" role="alert">
              <Icon name="alert" size={15} />
              <span>{loadError}</span>
            </p>
            <AdminButton to="/admin/login" className="admin-login__submit">
              Back to admin login
            </AdminButton>
          </div>
        ) : done ? (
          <div className="admin-login__form">
            <h1 className="admin-title">Password created</h1>
            <p className="admin-login__copy">You can now sign in to the admin panel with your email and password.</p>
            <AdminButton
              className="admin-login__submit"
              onClick={() => navigate('/admin/login', { replace: true })}
            >
              Continue to login
            </AdminButton>
          </div>
        ) : (
          <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
            <header className="admin-login__head">
              <p className="admin-login__eyebrow">Admin setup</p>
              <h1 className="admin-title">Create your password</h1>
              <p className="admin-login__copy">
                {invite?.name ? `${invite.name} · ` : null}
                {invite?.email}
                {invite?.role ? ` · ${invite.roleLabel || roleLabel(invite.role)}` : null}
              </p>
            </header>

            {formError ? (
              <p className="admin-login__alert" role="alert">
                <Icon name="alert" size={15} />
                <span>{formError}</span>
              </p>
            ) : null}

            <FormField label="New password">
              <div className="admin-login__secret">
                <input
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  disabled={busy}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="admin-login__reveal"
                  onClick={() => setVisible((open) => !open)}
                  aria-label={visible ? 'Hide password' : 'Show password'}
                >
                  {visible ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm password">
              <input
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                disabled={busy}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </FormField>

            <AdminButton type="submit" className="admin-login__submit" disabled={busy} aria-busy={busy}>
              {busy ? 'Saving…' : 'Create password'}
            </AdminButton>

            <p className="admin-login__note">
              Already set up? <Link to="/admin/login">Sign in</Link>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
