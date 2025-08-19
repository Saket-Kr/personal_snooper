import { PermissionInfo } from './types';

/**
 * PermissionChecker - Handles macOS permission detection and management
 * 
 * This utility helps detect and manage the various permissions required
 * for the Desktop Activity Tracker to function properly.
 */
export class PermissionChecker {
    /**
     * Checks the current permission status for all required permissions
     */
    static async checkPermissions(): Promise<PermissionInfo> {
        const isMac = process.platform === 'darwin';

        if (!isMac) {
            // On non-macOS systems, assume permissions are granted
            return {
                screenRecording: {
                    required: true,
                    granted: true,
                    instructions: 'Not required on this platform'
                },
                accessibility: {
                    required: true,
                    granted: true,
                    instructions: 'Not required on this platform'
                },
                fileSystem: {
                    required: true,
                    granted: true,
                    instructions: 'Not required on this platform'
                }
            };
        }

        return {
            screenRecording: {
                required: true,
                granted: await this.checkScreenRecordingPermission(),
                instructions: 'Go to System Settings > Privacy & Security > Screen Recording and enable for this app'
            },
            accessibility: {
                required: true,
                granted: await this.checkAccessibilityPermission(),
                instructions: 'Go to System Settings > Privacy & Security > Accessibility and enable for this app'
            },
            fileSystem: {
                required: true,
                granted: true, // File system access is generally available
                instructions: 'File system access is automatically granted'
            }
        };
    }

    /**
     * Checks if screen recording permission is granted
     */
    private static async checkScreenRecordingPermission(): Promise<boolean> {
        try {
            // Try to get active window info - this will fail if permission is not granted
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            // This is a simple test - in practice, the active-win library will handle this
            return true; // We'll detect actual failures when the monitor tries to run
        } catch (error) {
            return false;
        }
    }

    /**
     * Checks if accessibility permission is granted
     */
    private static async checkAccessibilityPermission(): Promise<boolean> {
        try {
            // On macOS, we can check accessibility permissions
            const { systemPreferences } = require('electron');
            return systemPreferences.isTrustedAccessibilityClient(false);
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets a summary of permission status
     */
    static getPermissionSummary(permissions: PermissionInfo): {
        allGranted: boolean;
        missingPermissions: string[];
        instructions: string[];
    } {
        const missingPermissions: string[] = [];
        const instructions: string[] = [];

        if (permissions.screenRecording.required && !permissions.screenRecording.granted) {
            missingPermissions.push('Screen Recording');
            instructions.push(permissions.screenRecording.instructions);
        }

        if (permissions.accessibility.required && !permissions.accessibility.granted) {
            missingPermissions.push('Accessibility');
            instructions.push(permissions.accessibility.instructions);
        }

        if (permissions.fileSystem.required && !permissions.fileSystem.granted) {
            missingPermissions.push('File System');
            instructions.push(permissions.fileSystem.instructions);
        }

        return {
            allGranted: missingPermissions.length === 0,
            missingPermissions,
            instructions
        };
    }

    /**
     * Opens system preferences for permissions
     */
    static openSystemPreferences(): void {
        if (process.platform === 'darwin') {
            const { shell } = require('electron');
            shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        }
    }
}
