import Phaser from 'phaser';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/800-italic.css';
import '@fontsource/nunito/900.css';
import { Playground } from './scenes/Playground.js';
import { WIDTH, HEIGHT } from './layout.js';
import { COLORS, css } from './theme.js';

// Phaser draws text onto a canvas and cannot wait for a web font, so load the
// fonts first. Otherwise the first frames show a fallback font.
await Promise.all([
    document.fonts.load('800 40px Nunito'),
    document.fonts.load('italic 800 40px Nunito'),
    document.fonts.load('900 40px Nunito'),
]);

const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    backgroundColor: css(COLORS.background),
    scale: {
        // Vertical 9:16 canvas, the native size for Reels / X video.
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: WIDTH,
        height: HEIGHT,
    },
    render: {
        // Keeps the last frame readable so the recorder never grabs a blank frame.
        preserveDrawingBuffer: true,
    },
    scene: [Playground],
});

// Handy for poking at the game from the browser console while developing.
if (import.meta.env.DEV) window.game = game;
