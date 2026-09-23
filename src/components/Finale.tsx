interface Props {
  crumbs: { got: number; total: number };
  active: boolean;
  onReset: () => void;
}

export function Finale({ crumbs, active, onReset }: Props) {
  const all = crumbs.got === crumbs.total;
  return (
    <footer
      className={`finale${active ? ' is-active' : ''}`}
      id="contact"
      onFocus={(e) => !active && e.currentTarget.scrollIntoView({ block: 'end' })}
    >
      <div className="dialog px-box finale-box" data-no-jump>
        <h2 className="dialog-title">End of the road, for now</h2>
        <p className="dialog-text">
          That’s everything we’re making at the moment. The mouse has earned its cheese, and it’s heading home.
        </p>
        <p className="dialog-text">
          {all
            ? `You found all ${crumbs.total} crumbs. Show-off.`
            : `You picked up ${crumbs.got} of ${crumbs.total} crumbs on the way.`}{' '}
          {crumbs.got > 0 && (
            <button type="button" className="link-btn" onClick={onReset}>
              Put the crumbs back
            </button>
          )}
        </p>
        <p className="dialog-actions">
          <a className="btn btn-primary" href="mailto:support@cutthecheese.games">
            Email us
          </a>
          <a className="btn" href="https://www.youtube.com/@CutTheCheeseGames">
            YouTube
          </a>
          <a className="btn" href="https://github.com/cutthecheese">
            GitHub
          </a>
        </p>
        <nav className="finale-legal" aria-label="App support">
          <span>Six Seven Tap:</span> <a href="/sixseven/support">support</a>, <a href="/sixseven/privacy">privacy</a>
          <br />
          <span>Vesper:</span> <a href="/vesper/support">support</a>, <a href="/vesper/privacy">privacy</a>
        </nav>
        <p className="finale-copy">© {new Date().getFullYear()} CutTheCheese Games</p>
      </div>
    </footer>
  );
}
