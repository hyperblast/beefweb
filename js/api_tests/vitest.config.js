import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['./src/*_tests.js'],
        isolate: false,
        bail: 10,
        retry: 1,
        maxConcurrency: 1,
        fileParallelism: false,
        testTimeout: 10000,
        teardownTimeout: 10000,
    }
});
