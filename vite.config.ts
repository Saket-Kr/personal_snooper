import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    base: './',
    root: path.join(__dirname, 'src/renderer'),
    build: {
        outDir: path.join(__dirname, 'dist/renderer'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.join(__dirname, 'src/renderer/index.html')
            }
        }
    },
    server: {
        port: 3000,
        strictPort: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
}); 