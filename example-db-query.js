const { DatabaseUtils } = require('./dist/agent/agent/services/db-utils');

async function queryDatabase() {
    try {
        const dbUtils = new DatabaseUtils();

        console.log('=== Database Query Examples ===\n');

        // 1. Get total event count
        const totalEvents = await dbUtils.getEventCount();
        console.log(`Total events in database: ${totalEvents}`);

        // 2. Get recent events (last 20)
        console.log('\n=== Recent Events (last 20) ===');
        const recentEvents = await dbUtils.getRecentEvents(20);
        recentEvents.forEach((event, index) => {
            console.log(`${index + 1}. [${event.event_type}] ${event.timestamp}`);
            if (event.app_name) console.log(`   App: ${event.app_name}`);
            if (event.window_title) console.log(`   Window: ${event.window_title}`);
            if (event.file_name) console.log(`   File: ${event.file_name}`);
            console.log('');
        });

        // 3. Get events by type
        console.log('=== App Events (last 10) ===');
        const appEvents = await dbUtils.getEventsByType('APP_ACTIVE', 10);
        appEvents.forEach((event, index) => {
            console.log(`${index + 1}. ${event.app_name} - ${event.window_title || 'N/A'}`);
        });

        // 4. Get events by time range (last 24 hours)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        console.log('\n=== Events in last 24 hours ===');
        const recentEvents24h = await dbUtils.getEventsByTimeRange(
            yesterday.toISOString(),
            now.toISOString(),
            50
        );
        console.log(`Found ${recentEvents24h.length} events in last 24 hours`);

        // 5. Get database statistics
        console.log('\n=== Database Statistics ===');
        const stats = await dbUtils.getDatabaseStats();
        console.log('Events by type:', stats.eventsByType);
        console.log('Events by date (last 7 days):');
        Object.entries(stats.eventsByDate).slice(0, 7).forEach(([date, count]) => {
            console.log(`  ${date}: ${count} events`);
        });

    } catch (error) {
        console.error('Error querying database:', error);
    }
}

// Run the example
queryDatabase();
