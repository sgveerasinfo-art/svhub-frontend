import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { contact } from '../../data/contact.js'
import { shippingPolicy as page } from '../../data/shipping.js'
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

function ShippingPolicy() {
  useEffect(() => {
    document.title = 'Shipping Policy — SV Hub'
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
          <p className="policy__meta">Last updated: {page.lastUpdated}</p>
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
          <section id="areas" aria-labelledby="areas-heading">
            <h2 id="areas-heading">Shipping areas</h2>
            <p>
              SV Hub sends orders from Coimbatore, Tamil Nadu. Coverage depends on your pincode and the delivery
              partners available at the time you place the order.
            </p>
            <div className="policy__facts policy__facts--grid">
              {page.areas.map((item) => (
                <Fact key={item.title} item={item} />
              ))}
            </div>
            <p>
              Please enter a complete address. If a destination cannot be served, we will say so before payment —
              we will not guess a route after you have paid.
            </p>
          </section>

          <section id="processing" aria-labelledby="processing-heading">
            <h2 id="processing-heading">Order processing</h2>
            <p>
              Food and self-care orders are packed with care, then handed to a courier. Most orders leave
              within a few working days after confirmation.
            </p>
            <ol className="policy__steps">
              {page.steps.map((step) => (
                <li key={step.number}>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
            <p>
              Sundays, public holidays and days the kitchen is closed may add time. We do not start packing an
              unpaid or failed payment.
            </p>
          </section>

          <section id="times" aria-labelledby="times-heading">
            <h2 id="times-heading">Delivery times</h2>
            <p>
              Delivery time starts after the parcel is with the courier, not at the moment you click pay. It
              varies by pincode, weather and the service you choose at checkout.
            </p>
            <div className="policy__facts policy__facts--grid">
              {page.times.map((item) => (
                <Fact key={item.title} item={item} />
              ))}
            </div>
            <p>
              Dates shown in the shop are estimates based on typical courier transit times for your pincode,
              not a guaranteed delivery appointment.
            </p>
          </section>

          <section id="charges" aria-labelledby="charges-heading">
            <h2 id="charges-heading">Shipping charges</h2>
            <p>
              You will always see the shipping amount before you confirm the order. We will not add a hidden
              delivery fee after payment.
            </p>
            <div className="policy__facts policy__facts--grid">
              {page.charges.map((item) => (
                <Fact key={item.title} item={item} />
              ))}
            </div>
          </section>

          <section id="tracking" aria-labelledby="tracking-heading">
            <h2 id="tracking-heading">Tracking</h2>
            <p>
              Every paid order receives an order number on the confirmation page and in{' '}
              <Link to="/account/orders">My Orders</Link>. When a tracking number is available, it will appear
              there.
            </p>
            <div className="policy__facts">
              <article className="policy__fact">
                <p className="policy__fact-status">Where to look</p>
                <h3>Order number first</h3>
                <p>
                  Use your order number if you write to us. If tracking is delayed, that usually means the courier
                  has not scanned the parcel yet — not that it has gone missing.
                </p>
              </article>
            </div>
          </section>

          <section id="delays" aria-labelledby="delays-heading">
            <h2 id="delays-heading">Delays</h2>
            <p>Parcels can run late for reasons outside our kitchen, including:</p>
            <ul>
              <li>Heavy rain, flooding or other weather</li>
              <li>Festival or peak-season courier load</li>
              <li>Incorrect or incomplete address details</li>
              <li>Local restrictions or a missed delivery attempt</li>
            </ul>
            <p>
              If we know an order will be significantly late, we will try to reach you on the phone, email or
              WhatsApp on your account. Please keep your contact details current in{' '}
              <Link to="/account/profile">Profile</Link>.
            </p>
            <p>
              If a parcel is lost or badly delayed, we will resolve it under our{' '}
              <Link to="/refund-policy">Refund Policy</Link>.
            </p>
          </section>

          <section id="support" aria-labelledby="support-heading">
            <h2 id="support-heading">Customer support</h2>
            <p>
              For a shipping question, share your order number. {contact.replyNote} If something is urgent, WhatsApp
              is usually the fastest.
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
                <p>Usually the quickest way to reach the kitchen.</p>
              </article>
              <article className="policy__fact">
                <p className="policy__fact-status">From</p>
                <h3>SV Hub</h3>
                <p>{contact.city}</p>
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

export default ShippingPolicy
