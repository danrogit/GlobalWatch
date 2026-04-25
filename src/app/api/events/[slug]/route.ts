import { NextRequest, NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/db/events';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { slug } = await params;
        const event = getEventBySlug(slug);

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ event });
    } catch (error) {
        console.error('[API] Error fetching event:', error);
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        );
    }
}
