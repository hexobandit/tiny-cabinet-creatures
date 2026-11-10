# CLAUDE.md

Daily game-feel lesson playground (Phaser 4.2.1 + Vite). See README.md for what it is and how it works.

## Rules

- Stay inside this folder. Do not read or reuse code from other projects on this machine.
- Phaser is **v4**. Many v3 examples online are wrong for v4 (e.g. `setTintFill` is gone,
  `Math.TAU` changed value, `roundPixels` defaults to false). Before using any Phaser API,
  check it against the docs that ship with the installed version:
  - `node_modules/phaser/skills/<topic>/SKILL.md` - official v4 guides per topic
    (start with `v3-to-v4-migration` and `v4-new-features`)
  - `node_modules/phaser/types/phaser.d.ts` - exact signatures
  - `node_modules/phaser/docs/` - rendering, pixel art and shader guides
- Lesson code is shown in videos, so keep it short, readable and hand-written. Do not hide
  the lesson's idea behind a built-in helper (e.g. write the screen shake by hand on the
  shake day, instead of calling `camera.shake`).
- Lessons only change `creature.fx` (pick a frame, multiply scales, add offsets), never the
  sprite directly, so effects from different days stack.
- Animation frames come from the user's ChatGPT sheets. Play those frames for animation;
  don't fake animation with code scaling when real frames exist. Exception the user agreed
  to: smooth continuous motion (Day 1 breathing) is done in code when the AI frames are too
  inconsistent to play smoothly. Always say plainly which part is frames and which is code.

## Verify before done

1. `npm run build` passes.
2. Run `npm run dev`, open the page, and check the console has no errors.
3. Look at the new lesson in split view (BEFORE vs AFTER) and confirm the difference is visible.
