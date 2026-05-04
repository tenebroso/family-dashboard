import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const root = path.join(__dirname, '..')

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  reporter: 'html',
  webServer: [
    {
      command: `npm run dev --workspace=client`,
      cwd: root,
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `npm run dev --workspace=server`,
      cwd: root,
      url: 'http://localhost:4000/graphql',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
})
