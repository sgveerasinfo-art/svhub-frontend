import { useEffect, useMemo, useState } from 'react'
import { getAdminSettings, updateAdminSettings } from '../../api/adminSettings.js'
import { useAdminUi } from '../../context/AdminUi.jsx'
import { AdminButton, ErrorState, FormField, LoadingState, PageHeader } from '../../components/admin/ui.jsx'

const STATUS_COPY = {
  active: 'Active — festival hero is live on the homepage',
  scheduled: 'Scheduled — will activate at start time (Asia/Kolkata)',
  expired: 'Expired — homepage shows the normal hero',
  disabled: 'Disabled — homepage shows the normal hero',
}

function emptyCampaign() {
  return {
    enabled: false,
    label: '',
    title: '',
    subtitle: '',
    discountPercent: 10,
    urgencyLabel: '',
    ctaLabel: 'Shop the Celebration',
    ctaTo: '/shop',
    imageUrl: '',
    imageAlt: '',
    startAtLocal: '',
    endAtLocal: '',
    status: 'disabled',
    timezone: 'Asia/Kolkata',
    discountAppliesAtCheckout: false,
  }
}

function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useAdminUi()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [previewCampaign, setPreviewCampaign] = useState(false)

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
  const campaign = value.heroCampaign || emptyCampaign()

  function set(key, next) {
    setForm({ ...value, [key]: next })
  }

  function setCampaign(key, next) {
    setForm({
      ...value,
      heroCampaign: {
        ...campaign,
        [key]: next,
      },
    })
  }

  function setHeroMode(mode) {
    const enabled = mode === 'campaign'
    setForm({
      ...value,
      heroCampaign: {
        ...campaign,
        enabled,
        // Keep UI status in sync with the selected mode before save.
        status: enabled
          ? campaign.status && campaign.status !== 'disabled'
            ? campaign.status
            : 'scheduled'
          : 'disabled',
      },
    })
  }

  async function save(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!value.supportEmail || !value.supportEmail.includes('@')) nextErrors.supportEmail = 'Enter a valid email.'
    if (!(Number(value.standardShipping) >= 0)) nextErrors.standardShipping = 'Enter shipping in rupees.'

    const campaignEnabled = Boolean(campaign.enabled)
    if (campaignEnabled) {
      if (!String(campaign.label || '').trim()) nextErrors.campaignLabel = 'Enter a campaign label.'
      if (!String(campaign.title || '').trim()) nextErrors.campaignTitle = 'Enter a headline.'
      if (!String(campaign.subtitle || '').trim()) nextErrors.campaignSubtitle = 'Enter supporting copy.'
      if (!String(campaign.ctaLabel || '').trim()) nextErrors.campaignCta = 'Enter CTA text.'
      if (!String(campaign.ctaTo || '').startsWith('/')) nextErrors.campaignCtaTo = 'CTA path must start with /.'
      const discount = Number(campaign.discountPercent)
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        nextErrors.campaignDiscount = 'Discount must be 0–100.'
      }
      if (!campaign.startAtLocal) nextErrors.campaignStart = 'Choose a start date/time.'
      if (!campaign.endAtLocal) nextErrors.campaignEnd = 'Choose an end date/time.'
      if (campaign.startAtLocal && campaign.endAtLocal && campaign.endAtLocal <= campaign.startAtLocal) {
        nextErrors.campaignEnd = 'End must be after start.'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Check the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      const savedCampaign = settings?.heroCampaign || emptyCampaign()
      const payload = {
        supportEmail: value.supportEmail,
        supportPhone: value.supportPhone,
        standardShippingFee: Number(value.standardShipping) || 0,
        standardShipping: Number(value.standardShipping) || 0,
        freeShippingThreshold: Number(value.freeShippingFrom) || 0,
        freeShippingFrom: Number(value.freeShippingFrom) || 0,
        lowStockThreshold: Number(value.lowStockAlert) || 10,
        lowStockAlert: Number(value.lowStockAlert) || 10,
        heroCampaign: {
          enabled: campaignEnabled,
          label: String(campaign.label || savedCampaign.label || 'Ganesh Chaturthi Special').trim(),
          title: String(campaign.title || savedCampaign.title || '').trim(),
          subtitle: String(campaign.subtitle || savedCampaign.subtitle || '').trim(),
          discountPercent: Number(campaign.discountPercent ?? savedCampaign.discountPercent ?? 10),
          urgencyLabel: String(campaign.urgencyLabel || savedCampaign.urgencyLabel || '').trim(),
          ctaLabel:
            String(campaign.ctaLabel || savedCampaign.ctaLabel || '').trim() || 'Shop the Celebration',
          ctaTo: String(campaign.ctaTo || savedCampaign.ctaTo || '').trim() || '/shop',
          imageUrl: String(campaign.imageUrl || savedCampaign.imageUrl || '').trim(),
          imageAlt: String(campaign.imageAlt || savedCampaign.imageAlt || '').trim(),
          startAt: campaign.startAtLocal || savedCampaign.startAtLocal,
          endAt: campaign.endAtLocal || savedCampaign.endAtLocal,
        },
      }
      const res = await updateAdminSettings(payload)
      setSettings(res.data)
      setForm(null)
      toast.success(
        campaignEnabled
          ? 'Festival campaign settings saved'
          : 'Normal hero enabled — festival campaign is off',
      )
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

  const hasUnsaved = Boolean(form)
  const status = !campaign.enabled
    ? 'disabled'
    : campaign.status && campaign.status !== 'disabled'
      ? campaign.status
      : 'scheduled'
  const mode = campaign.enabled ? 'campaign' : 'normal'
  const liveHomepageMode = settings?.heroCampaign?.enabled
    ? settings?.heroCampaign?.status === 'active'
      ? 'campaign'
      : 'normal'
    : 'normal'
  const previewTitle = useMemo(
    () =>
      String(campaign.title || '')
        .split('\n')
        .filter(Boolean)
        .join(' · '),
    [campaign.title],
  )

  if (loading && !settings) return <LoadingState label="Loading settings" />
  if (error && !settings) {
    return <ErrorState title="Could not load settings" copy={error} onRetry={handleReload} />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Store"
        title="Settings"
        copy="Operational defaults, support details, and the temporary homepage hero campaign."
        actions={
          <AdminButton variant="ghost" onClick={handleReload}>
            Reload settings
          </AdminButton>
        }
      />

      <form className="admin-panel" style={{ padding: 20, maxWidth: 760 }} onSubmit={save}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Store operations</h2>
        <div className="admin-form-grid">
          <FormField label="Support email" error={errors.supportEmail}>
            <input value={value.supportEmail || ''} onChange={(event) => set('supportEmail', event.target.value)} />
          </FormField>
          <FormField label="Support phone">
            <input value={value.supportPhone || ''} onChange={(event) => set('supportPhone', event.target.value)} />
          </FormField>
          <FormField label="Standard shipping (INR)" error={errors.standardShipping}>
            <input
              type="number"
              min="0"
              value={value.standardShipping ?? ''}
              onChange={(event) => set('standardShipping', event.target.value)}
            />
          </FormField>
          <FormField label="Free shipping from (INR)">
            <input
              type="number"
              min="0"
              value={value.freeShippingFrom ?? ''}
              onChange={(event) => set('freeShippingFrom', event.target.value)}
            />
          </FormField>
          <FormField label="Low-stock alert at" hint="Inventory uses this threshold for the low-stock badge.">
            <input
              type="number"
              min="1"
              value={value.lowStockAlert ?? ''}
              onChange={(event) => set('lowStockAlert', event.target.value)}
            />
          </FormField>
        </div>

        <hr style={{ margin: '28px 0', border: 0, borderTop: '1px solid rgba(0,0,0,0.08)' }} />

        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Hero campaign</h2>
        <p style={{ margin: '0 0 16px', color: 'rgba(0,0,0,0.62)', fontSize: 14, lineHeight: 1.55 }}>
          Schedule a temporary festival homepage hero. When disabled or outside the date window, the existing normal
          hero is shown automatically. Times use Asia/Kolkata.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <AdminButton
            type="button"
            variant={mode === 'normal' ? 'primary' : 'ghost'}
            onClick={() => setHeroMode('normal')}
          >
            Normal Hero
          </AdminButton>
          <AdminButton
            type="button"
            variant={mode === 'campaign' ? 'primary' : 'ghost'}
            onClick={() => setHeroMode('campaign')}
          >
            Festival Campaign
          </AdminButton>
        </div>

        <p
          style={{
            margin: '0 0 10px',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(59,70,50,0.06)',
            fontSize: 13,
          }}
        >
          Selected mode: <strong>{mode === 'campaign' ? 'Festival Campaign' : 'Normal Hero'}</strong>
          {' · '}
          Status: <strong>{status}</strong>
          {STATUS_COPY[status] ? ` — ${STATUS_COPY[status]}` : ''}
        </p>

        <p
          style={{
            margin: '0 0 18px',
            padding: '10px 12px',
            borderRadius: 10,
            background: hasUnsaved ? 'rgba(170,87,51,0.1)' : 'rgba(59,70,50,0.04)',
            color: hasUnsaved ? '#6b3a24' : 'rgba(0,0,0,0.62)',
            fontSize: 13,
          }}
        >
          {hasUnsaved ? (
            <>
              Unsaved change — homepage still shows{' '}
              <strong>{liveHomepageMode === 'campaign' ? 'Festival Campaign' : 'Normal Hero'}</strong>
              . Click <strong>Save settings</strong> to apply.
            </>
          ) : (
            <>
              Homepage currently shows{' '}
              <strong>{liveHomepageMode === 'campaign' ? 'Festival Campaign' : 'Normal Hero'}</strong>.
            </>
          )}
        </p>

        <div className="admin-form-grid">
          <FormField label="Campaign label" error={errors.campaignLabel}>
            <input
              value={campaign.label || ''}
              onChange={(event) => setCampaign('label', event.target.value)}
              placeholder="Ganesh Chaturthi Special"
            />
          </FormField>
          <FormField label="Discount %" error={errors.campaignDiscount} hint="Marketing display only — not applied at checkout.">
            <input
              type="number"
              min="0"
              max="100"
              value={campaign.discountPercent ?? 10}
              onChange={(event) => setCampaign('discountPercent', event.target.value)}
            />
          </FormField>
          <FormField label="Headline" error={errors.campaignTitle} hint="Use a line break for a second title line.">
            <textarea
              rows={3}
              value={campaign.title || ''}
              onChange={(event) => setCampaign('title', event.target.value)}
              placeholder={'Celebrate Ganesh Chaturthi,\nThe Natural Way.'}
            />
          </FormField>
          <FormField label="Supporting copy" error={errors.campaignSubtitle}>
            <textarea
              rows={3}
              value={campaign.subtitle || ''}
              onChange={(event) => setCampaign('subtitle', event.target.value)}
            />
          </FormField>
          <FormField label="Urgency label">
            <input
              value={campaign.urgencyLabel || ''}
              onChange={(event) => setCampaign('urgencyLabel', event.target.value)}
              placeholder="5 Days Only"
            />
          </FormField>
          <FormField label="CTA text" error={errors.campaignCta}>
            <input
              value={campaign.ctaLabel || ''}
              onChange={(event) => setCampaign('ctaLabel', event.target.value)}
            />
          </FormField>
          <FormField label="CTA destination" error={errors.campaignCtaTo}>
            <input
              value={campaign.ctaTo || '/shop'}
              onChange={(event) => setCampaign('ctaTo', event.target.value)}
              placeholder="/shop"
            />
          </FormField>
          <FormField label="Start (Asia/Kolkata)" error={errors.campaignStart}>
            <input
              type="datetime-local"
              value={campaign.startAtLocal || ''}
              onChange={(event) => setCampaign('startAtLocal', event.target.value)}
            />
          </FormField>
          <FormField label="End (Asia/Kolkata)" error={errors.campaignEnd}>
            <input
              type="datetime-local"
              value={campaign.endAtLocal || ''}
              onChange={(event) => setCampaign('endAtLocal', event.target.value)}
            />
          </FormField>
          <FormField label="Hero image URL" hint="Same URL pattern as product images.">
            <input
              value={campaign.imageUrl || ''}
              onChange={(event) => setCampaign('imageUrl', event.target.value)}
              placeholder="https://..."
            />
          </FormField>
          <FormField label="Image alt text">
            <input
              value={campaign.imageAlt || ''}
              onChange={(event) => setCampaign('imageAlt', event.target.value)}
            />
          </FormField>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <AdminButton type="button" variant="ghost" onClick={() => setPreviewCampaign((open) => !open)}>
            {previewCampaign ? 'Hide preview' : 'Preview campaign copy'}
          </AdminButton>
        </div>

        {previewCampaign ? (
          <div
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 14,
              background: '#f7f1e6',
              border: '1px solid rgba(59,70,50,0.12)',
            }}
          >
            <p style={{ margin: 0, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a85a3a' }}>
              {campaign.label || 'Campaign label'}
            </p>
            <p style={{ margin: '10px 0 8px', fontSize: 22, fontFamily: 'Georgia, serif' }}>{previewTitle || 'Headline'}</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{campaign.subtitle || 'Supporting copy'}</p>
            <p style={{ margin: '12px 0 0', fontWeight: 700 }}>
              {Number(campaign.discountPercent) || 0}% OFF · {campaign.urgencyLabel || 'Limited time'}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 13 }}>
              CTA: {campaign.ctaLabel || 'Shop'} → {campaign.ctaTo || '/shop'}
            </p>
          </div>
        ) : null}

        <div className="admin-modal__actions" style={{ marginTop: 24 }}>
          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </AdminButton>
        </div>
      </form>
    </div>
  )
}

export default Settings
