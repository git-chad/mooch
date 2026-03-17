import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/__tests__/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@mooch/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
            '@mooch/db/server': path.resolve(__dirname, '../../packages/db/src/server.ts'),
            '@mooch/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
            '@mooch/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
            '@mooch/stores': path.resolve(__dirname, '../../packages/stores/src/index.ts'),
        },
    },
});
