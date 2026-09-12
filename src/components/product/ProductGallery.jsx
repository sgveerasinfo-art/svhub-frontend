import { useRef, useState } from 'react'
import './ProductGallery.css'

function ProductGallery({ images, name, discount, accent }) {
  const [active, setActive] = useState(0)
  const startX = useRef(null)
  const current = images[active] ?? images[0]

  function go(index) {
    if (!images.length) return
    const next = (index + images.length) % images.length
    setActive(next)
  }

  function onKey(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(active + 1)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(active - 1)
    }
  }

  function onPointerDown(event) {
    startX.current = event.clientX
  }

  function onPointerUp(event) {
    if (startX.current == null) return
    const delta = event.clientX - startX.current
    startX.current = null
    if (delta > 48) go(active - 1)
    if (delta < -48) go(active + 1)
  }

  if (!current) return null

  const multi = images.length > 1

  return (
    <div
      className={`pdp-gallery${multi ? '' : ' pdp-gallery--single'}`}
      style={{ '--gallery-accent': accent }}
    >
      <div
        className="pdp-gallery__stage"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} photographs`}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <img
          key={current.src}
          src={current.src}
          alt={current.alt || name}
          draggable="false"
        />
        {discount ? (
          <p className="pdp-gallery__badge">
            <span>{discount}% off</span>
          </p>
        ) : null}

        {multi ? (
          <div className="pdp-gallery__dots" aria-hidden="true">
            {images.map((image, index) => (
              <span key={`${image.src}-dot`} className={index === active ? 'is-active' : undefined} />
            ))}
          </div>
        ) : null}

        {multi ? (
          <>
            <button
              type="button"
              className="pdp-gallery__nav pdp-gallery__nav--prev"
              onClick={() => go(active - 1)}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="pdp-gallery__nav pdp-gallery__nav--next"
              onClick={() => go(active + 1)}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {multi ? (
        <ul className="pdp-gallery__thumbs" aria-label="Product photographs">
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`}>
              <button
                type="button"
                className={`pdp-gallery__thumb${index === active ? ' is-active' : ''}`}
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-current={index === active ? 'true' : undefined}
              >
                <img src={image.src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default ProductGallery
