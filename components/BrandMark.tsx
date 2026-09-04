'use client'

/**
 * Cowrywise FC roundel — a pitch seen from above: centre circle, halfway line,
 * penalty boxes. Reads as a crest at 24px and as a logo at 96px.
 */
export default function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Cowrywise FC"
    >
      <rect width="48" height="48" rx="13" fill="#0B111D" />
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="12.25"
        stroke="#AEF35F"
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />
      {/* Pitch outline */}
      <rect
        x="9"
        y="12"
        width="30"
        height="24"
        rx="2.5"
        stroke="#AEF35F"
        strokeOpacity="0.55"
        strokeWidth="1.6"
      />
      {/* Halfway line */}
      <path d="M24 12v24" stroke="#AEF35F" strokeOpacity="0.55" strokeWidth="1.6" />
      {/* Centre circle */}
      <circle cx="24" cy="24" r="5.5" stroke="#AEF35F" strokeWidth="2" />
      <circle cx="24" cy="24" r="2" fill="#AEF35F" />
      {/* Penalty boxes */}
      <path d="M9 18.5h4.5v11H9M39 18.5h-4.5v11H39" stroke="#AEF35F" strokeOpacity="0.55" strokeWidth="1.6" />
    </svg>
  )
}
