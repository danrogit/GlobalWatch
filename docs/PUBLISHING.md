# Publishing Checklist

Use this checklist before sharing GlobalWatch as a public open-source repository.

## Required

- [ ] Rotate any credentials that were ever committed or shared.
- [ ] Confirm `.env` is ignored and not staged.
- [ ] Confirm `token.json` is ignored and not staged.
- [ ] Confirm generated database files are ignored and not staged.
- [ ] Confirm logs are ignored and not staged.
- [ ] Review provider terms for data redistribution and attribution.
- [ ] Add screenshots or a demo video if you want a stronger first impression.
- [ ] Replace placeholder repository URLs after creating the remote repo.
- [ ] Run `npm run build`.

## Suggested GitHub Repository Settings

- Add topics: `osint`, `geopolitics`, `gdelt`, `nextjs`, `threejs`, `maplibre`, `situational-awareness`.
- Enable Dependabot alerts.
- Enable secret scanning if available.
- Add branch protection for `main`.
- Add a short repository description:

```text
Open-source geopolitical situational awareness dashboard with a 3D globe, event clustering, and public-source signal monitoring.
```

## First Release Notes

Suggested release title:

```text
GlobalWatch initial open-source release
```

Suggested release summary:

```text
Initial public release of GlobalWatch, a Next.js and Three.js dashboard for exploring public geopolitical event signals on an interactive globe.
```
