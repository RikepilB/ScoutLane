/**
 * Backdrop for the auth screens (signin, signup, choose-role).
 *
 * Was three blurred, pulsing colour orbs over a gradient with a vignette —
 * the most recognisable generated-site backdrop there is, and the pulse used
 * Tailwind's `animate-pulse`, which the reduced-motion block in globals.css
 * does not cover. Now a flat ink ground with a faint structural grid: it
 * still reads as "the product", it holds contrast for the form on top of it,
 * and it does not move.
 */
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-sky"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
