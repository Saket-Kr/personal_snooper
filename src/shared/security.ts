/**
 * Security utilities for the Desktop Activity Tracker
 * 
 * This module provides tools for input validation, sanitization,
 * and security checks to protect against common vulnerabilities.
 */

import path from 'path';

export class SecurityValidator {
    private static readonly SENSITIVE_PATTERNS = [
        /password/i,
        /secret/i,
        /token/i,
        /key/i,
        /\.env$/,
        /\.pem$/,
        /\.key$/,
        /\.crt$/,
        /\.p12$/,
        /\.pfx$/
    ];

    private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:', 'file:'];

    /**
     * Validates and sanitizes file paths
     */
    static validateFilePath(filePath: string): { isValid: boolean; sanitized: string; error?: string } {
        try {
            // Check for null/undefined
            if (!filePath || typeof filePath !== 'string') {
                return { isValid: false, sanitized: '', error: 'Invalid file path' };
            }

            // Check for path traversal attempts
            const normalizedPath = path.normalize(filePath);
            if (normalizedPath.includes('..') || normalizedPath.includes('//')) {
                return { isValid: false, sanitized: '', error: 'Path traversal detected' };
            }

            // Check for sensitive files
            if (this.SENSITIVE_PATTERNS.some(pattern => pattern.test(filePath))) {
                return { isValid: false, sanitized: '', error: 'Sensitive file type detected' };
            }

            // Limit path length
            if (filePath.length > 4096) {
                return { isValid: false, sanitized: '', error: 'Path too long' };
            }

            return { isValid: true, sanitized: normalizedPath };
        } catch (error) {
            return { isValid: false, sanitized: '', error: 'Invalid path format' };
        }
    }

    /**
     * Validates and sanitizes URLs
     */
    static validateUrl(url: string): { isValid: boolean; sanitized: string; error?: string } {
        try {
            // Check for null/undefined
            if (!url || typeof url !== 'string') {
                return { isValid: false, sanitized: '', error: 'Invalid URL' };
            }

            // Parse URL
            const parsedUrl = new URL(url);

            // Check protocol
            if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
                return { isValid: false, sanitized: '', error: 'Unsupported protocol' };
            }

            // Remove sensitive query parameters
            const sensitiveParams = ['password', 'token', 'key', 'secret', 'auth'];
            sensitiveParams.forEach(param => {
                parsedUrl.searchParams.delete(param);
            });

            // Remove user info from URL
            parsedUrl.username = '';
            parsedUrl.password = '';

            return { isValid: true, sanitized: parsedUrl.toString() };
        } catch (error) {
            return { isValid: false, sanitized: '', error: 'Invalid URL format' };
        }
    }

    /**
     * Validates user settings
     */
    static validateSettings(settings: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required fields
        if (!settings.userId || typeof settings.userId !== 'string') {
            errors.push('Invalid user ID');
        }

        if (!settings.kafkaBroker || typeof settings.kafkaBroker !== 'string') {
            errors.push('Invalid Kafka broker');
        }

        // Validate arrays
        if (!Array.isArray(settings.watchPaths)) {
            errors.push('Watch paths must be an array');
        } else {
            settings.watchPaths.forEach((path: string, index: number) => {
                const validation = this.validateFilePath(path);
                if (!validation.isValid) {
                    errors.push(`Invalid watch path at index ${index}: ${validation.error}`);
                }
            });
        }

        if (!Array.isArray(settings.ignorePaths)) {
            errors.push('Ignore paths must be an array');
        } else {
            settings.ignorePaths.forEach((pattern: string, index: number) => {
                if (typeof pattern !== 'string' || pattern.length === 0) {
                    errors.push(`Invalid ignore pattern at index ${index}`);
                }
            });
        }

        // Validate boolean
        if (typeof settings.autoStart !== 'boolean') {
            errors.push('Auto-start must be a boolean');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitizes user input for display
     */
    static sanitizeForDisplay(input: string): string {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Remove HTML tags
        let sanitized = input.replace(/<[^>]*>/g, '');

        // Escape special characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // Limit length
        if (sanitized.length > 1000) {
            sanitized = sanitized.substring(0, 1000) + '...';
        }

        return sanitized;
    }

    /**
     * Validates IPC messages
     */
    static validateIpcMessage(message: any): { isValid: boolean; error?: string } {
        // Check for null/undefined
        if (!message || typeof message !== 'object') {
            return { isValid: false, error: 'Invalid message format' };
        }

        // Check for required fields
        if (!message.type || typeof message.type !== 'string') {
            return { isValid: false, error: 'Missing or invalid message type' };
        }

        // Validate message types
        const allowedTypes = ['start', 'stop', 'updateConfig', 'getSettings', 'updateSettings'];
        if (!allowedTypes.includes(message.type)) {
            return { isValid: false, error: 'Invalid message type' };
        }

        // Check message size
        const messageSize = JSON.stringify(message).length;
        if (messageSize > 1024 * 1024) { // 1MB limit
            return { isValid: false, error: 'Message too large' };
        }

        return { isValid: true };
    }

    /**
     * Checks if a path should be ignored for security reasons
     */
    static shouldIgnorePath(filePath: string): boolean {
        if (!filePath || typeof filePath !== 'string') {
            return true;
        }

        const normalizedPath = path.normalize(filePath).toLowerCase();

        // Check for system directories
        const systemDirs = [
            '/system', '/windows', '/program files', '/programdata',
            '/usr', '/etc', '/var', '/bin', '/sbin', '/lib',
            '/private', '/library', '/applications'
        ];

        if (systemDirs.some(dir => normalizedPath.includes(dir))) {
            return true;
        }

        // Check for sensitive patterns
        if (this.SENSITIVE_PATTERNS.some(pattern => pattern.test(normalizedPath))) {
            return true;
        }

        return false;
    }

    /**
     * Validates Kafka broker configuration
     */
    static validateKafkaBroker(broker: string): { isValid: boolean; error?: string } {
        if (!broker || typeof broker !== 'string') {
            return { isValid: false, error: 'Invalid broker configuration' };
        }

        // Check format: host:port
        const brokerRegex = /^[a-zA-Z0-9.-]+:\d+$/;
        if (!brokerRegex.test(broker)) {
            return { isValid: false, error: 'Invalid broker format (expected host:port)' };
        }

        // Check port range
        const port = parseInt(broker.split(':')[1]);
        if (port < 1 || port > 65535) {
            return { isValid: false, error: 'Invalid port number' };
        }

        // Check hostname length
        const hostname = broker.split(':')[0];
        if (hostname.length > 253) {
            return { isValid: false, error: 'Hostname too long' };
        }

        return { isValid: true };
    }

    /**
     * Generates a secure user ID
     */
    static generateSecureUserId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        return `user_${timestamp}_${random}`;
    }
} 