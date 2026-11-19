// Pure tracker logic for the GTA 6 trophy guide: filtering, search, progress,
// spoiler hiding and progress export/import. No DOM here, so node:test can
// exercise it directly; app.js wires these functions to the page.
export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
export const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'online'];

/** Keep only trophies matching the kind and grade filters. */
export function filterTrophies(trophies, { kind = 'all', grade = 'all' } = {}) {
  return trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind === 'all') return true;
    if (kind === 'missable') return t.missable === true;
    if (kind === 'online') return t.kind === 'online';
    return t.kind === kind;
  });
}

/** Case-insensitive search across name and official description. */
export function searchTrophies(trophies, query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return trophies;
  return trophies.filter(
    (t) => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
  );
}

/** Earned counts overall and per grade, plus a rounded percentage. */
export function computeProgress(trophies, earned) {
  const byGrade = {};
  for (const g of GRADES) byGrade[g] = { earned: 0, total: 0 };
  let earnedCount = 0;
  for (const t of trophies) {
    byGrade[t.grade].total += 1;
    if (earned.has(t.name)) {
      byGrade[t.grade].earned += 1;
      earnedCount += 1;
    }
  }
  return {
    earned: earnedCount,
    total: trophies.length,
    percent: trophies.length ? Math.round((earnedCount / trophies.length) * 100) : 0,
    byGrade,
  };
}

/**
 * Spoiler mode hides the name and description of a hidden story trophy until
 * it is earned. Visible trophies and earned trophies are never hidden.
 */
export function isSpoilerHidden(trophy, earned, spoilersOn) {
  if (!spoilersOn) return false;
  if (earned.has(trophy.name)) return false;
  return trophy.hidden === true && trophy.kind === 'story';
}

/** Serialise the earned set to a JSON file's text. */
export function serializeProgress(earned) {
  return JSON.stringify({ app: 'gta6-trophy-guide', version: 1, earned: [...earned].sort() }, null, 2);
}

/** Parse an exported progress file; unknown names are dropped. */
export function parseProgress(text, validNames = VALID_NAMES) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid progress file: not JSON');
  }
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('invalid progress file: no earned list');
  return new Set(names.filter((n) => typeof n === 'string' && validNames.has(n)));
}

// Filled by app.js at load from the real trophy list; tests set it via setValidNames.
export const VALID_NAMES = new Set();
export function setValidNames(names) {
  VALID_NAMES.clear();
  for (const n of names) VALID_NAMES.add(n);
}
