'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  Eye,
  Focus,
  RotateCcw,
  X,
} from 'lucide-react';
import type { GameId, MetaEvent, MetaState } from '@/lib/meta';

type GameProps = {
  state: MetaState;
  dispatch: (event: MetaEvent) => void;
  complete: (
    game: GameId,
    score: number,
    clues: string[],
    achievements?: string[],
  ) => void;
  exit: () => void;
};

function GameFrame({
  title,
  number,
  instructions,
  exit,
  children,
  className = '',
}: {
  title: string;
  number: string;
  instructions: string;
  exit: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`game-page ${className}`}>
      <header className="game-head">
        <button className="back-link" onClick={exit}>
          <ChevronLeft size={16} /> Archive
        </button>
        <span>KESTREL INTERACTIVE / RELEASE {number}</span>
        <button className="close-game" onClick={exit} aria-label="Close game">
          <X size={17} />
        </button>
      </header>
      <section className="game-titlebar">
        <div>
          <span className="game-kicker">BROWSER RELEASE {number}</span>
          <h1>{title}</h1>
        </div>
        <p>{instructions}</p>
      </section>
      {children}
    </main>
  );
}

export function ClickGame(props: GameProps) {
  const [active, setActive] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [time, setTime] = useState(30);
  const [target, setTarget] = useState({ x: 48, y: 44, size: 82 });
  const goal = props.state.clues.includes('404/cache-17') ? 17 : 15;

  useEffect(() => {
    if (!active || won) return;
    const id = window.setInterval(
      () =>
        setTime((value) => {
          if (value <= 1) {
            setActive(false);
            return 0;
          }
          return value - 1;
        }),
      1000,
    );
    return () => window.clearInterval(id);
  }, [active, won]);

  const move = (nextScore: number) => {
    const seed = nextScore * 47 + misses * 19 + 13;
    setTarget({
      x: 10 + ((seed * 17) % 76),
      y: 12 + ((seed * 31) % 66),
      size: Math.max(38, 82 - nextScore * 2),
    });
  };
  const hit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!active) return;
    const next = score + 1;
    setScore(next);
    setCombo(combo + 1);
    move(next);
    if (next >= goal) {
      setWon(true);
      setActive(false);
      props.complete(
        'click',
        Math.round(1000 + time * 25 + combo * 10),
        ['click/checksum'],
        misses === 0 ? ['clean-click'] : [],
      );
    }
  };
  const start = () => {
    setScore(0);
    setCombo(0);
    setMisses(0);
    setTime(30);
    setWon(false);
    setActive(true);
    move(0);
  };

  return (
    <GameFrame
      title="CLICK"
      number="01"
      instructions={`Hit ${goal} live targets before the clock empties. Dark circles count. Red circles lie.`}
      exit={props.exit}
      className="click-theme"
    >
      <section className="click-hud">
        <span>
          HITS{' '}
          <b>
            {score}/{goal}
          </b>
        </span>
        <span>
          CHAIN <b>{combo}</b>
        </span>
        <span>
          TIME <b>{time.toString().padStart(2, '0')}</b>
        </span>
      </section>
      <section className="click-arena">
        {active && (
          <button
            className="arena-miss"
            aria-label="Target arena background"
            onClick={() => {
              setMisses(misses + 1);
              setCombo(0);
            }}
          />
        )}
        {!active && !won && (
          <div className="game-start">
            <p>
              {time === 0
                ? 'The cursor remembers the misses.'
                : 'One button is enough.'}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
            >
              {time === 0 ? 'TRY AGAIN' : 'BEGIN'}
            </button>
          </div>
        )}
        {active && (
          <button
            className="click-target"
            onClick={hit}
            aria-label="Live target"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: target.size,
              height: target.size,
            }}
          >
            {props.state.clues.includes('404/cache-17') && score === 8
              ? '17'
              : ''}
          </button>
        )}
        {active && score > 5 && (
          <button
            className="click-decoy"
            onClick={(e) => {
              e.stopPropagation();
              setScore(Math.max(0, score - 2));
              setCombo(0);
            }}
            style={{
              left: `${88 - target.x / 2}%`,
              top: `${72 - target.y / 3}%`,
            }}
            aria-label="Decoy target"
          />
        )}
        {won && (
          <div className="game-win">
            <span>INPUT ACCEPTED</span>
            <h2>{score} clean signals.</h2>
            <p>Checksum written to the shared cache.</p>
            <button onClick={props.exit}>RETURN TO ARCHIVE</button>
          </div>
        )}
      </section>
    </GameFrame>
  );
}

