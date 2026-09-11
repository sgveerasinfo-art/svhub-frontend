import { ORDER_TIMELINE, timelineIndex } from '../../data/account.js'
import { useInView } from '../../hooks/useInView.js'
import './OrderTimeline.css'

const STEP_LABEL = {
  Pending: 'Ordered',
  Confirmed: 'Confirmed',
  Processing: 'Processing',
  Shipped: 'Shipped',
  'Out for Delivery': 'Out for Delivery',
  Delivered: 'Delivered',
}

const LAST = Math.max(ORDER_TIMELINE.length - 1, 1)
const LIVE = new Set(['Processing', 'Shipped', 'Out for Delivery'])

function CheckIcon() {
  return (
    <svg className="ot-rail__check" width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.2 6.6 11.2 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function displayLabel(status) {
  return STEP_LABEL[status] || status
}

function statusSummary(status, current, cancelled) {
  if (cancelled) return 'Order status: Cancelled. This order will not move further.'
  const now = displayLabel(status)
  const done = ORDER_TIMELINE.slice(0, current).map((step) => displayLabel(step).toLowerCase())
  if (!done.length) return `Order status: ${now}.`
  const list =
    done.length === 1 ? done[0] : `${done.slice(0, -1).join(', ')} and ${done[done.length - 1]}`
  return `Order status: ${now}. ${list.charAt(0).toUpperCase()}${list.slice(1)} completed.`
}

function stampFor(stamps, step) {
  if (!stamps || typeof stamps !== 'object') return ''
  return String(stamps[step] || stamps[step?.toLowerCase()] || '').trim()
}

export default function OrderTimeline({ status, stamps, cancellationReason }) {
  const current = timelineIndex(status)
  const cancelled = status === 'Cancelled'
  const progress = cancelled ? 0 : Math.max(0, Math.min(1, current / LAST))
  const live = !cancelled && LIVE.has(status)
  const nowLabel = cancelled ? 'Cancelled' : displayLabel(status)
  const { ref, visible } = useInView({ threshold: 0.28, rootMargin: '0px 0px -10% 0px' })

  return (
    <section
      ref={ref}
      className={`ot${visible ? ' is-revealed' : ''}${live ? ' is-live' : ''}${cancelled ? ' is-cancelled' : ''}`}
      aria-labelledby="ot-heading"
      style={{ '--ot-progress': String(progress), '--ot-steps': String(ORDER_TIMELINE.length) }}
    >
      <div className="ot__head">
        <h2 id="ot-heading" className="ot__kicker">
          Order journey
        </h2>
        <p className="ot__now">
          <span className="ot__now-kicker">Current status</span>
          <span className="ot__now-value">
            <span className="ot__now-dot" aria-hidden="true" />
            {nowLabel}
          </span>
        </p>
      </div>

      {cancelled ? (
        <p className="ot__note">
          This order was cancelled and will not move further.
          {cancellationReason ? ` (${cancellationReason})` : ''}
        </p>
      ) : null}

      <p className="ot__sr">{statusSummary(status, current, cancelled)}</p>

      <div className="ot-rail" aria-hidden="true">
        <span className="ot-rail__bg" aria-hidden="true" />
        <span className="ot-rail__fill" aria-hidden="true" />
        <ol className="ot-rail__steps">
          {ORDER_TIMELINE.map((step, index) => {
            const done = !cancelled && index < current
            const active = !cancelled && index === current
            const state = cancelled ? 'future' : active ? 'current' : done ? 'done' : 'future'
            const stamp = stampFor(stamps, step)
            return (
              <li
                key={step}
                className={`ot-rail__step is-${state}`}
                style={{ '--ot-i': index }}
                aria-current={active ? 'step' : undefined}
              >
                <span className="ot-rail__mark">
                  {active ? <span className="ot-rail__halo" /> : null}
                  {active ? <span className="ot-rail__ring" /> : null}
                  <span className="ot-rail__dot">{done ? <CheckIcon /> : null}</span>
                </span>
                <span className="ot-rail__copy">
                  <span className="ot-rail__label">{displayLabel(step)}</span>
                  {stamp ? <span className="ot-rail__stamp">{stamp}</span> : null}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
