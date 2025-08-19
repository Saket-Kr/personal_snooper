const sqlite3 = require('sqlite3');
const path = require('path');

// Database path (same as used in the application)
const userDataPath = process.env.APPDATA ||
    (process.platform === 'darwin' ?
        path.join(process.env.HOME || '', 'Library/Application Support') :
        path.join(process.env.HOME || '', '.config'));

const dbPath = path.join(userDataPath, 'desktop-activity-tracker', 'events.db');

function queryDatabaseDirectly() {
    console.log('=== Direct SQLite Database Access ===\n');
    console.log(`Database path: ${dbPath}\n`);

    const db = new sqlite3.Database(dbPath);

    // 1. Get all events with custom query
    console.log('=== All Events (Custom Query) ===');
    db.all(`
        SELECT 
            event_type,
            app_name,
            window_title,
            file_name,
            timestamp,
            created_at
        FROM events 
        ORDER BY timestamp DESC 
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            console.error('Error querying database:', err);
            return;
        }

        rows.forEach((row, index) => {
            console.log(`${index + 1}. [${row.event_type}] ${row.timestamp}`);
            if (row.app_name) console.log(`   App: ${row.app_name}`);
            if (row.window_title) console.log(`   Window: ${row.window_title}`);
            if (row.file_name) console.log(`   File: ${row.file_name}`);
            console.log('');
        });

        // 2. Get event count by type
        console.log('=== Event Count by Type ===');
        db.all(`
            SELECT event_type, COUNT(*) as count 
            FROM events 
            GROUP BY event_type
        `, (err, rows) => {
            if (err) {
                console.error('Error:', err);
                return;
            }

            rows.forEach(row => {
                console.log(`${row.event_type}: ${row.count} events`);
            });

            // 3. Get events from today
            console.log('\n=== Events from Today ===');
            const today = new Date().toISOString().split('T')[0];
            db.all(`
                SELECT event_type, app_name, window_title, timestamp
                FROM events 
                WHERE DATE(timestamp) = ?
                ORDER BY timestamp DESC
                LIMIT 5
            `, [today], (err, rows) => {
                if (err) {
                    console.error('Error:', err);
                    return;
                }

                if (rows.length === 0) {
                    console.log('No events from today found.');
                } else {
                    rows.forEach((row, index) => {
                        console.log(`${index + 1}. [${row.event_type}] ${row.app_name || 'N/A'} - ${row.timestamp}`);
                    });
                }

                // Close database connection
                db.close();
                console.log('\nDatabase connection closed.');
            });
        });
    });
}

// Run the direct access example
queryDatabaseDirectly();
