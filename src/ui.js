/**
 * Pixel-art decorations for the screen: stepped frames, sparkles, sprouts.
 * Everything is drawn with square "pixels" so it matches the creature art.
 */
import { COLORS } from './theme.js';

export const PX = 6; // size of one decoration pixel

// '#' = filled pixel, '.' = empty. Letters pick colors from a palette.
export const SPARKLE = [
    '..#..',
    '.#.#.',
    '#.#.#',
    '.#.#.',
    '..#..',
];

export const SPROUT = [
    'LL...LL',
    'LLL.LLL',
    '.LLSLL.',
    '...S...',
    '...S...',
];

/** Draws a little pixel picture centered on (cx, cy). */
export function pixelArt(g, cx, cy, rows, palette, px = PX) {
    const left = Math.round(cx - (rows[0].length * px) / 2);
    const top = Math.round(cy - (rows.length * px) / 2);
    rows.forEach((row, y) => {
        [...row].forEach((key, x) => {
            const color = palette[key];
            if (color === undefined) return;
            g.fillStyle(color);
            g.fillRect(left + x * px, top + y * px, px, px);
        });
    });
}

/** Outline with stepped, pixel-art corners (the DAY badge and label pills). */
export function pixelFrame(g, cx, cy, width, height, color, steps = 3) {
    const x = Math.round(cx - width / 2);
    const y = Math.round(cy - height / 2);
    const corner = steps * PX;

    g.fillStyle(color);
    g.fillRect(x + corner, y, width - 2 * corner, PX);              // top
    g.fillRect(x + corner, y + height - PX, width - 2 * corner, PX); // bottom
    g.fillRect(x, y + corner, PX, height - 2 * corner);              // left
    g.fillRect(x + width - PX, y + corner, PX, height - 2 * corner); // right

    // Staircase in each corner.
    for (let i = 1; i < steps; i++) {
        const along = i * PX;
        const down = (steps - i) * PX;
        g.fillRect(x + along, y + down, PX, PX);
        g.fillRect(x + width - PX - along, y + down, PX, PX);
        g.fillRect(x + along, y + height - PX - down, PX, PX);
        g.fillRect(x + width - PX - along, y + height - PX - down, PX, PX);
    }
}

/** A gold rule with a sparkle on its outer end. side = -1 (left) or 1 (right). */
export function goldRule(g, innerX, y, length, side, ornament = 'sparkle') {
    const outerX = innerX + side * length;
    g.fillStyle(COLORS.gold);
    g.fillRect(Math.min(innerX, outerX), y - 2, length, 4);

    if (ornament === 'sparkle') {
        pixelArt(g, outerX + side * 22, y, SPARKLE, { '#': COLORS.gold }, 5);
    } else {
        pixelArt(g, outerX + side * 34, y, SPROUT, { L: COLORS.leaf, S: COLORS.stem });
    }
}

/** Three little "it moves!" dashes, like a comic, next to an animated creature. */
export function motionMarks(g, x, y, color) {
    g.lineStyle(9, color);
    for (const degrees of [-70, -38, -6]) {
        const angle = (degrees * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        g.lineBetween(x + cos * 42, y + sin * 42, x + cos * 80, y + sin * 80);
    }
}
