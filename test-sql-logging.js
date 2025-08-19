const { DatabaseUtils } = require('./dist/agent/agent/services/db-utils');

async function testSQLLogging() {
    try {
        console.log('Testing SQL logging functionality...');
        
        const dbUtils = new DatabaseUtils();
        
        // Get database statistics
        const stats = await dbUtils.getDatabaseStats();
        console.log('Database Statistics:');
        console.log('- Total events:', stats.totalEvents);
        console.log('- Events by type:', stats.eventsByType);
        console.log('- Events by date (last 30 days):', stats.eventsByDate);
        
        if (stats.totalEvents === 0) {
            console.log('\nNo events found in database. This is expected if the agent has not been running.');
            console.log('To generate events, start the application and perform some activities.');
            console.log('The SQL logger will automatically log events alongside Kafka streaming.');
        } else {
            // Get recent events
            const recentEvents = await dbUtils.getRecentEvents(10);
            console.log('\nRecent Events (last 10):');
            recentEvents.forEach((event, index) => {
                console.log(`${index + 1}. ${event.event_type} - ${event.timestamp} - ${event.app_name || event.file_name || 'N/A'}`);
            });
            
            // Get events by type
            const appEvents = await dbUtils.getEventsByType('APP_ACTIVE', 5);
            console.log('\nRecent App Events (last 5):');
            appEvents.forEach((event, index) => {
                console.log(`${index + 1}. ${event.app_name} - ${event.window_title || 'N/A'} - ${event.timestamp}`);
            });
        }
        
        console.log('\nSQL logging test completed successfully!');
        
    } catch (error) {
        console.error('Error testing SQL logging:', error);
    }
}

// Run the test
testSQLLogging();
