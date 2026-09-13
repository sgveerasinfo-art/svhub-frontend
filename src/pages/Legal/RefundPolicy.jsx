import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { contact } from '../../data/contact.js'
import { refundPolicy as page } from '../../data/refund.js'
import './Legal.css'

function Fact({ item }) {
  return (
    <article className="policy__fact">
      <p className="policy__fact-status">{item.kicker}</p>
      <h3>{item.title}</h3>
      <p>{item.copy}</p>
    </article>
  )
}

function Facts({ items }) {
  const grid = items.length > 1
  return (
    <div className={`policy__facts${grid ? ' policy__facts--grid' : ''}`}>
      {items.map((item) => (
        <Fact key={item.title} item={item} />
      ))}
    </div>
  )
}

function RefundPolicy() {
  useEffect(() => {
    document.title = 'Refund & Cancellation Policy — SV Hub'
    window.scrollTo(0, 0)
    return () => {
      document.title = 'SV Hub — Pure Native Goodness'
    }
  }, [])

  return (
    <article className="policy policy--facts">
      <div className="policy__inner">
        <header className="policy__intro">
          <p className="policy__eyebrow">{page.eyebrow}</p>
          <h1 className="policy__title">{page.title}</h1>
          <p className="policy__lede">{page.lede}</p>

          <dl className="policy__dates">
            <div>
              <dt>Effective date</dt>
              <dd>{page.effectiveDate}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{page.lastUpdated}</dd>
            </div>
          </dl>
        </header>

        <nav className="policy__toc" aria-label="On this page">
          <p className="policy__toc-label">On this page</p>
          <ol>
            {page.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy__body">
          <section id="cancellation" aria-labelledby="cancellation-heading">
            <h2 id="cancellation-heading">Order cancellation</h2>
            <p>
              You may ask us to cancel an order before it is packed or handed to a courier. Once an order has
              been dispatched, cancellation is usually not possible — contact support and we will advise the
              next step.
            </p>
            <Facts items={page.cancellation} />
          </section>

          <section id="eligibility" aria-labelledby="eligibility-heading">
            <h2 id="eligibility-heading">Refund eligibility</h2>
            <p>
              Refunds may be offered when an order arrives damaged, incorrect, or incomplete, or when we cancel
              an order we cannot fulfil. Food and perishable items are assessed case by case. Contact support
              with your order number and photos where helpful.
            </p>
            <Facts items={page.eligibility} />
          </section>

          <section id="process" aria-labelledby="process-heading">
            <h2 id="process-heading">Refund process</h2>
            <p>
              This section will walk through how a refund request is raised, reviewed and completed. The steps
              below are a layout for that process, not the final procedure.
            </p>
            <ol className="policy__steps">
              {page.steps.map((step) => (
                <li key={step.number}>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="damaged" aria-labelledby="damaged-heading">
            <h2 id="damaged-heading">Damaged products</h2>
            <p>
              This section will explain what to do if a product or parcel arrives damaged, leaking, or otherwise
              not in a condition you can use.
            </p>
            <Facts items={page.damaged} />
          </section>

          <section id="returns" aria-labelledby="returns-heading">
            <h2 id="returns-heading">Return conditions</h2>
            <p>
              This section will describe when a product can be sent back, in what condition, and who arranges
              the return. Until those rules are approved, please do not post items back without hearing from us.
            </p>
            <Facts items={page.returns} />
            <div className="policy__facts">
              <article className="policy__fact">
                <p className="policy__fact-status">Please wait</p>
                <h3>Do not post a return yet</h3>
                <p>
                  Do not ship a return on your own until the approved policy — or a message from SV Hub — tells
                  you how to send it.
                </p>
              </article>
            </div>
          </section>

          <section id="timelines" aria-labelledby="timelines-heading">
            <h2 id="timelines-heading">Refund timelines</h2>
            <p>
              This section will state how long each stage usually takes. No working-day counts are shown here
              yet, so we do not publish figures SV Hub has not approved.
            </p>
            <Facts items={page.timelines} />
          </section>

          <section id="support" aria-labelledby="support-heading">
            <h2 id="support-heading">Customer support</h2>
            <p>
              For help with an order, cancellation or refund, share your order number if you have one.{' '}
              {page.supportNote} Until this policy is approved, we will still listen and help as best we can.
            </p>
            <div className="policy__facts policy__facts--grid">
              <article className="policy__fact">
                <p className="policy__fact-status">Email</p>
                <h3>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </h3>
                <p>Best for a written record of the order.</p>
              </article>
              <article className="policy__fact">
                <p className="policy__fact-status">Phone</p>
                <h3>
                  <a href={`tel:${contact.phoneTel}`}>{contact.phoneDisplay}</a>
                </h3>
                <p>From Coimbatore, during ordinary working hours.</p>
              </article>
              <article className="policy__fact">
                <p className="policy__fact-status">WhatsApp</p>
                <h3>
                  <a href={contact.whatsappUrl} target="_blank" rel="noreferrer">
                    Message us
                  </a>
                </h3>
                <p>Usually the quickest way to reach us.</p>
              </article>
              <article className="policy__fact">
                <p className="policy__fact-status">Orders</p>
                <h3>
                  <Link to="/account/orders">My Orders</Link>
                </h3>
                <p>Find your order number before you write.</p>
              </article>
            </div>
            <p>
              You can also use the <Link to="/contact">Contact</Link> page.
            </p>
          </section>
        </div>

        <p className="policy__related">
          {page.related.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </p>
      </div>
    </article>
  )
}

export default RefundPolicy
