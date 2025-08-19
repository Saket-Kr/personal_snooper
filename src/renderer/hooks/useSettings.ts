import { useState, useEffect } from 'react';
import { UserSettings } from '../../shared/types';

/**
 * Custom hook for managing application settings
 * 
 * This hook provides a clean interface for loading, updating, and
 * managing user settings with proper error handling and loading states.
 */
export function useSettings() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Loads settings from the main process
     */
    const loadSettings = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const loadedSettings = await window.electronAPI.getSettings();
            setSettings(loadedSettings);
        } catch (err) {
            console.error('Failed to load settings:', err);
            setError('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Updates settings and persists them
     */
    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        if (!settings) return;
        
        setError(null);
        
        try {
            const updatedSettings = { ...settings, ...newSettings };
            const result = await window.electronAPI.updateSettings(updatedSettings);
            
            if (result.success) {
                setSettings(updatedSettings);
            } else {
                throw new Error(result.error || 'Failed to update settings');
            }
        } catch (err) {
            console.error('Failed to update settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to update settings');
            throw err;
        }
    };

    /**
     * Resets settings to defaults
     */
    const resetSettings = async () => {
        setError(null);
        
        try {
            const result = await window.electronAPI.updateSettings({
                autoStart: false,
                watchPaths: [],
                ignorePaths: ['node_modules', '.git', '.DS_Store', '*.tmp', '*.log'],
                kafkaBroker: 'localhost:9092',
                userId: settings?.userId || 'default-user'
            });
            
            if (result.success) {
                await loadSettings(); // Reload settings after reset
            } else {
                throw new Error(result.error || 'Failed to reset settings');
            }
        } catch (err) {
            console.error('Failed to reset settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to reset settings');
            throw err;
        }
    };

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        resetSettings,
        reloadSettings: loadSettings
    };
} 