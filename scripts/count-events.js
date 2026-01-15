
const fs = require('fs');
try {
    const data = fs.readFileSync('data/unified_events.json', 'utf8');
    const json = JSON.parse(data);
    console.log(`EVENTS_COUNT: ${json.events.length}`);

    // Count categories
    const cats = {};
    json.events.forEach(e => {
        cats[e.category] = (cats[e.category] || 0) + 1;
    });
    console.log('CATEGORIES:', JSON.stringify(cats));

    // Check for Danish characters in titles
    const danishEvents = json.events.filter(e => /[æøåÆØÅ]/.test(e.danishTitle || ''));
    console.log(`DANISH_TITLE_COUNT: ${danishEvents.length}`);
    if (danishEvents.length > 0) {
        console.log(`SAMPLE_DANISH: ${danishEvents[0].danishTitle}`);
    }

} catch (e) {
    console.error(e);
}
