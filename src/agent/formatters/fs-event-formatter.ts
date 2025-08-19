import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { FileChangeEvent } from '../../shared/types';

/**
 * Formats file system change data into standardized activity events
 * 
 * This function takes file system change information and converts
 * it into our standardized event format with additional metadata
 * like file size and directory information.
 */
export function formatFileEvent(changeType: string, filePath: string): FileChangeEvent {
    const absolutePath = path.resolve(filePath);
    
    return {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        userId: process.env.USER_ID || 'default-user',
        eventType: 'FILE_CHANGED',
        payload: {
            filePath: absolutePath,
            changeType: changeType as 'CREATED' | 'MODIFIED' | 'DELETED',
            fileName: path.basename(filePath),
            fileExtension: path.extname(filePath),
            directory: path.dirname(absolutePath),
            fileSize: getFileSize(absolutePath, changeType)
        }
    };
}

/**
 * Gets the file size for the event, handling different change types
 */
function getFileSize(filePath: string, changeType: string): number | undefined {
    // Don't try to get file size for deleted files
    if (changeType === 'DELETED') {
        return undefined;
    }

    try {
        const stats = fs.statSync(filePath);
        return stats.isFile() ? stats.size : undefined;
    } catch {
        // File might not exist yet or be inaccessible
        return undefined;
    }
} 