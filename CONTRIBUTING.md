# Contributing to GlobalWatch

Thanks for helping improve GlobalWatch.

This project sits at the intersection of maps, public data, news metadata, and OSINT-style verification. Contributions should bias toward clarity, source transparency, and reducing false positives.

## Development Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

For production checks:

```bash
npm run build
npm run lint
```

The current codebase may still have existing lint debt. If your change touches linted code, please avoid adding new lint errors.

## Good First Contributions

- Improve documentation and setup notes.
- Add screenshots or a short demo video.
- Improve event cards and source attribution.
- Add tests or fixtures for geocoding, clustering, and event normalization.
- Improve accessibility labels and keyboard support.
- Reduce false positives in event classification.
- Add provider-specific ingestion docs.

## Pull Request Guidelines

- Keep changes focused and explain the user-facing effect.
- Include before/after screenshots for UI changes when useful.
- Do not commit `.env`, `token.json`, local database files, cache files, or logs.
- Mention which commands you ran, especially `npm run build`.
- Add or update docs when behavior changes.

## Data And Source Quality

GlobalWatch handles public event signals that may be noisy. When changing ingestion, verification, or display logic, please preserve source links and avoid presenting automated signals as confirmed facts unless the data supports that status.

## Code Style

- Use TypeScript for app code.
- Prefer existing project patterns over new dependencies.
- Keep UI copy in English.
- Keep comments short and useful.
