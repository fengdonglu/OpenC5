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

// Extract the source text of a top-level function body / 提取顶层函数体源码
function extractFunctionBody(src, name) {
    const start = src.indexOf(`function ${name}(`);
    if (start === -1) return '';
    const braceStart = src.indexOf('{', start);
    if (braceStart === -1) return '';
    let depth = 0;
    for (let i = braceStart; i < src.length; i++) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return src.slice(braceStart, i + 1);
        }
    }
    return '';
}

// Extract the source text of an object method body (e.g. "resetConfiguration() {") / 提取对象方法体源码
function extractMethodBody(src, name) {
    const marker = `${name}(`;
    let searchFrom = 0;
    while (true) {
        const idx = src.indexOf(marker, searchFrom);
        if (idx === -1) return '';
        const beforeChar = src.slice(0, idx).replace(/\s+$/, '').slice(-1);
        if (beforeChar !== '.') {
            const parenClose = src.indexOf(')', idx);
            if (parenClose !== -1) {
                const braceStart = src.indexOf('{', parenClose);
                const between = src.slice(parenClose + 1, braceStart);
                if (braceStart !== -1 && /^\s*$/.test(between)) {
                    let depth = 0;
                    for (let i = braceStart; i < src.length; i++) {
                        const ch = src[i];
                        if (ch === '{') depth++;
                        else if (ch === '}') {
                            depth--;
                            if (depth === 0) return src.slice(braceStart, i + 1);
                        }
                    }
                }
            }
        }
        searchFrom = idx + marker.length;
    }
}

// ===== Batch 1: H-2 i18n keys / i18n 键 =====
const invalidIntegerDefs = html.match(/invalidInteger\s*:/g) || [];
const ringCountRangeDefs = html.match(/ringCountRange\s*:/g) || [];
check(
    invalidIntegerDefs.length >= 2,
    'i18n must define invalidInteger for both zh and en (found ' + invalidIntegerDefs.length + ')'
);
check(
    ringCountRangeDefs.length >= 2,
    'i18n must define ringCountRange for both zh and en (found ' + ringCountRangeDefs.length + ')'
);
check(html.includes('请输入整数'), 'zh i18n is missing invalidInteger text 请输入整数');
check(html.includes('Please enter an integer'), 'en i18n is missing invalidInteger text "Please enter an integer"');
check(html.includes('圈数需在 1–99 之间'), 'zh i18n is missing ringCountRange text 圈数需在 1–99 之间');
check(
    html.includes('Ring count must be between 1 and 99'),
    'en i18n is missing ringCountRange text "Ring count must be between 1 and 99"'
);

// ===== Batch 1: H-1 showLegend no longer always true / showLegend 不再恒为 true =====
check(
    !/showLegend:\s*document\.getElementById\('showLegend'\)\?\.checked\s*\|\|\s*true/.test(html),
    'showLegend assignment still falls back to "|| true" (always true)'
);
check(
    /const\s+showLegendEl\s*=\s*document\.getElementById\('showLegend'\)/.test(html),
    'showLegend assignment must read the element into a variable first'
);
check(
    /showLegend:\s*showLegendEl\s*\?\s*showLegendEl\.checked\s*:\s*true/.test(html),
    'showLegend assignment must branch on the element presence'
);

