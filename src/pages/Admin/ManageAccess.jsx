import { useCallback, useEffect, useState } from 'react'
import {
  createAdminInvitation,
  listAccessAudit,
  listAdminInvitations,
  listAdminUsers,
  resendAdminInvitation,
  revokeAdminInvitation,
  updateAdminUser,
} from '../../api/adminAccess.js'
import { useAdminUi } from '../../context/AdminUi.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatAdminDate, formatAdminDateTime } from '../../data/admin.js'
import { Icon } from '../../components/admin/icons.jsx'
import {
  AdminButton,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '../../components/admin/ui.jsx'
import { roleLabel } from '../../utils/adminPermissions.js'
import { emailError, nameError } from '../../utils/authValidation.js'
import './ManageAccess.css'

function statusLabel(status) {
  const value = String(status || '').toUpperCase()
  if (value === 'ACTIVE' || value === 'VIP') return 'Active'
  if (value === 'INACTIVE') return 'Inactive'
  if (value === 'SUSPENDED') return 'Suspended'
  return value || '—'
}

export default function ManageAccess() {
  const { user } = useAuth()
  const { toast, confirm } = useAdminUi()
  const [admins, setAdmins] = useState([])
  const [invites, setInvites] = useState([])
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emailConfigured, setEmailConfigured] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'ADMIN' })
  const [addErrors, setAddErrors] = useState({})
  const [bootstrapUrl, setBootstrapUrl] = useState('')

  const [editTarget, setEditTarget] = useState(null)
  const [editRole, setEditRole] = useState('ADMIN')
  const [editBusy, setEditBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, invitesRes, auditRes] = await Promise.all([
        listAdminUsers(),
        listAdminInvitations(),
        listAccessAudit(30),
      ])
      setAdmins(usersRes.data || [])
      setInvites(invitesRes.data || [])
      setEmailConfigured(Boolean(invitesRes.emailDeliveryConfigured))
      setAudit(auditRes.data || [])
    } catch (err) {
      setError(err.message || 'Could not load admin access.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreateInvite(event) {
    event.preventDefault()
    const nextErrors = {
      name: nameError(addForm.name),
      email: emailError(addForm.email),
    }
    setAddErrors(nextErrors)
    if (nextErrors.name || nextErrors.email) return

    setAddBusy(true)
    setBootstrapUrl('')
    try {
      const res = await createAdminInvitation({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        role: addForm.role,
      })
      toast.success(res.message || 'Invitation created.')
      if (res.data?.setupUrl) {
        setBootstrapUrl(res.data.setupUrl)
      } else {
        setShowAdd(false)
        setAddForm({ name: '', email: '', role: 'ADMIN' })
      }
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Could not create invitation.')
    } finally {
      setAddBusy(false)
    }
  }

  async function handleDeactivate(admin) {
    const isSelf = admin.id === user?.id
    const ok = await confirm({
      title: isSelf ? 'Deactivate your own access?' : `Deactivate ${admin.name}?`,
      message: isSelf
        ? 'You will lose admin access immediately. Confirm only if another Super Admin remains.'
        : 'They will no longer be able to sign in to the admin panel.',
      confirmLabel: 'Deactivate',
      danger: true,
    })
    if (!ok) return
    try {
      await updateAdminUser(admin.id, {
        status: 'INACTIVE',
        confirmSelfLock: isSelf,
      })
      toast.success('Admin deactivated.')
      if (isSelf) {
        window.location.assign('/admin/login')
        return
      }
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Could not deactivate admin.')
    }
  }

  async function handleReactivate(admin) {
    try {
      await updateAdminUser(admin.id, { status: 'ACTIVE' })
      toast.success('Admin reactivated.')
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Could not reactivate admin.')
    }
  }

  async function handleSaveRole() {
    if (!editTarget) return
    const isSelf = editTarget.id === user?.id
    const demotingSelf =
      isSelf &&
      String(editTarget.role).toUpperCase() === 'SUPER_ADMIN' &&
      editRole === 'ADMIN'

    if (demotingSelf) {
      const ok = await confirm({
        title: 'Demote your Super Admin role?',
        message: 'You will lose Manage Access privileges after this change.',
        confirmLabel: 'Change role',
        danger: true,
      })
      if (!ok) return
    }

    setEditBusy(true)
    try {
      await updateAdminUser(editTarget.id, {
        role: editRole,
        confirmSelfLock: demotingSelf,
      })
      toast.success('Role updated.')
      setEditTarget(null)
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Could not change role.')
    } finally {
      setEditBusy(false)
    }
  }

  async function handleResend(invite) {
    try {
      const res = await resendAdminInvitation(invite.id)
      toast.success('Invitation resent.')
      if (res.data?.setupUrl) setBootstrapUrl(res.data.setupUrl)
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Could not resend invitation.')
    }
  }

  async function handleRevoke(invite) {
    const ok = await confirm({
      title: 'Revoke invitation?',
      message: `The setup link for ${invite.email} will stop working.`,
      confirmLabel: 'Revoke',
      danger: true,
    })
    if (!ok) return
    try {
      await revokeAdminInvitation(invite.id)
      toast.success('Invitation revoked.')
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Could not revoke invitation.')
    }
  }

  if (loading) return <LoadingState label="Loading admin access…" />
  if (error) return <ErrorState title="Could not load access" copy={error} onRetry={refresh} />

  return (
    <div className="access-page">
      <PageHeader
        eyebrow="Security"
        title="Manage Access"
        copy="Invite staff, control roles, and review administrative account activity. Passwords are never shown here."
        actions={
          <AdminButton icon="plus" onClick={() => setShowAdd(true)}>
            Add Admin
          </AdminButton>
        }
      />

      {!emailConfigured ? (
        <p className="access-banner" role="status">
          Email delivery is not configured. Invitation setup links are shown once to Super Admins after
          create/resend so you can share them securely out-of-band. Configure SMTP / RESEND to send email
          automatically.
        </p>
      ) : null}

      {bootstrapUrl ? (
        <div className="access-bootstrap" role="status">
          <p>
            <strong>One-time setup link</strong> (copy and share privately — it will not appear in API logs):
          </p>
          <code className="access-bootstrap__url">{bootstrapUrl}</code>
          <div className="access-bootstrap__actions">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(bootstrapUrl).then(
                  () => toast.success('Setup link copied'),
                  () => toast.info(bootstrapUrl),
                )
              }}
            >
              Copy link
            </AdminButton>
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setBootstrapUrl('')
                setShowAdd(false)
                setAddForm({ name: '', email: '', role: 'ADMIN' })
              }}
            >
              Dismiss
            </AdminButton>
          </div>
        </div>
      ) : null}

      <section className="admin-panel access-panel">
        <div className="admin-panel__head">
          <h2>Admin Users</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const active = ['ACTIVE', 'VIP'].includes(String(admin.status).toUpperCase())
                return (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.name}</strong>
                      {admin.id === user?.id ? <span className="access-you">You</span> : null}
                    </td>
                    <td>{admin.email}</td>
                    <td>{admin.roleLabel || roleLabel(admin.role)}</td>
                    <td>
                      <StatusBadge status={statusLabel(admin.status)} kind="account" />
                    </td>
                    <td>{admin.lastLoginAt ? formatAdminDateTime(admin.lastLoginAt) : 'Never'}</td>
                    <td>{formatAdminDate(admin.createdAt)}</td>
                    <td>
                      <div className="access-actions">
                        <button
                          type="button"
                          className="access-action"
                          onClick={() => {
                            setEditTarget(admin)
                            setEditRole(String(admin.role).toUpperCase() === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN')
                          }}
                        >
                          Edit role
                        </button>
                        {active ? (
                          <button
                            type="button"
                            className="access-action access-action--danger"
                            onClick={() => handleDeactivate(admin)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="access-action"
                            onClick={() => handleReactivate(admin)}
                            disabled={!admin.hasPassword}
                            title={!admin.hasPassword ? 'Complete invitation setup first' : undefined}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!admins.length ? <EmptyState title="No admin users" copy="Invite the first administrator to begin." /> : null}
        </div>
      </section>

      <section className="admin-panel access-panel">
        <div className="admin-panel__head">
          <h2>Pending invitations</h2>
        </div>
        <div className="admin-table-wrap">
          {invites.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.name}</td>
                    <td>{invite.email}</td>
                    <td>{invite.roleLabel || roleLabel(invite.role)}</td>
                    <td>{formatAdminDateTime(invite.expiresAt)}</td>
                    <td>
                      <div className="access-actions">
                        <button type="button" className="access-action" onClick={() => handleResend(invite)}>
                          Resend
                        </button>
                        <button
                          type="button"
                          className="access-action access-action--danger"
                          onClick={() => handleRevoke(invite)}
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No pending invitations" copy="New invites will appear here until accepted or expired." />
          )}
        </div>
      </section>

      <section className="admin-panel access-panel">
        <div className="admin-panel__head">
          <h2>Access activity</h2>
        </div>
        <div className="admin-table-wrap">
          {audit.length ? (
            <table className="admin-table admin-table--quiet">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatAdminDateTime(entry.createdAt)}</td>
                    <td>{entry.action}</td>
                    <td>{entry.actorEmail || '—'}</td>
                    <td>{entry.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No activity yet" copy="Admin access events will appear here." />
          )}
        </div>
      </section>

      {showAdd ? (
        <div className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-add-title">
          <button type="button" className="access-modal__backdrop" aria-label="Close" onClick={() => setShowAdd(false)} />
          <form className="access-modal__panel" onSubmit={handleCreateInvite}>
            <header className="access-modal__head">
              <h2 id="access-add-title">Add Admin</h2>
              <button type="button" className="admin-iconbtn" onClick={() => setShowAdd(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </header>
            <p className="access-modal__copy">
              We create a secure invitation. The new admin sets their own password — you never see it.
            </p>
            <FormField label="Name" error={addErrors.name}>
              <input
                value={addForm.name}
                onChange={(event) => setAddForm((current) => ({ ...current, name: event.target.value }))}
                disabled={addBusy}
                autoComplete="name"
              />
            </FormField>
            <FormField label="Email" error={addErrors.email}>
              <input
                type="email"
                value={addForm.email}
                onChange={(event) => setAddForm((current) => ({ ...current, email: event.target.value }))}
                disabled={addBusy}
                autoComplete="email"
              />
            </FormField>
            <FormField label="Role">
              <select
                value={addForm.role}
                onChange={(event) => setAddForm((current) => ({ ...current, role: event.target.value }))}
                disabled={addBusy}
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </FormField>
            <div className="access-modal__actions">
              <AdminButton variant="secondary" type="button" onClick={() => setShowAdd(false)} disabled={addBusy}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" disabled={addBusy} aria-busy={addBusy}>
                {addBusy ? 'Creating…' : 'Create invitation'}
              </AdminButton>
            </div>
          </form>
        </div>
      ) : null}

      {editTarget ? (
        <div className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-edit-title">
          <button type="button" className="access-modal__backdrop" aria-label="Close" onClick={() => setEditTarget(null)} />
          <div className="access-modal__panel">
            <header className="access-modal__head">
              <h2 id="access-edit-title">Change role</h2>
              <button type="button" className="admin-iconbtn" onClick={() => setEditTarget(null)} aria-label="Close">
                <Icon name="close" />
              </button>
            </header>
            <p className="access-modal__copy">
              {editTarget.name} · {editTarget.email}
            </p>
            <FormField label="Role">
              <select value={editRole} onChange={(event) => setEditRole(event.target.value)} disabled={editBusy}>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </FormField>
            <div className="access-modal__actions">
              <AdminButton variant="secondary" type="button" onClick={() => setEditTarget(null)} disabled={editBusy}>
                Cancel
              </AdminButton>
              <AdminButton type="button" onClick={handleSaveRole} disabled={editBusy} aria-busy={editBusy}>
                {editBusy ? 'Saving…' : 'Save role'}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
