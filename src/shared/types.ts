export interface BaseEvent {
    eventId: string;      // UUID v4
    timestamp: string;    // ISO 8601 format
    userId: string;       // User identifier
    eventType: EventType; // Discriminator
}

export type EventType =
    | 'APP_ACTIVE'
    | 'BROWSER_TAB_ACTIVE'
    | 'FILE_CHANGED';

export interface AppActiveEvent extends BaseEvent {
    eventType: 'APP_ACTIVE';
    payload: {
        appName: string;
        processId: number;
        appPath: string;
        windowTitle?: string;
    };
}

export interface BrowserTabActiveEvent extends BaseEvent {
    eventType: 'BROWSER_TAB_ACTIVE';
    payload: {
        appName: string;
        tabTitle: string;
        tabUrl: string;
        domain?: string;
    };
}

export interface FileChangeEvent extends BaseEvent {
    eventType: 'FILE_CHANGED';
    payload: {
        filePath: string;
        fileName: string;
        fileExtension: string;
        directory: string;
        changeType: 'CREATED' | 'MODIFIED' | 'DELETED';
        fileSize?: number;
    };
}

export type ActivityEvent =
    | AppActiveEvent
    | BrowserTabActiveEvent
    | FileChangeEvent;

export interface AgentConfig {
    userId: string;
    kafkaBroker: string;
    watchPaths: string[];
    ignorePaths: string[];
    autoStart: boolean;
    pollInterval?: number;
}

export interface UserSettings {
    userId: string;
    kafkaBroker: string;
    watchPaths: string[];
    ignorePaths: string[];
    autoStart: boolean;
    enableAppMonitoring: boolean;
    enableFileMonitoring: boolean;
    enableBrowserMonitoring: boolean;
}

export interface DefaultSettings extends UserSettings {
    userId: string;
    kafkaBroker: string;
    watchPaths: string[];
    ignorePaths: string[];
    autoStart: boolean;
}

export interface MonitoringStatus {
    isRunning: boolean;
    stats: {
        eventsProcessed: number;
        uptime: number;
        lastError: string | null;
    };
}

export interface PermissionStatus {
    screenRecording: boolean;
    accessibility: boolean;
    fileSystem: boolean;
}

export interface PermissionInfo {
    screenRecording: {
        required: boolean;
        granted: boolean;
        instructions: string;
    };
    accessibility: {
        required: boolean;
        granted: boolean;
        instructions: string;
    };
    fileSystem: {
        required: boolean;
        granted: boolean;
        instructions: string;
    };
} 