// ===== Batch 1: C-1 escapeAttr helper / 转义辅助函数 =====
check(/function\s+escapeAttr\s*\(/.test(html), 'escapeAttr helper function is missing');
const escapeBody = extractFunctionBody(html, 'escapeAttr');
check(escapeBody.length > 0, 'escapeAttr helper body could not be parsed');
check(escapeBody.includes('&amp;'), 'escapeAttr must escape & to &amp;');
check(escapeBody.includes('&lt;'), 'escapeAttr must escape < to &lt;');
check(escapeBody.includes('&gt;'), 'escapeAttr must escape > to &gt;');
check(escapeBody.includes('&quot;'), 'escapeAttr must escape " to &quot;');
check(escapeBody.includes('&#39;'), "escapeAttr must escape ' to &#39;");

// escapeAttr must be used in the ring-params rendering path / 必须在圈层参数渲染路径中使用
const ringParamsBody = extractFunctionBody(html, 'generateRingParams');
check(ringParamsBody.length > 0, 'generateRingParams body could not be parsed');
check(ringParamsBody.includes('escapeAttr('), 'escapeAttr is not used inside generateRingParams');

// ===== Batch 1: C-1 color whitelist + rotation clamp / 颜色白名单与角度钳制 =====
check(
    html.includes('[0-9a-fA-F]{8}') && html.includes('[0-9a-fA-F]{3}'),
    'color whitelist regex (3/4/6/8 hex digits) is missing'
);
check(
    ringParamsBody.includes('#000000'),
    'generateRingParams must fall back to #000000 for invalid colors'
);
check(
    /Number\.isFinite|Math\.min\(360,\s*Math\.max\(0,|Math\.max\(0,\s*Math\.min\(360,/.test(ringParamsBody),
    'generateRingParams must clamp rotation to 0-360 with a NaN guard'
);
check(
    /Array\.isArray\(ring\.segmentLabels\)/.test(ringParamsBody),
    'generateRingParams must guard segmentLabels with Array.isArray'
);

// ===== Batch 2: M-7 validateConfiguration null/type guards =====
const validateBody = extractMethodBody(html, 'validateConfiguration');
check(validateBody.length > 0, 'validateConfiguration body could not be parsed');
check(
    /!configuration\b|configuration\s*===\s*null|configuration\s*==\s*null|typeof\s+configuration\s*!==\s*['"]object['"]/.test(
        validateBody
    ),
    'validateConfiguration must guard against null/non-object configuration before dereferencing'
);
check(
    /Array\.isArray\(configuration\.rings\)/.test(validateBody),
    'validateConfiguration must guard rings with Array.isArray before calling forEach'
);

// ===== Batch 2: M-8 segmentLabels Array.isArray guards (load + render) =====
const applyRingBody = extractMethodBody(html, 'applyRingConfiguration');
check(applyRingBody.length > 0, 'applyRingConfiguration body could not be parsed');
check(
    /Array\.isArray\(ringConfig\.segmentLabels\)/.test(applyRingBody),
    'applyRingConfiguration must guard ringConfig.segmentLabels with Array.isArray (load path)'
);
const segmentLabelGuards = html.match(/Array\.isArray\(ring\.segmentLabels\)/g) || [];
check(
    segmentLabelGuards.length >= 2,
    'segmentLabels must be guarded with Array.isArray in both render and load paths (found ' +
        segmentLabelGuards.length +
        ')'
);
check(
    /Array\.isArray\(ring\.segmentLabels\)/.test(ringParamsBody),
    'generateRingParams must keep its Array.isArray segmentLabels guard (Batch 1 regression)'
);

// ===== Batch 2: L-5 download filename sanitization =====
const sanitizeBody = extractMethodBody(html, 'sanitizeFilename');
check(sanitizeBody.length > 0, 'sanitizeFilename helper is missing');
check(
    sanitizeBody.includes(String.raw`[\\/:*?"<>|]`),
    'sanitizeFilename must strip illegal filename characters [\\/:*?"<>|]'
);
check(
    sanitizeBody.includes(String.raw`/\.\./`),
    'sanitizeFilename must neutralize .. sequences'
);
check(
    /generateDefaultFilename/.test(sanitizeBody),
    'sanitizeFilename must fall back to a sensible default name when everything is stripped'
);
const executeSaveBody = extractMethodBody(html, 'executeFileSave');
check(executeSaveBody.length > 0, 'executeFileSave body could not be parsed');
check(
    executeSaveBody.includes('sanitizeFilename'),
    'executeFileSave must apply sanitizeFilename before setting a.download'
);

// ===== Batch 2: L-6 resetConfiguration resets names / language / theme =====
const resetBody = extractMethodBody(html, 'resetConfiguration');
check(resetBody.length > 0, 'resetConfiguration body could not be parsed');
check(
    /config\.centerNames\s*=/.test(resetBody),
    'resetConfiguration must reset config.centerNames'
);
check(
    resetBody.includes('I18nAPI.switchLanguage'),
    'resetConfiguration must change language via the I18nAPI switch language API'
);
check(
    !/currentLanguage\s*=\s*'en'/.test(resetBody),
    'resetConfiguration must not set currentLanguage directly (bypassing I18n state)'
);
check(
    /switchTheme\('light',\s*false\)/.test(resetBody),
    'resetConfiguration must apply the light theme without persisting it'
);
check(
    /switchTheme\(theme,\s*persist\s*=\s*true\)/.test(html),
    'ThemeManager.switchTheme must accept a persist flag'
);
check(
    /if\s*\(persist\)\s*\{?\s*this\.saveThemePreference\(theme\)/.test(html),
    'ThemeManager must only persist the theme preference when requested'
);

// ===== Batch 3: M-1 single-segment ring renders as a full circle =====
const segmentedBody = extractMethodBody(html, 'renderSegmentedRing');
check(segmentedBody.length > 0, 'renderSegmentedRing body could not be parsed');
check(
    /segmentCount\s*===\s*1|angleStep\s*>=\s*360|segmentCount\s*<=\s*1/.test(segmentedBody),
    'renderSegmentedRing must special-case a single segment (segmentCount === 1 / angleStep >= 360)'
);
check(
    /createRingPath|createCircle/.test(segmentedBody),
    'renderSegmentedRing single-segment branch must draw a full circle/ring'
);
check(/createRingPath\s*\(/.test(html), 'SVGShapes.createRingPath helper is missing');

// ===== Batch 3: M-2 renderSolidRing draws a true annulus =====
const solidRingBody = extractMethodBody(html, 'renderSolidRing');
check(solidRingBody.length > 0, 'renderSolidRing body could not be parsed');
check(
    /createRingPath|evenodd|fill-rule/.test(solidRingBody),
    'renderSolidRing must draw a true annulus (even-odd ring path) for the hole'
);
check(
    !/fill:\s*['"]transparent['"]/.test(solidRingBody),
    'renderSolidRing must not rely on a transparent-fill inner circle to punch the hole'
);

// ===== Batch 3: M-3 center text no longer clamps to an overflowing minimum =====
const fontSizeBody = extractMethodBody(html, 'calculateOptimalFontSize');
check(fontSizeBody.length > 0, 'calculateOptimalFontSize body could not be parsed');
check(
    !/,\s*minFontSize\s*\)/.test(fontSizeBody),
    'calculateOptimalFontSize must not clamp to a hard minimum (Math.max(..., minFontSize)) that overflows'
);
const centerTextBody = extractMethodBody(html, 'addCenterText');
check(centerTextBody.length > 0, 'addCenterText body could not be parsed');
check(
    /maxChars|wrapped|wrappedLines|\.slice\(/.test(centerTextBody),
    'addCenterText must wrap/scale long text so it never overflows the center circle'
);

// ===== Batch 3: L-1 normalizeAngle non-finite guard =====
const normalizeBody = extractMethodBody(html, 'normalizeAngle');
check(normalizeBody.length > 0, 'normalizeAngle body could not be parsed');
check(
    /Number\.isFinite/.test(normalizeBody),
    'normalizeAngle must guard against Infinity/NaN input with Number.isFinite'
);

// ===== Batch 4: H-4 lightweight transform during drag (no full rebuild per frame) =====
const moveBody = extractFunctionBody(html, 'handleMouseMove');
check(moveBody.length > 0, 'handleMouseMove body could not be parsed');
check(
    /setAttribute\(\s*['"]transform['"]/.test(moveBody),
    'handleMouseMove must update the ring transform with setAttribute("transform", ...) while dragging'
);
check(
    /rotate\(/.test(moveBody),
    'handleMouseMove must apply a rotate(...) transform while dragging'
);
check(
    !/generateCircle\s*\(/.test(moveBody),
    'handleMouseMove must not call generateCircle() per frame during drag'
);

// ===== Batch 4: M-4 rotation slider input is debounced =====
const rotationBody = extractFunctionBody(html, 'updateRingRotation');
check(rotationBody.length > 0, 'updateRingRotation body could not be parsed');
check(
    /debouncedRegenerate\s*\(/.test(rotationBody),
    'updateRingRotation must reuse the existing debouncedRegenerate() instead of redrawing on every input'
);
check(
    !/generateCircle\s*\(/.test(rotationBody),
    'updateRingRotation must not call generateCircle() directly on every slider input event'
);
check(
    /function\s+flushRegenerate\s*\(/.test(html),
    'a flushRegenerate helper must exist so the final slider value is still applied'
);
check(
    /onchange="applyRingRotation/.test(html) || /onchange="[^"]*flushRegenerate/.test(html),
    'the rotation slider/number inputs must flush the debounced redraw on change/end'
);

// ===== Batch 4: M-5 preventDefault only after a drag has actually started =====
const movePdIndex = moveBody.indexOf('preventDefault');
const moveGuardIndex = moveBody.search(/isDragging/);
check(
    moveGuardIndex !== -1 && movePdIndex > moveGuardIndex,
    'handleMouseMove must confirm a drag (isDragging) before calling preventDefault()'
);

// ===== Batch 4: M-6 window blur resets drag state =====
check(
    /window\.addEventListener\(\s*['"]blur['"]/.test(html),
    'a window "blur" listener must be registered to reset drag state'
);
const resetDragBody = extractFunctionBody(html, 'resetDragState');
check(resetDragBody.length > 0, 'resetDragState helper is missing');
check(
    /isDragging\s*=\s*false/.test(resetDragBody),
    'resetDragState must set isDragging = false'
);
check(
    /userSelect\s*=\s*''/.test(resetDragBody),
    'resetDragState must restore document.body.style.userSelect'
);
check(
    /window\.addEventListener\(\s*['"]blur['"]\s*,\s*resetDragState/.test(html),
    'window blur must be bound to the resetDragState handler'
);

// ===== Batch 5: M-9/M-10 config-row button specificity + defined accent variable =====
const configBtnMatch = html.match(/\.param-group\s+\.config-row button\s*\{/);
check(
    Boolean(configBtnMatch),
    '.config-row button must out-specify .param-group button (e.g. .param-group .config-row button) so the config button design wins'
);
const accentRefs = (html.match(/var\(--accent-color\)/g) || []).length;
const accentDefs = (html.match(/--accent-color\s*:/g) || []).length;
check(
    accentRefs === 0 || accentDefs >= 1,
    '--accent-color is referenced but never defined in :root / dark theme'
);

// ===== Batch 5: M-11 h1 uses the theme text color =====
const h1RuleMatch = html.match(/[^\w.-]h1\s*\{([^}]*)\}/);
const h1Rule = h1RuleMatch ? h1RuleMatch[1] : '';
check(h1Rule.length > 0, 'h1 rule could not be parsed');
check(/color\s*:\s*var\(--text-color\)/.test(h1Rule), 'h1 must use var(--text-color) so it stays visible in dark theme');
check(!/color\s*:\s*#333\b/.test(h1Rule), 'h1 must no longer hardcode color: #333');

// ===== Batch 5: M-12 manual-input uses theme variables =====
const manualInputMatch = html.match(/\.manual-input\s*\{([^}]*)\}/);
const manualInputRule = manualInputMatch ? manualInputMatch[1] : '';
check(manualInputRule.length > 0, '.manual-input rule could not be parsed');
check(
    !/background(-color)?\s*:\s*#f9f9f9/.test(manualInputRule),
    '.manual-input must not hardcode background #f9f9f9'
);
check(
    /background(-color)?\s*:\s*var\(--/.test(manualInputRule),
    '.manual-input must use a theme variable for its background'
);
const manualInputChildMatch = html.match(/\.manual-input input\s*\{([^}]*)\}/);
const manualInputChildRule = manualInputChildMatch ? manualInputChildMatch[1] : '';
check(manualInputChildRule.length > 0, '.manual-input input rule could not be parsed');
check(
    /(background-color|background)\s*:\s*var\(--/.test(manualInputChildRule) &&
        /color\s*:\s*var\(--text-color\)/.test(manualInputChildRule),
    '.manual-input input must pick up theme variables (input bg + text color) for dark theme'
);

// ===== Batch 5: L-3 aspect-ratio media query boundaries are exclusive =====
check(
    /@media[^{]*\(min-aspect-ratio:\s*1\/1\)/.test(html),
    'the wide-layout media query must still use min-aspect-ratio: 1/1'
);
check(
    /@media[^{]*\(max-aspect-ratio:\s*9999\/10000\)/.test(html),
    'the narrow-layout media query must use max-aspect-ratio: 9999/10000 to avoid overlap at exactly 1/1'
);
check(
    !/\(max-aspect-ratio:\s*1\/1\)/.test(html),
    'no media query may use max-aspect-ratio: 1/1 because it overlaps min-aspect-ratio: 1/1 at exactly 1:1'
);

// ===== Batch 5: L-2 language switch keeps <html lang> in sync =====
check(
    /document\.documentElement\.lang\s*=/.test(html),
    'language switching must update <html lang> via document.documentElement.lang'
);
check(
    /document\.documentElement\.lang\s*=\s*[^;]*('zh-CN'|zh-CN|'zh')/.test(html),
    'document.documentElement.lang must map zh to zh-CN'
);
const switchLangBody = extractFunctionBody(html, 'switchLanguage');
check(switchLangBody.length > 0, 'switchLanguage body could not be parsed');
check(
    switchLangBody.includes('document.documentElement.lang'),
    'the global switchLanguage() must sync <html lang>'
);

// ===== Batch 6: L-4 clipboard fallback must honor execCommand() result =====
const copySvgBody = extractFunctionBody(html, 'copySVG');
check(copySvgBody.length > 0, 'copySVG body could not be parsed');
check(
    /let\s+successful\s*=\s*false/.test(copySvgBody),
    'copySVG fallback must initialize a copy-result flag (let successful = false)'
);
check(
    /try\s*\{\s*successful\s*=\s*document\.execCommand\(\s*['"]copy['"]\s*\)/.test(copySvgBody),
    "copySVG fallback must capture document.execCommand('copy') inside try{}"
);
check(
    /\}\s*catch[^)]*\)\s*\{[\s\S]*?successful\s*=\s*false/.test(copySvgBody),
    'copySVG fallback must catch execCommand exceptions and treat them as failure'
);
check(
    /alert\(\s*successful\s*\?\s*t\.copySuccess\s*:\s*t\.copyError\s*\)/.test(copySvgBody),
    'copySVG fallback must alert based on the execCommand result'
);

// ===== Batch 6: H-5 ring labels stay upright while dragging =====
const moveBodyLabels = extractFunctionBody(html, 'handleMouseMove');
check(
    !/labelRing\$\{/.test(moveBodyLabels),
    'handleMouseMove must not rigidly rotate the labelRing group (upright labels would tilt mid-drag)'
);
check(
    /refreshRingLabels\s*\(/.test(moveBodyLabels),
    'handleMouseMove must reposition labels via refreshRingLabels() so they stay upright'
);
const refreshLabelsBody = extractMethodBody(html, 'refreshRingLabels');
check(refreshLabelsBody.length > 0, 'RingRenderer.refreshRingLabels method is missing');
check(
    /labelRing\$\{ringIndex\}/.test(refreshLabelsBody) || /labelRing/.test(refreshLabelsBody),
    'refreshRingLabels must target the existing labelRing group before rebuilding it'
);
check(
    /renderRingLabels\s*\(/.test(refreshLabelsBody),
    'refreshRingLabels must delegate to renderRingLabels() for consistent label placement'
);

// ===== Batch 7: S-4 keep default labels when imported segmentLabels is empty =====
const applyRingConfigBody = extractMethodBody(html, 'applyRingConfiguration');
check(applyRingConfigBody.length > 0, 'applyRingConfiguration body could not be parsed');
check(
    /ringConfig\.segmentLabels\.length\s*>\s*0/.test(applyRingConfigBody),
    'applyRingConfiguration must treat an empty imported segmentLabels array as absent so defaults survive'
);
check(
    !/\?\s*ringConfig\.segmentLabels\s*:\s*\[\s*\]/.test(applyRingConfigBody),
    'applyRingConfiguration must not normalize missing segmentLabels to an empty array (would drop defaults)'
);

// ===== Batch 7: S-9 eliminate dark-theme flash on load =====
const firstStyleIndex = html.indexOf('<style');
const earlyThemeReadIndex = html.indexOf("localStorage.getItem('selectedTheme')");
check(
    earlyThemeReadIndex !== -1 && firstStyleIndex !== -1 && earlyThemeReadIndex < firstStyleIndex,
    'an inline theme script must read selectedTheme before the first <style> so the saved theme applies before first paint'
);
check(
    /<html[^>]*\sdata-theme="light"/.test(html),
    'the <html> element must declare a default data-theme="light"'
);
const earlyThemeScript = firstStyleIndex === -1 ? '' : html.slice(0, firstStyleIndex);
check(
    /try\s*\{[\s\S]*?localStorage\.getItem\('selectedTheme'\)[\s\S]*?\}\s*catch\s*\(/.test(earlyThemeScript),
    'the early theme script must wrap its localStorage access in try/catch'
);
check(
    /setAttribute\(\s*['"]data-theme['"]\s*,\s*(savedTheme|theme)\s*\)/.test(earlyThemeScript),
    'the early theme script must apply the resolved theme via setAttribute'
);
check(
    /:\s*'light'/.test(earlyThemeScript),
    "the early theme script must fall back to 'light' when no saved theme is present"
);
check(
    !/:\s*'system'/.test(earlyThemeScript),
    "the early theme script must not fall back to 'system'"
);
check(
    earlyThemeScript.includes("setAttribute('data-theme', 'light')"),
    "the early theme script catch path must set data-theme to 'light'"
);
check(
    extractMethodBody(html, 'loadThemePreference').includes("return 'light'"),
    "loadThemePreference must default to 'light'"
);

// ===== Batch 7: S-3 sync i18n state when applying configuration =====
const applyConfigBody = extractMethodBody(html, 'applyConfiguration');
check(applyConfigBody.length > 0, 'applyConfiguration body could not be parsed');
check(
    /I18nAPI\.switchLanguage\s*\(/.test(applyConfigBody),
    'applyConfiguration must switch language through I18nAPI.switchLanguage()'
);
check(
    !/currentLanguage\s*=\s*configuration\.language\s*;/.test(applyConfigBody),
    'applyConfiguration must not assign currentLanguage directly (bypasses i18n observers)'
);

// ===== Batch 7: S-6 coerce rotation to number to avoid string concatenation =====
const rotatedPointBody = extractMethodBody(html, 'getPointOnCircleWithRotation');
check(rotatedPointBody.length > 0, 'getPointOnCircleWithRotation body could not be parsed');
check(
    /Number\(\s*angleDegrees\s*\)/.test(rotatedPointBody) && /Number\(\s*rotationDegrees\s*\)/.test(rotatedPointBody),
    'getPointOnCircleWithRotation must coerce angle and rotation to numbers before adding them'
);

// ===== Batch 7: S-12 adaptive font size for ring labels in narrow rings =====
const renderRingLabelsBody = extractMethodBody(html, 'renderRingLabels');
check(renderRingLabelsBody.length > 0, 'renderRingLabels body could not be parsed');
check(
    /calculateOptimalFontSize\s*\(/.test(renderRingLabelsBody),
    'renderRingLabels must compute an adaptive font size via calculateOptimalFontSize()'
);
check(
    /Math\.max\(\s*6/.test(renderRingLabelsBody) && /Math\.min\(\s*14/.test(renderRingLabelsBody),
    'renderRingLabels must clamp the adaptive font size to [6, 14]'
);
check(
    /createSegmentText\s*\([\s\S]*?fontSize/.test(renderRingLabelsBody),
    'renderRingLabels must forward the computed fontSize to createSegmentText()'
);
const createSegmentTextBody = extractMethodBody(html, 'createSegmentText');
check(createSegmentTextBody.length > 0, 'createSegmentText body could not be parsed');
check(
    /options/.test(createSegmentTextBody) && /fontSize/.test(createSegmentTextBody),
    'createSegmentText must accept and forward a fontSize option'
);

// ===== Batch 7: S-2 remove dead selector and S-5 guard zero scale =====
check(
    !html.includes('content-input'),
    'index.html must not keep the dead .content-input CSS rule (no element uses it)'
);
const distanceFromCenterBody = extractFunctionBody(html, 'getDistanceFromCenter');
check(distanceFromCenterBody.length > 0, 'getDistanceFromCenter body could not be parsed');
check(
    /Number\.isFinite\(\s*avgScale\s*\)/.test(distanceFromCenterBody),
    'getDistanceFromCenter must guard against a zero/non-finite average scale'
);

// ===== Batch 8: default legend position is bottomRight =====
check(
    /legendPosition:\s*'bottomRight'/.test(html),
    "default config must set legendPosition to 'bottomRight'"
);
check(
    !/legendPosition:\s*'right'/.test(html),
    "default config must not set legendPosition to 'right'"
);
check(
    /getElementById\('legendPosition'\)\.value\s*=\s*'bottomRight'/.test(html),
    "resetConfiguration must reset the legend position select to 'bottomRight'"
);
check(
    /config\.legendPosition\s*=\s*'bottomRight'/.test(html),
    "resetConfiguration must reset config.legendPosition to 'bottomRight'"
);
check(
    /legendPosition:\s*document\.getElementById\('legendPosition'\)\?\.value\s*\|\|\s*'bottomRight'/.test(html),
    "buildConfigurationObject must fall back to 'bottomRight' when the select is missing"
);
check(
    /value="bottomRight"[^>]*\bselected\b/.test(html),
    'the bottomRight <option> must be marked selected in the legend position select'
);
check(
    !/value="right"[^>]*\bselected\b/.test(html),
    'the right <option> must not be marked selected'
);

// ===== Batch 9: hover ring highlight overlay (Feature 3) =====
check(html.includes('ringHoverHighlight'), 'hover highlight overlay id ringHoverHighlight is missing');
check(
    /id:\s*['"]ringHoverHighlight['"]/.test(html),
    'ringHoverHighlight must be created with an id attribute'
);
check(
    /ringHoverHighlight[\s\S]{0,220}pointer-events/.test(html),
    'the hover highlight overlay must be pointer-events: none so it never captures the mouse'
);
const updateHoverBody = extractFunctionBody(html, 'updateHoverFeedback');
check(updateHoverBody.length > 0, 'updateHoverFeedback helper body could not be parsed');
check(
    updateHoverBody.includes('ringHoverHighlight'),
    'updateHoverFeedback must reference ringHoverHighlight'
);
check(
    updateHoverBody.includes('lastHoverIndex'),
    'updateHoverFeedback must track lastHoverIndex to avoid needless rebuilding'
);
check(
    updateHoverBody.includes("setAttribute('d'"),
    "updateHoverFeedback must update the highlight path with setAttribute('d', ...)"
);
check(
    updateHoverBody.includes('style.display'),
    'updateHoverFeedback must toggle the overlay via style.display'
);
const moveBodyHover = extractFunctionBody(html, 'handleMouseMove');
check(
    moveBodyHover.includes('getRingIndexFromRadius'),
    'handleMouseMove must compute the ring index via getRingIndexFromRadius'
);
check(
    moveBodyHover.includes('updateHoverFeedback'),
    'handleMouseMove must wire in updateHoverFeedback for hover feedback'
);
check(
    html.includes('lastHoverIndex = -1'),
    'lastHoverIndex must be reset to -1 when the SVG is rebuilt'
);

// ===== Batch 9: drag tooltip (Feature 4) =====
check(html.includes('id="ringHoverTooltip"'), 'hover tooltip element id ringHoverTooltip is missing');
check(html.includes('按住并拖动可旋转'), 'tooltip must include Chinese text 按住并拖动可旋转');
check(html.includes('Hold & drag to rotate'), 'tooltip must include English text "Hold & drag to rotate"');
const scheduleTooltipBody = extractFunctionBody(html, 'scheduleTooltipPosition');
check(scheduleTooltipBody.length > 0, 'scheduleTooltipPosition helper body could not be parsed');
check(
    scheduleTooltipBody.includes('requestAnimationFrame'),
    'scheduleTooltipPosition must throttle via requestAnimationFrame'
);
check(
    scheduleTooltipBody.includes('hoverTooltipFrame'),
    'scheduleTooltipPosition must track the hoverTooltipFrame handle'
);
check(
    /style\.transform\s*=\s*`translate/.test(html),
    'tooltip must be positioned with style.transform = `translate(...)` instead of left/top'
);
check(
    /#ringHoverTooltip\s*\{[^}]*pointer-events\s*:\s*none/.test(html),
    'tooltip CSS must set pointer-events: none'
);

// ===== Batch 10: hover tooltip shows ring number + content (Feature A) =====
check(/getRingDisplayContent\s*\(/.test(html), 'Legend.getRingDisplayContent helper is missing');
check(
    extractMethodBody(html, 'createLegendItem').includes('getRingDisplayContent'),
    'createLegendItem must delegate display content to getRingDisplayContent'
);
check(
    extractMethodBody(html, 'calculateLegendDimensions').includes('getRingDisplayContent'),
    'calculateLegendDimensions must delegate display content to getRingDisplayContent'
);
check(html.includes('id="ringTooltipTitle"'), 'tooltip must include the #ringTooltipTitle line');
const updateHoverBodyA = extractFunctionBody(html, 'updateHoverFeedback');
check(
    updateHoverBodyA.includes('getRingDisplayContent'),
    'updateHoverFeedback must compute the hovered ring content via getRingDisplayContent'
);
check(updateHoverBodyA.includes('ringTooltipTitle'), 'updateHoverFeedback must update ringTooltipTitle');
check(updateHoverBodyA.includes("' · '"), 'updateHoverFeedback must format the title as "#N · content"');
check(updateHoverBodyA.includes("'#'"), 'updateHoverFeedback must prefix the title with #');

// ===== Batch 10: legend row highlight on hover (Feature B) =====
check(html.includes('legendItem'), 'legend items must be wrapped with a legendItem id');
check(/id:\s*`legendItem\$\{index\}`/.test(html), 'legend item group id must interpolate the ring index');
check(html.includes('data-legend-index'), 'legend item group must carry data-legend-index');
check(html.includes('legendHighlight'), 'legend highlight rect is missing');
check(
    /id:\s*['"]legendHighlight['"]/.test(html),
    "legend highlight rect must be created with id 'legendHighlight'"
);
check(
    extractFunctionBody(html, 'updateHoverFeedback').includes('legendHighlight'),
    'updateHoverFeedback must position/show the legend highlight'
);
check(
    extractMethodBody(html, 'createLegendItem').includes('legendItem'),
    'createLegendItem must group its row under legendItem{index}'
);

// ===== Batch 10: stronger hovered ring highlight (Feature C) =====
const hoverOverlayIndex = html.indexOf('ringHoverHighlight = SVGUtils.createSVGElement');
const hoverOverlaySlice = hoverOverlayIndex === -1 ? '' : html.slice(hoverOverlayIndex, hoverOverlayIndex + 1000);
check(hoverOverlayIndex !== -1, 'ringHoverHighlight creation site could not be found');
check(/fill-opacity:\s*0\.35/.test(hoverOverlaySlice), 'hover overlay fill-opacity must be strengthened to 0.35');
check(
    /stroke-width:\s*1\.5|stroke-width:\s*2/.test(hoverOverlaySlice),
    'hover overlay stroke-width must be strengthened (1.5 or 2)'
);
check(/pointer-events:\s*none/.test(hoverOverlaySlice), 'hover overlay must keep pointer-events: none');

// ===== Batch 10: colored legend rows with white text (Feature D) =====
const createLegendItemBodyD = extractMethodBody(html, 'createLegendItem');
check(
    createLegendItemBodyD.includes('getRingSegmentConfig'),
    'createLegendItem must derive segment colors via getRingSegmentConfig'
);
check(createLegendItemBodyD.includes('ring.color'), 'createLegendItem must use ring.color for solid rows');
// Discriminating: baseline legend rows used bg fills only, no text paint-order / 判别性：基线仅用背景填充，文字无描边
check(
    createLegendItemBodyD.includes("'paint-order': 'stroke'"),
    'legend number/content text must use paint-order:stroke so white text stays legible'
);
check(
    createLegendItemBodyD.includes("stroke: 'rgba(0,0,0,.35)'"),
    'legend text must keep a subtle dark stroke for legibility on light row colors'
);
check(
    createLegendItemBodyD.includes('numberWidth + contentWidth'),
    'legend row background must span numberWidth + contentWidth'
);
check(
    extractMethodBody(html, 'createLegendHeaders').includes('#f8f9fa'),
    'legend headers must keep their neutral #f8f9fa background'
);

// ===== Batch 11: ring card vertical left index column (Feature E) / 圈卡片左侧竖排序号（特性 E） =====
const ringParamsCardBody = extractFunctionBody(html, 'generateRingParams');
check(ringParamsCardBody.length > 0, 'generateRingParams body could not be parsed');
check(
    ringParamsCardBody.includes('ring-index'),
    'generateRingParams must render a .ring-index number column'
);
check(
    ringParamsCardBody.includes('ring-body'),
    'generateRingParams must wrap the card content in .ring-body'
);
check(
    !/<h4>\$\{getText\('ring'\)\}/.test(ringParamsCardBody),
    'generateRingParams must no longer render the <h4> getText(ring) title'
);
const ringParamsRuleMatch = html.match(/[^\w.-]\.ring-params\s*\{([^}]*)\}/);
check(!!ringParamsRuleMatch, '.ring-params CSS rule could not be extracted');
check(
    !!ringParamsRuleMatch && /display\s*:\s*flex/.test(ringParamsRuleMatch[1]),
    '.ring-params must use display: flex for the horizontal card layout'
);
const ringIndexRuleMatch = html.match(/[^\w.-]\.ring-index\s*\{([^}]*)\}/);
check(!!ringIndexRuleMatch, '.ring-index CSS rule could not be extracted');
const ringIndexRule = ringIndexRuleMatch ? ringIndexRuleMatch[1] : '';
check(
    !/writing-mode/.test(ringIndexRule),
    '.ring-index must not declare writing-mode (ring index digits must stay upright)'
);
check(
    !/text-orientation/.test(ringIndexRule),
    '.ring-index must not declare text-orientation (ring index digits must stay upright)'
);
check(
    !/rotate\(/.test(ringIndexRule),
    '.ring-index must not rotate its number (ring index digits must stay upright)'
);
check(
    /display\s*:\s*flex/.test(ringIndexRule),
    '.ring-index must use display: flex to center its number'
);
check(
    /align-items\s*:\s*center/.test(ringIndexRule),
    '.ring-index must center its number vertically (align-items: center)'
);
check(
    /justify-content\s*:\s*center/.test(ringIndexRule),
    '.ring-index must center its number horizontally (justify-content: center)'
);
check(
    /flex\s*:\s*0\s+0\s+30px/.test(ringIndexRule),
    '.ring-index must reserve 30px width (flex: 0 0 30px) for two-digit ring numbers'
);
check(
    !/\.ring-params\s+h4\s*\{/.test(html),
    'unused .ring-params h4 CSS rule must be removed'
);

// ===== Batch 12: localized hover tooltip hint (Feature F) / 悬停提示本地化（特性 F） =====
const dragHintDefs = html.match(/dragRotateHint\s*:/g) || [];
check(
    dragHintDefs.length >= 2,
    'i18n must define dragRotateHint for both zh and en (expected >= 2 definitions)'
);
check(html.includes('✋ 按住并拖动可旋转'), 'zh dragRotateHint literal is missing');
check(html.includes('✋ Hold & drag to rotate'), 'en dragRotateHint literal is missing');
check(
    html.includes('id="ringTooltipHint"'),
    'tooltip hint element must have id="ringTooltipHint"'
);
const updateUILanguageBody = extractFunctionBody(html, 'updateUILanguage');
check(updateUILanguageBody.length > 0, 'updateUILanguage body could not be parsed');
check(
    updateUILanguageBody.includes('dragRotateHint'),
    'updateUILanguage must set the dragRotateHint text for the current language'
);
check(
    updateUILanguageBody.includes('ringTooltipHint'),
    'updateUILanguage must target the ringTooltipHint element'
);
check(
    !html.includes('按住并拖动可旋转 / Hold'),
    'old hardcoded bilingual tooltip must be removed'
);

// ===== Batch 13: config buttons moved into basic-params header row / 配置按钮移入基本参数标题行 =====
check(
    html.includes('class="param-group-header"'),
    'the basic-params header must use class="param-group-header"'
);
const headerSliceIndex = html.indexOf('class="param-group-header"');
const headerSlice = headerSliceIndex === -1 ? '' : html.slice(headerSliceIndex, headerSliceIndex + 700);
check(
    headerSlice.includes('id="basicParamsTitle"') &&
        headerSlice.includes('class="config-row"') &&
        headerSlice.includes('id="saveConfigBtn"') &&
        headerSlice.includes('id="loadConfigBtn"'),
    'the basic-params header slice must contain basicParamsTitle, a config-row, and both config buttons'
);
check(
    !/class="param-row config-row"/.test(html),
    'the old bottom config row (class="param-row config-row") must be removed'
);
check(
    !/class="config-row param-row"/.test(html),
    'the old bottom config row (class="config-row param-row") must be removed'
);
const headerConfigRowMatch = html.match(/[^\w.-]\.param-group-header\s+\.config-row\s*\{([^}]*)\}/);
check(!!headerConfigRowMatch, '.param-group-header .config-row CSS rule could not be extracted');
check(
    !!headerConfigRowMatch && /border-top\s*:\s*none/.test(headerConfigRowMatch[1]),
    '.param-group-header .config-row must remove the separator with border-top: none'
);
const headerConfigBtnMatch = html.match(/[^\w.-]\.param-group-header\s+\.config-row\s+button\s*\{([^}]*)\}/);
check(!!headerConfigBtnMatch, '.param-group-header .config-row button override rule is missing');
check(
    !!headerConfigBtnMatch &&
        /padding\s*:\s*4px\s+8px/.test(headerConfigBtnMatch[1]) &&
        /font-size\s*:\s*12px/.test(headerConfigBtnMatch[1]),
    '.param-group-header .config-row button override must use padding: 4px 8px and font-size: 12px'
);
check(
    (html.match(/\.param-group-header\s+\.config-row\s+button/g) || []).length >= 2,
    'the .param-group-header .config-row button token must appear at least twice (desktop + touch override)'
);
check(html.includes("saveConfig: '💾 保存'"), "zh i18n saveConfig must be compact '💾 保存'");
check(html.includes("loadConfig: '📂 载入'"), "zh i18n loadConfig must be compact '📂 载入'");
check(html.includes("saveConfig: '💾 Save'"), "en i18n saveConfig must be compact '💾 Save'");
check(html.includes("loadConfig: '📂 Load'"), "en i18n loadConfig must be compact '📂 Load'");
check(
    !/saveConfig:\s*'[^']*保存配置/.test(html),
    'the old zh saveConfig literal 保存配置 must be gone from the saveConfig key'
);
check(
    !/loadConfig:\s*'[^']*载入配置/.test(html),
    'the old zh loadConfig literal 载入配置 must be gone from the loadConfig key'
);
check(!html.includes('💾 保存配置'), 'the old zh button text 💾 保存配置 must be removed');
check(!html.includes('📂 载入配置'), 'the old zh button text 📂 载入配置 must be removed');

// ===== Batch 14: balanced inner padding by dropping trailing margins / 平衡内边距：去除末尾元素下外边距 =====
const paramGroupLastChildMatch = html.match(/[^\w.-]\.param-group\s*>\s*:last-child\s*\{([^}]*)\}/);
check(!!paramGroupLastChildMatch, '.param-group > :last-child trailing-margin rule is missing');
check(
    !!paramGroupLastChildMatch && /margin-bottom\s*:\s*0/.test(paramGroupLastChildMatch[1]),
    '.param-group > :last-child must zero the trailing margin-bottom so its inner padding stays balanced'
);
const ringBodyLastChildMatch = html.match(/[^\w.-]\.ring-body\s*>\s*:last-child\s*\{([^}]*)\}/);
check(!!ringBodyLastChildMatch, '.ring-body > :last-child trailing-margin rule is missing');
check(
    !!ringBodyLastChildMatch && /margin-bottom\s*:\s*0/.test(ringBodyLastChildMatch[1]),
    '.ring-body > :last-child must zero the trailing margin-bottom so top/bottom padding both equal 15px'
);
const ringParamsLastChildMatch = html.match(/[^\w.-]\.ring-params:last-child\s*\{([^}]*)\}/);
check(!!ringParamsLastChildMatch, '.ring-params:last-child trailing-margin rule is missing');
check(
    !!ringParamsLastChildMatch && /margin-bottom\s*:\s*0/.test(ringParamsLastChildMatch[1]),
    'the final .ring-params card must zero its margin-bottom so the ring-config group has no extra 15px'
);

if (failures.length > 0) {
    for (const failure of failures) {
        console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
}

console.log('regression test passed');
