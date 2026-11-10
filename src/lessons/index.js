/**
 * Every file named lessons/dayNN-*.js is picked up automatically.
 * Adding tomorrow's lesson = adding one new file.
 *
 * A lesson file exports:
 *   day       number, its place in the series
 *   title     short name, used for video file names
 *   headline  big text at the top (use \n for a second line)
 *   before    caption under the BEFORE creature
 *   after     caption under the AFTER creature
 *   tagline   one sentence at the bottom explaining the idea
 *   update(creature, time, delta)  nudges creature.fx every frame
 */
const modules = import.meta.glob('./day*.js', { eager: true, import: 'default' });

export const LESSONS = Object.values(modules).sort((a, b) => a.day - b.day);
