import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          
          // Split major features
          dashboard: ['./src/pages/DashboardPageV2.jsx'],
          game: ['./src/pages/DecisionPageV2.jsx'],
          auth: ['./src/pages/LoginPageV2.jsx'],
          admin: ['./src/pages/AdminDashboardV2.jsx'],
          api: ['./src/services/api.v2.js'],
          socket: ['socket.io-client'],
          
          // Keep remaining code together
          main: ['./src/AppV2.jsx']
        }
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    // Gzip compression for production
    chunkSizeWarningLimit: 1000,
    
    // Remove console logs in production
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    }
  },

  // Development server configuration (for testing)
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@services': resolve(__dirname, './src/services'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@context': resolve(__dirname, './src/context'),
      '@assets': resolve(__dirname, './src/assets')
    }
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify('2.4.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __ENVIRONMENT__: JSON.stringify('production')
  },

  // CSS preprocessing
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },

  // Optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client']
  }
});
