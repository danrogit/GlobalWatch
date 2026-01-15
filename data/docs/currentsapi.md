# Currents API Documentation

## Overview
Currents API provides latest news from 15+ languages and 50+ countries.

## Rate Limits & Quotas (CRITICAL)
- **Monthly Limit**: 600 requests/month.
- **Daily Average**: ~20 requests/day.
- **Rate Limit**: 1 request every 2 hours (recommended average, though burst is allowed).

> [!WARNING]
> **Extremely Low Quota**. Do not use for high-frequency polling.
> Only use for **targeted verification** of high-priority signals or **one single daily sweep**.

## Authentication
**API Key**: (See .env)
**Parameter**: `apiKey`

## Base URL
`https://api.currentsapi.services/v1/`

## Endpoints

### 1. Latest News
`GET /latest-news`

**Parameters:**
- `apiKey`: Your API Key.
- `language`: `en` (others available).
- `keywords`: Search term.
- `type`: `1` (news), `2` (article), `3` (discussion).

**Example:**
```
https://api.currentsapi.services/v1/latest-news?language=en&apiKey=YOUR_KEY
```

## Usage in GlobalWatch
**Strictly Limited**. 
Prioritize for verification of events where other APIs fail.