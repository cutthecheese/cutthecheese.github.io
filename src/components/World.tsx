import { useEffect, useRef } from 'react';
import { Game } from '../game/engine';
import { loadSprites } from '../game/sprites';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

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

    const onKey = (e: KeyboardEvent) => {
      if (!game) return;
      konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        game.rain();
      }
      const target = e.target as HTMLElement;
      if ((e.key === ' ' || e.key === 'ArrowUp') && !target.closest(INTERACTIVE)) {
        e.preventDefault();
        game.jump();
      }
    };
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
    window.addEventListener('click', onClick);
    return () => {
      cancelled = true;
      game?.stop();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [icons, onReady]);

  return <canvas ref={canvas} className="world" aria-hidden="true" />;
}