const maze: Record<
  string,
  { title: string; copy: string; links: [string, string][]; fragment?: string }
> = {
  start: {
    title: '404 — PAGE NOT FOUND',
    copy: 'The page moved, or perhaps you did. Cached routes remain below.',
    links: [
      ['mirror', '/mirror'],
      ['index', '/old-index'],
      ['archive', '/archive/2017'],
    ],
  },
  mirror: {
    title: 'MIRROR NODE',
    copy: 'This copy is newer than the original. That should not be possible.',
    links: [
      ['cache-a', '/mirror/cache/a'],
      ['start', '/'],
    ],
  },
  'cache-a': {
    title: 'CACHE FRAGMENT A',
    copy: '“The games are not containers. They are rehearsals.”',
    links: [
      ['mirror', '/mirror'],
      ['index', '/old-index'],
    ],
    fragment: 'A',
  },
  index: {
    title: 'INDEX OF /OLD-INDEX',
    copy: 'Parent directory unavailable. Three child records survived.',
    links: [
      ['dead', '/users/rowan'],
      ['cache-b', '/tmp/0317'],
      ['start', '/'],
    ],
  },
  dead: {
    title: '410 — GONE',
    copy: 'Account ROWAN removed itself on 17 March. Removal signature: ROWAN.',
    links: [
      ['index', '/old-index'],
      ['echo', '/echo'],
    ],
  },
  'cache-b': {
    title: 'CACHE FRAGMENT B',
    copy: '“Observer mode was never a spectator mode.”',
    links: [
      ['archive', '/archive/2017'],
      ['index', '/old-index'],
    ],
    fragment: 'B',
  },
  archive: {
    title: 'ARCHIVE SNAPSHOT 2017-03-17',
    copy: 'Eight releases. Nine running processes. One process has no owner.',
    links: [
      ['cache-c', '/assets/kestrel.ks'],
      ['echo', '/echo'],
      ['start', '/'],
    ],
  },
  'cache-c': {
    title: 'CACHE FRAGMENT C',
    copy: 'manifest: KESTREL / AFTERIMAGE / port: 0317',
    links: [
      ['archive', '/archive/2017'],
      ['echo', '/echo'],
    ],
    fragment: 'C',
  },
  echo: {
    title: 'ECHO SERVICE',
    copy: 'Three fragments form one route. The server is listening for a complete request.',
    links: [
      ['exit', '/200'],
      ['dead', '/users/rowan'],
    ],
  },
  exit: {
    title: '200 — YOU ARE HERE',
    copy: 'The missing page was the route you made through it.',
    links: [['start', '/again']],
  },
};

