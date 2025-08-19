const express = require('express');
const path = require('path');
const { DatabaseUtils } = require('../../dist/agent/agent/services/db-utils');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist/renderer')));

// CORS middleware for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Initialize database utils
const dbUtils = new DatabaseUtils();

// API Routes

// Get events with filtering
app.get('/api/events', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type || 'all';

        let events = [];

        if (type === 'all') {
            events = await dbUtils.getRecentEvents(limit);
        } else {
            events = await dbUtils.getEventsByType(type, limit);
        }

        // Get stats for the response
        const stats = await dbUtils.getDatabaseStats();

        res.json({
            events,
            stats,
            total: events.length
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Failed to fetch events',
            message: error.message
        });
    }
});

// Get database statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await dbUtils.getDatabaseStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            error: 'Failed to fetch stats',
            message: error.message
        });
    }
});

// Get events by time range
app.get('/api/events/range', async (req, res) => {
    try {
        const { start, end, limit = 100 } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const events = await dbUtils.getEventsByTimeRange(start, end, parseInt(limit));
        res.json({ events, total: events.length });
    } catch (error) {
        console.error('Error fetching events by range:', error);
        res.status(500).json({
            error: 'Failed to fetch events by range',
            message: error.message
        });
    }
});

// Get event count
app.get('/api/events/count', async (req, res) => {
    try {
        const count = await dbUtils.getEventCount();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching event count:', error);
        res.status(500).json({
            error: 'Failed to fetch event count',
            message: error.message
        });
    }
});

// Serve the database viewer HTML
app.get('/database', (req, res) => {
    res.sendFile(path.join(__dirname, 'database-viewer.html'));
});

// Serve the main app for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/renderer/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
    console.log('Database API endpoints:');
    console.log(`  GET /api/events - Get recent events`);
    console.log(`  GET /api/stats - Get database statistics`);
    console.log(`  GET /api/events/range - Get events by time range`);
    console.log(`  GET /api/events/count - Get total event count`);
});

module.exports = app;
