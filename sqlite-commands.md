# SQLite Command Line Access

You can also access the database directly using the SQLite command line tool.

## Database Location

The database is located at:
- **macOS**: `~/Library/Application Support/desktop-activity-tracker/events.db`
- **Windows**: `%APPDATA%/desktop-activity-tracker/events.db`
- **Linux**: `~/.config/desktop-activity-tracker/events.db`

## Opening the Database

```bash
# macOS/Linux
sqlite3 ~/Library/Application\ Support/desktop-activity-tracker/events.db

# Windows
sqlite3 "%APPDATA%\desktop-activity-tracker\events.db"
```

## Useful SQLite Commands

### View all events (last 10)
```sql
SELECT event_type, app_name, window_title, timestamp 
FROM events 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Count events by type
```sql
SELECT event_type, COUNT(*) as count 
FROM events 
GROUP BY event_type;
```

### Get events from today
```sql
SELECT event_type, app_name, window_title, timestamp
FROM events 
WHERE DATE(timestamp) = DATE('now')
ORDER BY timestamp DESC;
```

### Get events from last 24 hours
```sql
SELECT event_type, app_name, window_title, timestamp
FROM events 
WHERE timestamp >= datetime('now', '-1 day')
ORDER BY timestamp DESC;
```

### Get file change events
```sql
SELECT file_name, file_path, change_type, timestamp
FROM events 
WHERE event_type = 'FILE_CHANGED'
ORDER BY timestamp DESC
LIMIT 20;
```

### Get app usage statistics
```sql
SELECT app_name, COUNT(*) as usage_count
FROM events 
WHERE event_type = 'APP_ACTIVE'
GROUP BY app_name
ORDER BY usage_count DESC
LIMIT 10;
```

### Get database schema
```sql
.schema events
```

### Export data to CSV
```sql
.mode csv
.headers on
.output events.csv
SELECT * FROM events;
.output stdout
```

### Exit SQLite
```sql
.quit
```

## Quick One-liners

```bash
# Count total events
sqlite3 ~/Library/Application\ Support/desktop-activity-tracker/events.db "SELECT COUNT(*) FROM events;"

# Get recent events
sqlite3 ~/Library/Application\ Support/desktop-activity-tracker/events.db "SELECT event_type, app_name, timestamp FROM events ORDER BY timestamp DESC LIMIT 5;"

# Get events by type
sqlite3 ~/Library/Application\ Support/desktop-activity-tracker/events.db "SELECT COUNT(*) FROM events WHERE event_type = 'APP_ACTIVE';"
```
