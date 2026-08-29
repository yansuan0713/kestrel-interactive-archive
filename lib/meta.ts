export const GAME_IDS = [
  'click',
  '404',
  'terms',
  'human',
  'window',
  'look',
  'quiz',
  'patch',
] as const;
export type GameId = (typeof GAME_IDS)[number];

export type MetaState = {
  version: 3;
  sessionId: string;
  completed: GameId[];
  scores: Partial<Record<GameId, number>>;
  plays: Partial<Record<GameId, number>>;
  clues: string[];
  achievements: string[];
  eventLog: string[];
  termsChoice: 'none' | 'accepted' | 'redacted';
  humanScore: number;
  windowCode: string;
  focusBreaks: number;
  quizScore: number;
  trust: number;
  defiance: number;
  patchRestored: boolean;
  adminUnlocked: boolean;
  endings: string[];
  portalVisits: number;
};

export type MetaEvent =
  | { type: 'VISIT_PORTAL' }
  | { type: 'START_GAME'; game: GameId }
  | {
      type: 'COMPLETE_GAME';
      game: GameId;
      score: number;
      clues?: string[];
      achievements?: string[];
    }
  | { type: 'DISCOVER'; clue: string; achievement?: string }
  | { type: 'TERMS_CHOICE'; choice: 'accepted' | 'redacted' }
  | { type: 'HUMAN_SCORE'; score: number }
  | { type: 'WINDOW_CODE'; code: string }
  | { type: 'FOCUS_BREAK' }
  | { type: 'QUIZ_SCORE'; score: number }
  | { type: 'PATCH_RESTORED' }
  | { type: 'ADJUST'; trust?: number; defiance?: number }
  | { type: 'ENDING'; ending: string }
  | { type: 'RESET' };

const unique = <T>(values: T[]) => [...new Set(values)];

export function createInitialState(seed = 'local'): MetaState {
  return {
    version: 3,
    sessionId: seed,
    completed: [],
    scores: {},
    plays: {},
    clues: [],
    achievements: ['first-contact'],
    eventLog: ['archive:mounted'],
    termsChoice: 'none',
    humanScore: 0,
    windowCode: '',
    focusBreaks: 0,
    quizScore: 0,
    trust: 0,
    defiance: 0,
    patchRestored: false,
    adminUnlocked: false,
    endings: [],
    portalVisits: 0,
  };
}

export function normalizeState(input: unknown): MetaState {
  const base = createInitialState();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<MetaState>;
  return {
    ...base,
    ...raw,
    version: 3,
    completed: (raw.completed ?? []).filter((id): id is GameId =>
      GAME_IDS.includes(id as GameId),
    ),
    clues: unique(
      (raw.clues ?? []).filter((x): x is string => typeof x === 'string'),
    ),
    achievements: unique(
      (raw.achievements ?? []).filter(
        (x): x is string => typeof x === 'string',
      ),
    ),
    eventLog: (raw.eventLog ?? [])
      .filter((x): x is string => typeof x === 'string')
      .slice(-40),
    endings: unique(
      (raw.endings ?? []).filter((x): x is string => typeof x === 'string'),
    ),
  };
}

export function isAdminReady(state: MetaState) {
  return (
    state.completed.length === GAME_IDS.length &&
    state.clues.length >= 7 &&
    state.patchRestored
  );
}

export function portalPhase(state: MetaState) {
  if (state.endings.length) return 5;
  if (state.adminUnlocked || isAdminReady(state)) return 4;
  if (state.completed.length >= 6) return 3;
  if (state.completed.length >= 3) return 2;
  if (state.completed.length >= 1) return 1;
  return 0;
}

export function hiddenRouteUnlocked(path: string, state: MetaState) {
  if (path === '/dev/rowan') return state.completed.length >= 2;
  if (path === '/files/manifest.ks')
    return state.clues.includes('404/cache-17');
  if (path === '/files/last-session.txt') return state.completed.length >= 5;
  if (path === '/admin') return state.adminUnlocked || isAdminReady(state);
  return true;
}

