import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '../events';
import { AppMonitor } from '../monitors/app-monitor';
import { ActiveWindow } from '../types';

// Mock active-win
vi.mock('active-win');

describe('AppMonitor', () => {
    let monitor: AppMonitor;

    beforeEach(() => {
        vi.useFakeTimers();
        monitor = new AppMonitor(1000); // 1s interval for testing
    });

    afterEach(() => {
        monitor.stop();
        vi.restoreAllMocks();
    });

    it('should emit event when window changes', async () => {
        const activeWin = await import('active-win');
        const mockWindow: ActiveWindow = {
            title: 'Test Window',
            id: 123,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: { name: 'TestApp', processId: 123, path: '/test/app' },
            platform: 'macos',
            memoryUsage: 1024
        };

        vi.mocked(activeWin.default).mockResolvedValue(mockWindow as any);

        const emitSpy = vi.spyOn(eventBus, 'emit');

        monitor.start();

        // Fast-forward timer
        await vi.advanceTimersByTimeAsync(1000);

        expect(emitSpy).toHaveBeenCalledWith('activity', expect.objectContaining({
            eventType: 'APP_ACTIVE',
            payload: expect.objectContaining({
                appName: 'TestApp'
            })
        }));
    });

    it('should detect browser tab changes', async () => {
        const activeWin = await import('active-win');
        const mockBrowserWindow: ActiveWindow = {
            title: 'GitHub',
            id: 456,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: { name: 'Google Chrome', processId: 456, path: '/chrome' },
            url: 'https://github.com',
            platform: 'macos',
            memoryUsage: 2048
        };

        vi.mocked(activeWin.default).mockResolvedValue(mockBrowserWindow as any);

        const emitSpy = vi.spyOn(eventBus, 'emit');

        monitor.start();

        // Fast-forward timer
        await vi.advanceTimersByTimeAsync(1000);

        expect(emitSpy).toHaveBeenCalledWith('activity', expect.objectContaining({
            eventType: 'BROWSER_TAB_ACTIVE',
            payload: expect.objectContaining({
                appName: 'Google Chrome',
                tabTitle: 'GitHub',
                tabUrl: 'https://github.com'
            })
        }));
    });

    it('should not emit event when window has not changed', async () => {
        const activeWin = await import('active-win');
        const mockWindow: ActiveWindow = {
            title: 'Test Window',
            id: 123,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            owner: { name: 'TestApp', processId: 123, path: '/test/app' },
            platform: 'macos',
            memoryUsage: 1024
        };

        vi.mocked(activeWin.default).mockResolvedValue(mockWindow as any);

        const emitSpy = vi.spyOn(eventBus, 'emit');

        monitor.start();

        // First call should emit event
        await vi.advanceTimersByTimeAsync(1000);
        expect(emitSpy).toHaveBeenCalledTimes(1);

        // Second call with same window should not emit
        await vi.advanceTimersByTimeAsync(1000);
        expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
        const activeWin = await import('active-win');
        vi.mocked(activeWin.default).mockRejectedValue(new Error('Test error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        monitor.start();

        // Fast-forward timer
        await vi.advanceTimersByTimeAsync(1000);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[AppMonitor] Error checking active window:',
            expect.any(Error)
        );
    });

    it('should stop monitoring when stop is called', () => {
        const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

        monitor.start();
        monitor.stop();

        expect(clearIntervalSpy).toHaveBeenCalled();
    });
}); 