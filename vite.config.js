import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        // Phaser alone is ~1.3 MB minified; that is expected, not a problem.
        chunkSizeWarningLimit: 2000,
    },
});
