import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import path from 'path';
import { isDev } from '../shared/utils';
import { AgentManager } from './agent-manager';
import { setupIpcHandlers } from './ipc-handlers';
import { SettingsManager } from './settings-manager';
import { createWindow } from './window';

// Prevent multiple instances (only in production or when not testing)
const gotTheLock = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' ? true : app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // Global references to prevent garbage collection
    let mainWindow: BrowserWindow | null = null;
    let tray: Tray | null = null;

    // Initialize managers
    const agentManager = new AgentManager();
    const settingsManager = new SettingsManager();

    // Handle second instance attempt
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // App event handlers
    app.whenReady().then(async () => {
        try {
            // Load user settings
            await settingsManager.load();
            console.log('[Main] Settings loaded successfully');

            // Create main window
            mainWindow = createWindow();

            // Setup IPC handlers
            setupIpcHandlers(agentManager, settingsManager);

            // Create system tray (only in production)
            if (!isDev()) {
                tray = createTray();
            }

            // Auto-start agent if enabled
            const settings = settingsManager.getSettings();
            if (settings.autoStart) {
                console.log('[Main] Auto-starting agent...');
                await agentManager.start(settings);
            }
        } catch (error) {
            console.error('[Main] Failed to initialize app:', error);
        }
    });

    app.on('window-all-closed', () => {
        // On macOS, keep app running in background
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow();
        }
    });

    app.on('before-quit', async () => {
        console.log('[Main] App shutting down...');

        // Gracefully stop agent
        try {
            await agentManager.stop();
        } catch (error) {
            console.error('[Main] Error stopping agent:', error);
        }

        // Close settings manager
        try {
            await settingsManager.close();
        } catch (error) {
            console.error('[Main] Error closing settings manager:', error);
        }
    });

    // System tray creation
    function createTray(): Tray {
        const icon = nativeImage.createFromPath(
            path.join(__dirname, '../../assets/tray-icon.png')
        );

        const tray = new Tray(icon);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                    }
                }
            },
            {
                label: 'Start Monitoring',
                click: async () => {
                    const settings = settingsManager.getSettings();
                    await agentManager.start(settings);
                }
            },
            {
                label: 'Stop Monitoring',
                click: async () => {
                    await agentManager.stop();
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('Desktop Activity Tracker');
        tray.setContextMenu(contextMenu);

        return tray;
    }
}

// Enable live reload for Electron in development (but not in testing)
if (isDev() && process.env.NODE_ENV !== 'test') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '../../node_modules/.bin/electron'),
        hardResetMethod: 'exit'
    });
} 