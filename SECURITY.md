# Security Policy

## Reporting Security Issues

If you find a security issue, please do not open a public issue with exploit details.

Contact the maintainers privately using the security contact listed on the repository, or create a private advisory if the project is hosted on GitHub.

## Secrets And Credentials

Never commit:

- `.env`
- API keys
- ACLED credentials
- OAuth tokens
- `token.json`
- SQLite database files
- generated logs
- provider export files that contain restricted data

This repository includes `.env.example` as the only environment file that should be committed.

## Before Publishing Publicly

Before making a fork or repository public:

1. Confirm `git status --short` does not show credential files staged for commit.
2. Search for secrets with your preferred scanner.
3. Rotate any credentials that were ever committed to local history.
4. Review provider terms for data redistribution, attribution, and caching rules.

If real credentials were committed in the past, deleting the file in a later commit is not enough. Treat those credentials as exposed and rotate them.

## Data Integrity

GlobalWatch is built on public signals and automated processing. False positives, bad locations, duplicated events, and delayed updates can happen. Do not use the app as an emergency alerting system or as the sole basis for high-stakes decisions.
