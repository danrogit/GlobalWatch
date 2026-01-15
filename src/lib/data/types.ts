// Unified GlobalWatch Data types
// 8 Focused Geopolitical Categories

export type EventLayer = 'incident' | 'political';

// 8 Focused Categories (State Power Only)
export type EventCategory =
    | 'military_security'   // Militær & sikkerhed
    | 'diplomacy'           // Diplomati
    | 'sanctions_trade'     // Sanktioner & handel
    | 'elections_power'     // Valg & magtskifte
    | 'protests_unrest'     // Protester & uro
    | 'borders_territory'   // Grænser & territorier
    | 'government_actions'  // Statslige beslutninger
    | 'info_warfare';       // Informationskrig

export type SeverityLevel = 'low' | 'medium' | 'high';

export interface UnifiedEvent {
    id: string;
    layer: EventLayer;

    // Location
    country: string;
    countryCode?: string;
    region?: string;
    city?: string;
    locationLabel?: string;
    lat: number;
    lon: number;

    // Classification
    category: EventCategory;
    danishCategory: string;
    title: string;
    danishTitle: string;
    slug: string;

    // Impact
    severity: SeverityLevel;
    fatalities?: number;
    eventCount?: number;

    // Attribution
    source: string;
    sourceUrl?: string;
    notes?: string;

    // Visuals
    dotColor: 'blue' | 'orange' | 'red' | 'green';

    // Timestamps
    timestamp: string; // ISO or YYYY-MM-DD
    addedAt: string;   // ISO

    // Verification Engine Data
    status?: 'VERIFIED' | 'REPORTED' | 'UNVERIFIED';
    sources?: string[]; // List of publishers
    articles?: any[];   // List of articles (Article[])
    gdeltSourceUrls?: string[]; // Raw GDELT source URLs for display
}

export interface UnifiedStore {
    events: UnifiedEvent[];
    lastUpdated: string;
}

// 8-Category Mapping with Danish labels
export const CATEGORY_LABELS: Record<EventCategory, { danish: string; color: 'blue' | 'orange' | 'red' }> = {
    'military_security': { danish: 'Militær & sikkerhed', color: 'red' },
    'diplomacy': { danish: 'Diplomati', color: 'orange' },
    'sanctions_trade': { danish: 'Sanktioner & handel', color: 'orange' },
    'elections_power': { danish: 'Valg & magtskifte', color: 'orange' },
    'protests_unrest': { danish: 'Protester & uro', color: 'blue' },
    'borders_territory': { danish: 'Grænser & territorier', color: 'red' },
    'government_actions': { danish: 'Statslige beslutninger', color: 'blue' },
    'info_warfare': { danish: 'Informationskrig', color: 'orange' },
};

// Map ACLED types to new categories
export const ACLED_TO_UNIFIED: Record<string, { category: EventCategory; danish: string; color: 'blue' | 'orange' | 'red' }> = {
    'Protests': { category: 'protests_unrest', danish: 'Protester & uro', color: 'blue' },
    'Riots': { category: 'protests_unrest', danish: 'Protester & uro', color: 'orange' },
    'Violence against civilians': { category: 'military_security', danish: 'Militær & sikkerhed', color: 'red' },
    'Battles': { category: 'military_security', danish: 'Militær & sikkerhed', color: 'red' },
    'Explosions/Remote violence': { category: 'military_security', danish: 'Militær & sikkerhed', color: 'red' },
    'Strategic developments': { category: 'government_actions', danish: 'Statslige beslutninger', color: 'blue' },
};

// Map GDELT/RSS signals to new categories
export const SIGNAL_TO_UNIFIED: Record<string, { category: EventCategory; danish: string; color: 'blue' | 'orange' | 'red' }> = {
    'Diplomacy': { category: 'diplomacy', danish: 'Diplomati', color: 'orange' },
    'Diplomatic Tensions': { category: 'diplomacy', danish: 'Diplomati', color: 'orange' },
    'Sanctions': { category: 'sanctions_trade', danish: 'Sanktioner & handel', color: 'orange' },
    'Elections': { category: 'elections_power', danish: 'Valg & magtskifte', color: 'orange' },
    'Military Activity': { category: 'military_security', danish: 'Militær & sikkerhed', color: 'red' },
    'Statements': { category: 'government_actions', danish: 'Statslige beslutninger', color: 'blue' },
    'Border Dispute': { category: 'borders_territory', danish: 'Grænser & territorier', color: 'red' },
    'Disinformation': { category: 'info_warfare', danish: 'Informationskrig', color: 'orange' },
};

