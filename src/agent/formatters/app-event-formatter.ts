import { v4 as uuidv4 } from 'uuid';
import { ActiveWindow } from '../types';
import { AppActiveEvent, BrowserTabActiveEvent } from '../../shared/types';

/**
 * Formats raw window data into standardized activity events
 * 
 * This function takes the raw window information from active-win
 * and converts it into our standardized event format. It handles
 * both regular applications and browser tabs differently.
 */
export function formatAppEvent(window: ActiveWindow): AppActiveEvent | BrowserTabActiveEvent {
    const baseEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        userId: process.env.USER_ID || 'default-user'
    };

    // Check if it's a browser
    const browserNames = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Brave'];
    const isBrowser = browserNames.some(name => 
        window.owner?.name.includes(name)
    );

    if (isBrowser && window.url) {
        return {
            ...baseEvent,
            eventType: 'BROWSER_TAB_ACTIVE',
            payload: {
                appName: window.owner?.name || 'Unknown Browser',
                tabTitle: window.title || 'Unknown Tab',
                tabUrl: window.url,
                domain: extractDomain(window.url)
            }
        };
    }

    return {
        ...baseEvent,
        eventType: 'APP_ACTIVE',
        payload: {
            appName: window.owner?.name || 'Unknown',
            processId: window.owner?.processId || 0,
            appPath: window.owner?.path || '',
            windowTitle: window.title
        }
    };
}

/**
 * Extracts the domain from a URL for browser events
 */
function extractDomain(url: string): string | undefined {
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    } catch {
        return undefined;
    }
} 