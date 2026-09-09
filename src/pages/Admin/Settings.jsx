import { useEffect, useState } from 'react'
import { getAdminSettings, updateAdminSettings } from '../../api/adminSettings.js'
import { useAdminUi } from '../../context/AdminUi.jsx'
import { AdminButton, ErrorState, FormField, LoadingState, PageHeader } from '../../components/admin/ui.jsx'

function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useAdminUi()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getAdminSettings()
      .then((res) => {
        if (cancelled) return
        setSettings(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Could not load store settings.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = form || settings || {}

  function set(key, next) {
    setForm({ ...value, [key]: next })
  }

  async function save(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!value.supportEmail || !value.supportEmail.includes('@')) nextErrors.supportEmail = 'Enter a valid email.'
    if (!(Number(value.standardShipping) >= 0)) nextErrors.standardShipping = 'Enter shipping in rupees.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Check the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        supportEmail: value.supportEmail,
        supportPhone: value.supportPhone,
        standardShippingFee: Number(value.standardShipping) || 0,
        standardShipping: Number(value.standardShipping) || 0,
        freeShippingThreshold: Number(value.freeShippingFrom) || 0,
        freeShippingFrom: Number(value.freeShippingFrom) || 0,
        lowStockThreshold: Number(value.lowStockAlert) || 10,
        lowStockAlert: Number(value.lowStockAlert) || 10,
      }
      const res = await updateAdminSettings(payload)
      setSettings(res.data)
      setForm(null)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  function handleReload() {
    setLoading(true)
    setError('')
    getAdminSettings()
      .then((res) => {
        setSettings(res.data)
        setForm(null)
        toast.info('Settings reloaded from database')
      })
      .catch((err) => {
        setError(err.message || 'Failed to reload settings')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  if (loading && !settings) return <LoadingState label="Loading settings" />
  if (error && !settings) {
    return <ErrorState title="Could not load settings" copy={error} onRetry={handleReload} />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Store"
        title="Settings"
        copy="Operational defaults for shipping, support and stock alerts. Brand colour stays in the chrome, not the forms."
        actions={
          <AdminButton variant="ghost" onClick={handleReload}>
            Reload settings
          </AdminButton>
        }
      />
      <form className="admin-panel" style={{ padding: 20, maxWidth: 640 }} onSubmit={save}>
        <div className="admin-form-grid">
          <FormField label="Support email" error={errors.supportEmail}>
            <input value={value.supportEmail} onChange={(event) => set('supportEmail', event.target.value)} />
          </FormField>
          <FormField label="Support phone">
            <input value={value.supportPhone} onChange={(event) => set('supportPhone', event.target.value)} />
          </FormField>
          <FormField label="Standard shipping (INR)" error={errors.standardShipping}>
            <input
              type="number"
              min="0"
              value={value.standardShipping}
              onChange={(event) => set('standardShipping', event.target.value)}
            />
          </FormField>
          <FormField label="Free shipping from (INR)">
            <input
              type="number"
              min="0"
              value={value.freeShippingFrom}
              onChange={(event) => set('freeShippingFrom', event.target.value)}
            />
          </FormField>
          <FormField label="Low-stock alert at" hint="Inventory uses this threshold for the low-stock badge.">
            <input
              type="number"
              min="1"
              value={value.lowStockAlert}
              onChange={(event) => set('lowStockAlert', event.target.value)}
            />
          </FormField>
        </div>
        <div className="admin-modal__actions">
          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </AdminButton>
        </div>
      </form>
    </div>
  )
}

export default Settings
