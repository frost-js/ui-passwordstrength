import process from 'node:process';
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

process.env.FROST_UI_PASSWORDSTRENGTH_COVERAGE = 'true';

const normalizePath = (filePath) => filePath.replaceAll('\\', '/');
const sourceMapUrl = new URL('./dist/frost-ui-passwordstrength.js.map', import.meta.url).href;

export default defineConfig({
    ...baseConfig,
    projects: [
        {
            name: 'coverage',
            use: {
                browserName: 'chromium',
            },
        },
    ],
    reporter: [
        ['line'],
        [
            'monocart-reporter',
            {
                name: 'Frost UI PasswordStrength Coverage',
                outputFile: './test-results/coverage/index.html',
                coverage: {
                    name: 'Frost UI PasswordStrength Source Coverage',
                    outputDir: './coverage',
                    reports: [
                        'console-summary',
                        'html',
                        'lcovonly',
                    ],
                    entryFilter: (entry) => normalizePath(entry.url).endsWith('/assets/frost-ui-passwordstrength.js'),
                    sourceFilter: (sourcePath) => {
                        const normalizedPath = normalizePath(sourcePath);

                        // The browser entry only re-exports the component, so bundling
                        // erases it and V8 cannot associate runtime ranges with the file.
                        return normalizedPath.startsWith('src/') &&
                            normalizedPath !== 'src/browser.js';
                    },
                    sourceMapResolver: (_url, defaultResolver) => defaultResolver(sourceMapUrl),
                    all: './src',
                },
            },
        ],
    ],
});
