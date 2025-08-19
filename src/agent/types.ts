/**
 * ActiveWindow - Represents the currently active window
 * 
 * This interface matches the structure returned by the active-win library
 * and includes all the information we need for activity tracking.
 */
export interface ActiveWindow {
    title: string;
    id: number;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    owner: {
        name: string;
        processId: number;
        path: string;
    };
    url?: string; // Only present for browser windows
    platform: 'macos' | 'linux' | 'windows';
    memoryUsage: number;
} 