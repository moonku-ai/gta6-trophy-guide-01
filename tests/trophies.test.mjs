// Tests for app/data/trophies.json: the official 55-name list, grades, guides + sources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const data = JSON.parse(readFileSync(join(repo, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies ?? data;

// The 55 official names, exactly as PlayStation publishes them (kit starter list).
const OFFICIAL = [
  'Vice Got a Price!', 'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money',
  'Vice City, Baby!', 'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust',
  'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'A Long Road',
  'Cunning Stunts', 'Master of None', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos',
  'Baited My Tackle', 'Stick Fiddler', 'Road to Rehabilitation', 'This Was No Boat Accident',
  'The Lone Rider', 'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
  'Positive Mental Attitude', 'Fair Game', "Don't Touch My Deck", 'You WAiNKer!',
  'One Last Thing', 'Hot Together', 'Retail Therapy', 'Whip It Good', 'Gunslinger',
  'Catch Me If You Can', 'Challenging Tank', 'Sneakthief', 'Maximum Withdrawal',
  'A Classic Blitz Play', 'The Goodtime State', 'Pest Control', 'In The Beginning…',
  'Capital Offense', 'Let’s Go Bowling', 'Personal Best', 'Actions Speak Louder',
  'Bad Luck, I Guess', 'The Truth Is Out There', 'Ten Pin', 'Dime on the Dollar',
  'Treat Yo Self', 'Little Boxes', 'On the Spot',
];

test('trophies.json holds exactly 55 trophies with unique names', () => {
  assert.equal(trophies.length, 55);
  assert.equal(new Set(trophies.map((t) => t.name)).size, 55);
});

test('every official name is present, no extras', () => {
  const names = new Set(trophies.map((t) => t.name));
  for (const name of OFFICIAL) assert.ok(names.has(name), `missing official trophy: ${name}`);
});

test('grade split is 1 platinum, 2 gold, 6 silver, 46 bronze', () => {
  const count = {};
  for (const t of trophies) count[t.grade] = (count[t.grade] ?? 0) + 1;
  assert.deepEqual(count, { platinum: 1, gold: 2, silver: 6, bronze: 46 });
});

test('every trophy has a non-blank guide and a named source', () => {
  for (const t of trophies) {
    assert.equal(typeof t.guide, 'string');
    assert.ok(t.guide.trim().length > 40, `guide too short: ${t.name}`);
    assert.equal(typeof t.source, 'string');
    assert.ok(t.source.trim().length > 2, `source missing: ${t.name}`);
    assert.ok(!t.guide.includes('http'), `guide must not carry a URL: ${t.name}`);
    assert.ok(!t.source.includes('http'), `source must not carry a URL: ${t.name}`);
  }
});

test('every trophy has an official description and a valid kind', () => {
  const kinds = new Set(['story', 'collectibles', 'activities', 'platinum']);
  for (const t of trophies) {
    assert.ok(t.description && t.description.trim().length > 0, `description missing: ${t.name}`);
    assert.ok(kinds.has(t.kind), `bad kind ${t.kind}: ${t.name}`);
  }
});

test('28 trophies are hidden, 27 visible', () => {
  const hidden = trophies.filter((t) => t.hidden === true);
  assert.equal(hidden.length, 28);
  assert.equal(trophies.filter((t) => t.hidden === false).length, 27);
});

test('exactly one missable trophy: Positive Mental Attitude', () => {
  const missable = trophies.filter((t) => t.missable === true);
  assert.deepEqual(missable.map((t) => t.name), ['Positive Mental Attitude']);
});

test('no online trophies: kind online never appears', () => {
  assert.ok(!trophies.some((t) => t.kind === 'online'));
});

test('unconfirmed triggers are labelled unconfirmed, never invented', () => {
  const unconfirmed = ['In The Beginning…', 'Capital Offense', 'Bad Luck, I Guess', 'The Truth Is Out There', 'Ten Pin'];
  for (const name of unconfirmed) {
    const t = trophies.find((x) => x.name === name);
    assert.ok(/unconfirmed/i.test(t.guide), `unconfirmed label missing: ${name}`);
  }
});
