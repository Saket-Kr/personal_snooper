import sqlite3 from 'sqlite3';
import path from 'path';
import { ActivityEvent } from '../../shared/types';

/**
 * SQLLogger - Manages local SQLite database for event logging
 * 
 * This service handles the connection to a local SQLite database and provides
 * reliable event logging with proper indexing and data management.
 */
export class SQLLogger {
    private db: sqlite3.Database | null = null;
    private dbPath: string;
    private isConnected = false;
    private eventBuffer: ActivityEvent[] = [];
    private flushInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Store database in user's application data directory
        const userDataPath = process.env.APPDATA || 
            (process.platform === 'darwin' ? 
                path.join(process.env.HOME || '', 'Library/Application Support') : 
                path.join(process.env.HOME || '', '.config'));
        
        this.dbPath = path.join(userDataPath, 'desktop-activity-tracker', 'events.db');
    }

    /**
     * Connects to SQLite database and initializes tables
     */
    async connect(): Promise<void> {
        try {
            // Ensure directory exists
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath);
            
            await this.initializeTables();
            this.isConnected = true;
            console.log('[SQLLogger] Connected to SQLite database');
            
            // Start buffer flush interval
            this.startBufferFlush();
            
            // Process any buffered events
            await this.flushBuffer();
        } catch (error) {
            console.error('[SQLLogger] Failed to connect:', error);
            throw error;
        }
    }

    /**
     * Disconnects from SQLite database and cleans up resources
     */
    async disconnect(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }

        // Flush remaining events
        await this.flushBuffer();

        if (this.db) {
            this.db.close();
            this.db = null;
            this.isConnected = false;
            console.log('[SQLLogger] Disconnected from SQLite database');
        }
    }

    /**
     * Logs an activity event to the SQLite database
     * 
     * If connected, adds to buffer for batch insertion.
     * If not connected, buffers the event for later.
     */
    async logEvent(event: ActivityEvent): Promise<void> {
        if (this.isConnected) {
            // Add to buffer for batch insertion
            this.eventBuffer.push(event);
            
            // Flush if buffer is getting large
            if (this.eventBuffer.length >= 50) {
                await this.flushBuffer();
            }
        } else {
            console.warn('[SQLLogger] Not connected, buffering event');
            this.eventBuffer.push(event);
        }
    }

    /**
     * Initializes the database tables
     */
    private async initializeTables(): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            this.db!.serialize(() => {
                // Create events table
                this.db!.run(`
                    CREATE TABLE IF NOT EXISTS events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_id TEXT UNIQUE NOT NULL,
                        timestamp TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        app_name TEXT,
                        process_id INTEGER,
                        app_path TEXT,
                        window_title TEXT,
                        tab_title TEXT,
                        tab_url TEXT,
                        domain TEXT,
                        file_path TEXT,
                        file_name TEXT,
                        file_extension TEXT,
                        directory TEXT,
                        change_type TEXT,
                        file_size INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Create indexes for better query performance
                    this.db!.run(`
                        CREATE INDEX IF NOT EXISTS idx_events_timestamp 
                        ON events(timestamp)
                    `, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        this.db!.run(`
                            CREATE INDEX IF NOT EXISTS idx_events_user_id 
                            ON events(user_id)
                        `, (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            this.db!.run(`
                                CREATE INDEX IF NOT EXISTS idx_events_event_type 
                                ON events(event_type)
                            `, (err) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }

                                resolve();
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * Starts the periodic buffer flush interval
     */
    private startBufferFlush(): void {
        // Flush buffer every 10 seconds
        this.flushInterval = setInterval(async () => {
            if (this.eventBuffer.length > 0) {
                await this.flushBuffer();
            }
        }, 10000);
    }

    /**
     * Flushes the event buffer to SQLite database
     * 
     * This method inserts all buffered events in a single transaction
     * for efficiency. If insertion fails, events are re-added to
     * the buffer for retry.
     */
    private async flushBuffer(): Promise<void> {
        if (this.eventBuffer.length === 0 || !this.isConnected || !this.db) {
            return;
        }

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        return new Promise((resolve) => {
            this.db!.serialize(() => {
                this.db!.run('BEGIN TRANSACTION', (err) => {
                    if (err) {
                        console.error('[SQLLogger] Failed to begin transaction:', err);
                        this.eventBuffer.unshift(...events);
                        resolve();
                        return;
                    }

                    let completed = 0;
                    let hasError = false;

                    events.forEach((event) => {
                        const stmt = this.db!.prepare(`
                            INSERT OR IGNORE INTO events (
                                event_id, timestamp, user_id, event_type,
                                app_name, process_id, app_path, window_title,
                                tab_title, tab_url, domain,
                                file_path, file_name, file_extension, directory, change_type, file_size
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);

                        const values = [
                            event.eventId,
                            event.timestamp,
                            event.userId,
                            event.eventType,
                            this.getAppName(event),
                            this.getProcessId(event),
                            this.getAppPath(event),
                            this.getWindowTitle(event),
                            this.getTabTitle(event),
                            this.getTabUrl(event),
                            this.getDomain(event),
                            this.getFilePath(event),
                            this.getFileName(event),
                            this.getFileExtension(event),
                            this.getDirectory(event),
                            this.getChangeType(event),
                            this.getFileSize(event)
                        ];

                        stmt.run(values, (err) => {
                            if (err && !hasError) {
                                console.error('[SQLLogger] Failed to insert event:', err);
                                hasError = true;
                            }
                            
                            completed++;
                            if (completed === events.length) {
                                if (hasError) {
                                    this.db!.run('ROLLBACK', () => {
                                        this.eventBuffer.unshift(...events);
                                        resolve();
                                    });
                                } else {
                                    this.db!.run('COMMIT', () => {
                                        console.log(`[SQLLogger] Logged ${events.length} events`);
                                        resolve();
                                    });
                                }
                            }
                        });

                        stmt.finalize();
                    });
                });
            });
        });
    }

    /**
     * Helper methods to extract data from different event types
     */
    private getAppName(event: ActivityEvent): string | null {
        if (event.eventType === 'APP_ACTIVE' || event.eventType === 'BROWSER_TAB_ACTIVE') {
            return event.payload.appName;
        }
        return null;
    }

    private getProcessId(event: ActivityEvent): number | null {
        if (event.eventType === 'APP_ACTIVE') {
            return event.payload.processId;
        }
        return null;
    }

    private getAppPath(event: ActivityEvent): string | null {
        if (event.eventType === 'APP_ACTIVE') {
            return event.payload.appPath;
        }
        return null;
    }

    private getWindowTitle(event: ActivityEvent): string | null {
        if (event.eventType === 'APP_ACTIVE') {
            return event.payload.windowTitle || null;
        }
        return null;
    }

    private getTabTitle(event: ActivityEvent): string | null {
        if (event.eventType === 'BROWSER_TAB_ACTIVE') {
            return event.payload.tabTitle;
        }
        return null;
    }

    private getTabUrl(event: ActivityEvent): string | null {
        if (event.eventType === 'BROWSER_TAB_ACTIVE') {
            return event.payload.tabUrl;
        }
        return null;
    }

    private getDomain(event: ActivityEvent): string | null {
        if (event.eventType === 'BROWSER_TAB_ACTIVE') {
            return event.payload.domain || null;
        }
        return null;
    }

    private getFilePath(event: ActivityEvent): string | null {
        if (event.eventType === 'FILE_CHANGED') {
            return event.payload.filePath;
        }
        return null;
    }

    private getFileName(event: ActivityEvent): string | null {
        if (event.eventType === 'FILE_CHANGED') {
            return event.payload.fileName;
        }
        return null;
    }

    private getFileExtension(event: ActivityEvent): string | null {
        if (event.eventType === 'FILE_CHANGED') {
            return event.payload.fileExtension;
        }
        return null;
    }

    private getDirectory(event: ActivityEvent): string | null {
        if (event.eventType === 'FILE_CHANGED') {
            return event.payload.directory;
        }
        return null;
    }

    private getChangeType(event: ActivityEvent): string | null {
        if (event.eventType === 'FILE_CHANGED') {
            return event.payload.changeType;
        }
        return null;
    }

    private getFileSize(event: ActivityEvent): number | null {
        if (event.eventType === 'FILE_CHANGED') {
            return event.payload.fileSize || null;
        }
        return null;
    }
}
