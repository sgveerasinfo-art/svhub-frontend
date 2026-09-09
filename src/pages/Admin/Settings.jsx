import { useState } from 'react'
import { useAdminStore } from '../../context/AdminStore.jsx'
import { useAdminUi } from '../../context/AdminUi.jsx'
import { AdminButton, FormField, LoadingState, PageHeader } from '../../components/admin/ui.jsx'

function Settings() {
  const { ready, settings, updateSettings, resetStore } = useAdminStore()
  const { toast, confirm } = useAdminUi()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})

  const value = form || settings

  function set(key, next) {
    setForm({ ...value, [key]: next })
  }

  function save(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!value.supportEmail.includes('@')) nextErrors.supportEmail = 'Enter a valid email.'
    if (!(Number(value.standardShipping) >= 0)) nextErrors.standardShipping = 'Enter shipping in rupees.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Check the highlighted fields.')
      return
    }
    updateSettings({
      ...value,
      freeShippingFrom: Number(value.freeShippingFrom) || 0,
      standardShipping: Number(value.standardShipping) || 0,
      lowStockAlert: Number(value.lowStockAlert) || 10,
    })
    setForm(null)
    toast.success('Settings saved')
  }

  async function reset() {
    const ok = await confirm({
      title: 'Reset demo data?',
      message: 'Orders, products, inventory and settings will return to the seeded catalogue.',
      confirmLabel: 'Reset',
      danger: true,
    })
    if (!ok) return
    resetStore()
    setForm(null)
    toast.info('Admin data reset')
  }

  if (!ready) return <LoadingState label="Loading settings" />

  return (
    <div>
      <PageHeader
        eyebrow="Store"
        title="Settings"
        copy="Operational defaults for shipping, support and stock alerts. Brand colour stays in the chrome, not the forms."
        actions={
          <AdminButton variant="ghost" onClick={reset}>
            Reset demo data
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
          <AdminButton type="submit">Save settings</AdminButton>
        </div>
      </form>
    </div>
  )
}

export default Settings
