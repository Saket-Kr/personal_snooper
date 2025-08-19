import { UserSettings } from './types';

export const IpcChannels = {
    START_MONITORING: 'start-monitoring',
    STOP_MONITORING: 'stop-monitoring',
    GET_MONITORING_STATUS: 'get-monitoring-status',
    MONITORING_STATUS_CHANGED: 'monitoring-status-changed',
    GET_SETTINGS: 'get-settings',
    UPDATE_SETTINGS: 'update-settings',
    CHECK_PERMISSIONS: 'check-permissions',
    OPEN_SYSTEM_PREFERENCES: 'open-system-preferences'
} as const;

export const KafkaTopics = {
    USER_ACTIVITY_EVENTS: 'user-activity-events'
} as const;

export const DefaultSettings: UserSettings = {
    autoStart: false,
    watchPaths: [],
    ignorePaths: [
        'node_modules',
        '.git',
        '.DS_Store',
        '*.tmp',
        '*.log'
    ],
    kafkaBroker: 'localhost:9092',
    userId: 'default-user',
    enableAppMonitoring: true,
    enableFileMonitoring: true,
    enableBrowserMonitoring: true
};

export const AppConstants = {
    POLL_INTERVAL: 2000, // 2 seconds
    BUFFER_FLUSH_INTERVAL: 5000, // 5 seconds
    MAX_BUFFER_SIZE: 100,
    MAX_RESTART_ATTEMPTS: 3
} as const; 