import sqlite3 from 'sqlite3';
import path from 'path';

/**
 * Database utilities for querying and managing the events database
 */
export class DatabaseUtils {
    private dbPath: string;

    constructor() {
        // Store database in user's application data directory
        const userDataPath = process.env.APPDATA || 
            (process.platform === 'darwin' ? 
                path.join(process.env.HOME || '', 'Library/Application Support') : 
                path.join(process.env.HOME || '', '.config'));
        
        this.dbPath = path.join(userDataPath, 'desktop-activity-tracker', 'events.db');
    }

    /**
     * Gets the total number of events in the database
     */
    async getEventCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.get('SELECT COUNT(*) as count FROM events', (err, row: any) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row?.count || 0);
                }
            });
        });
    }

    /**
     * Gets events for a specific time range
     */
    async getEventsByTimeRange(startTime: string, endTime: string, limit = 100): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(`
                SELECT * FROM events 
                WHERE timestamp BETWEEN ? AND ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `, [startTime, endTime, limit], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Gets events by event type
     */
    async getEventsByType(eventType: string, limit = 100): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(`
                SELECT * FROM events 
                WHERE event_type = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `, [eventType, limit], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Gets events by user ID
     */
    async getEventsByUserId(userId: string, limit = 100): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(`
                SELECT * FROM events 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `, [userId, limit], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Gets recent events (last N events)
     */
    async getRecentEvents(limit = 50): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(`
                SELECT * FROM events 
                ORDER BY timestamp DESC 
                LIMIT ?
            `, [limit], (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Gets database statistics
     */
    async getDatabaseStats(): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByDate: Record<string, number>;
    }> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.get('SELECT COUNT(*) as total FROM events', (err, totalRow: any) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }

                            db.all('SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type', (err, typeRows: any[]) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }

                db.all(`
                    SELECT DATE(timestamp) as date, COUNT(*) as count 
                    FROM events 
                    GROUP BY DATE(timestamp) 
                    ORDER BY date DESC 
                    LIMIT 30
                `, (err, dateRows: any[]) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        const eventsByType: Record<string, number> = {};
                        typeRows?.forEach(row => {
                            eventsByType[row.event_type] = row.count;
                        });

                        const eventsByDate: Record<string, number> = {};
                        dateRows?.forEach(row => {
                            eventsByDate[row.date] = row.count;
                        });

                        resolve({
                            totalEvents: totalRow?.total || 0,
                            eventsByType,
                            eventsByDate
                        });
                    }
                });
            });
            });
        });
    }

    /**
     * Cleans up old events (older than specified days)
     */
    async cleanupOldEvents(daysToKeep = 30): Promise<number> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const cutoffTimestamp = cutoffDate.toISOString();

            db.run(`
                DELETE FROM events 
                WHERE timestamp < ?
            `, [cutoffTimestamp], function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes || 0);
                }
            });
        });
    }
}
