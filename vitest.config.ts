import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
                  exclude: [
        'node_modules/',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/e2e/**',
        'playwright.config.ts'
      ],
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
}); 