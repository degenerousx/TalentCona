import Image from "next/image";
import { BackWaves, BandArt, FrontWave } from "./AuthArt";
import { TargetIcon } from "./icons";

export type AuthIllustration = {
  src: string;
  width: number;
  height: number;
};

// Figma "Universal Sign In" frame (1440 × 1024): logo at (60, 215), illustration
// 569px wide just below it, card 567px wide 63px from the right edge.
const FRAME_H = 1024;
const HERO_TOP = 215;
const LOGO_BLOCK = 72 + 28; // logo height + gap above the illustration
const ART_W = 569;
// Lowest point of the floating badges in the frame: target badge bottom (939) plus its shadow.
const BADGES_BOTTOM = 952;

// Smallest gap kept above and below the content.
const PAD = "clamp(20px, 4.5dvh, 48px)";

/** Floating badges, Figma frame coordinates. */
const BADGES = [
  { x: 143, y: 879, content: <TargetIcon /> },
  { x: 321, y: 816, content: "💡" },
  { x: 545, y: 821, content: "🚀" },
];

/**
 * Shared auth screen: purple band and waves, logo + illustration on the left,
 * the page's card on the right — built from the Figma frame, but responsive
 * rather than scaled.
 *
 * Type and the card stay at their designed size; the illustration is the part
 * that flexes. Each column keeps the Figma ratio between the space above and
 * below it, so a 1440 × 1024 window shows the Figma layout, and any other
 * window fits without scrolling with at least PAD of breathing room. The band,
 * waves and badges are placed in Figma coordinates relative to the logo and
 * illustration, so they keep their Figma relationship at every size.
 *
 * Below `lg` the illustration is hidden: logo under the band, then the card.
 */
export default function AuthShell({
  children,
  illustration,
  cardTop,
  cardHeight,
}: {
  children: React.ReactNode;
  illustration: AuthIllustration;
  /** Card position and height in the Figma frame; they set the card's spacing and height. */
  cardTop: number;
  cardHeight: number;
}) {
  const artH = Math.round((ART_W / illustration.width) * illustration.height);
  const artTop = HERO_TOP + LOGO_BLOCK; // Figma y of the illustration's top edge
  // How far the badges hang below the illustration (more for the shorter sign-in artwork).
  const overhang = Math.max(0, BADGES_BOTTOM - (artTop + artH));
  const heroBelow = FRAME_H - HERO_TOP - LOGO_BLOCK - artH - overhang;

  const vars = {
    "--pad": PAD,
    // The illustration shrinks when the window is too short for it.
    "--art-w": `min(${ART_W}px, 100%, calc((100dvh - 2 * ${PAD} - ${LOGO_BLOCK + overhang}px) * ${ART_W / artH}))`,
    "--overhang": `${overhang}px`,
    // The card keeps its Figma height when there is room, and never outgrows the window.
    "--card-min": `min(${cardHeight}px, 100dvh - 2 * ${PAD})`,
    "--card-max": `calc(100dvh - 2 * ${PAD})`,
  } as React.CSSProperties;

  return (
    <main
      style={vars}
      className="relative h-dvh overflow-x-hidden overflow-y-auto bg-[linear-gradient(284.84deg,#edeafd_-0.5%,#ffffff_95.28%)] lg:overflow-clip"
    >
      <div className="relative mx-auto flex min-h-full max-w-[1440px] flex-col px-4 pb-10 lg:grid lg:h-full lg:grid-cols-[minmax(0,569px)_minmax(420px,567px)] lg:justify-between lg:gap-x-10 lg:pr-[clamp(24px,4.375vw,63px)] lg:pb-0 lg:pl-[clamp(24px,4.17vw,60px)]">
        {/* Left column: logo + illustration */}
        <div className="flex flex-col">
          <Spacer grow={HERO_TOP} />
          <section className="relative mt-[120px] lg:mt-0 lg:mb-(--overhang)">
            {/* Band's Figma origin sits 60px left of and 215px above the logo, as in the frame */}
            <BandArt className="pointer-events-none absolute -top-[215px] -left-[60px] max-w-none" />

            <Image
              src="/images/talentcona-logo.png"
              alt="TalentCona"
              width={186}
              height={72}
              priority
              className="relative h-12 w-auto lg:h-[72px]"
            />

            <div
              className="relative mt-7 hidden lg:block lg:w-(--art-w)"
              style={{ aspectRatio: `${ART_W} / ${artH}` }}
            >
              {/* Waves keep their Figma offset from the illustration's bottom-left corner */}
              <BackWaves
                className="pointer-events-none absolute -left-[60px] max-w-none"
                style={{ top: `calc(100% - ${artTop + artH}px)` }}
              />
              <Image src={illustration.src} alt="" width={ART_W} height={artH} priority className="relative h-full w-full" />
              <FrontWave
                className="pointer-events-none absolute -left-[60px] max-w-none"
                style={{ top: `calc(100% - ${artTop + artH}px)` }}
              />

              {BADGES.map(({ x, y, content }) => (
                <div
                  key={`${x}-${y}`}
                  aria-hidden
                  className="absolute grid size-[60px] place-items-center rounded-full bg-white font-[family-name:var(--font-emoji)] text-[28px] leading-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
                  style={{ left: `${((x - 60) / ART_W) * 100}%`, top: `${((y - artTop) / artH) * 100}%` }}
                >
                  {content}
                </div>
              ))}
            </div>
          </section>
          <Spacer grow={heroBelow} />
        </div>

        {/* Right column: the card */}
        <div className="flex flex-col">
          <Spacer grow={cardTop} />
          <section className="relative z-10 mt-6 flex w-full max-w-[567px] flex-col justify-center self-center rounded-[20px] bg-white p-6 shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.3)] sm:p-8 lg:mt-0 lg:[@media(max-height:720px)]:py-6 lg:max-h-(--card-max) lg:min-h-(--card-min) lg:overflow-y-auto">
            {children}
          </section>
          <Spacer grow={FRAME_H - cardTop - cardHeight} />
        </div>
      </div>
    </main>
  );
}

/** Flexible gap: takes free height in proportion to `grow` (the Figma margin), never less than --pad. */
function Spacer({ grow }: { grow: number }) {
  return <div aria-hidden className="hidden min-h-(--pad) basis-0 lg:block" style={{ flexGrow: grow }} />;
}
