// Figma artwork for the auth screens ("Universal Sign In" frames), as SVG.
// All coordinates are Figma frame coordinates (1440 × 1024). Each piece is an
// SVG box of that size, placed so its frame origin lands where AuthShell needs
// it; overflow is visible and extra rects carry the shapes past the frame edges,
// so they reach the window edges on any screen size.

const TOP_HIGHLIGHT = "M2156 51.1667L2096.71 76.75C2035.62 102.333 1917.04 153.5 1796.67 204.667C1676.29 255.833 1557.71 307 1437.33 307C1316.96 307 1232.6 246.167 1112.22 195C1029.26 132.833 829.192 68 708.815 68C588.438 68 479.71 153.5 359.333 187.611C238.957 221.722 120.377 238.778 59.2898 247.306L0 255.833V0H59.2898C120.377 0 238.957 0 359.333 0C479.71 0 598.29 0 718.667 0C839.043 0 957.623 0 1078 0C1198.38 0 1316.96 0 1437.33 0C1557.71 0 1676.29 0 1796.67 0C1917.04 0 2035.62 0 2096.71 0H2156V51.1667Z";
const TOP_BAND = "M2197 58.3333L2136.58 87.5C2074.33 116.667 1953.5 175 1830.83 233.333C1708.17 291.667 1587.33 350 1464.67 350C1342 350 1221.17 291.667 1098.5 233.333C975.834 175 854.999 116.667 732.333 116.667C609.667 116.667 488.832 175 366.167 213.889C243.501 252.778 122.666 272.222 60.4175 281.944L0 291.667V0H60.4175C122.666 0 243.501 0 366.167 0C488.832 0 609.667 0 732.333 0C854.999 0 975.834 0 1098.5 0C1221.17 0 1342 0 1464.67 0C1587.33 0 1708.17 0 1830.83 0C1953.5 0 2074.33 0 2136.58 0H2197V58.3333Z";
const TOP_LINE_LONG = "M1.19138 255.76C41.8511 264.652 81.7042 262.487 123.022 249.16C185.598 228.978 239.538 186.576 285.187 148.427C319.261 119.94 340.502 104.361 362.006 98.2433C388.799 90.6224 414.693 98.1435 462.556 117.913C486.906 127.971 526.762 137.549 578.391 126.121C609.221 119.299 629.907 108.026 630.123 107.919L630.655 108.411C630.444 108.528 609.418 119.987 578.187 126.914C526.086 138.466 485.917 128.834 461.408 118.715C413.783 99.0677 388.127 91.5491 361.872 99.0168C340.933 104.982 319.961 120.395 286.17 148.626C240.309 186.952 186.108 229.54 122.98 249.905C81.2484 263.366 41.0865 265.548 0.144815 256.614L1.19138 255.76Z";
const TOP_LINE_SHORT = "M1.00138 144.466C28.3828 115.968 57.9826 100.317 91.4824 96.6002C142.218 90.9698 192.298 114.341 235.255 136.676C267.322 153.361 286.759 161.302 303.987 158.444C325.451 154.881 342.417 134.635 372.289 90.588C387.486 68.1789 414.107 39.2705 454.642 28.728C478.846 22.4312 496.786 25.764 496.97 25.7866L497.233 24.9889C497.049 24.9531 478.815 21.5655 454.292 27.9261C413.382 38.5428 386.546 67.6531 371.249 90.2035C341.519 134.005 324.726 154.14 303.693 157.632C286.916 160.406 267.717 152.53 235.92 136.005C192.765 113.567 142.448 90.1039 91.2634 95.7783C57.4271 99.5312 27.5982 115.304 0.0219551 143.978L1.00138 144.466Z";
// Two light back waves share one shape.
const BACK_WAVE = "M1826 158.333L1775.78 142.5C1724.05 126.667 1623.62 95 1521.67 63.3333C1419.71 31.6667 1319.28 0 1217.33 0C1115.38 0 1014.95 31.6667 913 63.3333C811.048 95 710.618 126.667 608.667 126.667C506.715 126.667 406.285 95 304.333 73.8889C202.381 52.7778 101.952 42.2222 50.2148 36.9444L0 31.6667V190H50.2148C101.952 190 202.381 190 304.333 190C406.285 190 506.715 190 608.667 190C710.618 190 811.048 190 913 190C1014.95 190 1115.38 190 1217.33 190C1319.28 190 1419.71 190 1521.67 190C1623.62 190 1724.05 190 1775.78 190H1826V158.333Z";
const FRONT_WAVE = "M1877 184.167L1825.38 165.75C1772.2 147.333 1668.97 110.5 1564.17 73.6667C1459.37 36.8333 1356.13 0 1251.33 0C1146.53 0 1043.3 36.8333 938.5 73.6667C833.701 110.5 730.466 147.333 625.667 147.333C520.867 147.333 417.632 110.5 312.833 85.9444C208.034 61.3889 104.799 49.1111 51.6173 42.9722L0 36.8333V221H51.6173C104.799 221 208.034 221 312.833 221C417.632 221 520.867 221 625.667 221C730.466 221 833.701 221 938.5 221C1043.3 221 1146.53 221 1251.33 221C1356.13 221 1459.37 221 1564.17 221C1668.97 221 1772.2 221 1825.38 221H1877V184.167Z";

