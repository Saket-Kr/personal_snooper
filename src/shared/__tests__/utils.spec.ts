import { describe, it, expect } from 'vitest';
import { isDev, formatBytes, formatDuration, generateUserId } from '../utils';

describe('Utils', () => {
  it('should detect development environment', () => {
    // Test that isDev works
    expect(typeof isDev()).toBe('boolean');
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('should format duration correctly', () => {
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(3661000)).toBe('1h 1m');
  });

  it('should generate user ID', () => {
    const userId = generateUserId();
    expect(userId).toMatch(/^user-\d+-\w+$/);
  });
}); 