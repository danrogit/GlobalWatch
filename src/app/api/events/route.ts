import { NextResponse } from 'next/server';
import { getAllGeoEvents } from '@/lib/db/events';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '90');

        // Get all events from SQLite
        const events = getAllGeoEvents(days);

        console.log(`[API] Serving ${events.length} geo events`);

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

