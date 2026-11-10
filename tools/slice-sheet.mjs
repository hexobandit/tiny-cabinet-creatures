#!/usr/bin/env node
/**
 * Turns a ChatGPT sprite sheet into clean, jitter-free frames for Phaser.
 *
 * Usage:
 *   npm run slice -- <input.png> <output.png> --grid 4x2
 *
 * What it does:
 *   1. Splits the image into a cols x rows grid (read left to right, top to bottom)
 *      and finds the character inside each cell.
 *   2. Lines every frame up with the first one: feet on the same line, and
 *      left/right by comparing silhouettes. AI sheets never place the character
 *      in exactly the same spot, and even a few pixels of drift makes an
 *      animation shake.
 *   3. Writes all frames into one horizontal strip of equal-size frames. The feet
 *      sit on the bottom edge and are centered left to right, so in Phaser
 *      setOrigin(0.5, 1) means "standing on the ground", and flipping looks right.
 *   4. Writes <output>.json next to it with frameWidth / frameHeight for the loader.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ALPHA_VISIBLE = 16; // below this a pixel counts as empty background (AI noise)
const ALPHA_SOLID = 128;  // at or above this a pixel counts as part of the silhouette
const SEARCH = 32;        // max left/right shift in pixels when lining frames up
const PADDING = 4;        // empty pixels kept above and beside the character
const FEET_ROWS = 0.08;   // bottom 8% of the character is treated as its feet

main();

function main() {
    const { input, output, cols, rows } = parseArgs(process.argv.slice(2));
    const sheet = PNG.sync.read(fs.readFileSync(input));
    console.log(`${path.basename(input)}: ${sheet.width}x${sheet.height}, grid ${cols}x${rows}`);

    const frames = cutCells(sheet, cols, rows);
    const reference = frames[0];

    // Where each frame sits relative to frame 0, after lining it up.
    for (const frame of frames) {
        const { dx, dy, match } = frame === reference ? { dx: 0, dy: 0, match: 1 } : align(reference, frame);
        Object.assign(frame, { dx, dy, match });
    }

    const box = outputBox(frames, reference);
    const strip = new PNG({ width: box.width * frames.length, height: box.height });
    frames.forEach((frame, i) => {
        blit(frame, strip, i * box.width + frame.dx - box.left, frame.dy - box.top);
    });

    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, PNG.sync.write(strip));
    const meta = {
        frameWidth: box.width,
        frameHeight: box.height,
        frames: frames.length,
        source: path.basename(input),
    };
    const metaPath = output.replace(/\.png$/i, '.json');
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');

    // Feet = gap between the bottom of the frame and the lowest solid pixel,
    // and where the feet are left to right. Same numbers in every row = no jitter.
    console.log('\nframe  size      shift    match   feet gap  feet x');
    frames.forEach((f, i) => {
        const feet = measureFeet(strip, i * box.width, box.width);
        const warn = f.match < 0.9 ? '  <- differs a lot from frame 1, check it' : '';
        console.log(
            `${String(i + 1).padStart(5)}  ${`${f.width}x${f.height}`.padEnd(9)} ` +
            `${`${f.dx},${f.dy}`.padEnd(8)} ${`${(f.match * 100).toFixed(1)}%`.padEnd(7)} ` +
            `${String(feet.gap).padEnd(9)} ${feet.x}${warn}`,
        );
    });
    console.log(`\nwrote ${output} (${strip.width}x${strip.height})`);
    console.log(`wrote ${metaPath} (frame ${box.width}x${box.height}, ${frames.length} frames)`);
}

function parseArgs(args) {
    const gridIndex = args.indexOf('--grid');
    const grid = gridIndex >= 0 ? args.splice(gridIndex, 2)[1] : null;
    const [input, output] = args;
    const match = grid && /^(\d+)x(\d+)$/.exec(grid);
    if (!input || !output || !match) {
        console.error('usage: npm run slice -- <input.png> <output.png> --grid <cols>x<rows>');
        process.exit(1);
    }
    return { input, output, cols: Number(match[1]), rows: Number(match[2]) };
}

/** Crops the character out of every grid cell. */
function cutCells(sheet, cols, rows) {
    const alphaAt = (x, y) => sheet.data[(y * sheet.width + x) * 4 + 3];
    const frames = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x0 = Math.round((col * sheet.width) / cols);
            const x1 = Math.round(((col + 1) * sheet.width) / cols);
            const y0 = Math.round((row * sheet.height) / rows);
            const y1 = Math.round(((row + 1) * sheet.height) / rows);

            let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    if (alphaAt(x, y) < ALPHA_VISIBLE) continue;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
            const name = `frame ${frames.length + 1}`;
            if (maxX < 0) throw new Error(`${name} is empty. Is the --grid right?`);

            const touchesEdge =
                (minX === x0 && col > 0) || (maxX === x1 - 1 && col < cols - 1) ||
                (minY === y0 && row > 0) || (maxY === y1 - 1 && row < rows - 1);
            if (touchesEdge) console.warn(`warning: ${name} touches its cell edge and may be cut off`);

            frames.push(crop(sheet, minX, minY, maxX - minX + 1, maxY - minY + 1));
        }
    }
    return frames;
}

