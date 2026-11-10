#!/usr/bin/env node
/**
 * Builds new frames by pasting one small area (like the eye) from other frames
 * onto a single base frame. The body stays pixel-identical in every output
 * frame, so only that area animates.
 *
 * Usage:
 *   npm run patch -- <sliced.png> <output.png> --base 1 --from 4,5,6 --region cx,cy,rx,ry
 *
 *   sliced.png  a strip made by `npm run slice` (its .json must sit next to it)
 *   --base      frame to keep (1 = first)
 *   --from      frames to take the area from; one output frame each
 *   --region    ellipse around the area, in frame pixels: center x, center y, radius x, radius y
 *
 * Output: base frame first, then one patched frame per --from frame, plus a .json.
 *
 * Why line up: AI frames are drawn at slightly different sizes, so the eye in
 * frame 5 is not at exactly the same spot as in frame 1. The tool slides the
 * source frame around and picks the shift where the skin *around* the area
 * matches the base frame best, then pastes.
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const SEARCH = 12; // max shift in pixels when lining up the area

main();

function main() {
    const opts = parseArgs(process.argv.slice(2));
    const sheet = PNG.sync.read(fs.readFileSync(opts.input));
    const meta = JSON.parse(fs.readFileSync(opts.input.replace(/\.png$/i, '.json'), 'utf8'));
    const { frameWidth: W, frameHeight: H } = meta;
    const [cx, cy, rx, ry] = opts.region;

    const pixel = (frame, x, y) => (y * sheet.width + frame * W + x) * 4;
    const inEllipse = (x, y, scale = 1) =>
        ((x - cx) / (rx * scale)) ** 2 + ((y - cy) / (ry * scale)) ** 2 <= 1;

    const out = new PNG({ width: W * (opts.from.length + 1), height: H });
    const copyFrame = (frame, slot) => {
        for (let y = 0; y < H; y++) {
            sheet.data.copy(out.data, (y * out.width + slot * W) * 4, pixel(frame, 0, y), pixel(frame, W, y));
        }
    };

    copyFrame(opts.base, 0);
    console.log(`base frame ${opts.base + 1}, region center ${cx},${cy} radius ${rx}x${ry}`);

    opts.from.forEach((source, i) => {
        const slot = i + 1;
        copyFrame(opts.base, slot);

        // Compare a ring around the region (not the region itself, which differs on purpose).
        let best = { dx: 0, dy: 0, error: Infinity };
        for (let dy = -SEARCH; dy <= SEARCH; dy++) {
            for (let dx = -SEARCH; dx <= SEARCH; dx++) {
                let error = 0;
                for (let y = Math.floor(cy - ry * 1.6); y <= cy + ry * 1.6; y++) {
                    for (let x = Math.floor(cx - rx * 1.6); x <= cx + rx * 1.6; x++) {
                        if (inEllipse(x, y) || !inEllipse(x, y, 1.6)) continue;
                        const sx = x + dx, sy = y + dy;
                        if (sx < 0 || sy < 0 || sx >= W || sy >= H) { error += 255; continue; }
                        const a = pixel(opts.base, x, y), b = pixel(source, sx, sy);
                        for (let c = 0; c < 4; c++) error += Math.abs(sheet.data[a + c] - sheet.data[b + c]);
                    }
                }
                if (error < best.error) best = { dx, dy, error };
            }
        }

        // Paste the region from the source frame, shifted by the best match.
        for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
            for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
                if (!inEllipse(x, y)) continue;
                const from = pixel(source, x + best.dx, y + best.dy);
                sheet.data.copy(out.data, (y * out.width + slot * W + x) * 4, from, from + 4);
            }
        }
        console.log(`frame ${slot + 1}: area from frame ${source + 1}, shifted ${best.dx},${best.dy}`);
    });

    fs.writeFileSync(opts.output, PNG.sync.write(out));
    const outMeta = { frameWidth: W, frameHeight: H, frames: opts.from.length + 1, source: opts.input };
    fs.writeFileSync(opts.output.replace(/\.png$/i, '.json'), JSON.stringify(outMeta, null, 2) + '\n');
    console.log(`wrote ${opts.output} (${outMeta.frames} frames of ${W}x${H})`);
}

function parseArgs(args) {
    const take = (flag) => {
        const i = args.indexOf(flag);
        return i >= 0 ? args.splice(i, 2)[1] : null;
    };
    const base = Number(take('--base'));
    const from = take('--from')?.split(',').map(Number);
    const region = take('--region')?.split(',').map(Number);
    const [input, output] = args;
    if (!input || !output || !base || !from?.length || region?.length !== 4) {
        console.error('usage: npm run patch -- <sliced.png> <output.png> --base 1 --from 4,5,6 --region cx,cy,rx,ry');
        process.exit(1);
    }
    return { input, output, base: base - 1, from: from.map((n) => n - 1), region };
}
