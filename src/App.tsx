import { useCallback, useEffect, useRef, useState } from 'react';
import { Finale } from './components/Finale';
import { Hero } from './components/Hero';
import { Hud } from './components/Hud';
import { Stop } from './components/Stop';
import { World } from './components/World';
import { projects } from './data/projects';
import { setSound } from './game/audio';
import type { Game } from './game/engine';

const ICONS = projects.map((p) => p.icon);
const SOUND_KEY = 'ctc-sound';

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === '1';
  } catch {
    return false;
  }
}

function App() {
  const game = useRef<Game | null>(null);
  const [crumbs, setCrumbs] = useState({ got: 0, total: 40 });
  const [sound, setSoundOn] = useState(readSound);
  const [active, setActive] = useState(-1);

  // The stop whose stretch of scroll is under the middle of the screen gets its dialog shown.
  // The finale counts as one more stop.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      const sections = document.querySelectorAll<HTMLElement>('[data-stop], .finale');
      let found = -1;
      sections.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) found = i;
      });
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) found = sections.length - 1;
      setActive(found);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const onReady = useCallback((g: Game) => {
    game.current = g;
  }, []);
  const onCrumbs = useCallback((got: number, total: number) => setCrumbs({ got, total }), []);

  // Browsers only start audio after a gesture, so a remembered "sound on" waits for the first one.
  useEffect(() => {
    if (!sound) return;
    const wake = () => setSound(true);
    window.addEventListener('pointerdown', wake, { once: true });
    window.addEventListener('keydown', wake, { once: true });
    return () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [sound]);

  const toggleSound = () => {
    const next = !sound;
    setSoundOn(next);
    setSound(next); // runs inside the click, so the browser lets audio start
    try {
      localStorage.setItem(SOUND_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <a href="#sixseven" className="skip">
        Skip to the projects
      </a>
      <World icons={ICONS} onReady={onReady} onCrumbs={onCrumbs} />
      <Hud crumbs={crumbs} sound={sound} onSound={toggleSound} />
      <main>
        <Hero count={projects.length} />
        {projects.map((p, i) => (
          <Stop
            key={p.slug}
            project={p}
            side={i % 2 ? 'right' : 'left'}
            active={active === i}
            onExcite={(on) => game.current?.setExcited(i, on)}
          />
        ))}
      </main>
      <Finale crumbs={crumbs} active={active === projects.length} onReset={() => game.current?.resetCrumbs()} />
    </>
  );
}

export default App;
