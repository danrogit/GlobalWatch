import { AggregatedEvent, EventStore } from './types';
import { getRecentExportFiles, getLatestExportFile, downloadAndParseExport } from './fetcher';
import { clusterEvents, mergeEvents } from './clusterer';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'events.json');

// In-memory cache
let eventCache: EventStore = {
    events: [],
    lastUpdated: '',
    lastFetchedFile: ''
};

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Load events from disk cache
 */
export function loadEventsFromDisk(): EventStore {
    ensureDataDir();

    if (fs.existsSync(STORE_FILE)) {
        try {
            const data = fs.readFileSync(STORE_FILE, 'utf-8');
            eventCache = JSON.parse(data);
            console.log(`[Store] Loaded ${eventCache.events.length} events from disk`);
        } catch (error) {
            console.error('[Store] Failed to load events from disk:', error);
        }
    }

    return eventCache;
}

/**
 * Save events to disk cache
 */
function saveEventsToDisk(): void {
    ensureDataDir();

    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(eventCache, null, 2));
        console.log(`[Store] Saved ${eventCache.events.length} events to disk`);
    } catch (error) {
        console.error('[Store] Failed to save events to disk:', error);
    }
}

/**
 * Get all current events
 */
export function getEvents(): AggregatedEvent[] {
    // Filter to only events within last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return eventCache.events.filter(e =>
        new Date(e.timestamp).getTime() >= sevenDaysAgo
    );
}

/**
 * Get event by slug
 */
export function getEventBySlug(slug: string): AggregatedEvent | undefined {
    return eventCache.events.find(e => e.slug === slug);
}

/**
 * Get events by country
 */
export function getEventsByCountry(country: string): AggregatedEvent[] {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const normalizedCountry = country.toLowerCase().replace(/-/g, ' ');

    return eventCache.events.filter(e => {
        const eventDate = new Date(e.timestamp).getTime();
        const countryMatch = e.country.toLowerCase() === normalizedCountry ||
            e.countryCode.toLowerCase() === normalizedCountry;
        return eventDate >= sevenDaysAgo && countryMatch;
    });
}

/**
 * Get events by city
 */
export function getEventsByCity(city: string): AggregatedEvent[] {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const normalizedCity = city.toLowerCase().replace(/-/g, ' ');

    return eventCache.events.filter(e => {
        const eventDate = new Date(e.timestamp).getTime();
        const cityMatch = e.city.toLowerCase() === normalizedCity;
        return eventDate >= sevenDaysAgo && cityMatch;
    });
}

/**
 * Get unique countries with events
 */
export function getCountriesWithEvents(): string[] {
    const countries = new Set<string>();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    eventCache.events.forEach(e => {
        if (new Date(e.timestamp).getTime() >= sevenDaysAgo && e.country) {
            countries.add(e.country);
        }
    });

    return Array.from(countries).sort();
}

/**
 * Get unique cities with events
 */
export function getCitiesWithEvents(): string[] {
    const cities = new Set<string>();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    eventCache.events.forEach(e => {
        if (new Date(e.timestamp).getTime() >= sevenDaysAgo && e.city && e.city !== 'Unknown') {
            cities.add(e.city);
        }
    });

    return Array.from(cities).sort();
}

/**
 * Perform full data refresh (initial load)
 */
export async function fullRefresh(): Promise<void> {
    console.log('[Store] Starting full data refresh...');

    try {
        const files = await getRecentExportFiles();

        // Limit to last 48 files (~12 hours) for initial load to avoid overwhelming
        const filesToProcess = files.slice(0, 48);

        let allRawEvents: Awaited<ReturnType<typeof downloadAndParseExport>> = [];

        for (const file of filesToProcess) {
            try {
                const events = await downloadAndParseExport(file.url);
                allRawEvents = allRawEvents.concat(events);

                // Small delay to be respectful to GDELT servers
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`[Store] Failed to process ${file.url}:`, error);
            }
        }

        console.log(`[Store] Downloaded ${allRawEvents.length} total raw events`);

        const clustered = clusterEvents(allRawEvents);

        eventCache = {
            events: clustered,
            lastUpdated: new Date().toISOString(),
            lastFetchedFile: filesToProcess[0]?.url || ''
        };

        saveEventsToDisk();
    } catch (error) {
        console.error('[Store] Full refresh failed:', error);
        throw error;
    }
}

/**
 * Perform incremental update (get latest events only)
 */
export async function incrementalRefresh(): Promise<void> {
    console.log('[Store] Starting incremental refresh...');

    try {
        const latestFile = await getLatestExportFile();

        if (!latestFile) {
            console.log('[Store] No new export file available');
            return;
        }

        // Skip if we already processed this file
        if (latestFile.url === eventCache.lastFetchedFile) {
            console.log('[Store] Already processed latest file');
            return;
        }

        const rawEvents = await downloadAndParseExport(latestFile.url);
        const clustered = clusterEvents(rawEvents);

        eventCache = {
            events: mergeEvents(eventCache.events, clustered),
            lastUpdated: new Date().toISOString(),
            lastFetchedFile: latestFile.url
        };

        saveEventsToDisk();
    } catch (error) {
        console.error('[Store] Incremental refresh failed:', error);
        throw error;
    }
}

/**
 * Initialize the store
 */
export async function initializeStore(): Promise<void> {
    loadEventsFromDisk();

    // If no events or cache is old, do a full refresh
    const cacheAge = eventCache.lastUpdated
        ? Date.now() - new Date(eventCache.lastUpdated).getTime()
        : Infinity;

    const oneHour = 60 * 60 * 1000;

    if (eventCache.events.length === 0 || cacheAge > oneHour) {
        await fullRefresh();
    } else {
        console.log(`[Store] Cache is fresh (${Math.round(cacheAge / 60000)}min old), skipping full refresh`);
        await incrementalRefresh();
    }
}
