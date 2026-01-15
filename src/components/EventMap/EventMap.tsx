'use client';

import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import type { Feature, Polygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

interface EventMapProps {
    lat: number;
    lon: number;
    country?: string;
    zoom?: number;
}

// Dark basemap style (CARTO Dark Matter - no API key needed)
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function EventMap({ lat, lon, country, zoom = 5 }: EventMapProps) {
    return (
        <div style={{
            width: '100%',
            height: '200px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0b0b0b',
        }}>
            <Map
                initialViewState={{
                    longitude: lon,
                    latitude: lat,
                    zoom: zoom,
                    pitch: 0,      // No pitch - top-down view
                    bearing: 0,    // No rotation
                }}
                mapStyle={DARK_STYLE}
                interactive={false}  // Non-movable
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Event Marker */}
                <Marker
                    longitude={lon}
                    latitude={lat}
                    anchor="center"
                >
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            border: '3px solid rgba(255, 255, 255, 0.9)',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                        }}
                    />
                </Marker>
            </Map>
        </div>
    );
}
