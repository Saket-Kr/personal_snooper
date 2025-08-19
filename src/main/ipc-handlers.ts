import { BrowserWindow, ipcMain } from 'electron';
import { IpcChannels } from '../shared/constants';
import { PermissionChecker } from '../shared/permissions';
import { AgentManager } from './agent-manager';
import { KafkaConsumerService } from './kafka-consumer';
import { SettingsManager } from './settings-manager';

export function setupIpcHandlers(
  agentManager: AgentManager,
  settingsManager: SettingsManager
): void {
  // Agent control
  ipcMain.handle(IpcChannels.START_MONITORING, async () => {
    try {
      const settings = settingsManager.getSettings();
      await agentManager.start(settings);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IpcChannels.STOP_MONITORING, async () => {
    try {
      await agentManager.stop();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IpcChannels.GET_MONITORING_STATUS, () => {
    return {
      isRunning: agentManager.isRunning(),
      stats: agentManager.getStats()
    };
  });

  // Settings management
  ipcMain.handle(IpcChannels.GET_SETTINGS, () => {
    return settingsManager.getSettings();
  });

  ipcMain.handle(IpcChannels.UPDATE_SETTINGS, async (_, newSettings) => {
    try {
      await settingsManager.updateSettings(newSettings);

      // If agent is running, update its config
      if (agentManager.isRunning()) {
        await agentManager.updateConfig(newSettings);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Real-time status updates
  agentManager.on('statusChange', (status) => {
    // Send to all windows
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IpcChannels.MONITORING_STATUS_CHANGED, status);
    });
  });

  // Permission management
  ipcMain.handle(IpcChannels.CHECK_PERMISSIONS, async () => {
    try {
      return await PermissionChecker.checkPermissions();
    } catch (error) {
      return { error: (error as Error).message };
    }
  });

  ipcMain.handle(IpcChannels.OPEN_SYSTEM_PREFERENCES, () => {
    try {
      PermissionChecker.openSystemPreferences();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Kafka Consumer IPC handlers
  let kafkaConsumer: KafkaConsumerService | null = null;

  ipcMain.handle('kafka:connect', async (event, config) => {
    try {
      if (kafkaConsumer) {
        await kafkaConsumer.disconnect();
      }

      kafkaConsumer = new KafkaConsumerService(config);
      await kafkaConsumer.connect();

      // Set up event forwarding to renderer
      kafkaConsumer.subscribe((events) => {
        event.sender.send('kafka:events', events);
      });

      kafkaConsumer.subscribeToStats((stats) => {
        event.sender.send('kafka:stats', stats);
      });

      return { success: true };
    } catch (error) {
      console.error('[IPC] Kafka connect error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('kafka:disconnect', async () => {
    try {
      if (kafkaConsumer) {
        await kafkaConsumer.disconnect();
        kafkaConsumer = null;
      }
      return { success: true };
    } catch (error) {
      console.error('[IPC] Kafka disconnect error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('kafka:get-status', () => {
    if (!kafkaConsumer) {
      return { status: 'disconnected' };
    }
    return { status: kafkaConsumer.getConnectionStatus() };
  });

  ipcMain.handle('kafka:get-recent-events', (event, limit) => {
    if (!kafkaConsumer) {
      return [];
    }
    return kafkaConsumer.getRecentEvents(limit);
  });
} 