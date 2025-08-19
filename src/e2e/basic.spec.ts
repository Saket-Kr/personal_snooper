import { ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'path';
import { _electron as electron } from 'playwright';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
    try {
        // Launch the Electron app with proper configuration for testing
        app = await electron.launch({
            args: [
                path.join(__dirname, '../../dist/main/main/index.js'),
                '--disable-singleton-lock', // Disable singleton lock for testing
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
            env: {
                NODE_ENV: 'test'
            }
        });

        // Wait for the app to be ready
        page = await app.firstWindow();

        // Wait for the app to load completely
        await page.waitForLoadState('domcontentloaded');

        // Additional wait for React to render
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error('Failed to launch Electron app:', error);
        throw error;
    }
});

test.afterAll(async () => {
    if (app) {
        try {
            await app.close();
        } catch (error) {
            console.error('Error closing app:', error);
        }
    }
});

test('should load the application successfully', async () => {
    // Wait for the app to be fully loaded
    await page.waitForSelector('.app-header', { timeout: 30000 });

    // Wait for the app to load
    await expect(page.locator('.app-header h1')).toContainText('Desktop Activity Tracker');

    // Check that navigation tabs are present
    await expect(page.locator('.nav-button')).toHaveCount(2);
    await expect(page.locator('.nav-button').first()).toContainText('Dashboard');
    await expect(page.locator('.nav-button').last()).toContainText('Settings');
});

test('should display initial monitoring status', async () => {
    // Wait for the status element to be present
    await page.waitForSelector('.status', { timeout: 30000 });

    // Check initial status
    await expect(page.locator('.status')).toContainText('Monitoring Stopped');

    // Check control button
    await expect(page.locator('.control-button')).toContainText('Start Monitoring');

    // Check statistics section
    await expect(page.locator('.stats-section h3')).toContainText('Statistics');
    await expect(page.locator('.stats-section')).toContainText('Events processed: 0');
}); 