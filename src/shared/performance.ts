/**
 * Performance monitoring utilities for the Desktop Activity Tracker
 * 
 * This module provides tools for monitoring application performance,
 * memory usage, and system resource consumption.
 */

export interface PerformanceMetrics {
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    cpuUsage: {
        user: number;
        system: number;
    };
    eventCount: number;
    processingTime: number;
    errors: number;
}

export class PerformanceMonitor {
    private metrics: PerformanceMetrics[] = [];
    private startTime: number = Date.now();
    private eventCount: number = 0;
    private errorCount: number = 0;
    private processingTimes: number[] = [];

    /**
     * Records a performance metric snapshot
     */
    recordMetrics(): PerformanceMetrics {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        const metrics: PerformanceMetrics = {
            memoryUsage,
            cpuUsage,
            eventCount: this.eventCount,
            processingTime: this.getAverageProcessingTime(),
            errors: this.errorCount
        };

        this.metrics.push(metrics);

        // Keep only last 1000 metrics to prevent memory leaks
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }

        return metrics;
    }

    /**
     * Records an event processing time
     */
    recordEventProcessing(startTime: number): void {
        const duration = Date.now() - startTime;
        this.processingTimes.push(duration);
        this.eventCount++;

        // Keep only last 1000 processing times
        if (this.processingTimes.length > 1000) {
            this.processingTimes = this.processingTimes.slice(-1000);
        }
    }

    /**
     * Records an error occurrence
     */
    recordError(): void {
        this.errorCount++;
    }

    /**
     * Gets the average processing time
     */
    getAverageProcessingTime(): number {
        if (this.processingTimes.length === 0) return 0;

        const sum = this.processingTimes.reduce((a, b) => a + b, 0);
        return sum / this.processingTimes.length;
    }

    /**
     * Gets the current memory usage in MB
     */
    getMemoryUsageMB(): { heapUsed: number; heapTotal: number; rss: number } {
        const usage = process.memoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024)
        };
    }

    /**
     * Gets performance statistics
     */
    getStats(): {
        uptime: number;
        eventCount: number;
        errorCount: number;
        avgProcessingTime: number;
        memoryUsage: { heapUsed: number; heapTotal: number; rss: number };
        recentMetrics: PerformanceMetrics[];
    } {
        return {
            uptime: Date.now() - this.startTime,
            eventCount: this.eventCount,
            errorCount: this.errorCount,
            avgProcessingTime: this.getAverageProcessingTime(),
            memoryUsage: this.getMemoryUsageMB(),
            recentMetrics: this.metrics.slice(-10) // Last 10 metrics
        };
    }

    /**
     * Resets all counters
     */
    reset(): void {
        this.metrics = [];
        this.startTime = Date.now();
        this.eventCount = 0;
        this.errorCount = 0;
        this.processingTimes = [];
    }

    /**
     * Checks if performance is within acceptable limits
     */
    isPerformanceAcceptable(): boolean {
        const stats = this.getStats();

        // Memory usage should be under 100MB
        if (stats.memoryUsage.heapUsed > 100) {
            return false;
        }

        // Average processing time should be under 100ms
        if (stats.avgProcessingTime > 100) {
            return false;
        }

        // Error rate should be under 5%
        if (stats.eventCount > 0 && (stats.errorCount / stats.eventCount) > 0.05) {
            return false;
        }

        return true;
    }

    /**
     * Gets performance warnings
     */
    getWarnings(): string[] {
        const warnings: string[] = [];
        const stats = this.getStats();

        if (stats.memoryUsage.heapUsed > 50) {
            warnings.push(`High memory usage: ${stats.memoryUsage.heapUsed}MB`);
        }

        if (stats.avgProcessingTime > 50) {
            warnings.push(`Slow processing time: ${stats.avgProcessingTime.toFixed(2)}ms average`);
        }

        if (stats.errorCount > 0 && stats.eventCount > 0) {
            const errorRate = (stats.errorCount / stats.eventCount) * 100;
            if (errorRate > 1) {
                warnings.push(`High error rate: ${errorRate.toFixed(2)}%`);
            }
        }

        return warnings;
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor(); 