/* Bespoke SV Hub System State Illustrations
   Artisanal, minimal line and wash graphics reflecting pure native botanical craft.
   NO generic corporate blue vector characters.
*/

export function JarIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soft background glow */}
      <circle cx="60" cy="64" r="44" fill="rgba(110, 140, 40, 0.07)" />
      {/* Wandering dashed footprint path */}
      <path
        d="M20 92C32 92 34 82 46 80C56 78 62 88 74 86C84 84 88 74 100 72"
        stroke="rgba(170, 87, 51, 0.45)"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      {/* Stoneware Heritage Jar */}
      <path
        d="M44 42H76M48 42V36C48 34.8954 48.8954 34 50 34H70C71.1046 34 72 34.8954 72 36V42M44 42C40 46 36 54 36 68C36 82 44 92 60 92C76 92 84 82 84 68C84 54 80 46 76 42"
        stroke="#3B4632"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Jar lid ring */}
      <rect x="42" y="40" width="36" height="4" rx="2" fill="#6E8C28" stroke="#3B4632" strokeWidth="1.5" />
      {/* Handcrafted label with sprig */}
      <rect x="46" y="56" width="28" height="22" rx="4" fill="#FAF7F2" stroke="rgba(59, 70, 50, 0.25)" strokeWidth="1.5" />
      <path
        d="M60 72V62M60 62C58 64 54 64 54 62C54 60 58 60 60 62ZM60 66C62 68 66 68 66 66C66 64 62 64 60 66Z"
        stroke="#6E8C28"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Drifting Leaf accent */}
      <path
        d="M86 38C94 36 96 44 92 48C88 52 82 48 86 38Z"
        fill="rgba(110, 140, 40, 0.2)"
        stroke="#6E8C28"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M86 44C89 42 91 41 93 41" stroke="#6E8C28" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function MortarIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="62" r="44" fill="rgba(170, 87, 51, 0.08)" />
      {/* Simmering aroma lines */}
      <path
        d="M50 24C48 29 52 33 50 37M60 20C58 26 62 30 60 36M70 24C68 29 72 33 70 37"
        stroke="#AA5733"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Traditional Mortar base */}
      <path
        d="M32 54C32 54 34 88 60 88C86 88 88 54 88 54H32Z"
        fill="#FAF7F2"
        stroke="#3B4632"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M46 88L42 94H78L74 88" stroke="#3B4632" strokeWidth="2" strokeLinejoin="round" />
      {/* Rim line */}
      <ellipse cx="60" cy="54" rx="28" ry="6" fill="#F6F6F6" stroke="#3B4632" strokeWidth="2.5" />
      {/* Pestle tilted */}
      <path
        d="M68 38L78 60C78 60 76 64 72 64C68 64 66 60 66 60L56 38C56 38 60 36 62 36C64 36 68 38 68 38Z"
        fill="#532F1A"
        stroke="#3B4632"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Herb leaf sprig beside */}
      <path
        d="M26 68C22 72 26 78 30 76C34 74 34 68 26 68Z"
        fill="rgba(110, 140, 40, 0.25)"
        stroke="#6E8C28"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function SignalIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="44" fill="rgba(86, 112, 29, 0.08)" />
      {/* Outward signal arches */}
      <path
        d="M30 40C46 26 74 26 90 40"
        stroke="#3B4632"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M40 52C51 43 69 43 80 52"
        stroke="#6E8C28"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M50 64C56 59 64 59 70 64"
        stroke="#AA5733"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Central botanical hearth node */}
      <circle cx="60" cy="78" r="8" fill="#3B4632" />
      <path
        d="M60 74C60 70 64 68 66 70C68 72 66 76 60 74Z"
        fill="#6E8C28"
      />
      {/* Small disconnected pulse dot */}
      <circle cx="60" cy="78" r="3" fill="#F6F6F6" />
    </svg>
  )
}

