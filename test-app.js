const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Electron app launch...');

const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
const mainPath = path.join(__dirname, 'dist', 'main', 'main', 'index.js');

const child = spawn(electronPath, [mainPath, '--disable-singleton-lock'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit'
});

child.on('close', (code) => {
    console.log(`Electron app exited with code ${code}`);
    process.exit(code);
});

child.on('error', (error) => {
    console.error('Failed to start Electron app:', error);
    process.exit(1);
});

// Kill the process after 10 seconds for testing
setTimeout(() => {
    console.log('Killing test process...');
    child.kill();
}, 10000); 