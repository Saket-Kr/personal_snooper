import { ActivityEvent } from '../../shared/types';

export interface KafkaConsumerConfig {
    broker: string;
    topic: string;
    groupId: string;
    clientId: string;
}

export interface StreamStats {
    eventsPerSecond: number;
    totalEvents: number;
    lastEventTime: string | null;
    connectionStatus: 'connected' | 'disconnected';
    topic: string;
    groupId: string;
}

export class KafkaConsumerService {
    private isConnected = false;
    private eventBuffer: ActivityEvent[] = [];
    private subscribers: Set<(events: ActivityEvent[]) => void> = new Set();
    private statsSubscribers: Set<(stats: StreamStats) => void> = new Set();
    private config: KafkaConsumerConfig;

    constructor(config: KafkaConsumerConfig) {
        this.config = config;
        this.setupIpcListeners();
    }

    async connect(): Promise<void> {
        try {
            const result = await window.electronAPI.invoke('kafka:connect', this.config);
            if (result.success) {
                this.isConnected = true;
                console.log('[KafkaConsumer] Connected to Kafka via IPC');
            } else {
                throw new Error(result.error || 'Failed to connect');
            }
        } catch (error) {
            console.error('[KafkaConsumer] Failed to connect:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            const result = await window.electronAPI.invoke('kafka:disconnect');
            if (result.success) {
                this.isConnected = false;
                console.log('[KafkaConsumer] Disconnected from Kafka');
            }
        } catch (error) {
            console.error('[KafkaConsumer] Error disconnecting:', error);
        }
    }

    subscribe(callback: (events: ActivityEvent[]) => void): () => void {
        this.subscribers.add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    subscribeToStats(callback: (stats: StreamStats) => void): () => void {
        this.statsSubscribers.add(callback);

        return () => {
            this.statsSubscribers.delete(callback);
        };
    }

    private setupIpcListeners(): void {
        // Listen for events from main process
        window.electronAPI.on('kafka:events', (events: ActivityEvent[]) => {
            this.processEvents(events);
        });

        // Listen for stats from main process
        window.electronAPI.on('kafka:stats', (stats: StreamStats) => {
            this.notifyStatsSubscribers(stats);
        });
    }

    private processEvents(events: ActivityEvent[]): void {
        // Add to buffer
        this.eventBuffer.push(...events);

        // Keep buffer size manageable
        if (this.eventBuffer.length > 1000) {
            this.eventBuffer = this.eventBuffer.slice(-500);
        }

        // Notify subscribers
        this.notifySubscribers(events);
    }

    private notifySubscribers(events: ActivityEvent[]): void {
        this.subscribers.forEach(callback => {
            try {
                callback(events);
            } catch (error) {
                console.error('[KafkaConsumer] Error in subscriber callback:', error);
            }
        });
    }

    private notifyStatsSubscribers(stats: StreamStats): void {
        this.statsSubscribers.forEach(callback => {
            try {
                callback(stats);
            } catch (error) {
                console.error('[KafkaConsumer] Error in stats subscriber callback:', error);
            }
        });
    }

    async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
        try {
            const result = await window.electronAPI.invoke('kafka:get-status');
            return result.status;
        } catch (error) {
            console.error('[KafkaConsumer] Error getting status:', error);
            return 'disconnected';
        }
    }

    async getRecentEvents(limit: number = 50): Promise<ActivityEvent[]> {
        try {
            const events = await window.electronAPI.invoke('kafka:get-recent-events', limit);
            return events || [];
        } catch (error) {
            console.error('[KafkaConsumer] Error getting recent events:', error);
            return [];
        }
    }
}
