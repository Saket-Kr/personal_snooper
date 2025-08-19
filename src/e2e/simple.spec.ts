import { ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'path';
import { _electron as electron } from 'playwright';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
    try {
        // Launch the Electron app with minimal configuration
        app = await electron.launch({
            args: [
                path.join(__dirname, '../../dist/main/main/index.js'),
                '--disable-singleton-lock',
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

    // Check that the app header is present
    await expect(page.locator('.app-header')).toBeVisible();
    
    // Check that the title is present
    await expect(page.locator('.app-header h1')).toContainText('Desktop Activity Tracker');
});
