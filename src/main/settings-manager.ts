import path from 'path';
import sqlite3 from 'sqlite3';
import { UserSettings } from '../shared/types';
import { generateUserId } from '../shared/utils';

// Default settings
const DefaultSettings: UserSettings = {
    userId: 'default-user',
    kafkaBroker: 'localhost:9092',
    watchPaths: [],
    ignorePaths: ['node_modules', '.git', '.DS_Store', '*.tmp', '*.log'],
    autoStart: false,
    enableAppMonitoring: true,
    enableFileMonitoring: true,
    enableBrowserMonitoring: true
};

// Database row interface
interface SettingsRow {
    key: string;
    value: string;
}

/**
 * SettingsManager - Handles user settings persistence and management
 * 
 * This class manages user settings using SQLite for local storage.
 * It provides methods to load, save, and update settings with proper
 * validation and default value handling.
 */
export class SettingsManager {
    private db: sqlite3.Database | null = null;
    private settings: UserSettings = DefaultSettings;
    private dbPath: string;

    constructor() {
        const userDataPath = process.env.APPDATA ||
            (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share');
        this.dbPath = path.join(userDataPath, 'desktop-activity-tracker', 'settings.db');
    }

    /**
     * Initializes the database and loads settings
     */
    async load(): Promise<void> {
        try {
            console.log('[SettingsManager] Loading settings from:', this.dbPath);

            // Ensure directory exists
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Initialize database
            await this.initDatabase();

            // Load settings from database
            await this.loadSettings();

            console.log('[SettingsManager] Settings loaded successfully');
        } catch (error) {
            console.error('[SettingsManager] Failed to load settings:', error);
            // Use default settings if loading fails
            this.settings = { ...DefaultSettings };
        }
    }

    /**
     * Updates settings and persists to database
     */
    async updateSettings(newSettings: Partial<UserSettings>): Promise<void> {
        try {
            console.log('[SettingsManager] Updating settings:', newSettings);

            // Merge with existing settings
            this.settings = { ...this.settings, ...newSettings };

            // Validate settings
            this.validateSettings(this.settings);

            // Persist to database
            await this.saveSettings();

            console.log('[SettingsManager] Settings updated successfully');
        } catch (error) {
            console.error('[SettingsManager] Failed to update settings:', error);
            throw error;
        }
    }

    /**
     * Gets the current settings
     */
    getSettings(): UserSettings {
        return { ...this.settings };
    }

    /**
     * Resets settings to defaults
     */
    async resetSettings(): Promise<void> {
        console.log('[SettingsManager] Resetting settings to defaults');
        this.settings = { ...DefaultSettings };
        await this.saveSettings();
    }

    /**
     * Initializes the SQLite database with required tables
     */
    private async initDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Create settings table
                const createTableSQL = `
                    CREATE TABLE IF NOT EXISTS settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `;

                this.db!.run(createTableSQL, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * Loads settings from the database
     */
    private async loadSettings(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = 'SELECT key, value FROM settings';
            this.db.all(sql, (err, rows: SettingsRow[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Convert rows to settings object
                const loadedSettings: any = { ...DefaultSettings };

                rows.forEach((row: SettingsRow) => {
                    try {
                        const value = JSON.parse(row.value);
                        loadedSettings[row.key] = value;
                    } catch (e) {
                        console.warn(`[SettingsManager] Failed to parse setting ${row.key}:`, e);
                    }
                });

                // Ensure we have a valid user ID
                if (!loadedSettings.userId || loadedSettings.userId === 'default-user') {
                    loadedSettings.userId = generateUserId();
                }

                this.settings = loadedSettings;
                resolve();
            });
        });
    }

    /**
     * Saves current settings to the database
     */
    private async saveSettings(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = `
                INSERT OR REPLACE INTO settings (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `;

            const settingsToSave = [
                ['autoStart', JSON.stringify(this.settings.autoStart)],
                ['watchPaths', JSON.stringify(this.settings.watchPaths)],
                ['ignorePaths', JSON.stringify(this.settings.ignorePaths)],
                ['kafkaBroker', JSON.stringify(this.settings.kafkaBroker)],
                ['userId', JSON.stringify(this.settings.userId)]
            ];

            let completed = 0;
            const total = settingsToSave.length;

            settingsToSave.forEach(([key, value]) => {
                this.db!.run(sql, [key, value], (err) => {
                    if (err) {
                        console.error(`[SettingsManager] Failed to save setting ${key}:`, err);
                    }

                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * Validates settings to ensure they are valid
     */
    private validateSettings(settings: UserSettings): void {
        // Validate watchPaths
        if (!Array.isArray(settings.watchPaths)) {
            throw new Error('watchPaths must be an array');
        }

        // Validate ignorePaths
        if (!Array.isArray(settings.ignorePaths)) {
            throw new Error('ignorePaths must be an array');
        }

        // Validate kafkaBroker
        if (typeof settings.kafkaBroker !== 'string' || settings.kafkaBroker.trim() === '') {
            throw new Error('kafkaBroker must be a non-empty string');
        }

        // Validate userId
        if (typeof settings.userId !== 'string' || settings.userId.trim() === '') {
            throw new Error('userId must be a non-empty string');
        }

        // Validate autoStart
        if (typeof settings.autoStart !== 'boolean') {
            throw new Error('autoStart must be a boolean');
        }
    }

    /**
     * Closes the database connection
     */
    async close(): Promise<void> {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db!.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db = null;
                        resolve();
                    }
                });
            });
        }
    }
} 