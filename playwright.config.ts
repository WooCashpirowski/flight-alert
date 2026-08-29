import { defineConfig, devices } from '@playwright/test';

const serverCommand =
    process.platform === 'win32'
        ? 'node_modules\\.bin\\vinext.cmd build && node_modules\\.bin\\vinext.cmd start'
        : './node_modules/.bin/vinext build && ./node_modules/.bin/vinext start';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    use: { baseURL: 'http://localhost:3100', trace: 'on-first-retry' },
    projects: [
        { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
        { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: serverCommand,
        url: 'http://localhost:3100',
        env: {
            PORT: '3100',
            NEXT_PUBLIC_SUPABASE_URL: '',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
            SUPABASE_SERVICE_ROLE_KEY: '',
            SERPAPI_API_KEY: '',
        },
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
