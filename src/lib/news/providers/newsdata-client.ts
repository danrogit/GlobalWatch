import { Article, NewsProvider } from '../types';

const API_KEY = process.env.NEWSDATA_API;
const BASE_URL = 'https://newsdata.io/api/1/latest';

interface NewsDataResponse {
    status: string;
    totalResults: number;
    results: Array<{
        title: string;
        link: string;
        description: string;
        content: string;
        pubDate: string;
        image_url: string;
        source_id: string;
        source_priority: number;
        country: string[];
        category: string[];
        language: string;
    }>;
}

export class NewsDataClient implements NewsProvider {
    name = 'NewsData.io';

    async fetchLatest(query: string): Promise<Article[]> {
        if (!API_KEY) {
            console.warn('NewsData API key missing');
            return [];
        }

        try {
            const params = new URLSearchParams({
                apikey: API_KEY,
                q: query,
                language: 'da,en', // Prioritize Danish, fallback to English
            });

            const response = await fetch(`${BASE_URL}?${params}`);

            if (!response.ok) {
                console.error(`NewsData API error: ${response.status}`);
                return [];
            }

            const data: NewsDataResponse = await response.json();

            if (data.status !== 'success') {
                return [];
            }

            return data.results.map(item => ({
                url: item.link,
                title: item.title,
                publisher: item.source_id,
                publishedAt: item.pubDate,
                language: item.language,
                apiSource: 'newsdata',
                snippet: item.description || (item.content ? item.content.substring(0, 200) : '')
            }));

        } catch (error) {
            console.error('NewsData fetch error:', error);
            return [];
        }
    }
}
