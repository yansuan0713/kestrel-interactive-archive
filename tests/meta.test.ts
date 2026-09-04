import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GAME_IDS,
  MAX_ARCHIVE_CAPSULE_SIZE,
  applyMetaEvent,
  createInitialState,
  hiddenRouteUnlocked,
  isAdminReady,
  normalizeState,
  parseArchiveCapsule,
  portalPhase,
  serializeArchiveCapsule,
} from '../lib/meta.ts';

void test('game completion is idempotent and preserves the best score', () => {
  let state = createInitialState('test');
  state = applyMetaEvent(state, {
    type: 'COMPLETE_GAME',
    game: 'click',
    score: 12,
    clues: ['click/checksum'],
  });
  state = applyMetaEvent(state, {
    type: 'COMPLETE_GAME',
    game: 'click',
    score: 9,
    clues: ['click/checksum'],
  });
  assert.deepEqual(state.completed, ['click']);
  assert.equal(state.scores.click, 12);
  assert.deepEqual(state.clues, ['click/checksum']);
});

void test('portal phases progress from archive to breach', () => {
  let state = createInitialState('phase');
  assert.equal(portalPhase(state), 0);
  for (const game of GAME_IDS.slice(0, 3))
    state = applyMetaEvent(state, { type: 'COMPLETE_GAME', game, score: 1 });
  assert.equal(portalPhase(state), 2);
});

void test('hidden files require the intended clue', () => {
  let state = createInitialState('routes');
  assert.equal(hiddenRouteUnlocked('/files/manifest.ks', state), false);
  state = applyMetaEvent(state, { type: 'DISCOVER', clue: '404/cache-17' });
  assert.equal(hiddenRouteUnlocked('/files/manifest.ks', state), true);
});

void test('admin unlock requires all games, clues, and restored patch', () => {
  let state = createInitialState('admin');
  for (const game of GAME_IDS)
    state = applyMetaEvent(state, {
      type: 'COMPLETE_GAME',
      game,
      score: 10,
      clues: [`clue/${game}`],
    });
  assert.equal(isAdminReady(state), false);
  state = applyMetaEvent(state, { type: 'PATCH_RESTORED' });
  assert.equal(isAdminReady(state), true);
  assert.equal(state.adminUnlocked, true);
});

void test('ending collection supports multiple endings without duplication', () => {
  let state = createInitialState('end');
  state = applyMetaEvent(state, { type: 'ENDING', ending: 'sever' });
  state = applyMetaEvent(state, { type: 'ENDING', ending: 'sever' });
  state = applyMetaEvent(state, { type: 'ENDING', ending: 'release' });
  assert.deepEqual(state.endings, ['sever', 'release']);
});

void test('malformed persisted state falls back field by field', () => {
  const state = normalizeState({
    version: 3,
    sessionId: { forged: true },
    completed: 'click',
    scores: { click: Number.NaN, terms: 42, quiz: 'seven' },
    plays: null,
    clues: { length: 99 },
    achievements: 'root-access',
    eventLog: [1, 'valid:event', null],
    termsChoice: 'owner',
    humanScore: Number.POSITIVE_INFINITY,
    windowCode: { value: '0317' },
    focusBreaks: '4',
    quizScore: null,
    trust: Number.NaN,
    defiance: {},
    patchRestored: 'true',
    adminUnlocked: 1,
    endings: 'release',
    portalVisits: Number.NEGATIVE_INFINITY,
  });

  assert.deepEqual(state.completed, []);
  assert.deepEqual(state.scores, { terms: 42 });
  assert.deepEqual(state.plays, {});
  assert.deepEqual(state.clues, []);
  assert.deepEqual(state.achievements, ['first-contact']);
  assert.deepEqual(state.eventLog, ['valid:event']);
  assert.equal(state.termsChoice, 'none');
  assert.equal(state.humanScore, 0);
  assert.equal(state.windowCode, '');
  assert.equal(state.focusBreaks, 0);
  assert.equal(state.quizScore, 0);
  assert.equal(state.trust, 0);
  assert.equal(state.defiance, 0);
  assert.equal(state.patchRestored, false);
  assert.equal(state.adminUnlocked, false);
  assert.deepEqual(state.endings, []);
  assert.equal(state.portalVisits, 0);
  assert.equal(portalPhase(state), 0);
});

void test('normalization filters and deduplicates completed games', () => {
  const state = normalizeState({
    version: 3,
    sessionId: 'duplicates',
    completed: ['click', 'click', 'not-a-game', '404', 404, '404'],
  });

  assert.deepEqual(state.completed, ['click', '404']);
  assert.equal(portalPhase(state), 1);
});

void test('normalization replaces empty or unsafe session identifiers', () => {
  for (const sessionId of ['', '   ', '../admin', 'x'.repeat(65), 317]) {
    const state = normalizeState({ version: 3, sessionId });
    assert.equal(state.sessionId, 'local');
  }
  assert.equal(
    normalizeState({ version: 3, sessionId: 'safe_session-0317' }).sessionId,
    'safe_session-0317',
  );
});

void test('archive capsules round-trip normalized progress', () => {
  let state = createInitialState('portable_0317');
  state = applyMetaEvent(state, {
    type: 'COMPLETE_GAME',
    game: '404',
    score: 3,
    clues: ['404/cache-17'],
  });

  const restored = parseArchiveCapsule(serializeArchiveCapsule(state));
  assert.deepEqual(restored, state);
});

void test('invalid archive capsules are rejected before replacing progress', () => {
  for (const source of [
    '',
    '{broken',
    JSON.stringify({ version: 1, state: { version: 3 } }),
    JSON.stringify({
      format: 'kestrel-archive-capsule',
      version: 2,
      state: { version: 3 },
    }),
  ]) {
    assert.throws(() => parseArchiveCapsule(source));
  }
  assert.throws(() =>
    parseArchiveCapsule('x'.repeat(MAX_ARCHIVE_CAPSULE_SIZE + 1)),
  );
});

void test('restoring a capsule records the transfer in its own session', () => {
  const imported = createInitialState('imported_session');
  const restored = applyMetaEvent(createInitialState('current_session'), {
    type: 'RESTORE',
    state: imported,
  });

  assert.equal(restored.sessionId, 'imported_session');
  assert.equal(restored.eventLog.at(-1), 'archive:restored');
});
