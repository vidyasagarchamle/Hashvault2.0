#!/bin/bash

# Kill any running Node.js processes
echo "Killing any running Node.js processes..."
killall node 2>/dev/null || true
killall -9 node 2>/dev/null || true

# Kill any process using port 3000 or 3001
echo "Killing any processes using ports 3000 and 3001..."
kill -9 $(lsof -t -i:3000) 2>/dev/null || true
kill -9 $(lsof -t -i:3001) 2>/dev/null || true

# Clear NPM cache
echo "Clearing NPM cache..."
npm cache clean --force

# Change to the Hash-vault directory
echo "Changing to Hash-vault directory..."
cd "$(dirname "$0")/Hash-vault" || exit 1

# Clear any .next build directory
echo "Removing existing build cache..."
rm -rf .next

# Start the HashVault application with increased memory
echo "Starting HashVault application..."
NODE_ENV=development NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Exit on error
if [ $? -ne 0 ]; then
  echo "Failed to start HashVault!"
  exit 1
fi 