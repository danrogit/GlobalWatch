# World News API Documentation

## Info
- [Terms & Conditions](https://worldnewsapi.com/terms)
- [Discord](https://discord.gg/GrmNknKHYD)
- [About](https://worldnewsapi.com/about)

## API Resources
- [Full Documentation](https://worldnewsapi.com/docs)
- [Uptime Status](http://status.worldnewsapi.com/)
- [SDKs](https://worldnewsapi.com/sdks)

## Getting Started
1. Sign up for a [free API key](https://worldnewsapi.com/console/).
2. Pick a function such as [Search News](https://worldnewsapi.com/docs/search-news/).

## Pricing (Free Tier)
- $0 /mo
- 50 points/day
- 1 request/s
- 1 concurrent request
- 1 month history
- Backlink Required

## API Endpoints
Base URL: `https://api.worldnewsapi.com`

### Search News
GET `/search-news`
Parameters:
- `text`: The text to search for.
- `source-countries`: ISO 3166-1 alpha-2 country code.
- `language`: ISO 639-1 language code.
- `min-sentiment`: Minimal sentiment of the news code (-1 to 1).
- `max-sentiment`: Maximal sentiment of the news code (-1 to 1).
- `earliest-publish-date`: Date string.
- `latest-publish-date`: Date string.
- `news-sources`: Comma separated list of news sources.
- `authors`: Comma separated list of authors.
- `entities`: Comma separated list of entities (PER, LOC, ORG).
- `location-filter`: Filter by location (minLat, minLng, maxLat, maxLng).
- `sort`: Sort by publish-time, sentiment, or match-score.
- `sort-direction`: asc or desc.
- `offset`: Offset for pagination.
- `number`: Number of results (1-100).

Example Code (JS):
```javascript
const response = await fetch('https://api.worldnewsapi.com/search-news?text=tesla&api-key=YOUR_API_KEY');
const data = await response.json();
```