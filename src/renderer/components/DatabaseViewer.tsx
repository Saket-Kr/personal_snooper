import React, { useState, useEffect } from 'react';
import './DatabaseViewer.css';

interface Event {
    id: number;
    event_id: string;
    timestamp: string;
    user_id: string;
    event_type: string;
    app_name?: string;
    process_id?: number;
    app_path?: string;
    window_title?: string;
    tab_title?: string;
    tab_url?: string;
    domain?: string;
    file_path?: string;
    file_name?: string;
    file_extension?: string;
    directory?: string;
    change_type?: string;
    file_size?: number;
    created_at: string;
}

interface DatabaseStats {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByDate: Record<string, number>;
}

export function DatabaseViewer() {
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'APP_ACTIVE' | 'BROWSER_TAB_ACTIVE' | 'FILE_CHANGED'>('all');
    const [limit, setLimit] = useState(50);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // API call to the Express server
            const response = await fetch(`http://localhost:3001/api/events?limit=${limit}&type=${filter}`);
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            
            const data = await response.json();
            setEvents(data.events || []);
            setStats(data.stats || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchStats();
        
        // Refresh data every 30 seconds
        const interval = setInterval(() => {
            fetchEvents();
            fetchStats();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [filter, limit]);

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getEventDescription = (event: Event) => {
        switch (event.event_type) {
            case 'APP_ACTIVE':
                return `${event.app_name}${event.window_title ? ` - ${event.window_title}` : ''}`;
            case 'BROWSER_TAB_ACTIVE':
                return `${event.tab_title} (${event.tab_url})`;
            case 'FILE_CHANGED':
                return `${event.file_name} (${event.change_type})`;
            default:
                return event.event_type;
        }
    };

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'APP_ACTIVE':
                return '💻';
            case 'BROWSER_TAB_ACTIVE':
                return '🌐';
            case 'FILE_CHANGED':
                return '📁';
            default:
                return '📝';
        }
    };

    if (loading && events.length === 0) {
        return (
            <div className="database-viewer">
                <div className="loading">
                    <p>Loading events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="database-viewer">
            <div className="viewer-header">
                <h2>Database Events</h2>
                <div className="viewer-controls">
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="filter-select"
                    >
                        <option value="all">All Events</option>
                        <option value="APP_ACTIVE">App Events</option>
                        <option value="BROWSER_TAB_ACTIVE">Browser Events</option>
                        <option value="FILE_CHANGED">File Events</option>
                    </select>
                    <select 
                        value={limit} 
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="limit-select"
                    >
                        <option value={10}>10 events</option>
                        <option value={25}>25 events</option>
                        <option value={50}>50 events</option>
                        <option value={100}>100 events</option>
                    </select>
                    <button onClick={fetchEvents} className="refresh-button">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <p>Error: {error}</p>
                    <p>Make sure the application is running and events are being logged.</p>
                </div>
            )}

            {stats && (
                <div className="stats-overview">
                    <div className="stat-card">
                        <h3>Total Events</h3>
                        <p className="stat-value">{stats.totalEvents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Events by Type</h3>
                        <div className="stat-breakdown">
                            {Object.entries(stats.eventsByType).map(([type, count]) => (
                                <div key={type} className="stat-item">
                                    <span className="stat-label">{type}:</span>
                                    <span className="stat-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="events-list">
                {events.length === 0 ? (
                    <div className="no-events">
                        <p>No events found in database.</p>
                        <p>Start monitoring to see events here.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-header">
                                <span className="event-icon">{getEventIcon(event.event_type)}</span>
                                <span className="event-type">{event.event_type}</span>
                                <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                            </div>
                            <div className="event-content">
                                <p className="event-description">{getEventDescription(event)}</p>
                                {event.app_name && <p className="event-detail">App: {event.app_name}</p>}
                                {event.window_title && <p className="event-detail">Window: {event.window_title}</p>}
                                {event.file_path && <p className="event-detail">File: {event.file_path}</p>}
                                {event.tab_url && <p className="event-detail">URL: {event.tab_url}</p>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
