// Bundle the renderer (app.js + three.js) into dist/ and copy static files.

'use strict';

const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

async function main() {
  fs.mkdirSync(dist, { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(root, 'src', 'renderer', 'app.js')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'chrome120',
    outfile: path.join(dist, 'renderer.bundle.js'),
    minify: false,
    sourcemap: false,
    logLevel: 'info',
  });

  for (const f of ['index.html', 'styles.css']) {
    fs.copyFileSync(path.join(root, 'src', 'renderer', f), path.join(dist, f));
  }
  console.log('[build] renderer bundled to dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
