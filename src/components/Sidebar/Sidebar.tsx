'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { getCountryEmoji } from '@/lib/geo/country-emoji';
import { UnifiedEvent } from '@/lib/data/types';

type ViewMode = 'global' | 'denmark';

interface SidebarProps {
    events: UnifiedEvent[];
    viewMode?: ViewMode;
}

const DENMARK_BOUNDS = {
    north: 57.8,
    south: 54.5,
    west: 8.0,
    east: 15.5,
};

const STATUS_LABELS = {
    VERIFIED: 'Verified',
    REPORTED: 'Reported',
    UNVERIFIED: 'Unverified',
};

const SEVERITY_LABELS = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    blue: 'Protest',
    orange: 'Report',
    red: 'Conflict',
    green: 'Verified',
};

function getDisplayTitle(event: UnifiedEvent): string {
    return event.title || event.danishTitle;
}

export default function Sidebar({ events, viewMode = 'global' }: SidebarProps) {
    const router = useRouter();

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

    const sortedEvents = useMemo(() => {
        return [...filteredEvents].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [filteredEvents]);

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
            <div className="sidebar-header">
                <div className="event-counter-dot"></div>
                <div className="sidebar-title-large">
                    <span className="sidebar-count">{filteredEvents.length}</span>
                    {viewMode === 'denmark' ? ' Events' : ' Active Events'}
                </div>
            </div>

            <div className="sidebar-list">
                {sortedEvents.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        opacity: 0.6,
                        fontSize: '14px'
                    }}>
                        {viewMode === 'denmark'
                            ? 'No events in Denmark right now'
                            : 'No events to show'}
                    </div>
                ) : (
                    sortedEvents.map((event) => {
                        const colorClass = event.dotColor || (
                            event.severity === 'high' ? 'red' :
                                event.severity === 'medium' ? 'orange' : 'blue'
                        );
                        const status = event.status || 'REPORTED';

                        return (
                            <div
                                key={event.id}
                                className="story-card"
                                onClick={() => router.push(`/event/${event.slug}`)}
                            >
                                <div className="story-header" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`badge-verification badge--${status.toLowerCase()}`}>
                                            {STATUS_LABELS[status]}
                                        </span>
                                        <div
                                            className={`severity-indicator severity-indicator--${colorClass}`}
                                            title={`Status: ${SEVERITY_LABELS[colorClass as keyof typeof SEVERITY_LABELS] || SEVERITY_LABELS[event.severity]}`}
                                        />
                                    </div>
                                    <div className="story-time" suppressHydrationWarning>
                                        {new Date(event.timestamp).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <div className="story-title">
                                    {getDisplayTitle(event)}
                                </div>
                                <div className="story-location">
                                    {getCountryEmoji(event.country || 'Global')} {event.country || 'Global'}
                                    {event.sources && event.sources.length > 0 && (
                                        <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '11px' }}>
                                            - {event.sources.length} source{event.sources.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="sidebar-footer">
                <div className="legend-row">
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#22c55e' }}></span>
                        Verified ({stats.verified})
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#f97316' }}></span>
                        Reported ({stats.reported})
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                        Unverified ({stats.unverified})
                    </div>
                </div>
            </div>
        </div>
    );
}
