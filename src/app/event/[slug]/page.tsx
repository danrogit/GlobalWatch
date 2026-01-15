import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventBySlug, getAllGeoEvents } from '@/lib/db/events';
import { getCountryName } from '@/lib/verify';
import {
    getRelativeTime,
    extractDomain,
} from '@/lib/content/generator';
import Footer from '@/components/Footer';
import TranslatedSnippets from '@/components/TranslatedSnippets';
import EventMap from '@/components/EventMap/EventMap';
import '@/app/event.css';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Danish date formatting
function formatDanishDate(isoString: string): string {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('da-DK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Map color to label and visual styling
const LAYER_MAPPING = {
    blue: { emoji: '🔵', label: 'Protest', color: '#3b82f6' },
    orange: { emoji: '🟠', label: 'Rapport / Signal', color: '#f59e0b' },
    red: { emoji: '🔴', label: 'Vold / Konflikt', color: '#ef4444' },
    green: { emoji: '✅', label: 'Bekræftet', color: '#10b981' },
};

// Generate metadata for SEO - Country only
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const event = getEventBySlug(slug);

    if (!event) {
        return {
            title: 'Begivenhed ikke fundet | GlobalWatch',
        };
    }

    const title = `${event.danishTitle} | GlobalWatch`;
    const description = `${event.danishTitle} rapporteret i ${event.country}. ` +
        `Registreret ${formatDanishDate(event.timestamp)}.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            publishedTime: event.timestamp,
            modifiedTime: event.addedAt,
            section: event.danishCategory,
            tags: [event.danishCategory, event.country],
            locale: 'da_DK',
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
        alternates: {
            canonical: `/event/${slug}`,
        },
    };
}

// Generate static params for known events
export async function generateStaticParams() {
    const events = getAllGeoEvents();
    return events.slice(0, 100).map((event: any) => ({
        slug: event.slug,
    }));
}

export default async function EventPage({ params }: PageProps) {
    const { slug } = await params;
    const event = getEventBySlug(slug);

    if (!event) {
        notFound();
    }

    // Convert country code to full name
    const countryName = getCountryName(event.country);

    const layerInfo = (LAYER_MAPPING as Record<string, any>)[event.dotColor] || LAYER_MAPPING.orange;

    // Static OSM map URL
    const osmMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${event.lon - 2},${event.lat - 1.5},${event.lon + 2},${event.lat + 1.5}&layer=mapnik&marker=${event.lat},${event.lon}`;

    // JSON-LD structured data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: event.danishTitle,
        description: event.notes || event.danishTitle,
        datePublished: event.timestamp,
        dateModified: event.addedAt,
        inLanguage: 'da',
        author: {
            '@type': 'Organization',
            name: 'GlobalWatch',
        },
        publisher: {
            '@type': 'Organization',
            name: 'GlobalWatch',
        },
        about: {
            '@type': 'Event',
            name: event.danishTitle,
            startDate: event.timestamp,
            location: {
                '@type': 'Place',
                name: event.country,
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: event.lat,
                    longitude: event.lon,
                },
            },
        },
    };

    return (
        <div className="event-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <header className="event-header" style={{ borderLeft: `6px solid ${layerInfo.color}`, paddingLeft: '20px' }}>
                <div className="container">
                    <nav className="event-nav">
                        <Link href="/">Hjem</Link>
                        <span className="event-nav-separator">/</span>
                        <Link href={`/country/${encodeURIComponent(countryName.toLowerCase().replace(/\s+/g, '-'))}`}>
                            {countryName}
                        </Link>
                    </nav>

                    <div className="event-title-wrapper">
                        <h1 className="event-title">{event.danishTitle}</h1>
                        <span
                            className="confidence-badge"
                            style={{
                                backgroundColor: event.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.2)' :
                                    event.status === 'REPORTED' ? 'rgba(245, 158, 11, 0.2)' :
                                        layerInfo.color + '20',
                                color: event.status === 'VERIFIED' ? '#10b981' :
                                    event.status === 'REPORTED' ? '#f59e0b' :
                                        layerInfo.color,
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                fontSize: '14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {event.status === 'VERIFIED' ? '✅ Bekræftet' :
                                event.status === 'REPORTED' ? '⚠️ Rapporteret' :
                                    `${layerInfo.emoji} ${layerInfo.label}`}
                        </span>
                    </div>

                    <div className="event-meta">
                        <div className="event-meta-item">
                            <span className="event-meta-icon">🕐</span>
                            <span>Opdateret {getRelativeTime(event.addedAt)}</span>
                        </div>
                        <div className="event-meta-item">
                            <span className="event-meta-icon">📍</span>
                            <span>{countryName}</span>
                        </div>
                        <div className="event-meta-item">
                            <span className="event-meta-icon">🛡️</span>
                            <span>{event.layer === 'incident' ? 'Verificeret hændelse' : 'Politisk signal'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="event-content">
                <div className="container">
                    <div className="event-grid">
                        <div className="event-main">
                            {/* Kort Fakta */}
                            <section className="event-section" style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px'
                            }}>
                                <h2 className="event-section-title" style={{ marginBottom: '12px' }}>📋 Kort fakta</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                                    <span style={{ opacity: 0.7 }}>Land:</span>
                                    <span>{countryName}</span>
                                    <span style={{ opacity: 0.7 }}>Dato:</span>
                                    <span>{formatDanishDate(event.timestamp)}</span>
                                    <span style={{ opacity: 0.7 }}>Type:</span>
                                    <span>{event.danishCategory}</span>
                                    <span style={{ opacity: 0.7 }}>Kilde:</span>
                                    <span>{event.source}</span>
                                    {event.fatalities !== undefined && (
                                        <>
                                            <span style={{ opacity: 0.7 }}>Tabstal:</span>
                                            <span>{event.fatalities}</span>
                                        </>
                                    )}
                                    <span style={{ opacity: 0.7 }}>Status:</span>
                                    <span style={{ color: layerInfo.color }}>{layerInfo.emoji} {layerInfo.label}</span>
                                </div>
                            </section>

                            {/* Featured Image */}
                            {event.imageUrl && (
                                <div className="event-featured-image" style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                                    <img
                                        src={event.imageUrl}
                                        alt={event.danishTitle}
                                        style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Detaljeret beskrivelse */}
                            {event.notes && (
                                <section className="event-section">
                                    <h2 className="event-section-title">📝 Beskrivelse</h2>
                                    <div className="event-notes" style={{
                                        padding: '16px',
                                        lineHeight: '1.6',
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}>
                                        {event.notes}
                                    </div>
                                </section>
                            )}

                            {/* Quotes Section */}
                            {event.quotes && event.quotes.length > 0 && (
                                <section className="event-section">
                                    <h2 className="event-section-title">💬 Citater</h2>
                                    <div className="quotes-grid" style={{ display: 'grid', gap: '16px' }}>
                                        {event.quotes.map((quote: any, idx: number) => (
                                            <blockquote key={idx} style={{
                                                margin: 0,
                                                padding: '16px 20px',
                                                borderLeft: '4px solid #3b82f6',
                                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                                borderRadius: '0 8px 8px 0',
                                                fontStyle: 'italic',
                                                color: '#e2e8f0'
                                            }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '15px' }}>"{quote.text}"</p>
                                                {quote.speaker && (
                                                    <cite style={{
                                                        display: 'block',
                                                        fontSize: '13px',
                                                        color: '#94a3b8',
                                                        fontStyle: 'normal',
                                                        fontWeight: 600
                                                    }}>
                                                        — {quote.speaker}
                                                    </cite>
                                                )}
                                            </blockquote>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Hvad medierne rapporterer - for signals, or if we have URLs */}
                            <section className="event-section">
                                <h2 className="event-section-title">📰 Medie-kontekst</h2>
                                <TranslatedSnippets
                                    urls={event.sourceUrl ? [event.sourceUrl] : []}
                                    eventType={event.category}
                                    country={countryName}
                                />
                            </section>

                            {/* Verificerede Kilder (New System) */}
                            {event.articles && event.articles.length > 0 ? (
                                <section className="event-section">
                                    <h2 className="event-section-title">📰 Verificerede Kilder ({event.articles.length})</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {event.articles.map((article: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow"
                                                style={{
                                                    padding: '12px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    display: 'block',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#e8e8f0' }}>
                                                    {article.title}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#a0a0b8', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 500, color: '#4f8fff' }}>{article.publisher}</span>
                                                    <span>{new Date(article.publishedAt).toLocaleDateString('da-DK')}</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            ) : (
                                /* Legacy Single Source Logic */
                                <section className="event-section">
                                    <h2 className="event-section-title">🔗 Kilde</h2>
                                    {event.sourceUrl ? (
                                        <a
                                            href={event.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                color: '#3b82f6',
                                                textDecoration: 'none',
                                                display: 'inline-block'
                                            }}
                                        >
                                            Besøg kilde: {extractDomain(event.sourceUrl)}
                                        </a>
                                    ) : (
                                        <p style={{ fontSize: '13px', opacity: 0.6 }}>
                                            Kilde: {event.source}
                                        </p>
                                    )}
                                </section>
                            )}

                            {/* GDELT Source URLs (All detected sources) */}
                            {event.gdeltSourceUrls && event.gdeltSourceUrls.length > 0 && (
                                <section className="event-section">
                                    <h2 className="event-section-title">🌐 GDELT Kilder ({event.gdeltSourceUrls.length})</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {event.gdeltSourceUrls.map((url: string, idx: number) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow"
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    textDecoration: 'none',
                                                    color: '#94a3b8',
                                                    fontSize: '12px',
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <span style={{ color: '#60a5fa', fontWeight: 500 }}>{extractDomain(url)}</span>
                                                <span style={{ marginLeft: '8px', opacity: 0.6 }}>→ Læs artikel</span>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <aside className="event-sidebar">
                            <div className="sidebar-card">
                                <h3 className="sidebar-card-title">Lokation</h3>
                                <div style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    marginBottom: '12px'
                                }}>
                                    <EventMap lat={event.lat} lon={event.lon} country={event.country} />
                                </div>
                                <div className="location-info" style={{ marginTop: '12px' }}>
                                    <div className="location-row">
                                        <span className="location-label">Land</span>
                                        <span className="location-value">
                                            <Link href={`/country/${encodeURIComponent(event.country.toLowerCase().replace(/\s+/g, '-'))}`}>
                                                {event.country}
                                            </Link>
                                        </span>
                                    </div>
                                    <div className="location-row">
                                        <span className="location-label">Hændelsesdato</span>
                                        <span className="location-value">{formatDanishDate(event.timestamp)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sidebar-card" style={{
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                fontSize: '12px',
                                opacity: 0.8
                            }}>
                                <h3 className="sidebar-card-title">📊 Verificeret Data</h3>
                                <p style={{ margin: '8px 0' }}>
                                    Denne information er indhentet gennem:
                                </p>
                                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                    {event.layer === 'incident' ? (
                                        <>
                                            <li>ACLED (Confirmed Conflict Data)</li>
                                            <li>Lokale og internationale observatører</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>Officielle udmeldinger</li>
                                            <li>Verificerede nyhedsmedier</li>
                                        </>
                                    )}
                                </ul>
                                <p style={{ margin: '8px 0 0 0', fontSize: '11px' }}>
                                    Sidst opdateret: {formatDanishDate(event.addedAt)}
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
