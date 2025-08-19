import { useEffect, useState } from 'react';

/**
 * Custom hook for managing monitoring state and communication with main process
 * 
 * This hook provides a clean interface for the React components to interact
 * with the monitoring system, handling IPC communication and state management.
 */
export function useMonitoring() {
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState({
        eventsProcessed: 0,
        uptime: 0,
        lastError: null as string | null
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Get initial status
        checkStatus();

        // Listen for status changes from main process
        window.electronAPI.onMonitoringStatusChanged((status) => {
            setIsRunning(status.isRunning);
            if (status.stats) {
                setStats(status.stats);
            }
        });

        // Periodic status updates
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    /**
     * Checks the current monitoring status from the main process
     */
    async function checkStatus() {
        try {
            const status = await window.electronAPI.getMonitoringStatus();
            setIsRunning(status.isRunning);
            setStats(status.stats);
        } catch (error) {
            console.error('Failed to get monitoring status:', error);
        }
    }

    /**
     * Starts the monitoring system
     */
    async function start() {
        setIsLoading(true);
        try {
            const result = await window.electronAPI.startMonitoring();
            if (result.success) {
                setIsRunning(true);
            } else {
                console.error('Failed to start monitoring:', result.error);
                setStats(prev => ({ ...prev, lastError: result.error }));
            }
        } catch (error) {
            console.error('Error starting monitoring:', error);
            setStats(prev => ({ ...prev, lastError: (error as Error).message }));
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Stops the monitoring system
     */
    async function stop() {
        setIsLoading(true);
        try {
            const result = await window.electronAPI.stopMonitoring();
            if (result.success) {
                setIsRunning(false);
            } else {
                console.error('Failed to stop monitoring:', result.error);
                setStats(prev => ({ ...prev, lastError: result.error }));
            }
        } catch (error) {
            console.error('Error stopping monitoring:', error);
            setStats(prev => ({ ...prev, lastError: (error as Error).message }));
        } finally {
            setIsLoading(false);
        }
    }

    return {
        isRunning,
        stats,
        isLoading,
        start,
        stop
    };
} 