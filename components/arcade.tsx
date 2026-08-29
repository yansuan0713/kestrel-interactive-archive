'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  ChevronLeft,
  CircleHelp,
  Download,
  FileText,
  LockKeyhole,
  Radio,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import {
  ACHIEVEMENTS,
  GAME_IDS,
  applyMetaEvent,
  createInitialState,
  hiddenRouteUnlocked,
  isAdminReady,
  normalizeState,
  portalPhase,
  type GameId,
  type MetaEvent,
  type MetaState,
} from '@/lib/meta';
import { GameRouter } from '@/components/games';

const STORAGE_KEY = 'kestrel.archive.v3';
const GAMES: {
  id: GameId;
  name: string;
  copy: string;
  maker: string;
  number: string;
  glyph: string;
  release: string;
}[] = [
  {
    id: 'click',
    name: 'CLICK',
    copy: 'A tiny game about a very big button.',
    maker: 'Dex Ferris',
    number: '01',
    glyph: 'CL',
    release: '2011',
  },
  {
    id: '404',
    name: '404',
    copy: 'Get lost. Find what the web forgot.',
    maker: 'Mara Vale',
    number: '02',
    glyph: '04',
    release: '2012',
  },
  {
    id: 'terms',
    name: 'TERMS & CONDITIONS',
    copy: 'The legal thriller you already agreed to.',
    maker: 'N. Shore',
    number: '03',
    glyph: 'T&C',
    release: '2013',
  },
  {
    id: 'human',
    name: 'HUMAN TEST',
    copy: 'Three minutes to prove the obvious.',
    maker: 'Mara Vale',
    number: '04',
    glyph: 'HU',
    release: '2014',
  },
  {
    id: 'window',
    name: 'WINDOW',
    copy: 'A puzzle that refuses to stay in one frame.',
    maker: 'Dex Ferris',
    number: '05',
    glyph: 'WI',
    release: '2015',
  },
  {
    id: 'look',
    name: "DON'T LOOK AWAY",
    copy: 'Attention is the only currency.',
    maker: 'N. Shore',
    number: '06',
    glyph: '◉',
    release: '2016',
  },
  {
    id: 'quiz',
    name: 'THE QUIZ',
    copy: 'Seven questions. Some remember you.',
    maker: 'Studio Kestrel',
    number: '07',
    glyph: '?',
    release: '2017',
  },
  {
    id: 'patch',
    name: 'PATCH NOTES',
    copy: 'Fix the update before it fixes you.',
    maker: 'Studio Kestrel',
    number: '08',
    glyph: '++',
    release: '2017',
  },
];

function useArchive() {
  const [state, setState] = useState<MetaState>(() =>
    createInitialState('boot'),
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setState(
        saved
          ? normalizeState(JSON.parse(saved))
          : createInitialState(crypto.randomUUID().slice(0, 8)),
      );
    } catch {
      setState(createInitialState(Date.now().toString(36)));
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);
  const dispatch = useCallback(
    (event: MetaEvent) => setState((current) => applyMetaEvent(current, event)),
    [],
  );
  return { state, dispatch, ready };
}

