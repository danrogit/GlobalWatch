#!/bin/sh
# Start script for GlobalWatch production deployment

echo "Starting GlobalWatch..."

# Start cron worker in background
echo "Starting cron worker..."
npx tsx scripts/cron-worker.ts &

# Start Next.js server
echo "Starting Next.js server..."
npm run start
