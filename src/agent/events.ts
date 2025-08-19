import { EventEmitter } from 'events';
import { ActivityEvent } from '../shared/types';

/**
 * TypedEventEmitter - Type-safe event emitter for activity events
 * 
 * This extends the standard EventEmitter to provide type safety
 * for our activity events, ensuring only valid events can be emitted.
 */
class TypedEventEmitter extends EventEmitter {
    emit(event: 'activity', data: ActivityEvent): boolean;
    emit(event: string | symbol, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: 'activity', listener: (data: ActivityEvent) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'activity', listener: (data: ActivityEvent) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }
}

// Export singleton instance
export const eventBus = new TypedEventEmitter();

// Set max listeners to prevent warnings
eventBus.setMaxListeners(20);

/**
 * Event bus usage:
 * 
 * // Emit an activity event
 * eventBus.emit('activity', activityEvent);
 * 
 * // Listen for activity events
 * eventBus.on('activity', (event) => {
 *   console.log('Activity detected:', event);
 * });
 */ 