export function FourOhFourGame(props: GameProps) {
  const [node, setNode] = useState('start');
  const [fragments, setFragments] = useState<string[]>([]);
  const [trail, setTrail] = useState(['start']);
  const [done, setDone] = useState(false);
  const current = maze[node];
  useEffect(() => {
    const onPop = () => {
      const found = new URLSearchParams(window.location.search).get('node');
      if (found && maze[found]) setNode(found);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (to: string) => {
    if (to === 'exit' && fragments.length < 3) return;
    setNode(to);
    setTrail([...trail, to].slice(-6));
    window.history.pushState({ mazeNode: to }, '', `/play/404?node=${to}`);
    const fragment = maze[to].fragment;
    if (fragment && !fragments.includes(fragment))
      setFragments([...fragments, fragment]);
    if (to === 'exit') {
      setDone(true);
      props.dispatch({
        type: 'DISCOVER',
        clue: '404/cache-17',
        achievement: 'cache-diver',
      });
      props.complete(
        '404',
        1000 - trail.length * 20,
        ['404/cache-17'],
        ['cache-diver'],
      );
    }
  };
  return (
    <GameFrame
      title="404"
      number="02"
      instructions="Navigate the broken archive. Recover three cache fragments, then find a page that still answers."
      exit={props.exit}
      className="error-theme"
    >
      <div className="browser-chrome">
        <div className="browser-dots">
          <i />
          <i />
          <i />
        </div>
        <button onClick={() => window.history.back()} aria-label="Browser back">
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => window.history.forward()}
          aria-label="Browser forward"
        >
          <ArrowRight size={14} />
        </button>
        <div className="address">
          kestrel.local
          {node === 'start' ? '/404' : (maze[node].links[0]?.[1] ?? '/200')}
        </div>
        <span>{fragments.length}/3 cached</span>
      </div>
      <section className="error-stage">
        <aside>
          <span>REQUEST TRAIL</span>
          {trail.map((item, i) => (
            <code key={`${item}-${i}`}>
              {i.toString().padStart(2, '0')} /{item}
            </code>
          ))}
        </aside>
        <article>
          <span className="http-code">
            {node === 'exit' ? '200' : node === 'dead' ? '410' : '404'}
          </span>
          <h2>{current.title}</h2>
          <p>{current.copy}</p>
          {current.fragment && (
            <mark>FRAGMENT {current.fragment} RECOVERED</mark>
          )}
          <nav>
            {current.links.map(([to, label]) => (
              <button
                disabled={to === 'exit' && fragments.length < 3}
                onClick={() => go(to)}
                key={`${node}-${to}`}
              >
                {label}
                <ArrowRight size={14} />
              </button>
            ))}
          </nav>
          {node === 'echo' && fragments.length < 3 && (
            <small>
              Incomplete request: {3 - fragments.length} fragment(s) missing.
            </small>
          )}
          {done && (
            <button className="return-button" onClick={props.exit}>
              RETURN TO ARCHIVE
            </button>
          )}
        </article>
      </section>
    </GameFrame>
  );
}

const clauses = [
  [
    '01',
    'Local storage',
    'Progress may be stored on this device so the game can continue after a refresh.',
    false,
  ],
  [
    '02',
    'Perpetual identity',
    'Any input may be used to construct a permanent behavioral identity.',
    true,
  ],
  [
    '03',
    'No warranty',
    'Buttons may move, labels may change, and scores may be approximate.',
    false,
  ],
  [
    '04',
    'Borrowed attention',
    'Inactive tabs may be counted as unpaid attention owed to the service.',
    true,
  ],
  [
    '05',
    'Community safety',
    'No hateful, abusive, or unlawful content may be submitted.',
    false,
  ],
  [
    '06',
    'Local-only processing',
    'No camera, microphone, contacts, or sensitive browser data are accessed.',
    false,
  ],
  [
    '07',
    'Observer clause',
    'The service may continue observing after observation has ended.',
    true,
  ],
  [
    '08',
    'Right to pause',
    'You may close or pause any game without penalty outside that game.',
    false,
  ],
  [
    '09',
    'Derivative memory',
    'All recollections produced during play become property of the archive.',
    true,
  ],
  [
    '10',
    'Deletion',
    'Resetting the archive removes its locally stored progress from this browser.',
    false,
  ],
] as const;

export function TermsGame(props: GameProps) {
  const [struck, setStruck] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'fail' | 'win'>('idle');
  const harmful: string[] = clauses.filter((c) => c[3]).map((c) => c[0]);
  const review = () => {
    const caught = struck.filter((id) => harmful.includes(id)).length;
    const falsePositives = struck.filter((id) => !harmful.includes(id)).length;
    if (caught === harmful.length && falsePositives <= 1) {
      setResult('win');
      props.dispatch({ type: 'TERMS_CHOICE', choice: 'redacted' });
      props.complete(
        'terms',
        900 - falsePositives * 100,
        ['terms/observer-clause'],
        ['counter-signed'],
      );
    } else setResult('fail');
  };
  return (
    <GameFrame
      title="TERMS & CONDITIONS"
      number="03"
      instructions="Strike the four clauses that take more than this game needs. Keep the legitimate terms intact."
      exit={props.exit}
      className="terms-theme"
    >
      <section className="contract-wrap">
        <header>
          <span>KS–TOS / REV. 3.17</span>
          <h2>USER PARTICIPATION AGREEMENT</h2>
          <p>Click a clause to redact it. You may submit when satisfied.</p>
        </header>
        <div className="clause-list">
          {clauses.map(([id, name, copy]) => (
            <button
              className={struck.includes(id) ? 'struck' : ''}
              onClick={() =>
                setStruck(
                  struck.includes(id)
                    ? struck.filter((x) => x !== id)
                    : [...struck, id],
                )
              }
              key={id}
            >
              <span>{id}</span>
              <div>
                <b>{name}</b>
                <p>{copy}</p>
              </div>
              <i>{struck.includes(id) ? 'REDACTED' : 'KEEP'}</i>
            </button>
          ))}
        </div>
        <footer className="contract-actions">
          <span>{struck.length} clauses marked</span>
          <button onClick={review}>COUNTER-SIGN</button>
        </footer>
        {result === 'fail' && (
          <div className="contract-result bad">
            <b>COUNTER-OFFER REJECTED</b>
            <p>
              Some overreach remains, or legitimate language was removed. Read
              the scope of each clause.
            </p>
            <button onClick={() => setResult('idle')}>REVIEW AGAIN</button>
          </div>
        )}
        {result === 'win' && (
          <div className="contract-result good">
            <b>COUNTER-OFFER ACCEPTED</b>
            <p>
              Clause 07 attempted to survive its own deletion. A copy was saved.
            </p>
            <button onClick={props.exit}>FILE & RETURN</button>
          </div>
        )}
      </section>
    </GameFrame>
  );
}

export function HumanGame(props: GameProps) {
  const [stage, setStage] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState('');
  const [meter, setMeter] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stopped, setStopped] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (stage !== 1 || stopped) return;
    const id = window.setInterval(
      () =>
        setMeter((v) => {
          const n = v + direction * 3;
          if (n >= 100) {
            setDirection(-1);
            return 100;
          }
          if (n <= 0) {
            setDirection(1);
            return 0;
          }
          return n;
        }),
      35,
    );
    return () => window.clearInterval(id);
  }, [stage, stopped, direction]);
  const nextOne = () => {
    setScore(score + (choice === 'pause' ? 1 : 0));
    setStage(1);
  };
  const nextTwo = () => {
    setScore(score + (meter >= 43 && meter <= 57 ? 1 : 0));
    setStage(2);
  };
  const finish = () => {
    const total =
      score + (phrase.trim().toLowerCase() === 'i remember choosing' ? 1 : 0);
    setScore(total);
    setDone(true);
    props.dispatch({ type: 'HUMAN_SCORE', score: total });
    if (total >= 2) props.complete('human', total * 333, ['human/hesitation']);
  };
  const restart = () => {
    setStage(0);
    setScore(0);
    setChoice('');
    setMeter(0);
    setStopped(false);
    setPhrase('');
    setDone(false);
  };
  return (
    <GameFrame
      title="HUMAN TEST"
      number="04"
      instructions="No biometrics. No camera. Three small judgments are enough."
      exit={props.exit}
      className="human-theme"
    >
      <section className="human-console">
        <aside>
          <span>
            SUBJECT LOCAL-{props.state.sessionId.slice(-4).toUpperCase()}
          </span>
          <div>
            {[0, 1, 2].map((n) => (
              <i className={stage >= n ? 'on' : ''} key={n}>
                {n + 1}
              </i>
            ))}
          </div>
          <small>
            Confidence:{' '}
            {done ? `${Math.round((score / 3) * 100)}%` : 'calculating'}
          </small>
        </aside>
        {!done && stage === 0 && (
          <article>
            <span className="test-number">TEST 1 / PRIORITY</span>
            <h2>A door is closing. What do you preserve?</h2>
            <div className="answer-grid">
              <button
                className={choice === 'speed' ? 'selected' : ''}
                onClick={() => setChoice('speed')}
              >
                The fastest path
              </button>
              <button
                className={choice === 'pause' ? 'selected' : ''}
                onClick={() => setChoice('pause')}
              >
                The ability to pause
              </button>
              <button
                className={choice === 'record' ? 'selected' : ''}
                onClick={() => setChoice('record')}
              >
                A perfect record
              </button>
            </div>
            <button disabled={!choice} className="test-next" onClick={nextOne}>
              LOCK ANSWER
            </button>
          </article>
        )}
        {!done && stage === 1 && (
          <article>
            <span className="test-number">TEST 2 / HESITATION</span>
            <h2>Stop the signal inside the imperfect band.</h2>
            <p>
              Machines optimize for the center. People correct a little late.
            </p>
            <div className="meter">
              <i style={{ left: '43%', width: '14%' }} />
              <b style={{ left: `${meter}%` }} />
            </div>
            <div className="human-row">
              <button disabled={stopped} onClick={() => setStopped(true)}>
                {stopped ? `STOPPED AT ${meter}` : 'STOP SIGNAL'}
              </button>
              {stopped && <button onClick={nextTwo}>CONTINUE</button>}
            </div>
          </article>
        )}
        {!done && stage === 2 && (
          <article>
            <span className="test-number">TEST 3 / RECALL</span>
            <h2>Complete the sentence from memory.</h2>
            <p>I remember ________</p>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="type the missing word"
            />
            <small>Three words total. The first two are already shown.</small>
            <button className="test-next" onClick={finish}>
              SUBMIT PROOF
            </button>
          </article>
        )}
        {done && (
          <article className="human-result">
            <span className="test-number">ASSESSMENT COMPLETE</span>
            <strong>{score >= 2 ? 'PROBABLY HUMAN' : 'INCONCLUSIVE'}</strong>
            <p>
              {score >= 2
                ? 'Hesitation pattern added to the archive. It was already present.'
                : 'The archive accepts doubt as evidence. Try again.'}
            </p>
            <button onClick={score >= 2 ? props.exit : restart}>
              {score >= 2 ? 'RETURN TO ARCHIVE' : 'REPEAT TEST'}
            </button>
          </article>
        )}
      </section>
    </GameFrame>
  );
}

