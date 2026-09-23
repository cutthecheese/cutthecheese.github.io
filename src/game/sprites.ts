/**
 * Sprite atlas produced by tools/sprites.py. Every frame is stored trimmed; (dx, dy) is the offset of the
 * trimmed rect from the frame's anchor, which is the bottom centre of its cell, so frames of one animation
 * line up when drawn at the same point.
 */
export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
}

export type SheetName = 'mouse' | 'npc' | 'cars' | 'props' | 'icons';

interface Atlas {
  sheets: Record<SheetName, string>;
  frames: Record<SheetName, Frame[]>;
}

const images = {} as Record<SheetName, HTMLImageElement>;
let atlas: Atlas | null = null;

export async function loadSprites(base = '/sprites/'): Promise<void> {
  const res = await fetch(base + 'sprites.json');
  atlas = (await res.json()) as Atlas;
  await Promise.all(
    (Object.keys(atlas.sheets) as SheetName[]).map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = base + atlas!.sheets[name];
          images[name] = img;
        }),
    ),
  );
}

export function frame(sheet: SheetName, i: number): Frame | undefined {
  return atlas?.frames[sheet][i];
}

/** Draws a frame with its anchor at (x, y). `flip` mirrors it around the anchor; `scale` must be whole. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: SheetName,
  i: number,
  x: number,
  y: number,
  flip = false,
  scale = 1,
): void {
  const f = frame(sheet, i);
  if (!f || !f.w) return;
  const img = images[sheet];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(img, f.x, f.y, f.w, f.h, f.dx, f.dy, f.w, f.h);
  ctx.restore();
}
