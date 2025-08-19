import { Kafka, Producer, Message } from 'kafkajs';
import { ActivityEvent } from '../../shared/types';

/**
 * KafkaEmitter - Manages Kafka connection and event streaming
 * 
 * This service handles the connection to Apache Kafka and provides
 * reliable event streaming with buffering, batching, and retry logic.
 * It ensures events are not lost even if the connection is temporarily
 * unavailable.
 */
export class KafkaEmitter {
    private kafka: Kafka;
    private producer: Producer;
    private isConnected = false;
    private messageBuffer: Message[] = [];
    private flushInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'desktop-activity-tracker',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });

        this.producer = this.kafka.producer({
            allowAutoTopicCreation: true,
            transactionTimeout: 30000
        });
    }

    /**
     * Connects to Kafka and starts the buffer flush interval
     */
    async connect(): Promise<void> {
        try {
            await this.producer.connect();
            this.isConnected = true;
            console.log('[KafkaEmitter] Connected to Kafka');
            
            // Start buffer flush interval
            this.startBufferFlush();
            
            // Process any buffered messages
            await this.flushBuffer();
        } catch (error) {
            console.error('[KafkaEmitter] Failed to connect:', error);
            throw error;
        }
    }

    /**
     * Disconnects from Kafka and cleans up resources
     */
    async disconnect(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }

        // Flush remaining messages
        await this.flushBuffer();

        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
            console.log('[KafkaEmitter] Disconnected from Kafka');
        }
    }

    /**
     * Sends an activity event to Kafka
     * 
     * If connected, adds to buffer for batch sending.
     * If not connected, buffers the message for later.
     */
    async sendEvent(event: ActivityEvent): Promise<void> {
        const message: Message = {
            key: event.userId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString()
        };

        if (this.isConnected) {
            // Add to buffer for batch sending
            this.messageBuffer.push(message);
            
            // Flush if buffer is getting large
            if (this.messageBuffer.length >= 100) {
                await this.flushBuffer();
            }
        } else {
            console.warn('[KafkaEmitter] Not connected, buffering message');
            this.messageBuffer.push(message);
        }
    }

    /**
     * Starts the periodic buffer flush interval
     */
    private startBufferFlush(): void {
        // Flush buffer every 5 seconds
        this.flushInterval = setInterval(async () => {
            if (this.messageBuffer.length > 0) {
                await this.flushBuffer();
            }
        }, 5000);
    }

    /**
     * Flushes the message buffer to Kafka
     * 
     * This method sends all buffered messages in a single batch
     * for efficiency. If sending fails, messages are re-added to
     * the buffer for retry.
     */
    private async flushBuffer(): Promise<void> {
        if (this.messageBuffer.length === 0 || !this.isConnected) {
            return;
        }

        const messages = [...this.messageBuffer];
        this.messageBuffer = [];

        try {
            await this.producer.send({
                topic: 'user-activity-events',
                messages,
                compression: 1 // GZIP compression
            });
            
            console.log(`[KafkaEmitter] Sent ${messages.length} events`);
        } catch (error) {
            console.error('[KafkaEmitter] Failed to send messages:', error);
            // Re-add messages to buffer for retry
            this.messageBuffer.unshift(...messages);
        }
    }
} 