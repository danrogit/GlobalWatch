import { db, GeoEventRow } from './index';
import { UnifiedEvent, EventCategory } from '../data/types';
import { AggregatedEvent, ConfidenceLevel } from '../gdelt/types';
import { loadEventsFromDisk } from '../gdelt/store';
import { getCountryName } from '../verify';

type EventStatus = 'VERIFIED' | 'REPORTED' | 'UNVERIFIED';
type EventDotColor = 'blue' | 'orange' | 'red' | 'green';

type StoredEvent = Record<string, any>;

const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO geo_events (
        event_id, title, summary, category, subcategory, countries, 
        event_date, detected_at, source_count, verification_status, 
        confidence_score, json_data, normalized_title
    ) VALUES (
        @event_id, @title, @summary, @category, @subcategory, @countries, 
        @event_date, @detected_at, @source_count, @verification_status, 
        @confidence_score, @json_data, @normalized_title
    )
`);

export function saveGeoEvent(event: any) {
    const row = {
        event_id: event.id,
        title: event.title,
        summary: event.description || '',
        category: event.category,
        subcategory: '',
        countries: JSON.stringify(event.countries || []),
        event_date: event.timestamp,
        detected_at: new Date().toISOString(),
        source_count: event.sources?.length || 1,
        verification_status: event.status?.toLowerCase() || 'reported',
        confidence_score: event.confidenceScore || 0.5,
        json_data: JSON.stringify(event),
        normalized_title: event.normalizedTitle || ''
    };

    insertEvent.run(row);
}

export function getEventByNormalizedTitle(normalizedTitle: string): GeoEventRow | undefined {
    return db.prepare('SELECT * FROM geo_events WHERE normalized_title = ?').get(normalizedTitle) as GeoEventRow | undefined;
}

function statusFromConfidence(confidence?: ConfidenceLevel): EventStatus {
    if (confidence === 'confirmed') return 'VERIFIED';
    if (confidence === 'reported') return 'REPORTED';
    return 'UNVERIFIED';
}

function dotColorFromStatus(status?: string): EventDotColor {
    if (status === 'VERIFIED') return 'green';
    if (status === 'REPORTED') return 'orange';
    if (status === 'UNVERIFIED') return 'red';
    return 'orange';
}

function categoryFromEventType(eventType?: string): EventCategory {
    const normalized = (eventType || '').toLowerCase();

    if (normalized.includes('protest') || normalized.includes('riot')) return 'protests_unrest';
    if (normalized.includes('military') || normalized.includes('armed') || normalized.includes('violence')) return 'military_security';
    if (normalized.includes('sanction') || normalized.includes('trade')) return 'sanctions_trade';
    if (normalized.includes('diplomatic') || normalized.includes('diplomacy')) return 'diplomacy';
    if (normalized.includes('election')) return 'elections_power';
    if (normalized.includes('border') || normalized.includes('territory')) return 'borders_territory';
    if (normalized.includes('information') || normalized.includes('disinformation')) return 'info_warfare';

    return 'government_actions';
}

function normalizeQuotes(quotes: unknown): Array<{ text: string; speaker?: string }> {
    if (!Array.isArray(quotes)) return [];

    return quotes
        .map((quote) => {
            if (typeof quote === 'string') return { text: quote };
            if (quote && typeof quote === 'object' && 'text' in quote) {
                return quote as { text: string; speaker?: string };
            }
            return null;
        })
        .filter((quote): quote is { text: string; speaker?: string } => quote !== null);
}

function normalizeDbEvent(event: StoredEvent): UnifiedEvent & StoredEvent {
    const status = event.status || 'REPORTED';
    const country = getCountryName(event.locationLabel || event.country || event.countryCode);
    const sources = Array.isArray(event.sources) && event.sources.length
        ? event.sources
        : event.source
            ? [event.source]
            : [];

    return {
        ...event,
        id: event.id,
        layer: event.layer || 'political',
        country: country || 'Unknown',
        countryCode: event.countryCode,
        lat: event.lat ?? 56.26,
        lon: event.lon ?? 9.5,
        locationLabel: event.locationLabel || country || 'Unknown',
        category: event.category || 'government_actions',
        danishCategory: event.danishCategory || event.eventType || event.category || 'News',
        title: event.title,
        danishTitle: event.title,
        slug: event.slug || event.id,
        severity: event.severity || 'medium',
        source: event.source || sources[0] || 'Unknown source',
        sourceUrl: event.sourceUrl,
        notes: event.description || event.notes,
        dotColor: event.dotColor || dotColorFromStatus(status),
        timestamp: event.publishedAt || event.timestamp || new Date().toISOString(),
        addedAt: event.addedAt || new Date().toISOString(),
        status,
        sources,
        description: event.description,
        imageUrl: event.imageUrl,
        quotes: normalizeQuotes(event.quotes),
        articles: event.articles,
        gdeltSourceUrls: event.gdeltSourceUrls,
    };
}

function normalizeGdeltEvent(event: AggregatedEvent): UnifiedEvent {
    const status = statusFromConfidence(event.confidence);
    const sourceNames = event.sources.map((source) => source.name).filter(Boolean);
    const firstSource = event.sources[0];
    const countryName = getCountryName(event.countryCode || event.country);

    return {
        id: event.id,
        layer: event.acled?.matched ? 'incident' : 'political',
        country: countryName || event.country || 'Unknown',
        countryCode: event.countryCode || event.country,
        city: event.city,
        locationLabel: event.city && event.city !== event.country ? event.city : countryName,
        lat: event.lat,
        lon: event.lon,
        category: categoryFromEventType(event.eventType),
        danishCategory: event.eventType || 'Geopolitical Event',
        title: event.title || event.eventType || 'Geopolitical event',
        danishTitle: event.title || event.eventType || 'Geopolitical event',
        slug: event.slug,
        severity: event.severity || 'medium',
        eventCount: event.eventCount,
        fatalities: event.acled?.fatalities,
        source: firstSource?.name || 'GDELT',
        sourceUrl: firstSource?.url || event.gdelt.sourceUrls[0],
        notes: firstSource?.excerpt,
        dotColor: dotColorFromStatus(status),
        timestamp: event.timestamp,
        addedAt: event.lastUpdated || event.firstSeen || event.timestamp,
        status,
        sources: sourceNames.length ? sourceNames : ['GDELT'],
        articles: event.articles || event.sources,
        gdeltSourceUrls: event.gdelt.sourceUrls,
    };
}

function getFallbackEvents(days: number): UnifiedEvent[] {
    const events = loadEventsFromDisk().events.map(normalizeGdeltEvent);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const eventsInWindow = events.filter((event) => {
        const timestamp = new Date(event.timestamp).getTime();
        return Number.isFinite(timestamp) && timestamp >= cutoffTime;
    });

    return eventsInWindow.length > 0 ? eventsInWindow : events;
}

export function getAllGeoEvents(days: number = 90) {
    const rows = db.prepare(`
        SELECT * FROM geo_events 
        WHERE date(event_date) >= date('now', '-' || ? || ' days')
        ORDER BY event_date DESC
    `).all(days) as GeoEventRow[];

    return rows.length > 0
        ? rows.map(row => normalizeDbEvent(JSON.parse(row.json_data)))
        : getFallbackEvents(days);
}

export function getEventBySlug(slug: string) {
    const row = db.prepare("SELECT * FROM geo_events WHERE json_data LIKE ?").get(`%"slug":"${slug}"%`) as GeoEventRow | undefined;
    if (row) {
        return normalizeDbEvent(JSON.parse(row.json_data));
    }

    return getFallbackEvents(Number.MAX_SAFE_INTEGER).find(event => event.slug === slug);
}

export function deleteOldEvents(daysToKeep: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffIso = cutoffDate.toISOString();

    const result = db.prepare('DELETE FROM geo_events WHERE event_date < ?').run(cutoffIso);
    console.log(`[DB] Deleted ${result.changes} events older than ${daysToKeep} days.`);
    return result.changes;
}
