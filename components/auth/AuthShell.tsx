import Image from "next/image";
import ScaledStage from "./ScaledStage";
import { TargetIcon } from "@/components/icons";
import styles from "./AuthShell.module.css";

const DOTS = [42.5, 59.5, 76.5, 93.5].flatMap((cy) =>
  [125.5, 145.5, 165.5, 185.5].map((cx) => ({ cx, cy })),
);
const TOP_STARS = [[93, 146], [155, 121], [220, 77], [271, 34], [420, 9]];
const BOTTOM_STARS = [[238, 874], [292, 850], [394, 834], [471, 857]];

function Star({ x, y }: { x: number; y: number }) {
  return <use href="#tc-star" x={x} y={y} width={16} height={16} />;
}

/**
 * Shared 1440 × 1024 auth artboard: wave background, logo, illustration and
 * floating badges. Renders the page's card content on the right.
 */
export default function AuthShell({
  children,
  cardHeight = 701.31,
}: {
  children: React.ReactNode;
  cardHeight?: number;
}) {
  return (
    <ScaledStage className={styles.stage}>
      {/* Top: purple band, light stripe, decorative lines */}
      <svg className={`${styles.bg} ${styles.bgBack}`} viewBox="0 0 1440 1024" preserveAspectRatio="xMinYMin slice" aria-hidden="true">
        <defs>
          <linearGradient id="tc-top-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4635B9" />
            <stop offset="1" stopColor="#1A0C7A" />
          </linearGradient>
          <linearGradient id="tc-bottom-stripe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#DED6FD" />
            <stop offset="0.42" stopColor="#E4DEFD" />
            <stop offset="0.62" stopColor="#F0EDFE" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tc-bottom-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#887CD8" />
            <stop offset="0.48" stopColor="#F0EDFE" />
            <stop offset="1" stopColor="#F0EDFE" />
          </linearGradient>
          <symbol id="tc-star" viewBox="0 0 16 16">
            <path transform="rotate(-15 8 8)" d="M8 2.1c.45 3.2 1.9 4.65 5.1 5.1-3.2.45-4.65 1.9-5.1 5.1-.45-3.2-1.9-4.65-5.1-5.1 3.2-.45 4.65-1.9 5.1-5.1z" fill="#F4E9C6" stroke="#FCD34D" strokeWidth=".47" />
          </symbol>
        </defs>

        <path fill="#856EFF" d="M-2000 -2000H3440V253C2600 360 1900 320 1440 253C1250 300 1000 320 800 268C640 225 500 117 360 117C230 117 110 190 0 235C-600 480 -1400 300 -2000 235Z" />
        <path fill="url(#tc-top-band)" d="M-2000 -2000H3440V242C2600 340 1900 300 1440 242C1250 290 1000 312 800 262C640 222 500 113 360 115C230 117 110 175 0 212C-600 420 -1400 280 -2000 212Z" />

        <g fill="none" stroke="rgba(255,255,255,.37)" strokeWidth="1">
          <path d="M-20 72C60 66 130 110 190 128C250 146 300 70 352 -4" />
          <path d="M-20 163C40 162 80 160 101 154C125 147 145 137 163 129C190 116 210 100 228 85C246 70 262 55 279 42C320 10 360 2 395 6C420 10 425 18 450 26C520 46 570 30 614 12" />
        </g>
        <g fill="rgba(255,255,255,.37)">
          {DOTS.map(({ cx, cy }) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" />
          ))}
        </g>
        {TOP_STARS.map(([x, y]) => (
          <Star key={`${x}-${y}`} x={x} y={y} />
        ))}
      </svg>

      {/* Left column: logo + illustration */}
      <section className={styles.hero}>
        <Image className={styles.logo} src="/images/talentcona-logo.png" alt="TalentCona" width={186} height={72} priority />
        <Image className={styles.art} src="/images/signin-illustration.webp" alt="" width={569} height={567} priority />
      </section>

      {/* Bottom waves sit above the illustration's desk */}
      <svg className={`${styles.bg} ${styles.bgFront}`} viewBox="0 0 1440 1024" aria-hidden="true">
        <path fill="#F3F0FE" d="M-2000 3000V1000C-1000 1000 -300 1000 0 998C150 990 280 945 400 908C520 872 620 860 760 858C1000 856 1200 870 1440 880C2200 900 2800 900 3440 900V3000Z" />
        <path fill="url(#tc-bottom-stripe)" d="M-2000 3000V998C-600 998 -200 998 0 998C110 994 220 965 300 938C400 905 470 888 560 875C640 866 720 870 800 880C1000 900 1200 940 1440 960V3000Z" />
        <path fill="url(#tc-bottom-wave)" d="M-2000 3000V1009C-600 1009 -200 1009 0 1009C110 1006 220 980 300 949C400 914 470 896 560 884C680 870 800 884 900 900C1100 935 1250 960 1440 980V3000Z" />
        {BOTTOM_STARS.map(([x, y]) => (
          <Star key={`${x}-${y}`} x={x} y={y} />
        ))}
      </svg>

      {/* Floating badges */}
      <div className={styles.badge} style={{ left: 143, top: 879 }} aria-hidden="true">
        <TargetIcon />
      </div>
      <div className={`${styles.badge} ${styles.emoji}`} style={{ left: 321, top: 816 }} aria-hidden="true">
        💡
      </div>
      <div className={`${styles.badge} ${styles.emoji}`} style={{ left: 545, top: 821 }} aria-hidden="true">
        🚀
      </div>

      <section className={styles.card} style={{ "--card-h": `${cardHeight}px` } as React.CSSProperties}>
        {children}
      </section>
    </ScaledStage>
  );
}
