import React, { useState, useEffect } from 'react';
import { PermissionInfo } from '../../shared/types';

interface PermissionsProps {
    onPermissionChange?: (permissions: PermissionInfo) => void;
}

export function Permissions({ onPermissionChange }: PermissionsProps) {
    const [permissions, setPermissions] = useState<PermissionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await window.electronAPI.checkPermissions();
            setPermissions(result);
            onPermissionChange?.(result);
        } catch (err) {
            setError('Failed to check permissions');
            console.error('Permission check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const openSystemPreferences = async () => {
        try {
            await window.electronAPI.openSystemPreferences();
        } catch (err) {
            console.error('Failed to open system preferences:', err);
        }
    };

    if (loading) {
        return (
            <div className="permissions-section">
                <h3>Permissions</h3>
                <p>Checking permissions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="permissions-section">
                <h3>Permissions</h3>
                <p className="error">Error: {error}</p>
                <button onClick={checkPermissions} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    if (!permissions) {
        return (
            <div className="permissions-section">
                <h3>Permissions</h3>
                <p>No permission information available</p>
            </div>
        );
    }

    const allGranted = Object.values(permissions).every(p => p.granted);

    return (
        <div className="permissions-section">
            <h3>Permissions</h3>
            
            {allGranted ? (
                <div className="permission-status success">
                    <span className="status-icon">✅</span>
                    <span>All permissions granted</span>
                </div>
            ) : (
                <div className="permission-status warning">
                    <span className="status-icon">⚠️</span>
                    <span>Some permissions are missing</span>
                </div>
            )}

            <div className="permission-list">
                {Object.entries(permissions).map(([key, permission]) => (
                    <div key={key} className={`permission-item ${permission.granted ? 'granted' : 'missing'}`}>
                        <div className="permission-header">
                            <span className="permission-name">
                                {key === 'screenRecording' ? 'Screen Recording' :
                                 key === 'accessibility' ? 'Accessibility' :
                                 key === 'fileSystem' ? 'File System' : key}
                            </span>
                            <span className="permission-status">
                                {permission.granted ? '✅ Granted' : '❌ Missing'}
                            </span>
                        </div>
                        
                        {!permission.granted && (
                            <div className="permission-instructions">
                                <p>{permission.instructions}</p>
                                <button 
                                    onClick={openSystemPreferences}
                                    className="open-preferences-button"
                                >
                                    Open System Preferences
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="permission-actions">
                <button onClick={checkPermissions} className="refresh-button">
                    Refresh Permissions
                </button>
            </div>
        </div>
    );
}
