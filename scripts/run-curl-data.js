
const fs = require('fs');
const { execSync } = require('child_process');

try {
    const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    const token = tokenData.access_token;

    console.log('Access Token obtained. Running curl...');

    // Command from user
    // curl -H "Authorization: Bearer ACCESS-TOKEN-HERE" -X GET "https://acleddata.com/api/acled/read?limit=10"

    const cmd = `curl.exe -v -H "Authorization: Bearer ${token}" -X GET "https://acleddata.com/api/acled/read?limit=10"`;

    try {
        const output = execSync(cmd, { stdio: 'pipe' });
        console.log('--- RESPONSE ---');
        console.log(output.toString());
    } catch (e) {
        console.log('--- ERROR ---');
        console.log(e.stdout ? e.stdout.toString() : '');
        console.log(e.stderr ? e.stderr.toString() : '');
    }

} catch (e) {
    console.error('Failed to read token:', e);
}
