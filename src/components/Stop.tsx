import { Project, STATUS_LABEL } from '../data/projects';

interface Props {
  project: Project;
  side: 'left' | 'right';
  active: boolean;
  onExcite: (on: boolean) => void;
}

/**
 * One stop on the road. The section is a stretch of scroll; while it's in the middle of the screen its dialog
 * box is shown in a fixed spot above the road. The signpost and the mouse are drawn by the game.
 */
export function Stop({ project: p, side, active, onExcite }: Props) {
  return (
    <article
      data-stop
      id={p.slug}
      className={`stop stop-${side}${active ? ' is-active' : ''}`}
      aria-labelledby={`${p.slug}-title`}
      onMouseEnter={() => onExcite(true)}
      onMouseLeave={() => onExcite(false)}
      onFocus={(e) => {
        onExcite(true);
        if (!active) e.currentTarget.scrollIntoView({ block: 'center' });
      }}
      onBlur={() => onExcite(false)}
    >
      <div className="dialog px-box" data-no-jump>
        <img src={`/sprites/projects/${p.slug}.png`} alt="" className="px dialog-icon" width={30} height={30} />
        <div className="dialog-body">
          <h2 id={`${p.slug}-title`} className="dialog-title">
            {p.title}
          </h2>
          <p className="dialog-meta">
            <span className={`chip chip-${p.status}`}>{STATUS_LABEL[p.status]}</span>
            <span className="chip">{p.platform}</span>
            {p.statusNote && <span className="chip">{p.statusNote}</span>}
          </p>
          <p className="dialog-text">{p.description}</p>
          {p.links.length > 0 && (
            <p className="dialog-actions">
              {p.links.map((l) => (
                <a key={l.href} href={l.href} className={l.primary ? 'btn btn-primary' : 'text-link'}>
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
