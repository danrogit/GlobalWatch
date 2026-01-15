# GlobalWatch - Situational Awareness Globe

A real-time 3D globe visualization of global geopolitical events, powered by GDELT data.

![GlobalWatch](https://img.shields.io/badge/Status-MVP-green)
![Next.js](https://img.shields.io/badge/Next.js-15-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.160-purple)

## 🌍 Overview

GlobalWatch provides automated situational awareness by displaying geopolitical events on an interactive 3D globe. Events from the last 7 days are shown as color-coded dots based on severity.

**Key Features:**
- Full-screen interactive 3D globe with smooth rotation
- Real-time event data from GDELT (updates every 15 minutes)
- Color-coded severity: Yellow (low), Orange (medium), Red (high)
- Click-to-navigate event pages with full details
- SEO-optimized country and city hub pages
- Ad-ready with placeholder slots

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the globe.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── events/          # Event API endpoints
│   ├── event/[slug]/        # Dynamic event pages
│   ├── country/[country]/   # Country hub pages
│   ├── city/[city]/         # City hub pages
│   ├── layout.tsx           # Root layout with SEO
│   ├── page.tsx             # Homepage with globe
│   └── globals.css          # Global styles
├── components/
│   ├── Globe/Globe.tsx      # Three.js 3D globe
│   ├── Footer.tsx           # Site footer
│   └── AdSlot.tsx           # Ad placeholder
└── lib/
    ├── gdelt/
    │   ├── types.ts         # TypeScript types & CAMEO codes
    │   ├── fetcher.ts       # GDELT data fetching
    │   ├── clusterer.ts     # Event clustering algorithm
    │   └── store.ts         # In-memory event store
    └── content/
        └── generator.ts     # Event description templates
```

## 📊 Data Flow

```
GDELT masterfilelist.txt
        │
        ▼
  Download CSVs (15-min exports)
        │
        ▼
  Filter geopolitical events
  (CAMEO codes: 14x, 17x, 18x, 19x, 20x)
        │
        ▼
  Cluster by location (~25km radius)
  and time window (3 hours)
        │
        ▼
  Calculate severity score
        │
        ▼
  Store in memory + disk cache
        │
        ▼
  Serve via /api/events
```

## 🎨 Severity Scoring

Events are scored based on:
- **Event Type Weight**: Violence (10) → Protests (3)
- **Cluster Size**: More incidents = higher severity
- **Tone Score**: Negative tone increases severity

| Score | Level   | Color  |
|-------|---------|--------|
| < 10  | Low     | Yellow |
| 10-25 | Medium  | Orange |
| > 25  | High    | Red    |

## 🔧 Configuration

### Environment Variables

```env
# No required environment variables for MVP
# Future: Add for production caching, analytics, etc.
```

### GDELT Data Refresh

Data is refreshed automatically when the API is called if cache is stale (>1 hour). For production, set up a cron job:

```bash
# Refresh data every 15 minutes
*/15 * * * * curl http://localhost:3000/api/events
```

## 📈 SEO Features

- **Unique Title & Meta**: Each event page has dynamic metadata
- **JSON-LD Schema**: NewsArticle + Event schema for rich snippets
- **Canonical URLs**: Proper canonical tags on all pages
- **Country/City Hubs**: Indexable hub pages for long-tail SEO

## 💰 Monetization

Ad slots are pre-configured on:
- Event pages (inline + sidebar)
- Country hub pages (inline)
- City hub pages (inline)

**No ads on the homepage globe.**

Replace placeholder with AdSense code in `src/components/AdSlot.tsx`.

## ⚠️ Disclaimer

This platform provides automated situational awareness based on publicly available data from the GDELT Project. It does not constitute news reporting, analysis, or official information.

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Credits

- **Data**: [GDELT Project](https://www.gdeltproject.org/)
- **3D Globe**: [Three.js](https://threejs.org/)
- **Framework**: [Next.js](https://nextjs.org/)
