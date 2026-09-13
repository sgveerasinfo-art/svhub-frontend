import { Fragment, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { terms } from '../../data/terms.js'
import './Legal.css'

function Inline({ parts }) {
  return parts.map((part, index) => {
    if (typeof part === 'string') return <Fragment key={index}>{part}</Fragment>
    if (part.to) {
      return (
        <Link key={index} to={part.to}>
          {part.label}
        </Link>
      )
    }
    return (
      <a key={index} href={part.href}>
        {part.label}
      </a>
    )
  })
}

function Blocks({ blocks }) {
  return blocks.map((block, index) => {
    if (typeof block === 'string') {
      return <p key={index}>{block}</p>
    }
    if (block.list) {
      return (
        <ul key={index}>
          {block.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    }
    return (
      <p key={index}>
        <Inline parts={block.parts} />
      </p>
    )
  })
}

function Terms() {
  useEffect(() => {
    document.title = 'Terms & Conditions — SV Hub'
    window.scrollTo(0, 0)
    return () => {
      document.title = 'SV Hub — Pure Native Goodness'
    }
  }, [])

  return (
    <article className="policy policy--numbered">
      <div className="policy__inner">
        <header className="policy__intro">
          <p className="policy__eyebrow">{terms.eyebrow}</p>
          <h1 className="policy__title">{terms.title}</h1>
          <p className="policy__lede">{terms.lede}</p>

          <dl className="policy__dates">
            <div>
              <dt>Effective date</dt>
              <dd>{terms.effectiveDate}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{terms.lastUpdated}</dd>
            </div>
          </dl>
        </header>

        <nav className="policy__toc" aria-label="On this page">
          <p className="policy__toc-label">On this page</p>
          <ol>
            {terms.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span className="policy__toc-num">{section.number}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy__body">
          {terms.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`}>
                <span className="policy__num">{section.number}.</span>
                {section.title}
              </h2>

              {section.blocks ? (
                <div className="policy__block">
                  <Blocks blocks={section.blocks} />
                </div>
              ) : null}

              {section.subsections?.map((sub) => (
                <section key={sub.id} aria-labelledby={sub.id}>
                  <h3 id={sub.id}>
                    <span className="policy__num">{sub.number}</span>
                    {sub.title}
                  </h3>
                  <div className="policy__block">
                    <Blocks blocks={sub.blocks} />
                  </div>
                </section>
              ))}
            </section>
          ))}
        </div>

        <p className="policy__related">
          {terms.related.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </p>
      </div>
    </article>
  )
}

export default Terms
