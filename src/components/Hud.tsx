interface Props {
  crumbs: { got: number; total: number };
  sound: boolean;
  onSound: () => void;
}

export function Hud({ crumbs, sound, onSound }: Props) {
  return (
    <header className="hud">
      <a href="#top" className="hud-brand">
        <img src="/sprites/ui-mouse.png" alt="" className="px" width={21} height={22} />
        <span>Cut the Cheese</span>
      </a>
      <div className="hud-right">
        <p className="hud-crumbs px-box" aria-live="polite">
          <img src="/sprites/ui-cheese.png" alt="" className="px" width={15} height={13} />
          <span className="sr-only">Crumbs collected:</span>
          {crumbs.got}/{crumbs.total}
        </p>
        <button type="button" className="hud-sound px-box" aria-pressed={sound} onClick={onSound}>
          <img src={sound ? '/sprites/ui-sound-on.png' : '/sprites/ui-sound-off.png'} alt="" className="px" />
          <span className="sr-only">Sound</span>
        </button>
      </div>
    </header>
  );
}
