import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import './Legal.css'

const SECTIONS = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'information-we-collect', label: 'Information we collect' },
  { id: 'how-we-use-information', label: 'How we use information' },
  { id: 'sharing', label: 'When we share information' },
  { id: 'payments', label: 'Payments' },
  { id: 'cookies', label: 'Cookies and similar tools' },
  { id: 'retention', label: 'How long we keep information' },
  { id: 'your-choices', label: 'Your choices' },
  { id: 'security', label: 'Security' },
  { id: 'children', label: 'Children' },
  { id: 'updates', label: 'Updates to this page' },
  { id: 'contact', label: 'How to reach us' },
]

function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <article className="policy">
      <div className="policy__inner">
        <header className="policy__intro">
          <p className="policy__eyebrow">Policies</p>
          <h1 className="policy__title">Privacy Policy</h1>
          <p className="policy__lede">
            How SV Hub looks after the information you share with us — simply, and with care.
          </p>
          <p className="policy__meta">Last updated: August 2026</p>
        </header>

        <nav className="policy__toc" aria-label="On this page">
          <p className="policy__toc-label">On this page</p>
          <ol>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy__body">
          <section id="who-we-are" aria-labelledby="who-we-are-heading">
            <h2 id="who-we-are-heading">Who we are</h2>
            <p>
              SV Hub (Sadhguru Veera’s) is an organic food and natural self-care brand based in Coimbatore,
              Tamil Nadu. This page explains, in plain language, how we handle personal information when you
              visit our website, create an account, or place an order.
            </p>
          </section>

          <section id="information-we-collect" aria-labelledby="information-we-collect-heading">
            <h2 id="information-we-collect-heading">Information we collect</h2>
            <p>Depending on how you use SV Hub, we may collect:</p>
            <ul>
              <li>Account details such as name, email address and mobile number</li>
              <li>Delivery addresses you choose to save</li>
              <li>Order history and order-related communication</li>
              <li>Sign-in information if you use email and password or Google Sign-In</li>
              <li>Messages you send us through forms, email or WhatsApp</li>
              <li>Basic technical information such as device type and pages visited</li>
            </ul>
            <p>
              We do not ask for information we do not need in order to run the shop, fulfil orders or support
              your account.
            </p>
          </section>

          <section id="how-we-use-information" aria-labelledby="how-we-use-information-heading">
            <h2 id="how-we-use-information-heading">How we use information</h2>
            <p>We expect to use personal information to:</p>
            <ul>
              <li>Create and look after your account</li>
              <li>Take, confirm and deliver orders</li>
              <li>Share updates about an order you have placed</li>
              <li>Respond when you write to us</li>
              <li>Keep the website secure and in good working order</li>
              <li>Meet legal or accounting requirements that apply to us</li>
            </ul>
            <p>
              We will not use your information to make medical or health claims, and we will not sell your
              personal details.
            </p>
          </section>

          <section id="sharing" aria-labelledby="sharing-heading">
            <h2 id="sharing-heading">When we share information</h2>
            <p>
              We may share only what is needed with trusted partners who help us operate — for example payment
              processing, delivery, or sign-in services. Those partners should use the information only to
              provide their service to SV Hub.
            </p>
            <p>
              We may also share information if the law requires it, or to protect SV Hub, our customers or
              others from harm.
            </p>
          </section>

          <section id="payments" aria-labelledby="payments-heading">
            <h2 id="payments-heading">Payments</h2>
            <p>
              Card and UPI payments are processed by our payment partner. SV Hub does not store full card
              numbers on this website.
            </p>
          </section>

          <section id="cookies" aria-labelledby="cookies-heading">
            <h2 id="cookies-heading">Cookies and similar tools</h2>
            <p>
              The site may use cookies or local storage to keep you signed in, remember your cart and
              understand how the shop is used. You can control cookies in your browser. Turning some of them
              off may affect sign-in or checkout.
            </p>
          </section>

          <section id="retention" aria-labelledby="retention-heading">
            <h2 id="retention-heading">How long we keep information</h2>
            <p>
              We keep account and order information only for as long as it is needed to fulfil orders, provide
              support, and meet record-keeping duties.
            </p>
          </section>

          <section id="your-choices" aria-labelledby="your-choices-heading">
            <h2 id="your-choices-heading">Your choices</h2>
            <p>You should be able to:</p>
            <ul>
              <li>Review and update your name, email, phone and addresses in My Account</li>
              <li>Ask us what information we hold about you</li>
              <li>Ask us to correct or delete information, where the law allows</li>
              <li>Close your account by writing to us</li>
            </ul>
            <p>
              Some order records may need to be kept even after an account is closed, where the law requires
              it.
            </p>
          </section>

          <section id="security" aria-labelledby="security-heading">
            <h2 id="security-heading">Security</h2>
            <p>
              We use reasonable technical and organisational measures to protect personal information. No
              website can promise complete security, and you should keep your password private.
            </p>
          </section>

          <section id="children" aria-labelledby="children-heading">
            <h2 id="children-heading">Children</h2>
            <p>
              SV Hub is intended for adults. We do not knowingly collect personal information from children. If
              you believe a child has given us information, please write to us and we will look into it.
            </p>
          </section>

          <section id="updates" aria-labelledby="updates-heading">
            <h2 id="updates-heading">Updates to this page</h2>
            <p>
              If we make important changes to this page, we will update the date above and, where appropriate,
              let account holders know.
            </p>
          </section>

          <section id="contact" aria-labelledby="contact-heading">
            <h2 id="contact-heading">How to reach us</h2>
            <p>
              For privacy questions, write to{' '}
              <a href="mailto:sgveeras.info@gmail.com">sgveeras.info@gmail.com</a> or use our{' '}
              <Link to="/contact">Contact</Link> page.
            </p>
            <p>SV Hub · Coimbatore, Tamil Nadu</p>
          </section>
        </div>

        <p className="policy__related">
          <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/refund-policy">Refund Policy</Link>
        </p>
      </div>
    </article>
  )
}

export default PrivacyPolicy
