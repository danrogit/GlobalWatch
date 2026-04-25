# Requirements

This project is primarily a Node.js and Next.js application, with optional Python tooling for LibreTranslate in the Docker/start script path.

## Required For Local Development

- Node.js 22 or newer
- npm 10 or newer
- Git
- A modern browser with WebGL support
- Windows, macOS, or Linux

Recommended:

- At least 8 GB RAM
- A stable internet connection for map tiles, public data fetching, and package installation

## Required Node Dependencies

Install JavaScript dependencies from `package-lock.json`:

```bash
npm install
```

Important runtime packages include:

- Next.js and React
- Three.js for the 3D globe
- MapLibre / react-map-gl for the Denmark map
- better-sqlite3 for local SQLite storage
- csv-parse, cheerio, jsdom, and article extraction utilities for ingestion/enrichment scripts

## Optional Python Dependency

The production `start.sh` currently starts LibreTranslate. If you use that path outside Docker, install Python dependencies with:

```bash
pip install -r requirements.txt
```

Docker installs these dependencies inside the container.

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in only the providers you plan to use:

```env
ACLED_EMAIL=
ACLED_PASSWORD=
NEWSDATA_API=
CURRENTS_API=
GNEWS_API=
MEDIASTACK_API=
WORLDNEWS_API=
SEARXNG_URL=http://localhost:8888
```

The app can render from cached public data without all providers configured, but ingestion and enrichment scripts may require specific keys.

## Data Files

Useful local data paths:

- `data/events.json`: cached event store used by the app fallback path
- `data/globalwatch.db`: local generated SQLite database
- `data/cache/`: generated cache files

Generated databases, logs, credentials, and tokens should not be committed.

## Build Requirements

Run:

```bash
npm run build
```

If `better-sqlite3` fails after switching Node versions:

```bash
npm rebuild better-sqlite3
```

## Browser Requirements

The main dashboard uses WebGL through Three.js. The globe works best in recent versions of:

- Chrome
- Edge
- Firefox
- Safari

Hardware acceleration should be enabled for smooth globe rendering.
