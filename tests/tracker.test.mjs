// Tests for app/tracker.js: pure tracker logic (filter, search, progress, spoiler, export/import).
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTrophies, searchTrophies, computeProgress, isSpoilerHidden, serializeProgress, parseProgress } from '../app/tracker.js';

const sample = [
  { name: 'Vice Got a Price!', grade: 'platinum', kind: 'platinum', hidden: false, missable: false, description: 'Leonida Legend' },
  { name: 'Paradise Lost', grade: 'bronze', kind: 'story', hidden: true, missable: false, description: 'Complete Chapter 1.' },
  { name: 'Positive Mental Attitude', grade: 'bronze', kind: 'activities', hidden: false, missable: true, description: 'Meditate at every spot across Leonida.' },
  { name: 'You WAiNKer!', grade: 'silver', kind: 'collectibles', hidden: false, missable: false, description: 'WAiNK It at 100 locations.' },
  { name: 'Cunning Stunts', grade: 'silver', kind: 'activities', hidden: false, missable: false, description: 'Complete 250 Stunts.' },
];

test('filterTrophies: all returns everything', () => {
  assert.equal(filterTrophies(sample, { kind: 'all', grade: 'all' }).length, 5);
});

test('filterTrophies: story kind returns only story trophies', () => {
  assert.deepEqual(filterTrophies(sample, { kind: 'story', grade: 'all' }).map((t) => t.name), ['Paradise Lost']);
});

test('filterTrophies: missable kind returns only the missable trophy', () => {
  assert.deepEqual(filterTrophies(sample, { kind: 'missable', grade: 'all' }).map((t) => t.name), ['Positive Mental Attitude']);
});

test('filterTrophies: online kind returns nothing (no online trophies)', () => {
  assert.equal(filterTrophies(sample, { kind: 'online', grade: 'all' }).length, 0);
});

test('filterTrophies: grade filter combines with kind filter', () => {
  assert.deepEqual(filterTrophies(sample, { kind: 'activities', grade: 'silver' }).map((t) => t.name), ['Cunning Stunts']);
});

test('searchTrophies: matches name case-insensitively', () => {
  assert.deepEqual(searchTrophies(sample, 'waink').map((t) => t.name), ['You WAiNKer!']);
});

test('searchTrophies: matches description text', () => {
  assert.deepEqual(searchTrophies(sample, 'chapter 1').map((t) => t.name), ['Paradise Lost']);
});

test('searchTrophies: blank query returns everything', () => {
  assert.equal(searchTrophies(sample, '  ').length, 5);
});

test('computeProgress: counts earned overall and per grade', () => {
  const earned = new Set(['Vice Got a Price!', 'You WAiNKer!']);
  const p = computeProgress(sample, earned);
  assert.equal(p.earned, 2);
  assert.equal(p.total, 5);
  assert.equal(p.byGrade.platinum.earned, 1);
  assert.equal(p.byGrade.silver.earned, 1);
  assert.equal(p.byGrade.bronze.earned, 0);
  assert.equal(p.percent, 40);
});

test('isSpoilerHidden: hides unearned hidden story trophies when spoilers on', () => {
  const t = sample[1]; // Paradise Lost, hidden story, not earned
  assert.equal(isSpoilerHidden(t, new Set(), true), true);
  assert.equal(isSpoilerHidden(t, new Set(['Paradise Lost']), true), false);
  assert.equal(isSpoilerHidden(t, new Set(), false), false);
});

test('isSpoilerHidden: never hides a visible trophy', () => {
  assert.equal(isSpoilerHidden(sample[3], new Set(), true), false);
});

test('serializeProgress / parseProgress round-trip', () => {
  const earned = new Set(['Vice Got a Price!', 'Cunning Stunts']);
  const text = serializeProgress(earned);
  const back = parseProgress(text, new Set(sample.map((t) => t.name)));
  assert.deepEqual([...back].sort(), [...earned].sort());
});

test('parseProgress rejects garbage and unknown names are dropped', () => {
  assert.throws(() => parseProgress('not json'), /invalid/i);
  const valid = new Set(sample.map((t) => t.name));
  const back = parseProgress(JSON.stringify(['Vice Got a Price!', 'No Such Trophy']), valid);
  assert.deepEqual([...back], ['Vice Got a Price!']);
});
