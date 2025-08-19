import { describe, expect, it } from 'vitest';
import { AppActiveEvent, BrowserTabActiveEvent } from '../../../shared/types';
import { ActiveWindow } from '../../types';
import { formatAppEvent } from '../app-event-formatter';

describe('AppEventFormatter', () => {
    it('should format regular app event correctly', () => {
        const window: ActiveWindow = {
            title: 'My Document',
            id: 123,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: {
                name: 'TextEdit',
                processId: 1234,
                path: '/Applications/TextEdit.app'
            },
            platform: 'macos',
            memoryUsage: 1024
        };

        const event = formatAppEvent(window) as AppActiveEvent;

        expect(event).toMatchObject({
            eventType: 'APP_ACTIVE',
            payload: {
                appName: 'TextEdit',
                processId: 1234,
                appPath: '/Applications/TextEdit.app',
                windowTitle: 'My Document'
            }
        });

        expect(event.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(new Date(event.timestamp)).toBeInstanceOf(Date);
    });

    it('should format browser event with URL', () => {
        const window: ActiveWindow = {
            title: 'GitHub',
            id: 456,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: {
                name: 'Google Chrome',
                processId: 5678,
                path: '/Applications/Google Chrome.app'
            },
            url: 'https://github.com',
            platform: 'macos',
            memoryUsage: 2048
        };

        const event = formatAppEvent(window) as BrowserTabActiveEvent;

        expect(event.eventType).toBe('BROWSER_TAB_ACTIVE');
        expect(event.payload).toMatchObject({
            appName: 'Google Chrome',
            tabTitle: 'GitHub',
            tabUrl: 'https://github.com',
            domain: 'github.com'
        });
    });

    it('should handle missing data gracefully', () => {
        const window: ActiveWindow = {
            title: 'Unknown',
            id: 789,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: {
                name: 'Unknown',
                processId: 0,
                path: ''
            },
            platform: 'macos',
            memoryUsage: 0
        };

        const event = formatAppEvent(window) as AppActiveEvent;

        expect(event.payload.appName).toBe('Unknown');
        expect(event.payload.processId).toBe(0);
        expect(event.payload.appPath).toBe('');
    });

    it('should extract domain from URL correctly', () => {
        const window: ActiveWindow = {
            title: 'Test Page',
            id: 123,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: {
                name: 'Google Chrome',
                processId: 1234,
                path: '/chrome'
            },
            url: 'https://www.example.com/path?param=value',
            platform: 'macos',
            memoryUsage: 1024
        };

        const event = formatAppEvent(window) as BrowserTabActiveEvent;

        expect(event.eventType).toBe('BROWSER_TAB_ACTIVE');
        expect(event.payload.domain).toBe('www.example.com');
    });

    it('should handle invalid URLs gracefully', () => {
        const window: ActiveWindow = {
            title: 'Invalid URL',
            id: 123,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: {
                name: 'Google Chrome',
                processId: 1234,
                path: '/chrome'
            },
            url: 'not-a-valid-url',
            platform: 'macos',
            memoryUsage: 1024
        };

        const event = formatAppEvent(window) as BrowserTabActiveEvent;

        expect(event.eventType).toBe('BROWSER_TAB_ACTIVE');
        expect(event.payload.domain).toBeUndefined();
    });
}); 