import * as fs from 'fs';
import * as path from 'path';

interface FeedStats {
    url: string;
    count: number;
    error?: string;
}

async function checkFeed(url: string): Promise<FeedStats> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            return { url, count: 0, error: `HTTP ${response.status}` };
        }

        const text = await response.text();

        // Count <item> tags (RSS) or <entry> tags (Atom)
        const itemCount = (text.match(/<item>/gi) || []).length;
        const entryCount = (text.match(/<entry>/gi) || []).length;
        const count = Math.max(itemCount, entryCount);

        return { url, count };
    } catch (error) {
        return {
            url,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function checkAllFeeds() {
    const feedFile = path.join(process.cwd(), 'data', 'rss', 'rss.xml');
    const urls = fs.readFileSync(feedFile, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('http'));

    console.log(`[Feed Checker] Found ${urls.length} feeds to check\n`);

    const results: FeedStats[] = [];
    const batchSize = 10;

    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        console.log(`[${i + 1}-${Math.min(i + batchSize, urls.length)}/${urls.length}] Checking batch...`);

        const batchResults = await Promise.all(batch.map(checkFeed));
        results.push(...batchResults);

        // Rate limiting
        if (i + batchSize < urls.length) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Sort by count (descending)
    results.sort((a, b) => b.count - a.count);

    // Statistics
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    const totalEntries = successful.reduce((sum, r) => sum + r.count, 0);
    const avgEntries = successful.length > 0 ? totalEntries / successful.length : 0;

    console.log('\n' + '='.repeat(80));
    console.log('FEED STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Feeds Checked: ${urls.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Total Entries: ${totalEntries}`);
    console.log(`Average Entries per Feed: ${avgEntries.toFixed(1)}`);
    console.log('='.repeat(80));

    // Top 20 feeds
    console.log('\nTOP 20 FEEDS BY ENTRY COUNT:');
    console.log('-'.repeat(80));
    successful.slice(0, 20).forEach((feed, idx) => {
        const domain = new URL(feed.url).hostname;
        console.log(`${(idx + 1).toString().padStart(2)}. [${feed.count.toString().padStart(3)} entries] ${domain}`);
    });

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'data', 'rss', 'feed-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalFeeds: urls.length,
            successful: successful.length,
            failed: failed.length,
            totalEntries,
            avgEntries
        },
        feeds: results
    }, null, 2));

    console.log(`\n✅ Detailed report saved to: ${reportPath}`);

    // Show failed feeds
    if (failed.length > 0) {
        console.log(`\n⚠️  ${failed.length} FAILED FEEDS:`);
        failed.slice(0, 10).forEach(feed => {
            const domain = new URL(feed.url).hostname;
            console.log(`   - ${domain}: ${feed.error}`);
        });
        if (failed.length > 10) {
            console.log(`   ... and ${failed.length - 10} more (see report)`);
        }
    }
}

checkAllFeeds().catch(console.error);
