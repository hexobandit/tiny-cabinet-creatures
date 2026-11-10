import Phaser from 'phaser';
import { Creature } from '../Creature.js';
import { Recorder } from '../Recorder.js';
import { LESSONS } from '../lessons/index.js';
import { makePlaceholderCreature } from '../placeholderArt.js';
import { CENTER_X, SPLIT_LEFT_X, SPLIT_RIGHT_X, GROUND_Y, Y } from '../layout.js';
import { COLORS, FONT, css } from '../theme.js';
import { pixelArt, pixelFrame, goldRule, motionMarks, SPARKLE } from '../ui.js';

// The creature's frames, made from the ChatGPT sheet (see README "Creature art").
// Without them a placeholder creature is drawn. A glob over a missing file is
// just empty, so there is no 404 in the console.
const SHEET_URL = Object.values(
    import.meta.glob('../art/creature.png', { eager: true, query: '?url', import: 'default' }),
)[0];
const SHEET_INFO = Object.values(
    import.meta.glob('../art/creature.json', { eager: true, import: 'default' }),
)[0];

const BRAND = 'TINY CABINET CREATURES';
const LABEL_WIDTH = 290;
const LABEL_HEIGHT = 62;

const HELP = [
    '[ ]  previous / next day     V  split / single view',
    'T  toggle today\'s trick (single)     0  flat vs all tricks',
    'R  record video     H  hide help',
].join('\n');

/**
 * The lesson playground.
 *
 * Split view (default) is the "before vs after" shot for day N:
 *   BEFORE has every trick from days 1 .. N-1
 *   AFTER  has every trick from days 1 .. N
 * So each video only shows the difference that day's trick makes.
 */
export class Playground extends Phaser.Scene {
    constructor() {
        super('Playground');
    }

    preload() {
        if (SHEET_URL && SHEET_INFO) {
            // A sprite using this texture shows frame 0 unless told otherwise.
            this.load.spritesheet('creature', SHEET_URL, {
                frameWidth: SHEET_INFO.frameWidth,
                frameHeight: SHEET_INFO.frameHeight,
            });
        }
    }

    create() {
        if (!this.textures.exists('creature')) {
            makePlaceholderCreature(this, 'creature');
        }

        this.state = {
            focusIndex: LESSONS.length - 1, // newest lesson
            view: 'split',                  // 'split' | 'single'
            trailer: false,                 // 0 key: no tricks vs every trick
            focusOn: true,                  // T key, single view only
            showHelp: true,
        };

        // All the pixel decorations live in one Graphics, redrawn when the layout changes.
        this.decor = this.add.graphics();
        this.before = new Creature(this, SPLIT_LEFT_X, GROUND_Y, 'creature');
        this.after = new Creature(this, SPLIT_RIGHT_X, GROUND_Y, 'creature');
        this.makeTexts();

        this.recorder = new Recorder(this.game.canvas, document.getElementById('rec'));
        this.input.keyboard.on('keydown', (event) => this.onKey(event.key.toLowerCase()));

        this.applyState();
    }

    update(time, delta) {
        for (const creature of [this.before, this.after]) {
            creature.beginFrame();
            for (const lesson of LESSONS) {
                if (creature.has(lesson.day)) lesson.update(creature, time, delta);
            }
            creature.endFrame();
        }
    }

    onKey(key) {
        const s = this.state;
        const last = LESSONS.length - 1;

        if (key === '[') s.focusIndex = Math.max(0, s.focusIndex - 1);
        else if (key === ']') s.focusIndex = Math.min(last, s.focusIndex + 1);
        else if (key === 'v') s.view = s.view === 'split' ? 'single' : 'split';
        else if (key === 't') s.focusOn = !s.focusOn;
        else if (key === '0') s.trailer = !s.trailer;
        else if (key === 'h') s.showHelp = !s.showHelp;
        else if (key === 'r') this.toggleRecording();
        else return;

        if (key === '[' || key === ']') s.trailer = false;
        this.applyState();
    }

    toggleRecording() {
        if (this.recorder.isRecording) {
            this.recorder.stop();
            return;
        }
        const s = this.state;
        const lesson = LESSONS[s.focusIndex];
        const name = s.trailer
            ? 'trailer-flat-vs-all'
            : `day${pad(lesson.day)}-${slug(lesson.title)}-${s.view}`;
        this.recorder.start(name);
    }

