// Leonida after dark: the GTA VI trophy guide and tracker.
// Loads app/data/trophies.json, renders the checklist, saves progress in
// localStorage, and opens one trophy's cited guide at a time in the panel.
// Query params (for screenshots and deep links): ?kind= ?grade= ?q=
// ?spoiler=1 ?open=<trophy id> ?demo=1 (checks a few trophies) ?view=roadmap
import {
  filterTrophies,
  searchTrophies,
  computeProgress,
  isSpoilerHidden,
  serializeProgress,
  parseProgress,
  setValidNames,
} from './tracker.js';

const STORE_KEY = 'gta6-trophy-guide-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers';
const DEMO_EARNED = [2, 3, 8, 15, 21, 35, 42];

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('guide-panel');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const gradeCounts = document.getElementById('grade-counts');
const resultCount = document.getElementById('result-count');
const kindSelect = document.getElementById('kind');
const gradeSelect = document.getElementById('grade');
const searchInput = document.getElementById('search');
const spoilerToggle = document.getElementById('spoilers');
const exportBtn = document.getElementById('export');
const importInput = document.getElementById('import');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
setValidNames(trophies.map((t) => t.name));

const params = new URLSearchParams(location.search);
let earned = loadEarned();
let spoilersOn = loadSpoilers();
let selectedId = null;

function loadEarned() {
  if (params.get('demo') === '1') {
    return new Set(trophies.filter((t) => DEMO_EARNED.includes(t.id)).map((t) => t.name));
  }
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function loadSpoilers() {
  if (params.get('spoiler') === '1') return true;
  return localStorage.getItem(SPOILER_KEY) === '1';
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort()));
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, spoilersOn ? '1' : '0');
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function visibleName(t) {
  return isSpoilerHidden(t, earned, spoilersOn) ? 'Hidden trophy' : t.name;
}

function visibleDescription(t) {
  return isSpoilerHidden(t, earned, spoilersOn)
    ? 'Spoilers on: this story trophy stays hidden until you earn it.'
    : t.description;
}

function trophyCard(t) {
  const card = document.createElement('article');
  card.className = 'trophy' + (earned.has(t.name) ? ' is-earned' : '');
  card.dataset.name = t.name;

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = earned.has(t.name);
  check.setAttribute('aria-label', `Earned: ${t.name}`);
  check.addEventListener('change', () => {
    if (check.checked) earned.add(t.name);
    else earned.delete(t.name);
    saveEarned();
    renderAll();
  });

  const body = document.createElement('div');
  body.className = 'trophy-body';

  const title = document.createElement('h3');
  title.textContent = visibleName(t);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = visibleDescription(t);

  const tags = document.createElement('p');
  tags.className = 'trophy-tags';
  const bits = [gradeLabel(t)];
  if (t.kind !== 'platinum') bits.push(t.kind);
  if (t.hidden) bits.push('hidden');
  if (t.missable) bits.push('MISSABLE');
  tags.textContent = bits.join(' · ');

  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'guide-btn';
  guideBtn.textContent = isSpoilerHidden(t, earned, spoilersOn) ? 'Guide hidden' : 'Read the guide';
  guideBtn.disabled = isSpoilerHidden(t, earned, spoilersOn);
  guideBtn.addEventListener('click', () => openGuide(t));

  body.append(title, desc, tags, guideBtn);
  card.append(check, body);
  return card;
}

function openGuide(t) {
  selectedId = t.id;
  detailEl.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = t.name;
  const meta = document.createElement('p');
  meta.className = 'detail-meta';
  meta.textContent = `${gradeLabel(t)} · ${t.kind}${t.hidden ? ' · hidden' : ''}${t.missable ? ' · MISSABLE' : ''} · roadmap stage ${t.stage} of 5`;
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = t.description;
  const guide = document.createElement('p');
  guide.className = 'detail-guide';
  guide.textContent = t.guide;
  const source = document.createElement('p');
  source.className = 'detail-source';
  source.textContent = `Source: ${t.source}`;
  const note = document.createElement('p');
  note.className = 'detail-note';
  note.textContent = earned.has(t.name)
    ? 'Earned — ticked off in your checklist.'
    : 'Not earned yet — tick the box on its card when it pops.';
  detailEl.append(heading, meta, desc, source, guide, note);
}

function renderProgress() {
  const p = computeProgress(trophies, earned);
  progressText.textContent = `${p.earned} of ${p.total} earned · ${p.percent}% to the platinum`;
  progressFill.style.width = `${p.percent}%`;
  gradeCounts.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${gradeLabel({ grade: g })} ${p.byGrade[g].earned}/${p.byGrade[g].total}`)
    .join(' · ');
}

function renderList() {
  const filtered = searchTrophies(
    filterTrophies(trophies, { kind: kindSelect.value, grade: gradeSelect.value }),
    searchInput.value,
  );
  listEl.replaceChildren();
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent =
      kindSelect.value === 'online'
        ? 'No online trophies — all 55 are single-player and offline.'
        : 'No trophies match these filters.';
    listEl.append(empty);
  } else {
    for (const t of filtered) listEl.append(trophyCard(t));
  }
  resultCount.textContent = `${filtered.length} of ${trophies.length} trophies shown`;
}

function renderAll() {
  renderProgress();
  renderList();
}

kindSelect.addEventListener('change', renderAll);
gradeSelect.addEventListener('change', renderAll);
searchInput.addEventListener('input', renderAll);
spoilerToggle.addEventListener('change', () => {
  spoilersOn = spoilerToggle.checked;
  saveSpoilers();
  renderAll();
});

exportBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([serializeProgress(earned)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

importInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    earned = parseProgress(await file.text());
    saveEarned();
    renderAll();
  } catch (err) {
    resultCount.textContent = `Import failed: ${err.message}`;
  }
});

// Apply deep-link params, then render. The focus param picks a screenshot
// view by hiding the sections above the part being shown, so no scrolling
// is needed to frame it (scrolling after the async list renders is unreliable).
const focus = params.get('focus');
if (focus === 'list' || focus === 'roadmap') document.body.classList.add(`focus-${focus}`);
if (params.get('kind')) kindSelect.value = params.get('kind');
if (params.get('grade')) gradeSelect.value = params.get('grade');
if (params.get('q')) searchInput.value = params.get('q');
spoilerToggle.checked = spoilersOn;
renderAll();
const openId = Number(params.get('open'));
if (openId) {
  const target = trophies.find((t) => t.id === openId);
  if (target) openGuide(target);
}
