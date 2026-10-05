import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '..', 'index.html');

let html;
try {
    html = readFileSync(htmlPath, 'utf8');
} catch (err) {
    console.error(`FAIL: cannot read ${htmlPath}: ${err.message}`);
    process.exit(1);
}

const failures = [];
function check(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

check(
    html.includes('https://github.com/fengdonglu/OpenC5'),
    'index.html is missing repository URL https://github.com/fengdonglu/OpenC5'
);

const anchorMatch = html.match(/<a\b[^>]*class="repo-link"[^>]*>[\s\S]*?<\/a>/);
const anchor = anchorMatch ? anchorMatch[0] : '';
check(Boolean(anchor), 'index.html is missing an <a class="repo-link"> block');

if (anchor) {
    check(anchor.includes('https://github.com/fengdonglu/OpenC5'), 'repo-link block is missing the repository URL');
    check(anchor.includes('aria-label="GitHub repository"'), 'repo-link block is missing aria-label="GitHub repository"');
    check(anchor.includes('title="GitHub repository"'), 'repo-link block is missing title="GitHub repository"');
    check(/<svg\b[^>]*aria-hidden="true"/.test(anchor), 'repo-link block is missing an <svg> with aria-hidden="true"');
    check(anchor.includes('fill="currentColor"'), 'repo-link block is missing fill="currentColor"');
    check(/<span>\s*fengdonglu\/OpenC5\s*<\/span>/.test(anchor), 'repo-link block is missing the visible <span>fengdonglu/OpenC5</span> text');
    check(!/display\s*:\s*none/.test(anchor), 'repo-link block hides its text with display: none');
}

if (failures.length > 0) {
    for (const failure of failures) {
        console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
}

console.log('repo-link test passed');