function crop(sheet, left, top, width, height) {
    const data = Buffer.alloc(width * height * 4);
    const solid = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const from = ((top + y) * sheet.width + left + x) * 4;
            const to = (y * width + x) * 4;
            if (sheet.data[from + 3] < ALPHA_VISIBLE) continue; // leave as fully transparent
            sheet.data.copy(data, to, from, from + 4);
            solid[y * width + x] = sheet.data[from + 3] >= ALPHA_SOLID ? 1 : 0;
        }
    }
    return { width, height, data, solid };
}

/**
 * Finds where `frame` should sit relative to `reference`.
 *
 * Up/down: the lowest solid pixels (the feet) go on the same line. AI frames
 * often come out a few percent bigger or smaller; matching the feet keeps the
 * creature planted and lets the size difference show up at the top instead.
 *
 * Left/right: try every shift and keep the one where the two silhouettes
 * overlap the most.
 */
function align(reference, frame) {
    const solidPixels = [];
    for (let y = 0; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {
            if (frame.solid[y * frame.width + x]) solidPixels.push(x, y);
        }
    }

    const dy = lowestSolidRow(reference) - lowestSolidRow(frame);

    const overlap = (dx) => {
        let count = 0;
        for (let i = 0; i < solidPixels.length; i += 2) {
            const x = solidPixels[i] + dx;
            const y = solidPixels[i + 1] + dy;
            if (x >= 0 && y >= 0 && x < reference.width && y < reference.height &&
                reference.solid[y * reference.width + x]) count++;
        }
        return count;
    };

    const centered = Math.round((reference.width - frame.width) / 2);
    let best = { dx: centered, score: -1 };
    for (let dx = centered - SEARCH; dx <= centered + SEARCH; dx++) {
        const score = overlap(dx);
        if (score > best.score) best = { dx, score };
    }

    // Match = shared silhouette / combined silhouette (1.0 = identical shapes).
    const referenceCount = reference.solid.reduce((a, b) => a + b, 0);
    const frameCount = solidPixels.length / 2;
    const match = best.score / (referenceCount + frameCount - best.score);
    return { dx: best.dx, dy, match };
}

function lowestSolidRow(frame) {
    for (let y = frame.height - 1; y >= 0; y--) {
        for (let x = 0; x < frame.width; x++) {
            if (frame.solid[y * frame.width + x]) return y;
        }
    }
    return frame.height - 1;
}

/**
 * Frame size that fits every aligned frame, with the feet of frame 1 centered
 * horizontally and the lowest pixel on the bottom edge.
 */
function outputBox(frames, reference) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const f of frames) {
        minX = Math.min(minX, f.dx);
        minY = Math.min(minY, f.dy);
        maxX = Math.max(maxX, f.dx + f.width);
        maxY = Math.max(maxY, f.dy + f.height);
    }

    const feetX = feetCenter(reference);
    const halfWidth = Math.ceil(Math.max(feetX - minX, maxX - feetX)) + PADDING;
    const left = Math.round(feetX - halfWidth);
    const top = minY - PADDING;
    return { left, top, width: halfWidth * 2, height: maxY - top };
}

function feetCenter(frame) {
    const feetTop = Math.floor(frame.height * (1 - FEET_ROWS));
    let minX = Infinity, maxX = -Infinity;
    for (let y = feetTop; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {
            if (!frame.solid[y * frame.width + x]) continue;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
        }
    }
    return (minX + maxX + 1) / 2;
}

function measureFeet(strip, left, width) {
    const solidAt = (x, y) => strip.data[(y * strip.width + left + x) * 4 + 3] >= ALPHA_SOLID;
    let bottom = -1;
    for (let y = strip.height - 1; y >= 0 && bottom < 0; y--) {
        for (let x = 0; x < width; x++) if (solidAt(x, y)) { bottom = y; break; }
    }
    const feetTop = bottom - Math.round(strip.height * FEET_ROWS);
    let minX = Infinity, maxX = -Infinity;
    for (let y = feetTop; y <= bottom; y++) {
        for (let x = 0; x < width; x++) {
            if (!solidAt(x, y)) continue;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
        }
    }
    return { gap: strip.height - 1 - bottom, x: `${minX}-${maxX}` };
}

function blit(frame, target, left, top) {
    for (let y = 0; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {
            const from = (y * frame.width + x) * 4;
            if (frame.data[from + 3] === 0) continue;
            const to = ((top + y) * target.width + left + x) * 4;
            frame.data.copy(target.data, to, from, from + 4);
        }
    }
}
