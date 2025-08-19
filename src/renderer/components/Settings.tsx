import { useEffect, useState } from 'react';
import { UserSettings } from '../../shared/types';
import { Permissions } from './Permissions';

interface SettingsProps {
    settings: UserSettings;
    onUpdateSettings: (settings: Partial<UserSettings>) => Promise<void>;
    isLoading?: boolean;
}

/**
 * Settings component for configuring monitoring behavior
 * 
 * This component provides a user interface for managing all application
 * settings including watch paths, ignore patterns, and Kafka configuration.
 */
export function Settings({ settings, onUpdateSettings, isLoading = false }: SettingsProps) {
    const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
    const [newWatchPath, setNewWatchPath] = useState('');
    const [newIgnorePath, setNewIgnorePath] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Update local settings when props change
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    /**
     * Handles saving settings to the main process
     */
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdateSettings(localSettings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Adds a new watch path
     */
    const handleAddWatchPath = () => {
        if (newWatchPath.trim() && !localSettings.watchPaths.includes(newWatchPath.trim())) {
            setLocalSettings(prev => ({
                ...prev,
                watchPaths: [...prev.watchPaths, newWatchPath.trim()]
            }));
            setNewWatchPath('');
        }
    };

    /**
     * Removes a watch path
     */
    const handleRemoveWatchPath = (path: string) => {
        setLocalSettings(prev => ({
            ...prev,
            watchPaths: prev.watchPaths.filter(p => p !== path)
        }));
    };

    /**
     * Adds a new ignore path
     */
    const handleAddIgnorePath = () => {
        if (newIgnorePath.trim() && !localSettings.ignorePaths.includes(newIgnorePath.trim())) {
            setLocalSettings(prev => ({
                ...prev,
                ignorePaths: [...prev.ignorePaths, newIgnorePath.trim()]
            }));
            setNewIgnorePath('');
        }
    };

    /**
     * Removes an ignore path
     */
    const handleRemoveIgnorePath = (path: string) => {
        setLocalSettings(prev => ({
            ...prev,
            ignorePaths: prev.ignorePaths.filter(p => p !== path)
        }));
    };

    return (
        <div className="settings">
            <h2>Settings</h2>

            <div className="settings-section">
                <h3>General</h3>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.autoStart}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                autoStart: e.target.checked
                            }))}
                            disabled={isLoading}
                        />
                        Auto-start monitoring when app launches
                    </label>
                </div>
            </div>

            <div className="settings-section">
                <h3>Monitoring Features</h3>
                <p className="setting-description">
                    Enable or disable specific monitoring features. Disabled features will not collect data.
                </p>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enableAppMonitoring}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                enableAppMonitoring: e.target.checked
                            }))}
                            disabled={isLoading}
                        />
                        Application monitoring (requires Screen Recording permission)
                    </label>
                </div>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enableFileMonitoring}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                enableFileMonitoring: e.target.checked
                            }))}
                            disabled={isLoading}
                        />
                        File system monitoring
                    </label>
                </div>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enableBrowserMonitoring}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                enableBrowserMonitoring: e.target.checked
                            }))}
                            disabled={isLoading}
                        />
                        Browser tab monitoring (Chrome only)
                    </label>
                </div>
            </div>

            <Permissions />

            <div className="settings-section">
                <h3>Kafka Configuration</h3>

                <div className="setting-item">
                    <label htmlFor="kafka-broker">Kafka Broker:</label>
                    <input
                        id="kafka-broker"
                        type="text"
                        value={localSettings.kafkaBroker}
                        onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            kafkaBroker: e.target.value
                        }))}
                        placeholder="localhost:9092"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="settings-section">
                <h3>Watch Paths</h3>
                <p className="setting-description">
                    Directories to monitor for file changes. Leave empty to monitor all accessible directories.
                </p>

                <div className="path-input">
                    <input
                        type="text"
                        value={newWatchPath}
                        onChange={(e) => setNewWatchPath(e.target.value)}
                        placeholder="Enter directory path (e.g., /Users/username/Documents)"
                        disabled={isLoading}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddWatchPath()}
                    />
                    <button
                        onClick={handleAddWatchPath}
                        disabled={!newWatchPath.trim() || isLoading}
                        className="add-button"
                    >
                        Add
                    </button>
                </div>

                <div className="path-list">
                    {localSettings.watchPaths.length === 0 ? (
                        <p className="empty-message">No watch paths configured</p>
                    ) : (
                        localSettings.watchPaths.map((path, index) => (
                            <div key={index} className="path-item">
                                <span className="path-text">{path}</span>
                                <button
                                    onClick={() => handleRemoveWatchPath(path)}
                                    disabled={isLoading}
                                    className="remove-button"
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="settings-section">
                <h3>Ignore Patterns</h3>
                <p className="setting-description">
                    File patterns to ignore during monitoring. These will be excluded from file change detection.
                </p>

                <div className="path-input">
                    <input
                        type="text"
                        value={newIgnorePath}
                        onChange={(e) => setNewIgnorePath(e.target.value)}
                        placeholder="Enter pattern (e.g., *.tmp, node_modules)"
                        disabled={isLoading}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddIgnorePath()}
                    />
                    <button
                        onClick={handleAddIgnorePath}
                        disabled={!newIgnorePath.trim() || isLoading}
                        className="add-button"
                    >
                        Add
                    </button>
                </div>

                <div className="path-list">
                    {localSettings.ignorePaths.map((path, index) => (
                        <div key={index} className="path-item">
                            <span className="path-text">{path}</span>
                            <button
                                onClick={() => handleRemoveIgnorePath(path)}
                                disabled={isLoading}
                                className="remove-button"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="settings-actions">
                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="save-button"
                >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
} 