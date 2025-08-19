/**
 * TypeScript declarations for the electronAPI exposed through the preload script
 * 
 * This interface defines the methods available to the renderer process
 * for communicating with the main process via IPC.
 */
declare global {
    interface Window {
        electronAPI: {
            startMonitoring: () => Promise<{ success: boolean; error?: string }>;
            stopMonitoring: () => Promise<{ success: boolean; error?: string }>;
            getMonitoringStatus: () => Promise<{
                isRunning: boolean;
                stats: {
                    eventsProcessed: number;
                    uptime: number;
                    lastError: string | null;
                };
            }>;
            getSettings: () => Promise<any>;
            updateSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
            onMonitoringStatusChanged: (callback: (status: any) => void) => void;
            // Kafka IPC methods
            invoke: (channel: string, ...args: any[]) => Promise<any>;
            on: (channel: string, callback: (...args: any[]) => void) => void;
        };
    }
}

export {}; 