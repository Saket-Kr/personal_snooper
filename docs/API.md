# Desktop Activity Tracker API Documentation

## Overview

The Desktop Activity Tracker is an Electron-based application that monitors user activity including active applications, browser tabs, and file system changes. This document provides comprehensive API documentation for developers.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Main Process API](#main-process-api)
3. [Renderer Process API](#renderer-process-api)
4. [Agent Process API](#agent-process-api)
5. [IPC Communication](#ipc-communication)
6. [Data Types](#data-types)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

---

## Architecture Overview

The application follows a multi-process architecture:

```
┌─────────────────┐    IPC    ┌─────────────────┐    IPC    ┌─────────────────┐
│   Renderer      │◄─────────►│   Main Process  │◄─────────►│   Agent Process  │
│   (React UI)    │           │   (Electron)    │           │   (Monitoring)   │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

### Process Responsibilities

- **Renderer Process**: React-based UI, user interactions
- **Main Process**: Window management, IPC coordination, settings persistence
- **Agent Process**: Activity monitoring, event collection, Kafka streaming

---

## Main Process API

### Core Classes

#### SettingsManager

Manages user settings persistence using SQLite.

```typescript
class SettingsManager {
    async load(): Promise<void>
    async updateSettings(newSettings: Partial<UserSettings>): Promise<void>
    getSettings(): UserSettings
    async resetSettings(): Promise<void>
    async close(): Promise<void>
}
```

**Methods:**

- `load()`: Loads settings from SQLite database
- `updateSettings()`: Updates and persists settings
- `getSettings()`: Returns current settings
- `resetSettings()`: Resets to default settings
- `close()`: Closes database connection

#### AgentManager

Manages the monitoring agent child process.

```typescript
class AgentManager extends EventEmitter {
    async start(config: AgentConfig): Promise<void>
    async stop(): Promise<void>
    async updateConfig(config: AgentConfig): Promise<void>
    isRunning(): boolean
    getStats(): AgentStats
}
```

**Methods:**

- `start()`: Starts the monitoring agent
- `stop()`: Stops the monitoring agent
- `updateConfig()`: Updates agent configuration
- `isRunning()`: Returns agent status
- `getStats()`: Returns agent statistics

**Events:**

- `statusChange`: Emitted when agent status changes

---

## Renderer Process API

### React Components

#### App Component

Main application component with tabbed interface.

```typescript
interface AppProps {
    // No props required
}

function App(): JSX.Element
```

#### Settings Component

Settings management interface.

```typescript
interface SettingsProps {
    settings: UserSettings
    onUpdateSettings: (settings: Partial<UserSettings>) => Promise<void>
    isLoading?: boolean
}

function Settings(props: SettingsProps): JSX.Element
```

### Custom Hooks

#### useMonitoring

Manages monitoring state and controls.

```typescript
function useMonitoring(): {
    isRunning: boolean
    stats: MonitoringStats
    start: () => Promise<void>
    stop: () => Promise<void>
}
```

#### useSettings

Manages settings state and persistence.

```typescript
function useSettings(): {
    settings: UserSettings | null
    isLoading: boolean
    error: string | null
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>
    resetSettings: () => Promise<void>
    reloadSettings: () => Promise<void>
}
```

---

## Agent Process API

### Core Classes

#### AppMonitor

Monitors active application windows.

```typescript
class AppMonitor {
    start(): void
    stop(): void
    private checkActiveWindow(): Promise<void>
    private hasWindowChanged(window: ActiveWindow): boolean
}
```

#### FileSystemMonitor

Monitors file system changes.

```typescript
class FileSystemMonitor {
    start(watchPaths: string[], ignorePaths: string[]): void
    stop(): void
    updatePaths(watchPaths?: string[], ignorePaths?: string[]): void
}
```

#### KafkaEmitter

Manages Kafka connection and event streaming.

```typescript
class KafkaEmitter {
    async connect(): Promise<void>
    async disconnect(): Promise<void>
    async sendEvent(event: ActivityEvent): Promise<void>
    private flushBuffer(): Promise<void>
}
```

---

## IPC Communication

### Channel Names

```typescript
enum IpcChannels {
    START_MONITORING = 'start-monitoring',
    STOP_MONITORING = 'stop-monitoring',
    GET_MONITORING_STATUS = 'get-monitoring-status',
    GET_SETTINGS = 'get-settings',
    UPDATE_SETTINGS = 'update-settings',
    MONITORING_STATUS_CHANGED = 'monitoring-status-changed'
}
```

### Message Types

#### Start Monitoring
```typescript
{
    type: 'start',
    config: AgentConfig
}
```

#### Stop Monitoring
```typescript
{
    type: 'stop'
}
```

#### Get Settings
```typescript
{
    type: 'get-settings'
}
```

#### Update Settings
```typescript
{
    type: 'update-settings',
    settings: Partial<UserSettings>
}
```

### Response Types

#### Success Response
```typescript
{
    success: true,
    data?: any
}
```

#### Error Response
```typescript
{
    success: false,
    error: string
}
```

---

## Data Types

### Core Types

#### ActivityEvent
```typescript
interface ActivityEvent {
    eventId: string
    timestamp: string
    userId: string
    eventType: EventType
    payload: AppActiveEventPayload | BrowserTabActiveEventPayload | FileChangeEventPayload
}
```

#### UserSettings
```typescript
interface UserSettings {
    userId: string
    kafkaBroker: string
    watchPaths: string[]
    ignorePaths: string[]
    autoStart: boolean
}
```

#### AgentConfig
```typescript
interface AgentConfig {
    userId: string
    kafkaBroker: string
    watchPaths: string[]
    ignorePaths: string[]
    autoStart: boolean
    pollInterval?: number
}
```

### Event Types

#### AppActiveEvent
```typescript
interface AppActiveEvent extends BaseEvent {
    eventType: 'APP_ACTIVE'
    payload: {
        appName: string
        processId: number
        appPath: string
        windowTitle?: string
    }
}
```

#### BrowserTabActiveEvent
```typescript
interface BrowserTabActiveEvent extends BaseEvent {
    eventType: 'BROWSER_TAB_ACTIVE'
    payload: {
        appName: string
        tabTitle: string
        tabUrl: string
        domain?: string
    }
}
```

#### FileChangeEvent
```typescript
interface FileChangeEvent extends BaseEvent {
    eventType: 'FILE_CHANGED'
    payload: {
        filePath: string
        fileName: string
        fileExtension: string
        directory: string
        changeType: 'CREATED' | 'MODIFIED' | 'DELETED'
        fileSize?: number
    }
}
```

---

## Error Handling

### Error Types

#### AppError
```typescript
class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode?: number
    )
}
```

#### ValidationError
```typescript
class ValidationError extends AppError {
    constructor(message: string)
}
```

#### PermissionError
```typescript
class PermissionError extends AppError {
    constructor(message: string)
}
```

### Error Handling Patterns

#### Try-Catch with Error Classification
```typescript
try {
    await someOperation()
} catch (error) {
    if (isAppError(error)) {
        console.error(`[${error.code}] ${error.message}`)
    } else {
        console.error('Unexpected error:', error)
    }
}
```

#### Graceful Degradation
```typescript
async function loadSettings(): Promise<UserSettings> {
    try {
        return await settingsManager.load()
    } catch (error) {
        console.warn('Failed to load settings, using defaults')
        return DefaultSettings
    }
}
```

---

## Security Considerations

### Input Validation

#### File Path Validation
```typescript
const validation = SecurityValidator.validateFilePath(userPath)
if (!validation.isValid) {
    throw new ValidationError(validation.error!)
}
```

#### URL Sanitization
```typescript
const sanitizedUrl = SecurityValidator.validateUrl(userUrl)
if (!sanitizedUrl.isValid) {
    throw new ValidationError(sanitizedUrl.error!)
}
```

#### Settings Validation
```typescript
const validation = SecurityValidator.validateSettings(settings)
if (!validation.isValid) {
    throw new ValidationError(validation.errors.join(', '))
}
```

### Security Features

1. **Path Traversal Protection**: Validates file paths for `..` sequences
2. **Sensitive File Detection**: Blocks monitoring of sensitive files
3. **URL Sanitization**: Removes sensitive query parameters
4. **Input Length Limits**: Prevents buffer overflow attacks
5. **Protocol Validation**: Only allows safe protocols
6. **Message Size Limits**: Prevents memory exhaustion

### Privacy Protection

1. **Data Localization**: All data stays on user's machine
2. **Sensitive Path Filtering**: Automatically ignores sensitive directories
3. **URL Sanitization**: Removes user credentials from URLs
4. **Secure ID Generation**: Uses cryptographically secure IDs

---

## Performance Considerations

### Memory Management

- Circular buffers for event storage
- Automatic cleanup of old metrics
- Memory usage monitoring
- Garbage collection optimization

### CPU Optimization

- Debounced file system events
- Adaptive polling intervals
- Batch processing for Kafka events
- Worker threads for heavy operations

### Monitoring

```typescript
const metrics = performanceMonitor.recordMetrics()
const warnings = performanceMonitor.getWarnings()
const isAcceptable = performanceMonitor.isPerformanceAcceptable()
```

---

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

---

## Build and Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Distribution
```bash
npm run dist
```

---

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check system permissions for file monitoring
2. **Kafka Connection Failed**: Verify Kafka broker is running
3. **High Memory Usage**: Check for memory leaks in event processing
4. **Settings Not Saving**: Verify database permissions

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Performance Monitoring

Monitor performance metrics:
```typescript
const stats = performanceMonitor.getStats()
console.log('Memory usage:', stats.memoryUsage)
console.log('Processing time:', stats.avgProcessingTime)
```

---

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Run all tests before submitting
5. Follow security best practices

---

## License

This project is licensed under the MIT License. 