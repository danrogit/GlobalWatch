# Mediastack API Documentation

## Overview
Mediastack offers live news data from worldwide sources.

## Rate Limits & Quotas (CRITICAL)
- **Monthly Limit**: 100 requests/month.
- **Daily Average**: ~3 requests/day.

> [!CAUTION]
> **Severe Quota Limit (3 calls/day)**.
> This API is effectively "Emergency Use Only" or for extremely targeted checks.
> **DO NOT** include in frequent daily sweeps unless strictly managed.

## Authentication
**API Key**: (See .env)
**Parameter**: `access_key`

## Base URL
`http://api.mediastack.com/v1/`

## Endpoints

### 1. Live News
`GET /news`

**Parameters:**
- `access_key`: Your API key.
- `keywords`: Search keywords.
- `countries`: `us` (United States), `dk` (Denmark), etc.
- `languages`: `en`.
- `limit`: Result limit (max 100).

**Example:**
```
http://api.mediastack.com/v1/news?access_key=YOUR_KEY&keywords=virus
```

## Usage in GlobalWatch
**Restricted**. 
Excluded from standard loops. Only called manually or for specific "Deep Search" tasks if needed.