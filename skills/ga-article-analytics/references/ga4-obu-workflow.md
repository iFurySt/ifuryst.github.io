# GA4 OBU Workflow

## Property

- GA UI: `https://analytics.google.com/analytics/web/`
- Account/property path observed for this site: `#/a355987152p490146313/...`
- Site: `https://ifuryst.github.io`
- Measurement ID observed in repo: `G-6Y91Y4PCLJ`

Use OBU read-only. Do not change GA settings, conversions, audiences, filters, or property configuration unless the user explicitly asks.

## Setup

1. Name the browser session, for example `GA article report - OBU`.
2. Open the report URL.
3. Wait for page load.
4. If a tutorial/modal blocks interaction, click `GOT IT` or close it.
5. Set rows per page to `250` when possible.
6. Extract `document.body.innerText` or use the snippets below.

## Useful Report URLs

Landing pages:

```text
https://analytics.google.com/analytics/web/#/a355987152p490146313/reports/explorer?params=_r.explorerCard..selmet%3D%5B%22sessions%22%5D%26_r.explorerCard..seldim%3D%5B%22landingPagePlusQueryString%22%5D%26_r.explorerCard..rowsPerPage%3D250&r=landing-page
```

Pages and screens by page path:

```text
https://analytics.google.com/analytics/web/#/a355987152p490146313/reports/explorer?params=_r.explorerCard..selmet%3D%5B%22screenPageViews%22%2C%22activeUsers%22%2C%22userEngagementDuration%22%5D%26_r.explorerCard..seldim%3D%5B%22unifiedPagePathScreen%22%5D%26_r.explorerCard..rowsPerPage%3D250&r=all-pages-and-screens
```

Traffic acquisition by source / medium:

```text
https://analytics.google.com/analytics/web/#/a355987152p490146313/reports/explorer?params=_r.explorerCard..selmet%3D%5B%22sessions%22%2C%22engagedSessions%22%2C%22averageSessionDuration%22%5D%26_r.explorerCard..seldim%3D%5B%22sessionSourceMedium%22%5D%26_r.explorerCard..rowsPerPage%3D250&r=lifecycle-traffic-acquisition-v2
```

Country detail:

```text
https://analytics.google.com/analytics/web/#/a355987152p490146313/reports/explorer?params=_r.explorerCard..selmet%3D%5B%22activeUsers%22%2C%22screenPageViews%22%2C%22engagedSessions%22%5D%26_r.explorerCard..seldim%3D%5B%22countryId%22%5D%26_r.explorerCard..rowsPerPage%3D250&r=user-demographics-detail
```

## Extraction Snippets

Read visible table text:

```js
document.body.innerText
```

Set rows per page to 250 if the selector is visible:

```js
(() => {
  const close = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'GOT IT');
  if (close) close.click();
  const sel = [...document.querySelectorAll('mat-select')].find(x => x.innerText.trim() === '10');
  if (sel) sel.click();
  setTimeout(() => {
    const opt = [...document.querySelectorAll('mat-option, [role=option]')].find(o => o.innerText.trim() === '250');
    if (opt) opt.click();
  }, 300);
})();
```

Parse visible rows in-browser:

```js
(() => {
  const lines = document.body.innerText.split('\n').map(l => l.trim()).filter(l => /^\d+\t/.test(l));
  return {
    range: (document.body.innerText.match(/\b\d+-\d+ of \d+\b/) || [null])[0],
    rows: lines
  };
})();
```

Click next page:

```js
(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Next Page');
  if (b && !b.disabled && b.getAttribute('aria-disabled') !== 'true') {
    b.click();
    return true;
  }
  return false;
})();
```

## Interpretation Notes

- `Pages and screens` answers what was read overall.
- `Landing page` answers which pages acquired sessions.
- `Source / medium` answers where traffic came from.
- Direct can include self-visits, missing referrers, previews, or app opens. Downweight it if the user says it is likely self-traffic.
- English paths can be generated and tracked but still show low traffic; distinguish tracking failure from low demand.
- Some very high views per user values can be one person rereading or testing; do not overgeneralize from tiny user counts.
