#!/usr/bin/python3
"""Turn the Codex-generated sprite sheets in art/raw/ into true 1:1 pixel art for the site.

The generated sheets are pixel art drawn at roughly 8-12 screen pixels per art pixel, on a magenta
background. For each sheet this script:
  1. finds the art-pixel grid (period and phase) from where colour edges fall,
  2. samples the middle of every grid cell, which drops anti-aliased edges and JPEG-ish noise,
  3. keys out the magenta and snaps the colours to a small palette,
  4. trims each sprite cell and records its offset from the cell's bottom centre (the anchor).

Output: public/sprites/<sheet>.png, public/sprites/sprites.json, per-project icons and a few UI images.
Run with the system python (it has Pillow): /usr/bin/python3 tools/sprites.py

The raw sheets were drawn by Codex from the prompts next to them, e.g. for the mouse:
  cd art && cat common.txt p-mouse.txt | codex exec -s workspace-write -i ref/logo.jpg -
(ref/ holds the channel logo and the games' current icons; it is not committed.)
"""
import cmath
import json
import os
from collections import Counter

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'art', 'raw')
OUT = os.path.join(ROOT, 'public', 'sprites')

# name: (columns, rows)
SHEETS = {
    'mouse': (4, 4),
    'npc': (4, 2),
    'cars': (2, 4),
    'props': (4, 4),
    'icons': (4, 2),
}
ICON_SLUGS = ['sixseven', 'heat-and-hammer', 'vesper', 'pete', 'pixelfight', 'tiny-world', 'little-planet', 'brush-the-cat']
UI = {'sound-on': 12, 'sound-off': 13, 'cheese': 14, 'arrow': 15}


def is_key(p):
    r, g, b = p[:3]
    return r > 170 and b > 170 and g < 110


def grid(im):
    """Return (period, phase_x, phase_y) of the art-pixel grid."""
    w, h = im.size
    px = im.load()

    def diff(a, b):
        return sum(abs(a[i] - b[i]) for i in range(3)) > 90

    xs, ys = [], []
    for y in range(0, h, 3):
        for x in range(1, w):
            if diff(px[x, y], px[x - 1, y]):
                xs.append(x)
    for x in range(0, w, 3):
        for y in range(1, h):
            if diff(px[x, y], px[x, y - 1]):
                ys.append(y)

    def coherence(edges, p):
        s = sum(cmath.exp(2j * cmath.pi * e / p) for e in edges)
        return abs(s) / len(edges), cmath.phase(s)

    cands = [p / 20 for p in range(80, 640)]  # 4.0 .. 32.0 screen px per art px
    scored = [(p, coherence(xs, p)[0] + coherence(ys, p)[0]) for p in cands]
    best = max(s for _, s in scored)
    period = max(p for p, s in scored if s >= best * 0.85)
    # Refine around the pick.
    period = max((period + d / 100 for d in range(-15, 16)), key=lambda p: coherence(xs, p)[0] + coherence(ys, p)[0])
    phx = (coherence(xs, period)[1] / (2 * cmath.pi)) * period % period
    phy = (coherence(ys, period)[1] / (2 * cmath.pi)) * period % period
    return period, phx, phy


