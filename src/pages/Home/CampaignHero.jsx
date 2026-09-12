import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { images } from '../../data/images.js'
import './CampaignHero.css'

function splitTitle(title = '') {
  return String(title)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function formatRemaining(ms) {
  const safe = Math.max(0, ms)
  const totalSeconds = Math.floor(safe / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function pad2(value) {
  return String(Math.max(0, value)).padStart(2, '0')
}

function resolveArtSrc(imageUrl) {
  const url = String(imageUrl || '').trim()
  if (
    !url ||
    url.includes('ganesh-courtyard-hero') ||
    url.includes('photo-1567593810070-7a3d471af022') ||
    url.includes('ganesh-chaturthi-art')
  ) {
    return images.ganeshArt
  }
  if (url.startsWith('/')) return url
  return url
}

function AccentUnderline({ children }) {
  return (
    <span className="campaign-hero__title-mark">
      {children}
      <svg viewBox="0 0 220 16" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M4 10.2c18.5-5.4 36.2 3.6 54.8 1.1 21.4-2.9 40.6-8.2 62.4-4.4 17.2 3 33.4 7.1 51.2 3.2 13.8-3 18-5.6 21.8-2.7"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function LabelMotif() {
  return (
    <svg className="campaign-hero__motif-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <path
        d="M12 2.8c.5 2.2 2 3.8 4.2 4.2-2.2.5-3.7 2-4.2 4.2-.5-2.2-2-3.7-4.2-4.2 2.2-.4 3.7-2 4.2-4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="0.55" opacity="0.28" />
    </svg>
  )
}

function LotusWatermark() {
  return (
    <svg className="campaign-hero__lotus-mark" viewBox="0 0 220 220" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="110" cy="110" r="86" opacity="0.45" />
        <circle cx="110" cy="110" r="62" opacity="0.35" />
        <circle cx="110" cy="110" r="28" opacity="0.4" />
        <path d="M110 34c14 22 14 48 0 70-14-22-14-48 0-70Z" opacity="0.55" />
        <path d="M110 116c14 22 14 48 0 70-14-22-14-48 0-70Z" opacity="0.55" />
        <path d="M34 110c22-14 48-14 70 0-22 14-48 14-70 0Z" opacity="0.55" />
        <path d="M116 110c22-14 48-14 70 0-22 14-48 14-70 0Z" opacity="0.55" />
        <path d="M58 58c24 8 42 26 50 50-24-8-42-26-50-50Z" opacity="0.4" />
        <path d="M162 58c-24 8-42 26-50 50 24-8 42-26 50-50Z" opacity="0.4" />
        <path d="M58 162c24-8 42-26 50-50-24 8-42 26-50 50Z" opacity="0.4" />
        <path d="M162 162c-24-8-42-26-50-50 24 8 42 26 50 50Z" opacity="0.4" />
        <path d="M110 78c8 10 8 22 0 32-8-10-8-22 0-32Z" opacity="0.7" />
        <path d="M88 104c12-4 24-2 34 6-12 4-24 2-34-6Z" opacity="0.55" />
        <path d="M132 104c-12-4-24-2-34 6 12 4 24 2 34-6Z" opacity="0.55" />
      </g>
    </svg>
  )
}

function SacredAura() {
  return (
    <svg className="campaign-hero__sacred" viewBox="0 0 520 520" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="260" cy="260" r="248" strokeWidth="0.8" opacity="0.35" />
        <circle cx="260" cy="260" r="214" strokeWidth="0.7" opacity="0.28" strokeDasharray="2 10" />
        <circle cx="260" cy="260" r="178" strokeWidth="0.9" opacity="0.32" />
        <circle cx="260" cy="260" r="142" strokeWidth="0.7" opacity="0.24" />
        <path
          d="M260 52c28 42 28 92 0 134-28-42-28-92 0-134Z"
          strokeWidth="0.9"
          opacity="0.22"
        />
        <path
          d="M260 334c28 42 28 92 0 134-28-42-28-92 0-134Z"
          strokeWidth="0.9"
          opacity="0.22"
        />
        <path
          d="M52 260c42-28 92-28 134 0-42 28-92 28-134 0Z"
          strokeWidth="0.9"
          opacity="0.22"
        />
        <path
          d="M334 260c42-28 92-28 134 0-42 28-92 28-134 0Z"
          strokeWidth="0.9"
          opacity="0.22"
        />
      </g>
    </svg>
  )
}

function CampaignHero({ campaign, serverNow, onExpired }) {
  const endAtMs = useMemo(() => {
    const end = Date.parse(campaign?.endAt || '')
    return Number.isFinite(end) ? end : 0
  }, [campaign?.endAt])

  const skewMs = useMemo(() => {
    const server = Date.parse(serverNow || '')
    if (!Number.isFinite(server)) return 0
    return server - Date.now()
  }, [serverNow])

  const [nowMs, setNowMs] = useState(() => Date.now() + skewMs)

  useEffect(() => {
    setNowMs(Date.now() + skewMs)
    const id = window.setInterval(() => setNowMs(Date.now() + skewMs), 1000)
    return () => window.clearInterval(id)
  }, [skewMs])

  useEffect(() => {
    if (!endAtMs) return undefined
    const remaining = endAtMs - (Date.now() + skewMs)
    if (remaining <= 0) {
      onExpired?.()
      return undefined
    }
    const id = window.setTimeout(() => onExpired?.(), remaining + 50)
    return () => window.clearTimeout(id)
  }, [endAtMs, skewMs, onExpired])

  const remaining = formatRemaining(endAtMs - nowMs)
  const titleLines = splitTitle(campaign?.title)
  const accentLine = titleLines.length > 1 ? titleLines[titleLines.length - 1] : ''
  // Keep primary as one readable line so mobile never stacks title into a cramped tower.
  const primaryLines = accentLine
    ? [titleLines.slice(0, -1).join(' ').replace(/\s+,/g, ',')]
    : titleLines
  const discount = Number(campaign?.discountPercent) || 0
  const ctaTo = campaign?.ctaTo || '/shop'
  const ctaLabel = campaign?.ctaLabel || 'Shop the Celebration'
  const label = String(campaign?.label || 'Ganesh Chaturthi Special')
    .replace(/\s*[•·].*$/, '')
    .trim()
  const artSrc = resolveArtSrc(campaign?.imageUrl)
  const hasTime = endAtMs > nowMs

  const timerUnits = [
    { key: 'days', value: remaining.days, label: 'Days' },
    { key: 'hours', value: remaining.hours, label: 'Hrs' },
    { key: 'minutes', value: remaining.minutes, label: 'Min' },
    { key: 'seconds', value: remaining.seconds, label: 'Sec' },
  ]

  return (
    <section className="campaign-hero" aria-labelledby="campaign-hero-heading">
      <div className="campaign-hero__atmosphere" aria-hidden="true">
        <span className="campaign-hero__paper" />
        <span className="campaign-hero__wash campaign-hero__wash--left" />
        <span className="campaign-hero__wash campaign-hero__wash--right" />
        <span className="campaign-hero__wash campaign-hero__wash--bottom" />
        <span className="campaign-hero__veil" />
        <span className="campaign-hero__geometry campaign-hero__geometry--mandala" />
        <span className="campaign-hero__geometry campaign-hero__geometry--arc" />
        <span className="campaign-hero__ray" />
        <span className="campaign-hero__petal campaign-hero__petal--1" />
        <span className="campaign-hero__petal campaign-hero__petal--2" />
        <span className="campaign-hero__petal campaign-hero__petal--3" />
        <span className="campaign-hero__petal campaign-hero__petal--4" />
        <span className="campaign-hero__spark campaign-hero__spark--1" />
        <span className="campaign-hero__spark campaign-hero__spark--2" />
        <span className="campaign-hero__spark campaign-hero__spark--3" />
        <span className="campaign-hero__spark campaign-hero__spark--4" />
      </div>

      <div className="campaign-hero__stage">
        <div className="campaign-hero__copy">
          <LotusWatermark />

          <p className="campaign-hero__label">
            <LabelMotif />
            {label}
          </p>

          <h1 id="campaign-hero-heading" className="campaign-hero__title">
            {primaryLines.map((line) => (
              <span key={line} className="campaign-hero__title-line">
                {line}
              </span>
            ))}
            {accentLine ? (
              <span className="campaign-hero__title-line campaign-hero__title-line--accent">
                <AccentUnderline>{accentLine}</AccentUnderline>
              </span>
            ) : null}
          </h1>

          <p className="campaign-hero__lede">
            {campaign?.subtitle ||
              'Celebrate the festival with goodness rooted in tradition and nature.'}
          </p>

          <div className="campaign-hero__commerce">
            <div className="campaign-hero__privilege">
              <div className="campaign-hero__lockup" aria-label={`${discount} percent off storewide`}>
                <span className="campaign-hero__percent">
                  <span className="campaign-hero__percent-value">{discount}%</span>
                  <svg
                    className="campaign-hero__percent-flourish"
                    viewBox="0 0 88 10"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M2 6.2c10.5-3.8 21.2 2.4 31.6.6 12.2-2.1 23.4-5.6 35.6-2.8 7.8 1.8 13.4 3.6 16.8 1.4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="campaign-hero__off-stack">
                  <strong>Off</strong>
                  <em>Storewide</em>
                </span>
              </div>

              <p className="campaign-hero__urgency">
                <svg
                  className="campaign-hero__urgency-mark"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                  <path
                    d="M8 2.6c.35 1.5 1.35 2.55 2.85 2.9-1.5.35-2.5 1.4-2.85 2.9-.35-1.5-1.35-2.55-2.85-2.9 1.5-.35 2.5-1.4 2.85-2.9Z"
                    stroke="currentColor"
                    strokeWidth="0.9"
                    strokeLinejoin="round"
                  />
                </svg>
                {campaign?.urgencyLabel || '5 Days Only'}
              </p>
            </div>

            {hasTime ? (
              <div
                className="campaign-hero__timer"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Ends in ${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds`}
              >
                <div className="campaign-hero__timer-head">
                  <span className="campaign-hero__timer-ornament" aria-hidden="true" />
                  <p className="campaign-hero__timer-label">Ends in</p>
                  <span className="campaign-hero__timer-ornament" aria-hidden="true" />
                </div>
                <div className="campaign-hero__timer-track" role="timer">
                  {timerUnits.map((unit, index) => (
                    <div key={unit.key} className="campaign-hero__timer-cell">
                      {index > 0 ? (
                        <span className="campaign-hero__timer-sep" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      <div className="campaign-hero__timer-unit">
                        <span className="campaign-hero__timer-value">{pad2(unit.value)}</span>
                        <span className="campaign-hero__timer-unit-label">{unit.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Link to={ctaTo} className="campaign-hero__cta">
            <span>{ctaLabel}</span>
            <span className="campaign-hero__cta-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="campaign-hero__art">
          <div className="campaign-hero__glow" aria-hidden="true" />
          <div className="campaign-hero__aura" aria-hidden="true" />
          <SacredAura />
          <div className="campaign-hero__rangoli" aria-hidden="true" />
          <img
            className="campaign-hero__figure"
            src={artSrc}
            alt={
              campaign?.imageAlt ||
              'Traditional watercolor illustration of Lord Ganesh with marigold tones and botanical leaves'
            }
            loading="eager"
            decoding="async"
          />
          <span className="campaign-hero__diya" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

export default CampaignHero
