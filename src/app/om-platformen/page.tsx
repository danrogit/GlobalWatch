import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="about-page" style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            color: '#e8e8f0',
            fontFamily: 'var(--font-sans)',
            paddingTop: '80px',
            paddingBottom: '60px'
        }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
                <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '800',
                        marginBottom: '16px',
                        background: 'linear-gradient(135deg, #fff 0%, #a0a0b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        About GlobalWatch
                    </h1>
                    <p style={{ fontSize: '18px', color: '#a0a0b8', lineHeight: '1.6' }}>
                        An open-source intelligence tool for monitoring geopolitical tensions and conflicts in near real time.
                    </p>
                </header>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
                            Mission
                        </h2>
                        <p style={{ color: '#a0a0b8', lineHeight: '1.7', fontSize: '16px' }}>
                            GlobalWatch helps make geopolitical risk monitoring more accessible by combining public data,
                            automated event detection, and source checks into a live situational overview.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>
                            How The Technology Works
                        </h2>

                        <div style={{
                            display: 'grid',
                            gap: '24px',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '32px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>1.</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>Signal Detection</h3>
                                    <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: '1.6' }}>
                                        The platform scans public event signals from the GDELT Project to identify potential geopolitical events.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>2.</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>Multi-Source Verification</h3>
                                    <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: '1.6' }}>
                                        Detected signals can be cross-checked against global news sources and supporting data before being displayed.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>3.</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>Objective Classification</h3>
                                    <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: '1.6' }}>
                                        Events are grouped into categories such as conflict, diplomacy, sanctions, and protests using event metadata.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
                            Data Sources
                        </h2>
                        <ul style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '12px',
                            listStyle: 'none'
                        }}>
                            {[
                                'ACLED (Armed Conflict Location & Event Data)',
                                'GDELT Project',
                                'NewsData.io',
                                'GNews API',
                                'WorldNewsAPI',
                                'Mediastack',
                                'Currents API'
                            ].map((source, i) => (
                                <li key={i} style={{
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#e8e8f0',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {source}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>

                <footer style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <Link href="/" style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        background: '#4f8fff',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontSize: '14px'
                    }}>
                        Back to Map
                    </Link>
                    <p style={{ marginTop: '24px', fontSize: '12px', color: '#6a6a88' }}>
                        Copyright {new Date().getFullYear()} GlobalWatch. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
}
