import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityEvent } from '../../../shared/types';
import { useKafkaStreams, useKafkaUI } from '../../contexts/KafkaContext';
import './LiveEventStream.css';

export function LiveEventStream() {
    const { liveEvents, streamStats, connectionStatus } = useKafkaStreams();
    const { filters } = useKafkaUI();
    const [autoScroll, setAutoScroll] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const streamRef = useRef<HTMLDivElement>(null);

    // Apply filters to events
    const filteredEvents = useMemo((): ActivityEvent[] => {
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
                        timeLimit = now - (60 * 60 * 1000); // Default to 1 hour
                }

                if (eventTime < timeLimit) {
                    return false;
                }
            }

            // Search term filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const eventText = JSON.stringify(event).toLowerCase();
                if (!eventText.includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });
    }, [liveEvents, filters]);

    // Auto-scroll to bottom when new events arrive
    useEffect(() => {
        if (autoScroll && streamRef.current) {
            streamRef.current.scrollTop = streamRef.current.scrollHeight;
        }
    }, [filteredEvents, autoScroll]);

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'APP_ACTIVE': return '💻';
            case 'BROWSER_TAB_ACTIVE': return '🌐';
            case 'FILE_CHANGED': return '📁';
            default: return '📝';
        }
    };

    const getEventDescription = (event: ActivityEvent) => {
        switch (event.eventType) {
            case 'APP_ACTIVE':
                const appPayload = event.payload as any;
                return `${appPayload.appName}${appPayload.windowTitle ? ` - ${appPayload.windowTitle}` : ''}`;
            case 'BROWSER_TAB_ACTIVE':
                const browserPayload = event.payload as any;
                return `${browserPayload.tabTitle} (${browserPayload.tabUrl})`;
            case 'FILE_CHANGED':
                const filePayload = event.payload as any;
                return `${filePayload.fileName} (${filePayload.changeType})`;
            default:
                return event.eventType;
        }
    };

    const getEventColor = (eventType: string) => {
        switch (eventType) {
            case 'APP_ACTIVE': return '#e3f2fd';
            case 'BROWSER_TAB_ACTIVE': return '#f3e5f5';
            case 'FILE_CHANGED': return '#e8f5e8';
            default: return '#fff3e0';
        }
    };

    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#28a745';
            case 'connecting': return '#ffc107';
            case 'disconnected': return '#dc3545';
            default: return '#6c757d';
        }
    };

    return (
        <div className="live-event-stream">
            <div className="stream-header">
                <div className="stream-title">
                    <h3>Live Event Stream</h3>
                    <div className="stream-stats">
                        <span className="stat-item">
                            <span className="stat-label">Events/sec:</span>
                            <span className="stat-value">{streamStats.eventsPerSecond.toFixed(1)}</span>
                        </span>
                        <span className="stat-item">
                            <span className="stat-label">Total:</span>
                            <span className="stat-value">{streamStats.totalEvents}</span>
                        </span>
                        <span className="stat-item">
                            <span className="stat-label">Status:</span>
                            <span
                                className="stat-value status-dot"
                                style={{ backgroundColor: getConnectionStatusColor() }}
                            />
                        </span>
                    </div>
                </div>

                <div className="stream-controls">
                    <button
                        className={`control-button ${autoScroll ? 'active' : ''}`}
                        onClick={() => setAutoScroll(!autoScroll)}
                        title="Auto-scroll to latest events"
                    >
                        {autoScroll ? '🔒' : '🔓'} Auto-scroll
                    </button>
                    <button
                        className={`control-button ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title="Show/hide stream statistics"
                    >
                        📊 Stats
                    </button>
                    <button
                        className="control-button"
                        onClick={() => {
                            if (streamRef.current) {
                                streamRef.current.scrollTop = streamRef.current.scrollHeight;
                            }
                        }}
                        title="Scroll to bottom"
                    >
                        ⬇️ Bottom
                    </button>
                </div>
            </div>

            {showStats && (
                <div className="stream-stats-panel">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-title">Events Per Second</div>
                            <div className="stat-number">{streamStats.eventsPerSecond.toFixed(1)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-title">Total Events</div>
                            <div className="stat-number">{streamStats.totalEvents}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-title">Last Event</div>
                            <div className="stat-number">
                                {streamStats.lastEventTime
                                    ? new Date(streamStats.lastEventTime).toLocaleTimeString()
                                    : 'None'
                                }
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-title">Connection</div>
                            <div className="stat-number">
                                <span
                                    className="status-dot"
                                    style={{ backgroundColor: getConnectionStatusColor() }}
                                />
                                {connectionStatus}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="stream-container" ref={streamRef}>
                {filteredEvents.length === 0 ? (
                    <div className="stream-empty">
                        <h3>No Events Found</h3>
                        <p>
                            {liveEvents.length === 0
                                ? (connectionStatus === 'connected'
                                    ? 'Waiting for events from Kafka stream...'
                                    : 'Connecting to Kafka stream...')
                                : 'No events match the current filters. Try adjusting your filter settings.'
                            }
                        </p>
                        <div className="connection-indicator">
                            <span
                                className="status-dot"
                                style={{ backgroundColor: getConnectionStatusColor() }}
                            />
                            <span>{connectionStatus}</span>
                        </div>
                    </div>
                ) : (
                    <div className="event-list">
                        {filteredEvents.map((event, index) => (
                            <div
                                key={`${event.eventId}-${index}`}
                                className="event-item"
                                style={{ backgroundColor: getEventColor(event.eventType) }}
                            >
                                <div className="event-header">
                                    <span className="event-icon">{getEventIcon(event.eventType)}</span>
                                    <span className="event-type">{event.eventType}</span>
                                    <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                                </div>
                                <div className="event-content">
                                    <div className="event-description">
                                        {getEventDescription(event)}
                                    </div>
                                    <div className="event-details">
                                        <span className="event-id">ID: {event.eventId.slice(0, 8)}...</span>
                                        <span className="event-user">User: {event.userId}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
