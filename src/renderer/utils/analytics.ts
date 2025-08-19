import { ActivityEvent } from '../../shared/types';

export interface AnalyticsData {
    eventTypeDistribution: Record<string, number>;
    appUsage: Record<string, number>;
    fileActivity: {
        created: number;
        modified: number;
        deleted: number;
    };
    eventsPerSecond: number;
    totalEvents: number;
    recentActivity: {
        appSwitches: number;
        fileChanges: number;
        browserActivity: number;
    };
}

export function calculateAnalytics(events: ActivityEvent[]): AnalyticsData {
    const eventTypeCounts: Record<string, number> = {};
    const appUsage: Record<string, number> = {};
    const fileActivity = { created: 0, modified: 0, deleted: 0 };
    let appSwitches = 0;
    let fileChanges = 0;
    let browserActivity = 0;

    // Calculate event type distribution and app usage
    events.forEach(event => {
        // Event type distribution
        eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;

        // App usage (for APP_ACTIVE events)
        if (event.eventType === 'APP_ACTIVE' && event.appName) {
            appUsage[event.appName] = (appUsage[event.appName] || 0) + 1;
            appSwitches++;
        }

        // File activity
        if (event.eventType === 'FILE_CHANGED') {
            fileChanges++;
            if (event.changeType === 'CREATED') {
                fileActivity.created++;
            } else if (event.changeType === 'MODIFIED') {
                fileActivity.modified++;
            } else if (event.changeType === 'DELETED') {
                fileActivity.deleted++;
            }
        }

        // Browser activity
        if (event.eventType === 'BROWSER_TAB_ACTIVE') {
            browserActivity++;
        }
    });

    // Calculate events per second (based on last 60 seconds)
    const now = Date.now();
    const recentEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return now - eventTime < 60000; // Last 60 seconds
    });
    const eventsPerSecond = recentEvents.length / 60;

    return {
        eventTypeDistribution: eventTypeCounts,
        appUsage,
        fileActivity,
        eventsPerSecond: Math.round(eventsPerSecond * 100) / 100,
        totalEvents: events.length,
        recentActivity: {
            appSwitches,
            fileChanges,
            browserActivity
        }
    };
}

export function getTopApps(appUsage: Record<string, number>, limit: number = 5): Array<{ name: string; count: number; percentage: number }> {
    const total = Object.values(appUsage).reduce((sum, count) => sum + count, 0);

    return Object.entries(appUsage)
        .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

export function formatEventType(eventType: string): string {
    switch (eventType) {
        case 'APP_ACTIVE':
            return 'App Switches';
        case 'FILE_CHANGED':
            return 'File Changes';
        case 'BROWSER_TAB_ACTIVE':
            return 'Browser Activity';
        default:
            return eventType;
    }
}

export function getEventTypeColor(eventType: string): string {
    switch (eventType) {
        case 'APP_ACTIVE':
            return '#007bff';
        case 'FILE_CHANGED':
            return '#28a745';
        case 'BROWSER_TAB_ACTIVE':
            return '#ffc107';
        default:
            return '#6c757d';
    }
}
