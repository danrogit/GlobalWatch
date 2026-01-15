/**
 * Test and compile working RSS feeds
 * Run with: npx tsx scripts/test-feeds.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Extract all URLs from the messy file
function extractUrls(content: string): string[] {
    // Match HTTP/HTTPS URLs
    const urlRegex = /https?:\/\/[^\s<>"')\]]+/g;
    const matches = content.match(urlRegex) || [];

    // Clean up URLs (remove trailing punctuation)
    const cleaned = matches.map(url => {
        return url.replace(/[,;:]+$/, '').replace(/\)$/, '');
    });

    // Deduplicate
    return [...new Set(cleaned)];
}

// Test if a URL is a valid RSS feed
async function testFeed(url: string, timeoutMs = 8000): Promise<{ url: string; valid: boolean; articles: number; error?: string }> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'GlobalWatch/1.0 (RSS Feed Tester)',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { url, valid: false, articles: 0, error: `HTTP ${response.status}` };
        }

        const text = await response.text();

        // Check if it looks like an RSS/Atom feed
        const isRss = text.includes('<rss') || text.includes('<feed') || text.includes('<item') || text.includes('<entry');

        if (!isRss) {
            return { url, valid: false, articles: 0, error: 'Not RSS/Atom' };
        }

        // Count items
        const itemCount = (text.match(/<item[\s>]/g) || []).length + (text.match(/<entry[\s>]/g) || []).length;

        return { url, valid: true, articles: itemCount };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        if (errMsg.includes('aborted')) {
            return { url, valid: false, articles: 0, error: 'Timeout' };
        }
        return { url, valid: false, articles: 0, error: errMsg.substring(0, 50) };
    }
}

async function main() {
    console.log('🔍 Extracting and testing RSS feeds...\n');

    // Read the file
    const filePath = path.join(process.cwd(), 'data', 'rss', 'fixed_rssfeeds.yaml');
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract URLs
    const urls = extractUrls(content);
    console.log(`📋 Found ${urls.length} unique URLs\n`);

    // Filter to likely RSS URLs (exclude images, JS, etc.)
    const rssUrls = urls.filter(url => {
        const lower = url.toLowerCase();
        if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('.gif')) return false;
        if (lower.includes('.js') || lower.includes('.css')) return false;
        if (lower.includes('validator.w3.org')) return false;
        return true;
    });

    console.log(`🎯 Testing ${rssUrls.length} potential RSS feeds...\n`);

    // Test in batches of 10
    const batchSize = 10;
    const working: { url: string; articles: number }[] = [];
    const failed: { url: string; error: string }[] = [];

    for (let i = 0; i < rssUrls.length; i += batchSize) {
        const batch = rssUrls.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(url => testFeed(url)));

        for (const result of results) {
            if (result.valid) {
                working.push({ url: result.url, articles: result.articles });
                console.log(`✅ ${result.url} (${result.articles} items)`);
            } else {
                failed.push({ url: result.url, error: result.error || 'Unknown' });
                // Only log non-trivial errors
                if (result.error !== 'HTTP 404' && result.error !== 'Timeout') {
                    console.log(`❌ ${result.url}: ${result.error}`);
                }
            }
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Results: ${working.length} working / ${failed.length} failed\n`);

    // Sort working feeds by article count
    working.sort((a, b) => b.articles - a.articles);

    // Write working feeds to a new YAML file
    const yamlContent = `# Working RSS Feeds (tested ${new Date().toISOString()})
# Total: ${working.length} feeds

feeds:
${working.map(f => `  - url: ${f.url}`).join('\n')}
`;

    const outputPath = path.join(process.cwd(), 'data', 'rss', 'rssfeeds.yaml');
    fs.writeFileSync(outputPath, yamlContent);
    console.log(`💾 Saved ${working.length} working feeds to rssfeeds.yaml`);

    // Show top 20 feeds by article count
    console.log('\n🏆 Top 20 feeds by article count:');
    for (const feed of working.slice(0, 20)) {
        console.log(`  ${feed.articles} items: ${feed.url}`);
    }
}

main().catch(console.error);
