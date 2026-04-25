/**
 * Event Clustering Utility
 * 
 * Groups nearby events into clusters based on geographic proximity.
 * Uses a grid-based approach for O(n) performance.
 */

export interface ClusterableEvent {
    id: string;
    lat: number;
    lon: number;
    title: string;
    slug: string;
    dotColor?: string;
    [key: string]: any;
}

export interface EventCluster {
    id: string;
    lat: number;
    lon: number;
    eventCount: number;
    events: ClusterableEvent[];
    // Representative event for display
    title: string;
    slug: string;
    dotColor: string;
    isCluster: boolean;
}

/**
 * Cluster events by geographic proximity
 * @param events Array of events with lat/lon
 * @param gridSize Size of clustering grid in degrees (smaller = more clusters)
 * @returns Array of clusters or single events
 */
export function clusterEvents(
    events: ClusterableEvent[],
    gridSize: number = 5 // degrees
): EventCluster[] {
    if (!events.length) return [];

    // Grid-based clustering
    const grid = new Map<string, ClusterableEvent[]>();

    for (const event of events) {
        // Create grid cell key based on lat/lon
        const latCell = Math.floor(event.lat / gridSize);
        const lonCell = Math.floor(event.lon / gridSize);
        const key = `${latCell},${lonCell}`;

        if (!grid.has(key)) {
            grid.set(key, []);
        }
        grid.get(key)!.push(event);
    }

    // Convert grid cells to clusters
    const clusters: EventCluster[] = [];

    for (const [key, cellEvents] of grid) {
        if (cellEvents.length === 1) {
            // Single event - no cluster needed
            const event = cellEvents[0];
            clusters.push({
                id: event.id,
                lat: event.lat,
                lon: event.lon,
                eventCount: 1,
                events: [event],
                title: event.title,
                slug: event.slug,
                dotColor: event.dotColor || 'orange',
                isCluster: false
            });
        } else {
            // Multiple events - create cluster
            // Calculate centroid
            const avgLat = cellEvents.reduce((sum, e) => sum + e.lat, 0) / cellEvents.length;
            const avgLon = cellEvents.reduce((sum, e) => sum + e.lon, 0) / cellEvents.length;

            // Determine dominant color (green > orange > red)
            const greenCount = cellEvents.filter(e => e.dotColor === 'green').length;
            const orangeCount = cellEvents.filter(e => e.dotColor === 'orange').length;
            let dominantColor = 'red';
            if (greenCount > orangeCount) dominantColor = 'green';
            else if (orangeCount > 0) dominantColor = 'orange';

            // Sort by timestamp to get newest
            const sorted = [...cellEvents].sort((a, b) =>
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );

            clusters.push({
                id: `cluster-${key}`,
                lat: avgLat,
                lon: avgLon,
                eventCount: cellEvents.length,
                events: cellEvents,
                title: `${cellEvents.length} events`,
                slug: sorted[0].slug, // Link to newest event
                dotColor: dominantColor,
                isCluster: true
            });
        }
    }

    return clusters;
}

/**
 * Cluster events with zoom-dependent grid size
 * Higher zoom = smaller grid = more detail
 */
export function clusterEventsForZoom(
    events: ClusterableEvent[],
    zoom: number
): EventCluster[] {
    // Zoom 1 = world view (large clusters ~10°)
    // Zoom 5 = country level (medium clusters ~2°)
    // Zoom 10 = city level (small clusters ~0.5°)
    const gridSize = Math.max(0.5, 20 / Math.pow(2, zoom / 2));
    return clusterEvents(events, gridSize);
}
