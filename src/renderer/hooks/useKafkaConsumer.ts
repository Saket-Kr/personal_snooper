import { useEffect, useRef } from 'react';
import { ActivityEvent } from '../../shared/types';
import { useKafkaStreams } from '../contexts/KafkaContext';
import { KafkaConsumerConfig, KafkaConsumerService } from '../services/KafkaConsumerService';

export function useKafkaConsumer() {
    const consumerRef = useRef<KafkaConsumerService | null>(null);
    const { addEvents, updateStats, setConnectionStatus } = useKafkaStreams();

    // Use refs to avoid dependency issues
    const addEventsRef = useRef(addEvents);
    const updateStatsRef = useRef(updateStats);
    const setConnectionStatusRef = useRef(setConnectionStatus);

    // Update refs when functions change
    addEventsRef.current = addEvents;
    updateStatsRef.current = updateStats;
    setConnectionStatusRef.current = setConnectionStatus;

    useEffect(() => {
        // Initialize Kafka consumer
        const config: KafkaConsumerConfig = {
            broker: 'localhost:9092',
            topic: 'user-activity-events',
            groupId: 'kafka-ui-consumer',
            clientId: 'kafka-ui-client'
        };

        const consumer = new KafkaConsumerService(config);
        consumerRef.current = consumer;

        // Subscribe to events
        const unsubscribeEvents = consumer.subscribe((events: ActivityEvent[]) => {
            addEventsRef.current(events);
        });

        // Subscribe to stats
        const unsubscribeStats = consumer.subscribeToStats((stats) => {
            updateStatsRef.current({
                eventsPerSecond: stats.eventsPerSecond,
                totalEvents: stats.totalEvents,
                lastEventTime: stats.lastEventTime,
                appUsage: {},
                eventTypeDistribution: {}
            });
        });

        // Connect to Kafka
        const connectToKafka = async () => {
            try {
                setConnectionStatusRef.current('connecting');
                await consumer.connect();
                setConnectionStatusRef.current('connected');
            } catch (error) {
                console.error('[useKafkaConsumer] Failed to connect:', error);
                setConnectionStatusRef.current('disconnected');
            }
        };

        connectToKafka();

        // Cleanup function
        return () => {
            unsubscribeEvents();
            unsubscribeStats();
            if (consumerRef.current) {
                consumerRef.current.disconnect();
            }
        };
    }, []); // Empty dependency array - only run once on mount

    // Return connection status and consumer instance
    return {
        consumer: consumerRef.current,
        isConnected: consumerRef.current?.getConnectionStatus() === 'connected'
    };
}
