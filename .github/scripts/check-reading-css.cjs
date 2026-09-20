// Run against the final CSS: development builds do not exercise all minifiers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const postcss = require('postcss');

const css = postcss.parse(fs.readFileSync(process.argv[2] || '_site/assets/css/main.css', 'utf8'));
let checked = false;
css.walkRules('.container.reading-shell .reading-toc', (rule) => {
  if (rule.parent.type !== 'atrule' || !/min-width:\s*1200px/.test(rule.parent.params)) return;
  rule.walkDecls('right', ({ value }) => {
    // CSS requires whitespace around binary +. CSSminify2 used to strip it.
    assert.match(value, /^calc\(100%\s+\+\s+32px\)$/, 'Desktop TOC offset was corrupted during production CSS processing');
    checked = true;
  });
});
assert.ok(checked, 'Desktop TOC positioning rule is missing from production CSS');
console.log('Production desktop TOC positioning is intact.');
