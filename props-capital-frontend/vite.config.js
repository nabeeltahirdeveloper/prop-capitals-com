import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// Read chart-sdk version at build time (works with file: link)
// const chartSdkPkg = JSON.parse(
//   readFileSync(path.resolve(__dirname, '../../chart-sdk/package.json'), 'utf-8')
// )

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/economic-calendar': 'http://localhost:5101'
    },
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force a single React instance — prevents "Should have a queue" error
      // when the linked chart-sdk has its own node_modules/react
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, '../node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, '../node_modules/react/jsx-dev-runtime'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  // define: {
  //   __CHART_SDK_VERSION__: JSON.stringify(chartSdkPkg.version),
  // },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    // Keep peak memory low so the build does not get OOM-killed on the
    // memory-constrained shared production server. Limit parallel file ops
    // and split only react-vendor from the rest — never split react vs
    // react-dom (circular chunks break module init in production).
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-is|use-sync-external-store|react-router|react-router-dom)[\\/]/.test(
              id,
            )
          )
            return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
})
