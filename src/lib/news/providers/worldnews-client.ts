import { Article, NewsProvider } from '../types';

const API_KEY = process.env.WORLDNEWS_API;
const BASE_URL = 'https://api.worldnewsapi.com/search-news';

interface WorldNewsResponse {
    status: string;
    total_results: number;
    news: Array<{
        id: number;
        title: string;
        text: string;
        summary: string;
        url: string;
        image: string;
        video: string;
        publish_date: string;
        author: string;
        authors: string[];
        language: string;
        source_country: string;
        sentiment: number;
    }>;
}

export class WorldNewsClient implements NewsProvider {
    name = 'WorldNewsAPI';

    async fetchLatest(query: string): Promise<Article[]> {
        if (!API_KEY) {
            console.warn('WorldNews API key missing');
            return [];
        }

        try {
            const params = new URLSearchParams({
                'api-key': API_KEY, // Query param based on docs/common usage
                text: query, // 'text' searches title and body
                language: 'en',
                number: '5', // Conservative limit due to points system
            });

            const response = await fetch(`${BASE_URL}?${params}`);

            if (!response.ok) {
                console.error(`WorldNewsAPI error: ${response.status}`);
                return [];
            }

            const data: WorldNewsResponse = await response.json();

            // WorldNewsAPI returns { news: [...] } usually
            if (!data.news) return [];

            return data.news.map(item => ({
                url: item.url,
                title: item.title,
                publisher: new URL(item.url).hostname.replace('www.', ''), // Extract domain as publisher
                publishedAt: item.publish_date,
                language: item.language,
                apiSource: 'worldnewsapi',
                snippet: item.summary || item.text?.substring(0, 200)
            }));

        } catch (error) {
            console.error('WorldNewsAPI fetch error:', error);
            return [];
        }
    }
}
