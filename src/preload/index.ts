import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/constants';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  startMonitoring: () => ipcRenderer.invoke(IpcChannels.START_MONITORING),
  stopMonitoring: () => ipcRenderer.invoke(IpcChannels.STOP_MONITORING),
  getMonitoringStatus: () => ipcRenderer.invoke(IpcChannels.GET_MONITORING_STATUS),
  getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  updateSettings: (settings: any) => ipcRenderer.invoke(IpcChannels.UPDATE_SETTINGS, settings),
  checkPermissions: () => ipcRenderer.invoke(IpcChannels.CHECK_PERMISSIONS),
  openSystemPreferences: () => ipcRenderer.invoke(IpcChannels.OPEN_SYSTEM_PREFERENCES),
  onMonitoringStatusChanged: (callback: (status: any) => void) => {
    ipcRenderer.on(IpcChannels.MONITORING_STATUS_CHANGED, (_, status) => callback(status));
  },
  // Kafka IPC methods
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  }
}); 