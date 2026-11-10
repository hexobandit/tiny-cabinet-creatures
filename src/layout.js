// Canvas size and the spots where things sit on it.
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Everything important sits in the middle 1080x1350 (4:5) band of the 9:16
// canvas. The Instagram feed crops Reels to exactly this band, and Reels draws
// its own buttons and captions above and below it. So one video works for both.
export const SAFE_TOP = (HEIGHT - 1350) / 2; // 285

export const CENTER_X = WIDTH / 2;
export const SPLIT_LEFT_X = 295;
export const SPLIT_RIGHT_X = 785;

// Vertical position (center line) of each row of the layout.
export const Y = {
    header: SAFE_TOP + 40,
    dayBadge: SAFE_TOP + 130,
    headline: SAFE_TOP + 310,
    labels: SAFE_TOP + 500,
    ground: SAFE_TOP + 965, // where the creatures' feet are
    caption: SAFE_TOP + 1020,
    tagline: SAFE_TOP + 1190,
    help: 1730, // outside the safe band; hidden while recording anyway
};

export const GROUND_Y = Y.ground;

// Creature height on screen, in pixels. Any sprite is scaled to this.
// 380 = the idle frame height, so the pixel art shows at exactly 1:1 (sharpest).
export const CREATURE_HEIGHT = 380;
