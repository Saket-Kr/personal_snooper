import { ChildProcess, fork } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { AgentConfig } from '../shared/types';

/**
 * AgentManager - Manages the monitoring agent child process
 * 
 * This class handles spawning, monitoring, and communicating with
 * the separate Node.js process that performs the actual activity
 * monitoring. It provides automatic restart capabilities and
 * graceful error handling.
 */
export class AgentManager extends EventEmitter {
    private agentProcess: ChildProcess | null = null;
    private restartAttempts = 0;
    private maxRestartAttempts = 3;
    private stats = {
        startTime: null as Date | null,
        eventsProcessed: 0,
        lastError: null as string | null
    };

    /**
     * Starts the monitoring agent with the provided configuration
     */
    async start(config: AgentConfig): Promise<void> {
        if (this.agentProcess) {
            console.log('[AgentManager] Agent already running');
            return;
        }

        console.log('[AgentManager] Starting agent...');

        const agentPath = path.join(__dirname, '../../agent/agent/index.js');

        this.agentProcess = fork(agentPath, [], {
            env: {
                ...process.env,
                USER_ID: config.userId,
                KAFKA_BROKER: config.kafkaBroker
            },
            silent: false // Show agent logs in console
        });

        this.setupProcessHandlers();

        // Send start command with config
        const agentConfig: AgentConfig = {
            userId: config.userId,
            kafkaBroker: config.kafkaBroker,
            watchPaths: config.watchPaths,
            ignorePaths: config.ignorePaths,
            autoStart: config.autoStart,
            pollInterval: 2000
        };

        this.agentProcess.send({ type: 'start', config: agentConfig });

        this.stats.startTime = new Date();
        this.emit('statusChange', { isRunning: true });
    }

    /**
     * Stops the monitoring agent and cleans up resources
     */
    async stop(): Promise<void> {
        if (!this.agentProcess) {
            return;
        }

        console.log('[AgentManager] Stopping agent...');

        return new Promise((resolve) => {
            if (!this.agentProcess) {
                resolve();
                return;
            }

            // Listen for graceful shutdown
            this.agentProcess.once('exit', () => {
                this.agentProcess = null;
                this.stats.startTime = null;
                this.emit('statusChange', { isRunning: false });
                resolve();
            });

            // Send stop command
            this.agentProcess.send({ type: 'stop' });

            // Force kill after timeout
            setTimeout(() => {
                if (this.agentProcess) {
                    this.agentProcess.kill();
                    this.agentProcess = null;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Updates the agent configuration while running
     */
    async updateConfig(config: AgentConfig): Promise<void> {
        if (!this.agentProcess) {
            throw new Error('Agent not running');
        }

        const agentConfig: AgentConfig = {
            userId: config.userId,
            kafkaBroker: config.kafkaBroker,
            watchPaths: config.watchPaths,
            ignorePaths: config.ignorePaths,
            autoStart: config.autoStart,
            pollInterval: 2000
        };

        this.agentProcess.send({ type: 'updateConfig', config: agentConfig });
    }

    /**
     * Checks if the agent is currently running
     */
    isRunning(): boolean {
        return this.agentProcess !== null;
    }

    /**
     * Gets the current agent statistics
     */
    getStats() {
        return {
            ...this.stats,
            uptime: this.stats.startTime
                ? Date.now() - this.stats.startTime.getTime()
                : 0
        };
    }

    /**
     * Sets up event handlers for the agent process
     */
    private setupProcessHandlers(): void {
        if (!this.agentProcess) return;

        this.agentProcess.on('message', (message: any) => {
            // console.log('[AgentManager] Message from agent:', message);

            switch (message.type) {
                case 'started':
                    this.restartAttempts = 0;
                    break;
                case 'error':
                    this.stats.lastError = message.error;
                    break;
                case 'stats':
                    this.stats.eventsProcessed = message.eventsProcessed;
                    break;
            }
        });

        this.agentProcess.on('error', (error) => {
            console.error('[AgentManager] Agent process error:', error);
            this.stats.lastError = error.message;
        });

        this.agentProcess.on('exit', (code, signal) => {
            console.log(`[AgentManager] Agent exited with code ${code}, signal ${signal}`);

            this.agentProcess = null;
            this.emit('statusChange', { isRunning: false });

            // Auto-restart on unexpected exit
            if (code !== 0 && this.restartAttempts < this.maxRestartAttempts) {
                this.restartAttempts++;
                console.log(`[AgentManager] Attempting restart (${this.restartAttempts}/${this.maxRestartAttempts})`);

                setTimeout(() => {
                    const config = this.getLastConfig();
                    if (config) {
                        this.start(config);
                    }
                }, 1000 * this.restartAttempts); // Exponential backoff
            }
        });
    }

    private getLastConfig(): AgentConfig | null {
        // Implementation would retrieve last used config
        return null;
    }
} 