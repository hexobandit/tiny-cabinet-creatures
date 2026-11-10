# tiny-cabinet-creatures

A small 2D Phaser 4 playground for a daily "game feel" video series: one creature,
one new trick per day (idle breathing, movement, hit reactions, ...), recorded as
short vertical before/after clips for Instagram and X.

## Run

```sh
npm install
npm run dev      # open the printed localhost URL
npm run build    # production build, also the quickest compile check
```

## Controls

| Key   | What it does |
|-------|--------------|
| `[` `]` | previous / next day |
| `V`   | split view (BEFORE vs AFTER) / single view |
| `T`   | single view: turn today's trick on/off live |
| `0`   | trailer: no tricks vs every trick so far |
| `R`   | start / stop recording; the video downloads when you stop |
| `H`   | hide / show the help text (it also hides itself while recording) |

Split view for day N: BEFORE has the tricks from days 1 .. N-1, AFTER also has day N.
So every clip shows exactly what that one day's trick adds.

## Recording

The canvas is 1080x1920 (9:16). `R` records the canvas itself, not your screen, so
the video is always full resolution with no browser UI. Chrome and Safari save MP4.
If a browser only gives WebM, convert it:

```sh
ffmpeg -i clip.webm -c:v libx264 -pix_fmt yuv420p clip.mp4
```

Everything important sits in the middle 1080x1350 (4:5) band. The Instagram feed
crops Reels to exactly that band, and Reels draws its own buttons and captions
above and below it, so one recording works for both.

## Adding tomorrow's lesson

Create `src/lessons/dayNN-short-name.js`. It is picked up automatically:

```js
export default {
    day: 2,
    title: 'Blinking',                        // used in video file names
    headline: 'Big punchy line.\nSecond line.', // top of the screen
    before: 'Caption under BEFORE',
    after: 'Caption under AFTER',
    tagline: 'One sentence explaining\nthe idea.',  // bottom of the screen
    update(creature, time, delta) {
        // Nudge creature.fx: frame, scaleX, scaleY, offsetX, offsetY, rotation.
        // Multiply scales and add offsets so lessons stack instead of overwrite.
    },
};
```

## Creature art (ChatGPT sprite sheets)

Raw sheets from ChatGPT go in `art-source/`. The game only loads
`src/art/creature.png` (+ `.json`), made in two steps:

```sh
# 1. Cut the 4x2 sheet into aligned frames
npm run slice -- art-source/creature-idle-chatgpt.png art-source/creature-idle-sliced.png --grid 4x2

# 2. Keep frame 1's body, paste only the eye from blink frames 4, 5, 6
npm run patch -- art-source/creature-idle-sliced.png src/art/creature.png --base 1 --from 4,5,6 --region 297,179,40,48
```

Result: 4 frames (open, half closed, closed, half closed) with a pixel-identical
body. Step 2 exists because ChatGPT drew every idle frame at a slightly
different size; playing them made the head jump up to 17px. Breathing is done
in code instead (see `src/lessons/day01-idle-animation.js`).

### Step 1: slice

`--grid` is columns x rows of the sheet (frames are read left to right, top to
bottom). The slicer:

- cuts each frame out of its grid cell
- puts the feet of every frame on the same line and lines frames up left to right
  by their silhouettes, so the animation does not jitter
- writes one strip of equal-size frames, feet on the bottom edge and centered,
  plus a `.json` with the frame size that the game reads

It prints a table per frame. `feet gap` and `feet x` should be the same in every
row. `match` below 90% means that frame's shape differs a lot from frame 1
(usually ChatGPT drew it bigger or smaller), so look at it before using it.

### Step 2: patch

`--region` is an ellipse around the part that should animate, in frame pixels:
center x, center y, radius x, radius y. The tool slides each source frame
around until the skin *around* that ellipse matches the base frame, then pastes
just the ellipse. Check the result by eye before using it.

Without `src/art/creature.png` the game draws a placeholder creature.

Prompt rules that make sheets easier to slice: transparent background (real
alpha, not a checkerboard), side view facing right, same size and pose in every
frame, feet on the same baseline, clear empty space between frames, no shadows
or effects.
