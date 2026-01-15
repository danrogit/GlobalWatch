'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Globe to avoid SSR issues with Three.js
const Globe = dynamic(() => import('@/components/Globe/Globe'), {
  ssr: false,
  loading: () => (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p className="loading-text">Initialiserer situationsoverblik...</p>
    </div>
  ),
});

// Dynamically import Denmark map
const DenmarkMap = dynamic(() => import('@/components/DenmarkMap/DenmarkMap'), {
  ssr: false,
  loading: () => (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p className="loading-text">Indlæser kort over Danmark...</p>
    </div>
  ),
});

import { UnifiedEvent } from '@/lib/data/types';

import Sidebar from '@/components/Sidebar/Sidebar';

type ViewMode = 'global' | 'denmark';

export default function HomePage() {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events?days=7');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Kunne ikke indlæse data');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Count events by severity
  const severityCounts = events.reduce(
    (acc, event) => {
      acc[event.severity]++;
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );

  return (
    <main>
      {/* Branding - Top Left with Toggle */}
      {/* Branding & Controls - Top Left */}
      <div className="branding-overlay" style={{ display: 'flex', alignItems: 'center', gap: '1em', pointerEvents: 'auto' }}>
        <span className="branding-logo">GlobalWatch</span>

        {/* Controls Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Liquid Glass View Mode Toggle - Smaller Version */}
          <div
            className="liquid-glass-toggle"
            style={{
              position: 'relative',
              marginTop: '0',
              padding: '2px',
              height: '32px',
              width: '160px'
            }}
          >
            <div
              className="liquid-knob"
              style={{
                position: 'absolute',
                left: '2px',
                top: '2px',
                bottom: '2px',
                width: 'calc(50% - 2px)',
                height: 'auto',
                borderRadius: '99px',
                transform: viewMode === 'denmark' ? 'translateX(100%)' : 'translateX(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: viewMode === 'denmark'
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.6) 0%, rgba(185, 28, 28, 0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.3) 100%)',
              }}
            />
            <button
              type="button"
              onClick={() => setViewMode('global')}
              className="glass-text"
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '4px 8px',
                fontSize: '10px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 700,
                letterSpacing: '0.8px',
                width: '50%',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setViewMode('denmark')}
              className="glass-text"
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '4px 8px',
                fontSize: '10px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 700,
                letterSpacing: '0.8px',
                width: '50%',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Danmark
            </button>
          </div>

          {/* Pause/Play Button - Liquid Glass Style (Only visible in Global Mode) */}
          {viewMode === 'global' && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="liquid-glass-toggle"
              style={{
                padding: '0',
                marginTop: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
              }}
              title={isPaused ? 'Start rotation' : 'Pause rotation'}
            >
              {isPaused ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="4" width="4" height="16" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">Indlæser hændelser...</p>
        </div>
      ) : error ? (
        <div className="loading-overlay">
          <p className="loading-text" style={{ color: 'var(--color-severity-high)' }}>
            {error}
          </p>
        </div>
      ) : (
        <>
          {/* Conditional map render */}
          {viewMode === 'global' ? (
            <Globe events={events} paused={isPaused} onPauseChange={setIsPaused} />
          ) : (
            <DenmarkMap events={events as any[]} />
          )}

          {/* Sidebar - Right Side */}
          <Sidebar events={events as any[]} viewMode={viewMode} />

          {/* Event Counter - Danish */}
          <div className="event-counter">
            <div className="event-counter-dot"></div>
            <span className="event-counter-text">
              <span className="event-counter-number">{events.length}</span>
              {viewMode === 'denmark' ? ' hændelser i Danmark' : ' aktive hændelser'}
            </span>
          </div>

          {/* Legend - Danish */}
          <div className="legend">
            <div className="legend-title">Alvorlighedsgrad</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot legend-dot--low"></span>
                Lav ({severityCounts.low})
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--medium"></span>
                Mellem ({severityCounts.medium})
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--high"></span>
                Høj ({severityCounts.high})
              </div>
            </div>
          </div>

          {/* Om platformen - Bottom Left */}
          <a
            href="/om-platformen"
            className="about-link"
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              padding: '8px 12px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
              zIndex: 50,
            }}
          >
            Om platformen
          </a>
        </>
      )}
    </main>
  );
}
