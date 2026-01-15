#!/bin/sh
# Startup script for GlobalWatch
# Starts both the web app and cron worker

echo "🚀 Starting GlobalWatch..."

# Start the cron worker in the background
echo "⏰ Starting cron worker..."
npx tsx scripts/cron-worker.ts &

# Wait a moment for cron to initialize
sleep 2

# Start the Next.js app (this will run in foreground)
echo "🌐 Starting web server..."
npm start
