/** Decorative Midnight motifs — pure SVG, no emoji. */
export function EclipseGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="120" cy="120" r="88" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.2" />
      <circle cx="120" cy="120" r="64" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="120" cy="120" r="40" fill="url(#ei-eclipse)" />
      <path
        d="M120 28 L124 112 L120 120 L116 112 Z"
        fill="#0000FE"
        fillOpacity="0.9"
      />
      <circle cx="120" cy="120" r="3" fill="#0000FE" />
      <defs>
        <radialGradient id="ei-eclipse" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 96) rotate(55) scale(70)">
          <stop stopColor="#1A1A28" />
          <stop offset="1" stopColor="#0A0A0A" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function MerkleVeil({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M160 12 L280 148 H40 Z" stroke="#0000FE" strokeOpacity="0.35" />
      <path d="M160 12 L220 80 L160 148 L100 80 Z" stroke="#F4F4F6" strokeOpacity="0.18" />
      <circle cx="160" cy="12" r="3" fill="#0000FE" />
      <circle cx="100" cy="80" r="2.5" fill="#8B8B96" />
      <circle cx="220" cy="80" r="2.5" fill="#8B8B96" />
      <circle cx="40" cy="148" r="2" fill="#8B8B96" opacity="0.5" />
      <circle cx="160" cy="148" r="3" fill="#5EE6C3" />
      <circle cx="280" cy="148" r="2" fill="#8B8B96" opacity="0.5" />
      <text x="152" y="142" fill="#5EE6C3" fontSize="8" fontFamily="monospace">
        idx
      </text>
    </svg>
  );
}
