import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'byAir Live',
          short_name: 'byAir',
          description: 'Flight Tracker & Companion',
          theme_color: '#0E1113',
          background_color: '#0E1113',
          display: 'standalone',
          icons: [
            {
              src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" fill="%23A8C7FA"><rect width="192" height="192" fill="%230E1113"/><path d="M142.4 153.6L128 88l28-28c8-8 12-24 8-32-8-4-24 0-36 12L80 88l-65.6-14.4c-4-.8-7.2.8-8.8 4l-2.4 4c-1.6 4-.8 8 2.4 10.4L72 96l-16 24H24l-8 8 24 16 16 24 8-8v-32l24-16 56 42.4c2.4 3.2 6.4 4 10.4 2.4l4-2.4c3.2-1.6 4.8-4.8 4-8.8z"/></svg>',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" fill="%23A8C7FA"><rect width="512" height="512" fill="%230E1113"/><path d="M142.4 153.6L128 88l28-28c8-8 12-24 8-32-8-4-24 0-36 12L80 88l-65.6-14.4c-4-.8-7.2.8-8.8 4l-2.4 4c-1.6 4-.8 8 2.4 10.4L72 96l-16 24H24l-8 8 24 16 16 24 8-8v-32l24-16 56 42.4c2.4 3.2 6.4 4 10.4 2.4l4-2.4c3.2-1.6 4.8-4.8 4-8.8z"/></svg>',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
