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
          Scroll to walk the road. Press space or tap the road to jump, and grab the crumbs.
          <img src="/sprites/ui-arrow.png" alt="" className="px hero-arrow" />
        </p>
      </div>
    </section>
  );
}
