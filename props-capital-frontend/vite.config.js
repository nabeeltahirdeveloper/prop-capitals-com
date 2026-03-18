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
}) 