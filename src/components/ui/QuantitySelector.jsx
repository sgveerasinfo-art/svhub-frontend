import './QuantitySelector.css'

function QuantitySelector({
  id = 'quantity',
  value,
  onChange,
  onAdjust,
  min = 1,
  max = 12,
  disabled = false,
}) {
  const atMin = value <= min
  const atMax = value >= max

  function setAbsolute(next) {
    const clamped = Math.min(max, Math.max(min, next))
    onChange(clamped)
  }

  function bump(delta) {
    if (typeof onAdjust === 'function') {
      onAdjust(delta)
      return
    }
    setAbsolute(value + delta)
  }

  return (
    <div className="qty">
      <label className="qty__label" htmlFor={id}>
        Quantity
      </label>
      <div className={`qty__control${disabled ? ' is-disabled' : ''}`}>
        <button
          type="button"
          className="qty__btn"
          onClick={() => bump(-1)}
          disabled={disabled || atMin}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          id={id}
          className="qty__value"
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          aria-live="polite"
          onChange={(event) => {
            const next = Number.parseInt(event.target.value.replace(/\D/g, ''), 10)
            if (Number.isNaN(next)) {
              onChange(min)
              return
            }
            setAbsolute(next)
          }}
        />
        <button
          type="button"
          className="qty__btn"
          onClick={() => bump(1)}
          disabled={disabled || atMax}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default QuantitySelector