    /** Works out which tricks each creature has, then updates layout and text. */
    applyState() {
        const s = this.state;
        const focus = LESSONS[s.focusIndex];
        const split = s.view === 'split';
        const upTo = (day) => LESSONS.filter((l) => l.day <= day).map((l) => l.day);

        if (s.trailer) {
            this.before.enabled = new Set();
            this.after.enabled = new Set(LESSONS.map((l) => l.day));
        } else {
            this.before.enabled = new Set(upTo(focus.day - 1));
            this.after.enabled = new Set(upTo(focus.day));
            if (!split && !s.focusOn) this.after.enabled.delete(focus.day);
        }

        this.before.setVisible(split);
        this.after.x = split ? SPLIT_RIGHT_X : CENTER_X;

        const count = LESSONS.length;
        const copy = s.trailer
            ? {
                day: `DAY 01-${pad(LESSONS.at(-1).day)}`,
                headline: 'Same sprite.\nEvery trick.',
                before: 'No tricks',
                after: `${count} trick${count === 1 ? '' : 's'}`,
                tagline: 'One small trick\nevery day.',
            }
            : { ...focus, day: `DAY ${pad(focus.day)}` };

        // In single view the one creature is either ON (after) or OFF (before).
        const afterOn = split || s.trailer || s.focusOn;

        this.dayText.setText(copy.day);
        this.headlineText.setText(copy.headline);
        this.taglineText.setText(copy.tagline);

        this.beforeLabel.setPosition(SPLIT_LEFT_X, Y.labels).setVisible(split);
        this.beforeCaption.setText(copy.before).setPosition(SPLIT_LEFT_X, Y.caption).setVisible(split);

        this.afterLabel
            .setText(split ? 'AFTER' : afterOn ? 'ON' : 'OFF')
            .setPosition(this.after.x, Y.labels);
        this.afterCaption
            .setText(afterOn ? copy.after : copy.before)
            .setPosition(this.after.x, Y.caption);

        this.helpText.setVisible(s.showHelp && !this.recorder.isRecording);
        this.drawDecor(split, afterOn);
    }

    drawDecor(split, afterOn) {
        const g = this.decor;
        g.clear();

        // Header: brand name between two gold rules.
        const brandHalf = this.headerText.width / 2;
        for (const side of [-1, 1]) {
            goldRule(g, CENTER_X + side * (brandHalf + 26), Y.header, 120, side);
        }

        // DAY badge with a sparkle on each side.
        const badgeWidth = this.dayText.width + 96;
        pixelFrame(g, CENTER_X, Y.dayBadge, badgeWidth, 72, COLORS.gold);
        for (const side of [-1, 1]) {
            pixelArt(g, CENTER_X + side * (badgeWidth / 2 + 56), Y.dayBadge, SPARKLE, { '#': COLORS.gold });
        }

        // BEFORE / AFTER label frames.
        if (split) pixelFrame(g, SPLIT_LEFT_X, Y.labels, LABEL_WIDTH, LABEL_HEIGHT, COLORS.lavender);
        pixelFrame(g, this.after.x, Y.labels, LABEL_WIDTH, LABEL_HEIGHT, afterOn ? COLORS.lime : COLORS.red);
        if (afterOn) motionMarks(g, this.after.x + 150, GROUND_Y - 300, COLORS.lime);

        // Tagline: gold rules ending in sprouts.
        const taglineHalf = this.taglineText.width / 2;
        for (const side of [-1, 1]) {
            goldRule(g, CENTER_X + side * (taglineHalf + 28), Y.tagline, 80, side, 'sprout');
        }
    }

    makeTexts() {
        const cream = css(COLORS.cream);
        const text = (y, size, color, extra = {}) =>
            this.add.text(CENTER_X, y, '', {
                fontFamily: FONT, fontSize: `${size}px`, fontStyle: '800', color, ...extra,
            }).setOrigin(0.5);

        this.headerText = text(Y.header, 30, cream, { letterSpacing: 7 }).setText(BRAND);
        this.dayText = text(Y.dayBadge, 46, css(COLORS.gold), { fontStyle: '900', letterSpacing: 2 });
        this.headlineText = text(Y.headline, 100, cream, { fontStyle: '900', align: 'center', lineSpacing: -14 });

        const label = { fontStyle: '900', letterSpacing: 5 };
        this.beforeLabel = text(Y.labels, 38, css(COLORS.lavender), label).setText('BEFORE');
        this.afterLabel = text(Y.labels, 38, cream, label);

        // Italic leans out of its box; padding keeps the last letter from being clipped.
        const caption = { fontStyle: 'italic 800', padding: { x: 12, y: 4 } };
        this.beforeCaption = text(Y.caption, 46, cream, caption);
        this.afterCaption = text(Y.caption, 46, cream, caption);

        this.taglineText = text(Y.tagline, 58, cream, { align: 'center', lineSpacing: -8 });
        this.helpText = text(Y.help, 26, css(COLORS.muted), { align: 'center' }).setText(HELP);
    }
}

const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
