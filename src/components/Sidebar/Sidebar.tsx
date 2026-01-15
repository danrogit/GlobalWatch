'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { getCountryEmoji } from '@/lib/geo/country-emoji';

interface EventData {
    id: string;
    lat: number;
    lon: number;
    severity: 'low' | 'medium' | 'high';
    title: string;
    slug: string;
    timestamp: string;
    eventCount: number;
    country?: string;
    dotColor?: 'blue' | 'orange' | 'red' | 'green';
    layer?: 'incident' | 'political';
    danishTitle?: string;
    danishCategory?: string;
    status?: 'VERIFIED' | 'REPORTED' | 'UNVERIFIED';
    sources?: string[];
}

type ViewMode = 'global' | 'denmark';

interface SidebarProps {
    events: EventData[];
    viewMode?: ViewMode;
}

// Denmark bounds
const DENMARK_BOUNDS = {
    north: 57.8,
    south: 54.5,
    west: 8.0,
    east: 15.5,
};

// Map color to label
const SEVERITY_LABELS = {
    low: 'Lav',
    medium: 'Mellem',
    high: 'Høj',
    blue: 'Protest',
    orange: 'Rapport',
    red: 'Vold',
};

// Translate event type to Danish
function translateEventType(eventType: string): string {
    const translations: Record<string, string> = {
        'Protests': 'Protest',
        'Protest': 'Protest',
        'Military Action': 'Militær aktion',
        'Armed Conflict': 'Væbnet konflikt',
        'Coercion': 'Tvang',
        'Unconventional Violence': 'Ukonventionel vold',
        'Sanctions': 'Sanktion',
        'Diplomatic Tensions': 'Diplomatiske spændinger',
        'Demonstrate': 'Demonstration',
        'Riot': 'Optøjer',
        'Violence': 'Vold',
        'Battles': 'Kamphandlinger',
        'Strategic developments': 'Strategisk udvikling',
    };
    return translations[eventType] || eventType;
}

// Create Danish title from event
function getDanishTitle(event: EventData): string {
    if (event.danishTitle) return event.danishTitle;

    // Fallback: translate common patterns
    return event.title
        .replace(/reported in/gi, 'i')
        .replace(/Military Action/gi, 'Militær aktion')
        .replace(/Armed Conflict/gi, 'Væbnet konflikt')
        .replace(/Protests/gi, 'Protester')
        .replace(/Coercion/gi, 'Tvang')
        .replace(/Diplomatic Tensions/gi, 'Diplomatiske spændinger');
}

export default function Sidebar({ events, viewMode = 'global' }: SidebarProps) {
    const router = useRouter();

    // Filter events for Denmark mode
    const filteredEvents = useMemo(() => {
        if (viewMode === 'denmark') {
            return events.filter(event => {
                const inBounds =
                    event.lat >= DENMARK_BOUNDS.south &&
                    event.lat <= DENMARK_BOUNDS.north &&
                    event.lon >= DENMARK_BOUNDS.west &&
                    event.lon <= DENMARK_BOUNDS.east;

                const isDenmark = event.country?.toLowerCase().includes('denmark') ||
                    event.country?.toLowerCase() === 'da' ||
                    event.country?.toLowerCase() === 'dk';

                return inBounds || isDenmark;
            });
        }
        return events;
    }, [events, viewMode]);

    // Sort events by timestamp descending (newest first)
    const sortedEvents = useMemo(() => {
        return [...filteredEvents].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [filteredEvents]);

    // Calculate stats by verification status
    const stats = useMemo(() => {
        return filteredEvents.reduce(
            (acc, event) => {
                if (event.status === 'VERIFIED' || event.dotColor === 'green') {
                    acc.verified++;
                } else if (event.status === 'REPORTED' || event.dotColor === 'orange') {
                    acc.reported++;
                } else {
                    acc.unverified++;
                }
                return acc;
            },
            { verified: 0, reported: 0, unverified: 0 }
        );
    }, [filteredEvents]);

    return (
        <div className="sidebar">
            {/* Top: Active Events Counter - Danish */}
            <div className="sidebar-header">
                <div className="event-counter-dot"></div>
                <div className="sidebar-title-large">
                    <span className="sidebar-count">{filteredEvents.length}</span>
                    {viewMode === 'denmark' ? ' Hændelser' : ' Aktive Hændelser'}
                </div>
            </div>

            {/* Middle: Scrollable List */}
            <div className="sidebar-list">
                {sortedEvents.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        opacity: 0.6,
                        fontSize: '14px'
                    }}>
                        {viewMode === 'denmark'
                            ? 'Ingen hændelser i Danmark lige nu'
                            : 'Ingen hændelser at vise'}
                    </div>
                ) : (
                    sortedEvents.map((event) => {
                        const colorClass = event.dotColor || (
                            event.severity === 'high' ? 'red' :
                                event.severity === 'medium' ? 'orange' : 'blue'
                        );

                        return (
                            <div
                                key={event.id}
                                className="story-card"
                                onClick={() => router.push(`/event/${event.slug}`)}
                            >
                                <div className="story-header" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Status moved to left */}
                                        {event.status && (
                                            <span className={`badge-verification badge--${event.status.toLowerCase()}`}>
                                                {event.status === 'VERIFIED' ? 'Bekræftet' :
                                                    event.status === 'REPORTED' ? 'Rapporteret' : 'Ubekræftet'}
                                            </span>
                                        )}
                                        <div
                                            className={`severity-indicator severity-indicator--${colorClass}`}
                                            title={`Status: ${SEVERITY_LABELS[colorClass as keyof typeof SEVERITY_LABELS] || SEVERITY_LABELS[event.severity]}`}
                                        />
                                    </div>
                                    <div className="story-time" suppressHydrationWarning>
                                        {new Date(event.timestamp).toLocaleTimeString('da-DK', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <div className="story-title">
                                    {getDanishTitle(event)}
                                </div>
                                <div className="story-location">
                                    {getCountryEmoji(event.country || 'Global')} {event.country || 'Global'}
                                    {event.sources && event.sources.length > 0 && (
                                        <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '11px' }}>
                                            • {event.sources.length} kilde{event.sources.length !== 1 ? 'r' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom: Sidebar Legend - Verification Status */}
            <div className="sidebar-footer">
                <div className="legend-row">
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#22c55e' }}></span>
                        Bekræftet ({stats.verified})
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#f97316' }}></span>
                        Rapporteret ({stats.reported})
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                        Ubekræftet ({stats.unverified})
                    </div>
                </div>
            </div>
        </div>
    );
}
