import { RawGdeltEvent, AggregatedEvent, getEventTypeLabel } from './types';
import { calculateConfidence } from '../confidence/scorer';

const CLUSTER_RADIUS_KM = 25; // ~20-30km clustering radius
const CLUSTER_TIME_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Parse GDELT dateAdded field (YYYYMMDDHHMMSS) to Date
 */
function parseGdeltDate(dateAdded: string): Date {
    if (!dateAdded || dateAdded.length < 14) {
        return new Date();
    }
    const year = parseInt(dateAdded.substring(0, 4));
    const month = parseInt(dateAdded.substring(4, 6)) - 1;
    const day = parseInt(dateAdded.substring(6, 8));
    const hour = parseInt(dateAdded.substring(8, 10));
    const minute = parseInt(dateAdded.substring(10, 12));
    const second = parseInt(dateAdded.substring(12, 14));
    return new Date(year, month, day, hour, minute, second);
}

/**
 * Generate URL-friendly slug
 */
function generateSlug(eventType: string, city: string, country: string, date: Date): string {
    const parts = [
        eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        city.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        country.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        date.toISOString().split('T')[0]
    ].filter(Boolean);

    return parts.join('-').replace(/--+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Extract city from GDELT location string
 */
function extractCity(fullName: string): string {
    if (!fullName) return 'Unknown';
    const parts = fullName.split(',').map(p => p.trim());
    return parts[0] || 'Unknown';
}

/**
 * Extract country from GDELT location string or country code
 */
function extractCountry(fullName: string, countryCode: string): string {
    if (fullName) {
        const parts = fullName.split(',').map(p => p.trim());
        if (parts.length > 1) {
            return parts[parts.length - 1];
        }
    }
    const countryMap: Record<string, string> = {
        'US': 'United States',
        'UK': 'United Kingdom',
        'FR': 'France',
        'DE': 'Germany',
        'RU': 'Russia',
        'CN': 'China',
        'JP': 'Japan',
        'IN': 'India',
        'BR': 'Brazil',
        'UA': 'Ukraine',
        'IR': 'Iran',
        'IQ': 'Iraq',
        'SY': 'Syria',
        'IL': 'Israel',
        'PS': 'Palestine',
        'EG': 'Egypt',
        'SA': 'Saudi Arabia',
    };
    return countryMap[countryCode] || countryCode || 'Unknown';
}

/**
 * Calculate severity score and level (legacy compatibility)
 */
function calculateSeverity(events: RawGdeltEvent[]): { score: number; level: 'low' | 'medium' | 'high' } {
    const eventWeights: Record<string, number> = {
        '20': 10, // Unconventional violence
        '19': 8,  // Military action
        '18': 8,  // Armed conflict
        '17': 5,  // Coercion
        '14': 3,  // Protests
        '163': 4, // Sanctions
        '13': 2,  // Diplomatic tensions
    };

    let totalScore = 0;
    let avgToneSum = 0;

    for (const event of events) {
        const rootCode = event.eventRootCode.substring(0, 2);
        const weight = eventWeights[rootCode] || eventWeights[event.eventCode] || 3;
        totalScore += weight;
        avgToneSum += event.avgTone;
    }

    const avgTone = avgToneSum / events.length;
    const score = (totalScore / events.length) * 3 + events.length * 2 + (avgTone < 0 ? Math.abs(avgTone) * 0.5 : 0);

    let level: 'low' | 'medium' | 'high';
    if (score < 10) {
        level = 'low';
    } else if (score < 25) {
        level = 'medium';
    } else {
        level = 'high';
    }

    return { score, level };
}

/**
 * Cluster raw events by geographic proximity and time window
 * Now produces AggregatedEvent objects with confidence scoring
 */
export function clusterEvents(rawEvents: RawGdeltEvent[]): AggregatedEvent[] {
    console.log(`[GDELT] Clustering ${rawEvents.length} raw events...`);

    const clusters: RawGdeltEvent[][] = [];
    const assigned = new Set<string>();

    // Sort events by date (newest first)
    const sortedEvents = [...rawEvents].sort((a, b) =>
        b.dateAdded.localeCompare(a.dateAdded)
    );

    for (const event of sortedEvents) {
        if (assigned.has(event.globalEventId)) continue;

        const eventDate = parseGdeltDate(event.dateAdded);
        const cluster: RawGdeltEvent[] = [event];
        assigned.add(event.globalEventId);

        // Find nearby events within time window
        for (const candidate of sortedEvents) {
            if (assigned.has(candidate.globalEventId)) continue;

            const candDate = parseGdeltDate(candidate.dateAdded);
            const timeDiff = Math.abs(eventDate.getTime() - candDate.getTime());

            if (timeDiff > CLUSTER_TIME_WINDOW_MS) continue;

            const distance = haversineDistance(
                event.actionGeo_Lat, event.actionGeo_Long,
                candidate.actionGeo_Lat, candidate.actionGeo_Long
            );

            if (distance <= CLUSTER_RADIUS_KM) {
                const sameType =
                    event.eventRootCode === candidate.eventRootCode ||
                    event.eventBaseCode === candidate.eventBaseCode;

                if (sameType) {
                    cluster.push(candidate);
                    assigned.add(candidate.globalEventId);
                }
            }
        }

        if (cluster.length > 0) {
            clusters.push(cluster);
        }
    }

    // Convert clusters to AggregatedEvent objects
    const aggregatedEvents: AggregatedEvent[] = clusters.map((cluster, index) => {
        const primaryEvent = cluster[0];
        const eventType = getEventTypeLabel(primaryEvent.eventCode);
        const city = extractCity(primaryEvent.actionGeo_FullName);
        const country = extractCountry(primaryEvent.actionGeo_FullName, primaryEvent.actionGeo_CountryCode);

        const dates = cluster.map(e => parseGdeltDate(e.dateAdded));
        const firstSeen = new Date(Math.min(...dates.map(d => d.getTime())));
        const lastUpdated = new Date(Math.max(...dates.map(d => d.getTime())));

        const { score: severityScore, level: severity } = calculateSeverity(cluster);

        // Collect unique source URLs - MAXIMIZE sources
        const sourceUrls = [...new Set(cluster.map(e => e.sourceUrl).filter(Boolean))].slice(0, 50);

        // Collect actor names
        const actors = [...new Set(
            cluster.flatMap(e => [e.actor1Name, e.actor2Name].filter(Boolean))
        )].slice(0, 5);

        // Generate Article Stubs for ALL sources
        const articleStubs = sourceUrls.map(url => {
            let title = `${eventType} reported in ${city}`;
            try {
                // Try to extract a better title from URL
                const urlObj = new URL(url);
                const pathSegments = urlObj.pathname.split('/').filter(p => p.length > 3);
                if (pathSegments.length > 0) {
                    const lastSegment = pathSegments[pathSegments.length - 1];
                    const cleanSegment = lastSegment.replace(/\.(html|php|aspx|jsp)$/i, '');
                    const titleText = cleanSegment.replace(/[-_+]/g, ' ');
                    const capitalized = titleText.split(' ')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                    if (capitalized.length > 10 && !/^\d+$/.test(capitalized)) {
                        title = capitalized;
                    }
                }
            } catch (e) { }

            return {
                url,
                title,
                publisher: extractSourceName(url),
                publishedAt: lastUpdated.toISOString(),
                language: 'en', // Assumption
                apiSource: 'gdelt_signal'
            };
        });

        const slug = generateSlug(eventType, city, country, firstSeen);

        // Calculate totals from cluster
        const totalMentions = cluster.reduce((sum, e) => sum + e.numMentions, 0);
        const totalSources = cluster.reduce((sum, e) => sum + e.numSources, 0);
        const totalArticles = cluster.reduce((sum, e) => sum + e.numArticles, 0);
        const avgTone = cluster.reduce((sum, e) => sum + e.avgTone, 0) / cluster.length;

        // Build base event for confidence calculation
        const baseEvent: Partial<AggregatedEvent> = {
            gdelt: {
                detected: true,
                eventCode: primaryEvent.eventCode,
                eventType,
                mediaVolume: totalMentions,
                numSources: totalSources,
                numArticles: totalArticles,
                avgTone: Math.round(avgTone * 100) / 100,
                firstSeen: firstSeen.toISOString(),
                sourceUrls,
            },
            // ACLED not yet integrated - will be undefined
            acled: undefined,
            // Sources from GDELT URLs (minimal info until news API integrated)
            // Use article stubs as sources
            sources: articleStubs.map(stub => ({
                name: stub.publisher,
                headline: stub.title,
                excerpt: '',
                url: stub.url,
                publishedAt: stub.publishedAt
            })),
            articles: articleStubs, // Include stubs as articles
            firstSeen: firstSeen.toISOString(),
            lastUpdated: lastUpdated.toISOString(),
        };

        // Calculate confidence
        const { score: confidenceScore, level: confidence, signals } = calculateConfidence(baseEvent);


        // Try to generate a better title from the source URL (Main Title)
        let humanTitle = `${eventType} reported in ${city}, ${country}`;
        const bestStub = articleStubs.find(a => a.url.length > 20 && !a.url.includes('gdeltproject') && a.title.length > 20);

        if (bestStub) {
            humanTitle = bestStub.title;
        } else {
            // Fallback logic from before
            const bestUrl = sourceUrls.find(u => u.length > 20 && !u.includes('gdeltproject'));
            if (bestUrl) {
                try {
                    const urlObj = new URL(bestUrl);
                    const pathSegments = urlObj.pathname.split('/').filter(p => p.length > 3); // Filter short segments
                    if (pathSegments.length > 0) {
                        const lastSegment = pathSegments[pathSegments.length - 1];
                        // Remove file extensions
                        const cleanSegment = lastSegment.replace(/\.(html|php|aspx|jsp)$/i, '');
                        // Replace separators with spaces
                        const titleText = cleanSegment.replace(/[-_+]/g, ' ');

                        // Capitalize
                        const capitalized = titleText.split(' ')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ');

                        // Basic validation: ensure it has some length and isn't just numbers
                        if (capitalized.length > 10 && !/^\d+$/.test(capitalized)) {
                            humanTitle = capitalized;
                        }
                    }
                } catch (e) {
                    // Ignore URL parsing errors
                }
            }
        }

        return {
            id: `event-${primaryEvent.globalEventId}-${index}`,
            lat: primaryEvent.actionGeo_Lat,
            lon: primaryEvent.actionGeo_Long,

            // Location
            city,
            country,
            countryCode: primaryEvent.actionGeo_CountryCode,

            // Classification
            eventType,
            eventTypeCode: primaryEvent.eventRootCode,
            title: humanTitle,
            slug,

            // Timestamps
            timestamp: lastUpdated.toISOString(),
            firstSeen: firstSeen.toISOString(),
            lastUpdated: lastUpdated.toISOString(),

            // Confidence System
            confidence,
            confidenceScore,
            confidenceSignals: signals,

            // Source Layers
            gdelt: baseEvent.gdelt!,
            acled: undefined, // Not yet integrated
            context: undefined, // Not yet integrated
            sources: baseEvent.sources!,
            articles: baseEvent.articles, // Pass articles through

            // Legacy compatibility
            severity,
            severityScore: Math.round(severityScore * 10) / 10,
            eventCount: cluster.length,
            actors,
        };
    });

    console.log(`[GDELT] Created ${aggregatedEvents.length} aggregated events`);
    return aggregatedEvents;
}

/**
 * Extract source name from URL
 */
function extractSourceName(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        // Remove www. and .com/.org/etc
        const parts = hostname.replace('www.', '').split('.');
        const name = parts[0];
        // Capitalize
        return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
        return 'Unknown Source';
    }
}

/**
 * Merge new aggregated events with existing ones
 */
export function mergeEvents(existing: AggregatedEvent[], incoming: AggregatedEvent[]): AggregatedEvent[] {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const eventMap = new Map<string, AggregatedEvent>();

    for (const event of existing) {
        const eventDate = new Date(event.timestamp).getTime();
        if (eventDate < sevenDaysAgo) continue;

        const key = `${Math.round(event.lat * 10)}_${Math.round(event.lon * 10)}_${event.eventTypeCode}`;
        eventMap.set(key, event);
    }

    for (const event of incoming) {
        const key = `${Math.round(event.lat * 10)}_${Math.round(event.lon * 10)}_${event.eventTypeCode}`;
        const existingEvent = eventMap.get(key);

        if (existingEvent) {
            // Merge: update timestamp, increase event count, add sources
            existingEvent.eventCount += event.eventCount;
            existingEvent.lastUpdated = event.lastUpdated;
            existingEvent.gdelt.sourceUrls = [...new Set([
                ...existingEvent.gdelt.sourceUrls,
                ...event.gdelt.sourceUrls
            ])].slice(0, 50); // Increased limit
            existingEvent.gdelt.mediaVolume += event.gdelt.mediaVolume;

            // Merge sources/articles (prefer new ones)
            if (event.articles) {
                const existingUrls = new Set((existingEvent.articles || []).map((a: any) => a.url));
                const newArticles = event.articles.filter((a: any) => !existingUrls.has(a.url));
                existingEvent.articles = [...(existingEvent.articles || []), ...newArticles];
            }

            // Recalculate confidence after merge
            const { score, level, signals } = calculateConfidence(existingEvent);
            existingEvent.confidenceScore = score;
            existingEvent.confidence = level;
            existingEvent.confidenceSignals = signals;

            // Recalculate severity based on increased event count
            if (existingEvent.eventCount > 10) {
                existingEvent.severity = 'high';
            } else if (existingEvent.eventCount > 3) {
                existingEvent.severity = 'medium';
            }
        } else {
            eventMap.set(key, event);
        }
    }

    return Array.from(eventMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
