import { sfx } from './audio';
import { drawSprite, frame } from './sprites';
import { pixelText } from './text';

/*
 * "One day on Cheese Road": the page's vertical scroll drives a side-scroller. Everything is drawn on a
 * low-resolution canvas (one canvas pixel = one art pixel) that CSS scales up by an integer factor with
 * `image-rendering: pixelated`, so every sprite, road stripe and letter stays on the same pixel grid.
 */

const INK = '#230A1F';
const CHEDDAR = '#FDE43D';
const RIND = '#F08A1C';
const CRUST = '#9B5724';
const PAPER = '#FEF8E8';

/** World pixels the camera moves per CSS pixel of scroll, before dividing by the pixel scale. */
const SPEED = 0.9;
const GRAVITY = 560;
const JUMP_V = 200;
const CRUMB_COUNT = 40;
const STORE_KEY = 'ctc-crumbs';

// Sprite indices, row-major in each sheet (see art/p-*.txt for what each cell holds).
const M = { run: [0, 1, 2, 3, 4, 5], idle: [6, 7], jump: 8, squash: 9, wave: 10, eat: 11, cut: [12, 13, 14, 15] };
const P = { crumb: 0, lamp: 2, hydrant: 3, moon: 4, cloud: 5, bush: 6, tree: 7, hole: 8, star: 10, heart: 11 };

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** Sky over the course of the page: dawn at the hero, night at the mouse hole. */
const DAY: { p: number; sky: [string, string, string]; night: number }[] = [
  { p: 0.0, sky: ['#6F7FD0', '#F7A7A0', '#FFD49A'], night: 0.15 },
  { p: 0.18, sky: ['#5BB8F0', '#8FD3FF', '#D4F0FF'], night: 0 },
  { p: 0.5, sky: ['#4AA8EE', '#86CCFA', '#CBEBFF'], night: 0 },
  { p: 0.72, sky: ['#6E86D8', '#F6B26B', '#FFE08A'], night: 0.1 },
  { p: 0.86, sky: ['#3C2A6E', '#B25A8C', '#F08A6C'], night: 0.45 },
  { p: 1.0, sky: ['#0E0A24', '#1B1236', '#3A2466'], night: 1 },
];

function dayAt(p: number) {
  let i = 0;
  while (i < DAY.length - 2 && p > DAY[i + 1].p) i++;
  const a = DAY[i];
  const b = DAY[i + 1];
  const t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
  return {
    sky: a.sky.map((c, k) => mix(hex(c), hex(b.sky[k]), t)) as [RGB, RGB, RGB],
    night: a.night + (b.night - a.night) * t,
  };
}

