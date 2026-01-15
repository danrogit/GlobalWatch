import { Article, NewsProvider } from '../types';

const API_KEY = process.env.GNEWS_API;
const BASE_URL = 'https://gnews.io/api/v4/search';

interface GNewsResponse {
    totalArticles: number;
    articles: Array<{
        title: string;
        description: string;
        content: string;
        url: string;
        image: string;
        publishedAt: string;
        source: {
            name: string;
            url: string;
        };
    }>;
}

export class GNewsClient implements NewsProvider {
    name = 'GNews';

    async fetchLatest(query: string): Promise<Article[]> {
        if (!API_KEY) {
            console.warn('GNews API key missing');
            return [];
        }

        try {
            const params = new URLSearchParams({
                token: API_KEY, // GNews uses 'token' or 'apikey' generally, docs say token usually
                q: query,
                lang: 'en', // Can be set to 'da' if supported, defaulting to en for breadth
            });

            // Note: GNews docs say `token`. User file said `token: ...`. 
            // Checking standard: often `apikey` works too. I'll use `token` as per likely docs.
            const response = await fetch(`${BASE_URL}?${params}`);

            if (!response.ok) {
                console.error(`GNews API error: ${response.status}`);
                return [];
            }

            const data: GNewsResponse = await response.json();

            if (!data.articles) return [];

            return data.articles.map(item => ({
                url: item.url,
                title: item.title,
                publisher: item.source.name,
                publishedAt: item.publishedAt,
                language: 'en', // GNews search param decides this, assumed en
                apiSource: 'gnews',
                snippet: item.description
            }));

        } catch (error) {
            console.error('GNews fetch error:', error);
            return [];
        }
    }
}
