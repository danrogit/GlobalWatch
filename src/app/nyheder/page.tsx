'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCountryEmoji } from '@/lib/geo/country-emoji';

interface NewsEvent {
    id: string;
    title: string;
    danishTitle?: string;
    slug: string;
    timestamp: string;
    country?: string;
    status?: string;
    dotColor?: string;
    sources?: string[];
    description?: string;
}

export default function NyhederPage() {
    const [events, setEvents] = useState<NewsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'verified' | 'reported'>('all');

    useEffect(() => {
        fetch('/api/events?days=90')
            .then(res => res.json())
            .then(data => {
                setEvents(data.events || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch events:', err);
                setLoading(false);
            });
    }, []);

    // Filter events
    const filteredEvents = events.filter(event => {
        if (filter === 'verified') return event.status === 'VERIFIED' || event.dotColor === 'green';
        if (filter === 'reported') return event.status === 'REPORTED' || event.dotColor === 'orange';
        return true;
    });

    // Sort by timestamp (newest first)
    const sortedEvents = [...filteredEvents].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (loading) {
        return (
            <div className="nyheder-loading">
                <div className="spinner"></div>
                <p>Indlæser nyheder...</p>
            </div>
        );
    }

    return (
        <div className="nyheder-page">
            {/* Header */}
            <header className="nyheder-header">
                <div className="header-content">
                    <Link href="/" className="logo">
                        <span className="logo-icon">🌍</span>
                        <span className="logo-text">GlobalWatch</span>
                    </Link>
                    <nav className="nav-links">
                        <Link href="/">Kort</Link>
                        <Link href="/nyheder" className="active">Nyheder</Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="nyheder-main">
                <div className="page-title-section">
                    <h1>Seneste Nyheder</h1>
                    <p className="subtitle">{sortedEvents.length} hændelser fra hele verden</p>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Alle ({events.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
                        onClick={() => setFilter('verified')}
                    >
                        <span className="dot green"></span>
                        Bekræftet
                    </button>
                    <button
                        className={`filter-btn ${filter === 'reported' ? 'active' : ''}`}
                        onClick={() => setFilter('reported')}
                    >
                        <span className="dot orange"></span>
                        Rapporteret
                    </button>
                </div>

                {/* News Grid */}
                <div className="news-grid">
                    {sortedEvents.map(event => (
                        <Link href={`/event/${event.slug}`} key={event.id} className="news-card">
                            <div className="card-header">
                                <span className={`status-badge ${event.status?.toLowerCase() || 'reported'}`}>
                                    {event.status === 'VERIFIED' ? 'Bekræftet' :
                                        event.status === 'REPORTED' ? 'Rapporteret' : 'Ubekræftet'}
                                </span>
                                <span className="card-time" suppressHydrationWarning>
                                    {new Date(event.timestamp).toLocaleDateString('da-DK', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <h2 className="card-title">{event.danishTitle || event.title}</h2>
                            <div className="card-meta">
                                <span className="country">
                                    {getCountryEmoji(event.country || 'Global')} {event.country || 'Global'}
                                </span>
                                {event.sources && event.sources.length > 0 && (
                                    <span className="sources">
                                        {event.sources.length} kilde{event.sources.length !== 1 ? 'r' : ''}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            <style jsx>{`
                .nyheder-page {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%);
                    color: #f1f5f9;
                }

                .nyheder-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    gap: 16px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(59, 130, 246, 0.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .nyheder-header {
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    color: inherit;
                }

                .logo-icon {
                    font-size: 24px;
                }

                .logo-text {
                    font-size: 20px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #60a5fa, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .nav-links {
                    display: flex;
                    gap: 24px;
                }

                .nav-links a {
                    color: #94a3b8;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }

                .nav-links a:hover,
                .nav-links a.active {
                    color: #f1f5f9;
                }

                .nyheder-main {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 40px 24px;
                }

                .page-title-section {
                    margin-bottom: 32px;
                }

                .page-title-section h1 {
                    font-size: 36px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                }

                .subtitle {
                    color: #64748b;
                    margin: 0;
                }

                .filter-bar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    padding: 10px 20px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(30, 41, 59, 0.5);
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .filter-btn:hover {
                    background: rgba(30, 41, 59, 0.8);
                    color: #f1f5f9;
                }

                .filter-btn.active {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .dot.green { background: #22c55e; }
                .dot.orange { background: #f97316; }

                .news-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 24px;
                }

                .news-card {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 20px;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.2s;
                }

                .news-card:hover {
                    background: rgba(30, 41, 59, 0.6);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateY(-2px);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .status-badge {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge.verified {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }

                .status-badge.reported {
                    background: rgba(249, 115, 22, 0.15);
                    color: #f97316;
                }

                .status-badge.unverified {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                }

                .card-time {
                    font-size: 12px;
                    color: #64748b;
                }

                .card-title {
                    font-size: 16px;
                    font-weight: 600;
                    line-height: 1.4;
                    margin: 0 0 16px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    color: #64748b;
                }

                .country {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .sources {
                    color: #475569;
                }

                @media (max-width: 768px) {
                    .news-grid {
                        grid-template-columns: 1fr;
                    }

                    .page-title-section h1 {
                        font-size: 28px;
                    }
                }
            `}</style>
        </div>
    );
}
