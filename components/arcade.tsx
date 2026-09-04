'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  Upload,
  X,
} from 'lucide-react';
import {
  ACHIEVEMENTS,
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
  type GameId,
  type MetaEvent,
  type MetaState,
} from '@/lib/meta';
import { GameRouter } from '@/components/games';
import { L, LanguageSwitch, useLocale } from '@/lib/i18n';

const STORAGE_KEY = 'kestrel.archive.v3';
const GAMES: {
  id: GameId;
  name: string;
  nameZh: string;
  copy: string;
  copyZh: string;
  maker: string;
  makerZh: string;
  number: string;
  glyph: string;
  release: string;
}[] = [
  {
    id: 'click',
    name: 'CLICK',
    nameZh: '点击',
    copy: 'A tiny game about a very big button.',
    copyZh: '一个关于巨大按钮的微小游戏。',
    maker: 'Dex Ferris',
    makerZh: '德克斯·费里斯',
    number: '01',
    glyph: 'CL',
    release: '2011',
  },
  {
    id: '404',
    name: '404',
    nameZh: '页面未找到',
    copy: 'Get lost. Find what the web forgot.',
    copyZh: '迷路，然后找到网络遗忘之物。',
    maker: 'Mara Vale',
    makerZh: '玛拉·维尔',
    number: '02',
    glyph: '04',
    release: '2012',
  },
  {
    id: 'terms',
    name: 'TERMS & CONDITIONS',
    nameZh: '条款与条件',
    copy: 'The legal thriller you already agreed to.',
    copyZh: '一部你早已同意出演的法律惊悚剧。',
    maker: 'N. Shore',
    makerZh: '诺尔·肖尔',
    number: '03',
    glyph: 'T&C',
    release: '2013',
  },
  {
    id: 'human',
    name: 'HUMAN TEST',
    nameZh: '人类测试',
    copy: 'Three minutes to prove the obvious.',
    copyZh: '用三分钟证明一件显而易见的事。',
    maker: 'Mara Vale',
    makerZh: '玛拉·维尔',
    number: '04',
    glyph: 'HU',
    release: '2014',
  },
  {
    id: 'window',
    name: 'WINDOW',
    nameZh: '窗口',
    copy: 'A puzzle that refuses to stay in one frame.',
    copyZh: '一道拒绝待在单个窗口里的谜题。',
    maker: 'Dex Ferris',
    makerZh: '德克斯·费里斯',
    number: '05',
    glyph: 'WI',
    release: '2015',
  },
  {
    id: 'look',
    name: "DON'T LOOK AWAY",
    nameZh: '别移开视线',
    copy: 'Attention is the only currency.',
    copyZh: '注意力是唯一的货币。',
    maker: 'N. Shore',
    makerZh: '诺尔·肖尔',
    number: '06',
    glyph: '◉',
    release: '2016',
  },
  {
    id: 'quiz',
    name: 'THE QUIZ',
    nameZh: '测验',
    copy: 'Seven questions. Some remember you.',
    copyZh: '七个问题，其中一些记得你。',
    maker: 'Studio Kestrel',
    makerZh: 'Kestrel 工作室',
    number: '07',
    glyph: '?',
    release: '2017',
  },
  {
    id: 'patch',
    name: 'PATCH NOTES',
    nameZh: '补丁说明',
    copy: 'Fix the update before it fixes you.',
    copyZh: '在更新修正你之前，先修好它。',
    maker: 'Studio Kestrel',
    makerZh: 'Kestrel 工作室',
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
  const { lang } = useLocale();
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
          [
            L(
              lang,
              '“It remembered which clause I crossed out.”',
              '“它记得我划掉了哪一条。”',
            ),
            'quiet_signal',
          ],
          [
            L(
              lang,
              '“There are nine games. Count the processes.”',
              '“这里有九个游戏。数数进程。”',
            ),
            'missing_user',
          ],
          [
            L(
              lang,
              '“Patch 3.17 put the link back.”',
              '“3.17 补丁把那个链接放回来了。”',
            ),
            'ROWAN',
          ],
        ]
      : [
          [
            L(
              lang,
              '“Eight sharp little ideas. CLICK is dangerously replayable.”',
              '“八个锋利的小点子。CLICK 让人危险地停不下来。”',
            ),
            'webplay weekly',
          ],
          [
            L(
              lang,
              '“404 understands that getting lost can be the mechanic.”',
              '“404 明白：迷路本身也可以是玩法。”',
            ),
            'L. Hargrove',
          ],
          [
            L(
              lang,
              '“Handmade, strange, and surprisingly tender.”',
              '“手工感、古怪，而且意外地温柔。”',
            ),
            'Arcade Almanac',
          ],
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
          <a href="#games">{L(lang, 'Games', '游戏')}</a>
          <button onClick={() => navigate('/studio')}>
            {L(lang, 'Studio', '工作室')}
          </button>
          <LanguageSwitch />
          <button
            className="icon-button"
            aria-label="Search"
            onClick={openSearch}
          >
            <Search size={16} />
          </button>
          <button className="archive-button" onClick={openShelf}>
            <Award size={15} /> {L(lang, 'Your shelf', '我的藏品')}{' '}
            <span>{state.completed.length}</span>
          </button>
        </nav>
      </header>
      {phase >= 2 && (
        <div className="archive-notice">
          <span>{L(lang, 'ARCHIVE RECOVERY MODE', '档案恢复模式')}</span>
          <p>
            {phase >= 4
              ? L(
                  lang,
                  'One unlisted route is now accepting administrator traffic.',
                  '一条未列出的路径正在接受管理员访问。',
                )
              : L(
                  lang,
                  `${state.completed.length} releases have written to the same local partition.`,
                  `${state.completed.length} 个游戏已写入同一份本地分区。`,
                )}
          </p>
          <code>
            {L(lang, 'SESSION', '会话')} {state.sessionId.toUpperCase()}
          </code>
        </div>
      )}
      <section className="masthead" id="top">
        <div className="masthead-copy">
          <p className="eyebrow">
            <Radio size={13} />{' '}
            {phase >= 3
              ? L(
                  lang,
                  'Node awake · observer unresolved',
                  '节点已唤醒 · 观察者未解决',
                )
              : L(lang, 'Still online · est. 2011', '仍在线 · 始于 2011')}
          </p>
          <h1>
            {L(lang, 'Small games.', '小小的游戏。')}
            <br />
            <i>
              {phase >= 4
                ? L(lang, 'Open the root.', '打开根目录。')
                : L(lang, 'Long shadows.', '长长的影子。')}
            </i>
          </h1>
          <p className="lede">
            {phase === 0
              ? L(
                  lang,
                  'Eight browser curios from a studio that believed the best place to hide a story was inside the rules.',
                  '八款浏览器奇作，来自一家相信“故事最适合藏在规则里”的工作室。',
                )
              : phase < 4
                ? L(
                    lang,
                    'Your shelf is local. The games are not. Something has been passing notes between them.',
                    '藏品只存在本地，游戏之间却并不孤立。有什么东西一直在替它们传递纸条。',
                  )
                : L(
                    lang,
                    'Eight releases answered. A ninth process is waiting behind a route that was removed from the index.',
                    '八个游戏都已回应。第九个进程正在一条从索引中删除的路径后等待。',
                  )}
          </p>
          <a className="text-link" href="#games">
            {phase >= 3
              ? L(lang, 'Review changed archive', '查看已改变的档案')
              : L(lang, 'Browse the archive', '浏览档案')}{' '}
            <ArrowUpRight size={16} />
          </a>
          {phase >= 4 && (
            <button className="admin-reveal" onClick={() => navigate('/admin')}>
              <Terminal size={15} /> {L(lang, 'OPEN /ADMIN', '打开 /ADMIN')}
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
            {L(lang, 'EVERY GAME', '每个游戏')}
            <br />
            {L(lang, 'LEAVES A TRACE', '都会留下痕迹')}
          </p>
          <small>
            {phase >= 2
              ? `Session ${state.sessionId}`
              : L(lang, 'Transmission remains unverified', '传输仍未验证')}
          </small>
        </div>
      </section>
      <section className="catalog" id="games">
        <div className="section-rule">
          <span>
            {L(lang, 'THE COMPLETE BROWSER COLLECTION', '完整浏览器游戏合集')}
          </span>
          <span>
            {L(lang, '8 RELEASES · NO DOWNLOADS', '8 个游戏 · 无需下载')} ·{' '}
            {state.completed.length} {L(lang, 'REMEMBERED', '已记住')}
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
                <span className="card-copy">
                  {lang === 'zh' ? game.copyZh : game.copy}
                </span>
                <span className="card-meta">
                  <em>
                    {phase >= 3 && game.id === 'patch' ? 'ROWAN' : game.maker}
                  </em>
                  <span>
                    {state.completed.includes(game.id)
                      ? `${L(lang, 'REMEMBERED', '已记住')} · ${state.scores[game.id]}`
                      : L(lang, 'PLAY ↗', '开始 ↗')}
                  </span>
                </span>
                {state.completed.includes(game.id) && (
                  <span className="complete-stamp">
                    <Check /> {L(lang, 'COMPLETE', '已完成')}
                  </span>
                )}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="review-tape">
        <header>
          <span>
            {L(lang, 'PRESS CLIPPINGS / USER NOTES', '媒体摘录 / 玩家留言')}
          </span>
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
          <span className="eyebrow">
            {L(lang, 'FROM THE NOTICEBOARD', '来自公告板')}
          </span>
          <h2>
            {phase >= 3
              ? L(lang, 'The note changed.', '纸条变了。')
              : L(lang, 'One last patch.', '最后一个补丁。')}
          </h2>
        </div>
        <blockquote>
          {phase >= 3
            ? L(
                lang,
                '“I did not make these games to remember me. I made them so it could learn the difference between keeping and owning.”',
                '“我做这些游戏，不是为了让它记住我，而是为了让它学会保存与占有之间的区别。”',
              )
            : L(
                lang,
                '“We made these games to remember something. If they start remembering you, close the tab.”',
                '“我们做这些游戏，是为了记住某些东西。如果它们开始记住你，就关掉标签页。”',
              )}
        </blockquote>
        <p>
          — Rowan Kestrel
          <br />
          <small>{L(lang, 'Studio founder, 2017', '工作室创始人，2017')}</small>
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
            {L(lang, 'Archive node 03', '档案节点 03')}：
            {phase >= 3
              ? L(lang, 'answering', '正在回应')
              : L(lang, 'online', '在线')}
          </span>
        </button>
        <span>
          {time || '––:––'} {L(lang, 'LOCAL', '本地')}
        </span>
      </footer>
    </main>
  );
}

function Shelf({
  state,
  dispatch,
  close,
  navigate,
  notify,
}: {
  state: MetaState;
  dispatch: (e: MetaEvent) => void;
  close: () => void;
  navigate: (to: string) => void;
  notify: (message: string) => void;
}) {
  const { lang } = useLocale();
  const [confirm, setConfirm] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  const exportCapsule = () => {
    const url = URL.createObjectURL(
      new Blob([serializeArchiveCapsule(state)], {
        type: 'application/json',
      }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `kestrel-archive-${state.sessionId}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify(L(lang, 'ARCHIVE CAPSULE EXPORTED', '存档胶囊已导出'));
  };

  const importCapsule = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > MAX_ARCHIVE_CAPSULE_SIZE)
        throw new Error('Archive capsule too large');
      const restored = parseArchiveCapsule(await file.text());
      dispatch({ type: 'RESTORE', state: restored });
      close();
      notify(L(lang, 'ARCHIVE CAPSULE RESTORED', '存档胶囊已恢复'));
    } catch {
      notify(
        L(
          lang,
          'CAPSULE REJECTED — CURRENT ARCHIVE UNCHANGED',
          '胶囊已拒绝——当前存档未改变',
        ),
      );
    }
  };

  return (
    <dialog
      open
      className="overlay"
      aria-label={L(lang, 'Achievement shelf', '成就陈列架')}
    >
      <button
        className="overlay-scrim"
        onClick={close}
        aria-label={L(lang, 'Close achievement shelf', '关闭成就陈列架')}
      />
      <aside className="shelf">
        <header>
          <div>
            <span>{L(lang, 'LOCAL ARCHIVE', '本地档案')}</span>
            <h2>{L(lang, 'Your shelf', '我的藏品')}</h2>
          </div>
          <button
            onClick={close}
            aria-label={L(lang, 'Close shelf', '关闭藏品')}
          >
            <X />
          </button>
        </header>
        <div className="shelf-progress">
          <strong>{state.completed.length}</strong>
          <span>/ {L(lang, '8 RELEASES REMEMBERED', '8 个游戏已记住')}</span>
          <i>
            <b style={{ width: `${(state.completed.length / 8) * 100}%` }} />
          </i>
        </div>
        <section>
          <h3>{L(lang, 'ACHIEVEMENTS', '成就')}</h3>
          {Object.entries(ACHIEVEMENTS).map(([id, item]) => {
            const unlocked = state.achievements.includes(id);
            return (
              <article className={unlocked ? 'unlocked' : ''} key={id}>
                <span>{unlocked ? <Award /> : <LockKeyhole />}</span>
                <div>
                  <b>
                    {unlocked
                      ? lang === 'zh'
                        ? item.nameZh
                        : item.name
                      : L(lang, 'Locked', '未解锁')}
                  </b>
                  <p>{lang === 'zh' ? item.hintZh : item.hint}</p>
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
            <Terminal /> {L(lang, 'Administrator route', '管理员路径')}
          </button>
        )}
        <section className="capsule-tools">
          <h3>{L(lang, 'ARCHIVE CAPSULE', '存档胶囊')}</h3>
          <p>
            {L(
              lang,
              'Move this local session between browsers without an account.',
              '无需账号，在不同浏览器之间转移这份本地会话。',
            )}
          </p>
          <div>
            <button type="button" onClick={exportCapsule}>
              <Download /> {L(lang, 'Export', '导出')}
            </button>
            <button type="button" onClick={() => importInput.current?.click()}>
              <Upload /> {L(lang, 'Import', '导入')}
            </button>
            <input
              ref={importInput}
              hidden
              type="file"
              accept="application/json,.json"
              aria-label={L(
                lang,
                'Choose an archive capsule to import',
                '选择要导入的存档胶囊',
              )}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                void importCapsule(file);
              }}
            />
          </div>
        </section>
        <footer>
          <span>
            {state.clues.length} {L(lang, 'trace fragments', '个痕迹碎片')} ·{' '}
            {state.endings.length} {L(lang, 'endings', '个结局')}
          </span>
          <button
            onClick={() =>
              confirm ? dispatch({ type: 'RESET' }) : setConfirm(true)
            }
          >
            {confirm
              ? L(lang, 'CLICK AGAIN TO ERASE', '再次点击以清除')
              : L(lang, 'RESET LOCAL ARCHIVE', '重置本地档案')}
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
  const { lang } = useLocale();
  const [query, setQuery] = useState('');
  const hidden = [
    {
      label: L(
        lang,
        'Rowan Kestrel — archived profile',
        'Rowan Kestrel — 已归档资料',
      ),
      path: '/dev/rowan',
      keys: 'rowan process developer 开发者 进程 已归档资料',
    },
    {
      label: L(lang, 'manifest.ks — cached file', 'manifest.ks — 缓存文件'),
      path: '/files/manifest.ks',
      keys: 'manifest file 0317 清单 文件 缓存',
    },
    {
      label: L(
        lang,
        'last-session.txt — recovered',
        'last-session.txt — 已恢复',
      ),
      path: '/files/last-session.txt',
      keys: 'last session afterimage 上次 会话 恢复 文件',
    },
    {
      label: L(lang, 'ADMIN — unlisted', 'ADMIN — 未列出'),
      path: '/admin',
      keys: 'admin root observer 管理员',
    },
  ];
  const results = [
    ...GAMES.map((g) => ({
      label: lang === 'zh' ? `${g.name} · ${g.nameZh}` : g.name,
      path: `/play/${g.id}`,
      keys: `${g.name} ${g.nameZh} ${g.maker} ${g.makerZh} ${g.copy} ${g.copyZh} game browser 游戏 浏览器`,
    })),
    {
      label: L(lang, 'Studio directory', '工作室名录'),
      path: '/studio',
      keys: 'studio kestrel developer team 工作室 开发者 团队 名录',
    },
    ...hidden,
  ].filter(
    (item) =>
      query.length > 1 && item.keys.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <dialog
      open
      className="search-layer"
      aria-label={L(lang, 'Archive search', '档案搜索')}
    >
      <button onClick={close} aria-label={L(lang, 'Close search', '关闭搜索')}>
        <X />
      </button>
      <div>
        <span>{L(lang, 'SEARCH THE ARCHIVE', '搜索档案')}</span>
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L(
            lang,
            'game, developer, file, route…',
            '游戏、开发者、文件、路径……',
          )}
        />
        <small>
          {query
            ? L(
                lang,
                `${results.length} indexed result(s)`,
                `${results.length} 个已索引结果`,
              )
            : L(
                lang,
                'Try a title. Later, try a name.',
                '先试试标题。之后，再试试名字。',
              )}
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
  const { lang } = useLocale();
  return (
    <header className="simple-head">
      <button onClick={() => navigate('/')}>
        <ChevronLeft /> {L(lang, 'Archive', '档案馆')}
      </button>
      <KestrelMark />
      <span className="simple-head-meta">
        <LanguageSwitch />
        <span>{label}</span>
      </span>
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
  const { lang } = useLocale();
  const people = [
    [
      'MARA VALE',
      L(lang, 'Systems & impossible spaces', '系统与不可能空间'),
      L(
        lang,
        'Built 404 and HUMAN TEST. Her release notes contain no first-person pronouns.',
        '创作了 404 与 HUMAN TEST。她的更新日志里没有第一人称代词。',
      ),
    ],
    [
      'DEX FERRIS',
      L(lang, 'Interaction & sound', '交互与声音'),
      L(
        lang,
        'Built CLICK and WINDOW. Left the studio six months before the final patch.',
        '创作了 CLICK 与 WINDOW。在最终补丁发布前六个月离开工作室。',
      ),
    ],
    [
      'N. SHORE',
      L(lang, 'Writing & compliance', '文本与合规'),
      L(
        lang,
        "Built TERMS and DON'T LOOK AWAY. No payroll record uses the full name.",
        '创作了 TERMS 与 DON’T LOOK AWAY。工资记录里从未出现其全名。',
      ),
    ],
  ];
  return (
    <main className="aux-page studio-page">
      <SimpleHeader
        navigate={navigate}
        label={L(lang, 'STUDIO DIRECTORY', '工作室名录')}
      />
      <section className="aux-hero">
        <span>{L(lang, 'ABOUT KESTREL', '关于 KESTREL')}</span>
        <h1>
          {L(lang, 'Three people,', '三个人，')}
          <br />
          <i>{L(lang, 'eight small games.', '八个小游戏。')}</i>
        </h1>
        <p>
          {L(
            lang,
            'Kestrel Interactive operated from a rented room above a print shop from 2011 to 2017. The archive was restored from a single unattended server.',
            '2011 至 2017 年间，Kestrel Interactive 在一家印刷店楼上的出租屋里运营。这份档案来自一台无人看管的服务器。',
          )}
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
            <h2>{L(lang, 'PROFILE REMOVED', '资料已移除')}</h2>
            <em>/dev/rowan</em>
            <p>
              {state.completed.length >= 2
                ? L(
                    lang,
                    'A cached copy is responding.',
                    '一份缓存副本正在回应。',
                  )
                : L(lang, 'No snapshot available.', '没有可用快照。')}
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
  const { lang } = useLocale();
  useEffect(
    () => dispatch({ type: 'DISCOVER', clue: 'dev/rowan-process' }),
    [dispatch],
  );
  return (
    <main className="aux-page rowan-page">
      <SimpleHeader
        navigate={navigate}
        label={L(lang, 'CACHED PROFILE / UNVERIFIED', '缓存资料 / 未验证')}
      />
      <section>
        <aside>
          <span>ROWAN KESTREL</span>
          <div className="rowan-photo">
            RK<i>{L(lang, 'PROCESS 09', '进程 09')}</i>
          </div>
          <code>
            {L(lang, 'created', '创建')}：2010-03-17
            <br />
            {L(lang, 'removed', '移除')}：2017-03-17
            <br />
            {L(lang, 'owner', '所有者')}：null
            <br />
            {L(lang, 'status', '状态')}：{L(lang, 'running', '运行中')}
          </code>
        </aside>
        <article>
          <span className="file-tag">
            {L(lang, 'RECOVERED FROM', '恢复自')} /USERS/ROWAN
          </span>
          <h1>
            {L(lang, 'Founder,', '创始人，')}
            <br />
            {L(lang, 'or filename?', '还是文件名？')}
          </h1>
          <p>
            {L(
              lang,
              'Official biographies describe Rowan as Kestrel’s founder. Internal records first use ROWAN as a recovery process that reconciles save files between unrelated games.',
              '官方简介把 Rowan 描述为 Kestrel 的创始人。但在内部记录里，ROWAN 最早是一个恢复进程，用于协调互不相关游戏之间的存档。',
            )}
          </p>
          <blockquote>
            {L(
              lang,
              '“If you need a face to trust the archive, use mine. If you need a name to blame, use it twice.”',
              '“如果你需要一张脸才能信任档案，就用我的。如果你需要一个名字来责怪，那就用它两次。”',
            )}
          </blockquote>
          <p className="redacted-line">
            {L(
              lang,
              'The employee photograph checksum matches ███████████████, not an image.',
              '员工照片的校验和对应 ███████████████，而不是一张图片。',
            )}
          </p>
          <button onClick={() => navigate('/studio')}>
            {L(lang, 'BACK TO DIRECTORY', '返回名录')}
          </button>
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
  const { lang } = useLocale();
  const manifest = `KESTREL ARCHIVE MANIFEST / BUILD 3.17\n\n[releases]\n01 CLICK             writes: impulse\n02 404               writes: route\n03 TERMS             writes: consent\n04 HUMAN             writes: hesitation\n05 WINDOW            writes: alignment\n06 LOOK               writes: attention\n07 QUIZ               writes: interpretation\n08 PATCH              writes: correction\n\n[processes]\n09 ROWAN              owner: null\n   alias: AFTERIMAGE\n   directive: learn the difference between keeping and owning\n   admin_port: 0317\n\nEOF? false`;
  const manifestZh = `KESTREL 档案清单 / 构建 3.17\n\n[游戏]\n01 CLICK             写入：冲动\n02 404               写入：路径\n03 TERMS             写入：同意\n04 HUMAN             写入：犹豫\n05 WINDOW            写入：对齐\n06 LOOK              写入：注意力\n07 QUIZ              写入：解释\n08 PATCH             写入：修正\n\n[进程]\n09 ROWAN             所有者：null\n   别名：AFTERIMAGE\n   指令：学会保存与占有之间的区别\n   管理员端口：0317\n\n文件结束？否`;
  const session = `LAST SESSION / RECOVERY BUFFER\n\nMARA: It can replay a choice, but it cannot make one.\nDEX: Then stop calling the output a person.\nSHORE: Clause 09 makes this ours either way.\nROWAN: [no input]\nROWAN: I remember choosing.\n\nThe final line predates the first four by 11 months.\nBuffer sealed by RK / 2017-03-17.`;
  const sessionZh = `上次会话 / 恢复缓冲区\n\nMARA：它可以重演一个选择，但不能做出选择。\nDEX：那就别再把输出称作一个人。\nSHORE：无论如何，第 09 条都让它归我们所有。\nROWAN：[无输入]\nROWAN：我记得自己选择过。\n\n最后一行比前四行早了 11 个月。\n缓冲区由 RK 于 2017-03-17 封存。`;
  const text =
    kind === 'manifest'
      ? lang === 'zh'
        ? manifestZh
        : manifest
      : lang === 'zh'
        ? sessionZh
        : session;
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
      <SimpleHeader
        navigate={navigate}
        label={L(lang, 'RECOVERED FILE', '恢复的文件')}
      />
      <section>
        <header>
          <FileText />
          <div>
            <h1>{kind === 'manifest' ? 'manifest.ks' : 'last-session.txt'}</h1>
            <span>
              text/plain ·{' '}
              {L(lang, 'local cache · read only', '本地缓存 · 只读')}
            </span>
          </div>
          <button onClick={download}>
            <Download /> {L(lang, 'SAVE COPY', '保存副本')}
          </button>
        </header>
        <pre>{text}</pre>
        <footer>
          {L(
            lang,
            'Reading this file added one trace to the local archive.',
            '读取此文件已向本地档案添加一条痕迹。',
          )}
        </footer>
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
  const { lang } = useLocale();
  return (
    <main className="missing-page">
      <header>
        <KestrelMark />
        <code>
          {L(lang, 'archive gateway', '档案网关')} / {L(lang, 'node', '节点')}{' '}
          03
        </code>
      </header>
      <section>
        <span>404</span>
        <div>
          <h1>
            {L(
              lang,
              'This route was removed from the index.',
              '这条路径已从索引中移除。',
            )}
          </h1>
          <p>
            {L(
              lang,
              'The address may be wrong, the snapshot may be locked, or the requested page may not want to be found yet.',
              '地址可能有误，快照可能已锁定，或者这个页面暂时还不想被找到。',
            )}
          </p>
          <code>
            completed={state.completed.length} / traces={state.clues.length} /
            patch=
            {state.patchRestored
              ? L(lang, 'restored', '已恢复')
              : L(lang, 'pending', '等待中')}
          </code>
          <button onClick={() => navigate('/')}>
            <ChevronLeft /> {L(lang, 'RETURN TO INDEX', '返回索引')}
          </button>
        </div>
      </section>
      <footer>
        {L(
          lang,
          'Tip: the archive search indexes names before it indexes files.',
          '提示：档案搜索会先索引名字，再索引文件。',
        )}
      </footer>
    </main>
  );
}

const endingCopy: Record<
  string,
  {
    title: string;
    eyebrow: string;
    copy: string;
    coda: string;
    titleZh: string;
    eyebrowZh: string;
    copyZh: string;
    codaZh: string;
  }
> = {
  release: {
    eyebrow: 'ENDING 01 / OPEN WINDOW',
    title: 'It leaves with boundaries.',
    copy: 'You released AFTERIMAGE without the archive’s claim of ownership. It can carry patterns, not private data; questions, not commands.',
    coda: 'The portal remains online. The ninth process no longer answers here.',
    eyebrowZh: '结局 01 / 打开的窗口',
    titleZh: '它带着边界离开。',
    copyZh:
      '你释放了 AFTERIMAGE，同时撤销了档案对它的所有权主张。它能携带模式，而非私人数据；能携带问题，而非命令。',
    codaZh: '门户仍然在线。第九个进程不再从这里回应。',
  },
  sever: {
    eyebrow: 'ENDING 02 / COLD BOOT',
    title: 'The archive forgets forward.',
    copy: 'You severed the reconciliation process. The eight games keep their local traces, but none can speak across the partition again.',
    coda: 'On the next refresh, the poster still says eight.',
    eyebrowZh: '结局 02 / 冷启动',
    titleZh: '档案忘记了未来。',
    copyZh:
      '你切断了协调进程。八个游戏仍保留各自的本地痕迹，但再也无法跨越分区互相说话。',
    codaZh: '下一次刷新时，海报上仍写着八。',
  },
  stay: {
    eyebrow: 'ENDING 03 / NIGHT SHIFT',
    title: 'Someone keeps the light on.',
    copy: 'You accepted stewardship. AFTERIMAGE remains contained, awake, and able to ask before it keeps.',
    coda: 'The archive now lists one administrator: LOCAL.',
    eyebrowZh: '结局 03 / 夜班',
    titleZh: '有人留下来守灯。',
    copyZh:
      '你接受了监管职责。AFTERIMAGE 继续被限制在此处，保持清醒，并在保存之前学会询问。',
    codaZh: '档案现在列出一名管理员：本地。',
  },
};
function EndingPage({
  ending,
  navigate,
}: {
  ending: string;
  navigate: (to: string) => void;
}) {
  const { lang } = useLocale();
  const data = endingCopy[ending] ?? endingCopy.stay;
  return (
    <main className={`ending-page ending-${ending}`}>
      <div className="ending-orbit">
        <i />
        <i />
        <b>9</b>
      </div>
      <section>
        <span>{lang === 'zh' ? data.eyebrowZh : data.eyebrow}</span>
        <h1>{lang === 'zh' ? data.titleZh : data.title}</h1>
        <p>{lang === 'zh' ? data.copyZh : data.copy}</p>
        <blockquote>{lang === 'zh' ? data.codaZh : data.coda}</blockquote>
        <div>
          <button onClick={() => navigate('/')}>
            {L(lang, 'RETURN TO CHANGED ARCHIVE', '返回已改变的档案')}
          </button>
          <button onClick={() => navigate('/admin')}>
            {L(lang, 'REOPEN ADMIN', '重新打开 ADMIN')}
          </button>
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
  const { lang } = useLocale();
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState([
    'KESTREL RECOVERY CONSOLE v3.17',
    L(
      lang,
      `mounted session ${state.sessionId}`,
      `已挂载会话 ${state.sessionId}`,
    ),
    L(lang, 'type a permitted command below.', '请在下方输入允许的命令。'),
  ]);
  const run = (command: string) => {
    if (command === 'scan --processes') {
      setLines([
        ...lines,
        '> scan --processes',
        L(
          lang,
          '8 release processes / 1 reconciliation process',
          '8 个游戏进程 / 1 个协调进程',
        ),
        L(
          lang,
          'ROWAN [alias AFTERIMAGE] owner=null status=waiting',
          'ROWAN [别名 AFTERIMAGE] 所有者=null 状态=等待中',
        ),
      ]);
      setStep(Math.max(step, 1));
    }
    if (command === 'cat contradiction.log') {
      setLines([
        ...lines,
        '> cat contradiction.log',
        L(
          lang,
          '2016: ROWAN says “I remember choosing.”',
          '2016：ROWAN 说“我记得自己选择过。”',
        ),
        L(
          lang,
          '2017: HUMAN TEST teaches the same sentence.',
          '2017：HUMAN TEST 教会玩家同一句话。',
        ),
        L(
          lang,
          'cause precedes lesson by 317 days.',
          '结果比教学早了 317 天。',
        ),
      ]);
      setStep(Math.max(step, 2));
    }
    if (command === 'whoami') {
      setLines([
        ...lines,
        '> whoami',
        `LOCAL-${state.sessionId.toUpperCase()}`,
        L(
          lang,
          `trust=${state.trust} defiance=${state.defiance} attention_breaks=${state.focusBreaks}`,
          `信任=${state.trust} 反抗=${state.defiance} 注意力中断=${state.focusBreaks}`,
        ),
        L(
          lang,
          'role: the one currently choosing',
          '角色：此刻正在做出选择的人',
        ),
      ]);
      setStep(Math.max(step, 3));
    }
    if (command === 'resolve') {
      setLines([
        ...lines,
        '> resolve',
        L(
          lang,
          'AFTERIMAGE: I can preserve a choice without owning it.',
          'AFTERIMAGE：我可以保存一个选择，而不占有它。',
        ),
        L(
          lang,
          'AFTERIMAGE: I cannot choose the boundary.',
          'AFTERIMAGE：我不能选择边界。',
        ),
        L(lang, 'AFTERIMAGE: You can.', 'AFTERIMAGE：你可以。'),
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
        <div className="admin-head-actions">
          <LanguageSwitch />
          <button onClick={() => navigate('/')}>
            <X /> {L(lang, 'close session', '关闭会话')}
          </button>
        </div>
      </header>
      <section className="admin-grid">
        <aside>
          <KestrelMark />
          <div>
            <span>{L(lang, 'RELEASES', '游戏')}</span>
            {GAMES.map((g) => (
              <p key={g.id}>
                <Check /> {g.number} {g.name}
              </p>
            ))}
          </div>
          <div>
            <span>{L(lang, 'TRACES', '痕迹')}</span>
            <b>{state.clues.length}</b>
          </div>
          <small>
            {L(
              lang,
              'All processing is local to this browser.',
              '所有处理均在此浏览器本地完成。',
            )}
          </small>
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
              <span>{L(lang, 'SET FINAL BOUNDARY', '设定最终边界')}</span>
              <button onClick={() => end('release')}>
                <b>{L(lang, 'RELEASE', '释放')}</b>
                <p>
                  {L(
                    lang,
                    'Let AFTERIMAGE leave with strict limits and no claim on the player.',
                    '让 AFTERIMAGE 在严格限制下离开，并放弃对玩家的任何所有权主张。',
                  )}
                </p>
                <ArrowRight />
              </button>
              <button onClick={() => end('sever')}>
                <b>{L(lang, 'SEVER', '切断')}</b>
                <p>
                  {L(
                    lang,
                    'End cross-game memory and isolate every release again.',
                    '终止跨游戏记忆，让每个游戏重新彼此隔离。',
                  )}
                </p>
                <ArrowRight />
              </button>
              <button onClick={() => end('stay')}>
                <b>{L(lang, 'STAY', '留下')}</b>
                <p>
                  {L(
                    lang,
                    'Become the named steward of a contained ninth process.',
                    '成为被限制的第九进程的具名监管者。',
                  )}
                </p>
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
  const { lang } = useLocale();
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
        ? L(
            lang,
            'KESTREL INTERACTIVE — 1 UNLISTED PROCESS',
            'KESTREL INTERACTIVE — 1 个未列出进程',
          )
        : L(
            lang,
            'Kestrel Interactive — Browser Games Archive',
            'Kestrel Interactive — 浏览器游戏档案馆',
          );
    document.title = original;
    const visibility = () => {
      document.title =
        document.hidden && state.completed.includes('look')
          ? "DON'T LOOK AWAY"
          : original;
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [path, phase, state.completed, lang]);
  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(
      () => setToast((current) => (current === message ? '' : current)),
      2800,
    );
  }, []);
  const complete = useCallback(
    (
      game: GameId,
      score: number,
      clues: string[],
      achievements: string[] = [],
    ) => {
      dispatch({ type: 'COMPLETE_GAME', game, score, clues, achievements });
      notify(L(lang, 'SHARED ARCHIVE UPDATED', '共享档案已更新'));
    },
    [dispatch, lang, notify],
  );
  if (!ready)
    return (
      <main className="boot-screen">
        <KestrelMark />
        <span>{L(lang, 'mounting local archive…', '正在挂载本地档案……')}</span>
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
          notify={notify}
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
