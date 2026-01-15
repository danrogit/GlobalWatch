# ACLED API Documentation

## Overview
The Armed Conflict Location & Event Data Project (ACLED) API provides real-time data on conflicts and protests.

**Documentation URL**: [https://acleddata.com/api-documentation/](https://acleddata.com/api-documentation/)

## Core Endpoint
`GET https://acleddata.com/api/acled/read`

## Authentication
Requires `key` and `email` parameters, or valid Terms of Service acceptance for specific tiers.

## Parameters
- `key`: Your API key.
- `email`: Registered email address.
- `iso`: Filter by country ISO code (e.g., `208` for Denmark).
- `limit`: Number of results (default 500).
- `event_date`: Specific date.
- `event_date_where`: Operator (e.g., `>`, `<`).
- `fields`: Specific fields to retrieve (e.g., `iso|actor1|event_date`).

## Response Structure (JSON)
```json
{
  "status": 200,
  "success": true,
  "count": 50,
  "data": [
    {
      "data_id": "12345",
      "iso": "208",
      "event_id_cnty": "DEN123",
      "event_id_no_cnty": "123",
      "event_date": "2023-10-01",
      "year": 2023,
      "time_precision": 1,
      "event_type": "Protests",
      "sub_event_type": "Peaceful protest",
      "actor1": "Protesters (Denmark)",
      "assoc_actor_1": "Climate Activists",
      "region": "Europe",
      "country": "Denmark",
      "admin1": "Hovedstaden",
      "location": "Copenhagen",
      "latitude": "55.6761",
      "longitude": "12.5683",
      "notes": "People protested...",
      "fatalities": 0
    }
  ]
}
```

## Attribution
Must cite ACLED.
