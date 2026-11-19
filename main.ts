// Hand in the Leonida trophy guide: a static, offline web app that lives in
// this repository under app/ (index.html, app.js, tracker.js, style.css and
// data/trophies.json) with its screenshots in screenshots/.
//
// What this program does, in plain terms: it copies app/ and screenshots/
// into the grader's output folder and then asks the vendored make.fun
// library to write dossier.json there — the summary the judge reads (the
// screenshots, the first load's files and bytes, and the entry's own source).
// Nothing here is installed or downloaded: Node 22's standard library only.
// vendor/makefun-frontend.ts is the kit's copy and must stay untouched, or
// the scorer's own rebuild of the dossier will not match byte for byte.
//
// The output folder defaults to /output inside the grader. Outside it, set
// MAKEFUN_OUTPUT_DIR to a local directory instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice into two different folders and the two dossier.json files
// must come out byte-identical — the entry is graded on both runs.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder this file sits in; the output folder is
// the grader's /output unless MAKEFUN_OUTPUT_DIR says otherwise.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's gate so a build that would be refused fails
// loudly here instead: at most 4 screenshots of 256 KiB each, at most 993
// files and directories totalling 48 MiB under app/, and the judge's text
// view capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
