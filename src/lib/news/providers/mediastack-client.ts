import { Article, NewsProvider } from '../types';

const API_KEY = process.env.MEDIASTACK_API;
const BASE_URL = 'http://api.mediastack.com/v1/news'; // Note: HTTPS might be paid-only for Mediastack, using HTTP as per their free tier usually

interface MediastackResponse {
    pagination: any;
    data: Array<{
        author: string | null;
        title: string;
        description: string;
        url: string;
        source: string;
        image: string | null;
        category: string;
        language: string;
        country: string;
        published_at: string;
    }>;
}

export class MediastackClient implements NewsProvider {
    name = 'Mediastack';

    async fetchLatest(query: string): Promise<Article[]> {
        if (!API_KEY) {
            console.warn('Mediastack API key missing');
            return [];
        }

        try {
            const params = new URLSearchParams({
                access_key: API_KEY,
                keywords: query,
                limit: '10', // Low limit due to strict monthly quota (100/mo)
                languages: 'en,-de', // Defaulting to EN
            });

            const response = await fetch(`${BASE_URL}?${params}`);

            if (!response.ok) {
                console.error(`Mediastack API error: ${response.status}`);
                return [];
            }

            const data: MediastackResponse = await response.json();

            if (!data.data) return [];

            return data.data.map(item => ({
                url: item.url,
                title: item.title,
                publisher: item.source,
                publishedAt: item.published_at,
                language: item.language,
                apiSource: 'mediastack',
                snippet: item.description
            }));

        } catch (error) {
            console.error('Mediastack fetch error:', error);
            return [];
        }
    }
}
