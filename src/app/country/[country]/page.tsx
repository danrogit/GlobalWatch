import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventsByCountry, getCountriesWithEvents, loadEventsFromDisk } from '@/lib/gdelt/store';
import { getRelativeTime } from '@/lib/content/generator';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import '@/app/event.css';

interface PageProps {
    params: Promise<{ country: string }>;
}

function normalizeCountryName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { country } = await params;
    const countryName = normalizeCountryName(country);

    return {
        title: `Events in ${countryName} | GlobalWatch`,
        description: `Monitor geopolitical events in ${countryName}. Real-time situational awareness for protests, conflicts, and security incidents.`,
        openGraph: {
            title: `Events in ${countryName} | GlobalWatch`,
            description: `Real-time geopolitical events in ${countryName}`,
            type: 'website',
        },
        alternates: {
            canonical: `/country/${country}`,
        },
    };
}

export async function generateStaticParams() {
    loadEventsFromDisk();
    const countries = getCountriesWithEvents();
    return countries.slice(0, 50).map((country) => ({
        country: country.toLowerCase().replace(/\s+/g, '-'),
    }));
}

export default async function CountryPage({ params }: PageProps) {
    const { country } = await params;
    const countryName = normalizeCountryName(country);

    loadEventsFromDisk();
    const events = getEventsByCountry(country);

    // Count by severity
    const severityCounts = events.reduce(
        (acc, event) => {
            acc[event.severity]++;
            return acc;
        },
        { low: 0, medium: 0, high: 0 }
    );

    return (
        <div className="hub-page">
            <header className="hub-header">
                <div className="container">
                    <nav className="event-nav">
                        <Link href="/">Home</Link>
                        <span className="event-nav-separator">/</span>
                        <span>Countries</span>
                        <span className="event-nav-separator">/</span>
                        <span>{countryName}</span>
                    </nav>

                    <h1 className="hub-title">Events in {countryName}</h1>
                    <p className="hub-description">
                        Real-time monitoring of geopolitical events in {countryName} from the last 7 days.
                        Data is sourced from international news outlets and updated every 15 minutes.
                    </p>

                    {events.length > 0 && (
                        <div className="hub-stats">
                            <div className="hub-stat">
                                <span className="hub-stat-value">{events.length}</span>
                                <span className="hub-stat-label">Active Events</span>
                            </div>
                            <div className="hub-stat">
                                <span className="hub-stat-value" style={{ color: 'var(--color-severity-high)' }}>
                                    {severityCounts.high}
                                </span>
                                <span className="hub-stat-label">High Severity</span>
                            </div>
                            <div className="hub-stat">
                                <span className="hub-stat-value" style={{ color: 'var(--color-severity-medium)' }}>
                                    {severityCounts.medium}
                                </span>
                                <span className="hub-stat-label">Medium Severity</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="hub-content">
                <div className="container">
                    {events.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🌍</div>
                            <h2 className="empty-state-title">No Active Events</h2>
                            <p className="empty-state-text">
                                No geopolitical events have been detected in {countryName} in the last 7 days.
                            </p>
                        </div>
                    ) : (
                        <div className="event-cards">
                            {events.map((event, index) => (
                                <>
                                    <Link
                                        key={event.id}
                                        href={`/event/${event.slug}`}
                                        className="event-card"
                                    >
                                        <div className="event-card-header">
                                            <h2 className="event-card-title">{event.title}</h2>
                                            <span className={`severity-badge severity-badge--${event.severity}`}>
                                                {event.severity}
                                            </span>
                                        </div>
                                        <div className="event-card-meta">
                                            <span>📍 {event.city}</span>
                                            <span>🕐 {getRelativeTime(event.lastUpdated)}</span>
                                            <span>📊 {event.eventCount} incident{event.eventCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    </Link>

                                    {/* Insert ad after 3rd card */}
                                    {index === 2 && events.length > 3 && (
                                        <AdSlot key="ad-inline" type="inline" />
                                    )}
                                </>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
