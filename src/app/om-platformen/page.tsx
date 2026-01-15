
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

                {/* Header */}
                <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '800',
                        marginBottom: '16px',
                        background: 'linear-gradient(135deg, #fff 0%, #a0a0b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Om GlobalWatch
                    </h1>
                    <p style={{ fontSize: '18px', color: '#a0a0b8', lineHeight: '1.6' }}>
                        Et avanceret open-source efterretningsværktøj (OSINT) til overvågning af <br />
                        geopolitiske spændinger og konflikter i realtid.
                    </p>
                </header>

                {/* Main Content */}
                <main style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Mission */}
                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
                            🌍 Vores Mission
                        </h2>
                        <p style={{ color: '#a0a0b8', lineHeight: '1.7', fontSize: '16px' }}>
                            GlobalWatch har til formål at demokratisere adgangen til geopolitisk risikovurdering.
                            I en tid med fake news og informationskrig, leverer vi et objektivt, data-drevet billede
                            af verdens konflikter ved at kombinere avancerede algoritmer med streng kildekritik.
                        </p>
                    </section>

                    {/* How It Works */}
                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>
                            ⚙️ Sådan fungerer teknologien
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
                                <span style={{ fontSize: '24px' }}>📡</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>1. Signal Detektion</h3>
                                    <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: '1.6' }}>
                                        Platformen scanner konstant millioner af datapunkter fra <strong>GDELT Project</strong> (Global Database of Events, Language, and Tone) for at identificere potentielle hændelser.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>🔍</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>2. Multi-Source Verificering</h3>
                                    <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: '1.6' }}>
                                        Når et signal opfanges, krydsrefererer vores motor det øjeblikkeligt med globale nyhedsbureauer (Reuters, AP, BBC) via 5 uafhængige API'er.
                                        Kun hændelser bekræftet af mindst <strong>2 uafhængige kilder</strong> får status som "Verificeret".
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>🛡️</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>3. Objektiv Klassificering</h3>
                                    <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: '1.6' }}>
                                        Hændelser inddeles automatisk i kategorier som "Konflikt", "Diplomati" eller "Sanktioner" uden politisk bias, baseret på faktiske hændelseskoder.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Data Sources */}
                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
                            📊 Datakilder
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

                {/* Footer */}
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
                        Tilbage til Kortet
                    </Link>
                    <p style={{ marginTop: '24px', fontSize: '12px', color: '#6a6a88' }}>
                        © {new Date().getFullYear()} GlobalWatch. Alle rettigheder forbeholdes.
                    </p>
                </footer>

            </div>
        </div>
    );
}
