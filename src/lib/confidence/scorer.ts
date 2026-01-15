// Confidence Scoring System
// Based on multi-source verification signals

import {
    AggregatedEvent,
    ConfidenceLevel,
    ConfidenceSignal
} from '../gdelt/types';

// Scoring weights
const WEIGHTS = {
    GDELT_DETECTION: 1,
    MULTIPLE_NEWS_SOURCES: 1,
    ACLED_CONFIRMATION: 3,
    MULTIPLE_DAYS_REPORTING: 1,
    HIGH_MEDIA_VOLUME: 1,
} as const;

// Thresholds for confidence levels
const THRESHOLDS = {
    CONFIRMED: 5,
    REPORTED: 2,
} as const;

/**
 * Calculate confidence score and signals for an event
 */
export function calculateConfidence(event: Partial<AggregatedEvent>): {
    score: number;
    level: ConfidenceLevel;
    signals: ConfidenceSignal[];
} {
    const signals: ConfidenceSignal[] = [];
    let score = 0;

    // Signal 1: GDELT Detection
    if (event.gdelt?.detected) {
        score += WEIGHTS.GDELT_DETECTION;
        signals.push({
            source: 'gdelt',
            weight: WEIGHTS.GDELT_DETECTION,
            description: 'Media attention detected via GDELT monitoring'
        });
    }

    // Signal 2: Multiple News Sources
    if (event.sources && event.sources.length >= 2) {
        score += WEIGHTS.MULTIPLE_NEWS_SOURCES;
        signals.push({
            source: 'news',
            weight: WEIGHTS.MULTIPLE_NEWS_SOURCES,
            description: `Reported by ${event.sources.length} independent news outlets`
        });
    }

    // Signal 3: ACLED Confirmation (High Weight)
    if (event.acled?.matched) {
        score += WEIGHTS.ACLED_CONFIRMATION;
        signals.push({
            source: 'acled',
            weight: WEIGHTS.ACLED_CONFIRMATION,
            description: 'Verified by ACLED conflict data project'
        });
    }

    // Signal 4: Multiple Days of Reporting
    if (event.firstSeen && event.lastUpdated) {
        const firstDate = new Date(event.firstSeen);
        const lastDate = new Date(event.lastUpdated);
        const daysDiff = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 1) {
            score += WEIGHTS.MULTIPLE_DAYS_REPORTING;
            signals.push({
                source: 'duration',
                weight: WEIGHTS.MULTIPLE_DAYS_REPORTING,
                description: `Reported over ${daysDiff + 1} days`
            });
        }
    }

    // Signal 5: High Media Volume (from GDELT)
    if (event.gdelt?.mediaVolume && event.gdelt.mediaVolume >= 50) {
        score += WEIGHTS.HIGH_MEDIA_VOLUME;
        signals.push({
            source: 'gdelt',
            weight: WEIGHTS.HIGH_MEDIA_VOLUME,
            description: `High media volume: ${event.gdelt.mediaVolume} mentions`
        });
    }

    // Determine confidence level
    let level: ConfidenceLevel;
    if (score >= THRESHOLDS.CONFIRMED) {
        level = 'confirmed';
    } else if (score >= THRESHOLDS.REPORTED) {
        level = 'reported';
    } else {
        level = 'unverified';
    }

    return { score, level, signals };
}

/**
 * Get confidence badge emoji and label
 */
export function getConfidenceBadge(level: ConfidenceLevel): {
    emoji: string;
    label: string;
    color: string;
} {
    switch (level) {
        case 'confirmed':
            return { emoji: '🟢', label: 'Confirmed', color: '#22c55e' };
        case 'reported':
            return { emoji: '🟡', label: 'Reported / Developing', color: '#eab308' };
        case 'unverified':
            return { emoji: '🔴', label: 'Unverified Media Report', color: '#ef4444' };
    }
}

/**
 * Get confidence description for UI display
 */
export function getConfidenceDescription(level: ConfidenceLevel): string {
    switch (level) {
        case 'confirmed':
            return 'This event has been verified by multiple independent sources including curated conflict data.';
        case 'reported':
            return 'This event is being reported by media outlets but has not been independently verified.';
        case 'unverified':
            return 'This is an unverified media report. Exercise caution when interpreting this information.';
    }
}
