/**
 * Canvas text is anti-aliased, which smears once the art-resolution canvas is scaled up. Rasterise each
 * string once into an offscreen canvas and threshold its alpha so bubble text stays as crisp as the sprites.
 */
const cache = new Map<string, HTMLCanvasElement>();
const FONT = '8px Silkscreen, monospace';

export function pixelText(text: string, color: string): HTMLCanvasElement {
  const key = color + '|' + text;
  const hit = cache.get(key);
  if (hit) return hit;
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = FONT;
  const w = Math.ceil(probe.measureText(text).width) + 2;
  const h = 10;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.font = FONT;
  g.textBaseline = 'top';
  g.fillStyle = color;
  g.fillText(text, 1, 1);
  const data = g.getImageData(0, 0, w, h);
  for (let i = 3; i < data.data.length; i += 4) data.data[i] = data.data[i] > 110 ? 255 : 0;
  g.putImageData(data, 0, 0);
  // Only cache once the web font is in, or the fallback glyphs would stick.
  if (document.fonts.check(FONT)) cache.set(key, c);
  return c;
}
