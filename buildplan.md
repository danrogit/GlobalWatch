Objective

Build a public, SEO-friendly web platform that aggregates global geopolitics and meaningful news events (not only military conflicts), shows them by country/location, and marks events as Verified / Reported / Unverified based on independent source confirmation.

The platform must prioritize accuracy over speed, use only free or open data sources, and remain legally compliant for an ad-supported public website.

1️⃣ Core Philosophy (MANDATORY)

Detection ≠ Verification

APIs are collectors, not truth sources

Verification is based on independent publishers, not number of APIs

Never generate or invent summaries

Never claim facts without source links

2️⃣ Data Sources
A) Early-warning detector

Use GDELT Project as a signal detector only

GDELT is used to:

detect potential events

identify rough topic + country

trigger article collection

GDELT classifications must never be trusted blindly

B) News collection (free tiers only)

Use multiple APIs in parallel as article collectors:

NewsData.io

GNews

Currents API

Mediastack

WorldNewsAPI

(Optional) NewsAPI.ai

Rules:

Treat all APIs equally

Do NOT count APIs as independent confirmation

Extract only:

title

URL

publisher/domain

timestamp

language

short description/snippet (if allowed)

C) Direct trusted publishers (high confidence)

Track known, reputable publishers explicitly:

dr.dk

tv2.dk

reuters.com

bbc.co.uk

aljazeera.com

apnews.com

afp.com

These sources increase confidence, but still require corroboration.

3️⃣ Event Clustering & Deduplication (CRITICAL)
Article normalization

For each article:

Normalize URL (strip tracking params)

Extract publisher domain

Normalize title + snippet

Detect country/location

Translate text to Danish (optional, for UI only)

Clustering rules

Group articles into a single “event” if:

Same country or city

Same 24–48h time window

High semantic similarity

Same physical or political action

Multiple articles from the same publisher count as one source.

4️⃣ Verification Logic (NON-NEGOTIABLE)
🟢 VERIFIED

An event is Verified if:

≥ 2 independent publishers

Same event, same location, same timeframe

At least one is a tier-1 outlet for sensitive events (violence, coups)

🟡 REPORTED

Only 1 independent publisher

Or multiple articles but same wire source

Or still developing / unclear

🔴 UNVERIFIED SIGNAL

GDELT-only

Vague language

Conflicting descriptions

Metaphorical wording

5️⃣ Semantic Hard Filters (NO AI GUESSING)
Allowlist (must include at least one for violent events):

attack

clashes

explosion

gunfire

airstrike

troops

soldiers

police fired

killed

wounded

Blocklist (auto-reject as violence):

“battle with illness”

disease

cancer

anemia

tuberculosis

metaphorical “battle”

If blocklist hits → downgrade to non-violent category or reject.

6️⃣ Covered Categories (NOT only war)

The platform must cover:

Military conflict

Protests & unrest

Elections

Sanctions

Diplomacy

International incidents

Government actions

Major legislation

Border disputes

State-level crises

Each event must have:

country

category

timestamp

verification status

source list


8️⃣ Legal & Compliance Rules (STRICT)

Never republish full article text

Never bypass paywalls

Always link to original sources

Respect robots.txt

Ads are allowed

Do NOT redistribute raw API data

Do NOT provide bulk downloads

9️⃣ Architecture Expectations

Source-agnostic ingestion pipeline

Easy to disable/remove an API

Clear separation:

detection

collection

clustering

verification

presentation

10️⃣ Success Criteria

The system is successful if:

False positives like “battle with illness” are eliminated

Events show real multi-source verification

Users can clearly see why something is marked verified

Platform works even if one API fails

ACLED can later be added as an authoritative validation layer

Final instruction

Build this system deterministically and transparently.
If verification is unclear, downgrade — never guess.