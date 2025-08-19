const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('🚀 Starting Database Viewer...\n');

// Build the agent first
console.log('📦 Building agent...');
const buildProcess = spawn('npm', ['run', 'build:agent'], {
    stdio: 'inherit',
    shell: true
});

buildProcess.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Build failed');
        process.exit(1);
    }

    console.log('✅ Build completed\n');

    // Start the API server
    console.log('🌐 Starting API server on port 3001...');
    const serverProcess = spawn('node', ['src/renderer/api-server.js'], {
        stdio: 'inherit',
        shell: true
    });

    // Wait a moment for server to start
    setTimeout(() => {
        console.log('\n📊 Database Viewer is ready!');
        console.log('🌐 API Server: http://localhost:3001');
        console.log('📱 Database Viewer: http://localhost:3001/database');
        console.log('\n📋 Available endpoints:');
        console.log('   GET /api/events - Get recent events');
        console.log('   GET /api/stats - Get database statistics');
        console.log('   GET /api/events/range - Get events by time range');
        console.log('   GET /api/events/count - Get total event count');
        console.log('\n💡 To view the database:');
        console.log('   1. Open http://localhost:3001/database in your browser');
        console.log('   2. Start monitoring in the main app to generate events');
        console.log('   3. Refresh the page to see new events');
        console.log('\n⏹️  Press Ctrl+C to stop the server\n');
    }, 2000);

    // Handle server shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill();
        process.exit(0);
    });
});
