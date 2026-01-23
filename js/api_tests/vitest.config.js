import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['./src/*_tests.js'],
        isolate: false,
        bail: 10,
        retry: 0,
        maxConcurrency: 1,
        fileParallelism: false
    }
});
