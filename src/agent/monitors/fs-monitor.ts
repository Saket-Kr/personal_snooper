import chokidar, { FSWatcher } from 'chokidar';
import { eventBus } from '../events';
import { formatFileEvent } from '../formatters/fs-event-formatter';
import path from 'path';

/**
 * FileSystemMonitor - Watches directories for file system changes
 * 
 * This monitor uses chokidar to efficiently watch directories for
 * file creation, modification, and deletion events. It includes
 * intelligent filtering to ignore common temporary files and system
 * directories.
 */
export class FileSystemMonitor {
    private watcher: FSWatcher | null = null;
    private watchPaths: string[] = [];
    private ignorePaths: string[] = [];

    /**
     * Starts monitoring the specified directories
     */
    start(watchPaths: string[], ignorePaths: string[] = []): void {
        if (this.watcher) {
            console.warn('[FSMonitor] Already running');
            return;
        }

        this.watchPaths = watchPaths;
        this.ignorePaths = ignorePaths;

        console.log('[FSMonitor] Starting with paths:', watchPaths);
        console.log('[FSMonitor] Ignoring:', ignorePaths);

        // Create watcher with optimized settings
        this.watcher = chokidar.watch(watchPaths, {
            ignored: [
                /(^|[\/\\])\../, // Hidden files
                /node_modules/,
                /\.git/,
                /\.DS_Store/,
                /\.tmp$/,
                /\.log$/,
                ...ignorePaths
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            },
            depth: 5, // Limit recursion depth
            usePolling: false, // Use native events when possible
            interval: 100,
            binaryInterval: 300
        });

        this.setupEventHandlers();
    }

    /**
     * Stops monitoring and cleans up resources
     */
    stop(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            console.log('[FSMonitor] Stopped');
        }
    }

    /**
     * Updates the watched paths and ignore patterns
     */
    updatePaths(watchPaths?: string[], ignorePaths?: string[]): void {
        if (!this.watcher) return;

        if (watchPaths) {
            // Add new paths
            const newPaths = watchPaths.filter(p => !this.watchPaths.includes(p));
            if (newPaths.length > 0) {
                this.watcher.add(newPaths);
                this.watchPaths = watchPaths;
            }
            
            // Remove old paths
            const removedPaths = this.watchPaths.filter(p => !watchPaths.includes(p));
            if (removedPaths.length > 0) {
                this.watcher.unwatch(removedPaths);
            }
        }

        if (ignorePaths) {
            this.ignorePaths = ignorePaths;
            // Restart watcher with new ignore patterns
            this.stop();
            this.start(this.watchPaths, this.ignorePaths);
        }
    }

    /**
     * Sets up event handlers for file system events
     */
    private setupEventHandlers(): void {
        if (!this.watcher) return;

        this.watcher
            .on('add', (filePath) => this.handleFileEvent('CREATED', filePath))
            .on('change', (filePath) => this.handleFileEvent('MODIFIED', filePath))
            .on('unlink', (filePath) => this.handleFileEvent('DELETED', filePath))
            .on('error', (error) => console.error('[FSMonitor] Error:', error))
            .on('ready', () => console.log('[FSMonitor] Initial scan complete'));
    }

    /**
     * Handles file system events and emits activity events
     */
    private handleFileEvent(changeType: string, filePath: string): void {
        // Additional filtering
        if (this.shouldIgnoreFile(filePath)) {
            return;
        }

        const event = formatFileEvent(changeType, filePath);
        eventBus.emit('activity', event);
    }

    /**
     * Determines if a file should be ignored based on patterns
     */
    private shouldIgnoreFile(filePath: string): boolean {
        const basename = path.basename(filePath);
        
        // Ignore common temporary files
        const tempPatterns = [
            /~$/,        // Backup files
            /\.tmp$/,    // Temp files
            /\.swp$/,    // Vim swap files
            /\.DS_Store/, // macOS files
            /\.log$/,    // Log files
            /\.cache$/,  // Cache files
            /\.bak$/,    // Backup files
            /\.old$/,    // Old files
            /\.orig$/    // Original files
        ];
        
        return tempPatterns.some(pattern => pattern.test(basename));
    }
} 