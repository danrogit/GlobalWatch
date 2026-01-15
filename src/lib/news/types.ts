export type VerificationStatus = 'VERIFIED' | 'REPORTED' | 'UNVERIFIED';

export interface NewsSource {
    id: string; // e.g., 'reuters', 'bbc'
    name: string;
    domain: string;
    reliabilityScore: number; // 1-10
}

export interface Article {
    url: string;
    title: string;
    publisher: string; // domain
    publishedAt: string;
    language: string;
    apiSource: string; // 'newsdata', 'gnews', etc.
    snippet?: string;
}

export interface UnifiedEvent {
    id: string;
    title: string;
    summary: string; // Computed or taken from best article
    country: string;
    location: { lat: number, lon: number };
    category: string;

    // Verification Data
    status: VerificationStatus;
    articles: Article[];
    sources: string[]; // List of unique publishers

    firstDetectedAt: string;
    lastUpdatedAt: string;

    // Visual Indicator
    dotColor?: 'red' | 'orange' | 'green' | 'blue';
}

export interface NewsProvider {
    name: string;
    fetchLatest(query: string): Promise<Article[]>;
}
