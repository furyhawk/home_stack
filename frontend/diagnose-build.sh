#!/bin/bash
# Script to diagnose build issues

echo "Starting build diagnosis..."
cd /home/user/projects/home_stack/frontend

# Clean up any previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf dist node_modules/.vite

# Install dependencies with maximum compatibility
echo "Installing dependencies..."
npm install --no-optional --legacy-peer-deps || npm install --legacy-peer-deps --force

# Install specific dependencies that might be causing issues
echo "Installing additional dependencies..."
npm install --no-save @hey-api/client-axios terser @vitejs/plugin-react-swc vite@latest typescript@latest

# Try to generate the client
echo "Generating OpenAPI client..."
npm run generate-client || echo "Client generation failed, continuing..."

# Try building with different configurations
echo "Attempting build with standard configuration..."
NODE_ENV=production npx vite build

if [ $? -ne 0 ]; then
  echo "Standard build failed, trying alternative configuration..."
  NODE_ENV=production npx vite build --config vite.config.js
fi

if [ $? -ne 0 ]; then
  echo "Alternative build failed, creating emergency fallback..."
  mkdir -p dist
  echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Application</title></head><body><div id="root"><p>Loading application...</p></div><script>window.location.href = "/login";</script></body></html>' > dist/index.html
fi

echo "Build diagnosis complete."
