import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE ?? 'data/credentials/.env.credentials' });

const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'https://the-internet.herokuapp.com';
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://dummyjson.com';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { detail: true, suiteTitle: false }]
  ],
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  metadata: {
    webBaseUrl: WEB_BASE_URL,
    apiBaseUrl: API_BASE_URL
  },
  projects: [
    {
      name: 'web-chromium',
      testDir: './tests/web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE_URL
      }
    },
    {
      name: 'web-firefox',
      testDir: './tests/web',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: WEB_BASE_URL
      }
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: API_BASE_URL
      }
    }
  ]
});