/** Deterministic noise so the world is the same on every visit. */
function rand(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Stop {
  scroll: number; // scroll position at which the stop is centred
  x: number;
  icon: number;
  excited: boolean;
  nibble: number;
  wedge: number;
  hiT: number;
}
/** 0 is the near lane (cars drive left), 1 the far lane (cars drive right). */
type Lane = 0 | 1;

interface Car {
  x: number;
  lane: Lane;
  kind: number;
  v: number;
  honked: boolean;
}
interface Crumb {
  id: number;
  x: number;
  lane: Lane;
  h: number;
  got: boolean;
}
interface Bubble {
  text: string;
  x: number;
  y: number;
  t: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  kind: 'star' | 'sparkle' | 'heart' | 'wedge' | 'crumb';
  bounced?: boolean;
}

export interface GameOptions {
  reducedMotion: boolean;
  onCrumbs: (got: number, total: number) => void;
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  private ground = document.createElement('canvas');
  private g: CanvasRenderingContext2D;
  private W = 320;
  private H = 200;
  private S = 4;
  private scroll = 0;
  private maxScroll = 1;
  private camX = 0;
  private prevCam = 0;
  private stops: Stop[] = [];
  private cars: Car[] = [];
  private crumbs: Crumb[] = [];
  private bubbles: Bubble[] = [];
  private parts: Particle[] = [];
  private carTimer = 3;
  private time = 0;
  private raf = 0;
  private last = 0;
  private got = new Set<number>();
  private bodySky = '';
  private player = {
    lane: 0 as Lane,
    /** Where the mouse is drawn between the lanes, 0..1; it slides towards `lane`. */
    laneT: 0,
    h: 0,
    vy: 0,
    facing: 1,
    dist: 0,
    idle: 0,
    squash: 0,
    safe: 0,
    wave: 0,
    snacked: false,
    cut: -1,
    cutDone: false,
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: GameOptions,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.g = this.ground.getContext('2d')!;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as number[];
      saved.forEach((id) => this.got.add(id));
    } catch {
      /* storage blocked: crumbs just aren't remembered */
    }
  }

  // ---- inputs from the page -------------------------------------------------------------------------

  resize(vw: number, vh: number): void {
    this.S = Math.max(2, Math.min(6, Math.round(Math.min(vh / 220, vw / 150))));
    this.W = Math.ceil(vw / this.S);
    this.H = Math.ceil(vh / this.S);
    for (const c of [this.canvas, this.ground]) {
      c.width = this.W;
      c.height = this.H;
    }
    this.canvas.style.width = this.W * this.S + 'px';
    this.canvas.style.height = this.H * this.S + 'px';
    this.ctx.imageSmoothingEnabled = false;
    this.g.imageSmoothingEnabled = false;
    this.layout();
  }

  /** Scroll positions at which each project's section is centred on screen. */
  setStops(scrolls: number[], icons: number[]): void {
    this.stops = scrolls.map((scroll, i) => ({
      scroll,
      x: 0,
      icon: icons[i],
      excited: this.stops[i]?.excited ?? false,
      nibble: 0,
      wedge: 0,
      hiT: 0,
    }));
    this.layout();
  }

  setScroll(y: number, max: number): void {
    this.scroll = y;
    this.maxScroll = Math.max(1, max);
  }

  setExcited(i: number, on: boolean): void {
    if (this.stops[i]) this.stops[i].excited = on;
  }

  jump(): void {
    const p = this.player;
    if (p.h > 0 || p.squash > 0 || p.cut >= 0) return;
    p.vy = JUMP_V;
    p.h = 0.01;
    sfx.jump();
  }

  /** Moves the mouse one lane up (+1, away from the viewer) or down (-1). */
  lane(dir: 1 | -1): void {
    const p = this.player;
    if (p.squash > 0 || p.cut >= 0) return;
    const next = Math.max(0, Math.min(1, p.lane + dir)) as Lane;
    if (next === p.lane) return;
    p.lane = next;
    if (this.opts.reducedMotion) p.laneT = next;
    sfx.lane();
  }

  /**
   * A click or tap on the scene: greet a mouse if one was hit; on the road, tapping the other lane moves
   * there and tapping your own lane jumps; anywhere else jumps.
   */
  pointer(clientX: number, clientY: number): void {
    const x = clientX / this.S + this.camX;
    const y = clientY / this.S;
    const feet = this.propsFeet;
    for (const s of this.stops) {
      const nx = s.x + 26;
      if (Math.abs(x - nx) < 12 && y > feet - 30 && y < feet + 4) {
        s.hiT = 1.2;
        this.say(['hi!', 'hello!', 'cheese?', 'sup'][Math.floor(rand(this.time * 10) * 4)], nx, feet - 30);
        this.parts.push({ x: nx, y: feet - 26, vx: 0, vy: -20, t: 1, kind: 'heart' });
        this.player.wave = 0.9;
        sfx.hi();
        return;
      }
    }
    if (y > this.roadTop - 20 && y < this.groundY + 6) {
      const tapped: Lane = y < this.laneSplit ? 1 : 0;
      if (tapped !== this.player.lane) return this.lane(tapped === 1 ? 1 : -1);
    }
    this.jump();
  }

  rain(): void {
    for (let i = 0; i < 70; i++) {
      this.parts.push({
        x: this.camX + rand(i, this.time) * this.W,
        y: -10 - rand(i, 7) * 160,
        vx: (rand(i, 3) - 0.5) * 20,
        vy: 0,
        t: 5,
        kind: 'wedge',
      });
    }
    this.say('cheese storm!', this.playerX, this.groundY - 36);
  }

  resetCrumbs(): void {
    this.got.clear();
    this.crumbs.forEach((c) => (c.got = false));
    this.save();
  }

  start(): void {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
      this.last = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  // ---- geometry ------------------------------------------------------------------------------------

  private get groundY() {
    return this.H - 12; // near lane, where the player runs
  }
  private get farLaneY() {
    return this.groundY - 23;
  }
  /** Feet position of a lane. */
  private laneFeet(l: number) {
    return this.groundY + (this.farLaneY - this.groundY) * l;
  }
  /** Taps above this line (in canvas pixels) are on the far lane. Sprites stand up from their feet. */
  private get laneSplit() {
    return this.farLaneY + 4;
  }
  private get roadTop() {
    return this.farLaneY - 11;
  }
  private get propsFeet() {
    return this.roadTop - 2;
  }
  private get playerX() {
    return this.camX + Math.round(this.W * 0.3);
  }
  private camFor(scroll: number) {
    return (scroll / this.S) * SPEED;
  }
  private get endX() {
    return this.camFor(this.maxScroll) + Math.round(this.W * 0.3);
  }

  private layout(): void {
    for (const s of this.stops) s.x = Math.round(this.camFor(s.scroll) + this.W * 0.62);
    const from = this.W * 0.5;
    const to = this.endX - 40;
    this.crumbs = Array.from({ length: CRUMB_COUNT }, (_, id) => {
      const k = id % 5;
      const lane = (rand(id, 40) < 0.5 ? 0 : 1) as Lane;
      return {
        id,
        x: Math.round(from + ((to - from) * id) / (CRUMB_COUNT - 1)),
        lane,
        // Far-lane crumbs float lower so they don't hang in front of the signposts.
        h: k < 2 ? 6 : lane === 1 ? 18 : k === 3 ? 30 : 20,
        got: this.got.has(id),
      };
    });
    this.report();
  }

  private save(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify([...this.got]));
    } catch {
      /* ignore */
    }
    this.report();
  }

  private report(): void {
    this.opts.onCrumbs(this.got.size, CRUMB_COUNT);
  }

  private say(text: string, x: number, y: number): void {
    this.bubbles = this.bubbles.filter((b) => Math.abs(b.x - x) > 30);
    this.bubbles.push({ text, x, y, t: 1.3 });
  }

  // ---- simulation ----------------------------------------------------------------------------------

  private update(dt: number): void {
    this.time += dt;
    const p = this.player;
    const reduced = this.opts.reducedMotion;

    // Camera. With reduced motion the world cuts from stop to stop instead of sliding.
    if (reduced) {
      const near = this.stops.reduce<Stop | null>(
        (best, s) => (!best || Math.abs(s.scroll - this.scroll) < Math.abs(best.scroll - this.scroll) ? s : best),
        null,
      );
      const atEnd = this.scroll >= this.maxScroll - 4;
      this.camX = atEnd ? this.camFor(this.maxScroll) : near && this.scroll > this.H * this.S * 0.5 ? this.camFor(near.scroll) : 0;
    } else {
      this.camX = this.camFor(this.scroll);
    }
    const moved = this.camX - this.prevCam;
    this.prevCam = this.camX;
    const running = !reduced && Math.abs(moved) > 0.05 && Math.abs(moved) < 200;
    if (running) {
      p.dist += Math.abs(moved);
      p.facing = moved > 0 ? 1 : -1;
      p.idle = 0;
      p.snacked = false;
    } else {
      p.idle += dt;
    }
    if (p.idle > 6 && !p.snacked && p.h === 0) {
      p.snacked = true;
      this.say('snack break', this.playerX, this.laneFeet(p.laneT) - 34);
    }

    // Jump physics.
    if (p.h > 0) {
      p.vy -= GRAVITY * dt;
      p.h += p.vy * dt;
      if (p.h <= 0) {
        p.h = 0;
        p.vy = 0;
      }
    }
    // Slide between lanes in a quick hop.
    p.laneT += Math.sign(p.lane - p.laneT) * Math.min(Math.abs(p.lane - p.laneT), dt * 7);
    const onLane: Lane = p.laneT > 0.5 ? 1 : 0;
    const feet = this.laneFeet(p.laneT);
    p.squash = Math.max(0, p.squash - dt);
    p.safe = Math.max(0, p.safe - dt);
    p.wave = Math.max(0, p.wave - dt);

    // The finale: at the very bottom of the page the mouse cuts the cheese, once per visit to the end.
    const atEnd = this.scroll >= this.maxScroll - 4;
    if (atEnd && !p.cutDone && p.h === 0 && p.squash === 0) {
      p.cut = 0;
      p.cutDone = true;
      p.facing = 1;
    }
    if (!atEnd && this.scroll < this.maxScroll - 300) p.cutDone = false;
    if (p.cut >= 0) {
      const before = Math.floor(p.cut / 0.22);
      p.cut += dt;
      const now = Math.floor(p.cut / 0.22);
      if (before < 2 && now >= 2) {
        sfx.chop();
        const bx = this.playerX + 13;
        const groundY = feet;
        for (let i = 0; i < 8; i++)
          this.parts.push({ x: bx, y: groundY - 14, vx: Math.cos(i) * 60, vy: -40 - rand(i) * 60, t: 0.9, kind: 'crumb' });
        this.parts.push({ x: bx, y: groundY - 4, vx: 0, vy: 0, t: 0.35, kind: 'star' });
        this.say('CUT!', bx, groundY - 40);
      }
      if (!atEnd) p.cut = -1;
    }

    // Traffic.
    if (!reduced) {
      this.carTimer -= dt;
      if (this.carTimer <= 0) {
        const lane: 0 | 1 = rand(this.time, 1) < 0.55 ? 0 : 1;
        this.carTimer = 3.5 + rand(this.time, 2) * 5;
        this.cars.push({
          lane,
          kind: Math.floor(rand(this.time, 3) * 4),
          x: lane === 0 ? this.camX + this.W + 40 : this.camX - 40,
          v: lane === 0 ? -(45 + rand(this.time, 4) * 35) : 30 + rand(this.time, 5) * 30,
          honked: false,
        });
      }
    }
    const px = this.playerX;
    for (const c of this.cars) {
      c.x += c.v * dt;
      if (c.lane !== onLane) continue;
      // Distance still to cover before the car reaches the mouse (cars in each lane drive their own way).
      const ahead = c.v < 0 ? c.x - px : px - c.x;
      if (!c.honked && ahead > 0 && ahead < 70 && p.h === 0) {
        c.honked = true;
        this.say('BEEP!', c.x, feet - 30);
        sfx.honk();
      }
      if (Math.abs(c.x - px) < 20 && p.h < 12 && p.squash === 0 && p.safe === 0 && p.cut < 0) {
        p.squash = 1.1;
        p.safe = 2.4;
        p.h = 0;
        p.vy = 0;
        this.say('SQUEAK!', px, feet - 24);
        sfx.squeak();
      }
    }
    this.cars = this.cars.filter((c) => c.x > this.camX - 140 && c.x < this.camX + this.W + 140);

    // Crumbs.
    // Only while actually moving: a layout change can slide crumbs under a standing mouse.
    // Swept along the whole distance moved this frame, so a fast scroll still picks crumbs up.
    const lo = Math.min(px, px - moved) - 9;
    const hi = Math.max(px, px - moved) + 9;
    for (const c of this.crumbs) {
      if (!(running || p.h > 0) || c.got || c.x < lo || c.x > hi) continue;
      if (c.lane === onLane && Math.abs(c.h - (p.h + 10)) < 13 && p.squash === 0) {
        c.got = true;
        this.got.add(c.id);
        sfx.crumb();
        this.parts.push({ x: c.x, y: this.laneFeet(c.lane) - c.h, vx: 0, vy: -30, t: 0.4, kind: 'sparkle' });
        this.save();
      }
    }

    // Mice at the stops eat their cheese, faster while you're reading their project.
    for (const s of this.stops) {
      s.hiT = Math.max(0, s.hiT - dt);
      if (reduced) continue;
      s.nibble += dt * (s.excited ? 4 : 1.3);
      if (s.nibble >= 4) {
        s.nibble = 0;
        s.wedge++;
        if (s.wedge > 3) {
          s.wedge = 0;
          if (Math.abs(s.x - this.camX - this.W / 2) < this.W / 2) this.say('*burp*', s.x + 26, this.propsFeet - 30);
        }
      }
    }

    for (const b of this.parts) {
      b.t -= dt;
      b.vy += (b.kind === 'heart' || b.kind === 'star' || b.kind === 'sparkle' ? 0 : GRAVITY * 0.6) * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.kind === 'wedge' && b.y > this.groundY && !b.bounced) {
        b.y = this.groundY;
        b.vy = -b.vy * 0.45;
        b.bounced = true;
      } else if (b.kind === 'wedge' && b.bounced && b.y > this.groundY) {
        b.y = this.groundY;
        b.vy = 0;
        b.vx = 0;
      }
    }
    this.parts = this.parts.filter((b) => b.t > 0);
    for (const b of this.bubbles) b.t -= dt;
    this.bubbles = this.bubbles.filter((b) => b.t > 0);
  }

  // ---- rendering -----------------------------------------------------------------------------------

  private draw(): void {
    const { ctx, g, W, H } = this;
    const prog = Math.min(1, Math.max(0, this.scroll / this.maxScroll));
    const day = dayAt(prog);
    const reduced = this.opts.reducedMotion;

    // Sky in hard bands, the way an 8-bit palette would do a gradient.
    const bands = 10;
    const horizon = this.roadTop;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const c = t < 0.5 ? mix(day.sky[0], day.sky[1], t * 2) : mix(day.sky[1], day.sky[2], (t - 0.5) * 2);
      ctx.fillStyle = css(c);
      const y0 = Math.floor((horizon * i) / bands);
      ctx.fillRect(0, y0, W, Math.ceil(horizon / bands) + 1);
    }
    ctx.fillStyle = css(day.sky[2]);
    ctx.fillRect(0, horizon, W, H - horizon);
    // The page background follows the sky, so overscroll bounce shows sky instead of a flat colour.
    const top = css(day.sky[0]);
    if (top !== this.bodySky) {
      this.bodySky = top;
      document.body.style.backgroundColor = top;
    }

    // Stars.
    if (day.night > 0.3) {
      ctx.fillStyle = PAPER;
      for (let i = 0; i < 60; i++) {
        if (rand(i, 9) > day.night) continue;
        const twinkle = reduced ? 1 : Math.sin(this.time * 3 + i) > -0.6 ? 1 : 0;
        if (!twinkle) continue;
        ctx.fillRect(Math.floor(rand(i, 1) * W), Math.floor(rand(i, 2) * horizon * 0.6), 1, 1);
      }
    }

    // Sun on an arc through the day; the cheese moon rises at dusk.
    const sunT = Math.min(1, prog / 0.85);
    if (sunT < 1) {
      const sx = W * (0.15 + 0.7 * sunT);
      const sy = horizon * 0.75 - Math.sin(sunT * Math.PI) * horizon * 0.55;
      this.disc(ctx, sx, sy, 9, '#FFF1A8', RIND);
    }
    if (prog > 0.78) {
      const mt = Math.min(1, (prog - 0.78) / 0.2);
      drawSprite(ctx, 'props', P.moon, W * 0.78, horizon * 0.45 + (1 - mt) * horizon * 0.5);
    }

    // Clouds drift on their own and slide a little with the camera.
    ctx.globalAlpha = 1 - day.night * 0.6;
    for (let i = 0; i < 7; i++) {
      const span = W + 120;
      const drift = reduced ? 0 : this.time * (3 + i);
      const x = ((((rand(i, 4) * span - this.camX * 0.08 - drift) % span) + span) % span) - 60;
      drawSprite(ctx, 'props', P.cloud, x, 14 + rand(i, 5) * horizon * 0.35);
    }
    ctx.globalAlpha = 1;

    // Below the sky are two layers, the town and the street, so night can darken each without dimming the
    // sky, and lit windows stay behind everything on the street.
    const night = (lit: () => void) => {
      if (day.night <= 0) return;
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `rgba(20,10,48,${(day.night * 0.55).toFixed(3)})`;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
      if (day.night > 0.35) lit();
    };
    g.clearRect(0, 0, W, H);
    this.mountains(g, day.sky[2]);
    this.town(g, false);
    night(() => this.town(g, true));
    ctx.drawImage(this.ground, 0, 0);

    g.clearRect(0, 0, W, H);
    this.road(g);
    this.stopsLayer(g);
    this.finale(g);
    const inFar = this.player.laneT > 0.5;
    this.crumbLayer(g, 1);
    this.carsLayer(g, 1);
    if (inFar) this.playerLayer(g);
    this.crumbLayer(g, 0);
    this.carsLayer(g, 0);
    if (!inFar) this.playerLayer(g);
    this.particles(g);
    this.foreground(g);
    night(() => this.lamps(g, true));
    ctx.drawImage(this.ground, 0, 0);

    for (const b of this.bubbles) this.bubble(ctx, b);
  }

  private disc(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, edge: string) {
    cx = Math.round(cx);
    cy = Math.round(cy);
    for (let y = -r; y <= r; y++) {
      const w = Math.round(Math.sqrt(r * r - y * y));
      c.fillStyle = Math.abs(y) > r - 2 ? edge : fill;
      c.fillRect(cx - w, cy + y, w * 2, 1);
      c.fillStyle = edge;
      c.fillRect(cx - w, cy + y, 1, 1);
      c.fillRect(cx + w - 1, cy + y, 1, 1);
    }
  }

  /** Far hills are giant cheese wedges, washed out towards the horizon colour. */
  private mountains(c: CanvasRenderingContext2D, haze: RGB) {
    const base = this.roadTop - 14;
    const off = this.opts.reducedMotion ? 0 : this.camX * 0.2;
    const body = css(mix(hex(CHEDDAR), haze, 0.45));
    const rind = css(mix(hex(RIND), haze, 0.45));
    const hole = css(mix(hex(RIND), haze, 0.25));
    const edge = css(mix(hex(INK), haze, 0.55));
    const step = 70;
    const first = Math.floor((off - 120) / step);
    for (let i = first; i < first + Math.ceil(this.W / step) + 4; i++) {
      const w = 70 + Math.floor(rand(i, 11) * 60);
      const h = 34 + Math.floor(rand(i, 12) * 46);
      const x0 = Math.round(i * step + rand(i, 13) * 30 - off);
      const leftHigh = rand(i, 14) > 0.5;
      for (let x = 0; x < w; x++) {
        const t = leftHigh ? 1 - x / w : x / w;
        const colH = Math.max(1, Math.round(h * t));
        c.fillStyle = body;
        c.fillRect(x0 + x, base - colH, 1, colH);
        c.fillStyle = edge;
        c.fillRect(x0 + x, base - colH, 1, 1);
      }
      c.fillStyle = rind;
      c.fillRect(x0, base - 3, w, 3);
      c.fillStyle = hole;
      for (let k = 0; k < 4; k++) {
        const hx = x0 + Math.floor(w * (0.15 + rand(i * 7 + k, 15) * 0.7));
        const t = leftHigh ? 1 - (hx - x0) / w : (hx - x0) / w;
        const hy = base - 6 - Math.floor(rand(i * 7 + k, 16) * Math.max(1, h * t - 12));
        const r = 1 + Math.floor(rand(i * 7 + k, 17) * 3);
        if (h * t > 12) c.fillRect(hx - r, hy - r + 1, r * 2, r * 2 - 1);
      }
    }
  }

  /** A little town behind the road. With `lit`, only the windows are drawn (after night falls). */
  private town(c: CanvasRenderingContext2D, lit: boolean) {
    const base = this.roadTop - 5;
    const off = this.opts.reducedMotion ? 0 : this.camX * 0.45;
    const colors = ['#C9B8A6', '#B08B7A', '#8E7A9A', '#D9A86C', '#A4B6A0', '#C98F7B'];
    const step = 26;
    const first = Math.floor((off - 40) / step);
    for (let i = first; i < first + Math.ceil(this.W / step) + 3; i++) {
      if (rand(i, 20) < 0.18) continue; // gaps between blocks
      const w = 16 + Math.floor(rand(i, 21) * 14);
      const h = 18 + Math.floor(rand(i, 22) * 40);
      const x0 = Math.round(i * step - off);
      const y0 = base - h;
      if (!lit) {
        c.fillStyle = INK;
        c.fillRect(x0 - 1, y0 - 1, w + 2, h + 1);
        c.fillStyle = colors[Math.floor(rand(i, 23) * colors.length)];
        c.fillRect(x0, y0, w, h);
        if (rand(i, 24) > 0.6) {
          // A wedge-of-cheese water tank on some roofs.
          c.fillStyle = INK;
          c.fillRect(x0 + 3, y0 - 6, 9, 6);
          c.fillStyle = CHEDDAR;
          c.fillRect(x0 + 4, y0 - 5, 7, 5);
        }
      }
      for (let wy = y0 + 3; wy < base - 5; wy += 6) {
        for (let wx = x0 + 3; wx < x0 + w - 3; wx += 5) {
          const on = rand(wx * 13 + wy, i) > 0.45;
          if (lit && !on) continue;
          c.fillStyle = lit ? CHEDDAR : '#5B4A63';
          c.fillRect(wx, wy, 2, 3);
        }
      }
    }
  }

  private road(c: CanvasRenderingContext2D) {
    const { W } = this;
    const top = this.roadTop;
    const bottom = this.groundY + 4;
    // Pavement.
    c.fillStyle = '#D8D2C8';
    c.fillRect(0, top - 6, W, 6);
    c.fillStyle = INK;
    c.fillRect(0, top - 7, W, 1);
    c.fillStyle = '#B5AC9F';
    for (let x = -Math.round(this.camX % 16); x < W; x += 16) c.fillRect(x, top - 6, 1, 6);
    // Asphalt with a dashed centre line.
    c.fillStyle = INK;
    c.fillRect(0, top, W, 1);
    c.fillStyle = '#4A3F55';
    c.fillRect(0, top + 1, W, bottom - top - 1);
    c.fillStyle = CHEDDAR;
    const mid = Math.round((this.farLaneY + this.groundY) / 2) - 3;
    for (let x = -Math.round(this.camX % 20); x < W; x += 20) c.fillRect(x, mid, 10, 1);
    this.lamps(c, false);
  }

  private lamps(c: CanvasRenderingContext2D, lit: boolean) {
    const step = 150;
    const off = this.camX;
    const first = Math.floor((off - 20) / step);
    for (let i = first; i < first + Math.ceil(this.W / step) + 2; i++) {
      const x = Math.round(i * step + 40 - off);
      if (!lit) {
        drawSprite(c, 'props', P.lamp, x, this.propsFeet);
        if (i % 3 === 1) drawSprite(c, 'props', P.hydrant, x + 40, this.propsFeet);
        if (i % 2 === 0) drawSprite(c, 'props', P.bush, x + 70, this.propsFeet);
      } else {
        // Additive glow: a round halo about the lamp head and a pool of light on the pavement.
        const f = frame('props', P.lamp);
        const top = this.propsFeet - (f?.h ?? 24);
        const hx = x + 4;
        const hy = top + 4;
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = 'rgba(253,228,61,0.14)';
        for (const r of [8, 5]) {
          for (let dy = -r; dy <= r; dy++) {
            const w = Math.round(Math.sqrt(r * r - dy * dy));
            c.fillRect(hx - w, hy + dy, w * 2 + 1, 1);
          }
        }
        c.fillStyle = 'rgba(253,228,61,0.12)';
        c.fillRect(x - 12, this.propsFeet - 3, 25, 3);
        c.fillRect(x - 8, this.propsFeet, 17, 2);
        c.globalCompositeOperation = 'source-over';
      }
    }
  }

  private stopsLayer(c: CanvasRenderingContext2D) {
    const feet = this.propsFeet;
    for (const s of this.stops) {
      const x = s.x - this.camX;
      if (x < -60 || x > this.W + 60) continue;
      // Signpost: a wooden pole and a paper board with the project's pixel icon.
      c.fillStyle = INK;
      c.fillRect(x - 2, feet - 22, 4, 22);
      c.fillStyle = CRUST;
      c.fillRect(x - 1, feet - 22, 2, 22);
      c.fillStyle = INK;
      c.fillRect(x - 21, feet - 62, 42, 42);
      c.fillStyle = CRUST;
      c.fillRect(x - 20, feet - 61, 40, 40);
      c.fillStyle = PAPER;
      c.fillRect(x - 18, feet - 59, 36, 36);
      drawSprite(c, 'icons', s.icon, x, feet - 25);
      // Its mouse, working through a wedge of cheese.
      const nibble = Math.floor(s.nibble) % 4;
      drawSprite(c, 'npc', s.hiT > 0 ? 3 : nibble, x + 26, feet, true);
      drawSprite(c, 'npc', 4 + s.wedge, x + 40, feet);
    }
  }

  private carsLayer(c: CanvasRenderingContext2D, lane: Lane) {
    for (const car of this.cars) {
      if (car.lane !== lane) continue;
      const wheel = Math.floor(this.time * 8) % 2;
      const y = lane === 0 ? this.groundY + 2 : this.farLaneY;
      drawSprite(c, 'cars', car.kind * 2 + wheel, car.x - this.camX, y, car.v < 0);
    }
  }

  private crumbLayer(c: CanvasRenderingContext2D, lane: Lane) {
    for (const cr of this.crumbs) {
      if (cr.got || cr.lane !== lane) continue;
      const x = cr.x - this.camX;
      if (x < -10 || x > this.W + 10) continue;
      const bob = this.opts.reducedMotion ? 0 : Math.round(Math.sin(this.time * 4 + cr.id) * 1.5);
      drawSprite(c, 'props', P.crumb, x, this.laneFeet(lane) - cr.h + 5 + bob);
    }
  }

  /** The end of the road: a mouse hole to go home to. The cheese block comes with the cutting frames. */
  private finale(c: CanvasRenderingContext2D) {
    const x = Math.round(this.endX - this.camX + this.W * 0.42);
    if (x > this.W + 60) return;
    drawSprite(c, 'props', P.hole, x, this.propsFeet, false, 2);
  }

  private playerLayer(c: CanvasRenderingContext2D) {
    const p = this.player;
    const x = this.playerX - this.camX;
    const y = Math.round(this.laneFeet(p.laneT) - p.h);
    if (p.safe > 0 && p.squash === 0 && Math.floor(this.time * 12) % 2) return; // blink while invulnerable
    let f: number;
    if (p.squash > 0) f = M.squash;
    else if (p.cut >= 0) f = M.cut[Math.min(3, Math.floor(p.cut / 0.22))];
    else if (p.h > 0) f = M.jump;
    else if (p.wave > 0) f = M.wave;
    else if (p.idle < 0.15) f = M.run[Math.floor(p.dist / 6) % M.run.length];
    else if (p.snacked) f = M.eat;
    else f = M.idle[Math.floor(this.time * 1.5) % 2];
    drawSprite(c, 'mouse', f, x, y, p.facing < 0);
  }

  private particles(c: CanvasRenderingContext2D) {
    for (const b of this.parts) {
      const x = b.x - this.camX;
      if (b.kind === 'wedge') drawSprite(c, 'npc', 4, x, b.y);
      else if (b.kind === 'heart') drawSprite(c, 'props', P.heart, x, b.y);
      else if (b.kind === 'star') drawSprite(c, 'props', P.star, x, b.y);
      else if (b.kind === 'sparkle') {
        // A four-point twinkle that grows as it fades.
        const r = Math.round((0.4 - b.t) * 12) + 1;
        const cx = Math.round(x);
        const cy = Math.round(b.y);
        c.fillStyle = PAPER;
        c.fillRect(cx - r, cy, r * 2 + 1, 1);
        c.fillRect(cx, cy - r, 1, r * 2 + 1);
        c.fillStyle = CHEDDAR;
        c.fillRect(cx, cy, 1, 1);
      }
      else {
        c.fillStyle = CHEDDAR;
        c.fillRect(Math.round(x), Math.round(b.y), 2, 2);
      }
    }
  }

  private foreground(c: CanvasRenderingContext2D) {
    const top = this.groundY + 4;
    c.fillStyle = INK;
    c.fillRect(0, top, this.W, 1);
    c.fillStyle = '#5DBB4A';
    c.fillRect(0, top + 1, this.W, this.H - top);
    const off = this.opts.reducedMotion ? 0 : this.camX * 1.3;
    c.fillStyle = '#2E7D3A';
    for (let i = Math.floor(off / 7); i < Math.floor(off / 7) + this.W / 7 + 2; i++) {
      const x = Math.round(i * 7 - off);
      c.fillRect(x, top + 1 + Math.floor(rand(i, 30) * 4), 1, 2);
      if (rand(i, 31) > 0.85) {
        c.fillStyle = rand(i, 32) > 0.5 ? CHEDDAR : '#F2A0A8';
        c.fillRect(x + 3, top + 3, 2, 2);
        c.fillStyle = '#2E7D3A';
      }
    }
  }

  private bubble(c: CanvasRenderingContext2D, b: Bubble) {
    const img = pixelText(b.text, INK);
    const w = img.width + 4;
    const h = 12;
    const x = Math.round(b.x - this.camX - w / 2);
    const y = Math.round(b.y - h - 4);
    c.fillStyle = INK;
    c.fillRect(x + 1, y, w - 2, h);
    c.fillRect(x, y + 1, w, h - 2);
    c.fillStyle = PAPER;
    c.fillRect(x + 1, y + 1, w - 2, h - 2);
    // Tail.
    c.fillStyle = INK;
    c.fillRect(x + Math.round(w / 2) - 2, y + h, 4, 1);
    c.fillRect(x + Math.round(w / 2) - 1, y + h + 1, 2, 2);
    c.fillStyle = PAPER;
    c.fillRect(x + Math.round(w / 2) - 1, y + h - 1, 2, 1);
    c.drawImage(img, x + 2, y + 1);
  }
}
