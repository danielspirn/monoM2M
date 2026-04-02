import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { handleReceiptOcrHttpRequest } from './server/ocr/http';
import { handleReceiptProcessingHttpRequest } from './server/receipts/http';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'receipt-ocr-dev-api',
      configureServer(server) {
        server.middlewares.use('/api/receipt-ocr', (req, res, next) => {
          if (req.method !== 'POST') {
            next();
            return;
          }

          void handleReceiptOcrHttpRequest(req, res);
        });
        server.middlewares.use('/api/receipt-processing', (req, res, next) => {
          if (req.method !== 'GET' && req.method !== 'POST') {
            next();
            return;
          }

          void handleReceiptProcessingHttpRequest(req, res);
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
  },
});
