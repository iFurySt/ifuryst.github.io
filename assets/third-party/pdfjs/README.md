# PDF.js

Mozilla PDF.js (`pdfjs-dist`), version **6.4.299**, Apache-2.0.

Source: https://github.com/mozilla/pdf.js
Distribution: https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.4.299.tgz

`build/pdf.min.mjs` and `build/pdf.worker.min.mjs` are stored as `pdf.js`
and `pdf.worker.js`, so static servers send the JavaScript MIME type. They
remain ES modules. CMaps, standard fonts and WASM codecs are copied from
the same distribution, with their licenses. Keep the library and worker on
the same version when upgrading. These assets are served locally by the site.
