// components/CitizenIcon.tsx
//
// An original illustration — a diverse group of citizens raising a flag
// together. NOT a reproduction of the Iwo Jima photograph/memorial (both
// are protected works) — this is a different, simpler composition built
// from scratch in the site's own accent colors, just carrying the same
// "many hands, one effort" idea.

export default function CitizenIcon({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flag pole */}
      <line x1="100" y1="20" x2="100" y2="120" stroke="#00E5C3" strokeWidth="4" strokeLinecap="round" />
      {/* Flag */}
      <path
        d="M100 22 L155 35 L100 50 Z"
        fill="#00E5C3"
      />
      {/* Five raised arms/hands converging on the pole base, different
          heights/angles to suggest a diverse group of people */}
      <g stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M60 170 L88 118" />
        <path d="M78 175 L94 122" />
        <path d="M100 178 L100 120" />
        <path d="M122 175 L106 122" />
        <path d="M140 170 L112 118" />
      </g>
      {/* Hands (simple circles) gripping the base of the pole */}
      <g fill="#00E5C3">
        <circle cx="88" cy="116" r="5" />
        <circle cx="94" cy="120" r="5" />
        <circle cx="100" cy="118" r="5" />
        <circle cx="106" cy="120" r="5" />
        <circle cx="112" cy="116" r="5" />
      </g>
      {/* Simple ground/shoulders line for the group */}
      <path
        d="M50 180 Q100 195 150 180"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
