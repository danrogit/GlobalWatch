#!/bin/sh
# Start script for GlobalWatch production deployment

echo "Starting GlobalWatch..."

# Start LibreTranslate in background
echo "Starting LibreTranslate..."
libretranslate --host 0.0.0.0 --port 5000 --update-models &

# Start cron worker in background
echo "Starting cron worker..."
npx tsx scripts/cron-worker.ts &

# Start Next.js server
echo "Starting Next.js server..."
npm run start