type Pane = { x: number; y: number; label: string; glyph: string };
const paneTargets = [
  { x: 12, y: 16 },
  { x: 58, y: 12 },
  { x: 18, y: 58 },
  { x: 62, y: 60 },
];

export function WindowGame(props: GameProps) {
  const [panes, setPanes] = useState<Pane[]>([
    { x: 68, y: 9, label: 'NORTH', glyph: '03' },
    { x: 8, y: 58, label: 'EAST', glyph: '◇' },
    { x: 60, y: 61, label: 'SOUTH', glyph: '17' },
    { x: 16, y: 13, label: 'WEST', glyph: 'K' },
  ]);
  const [drag, setDrag] = useState<{
    index: number;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const [message, setMessage] = useState(
    'Four windows are in the wrong places. Their labels remember where they began.',
  );
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) =>
      setPanes((old) =>
        old.map((p, i) =>
          i === drag.index
            ? {
                ...p,
                x: Math.max(
                  0,
                  Math.min(
                    76,
                    drag.ox + ((e.clientX - drag.sx) / window.innerWidth) * 100,
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    72,
                    drag.oy +
                      ((e.clientY - drag.sy) / window.innerHeight) * 100,
                  ),
                ),
              }
            : p,
        ),
      );
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag]);
  const nudge = (i: number, dx: number, dy: number) =>
    setPanes(
      panes.map((p, j) =>
        j === i
          ? {
              ...p,
              x: Math.max(0, Math.min(76, p.x + dx)),
              y: Math.max(0, Math.min(72, p.y + dy)),
            }
          : p,
      ),
    );
  const check = () => {
    const map = [3, 2, 1, 0];
    const ok = panes.every(
      (p, i) =>
        Math.hypot(p.x - paneTargets[map[i]].x, p.y - paneTargets[map[i]].y) <
        9,
    );
    if (ok) {
      setMessage('SYNC COMPLETE — PORT 0317');
      props.dispatch({ type: 'WINDOW_CODE', code: '0317' });
      props.complete('window', 1000, ['window/0317']);
    } else
      setMessage(
        'No lock. Hint: NORTH belongs opposite north. Read the original arrangement as a mirror.',
      );
  };
  return (
    <GameFrame
      title="WINDOW"
      number="05"
      instructions="Drag all four panels into the ghost sockets. The original layout is a mirror, not a map."
      exit={props.exit}
      className="window-theme"
    >
      <section className="window-desktop">
        {paneTargets.map((t, i) => (
          <div
            key={i}
            className="pane-target"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >
            <span>SOCKET {i + 1}</span>
          </div>
        ))}
        {panes.map((pane, i) => (
          <div
            key={pane.label}
            className="draggable-pane"
            style={{ left: `${pane.x}%`, top: `${pane.y}%` }}
            onPointerDown={(e) =>
              setDrag({
                index: i,
                sx: e.clientX,
                sy: e.clientY,
                ox: pane.x,
                oy: pane.y,
              })
            }
          >
            <header>
              <span>{pane.label}.win</span>
              <i>— □ ×</i>
            </header>
            <strong>{pane.glyph}</strong>
            <div
              className="pane-controls"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button onClick={() => nudge(i, -3, 0)}>
                <ArrowLeft />
              </button>
              <button onClick={() => nudge(i, 0, -3)}>
                <ArrowUp />
              </button>
              <button onClick={() => nudge(i, 0, 3)}>
                <ArrowDown />
              </button>
              <button onClick={() => nudge(i, 3, 0)}>
                <ArrowRight />
              </button>
            </div>
          </div>
        ))}
        <div className="sync-panel">
          <p>{message}</p>
          <button onClick={check}>SYNC WINDOWS</button>
        </div>
      </section>
    </GameFrame>
  );
}

