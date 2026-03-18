import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Ensure static assets are served from the root
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and performance
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@heroicons/vue/')) {
            return 'heroicons';
          }

          if (id.includes('@headlessui/vue')) {
            return 'headlessui';
          }

          if (id.includes('/vue-router/') || id.includes('/pinia/') || id.includes('/vue/')) {
            return 'vue';
          }

          if (id.includes('/axios/') || id.includes('@popperjs/core')) {
            return 'vendors';
          }

          return undefined;
        },
        // Optimize chunk file naming
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return '[name]-[hash][extname]';
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|svg/.test(ext)) {
            return `images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `[name]-[hash][extname]`;
        },
      },
    },
  },
});
