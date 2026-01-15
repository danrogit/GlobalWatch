// ACLED API Integration
// Armed Conflict Location & Event Data Project
// https://acleddata.com/

export interface AcledEvent {
    event_id_cnty: string;
    event_date: string;
    year: number;
    time_precision: number;
    event_type: string;
    sub_event_type: string;
    actor1: string;
    actor2?: string;
    assoc_actor_1?: string;
    assoc_actor_2?: string;
    region: string;
    country: string;
    admin1: string;  // State/Province
    admin2?: string; // District
    admin3?: string;
    location: string;
    latitude: number;
    longitude: number;
    geo_precision: number;
    source: string;
    source_scale: string;
    notes: string;
    fatalities: number;
    tags?: string;
    timestamp: number;
}

// ACLED Event Types → Danish Labels
export const ACLED_EVENT_TYPES: Record<string, { danish: string; color: 'blue' | 'orange' | 'red' }> = {
    'Protests': { danish: 'Protest', color: 'blue' },
    'Riots': { danish: 'Optøjer', color: 'orange' },
    'Violence against civilians': { danish: 'Vold mod civile', color: 'red' },
    'Battles': { danish: 'Kamphandlinger', color: 'red' },
    'Explosions/Remote violence': { danish: 'Eksplosioner', color: 'red' },
    'Strategic developments': { danish: 'Strategisk udvikling', color: 'blue' },
};

// ACLED Sub-event Types → Danish Labels
export const ACLED_SUB_TYPES: Record<string, string> = {
    'Peaceful protest': 'Fredelig demonstration',
    'Protest with intervention': 'Demonstration med intervention',
    'Excessive force against protesters': 'Overdreven magtanvendelse',
    'Violent demonstration': 'Voldelig demonstration',
    'Mob violence': 'Pøbelvold',
    'Armed clash': 'Væbnet sammenstød',
    'Attack': 'Angreb',
    'Sexual violence': 'Seksuel vold',
    'Abduction/forced disappearance': 'Bortførelse',
    'Remote explosive/landmine/IED': 'Eksplosiv enhed',
    'Air/drone strike': 'Luftangreb',
    'Shelling/artillery/missile attack': 'Artilleri/Missilangreb',
    'Agreement': 'Aftale',
    'Arrests': 'Anholdelser',
    'Change to group/activity': 'Ændring i aktivitet',
    'Disrupted weapons use': 'Afbrudt våbenbrug',
    'Force regrouping': 'Styrkeomgruppering',
    'Headquarters or base established': 'Base etableret',
    'Looting/property destruction': 'Plyndring/Ødelæggelse',
    'Non-violent transfer of territory': 'Ikke-voldelig ændring',
    'Other': 'Andet',
};

// ACLED API Configuration
const ACLED_BASE_URL = 'https://acleddata.com/api/acled/read';
const ACLED_TOKEN_URL = 'https://acleddata.com/oauth/token';
const ACLED_EMAIL = process.env.ACLED_EMAIL || '';
const ACLED_PASSWORD = process.env.ACLED_PASSWORD || '';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

interface AcledApiResponse {
    status: number;
    success: boolean;
    count: number;
    data: AcledEvent[];
    messages?: string[];
}

/**
 * Get OAuth token from ACLED
 */
async function getAccessToken(): Promise<string | null> {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    if (!ACLED_EMAIL || !ACLED_PASSWORD) {
        console.error('[ACLED] Missing email or password. Set ACLED_EMAIL and ACLED_PASSWORD env vars.');
        return null;
    }

    try {
        const response = await fetch(ACLED_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: ACLED_EMAIL,
                password: ACLED_PASSWORD,
                grant_type: 'password',
                client_id: 'acled',
            }),
        });

        if (!response.ok) {
            throw new Error(`ACLED Auth error: ${response.status}`);
        }

        const data = await response.json();
        cachedToken = data.access_token;
        // Token typically expires in 24 hours (86400 seconds)
        tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Buffer of 1 minute
        return cachedToken;
    } catch (error) {
        console.error('[ACLED] Token generation failed:', error);
        return null;
    }
}

/**
 * Fetch events from ACLED API
 */
export async function fetchAcledEvents(options: {
    country?: string;
    region?: string;
    eventType?: string;
    startDate?: string;  // YYYY-MM-DD
    endDate?: string;    // YYYY-MM-DD
    limit?: number;
}): Promise<AcledEvent[]> {
    const token = await getAccessToken();
    if (!token) return [];

    const params = new URLSearchParams({
        limit: String(options.limit || 500),
    });

    if (options.country) params.set('country', options.country);
    if (options.region) params.set('region', options.region);
    if (options.eventType) params.set('event_type', options.eventType);

    // Build date range query
    if (options.startDate && options.endDate) {
        params.set('event_date', `${options.startDate}|${options.endDate}`);
        params.set('event_date_where', 'BETWEEN');
    } else if (options.startDate) {
        params.set('event_date', options.startDate);
    }

    try {
        const url = `${ACLED_BASE_URL}?${params}`;
        console.log(`[ACLED] Fetching: ${url}`);
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'GlobalWatch/1.0',
            }
        });

        console.log(`[ACLED] Response Status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`ACLED API error: ${response.status} - ${text}`);
        }

        const data: AcledApiResponse = await response.json();

        // Check for success property or status
        if (data.status !== 200 && data.success !== true) {
            console.error('[ACLED] API returned error/non-success:', data);
            return [];
        }

        console.log(`[ACLED] Fetched ${data.count} events`);
        return data.data || [];
    } catch (error) {
        console.error('[ACLED] Fetch error:', error);
        return [];
    }
}

/**
 * Fetch recent events from ACLED (last 7 days)
 */
export async function fetchRecentAcledEvents(limit: number = 500): Promise<AcledEvent[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return fetchAcledEvents({
        startDate,
        endDate,
        limit,
    });
}

/**
 * Fetch Denmark events from ACLED
 */
export async function fetchDenmarkAcledEvents(limit: number = 100): Promise<AcledEvent[]> {
    // For Denmark specifically, we might want slightly further back to ensure we have data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return fetchAcledEvents({
        country: 'Denmark',
        startDate,
        endDate,
        limit,
    });
}

/**
 * Convert ACLED event to our unified format
 */
export function acledEventToUnified(event: AcledEvent) {
    const typeInfo = ACLED_EVENT_TYPES[event.event_type] || { danish: event.event_type, color: 'blue' as const };
    const danishSubType = ACLED_SUB_TYPES[event.sub_event_type] || event.sub_event_type;

    // Determine severity based on fatalities and event type
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (event.fatalities > 10 || typeInfo.color === 'red') {
        severity = 'high';
    } else if (event.fatalities > 0 || typeInfo.color === 'orange') {
        severity = 'medium';
    }

    return {
        id: `acled-${event.event_id_cnty}`,
        layer: 'incident' as const,
        lat: parseFloat(event.latitude as any),
        lon: parseFloat(event.longitude as any),
        severity,
        title: `${typeInfo.danish} i ${event.country}`,
        danishTitle: `${typeInfo.danish} i ${event.location}, ${event.country}`,
        slug: `acled-${event.event_type.toLowerCase().replace(/\s+/g, '-')}-${event.country.toLowerCase()}-${event.event_date}`,
        timestamp: event.event_date,
        eventCount: 1,
        country: event.country,
        eventType: event.event_type,
        subType: event.sub_event_type,
        danishSubType,
        fatalities: event.fatalities,
        source: event.source,
        notes: event.notes,
        dotColor: typeInfo.color,
    };
}