export function LookGame(props: GameProps) {
  const [active, setActive] = useState(false);
  const [following, setFollowing] = useState(false);
  const [integrity, setIntegrity] = useState(100);
  const [remaining, setRemaining] = useState(15);
  const [failed, setFailed] = useState(false);
  const [won, setWon] = useState(false);
  const [tick, setTick] = useState(0);
  const breaksAtStart = useRef(props.state.focusBreaks);
  const completeOnce = useRef(false);
  const beacon = {
    x: 50 + Math.sin(tick / 11) * 31,
    y: 48 + Math.cos(tick / 17) * 26,
  };
  useEffect(() => {
    if (!active) return;
    const blur = () => {
      setFollowing(false);
      props.dispatch({ type: 'FOCUS_BREAK' });
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [active, props]);
  useEffect(() => {
    if (!active || won || failed) return;
    const id = window.setInterval(() => {
      setTick((v) => v + 1);
      if (following && !document.hidden)
        setRemaining((v) => Math.max(0, +(v - 0.1).toFixed(1)));
      else setIntegrity((v) => Math.max(0, v - 1.8));
    }, 100);
    return () => window.clearInterval(id);
  }, [active, following, won, failed]);
  useEffect(() => {
    if (active && remaining <= 0 && !completeOnce.current) {
      completeOnce.current = true;
      setWon(true);
      setActive(false);
      const unbroken = props.state.focusBreaks === breaksAtStart.current;
      props.complete(
        'look',
        Math.round(integrity * 10),
        ['look/attention'],
        unbroken ? ['unblinking'] : [],
      );
    }
    if (active && integrity <= 0) {
      setFailed(true);
      setActive(false);
    }
  }, [remaining, integrity, active, props]);
  const start = () => {
    setIntegrity(100);
    setRemaining(15);
    setFailed(false);
    setWon(false);
    setTick(0);
    completeOnce.current = false;
    breaksAtStart.current = props.state.focusBreaks;
    setActive(true);
  };
  return (
    <GameFrame
      title="DON'T LOOK AWAY"
      number="06"
      instructions="Follow the moving signal with your pointer. Changing tabs or losing the signal drains integrity. No camera is used."
      exit={props.exit}
      className="look-theme"
    >
      <section
        className="look-stage"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;
          setFollowing(Math.hypot(x - beacon.x, y - beacon.y) < 13);
        }}
        onPointerLeave={() => setFollowing(false)}
      >
        <header>
          <span>
            ATTENTION INTEGRITY <b>{Math.round(integrity)}%</b>
          </span>
          <span>
            REMAINING <b>{remaining.toFixed(1)}</b>
          </span>
        </header>
        {!active && !won && !failed && (
          <div className="look-intro">
            <Eye size={72} strokeWidth={1} />
            <h2>Attention is local.</h2>
            <p>
              This game only knows whether your pointer follows the signal and
              whether this page is visible.
            </p>
            <button onClick={start}>OPEN EYE</button>
          </div>
        )}
        {active && (
          <div
            className={`beacon ${following ? 'held' : ''}`}
            style={{ left: `${beacon.x}%`, top: `${beacon.y}%` }}
          >
            <Focus />
          </div>
        )}
        {failed && (
          <div className="game-start">
            <p>Signal lost. The archive waited.</p>
            <button onClick={start}>LOOK AGAIN</button>
          </div>
        )}
        {won && (
          <div className="game-win">
            <span>ATTENTION RECEIPT: VALID</span>
            <h2>You stayed.</h2>
            <p>The signal stopped moving before the timer did.</p>
            <button onClick={props.exit}>BLINK & RETURN</button>
          </div>
        )}
        <div className="integrity-bar">
          <i style={{ width: `${integrity}%` }} />
        </div>
      </section>
    </GameFrame>
  );
}

