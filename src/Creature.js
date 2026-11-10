import { CREATURE_HEIGHT } from './layout.js';

/**
 * One creature on screen.
 *
 * Lessons never touch the sprite directly. Every frame:
 *   1. beginFrame() resets `fx` to neutral
 *   2. each enabled lesson nudges `fx` (multiply scale, add offsets)
 *   3. endFrame() applies the combined result to the sprite
 *
 * That way effects stack: idle frames + landing squash + hit shake can all
 * run at once without fighting over the sprite.
 */
export class Creature {
    constructor(scene, x, y, textureKey) {
        this.x = x;
        this.y = y;

        // Feet at the bottom-center, so scaling keeps the creature on the ground.
        this.sprite = scene.add.sprite(x, y, textureKey).setOrigin(0.5, 1);
        this.baseScale = CREATURE_HEIGHT / this.sprite.height;

        // How many animation frames the art has (0 for the single-image placeholder).
        this.frameCount = this.sprite.texture.getFrameNames().length;
        this.shownFrame = 0;

        // Lesson days that are switched on for this creature.
        this.enabled = new Set();

        this.fx = Creature.neutralFx();
        this.endFrame();
    }

    static neutralFx() {
        return { frame: 0, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, rotation: 0 };
    }

    has(day) {
        return this.enabled.has(day);
    }

    beginFrame() {
        this.fx = Creature.neutralFx();
    }

    endFrame() {
        const { fx, sprite, baseScale } = this;
        sprite.setPosition(this.x + fx.offsetX, this.y + fx.offsetY);
        sprite.setScale(baseScale * fx.scaleX, baseScale * fx.scaleY);
        sprite.setRotation(fx.rotation);

        const frame = this.frameCount > 0 ? fx.frame % this.frameCount : 0;
        if (this.frameCount > 0 && frame !== this.shownFrame) {
            sprite.setFrame(frame);
            this.shownFrame = frame;
        }
    }

    setVisible(visible) {
        this.sprite.setVisible(visible);
    }
}
