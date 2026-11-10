/**
 * Draws a simple stand-in creature so the playground works before any real art
 * exists. Drop a PNG at public/sprites/creature.png and it is used instead.
 */
export function makePlaceholderCreature(scene, key) {
    const w = 260;
    const h = 280;
    const g = scene.add.graphics();

    // Feet
    g.fillStyle(0x8a4b1f);
    g.fillRoundedRect(62, h - 34, 50, 34, 12);
    g.fillRoundedRect(w - 112, h - 34, 50, 34, 12);

    // Body
    g.fillStyle(0xe8a33d);
    g.fillRoundedRect(20, 20, w - 40, h - 46, 70);

    // Belly
    g.fillStyle(0xf6d28b);
    g.fillEllipse(w / 2, h - 90, 120, 90);

    // Eyes
    g.fillStyle(0xffffff);
    g.fillCircle(92, 100, 30);
    g.fillCircle(w - 92, 100, 30);
    g.fillStyle(0x1d1b26);
    g.fillCircle(100, 104, 14);
    g.fillCircle(w - 84, 104, 14);

    // Horns
    g.fillStyle(0x8a4b1f);
    g.fillTriangle(60, 40, 84, 0, 100, 34);
    g.fillTriangle(w - 60, 40, w - 84, 0, w - 100, 34);

    g.generateTexture(key, w, h);
    g.destroy();
}
