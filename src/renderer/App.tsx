import { useState } from 'react';
import { formatDuration } from '../shared/utils';
import { DatabaseViewer } from './components/DatabaseViewer';
import { KafkaDashboard } from './components/kafka-ui/KafkaDashboard';
import { Settings } from './components/Settings';
import { KafkaProvider } from './contexts/KafkaContext';
import { useKafkaConsumer } from './hooks/useKafkaConsumer';
import { useMonitoring } from './hooks/useMonitoring';
import { useSettings } from './hooks/useSettings';
import './styles/app.css';

// Wrapper component to initialize Kafka consumer
function KafkaUIWrapper() {
    useKafkaConsumer(); // Initialize Kafka consumer
    return <KafkaDashboard />;
}

/**
 * Main App component for the Desktop Activity Tracker
 * 
 * This component provides the main user interface for controlling
 * the monitoring system and viewing real-time statistics.
 */
export function App() {
    const { isRunning, stats, isLoading, start, stop } = useMonitoring();
    const { settings, isLoading: settingsLoading, error: settingsError, updateSettings } = useSettings();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'database' | 'kafka'>('dashboard');

    const handleToggleMonitoring = async () => {
        if (isRunning) {
            await stop();
        } else {
            await start();
        }
    };

    if (settingsLoading) {
        return (
            <div className="app">
                <header className="app-header">
                    <h1>Desktop Activity Tracker</h1>
                </header>
                <main className="app-content">
                    <div className="loading">
                        <p>Loading settings...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>Desktop Activity Tracker</h1>
                <nav className="app-nav">
                    <button
                        className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'database' ? 'active' : ''}`}
                        onClick={() => setActiveTab('database')}
                    >
                        Database
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'kafka' ? 'active' : ''}`}
                        onClick={() => setActiveTab('kafka')}
                    >
                        Kafka UI
                    </button>
                </nav>
            </header>

            <main className="app-content">
                {activeTab === 'dashboard' ? (
                    <div className="dashboard">
                        <h2>Dashboard</h2>

                        <div className="status-section">
                            <p className={`status ${isRunning ? 'running' : 'stopped'}`}>
                                {isRunning ? '● Monitoring Active' : '○ Monitoring Stopped'}
                            </p>

                            <button
                                onClick={handleToggleMonitoring}
                                disabled={isLoading}
                                className={`control-button ${isRunning ? 'stop' : 'start'}`}
                            >
                                {isLoading ? 'Loading...' : (isRunning ? 'Stop Monitoring' : 'Start Monitoring')}
                            </button>

                            {stats.lastError && (
                                <p className="error-message">
                                    Error: {stats.lastError}
                                </p>
                            )}
                        </div>

                        <div className="stats-section">
                            <h3>Statistics</h3>
                            <p>Events processed: {stats.eventsProcessed}</p>
                            <p>Uptime: {formatDuration(stats.uptime)}</p>
                            <p>Status: {isRunning ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                ) : activeTab === 'settings' ? (
                    <Settings
                        settings={settings || {
                            autoStart: false,
                            watchPaths: [],
                            ignorePaths: ['node_modules', '.git', '.DS_Store', '*.tmp', '*.log'],
                            kafkaBroker: 'localhost:9092',
                            userId: 'default-user',
                            enableAppMonitoring: true,
                            enableFileMonitoring: true,
                            enableBrowserMonitoring: true
                        }}
                        onUpdateSettings={updateSettings}
                        isLoading={settingsLoading}
                    />
                ) : activeTab === 'kafka' ? (
                    <KafkaProvider>
                        <KafkaUIWrapper />
                    </KafkaProvider>
                ) : (
                    <DatabaseViewer />
                )}
            </main>

            <footer className="app-footer">
                <p>Desktop Activity Tracker v1.0.0 - Made with ❤️ by SaketKr </p>
                {settingsError && (
                    <p className="footer-error">Settings Error: {settingsError}</p>
                )}
            </footer>
        </div>
    );
} 