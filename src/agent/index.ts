import { AgentConfig } from '../shared/types';
import { eventBus } from './events';
import { AppMonitor } from './monitors/app-monitor';
import { FileSystemMonitor } from './monitors/fs-monitor';
import { KafkaEmitter } from './services/kafka-emitter';
import { SQLLogger } from './services/sql-logger';

/**
 * MonitoringAgent - Main orchestrator for all monitoring components
 * 
 * This class manages the lifecycle of the monitoring agent process,
 * coordinates between different monitors, and handles communication
 * with the parent Electron process.
 */
class MonitoringAgent {
    private appMonitor: AppMonitor;
    private fsMonitor: FileSystemMonitor;
    private kafkaEmitter: KafkaEmitter;
    private sqlLogger: SQLLogger;
    private isRunning = false;
    private eventsProcessed = 0;

    constructor() {
        this.appMonitor = new AppMonitor();
        this.fsMonitor = new FileSystemMonitor();
        this.kafkaEmitter = new KafkaEmitter();
        this.sqlLogger = new SQLLogger();

        this.setupProcessHandlers();
    }

    /**
     * Sets up process event handlers for IPC communication and graceful shutdown
     */
    private setupProcessHandlers(): void {
        // Handle messages from parent process
        process.on('message', async (message: any) => {
            console.log('[Agent] Received message:', message.type);

            switch (message.type) {
                case 'start':
                    await this.start(message.config);
                    break;
                case 'stop':
                    await this.stop();
                    break;
                case 'updateConfig':
                    await this.updateConfig(message.config);
                    break;
            }
        });

        // Graceful shutdown handlers
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());

        // Error handling
        process.on('uncaughtException', (error) => {
            console.error('[Agent] Uncaught exception:', error);
            this.shutdown(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('[Agent] Unhandled rejection at:', promise, 'reason:', reason);
            this.shutdown(1);
        });
    }

    /**
     * Starts the monitoring agent with the provided configuration
     */
    private async start(config: AgentConfig): Promise<void> {
        if (this.isRunning) {
            console.warn('[Agent] Already running');
            return;
        }

        try {
            console.log('[Agent] Starting with config:', config);

            // Initialize Kafka connection
            await this.kafkaEmitter.connect();

            // Initialize SQL logger connection
            await this.sqlLogger.connect();

            // Subscribe Kafka emitter and SQL logger to event bus
            eventBus.on('activity', (event) => {
                this.kafkaEmitter.sendEvent(event);
                this.sqlLogger.logEvent(event);
                this.eventsProcessed++;
                this.sendStats();
            });

            // Start monitors
            this.appMonitor.start();
            this.fsMonitor.start(config.watchPaths, config.ignorePaths);

            this.isRunning = true;

            // Notify parent process
            process.send?.({ type: 'started' });

            // Send periodic stats updates
            this.startStatsTimer();

        } catch (error) {
            console.error('[Agent] Failed to start:', error);
            process.send?.({ type: 'error', error: (error as Error).message });
            this.shutdown(1);
        }
    }

    private statsTimer: NodeJS.Timeout | null = null;

    /**
     * Sends current stats to the parent process
     */
    private sendStats(): void {
        process.send?.({
            type: 'stats',
            eventsProcessed: this.eventsProcessed
        });
    }

    /**
     * Starts periodic stats updates
     */
    private startStatsTimer(): void {
        this.statsTimer = setInterval(() => {
            this.sendStats();
        }, 2000); // Send stats every 2 seconds
    }

    /**
     * Stops periodic stats updates
     */
    private stopStatsTimer(): void {
        if (this.statsTimer) {
            clearInterval(this.statsTimer);
            this.statsTimer = null;
        }
    }

    /**
     * Stops the monitoring agent and cleans up resources
     */
    private async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log('[Agent] Stopping...');

        // Stop monitors
        this.appMonitor.stop();
        this.fsMonitor.stop();

        // Stop stats timer
        this.stopStatsTimer();

        // Disconnect from Kafka
        await this.kafkaEmitter.disconnect();

        // Disconnect from SQL logger
        await this.sqlLogger.disconnect();

        this.isRunning = false;
        process.send?.({ type: 'stopped' });
    }

    /**
     * Updates the agent configuration while running
     */
    private async updateConfig(config: AgentConfig): Promise<void> {
        console.log('[Agent] Updating config:', config);

        // Update filesystem monitor paths
        if (config.watchPaths || config.ignorePaths) {
            this.fsMonitor.updatePaths(config.watchPaths, config.ignorePaths);
        }

        process.send?.({ type: 'configUpdated' });
    }

    /**
     * Gracefully shuts down the agent process
     */
    private async shutdown(exitCode = 0): Promise<void> {
        console.log('[Agent] Shutting down...');
        await this.stop();
        process.exit(exitCode);
    }
}

// Initialize and start the agent
const agent = new MonitoringAgent();
console.log('[Agent] Process started, waiting for commands...'); 