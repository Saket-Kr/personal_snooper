import { BrowserWindow, shell } from 'electron';
import path from 'path';
import { isDev } from '../shared/utils';

export function createWindow(): BrowserWindow {
    const window = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Desktop Activity Tracker',
        icon: path.join(__dirname, '../../assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, '../../preload/preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false // Disable sandbox to allow preload script to work
        },
        show: false, // Don't show until ready
        backgroundColor: '#ffffff',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the app
    if (isDev()) {
        window.loadURL('http://localhost:3000');
        window.webContents.openDevTools();
    } else {
        window.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }

    // Show window when ready
    window.once('ready-to-show', () => {
        window.show();
    });

    // Open external links in browser
    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation away from the app
    window.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('http://localhost:3000') && !url.startsWith('file://')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    return window;
} 