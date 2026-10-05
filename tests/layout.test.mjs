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

const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
if (!styleMatch) {
    console.error('FAIL: index.html is missing a <style> block');
    process.exit(1);
}

const css = styleMatch[1];

let hasFlexOnMainContainer = false;
const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
let rule;
while ((rule = rulePattern.exec(css)) !== null) {
    const selector = rule[1].trim();
    const declarations = rule[2];
    if (selector === '.main-container' && /display\s*:\s*flex/.test(declarations)) {
        hasFlexOnMainContainer = true;
        break;
    }
}

if (!hasFlexOnMainContainer) {
    console.error('FAIL: .main-container is missing "display: flex" — the desktop split layout collapses and the params panel is clipped below the viewport');
    process.exit(1);
}

console.log('layout test passed');
