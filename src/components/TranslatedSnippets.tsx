'use client';

import { useState, useEffect } from 'react';

interface TranslatedSnippet {
    url: string;
    domain: string;
    original: string;
    danish: string;
    success: boolean;
    isRelevant: boolean;
}

interface Props {
    urls: string[];
    eventType: string;
    country: string;
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

export default function TranslatedSnippets({ urls, eventType, country }: Props) {
    const [snippets, setSnippets] = useState<TranslatedSnippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSnippets() {
            if (urls.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const urlsParam = urls.slice(0, 5).join(',');
                const params = new URLSearchParams({
                    urls: urlsParam,
                    country: country,
                    eventType: eventType
                });

                const response = await fetch(`/api/snippets?${params}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch snippets');
                }

                const data = await response.json();
                setSnippets(data.snippets || []);
            } catch (err) {
                console.error('Error fetching snippets:', err);
                setError('Kunne ikke hente artikeluddrag');
            } finally {
                setLoading(false);
            }
        }

        fetchSnippets();
    }, [urls, country, eventType]);

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.7 }}>
                <div style={{ marginBottom: '8px' }}>⏳ Henter og verificerer artikler...</div>
                <div style={{ fontSize: '12px' }}>Filtrerer relevante kilder for {country}</div>
            </div>
        );
    }

    if (snippets.length === 0) {
        return (
            <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                textAlign: 'center',
                opacity: 0.7
            }}>
                <div>📰 Ingen verificerede artikler fundet for {country}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Kilder er tilgængelige nedenfor
                </div>
            </div>
        );
    }

    return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {snippets.map((snippet, index) => (
                <li key={index} style={{
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    borderLeft: '3px solid rgba(34, 197, 94, 0.6)'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>
                            {snippet.domain}
                        </span>
                        <span style={{
                            fontSize: '11px',
                            marginLeft: '8px',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            padding: '2px 6px',
                            borderRadius: '3px'
                        }}>
                            verificeret ✓
                        </span>
                    </div>
                    <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.9)'
                    }}>
                        "{snippet.danish}"
                    </p>
                    <a
                        href={snippet.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        style={{
                            fontSize: '12px',
                            color: '#3b82f6',
                            textDecoration: 'none',
                            opacity: 0.8
                        }}
                    >
                        → Læs original artikel
                    </a>
                </li>
            ))}
        </ul>
    );
}
