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
        };
    }
}

export {}; 