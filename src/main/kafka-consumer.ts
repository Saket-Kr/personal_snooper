import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { ActivityEvent } from '../shared/types';

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
    private kafka: Kafka;
    private consumer: Consumer;
    private isConnected = false;
    private eventBuffer: ActivityEvent[] = [];
    private subscribers: Set<(events: ActivityEvent[]) => void> = new Set();
    private statsSubscribers: Set<(stats: StreamStats) => void> = new Set();
    private reconnectInterval: NodeJS.Timeout | null = null;
    private statsInterval: NodeJS.Timeout | null = null;
    private lastEventTime = Date.now();
    private eventCount = 0;

    constructor(private config: KafkaConsumerConfig) {
        this.kafka = new Kafka({
            clientId: config.clientId,
            brokers: [config.broker],
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });

        this.consumer = this.kafka.consumer({
            groupId: config.groupId,
            sessionTimeout: 30000,
            heartbeatInterval: 3000
        });
    }

    async connect(): Promise<void> {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ topic: this.config.topic, fromBeginning: false });

            this.isConnected = true;
            console.log('[KafkaConsumer] Connected to Kafka');

            // Start consuming messages
            await this.startConsuming();

            // Start stats collection
            this.startStatsCollection();

        } catch (error) {
            console.error('[KafkaConsumer] Failed to connect:', error);
            this.scheduleReconnect();
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;

        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        try {
            await this.consumer.disconnect();
            console.log('[KafkaConsumer] Disconnected from Kafka');
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

    private async startConsuming(): Promise<void> {
        await this.consumer.run({
            eachMessage: async (payload: EachMessagePayload) => {
                try {
                    const event = this.parseMessage(payload);
                    if (event) {
                        this.processEvent(event);
                    }
                } catch (error) {
                    console.error('[KafkaConsumer] Error processing message:', error);
                }
            }
        });
    }

    private parseMessage(payload: EachMessagePayload): ActivityEvent | null {
        try {
            const value = payload.message.value?.toString();
            if (!value) return null;

            const event = JSON.parse(value) as ActivityEvent;
            return event;
        } catch (error) {
            console.error('[KafkaConsumer] Error parsing message:', error);
            return null;
        }
    }

    private processEvent(event: ActivityEvent): void {
        this.eventBuffer.push(event);
        this.eventCount++;
        this.lastEventTime = Date.now();

        // Keep buffer size manageable
        if (this.eventBuffer.length > 1000) {
            this.eventBuffer = this.eventBuffer.slice(-500);
        }

        // Notify subscribers
        this.notifySubscribers([event]);
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

    private startStatsCollection(): void {
        this.statsInterval = setInterval(() => {
            const now = Date.now();
            const timeDiff = (now - this.lastEventTime) / 1000;
            const eventsPerSecond = timeDiff > 0 ? 1 / timeDiff : 0;

            const stats: StreamStats = {
                eventsPerSecond: Math.min(eventsPerSecond, 100), // Cap at 100 for display
                totalEvents: this.eventCount,
                lastEventTime: this.lastEventTime > 0 ? new Date(this.lastEventTime).toISOString() : null,
                connectionStatus: this.isConnected ? 'connected' : 'disconnected',
                topic: this.config.topic,
                groupId: this.config.groupId
            };

            this.notifyStatsSubscribers(stats);
        }, 1000);
    }

    private scheduleReconnect(): void {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }

        this.reconnectInterval = setInterval(async () => {
            if (!this.isConnected) {
                console.log('[KafkaConsumer] Attempting to reconnect...');
                try {
                    await this.connect();
                } catch (error) {
                    console.error('[KafkaConsumer] Reconnection failed:', error);
                }
            }
        }, 5000);
    }

    getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
        return this.isConnected ? 'connected' : 'disconnected';
    }

    getRecentEvents(limit: number = 50): ActivityEvent[] {
        return this.eventBuffer.slice(-limit);
    }
}
