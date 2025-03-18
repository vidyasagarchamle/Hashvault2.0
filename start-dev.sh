#!/bin/bash

# Print a message
echo "🔍 Checking for running Next.js servers..."

# Find all Node.js processes using ports 3000-3010
PIDS=$(lsof -i :3000-3010 | grep node | awk '{print $2}' | uniq)

# If there are any processes, kill them
if [ -n "$PIDS" ]; then
  echo "🛑 Killing Next.js servers with PIDs: $PIDS"
  kill -9 $PIDS
  echo "✅ All Next.js servers stopped"
else
  echo "✅ No running Next.js servers found"
fi

# Wait a moment to ensure ports are released
sleep 1

# Start the Next.js development server
echo "🚀 Starting Next.js development server..."
npm run dev 