import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';
import { RawGdeltEvent, GEOPOLITICAL_EVENT_CODES } from './types';

const MASTER_FILE_URL = 'http://data.gdeltproject.org/gdeltv2/masterfilelist.txt';
const LAST_UPDATE_URL = 'http://data.gdeltproject.org/gdeltv2/lastupdate.txt';

// GDELT 2.0 CSV column headers
const GDELT_COLUMNS = [
    'globalEventId', 'day', 'monthYear', 'year', 'fractionDate',
    'actor1Code', 'actor1Name', 'actor1CountryCode', 'actor1KnownGroupCode',
    'actor1EthnicCode', 'actor1Religion1Code', 'actor1Religion2Code',
    'actor1Type1Code', 'actor1Type2Code', 'actor1Type3Code',
    'actor2Code', 'actor2Name', 'actor2CountryCode', 'actor2KnownGroupCode',
    'actor2EthnicCode', 'actor2Religion1Code', 'actor2Religion2Code',
    'actor2Type1Code', 'actor2Type2Code', 'actor2Type3Code',
    'isRootEvent', 'eventCode', 'eventBaseCode', 'eventRootCode',
    'quadClass', 'goldsteinScale', 'numMentions', 'numSources', 'numArticles',
    'avgTone',
    'actor1Geo_Type', 'actor1Geo_FullName', 'actor1Geo_CountryCode',
    'actor1Geo_ADM1Code', 'actor1Geo_ADM2Code', 'actor1Geo_Lat', 'actor1Geo_Long',
    'actor1Geo_FeatureID',
    'actor2Geo_Type', 'actor2Geo_FullName', 'actor2Geo_CountryCode',
    'actor2Geo_ADM1Code', 'actor2Geo_ADM2Code', 'actor2Geo_Lat', 'actor2Geo_Long',
    'actor2Geo_FeatureID',
    'actionGeo_Type', 'actionGeo_FullName', 'actionGeo_CountryCode',
    'actionGeo_ADM1Code', 'actionGeo_ADM2Code', 'actionGeo_Lat', 'actionGeo_Long',
    'actionGeo_FeatureID',
    'dateAdded', 'sourceUrl'
];

interface ExportFileInfo {
    size: number;
    hash: string;
    url: string;
    timestamp: string;
}

/**
 * Get the list of export files from the last 7 days
 */
