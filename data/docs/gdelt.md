# GDELT Project API Documentation

## Overview
The GDELT Project monitors the world's broadcast, print, and web news in over 100 languages. We use the **GDELT 2.0 GeoJSON API** for signal detection.

**Documentation**: [https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/)

## Core Endpoint
`GET https://api.gdeltproject.org/api/v2/geo/geo`

## Parameters
- `query`: The search query (supports complex boolean operators).
  - Example: `(protest OR riot) country:DA` (Denmark)
- `mode`: `pointdata` (returns individual events) or `imagecollage` / `pointheatmap`.
- `format`: `geojson`, `html`, `json`.
- `timespan`: `15min`, `1h`, `24h`, `7d` (default `24h`).
- `maxpoints`: Maximum number of points to return (default usually varies, max 500-2000).

## Example Request
`https://api.gdeltproject.org/api/v2/geo/geo?query=country:DA&mode=pointdata&format=geojson&timespan=24h`

## Response Structure (GeoJSON)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [12.568, 55.676]
      },
      "properties": {
        "url": "https://...",
        "urlpubtimedte": "20231001T120000Z",
        "urlsocialimage": "https://...",
        "name": "Article Title...",
        "metatype": "1" // GDELT internal code
      }
    }
  ]
}
```

## Usage in GlobalWatch
Used as **Layer 2 (Signal Detection)**. Since GDELT is noisy and automated, events are treated as "Unverified Signals" until cross-referenced with the News Engine.
