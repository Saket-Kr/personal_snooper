import { useState } from 'react';
import { useKafkaUI } from '../../contexts/KafkaContext';
import { ConsumerGroups } from './ConsumerGroups';
import { EventAnalytics } from './EventAnalytics';
import './KafkaDashboard.css';
import { LiveEventStream } from './LiveEventStream';
import { StreamFilters } from './StreamFilters';
import { TopicBrowser } from './TopicBrowser';

export function KafkaDashboard() {
    const { viewMode, setViewMode, connectionStatus, error } = useKafkaUI();
    const [activeView, setActiveView] = useState<'stream' | 'analytics' | 'topics' | 'consumers'>('stream');

    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#28a745';
            case 'connecting': return '#ffc107';
            case 'disconnected': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Connected to Kafka';
            case 'connecting': return 'Connecting...';
            case 'disconnected': return 'Disconnected';
            default: return 'Unknown';
        }
    };

    return (
        <div className="kafka-dashboard">
            <div className="kafka-header">
                <div className="kafka-title">
                    <h2>Kafka Streams</h2>
                    <div className="connection-status">
                        <span
                            className="status-indicator"
                            style={{ backgroundColor: getConnectionStatusColor() }}
                        />
                        <span className="status-text">{getConnectionStatusText()}</span>
                    </div>
                </div>

                <div className="view-controls">
                    <button
                        className={`view-button ${viewMode === 'live' ? 'active' : ''}`}
                        onClick={() => setViewMode('live')}
                    >
                        📡 Live Stream
                    </button>
                    <button
                        className={`view-button ${viewMode === 'historical' ? 'active' : ''}`}
                        onClick={() => setViewMode('historical')}
                    >
                        📊 Historical
                    </button>
                    <button
                        className={`view-button ${viewMode === 'analytics' ? 'active' : ''}`}
                        onClick={() => setViewMode('analytics')}
                    >
                        📈 Analytics
                    </button>
                </div>
            </div>

            {error && (
                <div className="kafka-error">
                    <p>Error: {error}</p>
                </div>
            )}

            <div className="kafka-content">
                <div className="kafka-sidebar">
                    <div className="sidebar-section">
                        <h3>Views</h3>
                        <button
                            className={`sidebar-button ${activeView === 'stream' ? 'active' : ''}`}
                            onClick={() => setActiveView('stream')}
                        >
                            📡 Event Stream
                        </button>
                        <button
                            className={`sidebar-button ${activeView === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveView('analytics')}
                        >
                            📊 Analytics
                        </button>
                        <button
                            className={`sidebar-button ${activeView === 'topics' ? 'active' : ''}`}
                            onClick={() => setActiveView('topics')}
                        >
                            📋 Topics
                        </button>
                        <button
                            className={`sidebar-button ${activeView === 'consumers' ? 'active' : ''}`}
                            onClick={() => setActiveView('consumers')}
                        >
                            👥 Consumers
                        </button>
                    </div>

                    <div className="sidebar-section">
                        <h3>Filters</h3>
                        <StreamFilters />
                    </div>
                </div>

                <div className="kafka-main">
                    {activeView === 'stream' && <LiveEventStream />}
                    {activeView === 'analytics' && <EventAnalytics />}
                    {activeView === 'topics' && <TopicBrowser />}
                    {activeView === 'consumers' && <ConsumerGroups />}
                </div>
            </div>
        </div>
    );
}
