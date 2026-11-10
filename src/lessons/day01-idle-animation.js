/**
 * Day 01: Idle animation
 *
 * A sprite that stands perfectly still reads as an object, not a creature.
 * Two small things make it look alive:
 *
 * 1. Breathing, done in code. It has to be smooth, so it changes a tiny bit
 *    every single frame (60 times a second). A handful of drawn frames would
 *    move in visible steps. Taller = thinner (scaleX = 1 / scaleY), so the body
 *    keeps its volume and looks squishy instead of zoomed.
 *
 * 2. Blinking, done with sprite frames. Eyes snap shut, so a few drawn frames
 *    are perfect. Only the eye changes in those frames; the body is identical.
 *    Frames: 0 open, 1 half closed, 2 closed, 3 half closed.
 */

const BREATH_SECONDS = 2.8; // one slow in-and-out breath
const BREATH_AMOUNT = 0.025; // 2.5% taller at the top of the breath

const BLINK_EVERY_MS = 3400;
const BLINK = [
    { frame: 1, ms: 50 },
    { frame: 2, ms: 90 },
    { frame: 3, ms: 50 },
];

export default {
    day: 1,
    title: 'Idle animation',
    headline: 'A little breath.\nA lot of life.',
    before: 'Static sprite',
    after: 'Idle breathing',
    tagline: 'Code breathes smoothly.\nFrames do the blink.',

    update(creature, time) {
        // 1. Breathe: a sine wave goes -1 .. 1 .. -1, smoothly, forever.
        const wave = Math.sin((time / 1000 / BREATH_SECONDS) * Math.PI * 2);
        const stretch = 1 + wave * BREATH_AMOUNT;
        creature.fx.scaleY *= stretch;
        creature.fx.scaleX *= 1 / stretch;

        // 2. Blink: at the start of every cycle, play the blink frames once.
        let t = time % BLINK_EVERY_MS;
        for (const step of BLINK) {
            if (t < step.ms) {
                creature.fx.frame = step.frame;
                break;
            }
            t -= step.ms;
        }
    },
};
