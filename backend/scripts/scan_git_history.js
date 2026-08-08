const { execSync } = require('child_process');

console.log('🔍 Scanning Git History for Leaked Credentials...\n');

// Get all commit hashes
const commitsRaw = execSync('git log --format="%H|%an|%ad|%s"', { encoding: 'utf-8' });
const commits = commitsRaw.trim().split('\n').filter(Boolean);

const patterns = [
    { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/g },
    { name: 'Stripe Test Secret Key', regex: /sk_test_[0-9a-zA-Z]{24,}/g },
    { name: 'SendGrid API Key', regex: /SG\.[0-9a-zA-Z_-]{22,}\.[0-9a-zA-Z_-]{43,}/g },
    { name: 'Supabase JWT / Service Role / Anon Key', regex: /eyJhbGciOi[0-9a-zA-Z._-]{50,}/g },
    { name: 'Google API Key', regex: /AIzaSy[0-9a-zA-Z_-]{33}/g },
    { name: 'Database Connection String (Postgres/Mongo)', regex: /(postgres|postgresql|mongodb):\/\/[^\s"'`]+:[^\s"'`]+@[^\s"'`]+/g },
    { name: 'Hardcoded Plain-text Password Assignment', regex: /(admin_password|password|jwt_secret|secret_key|service_key)\s*[:=]\s*['"][^'"]{6,}['"]/gi },
    { name: 'Hardcoded Email Service Password', regex: /(smtp_pass|email_pass|mail_password|auth_pass)\s*[:=]\s*['"][^'"]{4,}['"]/gi }
];

const findings = [];

for (const commitLine of commits) {
    const [hash, author, date, subject] = commitLine.split('|');
    const shortHash = hash.substring(0, 7);

    // Get the diff of this commit
    let diff = '';
    try {
        diff = execSync(`git show ${hash}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    } catch (e) {
        continue;
    }

    const lines = diff.split('\n');
    let currentFile = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('+++ b/')) {
            currentFile = line.substring(6);
            continue;
        }

        // Only check added lines
        if (line.startsWith('+') && !line.startsWith('+++')) {
            const addedContent = line.substring(1);

            for (const pattern of patterns) {
                const matches = addedContent.match(pattern.regex);
                if (matches) {
                    for (const match of matches) {
                        // Exclude placeholder and test dummy matches
                        if (match.includes('your_') || match.includes('dummy') || match.includes('placeholder') || match.includes('example') || match.includes('Test@Secure123!')) {
                            continue;
                        }

                        // Mask match for report
                        let masked = match;
                        if (match.length > 12) {
                            masked = match.substring(0, 6) + '...' + match.substring(match.length - 4);
                        }

                        findings.push({
                            commitHash: shortHash,
                            fullHash: hash,
                            author,
                            date,
                            subject,
                            file: currentFile,
                            type: pattern.name,
                            snippet: masked,
                            rawLine: addedContent.trim().substring(0, 100)
                        });
                    }
                }
            }
        }
    }
}

console.log(`Scan completed. Found ${findings.length} potential credential leaks across commit history.\n`);

// Deduplicate findings
const uniqueFindings = [];
const seen = new Set();

for (const f of findings) {
    const key = `${f.commitHash}|${f.file}|${f.snippet}`;
    if (!seen.has(key)) {
        seen.add(key);
        uniqueFindings.push(f);
    }
}

console.log(JSON.stringify(uniqueFindings, null, 2));
