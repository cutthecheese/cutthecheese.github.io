import { useEffect, useRef } from 'react';
import { Game } from '../game/engine';
import { loadSprites } from '../game/sprites';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** CSS pixels of page scroll per second while A/D or ←/→ is held. */
const WALK_SPEED = 900;

/** Elements that keep their own click and key behaviour instead of making the mouse jump. */
const INTERACTIVE = 'a, button, input, textarea, select, summary, [data-no-jump]';

interface Props {
  icons: number[];
  onReady: (game: Game) => void;
  onCrumbs: (got: number, total: number) => void;
}

/** The full-screen canvas behind the page. The game reads the page's scroll and the project sections. */
export function World({ icons, onReady, onCrumbs }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const crumbsCb = useRef(onCrumbs);
  crumbsCb.current = onCrumbs;

  useEffect(() => {
    let game: Game | null = null;
    let cancelled = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      if (!game) return;
      game.resize(document.documentElement.clientWidth, window.innerHeight);
      const stops = [...document.querySelectorAll<HTMLElement>('[data-stop]')].map(
        (el) => el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2,
      );
      game.setStops(stops, icons);
      onScroll();
    };
    const onScroll = () =>
      game?.setScroll(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);

    // Keys: A/D or ←/→ walk (by scrolling the page, so walking and scrolling are the same thing),
    // W/S or ↑/↓ switch lanes, Space jumps. Links and buttons keep Space for themselves.
    const held = new Set<'left' | 'right'>();
    const walkKey = (key: string) =>
      key === 'a' || key === 'A' || key === 'ArrowLeft' ? 'left' : key === 'd' || key === 'D' || key === 'ArrowRight' ? 'right' : null;
    const onKey = (e: KeyboardEvent) => {
      if (!game || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        game.rain();
      }
      const walk = walkKey(e.key);
      if (walk) {
        e.preventDefault();
        if (!held.size) walkFrom = 0;
        held.add(walk);
      } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) game.lane(1);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (!e.repeat) game.lane(-1);
      } else if (e.key === ' ' && !target.closest(INTERACTIVE)) {
        e.preventDefault();
        game.jump();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const walk = walkKey(e.key);
      if (walk) held.delete(walk);
    };
    const onBlur = () => held.clear();

    // Walking scrolls the page at a steady pace while a key is held.
    let walkFrom = 0;
    let walkRaf = 0;
    const walkLoop = (t: number) => {
      const dt = walkFrom ? Math.min(0.05, (t - walkFrom) / 1000) : 0;
      walkFrom = t;
      const dir = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
      if (dir) window.scrollBy({ top: dir * WALK_SPEED * dt, behavior: 'instant' });
      walkRaf = requestAnimationFrame(walkLoop);
    };
    walkRaf = requestAnimationFrame(walkLoop);
    let konami = 0;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!game || target.closest(INTERACTIVE) || window.getSelection()?.toString()) return;
      game.pointer(e.clientX, e.clientY);
    };

    const ro = new ResizeObserver(measure);
    Promise.all([loadSprites(), document.fonts.ready]).then(() => {
      if (cancelled || !canvas.current) return;
      game = new Game(canvas.current, { reducedMotion: reduced, onCrumbs: (g, t) => crumbsCb.current(g, t) });
      measure();
      ro.observe(document.body);
      game.start();
      onReady(game);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('click', onClick);
    return () => {
      cancelled = true;
      game?.stop();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('click', onClick);
      cancelAnimationFrame(walkRaf);
    };
  }, [icons, onReady]);

  return <canvas ref={canvas} className="world" aria-hidden="true" />;
}
