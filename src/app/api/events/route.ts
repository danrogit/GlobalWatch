import { NextResponse } from 'next/server';
import { getAllGeoEvents } from '@/lib/db/events';

export async function GET() {
    try {
        // Get all events from SQLite
        const events = getAllGeoEvents();

        console.log(`[API] Serving ${events.length} geo events from SQLite`);

        return NextResponse.json({
            events: events,
            count: events.length,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[API] Error fetching events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}

