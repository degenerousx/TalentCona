/**
 * ANGT-HUB wordmark, redrawn as SVG from the design (150 × 31). Replace with
 * the original artwork when available.
 */
export default function AngtHubLogo() {
  return (
    <svg width="150.33" height="30.62" viewBox="0 0 150.33 30.62" role="img" aria-label="ANGT-HUB">
      <defs>
        <linearGradient id="angt-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B4BFF" />
          <stop offset="1" stopColor="#A020F0" />
        </linearGradient>
      </defs>
      <path fill="url(#angt-mark)" d="M13.3 1.6h3l10 24h-7zM4.3 25.6l6-12.6 4 12.6z" />
      <text x="33.3" y="14.6" textLength="113" lengthAdjust="spacingAndGlyphs" fontFamily="var(--font-outfit), sans-serif" fontWeight="800" fontSize="17" fill="#0B0B0B">
        ANGT-HUB
      </text>
      <text x="33.3" y="26.4" textLength="113" lengthAdjust="spacing" fontFamily="var(--font-outfit), sans-serif" fontWeight="600" fontSize="4.4" fill="#2A2A2A">
        Africa’s Next Generation Technology
      </text>
    </svg>
  );
}