const DOTS = [42.5, 59.5, 76.5, 93.5].flatMap((cy) => [125.5, 145.5, 165.5, 185.5].map((cx) => ({ cx, cy })));
const TOP_STARS = [[93, 146], [155, 121], [220, 77], [271, 34], [420, 9]];
const BOTTOM_STARS = [[238, 874], [292, 850], [394, 834], [471, 857]];

const svgProps = {
  viewBox: "0 0 1440 1024",
  width: 1440,
  height: 1024,
  overflow: "visible",
  "aria-hidden": true,
} as const;

type ArtProps = { className?: string; style?: React.CSSProperties };

function Stars({ at }: { at: number[][] }) {
  return at.map(([x, y]) => <use key={`${x}-${y}`} href="#tc-star" x={x} y={y} width={16} height={16} />);
}

/** Purple band, highlight, line art, dots and stars across the top. Also holds the shared defs. */
export function BandArt({ className, style }: ArtProps) {
  return (
    <svg {...svgProps} className={className} style={style}>
      <defs>
        <linearGradient id="tc-top-band" x1="0" y1="175" x2="2197" y2="175" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4E3DC4" />
          <stop offset="1" stopColor="#11046E" />
        </linearGradient>
        <linearGradient id="tc-bottom-wave" x1="0" y1="110.5" x2="2103" y2="141.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4E3DC4" />
          <stop offset="0.608884" stopColor="#F0EDFE" />
          <stop offset="1" stopColor="#F0EDFE" />
        </linearGradient>
        <symbol id="tc-star" viewBox="0 0 16 16">
          <path
            transform="rotate(-15 8 8)"
            d="M8 2.1c.45 3.2 1.9 4.65 5.1 5.1-3.2.45-4.65 1.9-5.1 5.1-.45-3.2-1.9-4.65-5.1-5.1 3.2-.45 4.65-1.9 5.1-5.1z"
            fill="#F4E9C6"
            stroke="#FCD34D"
            strokeWidth=".47"
          />
        </symbol>
      </defs>

      <path transform="translate(-347 44)" fill="#856EFF" fillRule="evenodd" d={TOP_HIGHLIGHT} />
      <g transform="translate(-373 0)" fill="url(#tc-top-band)">
        {/* The band continues above and beside the frame on tall and very wide screens. */}
        <rect y="-2000" width="2197" height="2001" />
        <rect x="-3000" y="-2000" width="3000" height="2291.67" />
        <rect x="2197" y="-2000" width="3000" height="2058.33" />
        <path fillRule="evenodd" d={TOP_BAND} />
      </g>
      <g fill="#fff" fillOpacity="0.37">
        <path transform="translate(-17 -96)" d={TOP_LINE_LONG} />
        <path transform="translate(-99 -25)" d={TOP_LINE_SHORT} />
        {DOTS.map(({ cx, cy }) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" />
        ))}
      </g>
      <Stars at={TOP_STARS} />
    </svg>
  );
}

/** The two light waves behind the illustration. */
export function BackWaves({ className, style }: ArtProps) {
  return (
    <svg {...svgProps} className={className} style={style}>
      {[
        { x: -756, y: 894, fill: "#F0EDFC" },
        { x: -602, y: 872, fill: "#DED6FD" },
      ].map(({ x, y, fill }) => (
        <g key={fill} transform={`translate(${x} ${y})`} fill={fill}>
          <path fillRule="evenodd" d={BACK_WAVE} />
          <rect x="-3000" y="31.67" width="3001" height="3000" />
          <rect y="189" width="1826" height="3000" />
        </g>
      ))}
    </svg>
  );
}

/** The purple-to-lilac wave in front of the illustration's desk, with its stars. */
export function FrontWave({ className, style }: ArtProps) {
  return (
    <svg {...svgProps} className={className} style={style}>
      <g transform="translate(-602 863)" fill="url(#tc-bottom-wave)">
        <path fillRule="evenodd" d={FRONT_WAVE} />
        <rect x="-3000" y="36.83" width="3001" height="3000" />
        <rect y="220" width="1877" height="3000" />
      </g>
      <Stars at={BOTTOM_STARS} />
    </svg>
  );
}
