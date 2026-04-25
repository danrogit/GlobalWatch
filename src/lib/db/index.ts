import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'globalwatch.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);
// db.pragma('journal_mode = WAL'); // Better concurrency

let isInitialized = false;

export interface RssArticleRow {
    id: string;
    title: string;
    description: string;
    url: string;
    source_name: string;
    source_url: string;
    published_at: string;
    language: string;
    feed_url: string;
    tags: string; // JSON string array
    country_mentions: string; // JSON string array
    geopolitics_score: number;
    fetched_at: string;
}

export interface GeoEventRow {
    event_id: string;
    title: string;
    summary: string;
    category: string;
    subcategory: string;
    countries: string; // JSON string array
    event_date: string;
    detected_at: string;
    source_count: number;
    verification_status: 'bekræftet' | 'rapporteret' | 'ubekraeftet';
    confidence_score: number;
    json_data: string; // Store full object for flexibility
}

export interface FeedRow {
    url: string;
    source_name: string;
    source_type: 'state' | 'major_media' | 'local' | 'tabloid' | 'social';
    trust_weight: number;
    default_language: string;
    last_fetched: string;
    error_count: number;
}

export function initDatabase() {
    if (isInitialized) {
        return;
    }

    console.log('[DB] Initializing database at', DB_PATH);

    // 1️⃣ Feeds Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS feeds (
            url TEXT PRIMARY KEY,
            source_name TEXT,
            source_type TEXT DEFAULT 'local',
            trust_weight REAL DEFAULT 0.5,
            default_language TEXT DEFAULT 'en',
            last_fetched TEXT,
            error_count INTEGER DEFAULT 0
        )
    `);

    // 2️⃣ Raw RSS Articles
    db.exec(`
        CREATE TABLE IF NOT EXISTS rss_articles (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            url TEXT UNIQUE,
            source_name TEXT,
            source_url TEXT,
            published_at TEXT,
            language TEXT,
            feed_url TEXT,
            tags TEXT,
            country_mentions TEXT,
            geopolitics_score INTEGER DEFAULT 0,
            fetched_at TEXT
        )
    `);

    // 2.5️⃣ Enriched Articles (with location data)
    db.exec(`
        CREATE TABLE IF NOT EXISTS enriched_articles (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            url TEXT UNIQUE,
            feed_name TEXT,
            published_at TEXT,
            lat REAL,
            lon REAL,
            location_label TEXT,
            location_confidence REAL,
            location_source TEXT,
            event_type TEXT,
            image_url TEXT,
            quotes TEXT,
            article_content TEXT,
            event_generated INTEGER DEFAULT 0,
            created_at TEXT
        )
    `);

    // 3️⃣ Geopolitical Events
    db.exec(`
        CREATE TABLE IF NOT EXISTS geo_events (
            event_id TEXT PRIMARY KEY,
            title TEXT,
            summary TEXT,
            category TEXT,
            subcategory TEXT,
            countries TEXT,
            event_date TEXT,
            detected_at TEXT,
            source_count INTEGER,
            verification_status TEXT,
            confidence_score REAL,
            json_data TEXT,
            normalized_title TEXT
        )
    `);

    // Add column if missing (migration support)
    try {
        db.exec('ALTER TABLE geo_events ADD COLUMN normalized_title TEXT');
    } catch {
        // Column already exists
    }

    isInitialized = true;
    console.log('[DB] Schema initialized.');
}

initDatabase();
