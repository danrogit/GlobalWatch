import * as fs from 'fs';
import * as path from 'path';
import { UnifiedEvent, UnifiedStore, ACLED_TO_UNIFIED } from './types';
import { fetchRecentAcledEvents, acledEventToUnified } from '../acled/fetcher';
import { getEvents as getGdeltEvents, initializeStore } from '../gdelt/store';
import { fetchAllFeeds } from '../rss/fetcher';
import { articleToEvent } from '../rss/processor';
import { VerificationService } from '../news/verification-service';

const verificationService = new VerificationService();

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'unified_events.json');

// In-memory cache
let unifiedCache: UnifiedStore = {
    events: [],
    lastUpdated: ''
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
export function loadUnifiedFromDisk(): UnifiedStore {
    ensureDataDir();

    if (fs.existsSync(STORE_FILE)) {
        try {
            const data = fs.readFileSync(STORE_FILE, 'utf-8');
            unifiedCache = JSON.parse(data);
            console.log(`[UnifiedStore] Loaded ${unifiedCache.events.length} events from disk`);
        } catch (error) {
            console.error('[UnifiedStore] Failed to load events from disk:', error);
        }
    }

    return unifiedCache;
}

/**
 * Save events to disk cache
 */
function saveUnifiedToDisk(): void {
    ensureDataDir();

    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(unifiedCache, null, 2));
        console.log(`[UnifiedStore] Saved ${unifiedCache.events.length} events to disk`);
    } catch (error) {
        console.error('[UnifiedStore] Failed to save events to disk:', error);
    }
}

/**
 * Get all current events (Unified format)
 */
export function getUnifiedEvents(): UnifiedEvent[] {
    // Return all events - filtering handled by frontend
    return unifiedCache.events;
}

/**
 * Refresh Layer 1: ACLED (Confirmed Incidents)
 */
async function refreshLayer1(): Promise<UnifiedEvent[]> {
    console.log('[UnifiedStore] Refreshing Layer 1 (ACLED)...');
    try {
        const events = await fetchRecentAcledEvents(300); // Fetch recent events
        return events.map(acledEventToUnified) as any; // Cast to Unified (mapping in fetcher is compatible)
    } catch (error) {
        console.error('[UnifiedStore] Layer 1 refresh failed:', error);
        return [];
    }
}

/**
 * Refresh Layer 2: Political Signals (GDELT refined)
 */
async function refreshLayer2(): Promise<UnifiedEvent[]> {
    console.log('[UnifiedStore] Refreshing Layer 2 (Political Signals)...');
    try {
        // For now, we reuse the GDELT store but filter it for non-violent political signals
        const gdeltEvents = getGdeltEvents();

        // Filter for codes 13 (Diplomatic), 163 (Sanctions), etc.
        const signals = gdeltEvents.filter(e => {
            const code = e.eventTypeCode || '';
            return ['13', '163', '17'].includes(code.substring(0, 2)) || code === '163';
        });

        console.log(`[UnifiedStore] Found ${signals.length} GDELT signals. Verifying top 5...`);

        // Convert all to Unified format first (Unverified baseline)
        const unverifiedEvents = signals.map(e => ({
            id: `gdelt-${e.id}`,
            layer: 'political',
            lat: e.lat,
            lon: e.lon,
            severity: e.severity,
            country: e.country,
            category: e.eventTypeCode.startsWith('13') ? 'diplomacy' : 'statements',
            danishCategory: e.eventTypeCode.startsWith('13') ? 'Diplomati' : 'Information',
            title: e.title,
            danishTitle: e.title,
            slug: e.slug,
            source: 'GDELT Detection',
            dotColor: 'red',
            timestamp: e.timestamp,
            addedAt: new Date().toISOString(),
            status: 'UNVERIFIED',
            sources: ['GDELT'],
            articles: e.articles || [],
            gdeltSourceUrls: e.gdelt?.sourceUrls || []
        })) as UnifiedEvent[];

        // Pick top 5 for verification to save quota
        // (Assuming signals are already somewhat sorted by GDELT relevance/date)
        const topSignals = signals.slice(0, 5);
        const remainingSignals = unverifiedEvents.slice(5);

        // Verify top 5 in parallel
        // Verify top 5 in parallel
        const verificationPromises = topSignals.map(async (signal, index) => {
            const baseEvent = unverifiedEvents[index];
            try {
                // Check cache or similar in future to avoid re-verifying same ID
                const verifiedResult = await verificationService.verifySignal(signal);
                if (verifiedResult) {
                    return {
                        ...baseEvent,
                        status: verifiedResult.status,
                        sources: verifiedResult.sources,
                        articles: verifiedResult.articles,
                        title: verifiedResult.title || baseEvent.title,
                        dotColor: verifiedResult.status === 'VERIFIED' ? 'green' : 'orange',
                    } as UnifiedEvent;
                }
            } catch (err) {
                console.error(`[UnifiedStore] Failed to verify signal ${signal.id}:`, err);
            }
            // Fallback to the unverified version if verification failed or found nothing
            return baseEvent;
        });

        const verifiedResults = await Promise.all(verificationPromises);

        return [...verifiedResults, ...remainingSignals];
    } catch (error) {
        console.error('[UnifiedStore] Layer 2 refresh failed:', error);
        return [];
    }
}

