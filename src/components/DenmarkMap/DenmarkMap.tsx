'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl/maplibre';
import type { Feature, Polygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { UnifiedEvent } from '@/lib/data/types';
import { clusterEvents, EventCluster } from '@/lib/clustering';
import './DenmarkMap.css';

interface Props {
    events: UnifiedEvent[];
}

// Dark basemap style (CARTO Dark Matter - no API key needed)
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Denmark bounds - Expanded to allow viewing context (Northern Europe)
const DENMARK_BOUNDS: [[number, number], [number, number]] = [
    [3.0, 53.0],   // Southwest (North Sea/Germany)
    [20.0, 60.0],  // Northeast (Sweden/Norway)
];

// Helper: build a world-sized polygon with Denmark as a hole (mask everything else)
function makeWorldMask(denmarkGeoJson: any) {
    const worldRing = [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
    ];

    // Extract rings from Denmark geometry
    const rings: number[][][] = [];
    const geometry = denmarkGeoJson?.geometry;

    if (!geometry) return null;

    if (geometry.type === 'Polygon') {
        rings.push(geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
        for (const poly of geometry.coordinates) {
            rings.push(poly[0]);
        }
    }

    if (rings.length === 0) return null;

    return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
            type: 'Polygon' as const,
            coordinates: [worldRing, ...rings],
        },
    } as Feature<Polygon>;
}

export default function DenmarkMap({ events }: Props) {
    const [denmarkGeoJson, setDenmarkGeoJson] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

    // Load Denmark GeoJSON
    useEffect(() => {
        fetch('/denmark.json')
            .then(res => res.json())
            .then(data => setDenmarkGeoJson(data))
            .catch(err => console.error('Failed to load Denmark GeoJSON', err));
    }, []);

    // Filter events to Denmark only - REQUIRE country to be Denmark
    const denmarkEvents = useMemo(() => {
        return events.filter(event => {
            // Must be explicitly Denmark - not just in geographic bounds
            const isDenmark =
                event.country?.toLowerCase() === 'denmark' ||
                event.country?.toLowerCase().includes('danmark') ||
                event.country?.toLowerCase() === 'da' ||
                event.country?.toLowerCase() === 'dk';

            return isDenmark;
        });
    }, [events]);

    // Cluster Denmark events (0.5 degree grid for city-level clustering)
    const clusteredDenmarkEvents = useMemo(() => {
        return clusterEvents(denmarkEvents as any, 0.5);
    }, [denmarkEvents]);

    // Create world mask (hides everything outside Denmark)
    const maskFeature = useMemo(() => {
        if (!denmarkGeoJson) return null;
        return makeWorldMask(denmarkGeoJson);
    }, [denmarkGeoJson]);

    // Get marker color based on status
    const getMarkerColor = useCallback((event: UnifiedEvent) => {
        if (event.status === 'VERIFIED' || event.dotColor === 'green') return '#22c55e';
        if (event.status === 'REPORTED' || event.dotColor === 'orange') return '#f97316';
        return '#ef4444';
    }, []);

    const handleEventClick = useCallback((event: UnifiedEvent) => {
        setSelectedEvent(event);
    }, []);

    return (
        <div className="denmark-map-container">
            <Map
                initialViewState={{
                    longitude: 11.0,
                    latitude: 56.2,
                    zoom: 5.5,       // Appropriate zoom for the expanded bounds
                    pitch: 0,        // Top-down view
                    bearing: 0,      // No rotation
                }}
                mapStyle={DARK_STYLE}
                maxBounds={DENMARK_BOUNDS}
                minZoom={3.0}
                maxZoom={12}
                dragRotate={true}
                touchZoomRotate={true}
                renderWorldCopies={false}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Mask everything outside Denmark */}
                {maskFeature && (
                    <Source id="dk-mask" type="geojson" data={maskFeature}>
                        <Layer
                            id="dk-mask-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#0b0b0b',
                                'fill-opacity': 0.88,
                            }}
                        />
                    </Source>
                )}

                {/* Denmark outline */}
                {denmarkGeoJson && (
                    <Source id="dk-outline" type="geojson" data={denmarkGeoJson}>
                        <Layer
                            id="dk-outline-line"
                            type="line"
                            paint={{
                                'line-color': '#3b82f6',
                                'line-width': 2,
                                'line-opacity': 0.6,
                            }}
                        />
                    </Source>
                )}

                {/* Clustered Event Markers */}
                {clusteredDenmarkEvents.map((cluster) => {
                    const color = cluster.dotColor === 'green' ? '#22c55e' :
                        cluster.dotColor === 'orange' ? '#f97316' : '#ef4444';
                    const isVerified = cluster.dotColor === 'green';
                    const size = cluster.isCluster ? Math.min(40, 16 + cluster.eventCount * 3) : 16;

                    return (
                        <Marker
                            key={cluster.id}
                            longitude={cluster.lon}
                            latitude={cluster.lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                // For clusters, navigate to first event
                                if (cluster.events.length > 0) {
                                    window.location.href = `/event/${cluster.slug}`;
                                }
                            }}
                        >
                            <div
                                className="event-marker"
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    border: '2px solid rgba(255, 255, 255, 0.8)',
                                    boxShadow: `0 0 ${size / 2}px ${color}`,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Show event count for clusters */}
                                {cluster.isCluster && (
                                    <span style={{
                                        color: '#fff',
                                        fontSize: size > 24 ? '12px' : '10px',
                                        fontWeight: 700,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                    }}>
                                        {cluster.eventCount}
                                    </span>
                                )}
                                {/* Pulse animation for verified events */}
                                {isVerified && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: '-6px',
                                            borderRadius: '50%',
                                            border: `2px solid ${color}`,
                                            animation: 'pulse 2s infinite',
                                            opacity: 0.5,
                                        }}
                                    />
                                )}
                            </div>
                        </Marker>
                    );
                })}

                {/* Popup for selected event */}
                {selectedEvent && (
                    <Popup
                        longitude={selectedEvent.lon}
                        latitude={selectedEvent.lat}
                        anchor="bottom"
                        onClose={() => setSelectedEvent(null)}
                        closeOnClick={false}
                        className="event-popup"
                    >
                        <div style={{ maxWidth: '200px', padding: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                                {selectedEvent.danishTitle || selectedEvent.title}
                            </h4>
                            <p style={{ margin: '4px 0', fontSize: '11px', opacity: 0.7 }}>
                                {selectedEvent.danishCategory} • {selectedEvent.status === 'VERIFIED' ? 'Bekræftet' :
                                    selectedEvent.status === 'REPORTED' ? 'Rapporteret' : 'Ubekræftet'}
                            </p>
                            <a
                                href={`/event/${selectedEvent.slug}`}
                                style={{
                                    display: 'inline-block',
                                    marginTop: '4px',
                                    fontSize: '11px',
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                }}
                            >
                                Læs mere →
                            </a>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Event count overlay */}
            <div className="denmark-count-overlay">
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>Danmark:</span>{' '}
                {denmarkEvents.length} hændelser
            </div>
        </div>
    );
}
