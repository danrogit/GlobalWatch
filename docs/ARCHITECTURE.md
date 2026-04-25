# GlobalWatch Architecture

This document explains the main moving parts in GlobalWatch.

## System Overview

GlobalWatch is a Next.js application with a local data-processing layer.

```text
Public sources
  -> ingestion scripts
  -> enrichment, geocoding, verification, clustering
  -> SQLite and JSON cache
  -> Next.js API routes
  -> globe, maps, event pages, and list views
```

## Data Sources

The codebase includes clients or scripts for:

- GDELT
- ACLED
- RSS feeds
- NewsData.io
- GNews
- Mediastack
- WorldNewsAPI
- Currents API
- SearXNG

Not every provider is required for a local demo. Some scripts need API keys and provider-specific credentials.

## Storage

GlobalWatch currently uses two local storage paths:

- `data/globalwatch.db`: SQLite database for RSS articles, enriched articles, and generated geo events.
- `data/events.json`: JSON event cache used by the GDELT store and as a fallback for the public event API.

Generated databases and caches should not be committed unless they are intentionally small, public, and license-safe.

## Event API

The homepage calls:

```text
/api/events?days=7
```

The API route normalizes data into a shared event shape for the UI. It first reads SQLite `geo_events`. If SQLite returns no rows, it falls back to the JSON event store so a new clone can still render events.

Individual event lookups use the same normalized loader:

```text
/api/events/[slug]
/event/[slug]
```

## Frontend

Main UI surfaces:

- `src/app/page.tsx`: dashboard shell, view toggle, pause/play control, event fetching.
- `src/components/Globe/Globe.tsx`: Three.js globe, labels, rotation, markers, tooltips.
- `src/components/DenmarkMap/DenmarkMap.tsx`: MapLibre Denmark view.
- `src/components/Sidebar/Sidebar.tsx`: event list, verification summary, status badges.
- `src/app/event/[slug]/page.tsx`: event details, source links, context, map location.

## Verification Status

Events are displayed as:

- `VERIFIED`: strong supporting signal or explicit verification source.
- `REPORTED`: reported by public sources but still developing.
- `UNVERIFIED`: low-confidence signal or insufficient source support.

The app should always preserve source URLs and avoid implying certainty when the underlying source does not support it.

## Background Work

Operational scripts live in `scripts/`.

Common categories:

- database initialization and migrations
- RSS import
- event generation
- enrichment
- data refresh and scheduled workers
- diagnostics and quality checks

Before running a script, inspect whether it requires `.env` values or writes to `data/globalwatch.db`.

## Deployment Notes

The Dockerfile builds the Next.js application and installs dependencies needed for LibreTranslate.

`start.sh` starts:

1. LibreTranslate
2. the cron worker
3. the Next.js production server

For managed platforms, you may want to split these into separate services instead of one container process tree.
