# Verification Model: 3-Tier System

## 🟢 Bekræftet (Confirmed)
**Definition**: Same concrete event independently reported by multiple reputable publishers.

**Rules**:
- ≥ 2 independent publishers
- Same country + time window (24h)
- Same physical or political action
- Not just wire reuse (e.g., same AP article on multiple sites)
- At least one trusted source for sensitive events

**Label Example**:
```
Bekræftet
Kilder: DR.dk, Reuters
```

---

## 🟡 Rapporteret (Reported)
**Definition**: A real publisher is reporting this, but independent confirmation is still missing. **Not rumor**.

**Rules**:
- Exactly 1 independent publisher
- Credible outlet (DR, BBC, Reuters, Al Jazeera, etc.)
- Clear factual reporting
- No conflicting information yet

**Label Example**:
```
Rapporteret
Kilde: BBC News
```

**Key Insight**: "One newsroom has put their name on it."

---

## 🔴 Ubekræftet (Unverified Signal)
**Definition**: The system detected signals, but no reliable newsroom has yet confirmed it.

**Includes**:
- GDELT-only signals
- Search chatter
- Vague language
- Conflicting descriptions
- Early breaking rumors

**Rules**:
- No credible publisher found
- Or only low-quality / unknown sources
- Or semantic ambiguity

**Label Example**:
```
Ubekræftet signal
Kilde: Mediesignal (GDELT)
```

---

## Trusted Publishers (Weighted)
| Publisher | Weight | Notes |
|-----------|--------|-------|
| DR | 1.5x | Danish national broadcaster |
| Reuters | 1.5x | Wire service, high accuracy |
| BBC | 1.5x | International credibility |
| AP | 1.5x | Wire service |
| Al Jazeera | 1.2x | Middle East coverage |
| TV2 (DK) | 1.3x | Danish national |
| Politiken | 1.2x | Danish quality press |
| Berlingske | 1.2x | Danish quality press |
