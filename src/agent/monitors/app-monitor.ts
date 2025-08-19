import activeWin from 'active-win';
import { eventBus } from '../events';
import { formatAppEvent } from '../formatters/app-event-formatter';
import { ActiveWindow } from '../types';

/**
 * AppMonitor - Detects active application and browser tab changes
 * 
 * This monitor polls the system for active window information and
 * detects when the user switches between applications or browser tabs.
 * It uses the active-win library for cross-platform compatibility.
 */
export class AppMonitor {
    private intervalId: NodeJS.Timeout | null = null;
    private lastWindow: ActiveWindow | null = null;
    private pollInterval: number;

    constructor(pollInterval = 2000) {
        this.pollInterval = pollInterval;
    }

    /**
     * Starts monitoring for active window changes
     */
    start(): void {
        if (this.intervalId) {
            console.warn('[AppMonitor] Already running');
            return;
        }

        console.log(`[AppMonitor] Starting with ${this.pollInterval}ms interval`);
        
        // Check immediately on start
        this.checkActiveWindow();
        
        // Then poll at interval
        this.intervalId = setInterval(() => {
            this.checkActiveWindow();
        }, this.pollInterval);
    }

    /**
     * Stops monitoring and cleans up resources
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.lastWindow = null;
            console.log('[AppMonitor] Stopped');
        }
    }

    /**
     * Checks for active window changes and emits events when detected
     */
    private async checkActiveWindow(): Promise<void> {
        try {
            const window = await activeWin();
            
            if (!window) {
                console.debug('[AppMonitor] No active window detected');
                return;
            }

            // Check if window has changed
            if (this.hasWindowChanged(window)) {
                console.log('[AppMonitor] Window changed:', window.title);
                
                const event = formatAppEvent(window);
                eventBus.emit('activity', event);
                
                this.lastWindow = window;
            }
        } catch (error) {
            console.error('[AppMonitor] Error checking active window:', error);
        }
    }

    /**
     * Determines if the active window has changed since last check
     * 
     * For browsers, we check URL changes too. For other apps, we check
     * window title and process name changes.
     */
    private hasWindowChanged(window: ActiveWindow): boolean {
        if (!this.lastWindow) return true;
        
        // For browsers, check URL changes too
        if (this.isBrowser(window)) {
            return this.lastWindow.url !== window.url ||
                   this.lastWindow.title !== window.title ||
                   this.lastWindow.owner?.name !== window.owner?.name;
        }
        
        // For other apps, check window title and process name
        return this.lastWindow.title !== window.title ||
               this.lastWindow.owner?.name !== window.owner?.name;
    }

    /**
     * Determines if the window belongs to a supported browser
     */
    private isBrowser(window: ActiveWindow): boolean {
        const browserNames = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Brave'];
        return browserNames.some(name => 
            window.owner?.name.includes(name)
        );
    }
} 