/**
 * Refresh Layer 3: RSS Feeds (News Ingestion)
 * Processes ALL articles and merges duplicate events
 */
async function refreshLayer3(): Promise<UnifiedEvent[]> {
    console.log('[UnifiedStore] Refreshing Layer 3 (RSS Feeds)...');
    try {
        const articles = await fetchAllFeeds({ maxArticlesPerFeed: 50, maxConcurrent: 50 });
        const rawEvents: UnifiedEvent[] = [];

        // Process ALL articles (no limit)
        console.log(`[UnifiedStore] Processing ${articles.length} articles...`);
        for (let i = 0; i < articles.length; i++) {
            try {
                const event = await articleToEvent(articles[i], i);
                if (event) rawEvents.push(event);
            } catch (err) {
                // Skip failed geocoding/processing
            }

            // Log progress every 100 articles
            if ((i + 1) % 100 === 0) {
                console.log(`[UnifiedStore] Processed ${i + 1}/${articles.length} articles...`);
            }
        }

        // Deduplicate events by title similarity
        const mergedEvents = deduplicateEvents(rawEvents);

        console.log(`[UnifiedStore] Layer 3 created ${mergedEvents.length} events from ${articles.length} articles (${rawEvents.length} before merge)`);
        return mergedEvents;
    } catch (error) {
        console.error('[UnifiedStore] Layer 3 refresh failed:', error);
        return [];
    }
}

/**
 * Deduplicate events by title similarity
 * Merges events with similar titles, combining their sources
 */
function deduplicateEvents(events: UnifiedEvent[]): UnifiedEvent[] {
    const merged: Map<string, UnifiedEvent> = new Map();

    for (const event of events) {
        // Create a normalized key from the title
        const key = normalizeTitle(event.danishTitle || event.title);

        if (merged.has(key)) {
            // Merge with existing event
            const existing = merged.get(key)!;

            // Add source if not already present
            if (!existing.sources?.includes(event.source)) {
                existing.sources = [...(existing.sources || []), event.source];
            }

            // Add articles
            existing.articles = [...(existing.articles || []), ...(event.articles || [])];

            // Update status if newer event has higher confidence
            if (event.status === 'VERIFIED' && existing.status !== 'VERIFIED') {
                existing.status = 'VERIFIED';
                existing.dotColor = 'green';
            } else if (event.status === 'REPORTED' && existing.status === 'UNVERIFIED') {
                existing.status = 'REPORTED';
            }

            // Keep earliest timestamp
            if (new Date(event.timestamp) < new Date(existing.timestamp)) {
                existing.timestamp = event.timestamp;
            }
        } else {
            merged.set(key, { ...event });
        }
    }

    return Array.from(merged.values());
}

/**
 * Normalize title for deduplication
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9æøå]/g, '')
        .substring(0, 50); // Compare first 50 chars
}

/**
 * Perform a full update of the unified store
 */
export async function updateUnifiedStore(): Promise<void> {
    console.log('[UnifiedStore] Starting unified update...');

    // Layer selection (can be toggled via env)
    const skipLayer1 = process.env.SKIP_ACLED === 'true';
    const skipLayer2 = process.env.SKIP_GDELT === 'true';

    // Ensure Layer 2 (GDELT) is initialized and fresh if not skipping
    if (!skipLayer2) {
        await initializeStore();
    }

    // Trigger Daily News Sweep (Hybrid Phase 4)
    // This will populate the cache if 24h have passed since last sweep
    verificationService.triggerDailySweep().catch(err => {
        console.error('[UnifiedStore] Daily sweep failed (non-blocking):', err);
    });

    // Fetch layers based on flags
    const fetchData: Promise<UnifiedEvent[]>[] = [];

    if (!skipLayer1) fetchData.push(refreshLayer1());
    else fetchData.push(Promise.resolve([]));

    if (!skipLayer2) fetchData.push(refreshLayer2());
    else fetchData.push(Promise.resolve([]));

    fetchData.push(refreshLayer3()); // RSS always on for now

    const results = await Promise.all(fetchData);
    const allEvents = results.flat();

    // Sort by timestamp newest first
    allEvents.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    unifiedCache = {
        events: allEvents,
        lastUpdated: new Date().toISOString()
    };

    saveUnifiedToDisk();
}

/**
 * Initialize unified store
 */
export async function initializeUnifiedStore(): Promise<void> {
    loadUnifiedFromDisk();

    const cacheAge = unifiedCache.lastUpdated
        ? Date.now() - new Date(unifiedCache.lastUpdated).getTime()
        : Infinity;

    const thirtyMinutes = 30 * 60 * 1000;

    if (unifiedCache.events.length === 0 || cacheAge > thirtyMinutes) {
        await updateUnifiedStore();
    }
}

/**
 * Get unified event by slug
 */
export function getUnifiedEventBySlug(slug: string): UnifiedEvent | undefined {
    return unifiedCache.events.find(e => e.slug === slug);
}