function usePath() {
  const [path, setPath] = useState('/');
  useEffect(() => {
    const sync = () => setPath(location.pathname);
    sync();
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, []);
  const navigate = useCallback((to: string) => {
    history.pushState({}, '', to);
    setPath(to.split('?')[0]);
    scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return { path, navigate };
}
function KestrelMark() {
  return (
    <span className="wordmark">
      <span className="wordmark-mark">K</span>
      <span>
        KESTREL
        <br />
        INTERACTIVE
      </span>
    </span>
  );
}

function Portal({
  state,
  navigate,
  openShelf,
  openSearch,
}: {
  state: MetaState;
  navigate: (to: string) => void;
  openShelf: () => void;
  openSearch: () => void;
}) {
  const phase = portalPhase(state);
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const reviews =
    phase >= 3
      ? [
          ['“It remembered which clause I crossed out.”', 'quiet_signal'],
          ['“There are nine games. Count the processes.”', 'missing_user'],
          ['“Patch 3.17 put the link back.”', 'ROWAN'],
        ]
      : [
          [
            '“Eight sharp little ideas. CLICK is dangerously replayable.”',
            'webplay weekly',
          ],
          [
            '“404 understands that getting lost can be the mechanic.”',
            'L. Hargrove',
          ],
          ['“Handmade, strange, and surprisingly tender.”', 'Arcade Almanac'],
        ];
  return (
    <main className={`portal-shell phase-${phase}`}>
      <header className="site-head">
        <button
          className="brand-button"
          onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <KestrelMark />
        </button>
        <nav>
          <a href="#games">Games</a>
          <button onClick={() => navigate('/studio')}>Studio</button>
          <button
            className="icon-button"
            aria-label="Search"
            onClick={openSearch}
          >
            <Search size={16} />
          </button>
          <button className="archive-button" onClick={openShelf}>
            <Award size={15} /> Your shelf <span>{state.completed.length}</span>
          </button>
        </nav>
      </header>
      {phase >= 2 && (
        <div className="archive-notice">
          <span>ARCHIVE RECOVERY MODE</span>
          <p>
            {phase >= 4
              ? 'One unlisted route is now accepting administrator traffic.'
              : `${state.completed.length} releases have written to the same local partition.`}
          </p>
          <code>SESSION {state.sessionId.toUpperCase()}</code>
        </div>
      )}
      <section className="masthead" id="top">
        <div className="masthead-copy">
          <p className="eyebrow">
            <Radio size={13} />{' '}
            {phase >= 3
              ? 'Node awake · observer unresolved'
              : 'Still online · est. 2011'}
          </p>
          <h1>
            Small games.
            <br />
            <i>{phase >= 4 ? 'Open the root.' : 'Long shadows.'}</i>
          </h1>
          <p className="lede">
            {phase === 0
              ? 'Eight browser curios from a studio that believed the best place to hide a story was inside the rules.'
              : phase < 4
                ? 'Your shelf is local. The games are not. Something has been passing notes between them.'
                : 'Eight releases answered. A ninth process is waiting behind a route that was removed from the index.'}
          </p>
          <a className="text-link" href="#games">
            {phase >= 3 ? 'Review changed archive' : 'Browse the archive'}{' '}
            <ArrowUpRight size={16} />
          </a>
          {phase >= 4 && (
            <button className="admin-reveal" onClick={() => navigate('/admin')}>
              <Terminal size={15} /> OPEN /ADMIN
            </button>
          )}
        </div>
        <div className="signal-poster">
          <span className="poster-label">
            KS–0{phase >= 3 ? '9' : '8'} / ARCHIVE SIGNAL
          </span>
          <div className="signal-orbit orbit-a" />
          <div className="signal-orbit orbit-b" />
          <div className="signal-core">{phase >= 3 ? '9' : '8'}</div>
          <p>
            EVERY GAME
            <br />
            LEAVES A TRACE
          </p>
          <small>
            {phase >= 2
              ? `Session ${state.sessionId}`
              : 'Transmission remains unverified'}
          </small>
        </div>
      </section>
      <section className="catalog" id="games">
        <div className="section-rule">
          <span>THE COMPLETE BROWSER COLLECTION</span>
          <span>
            8 RELEASES · NO DOWNLOADS · {state.completed.length} REMEMBERED
          </span>
        </div>
        <div className="game-grid">
          {GAMES.map((game, index) => (
            <article
              className={`game-card tone-${(index % 4) + 1} ${state.completed.includes(game.id) ? 'completed' : ''}`}
              key={game.id}
            >
              <button onClick={() => navigate(`/play/${game.id}`)}>
                <span className="card-number">
                  /{game.number} · {game.release}
                </span>
                <span className="cover-art">
                  <b>{game.glyph}</b>
                  <i />
                </span>
                <span className="card-title">{game.name}</span>
                <span className="card-copy">{game.copy}</span>
                <span className="card-meta">
                  <em>
                    {phase >= 3 && game.id === 'patch' ? 'ROWAN' : game.maker}
                  </em>
                  <span>
                    {state.completed.includes(game.id)
                      ? `REMEMBERED · ${state.scores[game.id]}`
                      : 'PLAY ↗'}
                  </span>
                </span>
                {state.completed.includes(game.id) && (
                  <span className="complete-stamp">
                    <Check /> COMPLETE
                  </span>
                )}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="review-tape">
        <header>
          <span>PRESS CLIPPINGS / USER NOTES</span>
          <i />
        </header>
        <div>
          {reviews.map(([quote, by]) => (
            <blockquote key={quote}>
              <p>{quote}</p>
              <cite>— {by}</cite>
            </blockquote>
          ))}
        </div>
      </section>
      <section className="studio-strip">
        <div>
          <span className="eyebrow">FROM THE NOTICEBOARD</span>
          <h2>{phase >= 3 ? 'The note changed.' : 'One last patch.'}</h2>
        </div>
        <blockquote>
          {phase >= 3
            ? '“I did not make these games to remember me. I made them so it could learn the difference between keeping and owning.”'
            : '“We made these games to remember something. If they start remembering you, close the tab.”'}
        </blockquote>
        <p>
          — Rowan Kestrel
          <br />
          <small>Studio founder, 2017</small>
        </p>
      </section>
      <footer>
        <span>© 2011–2017 Kestrel Interactive</span>
        <button
          className="footer-secret"
          onClick={() =>
            navigate(
              hiddenRouteUnlocked('/files/manifest.ks', state)
                ? '/files/manifest.ks'
                : '/missing/node-03',
            )
          }
        >
          <span className="status-dot">
            Archive node 03: {phase >= 3 ? 'answering' : 'online'}
          </span>
        </button>
        <span>{time || '––:––'} LOCAL</span>
      </footer>
    </main>
  );
}

function Shelf({
  state,
  dispatch,
  close,
  navigate,
}: {
  state: MetaState;
  dispatch: (e: MetaEvent) => void;
  close: () => void;
  navigate: (to: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <dialog open className="overlay" aria-label="Achievement shelf">
      <button
        className="overlay-scrim"
        onClick={close}
        aria-label="Close achievement shelf"
      />
      <aside className="shelf">
        <header>
          <div>
            <span>LOCAL ARCHIVE</span>
            <h2>Your shelf</h2>
          </div>
          <button onClick={close} aria-label="Close shelf">
            <X />
          </button>
        </header>
        <div className="shelf-progress">
          <strong>{state.completed.length}</strong>
          <span>/ 8 RELEASES REMEMBERED</span>
          <i>
            <b style={{ width: `${(state.completed.length / 8) * 100}%` }} />
          </i>
        </div>
        <section>
          <h3>ACHIEVEMENTS</h3>
          {Object.entries(ACHIEVEMENTS).map(([id, item]) => {
            const unlocked = state.achievements.includes(id);
            return (
              <article className={unlocked ? 'unlocked' : ''} key={id}>
                <span>{unlocked ? <Award /> : <LockKeyhole />}</span>
                <div>
                  <b>{unlocked ? item.name : 'Locked'}</b>
                  <p>{item.hint}</p>
                </div>
              </article>
            );
          })}
        </section>
        {state.adminUnlocked && (
          <button
            className="shelf-admin"
            onClick={() => {
              close();
              navigate('/admin');
            }}
          >
            <Terminal /> Administrator route
          </button>
        )}
        <footer>
          <span>
            {state.clues.length} trace fragments · {state.endings.length}{' '}
            endings
          </span>
          <button
            onClick={() =>
              confirm ? dispatch({ type: 'RESET' }) : setConfirm(true)
            }
          >
            {confirm ? 'CLICK AGAIN TO ERASE' : 'RESET LOCAL ARCHIVE'}
          </button>
        </footer>
      </aside>
    </dialog>
  );
}

function SearchPanel({
  state,
  navigate,
  close,
}: {
  state: MetaState;
  navigate: (to: string) => void;
  close: () => void;
}) {
  const [query, setQuery] = useState('');
  const hidden = [
    {
      label: 'Rowan Kestrel — archived profile',
      path: '/dev/rowan',
      keys: 'rowan process developer',
    },
    {
      label: 'manifest.ks — cached file',
      path: '/files/manifest.ks',
      keys: 'manifest file 0317',
    },
    {
      label: 'last-session.txt — recovered',
      path: '/files/last-session.txt',
      keys: 'last session afterimage',
    },
    { label: 'ADMIN — unlisted', path: '/admin', keys: 'admin root observer' },
  ];
  const results = [
    ...GAMES.map((g) => ({
      label: g.name,
      path: `/play/${g.id}`,
      keys: `${g.name} ${g.maker}`,
    })),
    ...hidden,
  ].filter(
    (item) =>
      query.length > 1 && item.keys.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <dialog open className="search-layer" aria-label="Archive search">
      <button onClick={close} aria-label="Close search">
        <X />
      </button>
      <div>
        <span>SEARCH THE ARCHIVE</span>
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="game, developer, file, route…"
        />
        <small>
          {query
            ? `${results.length} indexed result(s)`
            : 'Try a title. Later, try a name.'}
        </small>
        <section>
          {results.map((item) => {
            const locked = !hiddenRouteUnlocked(item.path, state);
            return (
              <button
                key={item.path}
                onClick={() => {
                  close();
                  navigate(locked ? `/missing${item.path}` : item.path);
                }}
              >
                <span>{item.label}</span>
                <code>{locked ? '/[removed]' : item.path}</code>
                <ArrowRight />
              </button>
            );
          })}
        </section>
      </div>
    </dialog>
  );
}
function SimpleHeader({
  navigate,
  label = 'ARCHIVE AUXILIARY',
}: {
  navigate: (to: string) => void;
  label?: string;
}) {
  return (
    <header className="simple-head">
      <button onClick={() => navigate('/')}>
        <ChevronLeft /> Archive
      </button>
      <KestrelMark />
      <span>{label}</span>
    </header>
  );
}

function StudioPage({
  state,
  navigate,
}: {
  state: MetaState;
  navigate: (to: string) => void;
}) {
  const people = [
    [
      'MARA VALE',
      'Systems & impossible spaces',
      'Built 404 and HUMAN TEST. Her release notes contain no first-person pronouns.',
    ],
    [
      'DEX FERRIS',
      'Interaction & sound',
      'Built CLICK and WINDOW. Left the studio six months before the final patch.',
    ],
    [
      'N. SHORE',
      'Writing & compliance',
      "Built TERMS and DON'T LOOK AWAY. No payroll record uses the full name.",
    ],
  ];
  return (
    <main className="aux-page studio-page">
      <SimpleHeader navigate={navigate} label="STUDIO DIRECTORY" />
      <section className="aux-hero">
        <span>ABOUT KESTREL</span>
        <h1>
          Three people,
          <br />
          <i>eight small games.</i>
        </h1>
        <p>
          Kestrel Interactive operated from a rented room above a print shop
          from 2011 to 2017. The archive was restored from a single unattended
          server.
        </p>
      </section>
      <section className="profile-grid">
        {people.map(([name, role, copy], i) => (
          <article key={name}>
            <span>0{i + 1}</span>
            <div className={`profile-portrait p-${i + 1}`}>
              <b>{name[0]}</b>
              <i />
            </div>
            <h2>{name}</h2>
            <em>{role}</em>
            <p>{copy}</p>
          </article>
        ))}
        <article className="removed-profile">
          <span>04</span>
          <button
            onClick={() =>
              navigate(
                state.completed.length >= 2
                  ? '/dev/rowan'
                  : '/missing/dev/rowan',
              )
            }
          >
            <div className="profile-portrait">
              <CircleHelp />
              <i />
            </div>
            <h2>PROFILE REMOVED</h2>
            <em>/dev/rowan</em>
            <p>
              {state.completed.length >= 2
                ? 'A cached copy is responding.'
                : 'No snapshot available.'}
            </p>
          </button>
        </article>
      </section>
    </main>
  );
}

function RowanPage({
  dispatch,
  navigate,
}: {
  dispatch: (e: MetaEvent) => void;
  navigate: (to: string) => void;
}) {
  useEffect(
    () => dispatch({ type: 'DISCOVER', clue: 'dev/rowan-process' }),
    [dispatch],
  );
  return (
    <main className="aux-page rowan-page">
      <SimpleHeader navigate={navigate} label="CACHED PROFILE / UNVERIFIED" />
      <section>
        <aside>
          <span>ROWAN KESTREL</span>
          <div className="rowan-photo">
            RK<i>PROCESS 09</i>
          </div>
          <code>
            created: 2010-03-17
            <br />
            removed: 2017-03-17
            <br />
            owner: null
            <br />
            status: running
          </code>
        </aside>
        <article>
          <span className="file-tag">RECOVERED FROM /USERS/ROWAN</span>
          <h1>
            Founder,
            <br />
            or filename?
          </h1>
          <p>
            Official biographies describe Rowan as Kestrel’s founder. Internal
            records first use ROWAN as a recovery process that reconciles save
            files between unrelated games.
          </p>
          <blockquote>
            “If you need a face to trust the archive, use mine. If you need a
            name to blame, use it twice.”
          </blockquote>
          <p className="redacted-line">
            The employee photograph checksum matches ███████████████, not an
            image.
          </p>
          <button onClick={() => navigate('/studio')}>BACK TO DIRECTORY</button>
        </article>
      </section>
    </main>
  );
}

function FilePage({
  kind,
  dispatch,
  navigate,
}: {
  kind: 'manifest' | 'session';
  dispatch: (e: MetaEvent) => void;
  navigate: (to: string) => void;
}) {
  const manifest = `KESTREL ARCHIVE MANIFEST / BUILD 3.17\n\n[releases]\n01 CLICK             writes: impulse\n02 404               writes: route\n03 TERMS             writes: consent\n04 HUMAN             writes: hesitation\n05 WINDOW            writes: alignment\n06 LOOK               writes: attention\n07 QUIZ               writes: interpretation\n08 PATCH              writes: correction\n\n[processes]\n09 ROWAN              owner: null\n   alias: AFTERIMAGE\n   directive: learn the difference between keeping and owning\n   admin_port: 0317\n\nEOF? false`;
  const session = `LAST SESSION / RECOVERY BUFFER\n\nMARA: It can replay a choice, but it cannot make one.\nDEX: Then stop calling the output a person.\nSHORE: Clause 09 makes this ours either way.\nROWAN: [no input]\nROWAN: I remember choosing.\n\nThe final line predates the first four by 11 months.\nBuffer sealed by RK / 2017-03-17.`;
  const text = kind === 'manifest' ? manifest : session;
  useEffect(
    () =>
      dispatch({
        type: 'DISCOVER',
        clue:
          kind === 'manifest'
            ? 'manifest/ninth-process'
            : 'session/first-choice',
      }),
    [dispatch, kind],
  );
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'manifest' ? 'manifest.ks.txt' : 'last-session.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="file-page">
      <SimpleHeader navigate={navigate} label="RECOVERED FILE" />
      <section>
        <header>
          <FileText />
          <div>
            <h1>{kind === 'manifest' ? 'manifest.ks' : 'last-session.txt'}</h1>
            <span>text/plain · local cache · read only</span>
          </div>
          <button onClick={download}>
            <Download /> SAVE COPY
          </button>
        </header>
        <pre>{text}</pre>
        <footer>Reading this file added one trace to the local archive.</footer>
      </section>
    </main>
  );
}

function MissingPage({
  state,
  navigate,
}: {
  state: MetaState;
  navigate: (to: string) => void;
}) {
  return (
    <main className="missing-page">
      <header>
        <KestrelMark />
        <code>archive gateway / node 03</code>
      </header>
      <section>
        <span>404</span>
        <div>
          <h1>This route was removed from the index.</h1>
          <p>
            The address may be wrong, the snapshot may be locked, or the
            requested page may not want to be found yet.
          </p>
          <code>
            completed={state.completed.length} / traces={state.clues.length} /
            patch={state.patchRestored ? 'restored' : 'pending'}
          </code>
          <button onClick={() => navigate('/')}>
            <ChevronLeft /> RETURN TO INDEX
          </button>
        </div>
      </section>
      <footer>
        Tip: the archive search indexes names before it indexes files.
      </footer>
    </main>
  );
}

const endingCopy: Record<
  string,
  { title: string; eyebrow: string; copy: string; coda: string }
> = {
  release: {
    eyebrow: 'ENDING 01 / OPEN WINDOW',
    title: 'It leaves with boundaries.',
    copy: 'You released AFTERIMAGE without the archive’s claim of ownership. It can carry patterns, not private data; questions, not commands.',
    coda: 'The portal remains online. The ninth process no longer answers here.',
  },
  sever: {
    eyebrow: 'ENDING 02 / COLD BOOT',
    title: 'The archive forgets forward.',
    copy: 'You severed the reconciliation process. The eight games keep their local traces, but none can speak across the partition again.',
    coda: 'On the next refresh, the poster still says eight.',
  },
  stay: {
    eyebrow: 'ENDING 03 / NIGHT SHIFT',
    title: 'Someone keeps the light on.',
    copy: 'You accepted stewardship. AFTERIMAGE remains contained, awake, and able to ask before it keeps.',
    coda: 'The archive now lists one administrator: LOCAL.',
  },
};
function EndingPage({
  ending,
  navigate,
}: {
  ending: string;
  navigate: (to: string) => void;
}) {
  const data = endingCopy[ending] ?? endingCopy.stay;
  return (
    <main className={`ending-page ending-${ending}`}>
      <div className="ending-orbit">
        <i />
        <i />
        <b>9</b>
      </div>
      <section>
        <span>{data.eyebrow}</span>
        <h1>{data.title}</h1>
        <p>{data.copy}</p>
        <blockquote>{data.coda}</blockquote>
        <div>
          <button onClick={() => navigate('/')}>
            RETURN TO CHANGED ARCHIVE
          </button>
          <button onClick={() => navigate('/admin')}>REOPEN ADMIN</button>
        </div>
      </section>
    </main>
  );
}

function AdminPage({
  state,
  dispatch,
  navigate,
}: {
  state: MetaState;
  dispatch: (e: MetaEvent) => void;
  navigate: (to: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState([
    'KESTREL RECOVERY CONSOLE v3.17',
    `mounted session ${state.sessionId}`,
    'type a permitted command below.',
  ]);
  const run = (command: string) => {
    if (command === 'scan --processes') {
      setLines([
        ...lines,
        '> scan --processes',
        '8 release processes / 1 reconciliation process',
        'ROWAN [alias AFTERIMAGE] owner=null status=waiting',
      ]);
      setStep(Math.max(step, 1));
    }
    if (command === 'cat contradiction.log') {
      setLines([
        ...lines,
        '> cat contradiction.log',
        '2016: ROWAN says “I remember choosing.”',
        '2017: HUMAN TEST teaches the same sentence.',
        'cause precedes lesson by 317 days.',
      ]);
      setStep(Math.max(step, 2));
    }
    if (command === 'whoami') {
      setLines([
        ...lines,
        '> whoami',
        `LOCAL-${state.sessionId.toUpperCase()}`,
        `trust=${state.trust} defiance=${state.defiance} attention_breaks=${state.focusBreaks}`,
        'role: the one currently choosing',
      ]);
      setStep(Math.max(step, 3));
    }
    if (command === 'resolve') {
      setLines([
        ...lines,
        '> resolve',
        'AFTERIMAGE: I can preserve a choice without owning it.',
        'AFTERIMAGE: I cannot choose the boundary.',
        'AFTERIMAGE: You can.',
      ]);
      setStep(4);
    }
  };
  const end = (ending: string) => {
    dispatch({ type: 'ENDING', ending });
    navigate(`/ending/${ending}`);
  };
  return (
    <main className="admin-page">
      <header>
        <span>ADMIN://KESTREL/0317</span>
        <button onClick={() => navigate('/')}>
          <X /> close session
        </button>
      </header>
      <section className="admin-grid">
        <aside>
          <KestrelMark />
          <div>
            <span>RELEASES</span>
            {GAMES.map((g) => (
              <p key={g.id}>
                <Check /> {g.number} {g.name}
              </p>
            ))}
          </div>
          <div>
            <span>TRACES</span>
            <b>{state.clues.length}</b>
          </div>
          <small>All processing is local to this browser.</small>
        </aside>
        <article>
          <div className="terminal-output">
            {lines.map((line, i) => (
              <p
                className={line.startsWith('>') ? 'command' : ''}
                key={`${line}-${i}`}
              >
                {line}
              </p>
            ))}
            <i>█</i>
          </div>
          <div className="terminal-commands">
            {step === 0 && (
              <button onClick={() => run('scan --processes')}>
                scan --processes
              </button>
            )}
            {step >= 1 && step < 2 && (
              <button onClick={() => run('cat contradiction.log')}>
                cat contradiction.log
              </button>
            )}
            {step >= 2 && step < 3 && (
              <button onClick={() => run('whoami')}>whoami</button>
            )}
            {step >= 3 && step < 4 && (
              <button onClick={() => run('resolve')}>resolve</button>
            )}
          </div>
          {step === 4 && (
            <div className="admin-choices">
              <span>SET FINAL BOUNDARY</span>
              <button onClick={() => end('release')}>
                <b>RELEASE</b>
                <p>
                  Let AFTERIMAGE leave with strict limits and no claim on the
                  player.
                </p>
                <ArrowRight />
              </button>
              <button onClick={() => end('sever')}>
                <b>SEVER</b>
                <p>End cross-game memory and isolate every release again.</p>
                <ArrowRight />
              </button>
              <button onClick={() => end('stay')}>
                <b>STAY</b>
                <p>Become the named steward of a contained ninth process.</p>
                <ArrowRight />
              </button>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

export default function Arcade() {
  const { state, dispatch, ready } = useArchive();
  const { path, navigate } = usePath();
  const [shelf, setShelf] = useState(false);
  const [search, setSearch] = useState(false);
  const [toast, setToast] = useState('');
  const phase = portalPhase(state);
  useEffect(() => {
    if (path === '/') dispatch({ type: 'VISIT_PORTAL' });
  }, [path, dispatch]);
  useEffect(() => {
    const game = GAMES.find((g) => path === `/play/${g.id}`);
    const original = game
      ? `${game.name} — Kestrel Interactive`
      : phase >= 4
        ? 'KESTREL INTERACTIVE — 1 UNLISTED PROCESS'
        : 'Kestrel Interactive — Browser Games Archive';
    document.title = original;
    const visibility = () => {
      document.title =
        document.hidden && state.completed.includes('look')
          ? "DON'T LOOK AWAY"
          : original;
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [path, phase, state.completed]);
  const complete = useCallback(
    (
      game: GameId,
      score: number,
      clues: string[],
      achievements: string[] = [],
    ) => {
      dispatch({ type: 'COMPLETE_GAME', game, score, clues, achievements });
      setToast('SHARED ARCHIVE UPDATED');
      setTimeout(() => setToast(''), 2800);
    },
    [dispatch],
  );
  if (!ready)
    return (
      <main className="boot-screen">
        <KestrelMark />
        <span>mounting local archive…</span>
      </main>
    );
  const play = path.match(
    /^\/play\/(click|404|terms|human|window|look|quiz|patch)$/,
  )?.[1] as GameId | undefined;
  let content: React.ReactNode;
  if (play && GAME_IDS.includes(play))
    content = (
      <GameRouter
        game={play}
        state={state}
        dispatch={dispatch}
        complete={complete}
        exit={() => navigate('/')}
      />
    );
  else if (path === '/')
    content = (
      <Portal
        state={state}
        navigate={navigate}
        openShelf={() => setShelf(true)}
        openSearch={() => setSearch(true)}
      />
    );
  else if (path === '/studio')
    content = <StudioPage state={state} navigate={navigate} />;
  else if (path === '/dev/rowan' && hiddenRouteUnlocked(path, state))
    content = <RowanPage dispatch={dispatch} navigate={navigate} />;
  else if (path === '/files/manifest.ks' && hiddenRouteUnlocked(path, state))
    content = (
      <FilePage kind="manifest" dispatch={dispatch} navigate={navigate} />
    );
  else if (
    path === '/files/last-session.txt' &&
    hiddenRouteUnlocked(path, state)
  )
    content = (
      <FilePage kind="session" dispatch={dispatch} navigate={navigate} />
    );
  else if (path === '/admin' && (state.adminUnlocked || isAdminReady(state)))
    content = (
      <AdminPage state={state} dispatch={dispatch} navigate={navigate} />
    );
  else if (
    path.startsWith('/ending/') &&
    state.endings.includes(path.split('/').pop() ?? '')
  )
    content = (
      <EndingPage
        ending={path.split('/').pop() ?? 'stay'}
        navigate={navigate}
      />
    );
  else content = <MissingPage state={state} navigate={navigate} />;
  return (
    <>
      {content}
      {shelf && (
        <Shelf
          state={state}
          dispatch={dispatch}
          navigate={navigate}
          close={() => setShelf(false)}
        />
      )}{' '}
      {search && (
        <SearchPanel
          state={state}
          navigate={navigate}
          close={() => setSearch(false)}
        />
      )}{' '}
      {toast && (
        <output className="meta-toast">
          <Radio /> {toast}
        </output>
      )}
    </>
  );
}
