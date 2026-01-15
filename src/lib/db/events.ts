import { db, GeoEventRow } from './index';
import crypto from 'crypto';

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

export function getAllGeoEvents() {
    const rows = db.prepare('SELECT * FROM geo_events ORDER BY event_date DESC').all() as GeoEventRow[];
    return rows.map(row => JSON.parse(row.json_data));
}

export function getEventBySlug(slug: string) {
    const row = db.prepare("SELECT * FROM geo_events WHERE json_data LIKE ?").get(`%"slug":"${slug}"%`) as GeoEventRow | undefined;
    if (!row) return undefined;
    return JSON.parse(row.json_data);
}

export function deleteOldEvents(daysToKeep: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffIso = cutoffDate.toISOString();

    const result = db.prepare('DELETE FROM geo_events WHERE event_date < ?').run(cutoffIso);
    console.log(`[DB] Deleted ${result.changes} events older than ${daysToKeep} days.`);
    return result.changes;
}
