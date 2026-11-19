// Tests for main.ts: two runs with different MAKEFUN_OUTPUT_DIR write byte-identical dossier.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const repo = dirname(fileURLToPath(import.meta.url)) + '/..';

function runMain(outDir) {
  execFileSync('node', ['main.ts'], { cwd: repo, env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir }, stdio: 'pipe' });
}

test('main.ts runs twice and writes byte-identical dossier.json', () => {
  const a = mkdtempSync(join(tmpdir(), 'gta6-out-a-'));
  const b = mkdtempSync(join(tmpdir(), 'gta6-out-b-'));
  runMain(a);
  runMain(b);
  const da = readFileSync(join(a, 'dossier.json'));
  const db = readFileSync(join(b, 'dossier.json'));
  assert.ok(da.equals(db), 'dossier.json differs between runs');
  assert.ok(existsSync(join(a, 'app', 'index.html')));
  assert.ok(existsSync(join(a, 'app', 'data', 'trophies.json')));
  const shots = ['1-checklist.jpg', '2-guide.jpg', '3-roadmap.jpg', '4-spoiler.jpg'];
  for (const s of shots) assert.ok(existsSync(join(a, 'screenshots', s)), `missing screenshot ${s}`);
});
