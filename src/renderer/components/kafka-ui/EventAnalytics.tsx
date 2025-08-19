import { useMemo } from 'react';
import { ActivityEvent } from '../../../shared/types';
import { useKafkaStreams, useKafkaUI } from '../../contexts/KafkaContext';
import { calculateAnalytics, formatEventType, getEventTypeColor, getTopApps } from '../../utils/analytics';
import './EventAnalytics.css';

export function EventAnalytics() {
    const { liveEvents, streamStats } = useKafkaStreams();
    const { filters } = useKafkaUI();

    // Apply filters to events for analytics
    const filteredEvents = useMemo(() => {
        return liveEvents.filter((event: ActivityEvent) => {
            // Event type filter
            if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType)) {
                return false;
            }

            // Time range filter
            if (filters.timeRange !== 'all') {
                const eventTime = new Date(event.timestamp).getTime();
                const now = Date.now();
                let timeLimit: number;

                switch (filters.timeRange) {
                    case '1h':
                        timeLimit = now - (60 * 60 * 1000);
                        break;
                    case '6h':
                        timeLimit = now - (6 * 60 * 60 * 1000);
                        break;
                    case '24h':
                        timeLimit = now - (24 * 60 * 60 * 1000);
                        break;
                    case '7d':
                        timeLimit = now - (7 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        timeLimit = now - (60 * 60 * 1000);
                }

                if (eventTime < timeLimit) {
                    return false;
                }
            }

            return true;
        });
    }, [liveEvents, filters]);

    // Calculate real analytics from filtered events
    const analytics = useMemo(() => {
        return calculateAnalytics(filteredEvents);
    }, [filteredEvents]);

    const topApps = useMemo(() => {
        return getTopApps(analytics.appUsage, 5);
    }, [analytics.appUsage]);

    return (
        <div className="event-analytics">
            <div className="analytics-header">
                <h3>Event Analytics</h3>
                <p>Real-time analytics and insights from your Kafka streams</p>
            </div>

            <div className="analytics-grid">
                <div className="analytics-card">
                    <div className="card-header">
                        <h4>📊 Event Distribution</h4>
                    </div>
                    <div className="card-content">
                        <div className="event-distribution">
                            {Object.entries(analytics.eventTypeDistribution).length > 0 ? (
                                <div className="distribution-chart">
                                    {Object.entries(analytics.eventTypeDistribution).map(([eventType, count]) => {
                                        const percentage = analytics.totalEvents > 0 ? (count / analytics.totalEvents) * 100 : 0;
                                        return (
                                            <div key={eventType} className="distribution-item">
                                                <div className="distribution-label">
                                                    <span>{formatEventType(eventType)}</span>
                                                    <span className="count">{count}</span>
                                                </div>
                                                <div className="distribution-bar">
                                                    <div
                                                        className="bar-fill"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: getEventTypeColor(eventType)
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="no-data">No events recorded yet</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h4>📈 Events Per Second</h4>
                    </div>
                    <div className="card-content">
                        <div className="events-per-second">
                            <div className="eps-display">
                                <span className="eps-value">{analytics.eventsPerSecond}</span>
                                <span className="eps-label">events/sec</span>
                            </div>
                            <div className="eps-details">
                                <div className="detail-item">
                                    <span className="label">Total Events:</span>
                                    <span className="value">{analytics.totalEvents}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Recent Activity:</span>
                                    <span className="value">
                                        {analytics.recentActivity.appSwitches} app switches,
                                        {analytics.recentActivity.fileChanges} file changes
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h4>💻 App Usage</h4>
                    </div>
                    <div className="card-content">
                        <div className="app-usage">
                            {topApps.length > 0 ? (
                                <div className="app-list">
                                    {topApps.map((app, index) => (
                                        <div key={app.name} className="app-item">
                                            <div className="app-info">
                                                <span className="app-name">{app.name}</span>
                                                <span className="app-count">{app.count} switches</span>
                                            </div>
                                            <div className="app-bar">
                                                <div
                                                    className="app-bar-fill"
                                                    style={{ width: `${app.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="app-percentage">{app.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No app activity recorded yet</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h4>📁 File Activity</h4>
                    </div>
                    <div className="card-content">
                        <div className="file-activity">
                            <div className="file-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Created:</span>
                                    <span className="stat-value">{analytics.fileActivity.created}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Modified:</span>
                                    <span className="stat-value">{analytics.fileActivity.modified}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Deleted:</span>
                                    <span className="stat-value">{analytics.fileActivity.deleted}</span>
                                </div>
                            </div>
                            <div className="file-total">
                                <span className="total-label">Total File Changes:</span>
                                <span className="total-value">
                                    {analytics.fileActivity.created + analytics.fileActivity.modified + analytics.fileActivity.deleted}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-footer">
                <p>Analytics features coming soon! This will include interactive charts, real-time metrics, and detailed insights.</p>
            </div>
        </div>
    );
}
