// A simplified vite config for fallback build
const path = require('path');

module.exports = {
  // Minimal configuration for production build
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
  },
  esbuild: {
    jsx: 'automatic',
    jsxInject: `import React from 'react'`,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};
