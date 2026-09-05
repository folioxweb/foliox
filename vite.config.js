import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isUat = mode === 'uat';
  const basePath = isUat ? '/foliox/uat/' : '/foliox/';

  return {
    base: basePath,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __REACT_VERSION__: JSON.stringify(
        pkg.dependencies.react.replace("^", "")
      ),
      __VITE_VERSION__: JSON.stringify(
        pkg.devDependencies.vite.replace("^", "")
      ),
      __BUILD_DATE__: JSON.stringify(
        new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      ),
    },
    // Dev server proxy to avoid CORS during local development. Requests to /api
    // will be forwarded to the configured Apps Script exec endpoint.
    server: {
      proxy: {
        '/api': {
          target: 'https://script.google.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '/macros/s/AKfycbwDbcXmMKRyzEsKHltCrpU1eq-EVyMJ4fGKPBDThvQgBDnztgpVrbbe2r6u9ZJqO1_v/exec')
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'apple-touch-icon.png',
          'equity-dashboard-icon-192.png',
          'equity-dashboard-icon-512.png',
          'favicon.svg',
          'icons.svg',
        ],
        manifest: {
          name: isUat ? 'Foliox (UAT)' : 'Foliox',
          short_name: isUat ? 'Foliox UAT' : 'Foliox',
          description: 'Premium portfolio management Progressive Web App',
          theme_color: '#0F172A',
          background_color: '#0F172A',
          display: 'standalone',
          start_url: basePath,
          icons: [
            {
              src: 'equity-dashboard-icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
          {
            src: 'equity-dashboard-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'equity-dashboard-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,jpeg,png,svg,woff2}'],
        navigateFallbackDenylist: isUat ? [] : [/^\/foliox\/uat/],
        runtimeCaching: [],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/recharts')) {
            return 'recharts'
          }
          if (id.includes('src/pages/DashboardPage')) {
            return 'dashboard'
          }
          if (id.includes('src/pages/PortfolioPage')) {
            return 'portfolio'
          }
          if (id.includes('src/pages/AnalyticsPage')) {
            return 'analytics'
          }
          if (id.includes('src/pages/SettingsPage')) {
            return 'settings'
          }
        },
      },
    },
  },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
    },
  };
});
