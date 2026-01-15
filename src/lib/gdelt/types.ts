// Multi-Source Event Types and Interfaces

// ============================================
// CONFIDENCE SYSTEM
// ============================================

export type ConfidenceLevel = 'confirmed' | 'reported' | 'unverified';

export interface ConfidenceSignal {
  source: 'gdelt' | 'acled' | 'news' | 'duration';
  weight: number;
  description: string;
}

// ============================================
// SOURCE LAYERS
// ============================================

// Layer 1: GDELT Detection (Media Signal)
export interface GdeltDetection {
  detected: boolean;
  eventCode: string;
  eventType: string;
  mediaVolume: number; // numMentions
  numSources: number;
  numArticles: number;
  avgTone: number;
  firstSeen: string;
  sourceUrls: string[];
}

// Layer 2: ACLED Verification (High Confidence)
export interface AcledVerification {
  matched: boolean;
  eventId?: string;
  eventType?: string;
  subEventType?: string;
  actors?: string[];
  fatalities?: number;
  notes?: string;
  source?: string;
  sourceUrl?: string;
}

// Layer 3: Wikipedia Context (Background Only)
export interface WikipediaContext {
  available: boolean;
  regionHistory?: string;
  ongoingConflicts?: string[];
  politicalBackground?: string;
  wikiUrl?: string;
  lastUpdated?: string;
}

// Layer 4: Media Attribution
export interface MediaSource {
  name: string; // "Reuters", "AP", "Al Jazeera"
  headline: string;
  excerpt: string; // 1-2 sentences max
  url: string;
  publishedAt: string;
}

// ============================================
// AGGREGATED EVENT (Main Type)
// ============================================

export interface AggregatedEvent {
  id: string;
  lat: number;
  lon: number;

  // Location
  city: string;
  country: string;
  countryCode: string;

  // Classification
  eventType: string;
  eventTypeCode: string;
  title: string;
  slug: string;

  // Timestamps
  timestamp: string;
  firstSeen: string;
  lastUpdated: string;

  // Confidence System (MANDATORY)
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-10
  confidenceSignals: ConfidenceSignal[];

  // Source Layers
  gdelt: GdeltDetection;
  acled?: AcledVerification;
  context?: WikipediaContext;
  sources: MediaSource[];
  articles?: MediaSource[]; // Added for consistency with UnifiedEvent

  // Legacy compatibility
  severity: 'low' | 'medium' | 'high';
  severityScore: number;
  eventCount: number;
  actors: string[];
}

// ============================================
// STORE
// ============================================

export interface EventStore {
  events: AggregatedEvent[];
  lastUpdated: string;
  lastFetchedFile: string;
}

// ============================================
// GDELT RAW DATA (For Fetcher)
// ============================================

export interface RawGdeltEvent {
  globalEventId: string;
  day: string;
  monthYear: string;
  year: string;
  fractionDate: string;
  actor1Code: string;
  actor1Name: string;
  actor1CountryCode: string;
  actor1Type1Code: string;
  actor2Code: string;
  actor2Name: string;
  actor2CountryCode: string;
  actor2Type1Code: string;
  isRootEvent: boolean;
  eventCode: string;
  eventBaseCode: string;
  eventRootCode: string;
  quadClass: number;
  goldsteinScale: number;
  numMentions: number;
  numSources: number;
  numArticles: number;
  avgTone: number;
  actor1Geo_Type: number;
  actor1Geo_FullName: string;
  actor1Geo_CountryCode: string;
  actor1Geo_Lat: number;
  actor1Geo_Long: number;
  actor2Geo_Type: number;
  actor2Geo_FullName: string;
  actor2Geo_CountryCode: string;
  actor2Geo_Lat: number;
  actor2Geo_Long: number;
  actionGeo_Type: number;
  actionGeo_FullName: string;
  actionGeo_CountryCode: string;
  actionGeo_Lat: number;
  actionGeo_Long: number;
  dateAdded: string;
  sourceUrl: string;
}

// ============================================
// CAMEO EVENT CODES
// ============================================

export const GEOPOLITICAL_EVENT_CODES: Record<string, string> = {
  // Protests
  '140': 'Protest',
  '141': 'Demonstrate',
  '1411': 'Engage in demonstration',
  '1412': 'Organize demonstration',
  '1413': 'Hold vigil',
  '1414': 'March',
  '142': 'Conduct hunger strike',
  '143': 'Conduct strike',
  '144': 'Obstruct passage',
  '145': 'Riot',

  // Coercion
  '170': 'Coerce',
  '171': 'Seize property',
  '172': 'Impose curfew',
  '173': 'Impose state of emergency',
  '174': 'Arrest or detain',
  '175': 'Expel or deport',

  // Assault
  '180': 'Use conventional force',
  '181': 'Abduct or hijack',
  '182': 'Physically assault',
  '183': 'Conduct suicide attack',
  '184': 'Use chemical weapons',
  '185': 'Provide military aid',
  '186': 'Employ aerial weapons',

  // Fight
  '190': 'Engage in armed conflict',
  '191': 'Impose blockade',
  '192': 'Occupy territory',
  '193': 'Engage in armed battle',
  '194': 'Engage in violent protests',
  '195': 'Employ ground forces',

  // Use unconventional force
  '200': 'Use unconventional force',
  '201': 'Conduct bombing',
  '202': 'Detonate explosive',
  '203': 'Gun violence',
  '204': 'Destroy property',

  // Sanctions
  '163': 'Impose sanctions',

  // Reduce relations
  '130': 'Reduce relations',
  '131': 'Reduce or break relations',
  '1311': 'Seize territory',
  '132': 'Suspend or cease',
  '133': 'Reduce aid',
  '134': 'Impose embargo',
  '135': 'Impose restrictions',
  '136': 'Halt negotiations',
  '137': 'Expel',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  '14': 'Protests',
  '17': 'Coercion',
  '18': 'Armed Conflict',
  '19': 'Military Action',
  '20': 'Unconventional Violence',
  '163': 'Sanctions',
  '13': 'Diplomatic Tensions',
};

export function getEventTypeLabel(code: string): string {
  if (EVENT_TYPE_LABELS[code]) return EVENT_TYPE_LABELS[code];
  const prefix = code.substring(0, 2);
  if (EVENT_TYPE_LABELS[prefix]) return EVENT_TYPE_LABELS[prefix];
  if (GEOPOLITICAL_EVENT_CODES[code]) return GEOPOLITICAL_EVENT_CODES[code];
  return 'Geopolitical Event';
}