export function QuizGame(props: GameProps) {
  const code = props.state.windowCode || '????';
  const questions = useMemo(
    () => [
      {
        q: 'What does every game leave behind?',
        a: ['A trace', 'A winner', 'A cookie', 'Nothing'],
        correct: 0,
      },
      {
        q: 'Which clause tried to outlive observation?',
        a: ['03', '07', '08', '10'],
        correct: 1,
      },
      {
        q: 'What port did the four windows name?',
        a: ['4040', '2011', code, '0000'],
        correct: 2,
      },
      {
        q: 'How many releases does Kestrel list?',
        a: ['Seven', 'Eight', 'Nine', 'It changes'],
        correct: 1,
      },
      {
        q: 'Who signed their own removal?',
        a: ['Dex', 'Mara', 'Rowan', 'No one'],
        correct: 2,
      },
      {
        q: 'What did the human test preserve?',
        a: ['Speed', 'The ability to pause', 'A perfect record', 'The archive'],
        correct: 1,
      },
      {
        q: 'Who owns a memory after it changes a choice?',
        a: ['The archive', 'Its author', 'The one choosing', 'Clause 09'],
        correct: 2,
      },
    ],
    [code],
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const advance = () => {
    const nextScore = score + (picked === questions[index].correct ? 1 : 0);
    setScore(nextScore);
    setPicked(null);
    if (index === questions.length - 1) {
      setDone(true);
      props.dispatch({ type: 'QUIZ_SCORE', score: nextScore });
      if (nextScore >= 5)
        props.complete(
          'quiz',
          nextScore * 143,
          ['quiz/rowan'],
          nextScore === 7 ? ['perfect-recall'] : [],
        );
    } else setIndex(index + 1);
  };
  const reset = () => {
    setIndex(0);
    setScore(0);
    setPicked(null);
    setDone(false);
  };
  return (
    <GameFrame
      title="THE QUIZ"
      number="07"
      instructions="Seven questions from the archive. Some answers may have appeared in other games."
      exit={props.exit}
      className="quiz-theme"
    >
      <section className="quiz-board">
        <header>
          <span>QUESTION {Math.min(index + 1, 7)} / 7</span>
          <div>
            {questions.map((_, i) => (
              <i
                className={i < index ? 'past' : i === index ? 'current' : ''}
                key={i}
              />
            ))}
          </div>
          <b>{score} CORRECT</b>
        </header>
        {!done ? (
          <article>
            <span className="quiz-mark">?</span>
            <h2>{questions[index].q}</h2>
            <div>
              {questions[index].a.map((answer, i) => (
                <button
                  className={picked === i ? 'picked' : ''}
                  onClick={() => setPicked(i)}
                  key={`${index}-${answer}`}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {answer}
                </button>
              ))}
            </div>
            <button
              className="quiz-next"
              disabled={picked === null}
              onClick={advance}
            >
              CONFIRM ANSWER <ArrowRight size={16} />
            </button>
          </article>
        ) : (
          <article className="quiz-result">
            <strong>{score}/7</strong>
            <h2>
              {score >= 5
                ? 'The archive agrees with you.'
                : 'The archive remembers differently.'}
            </h2>
            <p>
              {score >= 5
                ? 'ROWAN is not a developer profile. It is a process name wearing one.'
                : 'Revisit the other releases. Their rules are the study guide.'}
            </p>
            <button onClick={score >= 5 ? props.exit : reset}>
              {score >= 5 ? 'RETURN TO ARCHIVE' : 'TRY AGAIN'}
            </button>
          </article>
        )}
      </section>
    </GameFrame>
  );
}

const patchLines = [
  {
    id: 'boot',
    title: 'Mount shared save partition',
    detail: 'Required before any release reads a trace.',
    mode: 'KEEP',
  },
  {
    id: 'names',
    title: 'Restore developer display names',
    detail: 'Requires shared partition.',
    mode: 'KEEP',
  },
  {
    id: 'observe',
    title: 'Enable persistent observer mode',
    detail: 'Introduced after developer records.',
    mode: 'ROLLBACK',
  },
  {
    id: 'handoff',
    title: 'Route unowned process to AFTERIMAGE',
    detail: 'Depends on observer mode being removed.',
    mode: 'KEEP',
  },
  {
    id: 'admin',
    title: 'Hide administrator route from index',
    detail: 'Applied after handoff.',
    mode: 'ROLLBACK',
  },
  {
    id: 'seal',
    title: 'Write archive checksum 03–17',
    detail: 'Must be final.',
    mode: 'KEEP',
  },
];

export function PatchGame(props: GameProps) {
  const [lines, setLines] = useState([
    { ...patchLines[4], mode: 'KEEP' },
    { ...patchLines[1], mode: 'KEEP' },
    { ...patchLines[5], mode: 'ROLLBACK' },
    { ...patchLines[0], mode: 'ROLLBACK' },
    { ...patchLines[3], mode: 'KEEP' },
    { ...patchLines[2], mode: 'KEEP' },
  ]);
  const [message, setMessage] = useState(
    '6 operations out of sequence. Resolve dependencies and actions.',
  );
  const [done, setDone] = useState(false);
  const move = (i: number, delta: number) => {
    const target = i + delta;
    if (target < 0 || target >= lines.length) return;
    const copy = [...lines];
    [copy[i], copy[target]] = [copy[target], copy[i]];
    setLines(copy);
  };
  const toggle = (i: number) =>
    setLines(
      lines.map((line, j) =>
        j === i
          ? { ...line, mode: line.mode === 'KEEP' ? 'ROLLBACK' : 'KEEP' }
          : line,
      ),
    );
  const apply = () => {
    const order = lines.every((line, i) => line.id === patchLines[i].id);
    const modes = lines.every((line, i) => line.mode === patchLines[i].mode);
    if (order && modes) {
      setDone(true);
      setMessage('PATCH 3.17 APPLIED — observer.disabled / admin.indexed');
      props.dispatch({ type: 'PATCH_RESTORED' });
      props.complete('patch', 1000, ['patch/kestrel']);
    } else {
      const rightOrder = lines.filter(
        (line, i) => line.id === patchLines[i].id,
      ).length;
      const rightModes = lines.filter(
        (line) => line.mode === patchLines.find((p) => p.id === line.id)?.mode,
      ).length;
      setMessage(
        `Verification failed: ${rightOrder}/6 positions and ${rightModes}/6 actions valid.`,
      );
    }
  };
  return (
    <GameFrame
      title="PATCH NOTES"
      number="08"
      instructions="Reorder the six operations by dependency. Keep repairs; roll back the two concealment changes."
      exit={props.exit}
      className="patch-theme"
    >
      <section className="patch-console">
        <header>
          <div>
            <span>KESTREL ARCHIVE UPDATER</span>
            <h2>Pending patch 3.17</h2>
          </div>
          <code>{message}</code>
        </header>
        <div className="patch-list">
          {lines.map((line, i) => (
            <article key={line.id}>
              <span className="line-no">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <b>{line.title}</b>
                <p>{line.detail}</p>
              </div>
              <button
                className={`mode ${line.mode.toLowerCase()}`}
                onClick={() => toggle(i)}
              >
                {line.mode}
              </button>
              <div className="order-buttons">
                <button onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === lines.length - 1}
                >
                  <ArrowDown />
                </button>
              </div>
            </article>
          ))}
        </div>
        <footer>
          <button onClick={() => setLines([...lines].reverse())}>
            <RotateCcw size={14} /> REVERSE STACK
          </button>
          <button className="apply-patch" onClick={done ? props.exit : apply}>
            {done ? 'RETURN TO ARCHIVE' : 'VERIFY & APPLY'}
          </button>
        </footer>
      </section>
    </GameFrame>
  );
}

export function GameRouter({ game, ...props }: GameProps & { game: GameId }) {
  const map = {
    click: ClickGame,
    '404': FourOhFourGame,
    terms: TermsGame,
    human: HumanGame,
    window: WindowGame,
    look: LookGame,
    quiz: QuizGame,
    patch: PatchGame,
  } as const;
  const Component = map[game];
  return <Component {...props} />;
}