export function BasketIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="62" r="44" fill="rgba(110, 140, 40, 0.08)" />
      {/* Basket handle */}
      <path
        d="M42 56C42 38 78 38 78 56"
        stroke="#532F1A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Woven basket body */}
      <path
        d="M34 56L40 90C41 94 45 96 49 96H71C75 96 79 94 80 90L86 56H34Z"
        fill="#FAF7F2"
        stroke="#3B4632"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Weave pattern lines */}
      <path
        d="M37 68H83M39 80H81M52 56V96M68 56V96"
        stroke="rgba(83, 47, 26, 0.25)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Fresh sprout resting in basket */}
      <path
        d="M58 56C58 48 68 46 72 50C76 54 68 62 58 56Z"
        fill="#6E8C28"
        stroke="#56701D"
        strokeWidth="1.5"
      />
      <path d="M60 56C64 52 68 50 71 50" stroke="#FAF7F2" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function SearchSprigIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="58" cy="58" r="44" fill="rgba(110, 140, 40, 0.08)" />
      {/* Apothecary magnifying glass */}
      <circle cx="54" cy="52" r="24" stroke="#3B4632" strokeWidth="3" fill="#FAF7F2" />
      <circle cx="54" cy="52" r="19" stroke="rgba(110, 140, 40, 0.2)" strokeWidth="1.5" />
      <path d="M72 70L94 92" stroke="#532F1A" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 68L74 72" stroke="#3B4632" strokeWidth="3" strokeLinecap="round" />
      {/* Botanical specimen leaf under inspection */}
      <path
        d="M54 42C48 44 48 52 54 56C60 60 62 50 54 42Z"
        fill="rgba(110, 140, 40, 0.3)"
        stroke="#6E8C28"
        strokeWidth="1.8"
      />
      <path d="M51 49C54 49 57 51 58 53" stroke="#6E8C28" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function ParcelIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="62" r="44" fill="rgba(59, 70, 50, 0.06)" />
      {/* Tied Parcel */}
      <rect x="34" y="44" width="52" height="46" rx="6" fill="#FAF7F2" stroke="#3B4632" strokeWidth="2.5" />
      {/* Jute string ties */}
      <path d="M60 44V90M34 66H86" stroke="#AA5733" strokeWidth="2" strokeLinecap="round" />
      {/* Natural beeswax seal */}
      <circle cx="60" cy="66" r="8" fill="#6E8C28" stroke="#56701D" strokeWidth="1.5" />
      <path d="M58 66C58 64 62 64 62 66C62 68 58 68 58 66Z" fill="#FAF7F2" />
      {/* Stamp leaf mark on top right */}
      <rect x="68" y="50" width="12" height="10" rx="2" fill="rgba(170, 87, 51, 0.12)" stroke="#AA5733" strokeWidth="1" />
      <path d="M74 53V57" stroke="#AA5733" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export function BatchIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="44" fill="rgba(170, 87, 51, 0.08)" />
      {/* Mindful batch hourglass */}
      <path
        d="M44 36H76M44 84H76M48 36L60 58L72 36M48 84L60 62L72 84"
        stroke="#3B4632"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Harvest grain resting in bottom */}
      <path d="M52 82C52 74 68 74 68 82H52Z" fill="#AA5733" />
      {/* Single falling native seed */}
      <circle cx="60" cy="68" r="2.5" fill="#AA5733" />
      {/* Restocking botanical sprig */}
      <path
        d="M74 54C80 50 84 56 80 60C76 64 72 60 74 54Z"
        fill="rgba(110, 140, 40, 0.3)"
        stroke="#6E8C28"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function BrandLeafLoader({ size = 56, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sys-leaf-spinner ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Subtle outer track */}
      <circle cx="28" cy="28" r="22" stroke="rgba(59, 70, 50, 0.12)" strokeWidth="3" />
      {/* Animated spinning arc */}
      <circle
        cx="28"
        cy="28"
        r="22"
        stroke="#6E8C28"
        strokeWidth="3"
        strokeDasharray="36 100"
        strokeLinecap="round"
      />
      {/* Dual sprout leaf logo */}
      <path
        d="M28 20C24 23 23 27 26 30C29 33 34 32 35 28C36 24 32 17 28 20Z"
        fill="#56701D"
      />
      <path
        d="M28 35C30 33 33 31 34 27"
        stroke="#6E8C28"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LockSealIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="62" r="44" fill="rgba(83, 47, 26, 0.07)" />
      {/* Shackle */}
      <path
        d="M46 54V44C46 36.268 52.268 30 60 30C67.732 30 74 36.268 74 44V54"
        stroke="#532F1A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Lock body formatted as heritage stoneware lock */}
      <rect x="38" y="52" width="44" height="38" rx="8" fill="#FAF7F2" stroke="#3B4632" strokeWidth="2.5" />
      {/* Keyhole with sprout silhouette */}
      <circle cx="60" cy="68" r="4" fill="#3B4632" />
      <path d="M58 70H62L63 78H57L58 70Z" fill="#3B4632" />
      {/* Leaf seal ornament */}
      <path
        d="M72 76C78 74 80 80 76 84C72 88 68 84 72 76Z"
        fill="rgba(110, 140, 40, 0.25)"
        stroke="#6E8C28"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function PaymentAlertIllustration({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="62" r="44" fill="rgba(170, 87, 51, 0.09)" />
      {/* Payment card shape */}
      <rect x="32" y="42" width="56" height="40" rx="6" fill="#FAF7F2" stroke="#3B4632" strokeWidth="2.5" />
      <path d="M32 52H88" stroke="#3B4632" strokeWidth="2" />
      <rect x="38" y="66" width="16" height="6" rx="2" fill="#AA5733" />
      {/* Terracotta alert badge */}
      <circle cx="82" cy="72" r="14" fill="#AA5733" stroke="#FAF7F2" strokeWidth="2.5" />
      <path d="M82 66V72M82 76V77" stroke="#FAF7F2" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
