import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'firebase-admin': path.resolve(__dirname, './src/lib/empty-stub.ts'),
        'express': path.resolve(__dirname, './src/lib/empty-stub.ts'),
        'node-fetch': path.resolve(__dirname, './src/lib/empty-stub.ts'),
        'whatwg-fetch': path.resolve(__dirname, './src/lib/empty-stub.ts'),
        'isomorphic-fetch': path.resolve(__dirname, './src/lib/empty-stub.ts'),
      },
    },
    optimizeDeps: {
      entries: ['./index.html', './src/**/*.{ts,tsx}'],
      exclude: ['firebase-admin', 'express', '@google/genai'],
    },
    build: {
      rollupOptions: {
        external: ['firebase-admin', 'express', '@google/genai'],
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
