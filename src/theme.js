// Colors and font for the whole screen.
export const FONT = 'Nunito, system-ui, sans-serif';

export const COLORS = {
    background: 0x1d1a2b,
    cream: 0xf6e9cf,
    gold: 0xdcab48,
    lavender: 0xa39bbb,
    lime: 0xa8e04e,
    red: 0xe5534b,
    leaf: 0x8fc93a,
    stem: 0x5f8f2a,
    muted: 0x5d5873,
};

/** 0xf6e9cf -> '#f6e9cf' (Graphics wants numbers, Text wants CSS strings). */
export const css = (color) => `#${color.toString(16).padStart(6, '0')}`;
