import { Article, NewsProvider } from '../types';

const API_KEY = process.env.CURRENTS_API;
const BASE_URL = 'https://api.currentsapi.services/v1/search'; // Used search endpoint for query support

interface CurrentsResponse {
    status: string;
    news: Array<{
        id: string;
        title: string;
        description: string;
        url: string;
        author: string;
        image: string;
        language: string;
        category: string[];
        published: string;
    }>;
}

export class CurrentsClient implements NewsProvider {
    name = 'Currents API';

    async fetchLatest(query: string): Promise<Article[]> {
        if (!API_KEY) {
            console.warn('Currents API key missing');
            return [];
        }

        try {
            const params = new URLSearchParams({
                apiKey: API_KEY,
                keywords: query,
                language: 'en', // Currents mainly supports EN, others might be sparse
            });

            const response = await fetch(`${BASE_URL}?${params}`);

            if (!response.ok) {
                console.error(`Currents API error: ${response.status}`);
                return [];
            }

            const data: CurrentsResponse = await response.json();

            if (data.status !== 'ok') {
                return [];
            }

            return data.news.map(item => ({
                url: item.url,
                title: item.title,
                publisher: 'Currents/Unknown', // Currents often hides publisher main domain in 'author' or url
                publishedAt: item.published,
                language: item.language,
                apiSource: 'currents',
                snippet: item.description
            }));

        } catch (error) {
            console.error('Currents API fetch error:', error);
            return [];
        }
    }
}
