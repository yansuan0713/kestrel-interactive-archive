import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GAME_IDS,
  applyMetaEvent,
  createInitialState,
  hiddenRouteUnlocked,
  isAdminReady,
  portalPhase,
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