def downsample(im, period, phx, phy):
    """Sample the centre of every art pixel (majority of a small patch) into a 1:1 RGBA image."""
    w, h = im.size
    px = im.load()
    nx = int((w - phx) // period)
    ny = int((h - phy) // period)
    out = Image.new('RGBA', (nx, ny), (0, 0, 0, 0))
    o = out.load()
    r = max(1, int(period * 0.2))
    for j in range(ny):
        for i in range(nx):
            cx = int(phx + (i + 0.5) * period)
            cy = int(phy + (j + 0.5) * period)
            patch = [px[min(w - 1, cx + dx), min(h - 1, cy + dy)] for dx in range(-r, r + 1) for dy in range(-r, r + 1)]
            keyed = sum(1 for p in patch if is_key(p))
            if keyed * 2 > len(patch):
                continue
            solid = [p for p in patch if not is_key(p)]
            # Median per channel is robust to the odd stray pixel.
            c = tuple(sorted(p[k] for p in solid)[len(solid) // 2] for k in range(3))
            o[i, j] = c + (255,)
    return out


def snap_palette(im, colors=40):
    """Merge near-identical colours so a flat area really is one colour."""
    alpha = im.getchannel('A')
    rgb = im.convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
    rgb.putalpha(alpha)
    return rgb


def components(im):
    """8-connected components of opaque pixels, as lists of (x, y)."""
    w, h = im.size
    a = im.getchannel('A').load()
    seen = [[False] * h for _ in range(w)]
    comps = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[x0][y0] or not a[x0, y0]:
                continue
            stack, comp = [(x0, y0)], []
            seen[x0][y0] = True
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and a[nx, ny]:
                            seen[nx][ny] = True
                            stack.append((nx, ny))
            comps.append(comp)
    return comps


def cut_cells(im, cols, rows):
    """Split the sheet into its grid cells. A shape belongs to the cell holding its centre, so a sprite that
    pokes out of its cell (a taxi's roof sign) stays whole and never leaks into the neighbour."""
    w, h = im.size
    cw, ch = w / cols, h / rows
    owned = [[] for _ in range(cols * rows)]
    for comp in components(im):
        if len(comp) < 2:
            continue  # stray speck
        mx = sum(x for x, _ in comp) / len(comp)
        my = sum(y for _, y in comp) / len(comp)
        c = min(cols - 1, int(mx // cw))
        r = min(rows - 1, int(my // ch))
        owned[r * cols + c].extend(comp)
    src = im.load()
    cells = []
    for r in range(rows):
        row = []
        for c in range(cols):
            pts = owned[r * cols + c]
            if not pts:
                row.append((None, None))
                continue
            x0 = min(x for x, _ in pts); x1 = max(x for x, _ in pts) + 1
            y0 = min(y for _, y in pts); y1 = max(y for _, y in pts) + 1
            sprite = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
            sp = sprite.load()
            for x, y in pts:
                sp[x - x0, y - y0] = src[x, y]
            row.append((sprite, (x0, y0, x1, y1)))
        baseline = max((bb[3] for _, bb in row if bb), default=0)
        for c, (sprite, bb) in enumerate(row):
            centre = round((c + 0.5) * cw)
            cells.append((sprite, None if not bb else (bb[0] - centre, bb[1] - baseline)))
    return cells


def main():
    os.makedirs(os.path.join(OUT, 'projects'), exist_ok=True)
    atlas = {'sheets': {}, 'frames': {}}
    report = []
    for name, (cols, rows) in SHEETS.items():
        src = Image.open(os.path.join(RAW, name + '.png')).convert('RGB')
        period, phx, phy = grid(src)
        small = snap_palette(downsample(src, period, phx, phy))
        report.append(f'{name}: {src.size} -> {small.size} (grid {period:.2f}px)')
        frames = []
        packed = []
        for sprite, off in cut_cells(small, cols, rows):
            if not sprite:
                frames.append({'x': 0, 'y': 0, 'w': 0, 'h': 0, 'dx': 0, 'dy': 0})
                packed.append(None)
                continue
            frames.append({'dx': off[0], 'dy': off[1], 'w': sprite.width, 'h': sprite.height})
            packed.append(sprite)
        # Pack the trimmed frames into one row with a 1px gap.
        width = sum(s.width + 1 for s in packed if s) or 1
        height = max((s.height for s in packed if s), default=1)
        sheet = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        x = 0
        for f, s in zip(frames, packed):
            if not s:
                continue
            sheet.paste(s, (x, 0))
            f['x'], f['y'] = x, 0
            x += s.width + 1
        sheet.save(os.path.join(OUT, name + '.png'), optimize=True)
        atlas['sheets'][name] = name + '.png'
        atlas['frames'][name] = frames

        if name == 'icons':
            for slug, s in zip(ICON_SLUGS, packed):
                s.save(os.path.join(OUT, 'projects', slug + '.png'), optimize=True)
        if name == 'props':
            for ui, i in UI.items():
                packed[i].save(os.path.join(OUT, 'ui-' + ui + '.png'), optimize=True)
        if name == 'mouse':
            idle = packed[6]
            icon = Image.new('RGBA', (max(idle.size), max(idle.size)), (0, 0, 0, 0))
            icon.paste(idle, ((icon.width - idle.width) // 2, icon.height - idle.height))
            icon.save(os.path.join(OUT, 'ui-mouse.png'), optimize=True)

    with open(os.path.join(OUT, 'sprites.json'), 'w') as fh:
        json.dump(atlas, fh, separators=(',', ':'))

    logo()
    contact_sheet(atlas)
    print('\n'.join(report))


def logo():
    """The logo mark is Codex's clean redraw of the channel logo. Its pixels are not all the same size, so
    snapping it to one grid loses the eyes; instead key out the magenta and keep it at half its drawn size."""
    src = Image.open(os.path.join(RAW, 'logo.png')).convert('RGBA')
    px = src.load()
    for y in range(src.height):
        for x in range(src.width):
            if is_key(px[x, y]):
                px[x, y] = (0, 0, 0, 0)
    src = src.crop(src.getchannel('A').getbbox())
    small = src.resize((src.width // 2, src.height // 2), Image.NEAREST)
    small.save(os.path.join(OUT, 'logo.png'), optimize=True)
    print(f'logo: {src.size} -> {small.size}')

    # Favicon (mouse head from the logo) and a 1200x630 social card.
    fav = small.crop((0, 0, small.width, int(small.height * 0.62)))
    fav = fav.crop(fav.getchannel('A').getbbox())
    side = max(fav.size)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(fav, ((side - fav.width) // 2, (side - fav.height) // 2))
    sq.resize((180, 180), Image.LANCZOS).save(os.path.join(ROOT, 'public', 'favicon.png'))

    card = Image.new('RGB', (1200, 630), (0x8F, 0xD3, 0xFF))
    scale = min(520 / small.height, 1000 / small.width)
    big = small.resize((round(small.width * scale), round(small.height * scale)), Image.NEAREST)
    card.paste(big, ((1200 - big.width) // 2, (630 - big.height) // 2), big)
    card.save(os.path.join(ROOT, 'public', 'og.png'), optimize=True)


def contact_sheet(atlas):
    tiles = [Image.open(os.path.join(OUT, n)) for n in atlas['sheets'].values()]
    tiles.append(Image.open(os.path.join(OUT, 'logo.png')))
    s = 4
    w = max(t.width for t in tiles) * s + 20
    h = sum(t.height * s + 10 for t in tiles) + 10
    sheet = Image.new('RGB', (w, h), (0x8F, 0xD3, 0xFF))
    y = 10
    for t in tiles:
        big = t.resize((t.width * s, t.height * s), Image.NEAREST)
        sheet.paste(big, (10, y), big)
        y += big.height + 10
    sheet.save(os.path.join(ROOT, 'art', 'contact.png'))


if __name__ == '__main__':
    main()