export async function getRecentExportFiles(): Promise<ExportFileInfo[]> {
    console.log('[GDELT] Fetching master file list...');

    const response = await fetch(MASTER_FILE_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch master file list: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const exportFiles: ExportFileInfo[] = [];

    for (const line of lines) {
        const parts = line.trim().split(' ');
        if (parts.length < 3) continue;

        const [size, hash, url] = parts;

        // Only process export files (not gkg or mentions)
        if (!url.includes('.export.CSV.zip')) continue;

        // Extract timestamp from filename: YYYYMMDDHHMMSS.export.CSV.zip
        const filename = url.split('/').pop() || '';
        const timestampMatch = filename.match(/^(\d{14})/);
        if (!timestampMatch) continue;

        const timestamp = timestampMatch[1];
        const year = parseInt(timestamp.substring(0, 4));
        const month = parseInt(timestamp.substring(4, 6)) - 1;
        const day = parseInt(timestamp.substring(6, 8));
        const hour = parseInt(timestamp.substring(8, 10));
        const minute = parseInt(timestamp.substring(10, 12));

        const fileDate = new Date(year, month, day, hour, minute);

        if (fileDate.getTime() >= sevenDaysAgo) {
            exportFiles.push({
                size: parseInt(size),
                hash,
                url,
                timestamp
            });
        }
    }

    console.log(`[GDELT] Found ${exportFiles.length} export files from last 7 days`);
    return exportFiles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Get the latest export file only
 */
export async function getLatestExportFile(): Promise<ExportFileInfo | null> {
    console.log('[GDELT] Fetching latest update info...');

    const response = await fetch(LAST_UPDATE_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch last update: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    for (const line of lines) {
        const parts = line.trim().split(' ');
        if (parts.length < 3) continue;

        const [size, hash, url] = parts;
        if (url.includes('.export.CSV.zip')) {
            const filename = url.split('/').pop() || '';
            const timestampMatch = filename.match(/^(\d{14})/);
            return {
                size: parseInt(size),
                hash,
                url,
                timestamp: timestampMatch?.[1] || ''
            };
        }
    }

    return null;
}

/**
 * Download and parse a GDELT export file
 */
export async function downloadAndParseExport(url: string): Promise<RawGdeltEvent[]> {
    console.log(`[GDELT] Downloading: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download export: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);

    // Get the first (and only) CSV file from the zip
    const csvFileName = Object.keys(zipContent.files)[0];
    if (!csvFileName) {
        throw new Error('No CSV file found in archive');
    }

    const csvContent = await zipContent.files[csvFileName].async('string');

    // Parse CSV (tab-delimited, no headers in file)
    const records = parse(csvContent, {
        delimiter: '\t',
        relax_column_count: true,
        skip_empty_lines: true,
    });

    const events: RawGdeltEvent[] = [];
    const geopoliticalCodes = Object.keys(GEOPOLITICAL_EVENT_CODES);

    for (const row of records) {
        if (row.length < 60) continue;

        const eventCode = row[26]?.toString() || '';
        const eventBaseCode = row[27]?.toString() || '';
        const eventRootCode = row[28]?.toString() || '';

        // Filter for geopolitical events only
        const isGeopolitical = geopoliticalCodes.some(code =>
            eventCode.startsWith(code) ||
            eventBaseCode.startsWith(code) ||
            eventRootCode.startsWith(code) ||
            eventCode === code
        );

        if (!isGeopolitical) continue;

        // Must have valid coordinates
        const actionLat = parseFloat(row[56]);
        const actionLon = parseFloat(row[57]);

        if (isNaN(actionLat) || isNaN(actionLon) || (actionLat === 0 && actionLon === 0)) {
            continue;
        }

        events.push({
            globalEventId: row[0]?.toString() || '',
            day: row[1]?.toString() || '',
            monthYear: row[2]?.toString() || '',
            year: row[3]?.toString() || '',
            fractionDate: row[4]?.toString() || '',
            actor1Code: row[5]?.toString() || '',
            actor1Name: row[6]?.toString() || '',
            actor1CountryCode: row[7]?.toString() || '',
            actor1Type1Code: row[12]?.toString() || '',
            actor2Code: row[15]?.toString() || '',
            actor2Name: row[16]?.toString() || '',
            actor2CountryCode: row[17]?.toString() || '',
            actor2Type1Code: row[22]?.toString() || '',
            isRootEvent: row[25] === '1',
            eventCode,
            eventBaseCode,
            eventRootCode,
            quadClass: parseInt(row[29]) || 0,
            goldsteinScale: parseFloat(row[30]) || 0,
            numMentions: parseInt(row[31]) || 0,
            numSources: parseInt(row[32]) || 0,
            numArticles: parseInt(row[33]) || 0,
            avgTone: parseFloat(row[34]) || 0,
            actor1Geo_Type: parseInt(row[35]) || 0,
            actor1Geo_FullName: row[36]?.toString() || '',
            actor1Geo_CountryCode: row[37]?.toString() || '',
            actor1Geo_Lat: parseFloat(row[40]) || 0,
            actor1Geo_Long: parseFloat(row[41]) || 0,
            actor2Geo_Type: parseInt(row[43]) || 0,
            actor2Geo_FullName: row[44]?.toString() || '',
            actor2Geo_CountryCode: row[45]?.toString() || '',
            actor2Geo_Lat: parseFloat(row[48]) || 0,
            actor2Geo_Long: parseFloat(row[49]) || 0,
            actionGeo_Type: parseInt(row[51]) || 0,
            actionGeo_FullName: row[52]?.toString() || '',
            actionGeo_CountryCode: row[53]?.toString() || '',
            actionGeo_Lat: actionLat,
            actionGeo_Long: actionLon,
            dateAdded: row[59]?.toString() || '',
            sourceUrl: row[60]?.toString() || '',
        });
    }

    console.log(`[GDELT] Parsed ${events.length} geopolitical events from export`);
    return events;
}
