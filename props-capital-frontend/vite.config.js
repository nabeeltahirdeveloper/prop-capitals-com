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
    // memory-constrained shared production server. Splitting the single large
    // bundle into vendor chunks and limiting parallel file ops dramatically
    // reduces Rollup's working set during render/minify.
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react-dom|scheduler)[\\/]/.test(id))
            return 'react-dom'
          if (/[\\/]node_modules[\\/](react|react-router|react-router-dom)[\\/]/.test(id))
            return 'react'
          if (
            /chart-sdk|lightweight-charts|klinecharts|recharts|d3-|victory|apexcharts/.test(id)
          )
            return 'charts'
          return 'vendor'
        },
      },
    },
  },
}) 
