# GNews API Documentation

## Overview
GNews API is a REST API service to search articles from over 80,000 worldwide sources. It provides access to real-time news and historical data, as well as top headlines based on Google News rankings.

## Quick Start
1. [Sign up for free](https://gnews.io/register) (100 requests/day).
2. API Key is available in the [dashboard](https://gnews.io/dashboard).

## Base URL
`https://gnews.io/api/v4/`

## Endpoints

### 1. Search Endpoint
`GET /search`
Find specific news stories with advanced filtering options.

**Parameters:**
- `q`: Keywords or phrases to search for.
- `lang`: Language code (e.g. `en`, `es`).
- `country`: Country code (e.g. `us`, `au`).
- `max`: Number of results (default 10, max 100).
- `in`: Attributes to search in (`title`, `description`, `content`).
- `nullable`: Attributes that can be null (`title`, `description`, `content`).
- `from`: Start date (ISO 8601).
- `to`: End date (ISO 8601).
- `sortby`: `publishedAt` (default) or `relevance`.
- `apikey`: Your API key.

**Example:**
```
https://gnews.io/api/v4/search?q=example&lang=en&country=us&max=10&apikey=YOUR_API_KEY
```

### 2. Top Headlines Endpoint
`GET /top-headlines`
Get trending articles based on Google News rankings.

**Parameters:**
- `category`: `general`, `nworld`, `nation`, `business`, `technology`, `entertainment`, `sports`, `science`, `health`.
- `lang`: Language code.
- `country`: Country code.
- `max`: Number of results.
- `apikey`: Your API key.

**Example:**
```
https://gnews.io/api/v4/top-headlines?category=technology&lang=en&country=us&max=10&apikey=YOUR_API_KEY
```

## Attribution
Backlink required for free plan.