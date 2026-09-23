export function Hero({ count }: { count: number }) {
  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        <img src="/sprites/logo.png" alt="" className="px hero-logo" />
        <h1 className="wordmark">
          <span className="wordmark-small">Cut the</span>
          <span className="wordmark-big">Cheese</span>
        </h1>
        <p className="hero-lede px-box">
          We’re a tiny game studio. There are {count} projects on this road, from a stopwatch game to a bat
          who lives on your wrist.
        </p>
        <p className="hero-hint px-box">
          <span className="hint-keys">
            Scroll or hold A/D (←/→) to walk. W/S (↑/↓) switches lanes and Space jumps. Grab the crumbs and
            dodge the cars.
          </span>
          <span className="hint-touch">
            Scroll to walk. Tap the other lane to cross the road, or tap your own lane to jump.
          </span>
          <img src="/sprites/ui-arrow.png" alt="" className="px hero-arrow" />
        </p>
      </div>
    </section>
  );
}
