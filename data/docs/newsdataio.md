# NewsData.io API Documentation

## Overview
NewsData.io provides news data from thousands of sources.

## Rate Limits & Quotas
- **Daily Limit**: 200 requests/day.
- **Credits**: 200 credits/day.
- **Per Request**: Up to 10 articles.

## Authentication
**API Key**: (See .env)
**Parameter**: `apikey`

## Base URL
`https://newsdata.io/api/1/`

## Endpoints

### 1. Latest News
`GET /latest`
Get latest news articles.

**Parameters:**
- `apikey`: Your API key.
- `q`: Search query.
- `country`: Country code (e.g., `United States` (us), `Denmark` (dk)).
- `language`: Language code (e.g., `da`, `en`).
- `category`: `politics`, `business`, `technology`, etc.

**Example:**
```
https://newsdata.io/api/1/latest?apikey=YOUR_KEY&q=denmark&language=en
```

## Usage in GlobalWatch
Used for broad daily sweeps and targeted verification. 
**Usage Status**: High capacity (relative to others). Safe for daily sweeps.