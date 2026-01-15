import { Metadata } from 'next';
import Link from 'next/link';
import { getEventsByCity, getCitiesWithEvents, loadEventsFromDisk } from '@/lib/gdelt/store';
import { getRelativeTime } from '@/lib/content/generator';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import '@/app/event.css';

interface PageProps {
    params: Promise<{ city: string }>;
}

function normalizeCityName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city } = await params;
    const cityName = normalizeCityName(city);

    return {
        title: `Events in ${cityName} | GlobalWatch`,
        description: `Monitor geopolitical events in ${cityName}. Real-time situational awareness for protests, conflicts, and security incidents.`,
        openGraph: {
            title: `Events in ${cityName} | GlobalWatch`,
            description: `Real-time geopolitical events in ${cityName}`,
            type: 'website',
        },
        alternates: {
            canonical: `/city/${city}`,
        },
    };
}

export async function generateStaticParams() {
    loadEventsFromDisk();
    const cities = getCitiesWithEvents();
    return cities.slice(0, 100).map((city) => ({
        city: city.toLowerCase().replace(/\s+/g, '-'),
    }));
}

export default async function CityPage({ params }: PageProps) {
    const { city } = await params;
    const cityName = normalizeCityName(city);

    loadEventsFromDisk();
    const events = getEventsByCity(city);

    // Get country from first event
    const country = events[0]?.country || '';

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
                        {country && (
                            <>
                                <Link href={`/country/${encodeURIComponent(country.toLowerCase().replace(/\s+/g, '-'))}`}>
                                    {country}
                                </Link>
                                <span className="event-nav-separator">/</span>
                            </>
                        )}
                        <span>{cityName}</span>
                    </nav>

                    <h1 className="hub-title">Events in {cityName}</h1>
                    <p className="hub-description">
                        Real-time monitoring of geopolitical events in {cityName}
                        {country ? `, ${country}` : ''} from the last 7 days.
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
                        </div>
                    )}
                </div>
            </header>

            <main className="hub-content">
                <div className="container">
                    {events.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🏙️</div>
                            <h2 className="empty-state-title">No Active Events</h2>
                            <p className="empty-state-text">
                                No geopolitical events have been detected in {cityName} in the last 7 days.
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
                                            <span>🕐 {getRelativeTime(event.lastUpdated)}</span>
                                            <span>📊 {event.eventCount} incident{event.eventCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    </Link>

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