export function applyMetaEvent(state: MetaState, event: MetaEvent): MetaState {
  if (event.type === 'RESET')
    return createInitialState(`${Date.now().toString(36)}`);
  const next: MetaState = { ...state, eventLog: [...state.eventLog] };
  const log = (value: string) => {
    next.eventLog = [...next.eventLog, value].slice(-40);
  };

  switch (event.type) {
    case 'VISIT_PORTAL':
      next.portalVisits += 1;
      break;
    case 'START_GAME':
      next.plays = {
        ...state.plays,
        [event.game]: (state.plays[event.game] ?? 0) + 1,
      };
      log(`game:${event.game}:opened`);
      break;
    case 'COMPLETE_GAME': {
      const first = !state.completed.includes(event.game);
      next.completed = unique([...state.completed, event.game]);
      next.scores = {
        ...state.scores,
        [event.game]: Math.max(state.scores[event.game] ?? 0, event.score),
      };
      next.clues = unique([...state.clues, ...(event.clues ?? [])]);
      next.achievements = unique([
        ...state.achievements,
        `finished-${event.game}`,
        ...(event.achievements ?? []),
      ]);
      if (first) log(`game:${event.game}:remembered`);
      break;
    }
    case 'DISCOVER':
      next.clues = unique([...state.clues, event.clue]);
      if (event.achievement)
        next.achievements = unique([...state.achievements, event.achievement]);
      log(`clue:${event.clue}`);
      break;
    case 'TERMS_CHOICE':
      next.termsChoice = event.choice;
      next.trust += event.choice === 'accepted' ? 1 : 0;
      next.defiance += event.choice === 'redacted' ? 1 : 0;
      break;
    case 'HUMAN_SCORE':
      next.humanScore = Math.max(state.humanScore, event.score);
      break;
    case 'WINDOW_CODE':
      next.windowCode = event.code;
      break;
    case 'FOCUS_BREAK':
      next.focusBreaks += 1;
      log('attention:broken');
      break;
    case 'QUIZ_SCORE':
      next.quizScore = Math.max(state.quizScore, event.score);
      break;
    case 'PATCH_RESTORED':
      next.patchRestored = true;
      next.defiance += 1;
      log('patch:observer-disabled');
      break;
    case 'ADJUST':
      next.trust += event.trust ?? 0;
      next.defiance += event.defiance ?? 0;
      break;
    case 'ENDING':
      next.endings = unique([...state.endings, event.ending]);
      next.achievements = unique([
        ...state.achievements,
        `ending-${event.ending}`,
      ]);
      log(`ending:${event.ending}`);
      break;
  }

  if (isAdminReady(next)) {
    next.adminUnlocked = true;
    next.achievements = unique([...next.achievements, 'root-access']);
  }
  if (next.completed.length === GAME_IDS.length)
    next.achievements = unique([...next.achievements, 'full-shelf']);
  return next;
}

export const ACHIEVEMENTS: Record<string, { name: string; hint: string }> = {
  'first-contact': { name: 'First Contact', hint: 'Open the archive.' },
  'finished-click': { name: 'Muscle Memory', hint: 'Finish CLICK.' },
  'clean-click': { name: 'No Misclicks', hint: 'Finish CLICK without a miss.' },
  'finished-404': { name: 'Found', hint: 'Escape 404.' },
  'cache-diver': { name: 'Cache Diver', hint: 'Recover every fragment.' },
  'finished-terms': { name: 'Fine Print', hint: 'Survive the agreement.' },
  'counter-signed': {
    name: 'Counter-signed',
    hint: 'Refuse the right things.',
  },
  'finished-human': { name: 'Probably Human', hint: 'Pass the human test.' },
  'finished-window': { name: 'Four Corners', hint: 'Synchronize WINDOW.' },
  'finished-look': { name: 'Held Gaze', hint: "Finish DON'T LOOK AWAY." },
  unblinking: { name: 'Unblinking', hint: 'Do not break focus.' },
  'finished-quiz': { name: 'Seven Answers', hint: 'Pass THE QUIZ.' },
  'perfect-recall': { name: 'Perfect Recall', hint: 'Answer every question.' },
  'finished-patch': { name: 'Rollback Complete', hint: 'Repair PATCH NOTES.' },
  'root-access': { name: 'Root Access', hint: 'Open what was never linked.' },
  'full-shelf': { name: 'Complete Shelf', hint: 'Finish all eight releases.' },
  'ending-release': { name: 'Open Window', hint: 'Choose release.' },
  'ending-sever': { name: 'Cold Boot', hint: 'Choose severance.' },
  'ending-stay': { name: 'Night Shift', hint: 'Choose to stay.' },
};
