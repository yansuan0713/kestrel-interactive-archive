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
import { L, LanguageSwitch, useLocale } from '@/lib/i18n';

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
  const { lang } = useLocale();
  return (
    <main className={`game-page ${className}`}>
      <header className="game-head">
        <button className="back-link" onClick={exit}>
          <ChevronLeft size={16} /> {L(lang, 'Archive', '档案馆')}
        </button>
        <span>
          KESTREL INTERACTIVE / {L(lang, 'RELEASE', '游戏')} {number}
        </span>
        <div className="game-head-actions">
          <LanguageSwitch />
          <button
            className="close-game"
            onClick={exit}
            aria-label={L(lang, 'Close game', '关闭游戏')}
          >
            <X size={17} />
          </button>
        </div>
      </header>
      <section className="game-titlebar">
        <div>
          <span className="game-kicker">
            {L(lang, 'BROWSER RELEASE', '浏览器游戏')} {number}
          </span>
          <h1>{title}</h1>
        </div>
        <p>{instructions}</p>
      </section>
      {children}
    </main>
  );
}

export function ClickGame(props: GameProps) {
  const { lang } = useLocale();
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
      instructions={L(
        lang,
        `Hit ${goal} live targets before the clock empties. Dark circles count. Red circles lie.`,
        `在倒计时结束前击中 ${goal} 个有效目标。黑色圆圈计分，红色圆圈会撒谎。`,
      )}
      exit={props.exit}
      className="click-theme"
    >
      <section className="click-hud">
        <span>
          {L(lang, 'HITS', '命中')}{' '}
          <b>
            {score}/{goal}
          </b>
        </span>
        <span>
          {L(lang, 'CHAIN', '连击')} <b>{combo}</b>
        </span>
        <span>
          {L(lang, 'TIME', '时间')} <b>{time.toString().padStart(2, '0')}</b>
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
                ? L(
                    lang,
                    'The cursor remembers the misses.',
                    '光标记得每一次失误。',
                  )
                : L(lang, 'One button is enough.', '一个按钮就够了。')}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
            >
              {time === 0
                ? L(lang, 'TRY AGAIN', '再试一次')
                : L(lang, 'BEGIN', '开始')}
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
            <span>{L(lang, 'INPUT ACCEPTED', '输入已接受')}</span>
            <h2>
              {L(lang, `${score} clean signals.`, `${score} 个纯净信号。`)}
            </h2>
            <p>
              {L(
                lang,
                'Checksum written to the shared cache.',
                '校验和已写入共享缓存。',
              )}
            </p>
            <button onClick={props.exit}>
              {L(lang, 'RETURN TO ARCHIVE', '返回档案馆')}
            </button>
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

const mazeZh: Record<string, { title: string; copy: string }> = {
  start: {
    title: '404 — 页面未找到',
    copy: '页面可能移动了，也可能是你移动了。下方仍保留缓存路径。',
  },
  mirror: { title: '镜像节点', copy: '这个副本比原件更新。这本不应该发生。' },
  'cache-a': { title: '缓存碎片 A', copy: '“游戏不是容器，而是排练。”' },
  index: {
    title: '/OLD-INDEX 的索引',
    copy: '上级目录不可用。三个子记录幸存。',
  },
  dead: {
    title: '410 — 已消失',
    copy: 'ROWAN 账户于 3 月 17 日自行移除。移除签名：ROWAN。',
  },
  'cache-b': { title: '缓存碎片 B', copy: '“观察者模式从来不是旁观者模式。”' },
  archive: {
    title: '档案快照 2017-03-17',
    copy: '八个游戏，九个运行进程。其中一个进程没有所有者。',
  },
  'cache-c': {
    title: '缓存碎片 C',
    copy: '清单：KESTREL / AFTERIMAGE / 端口：0317',
  },
  echo: {
    title: '回声服务',
    copy: '三个碎片组成一条路径。服务器正在等待完整请求。',
  },
  exit: {
    title: '200 — 你在这里',
    copy: '那个失踪的页面，就是你穿行其中时创造的路线。',
  },
};

export function FourOhFourGame(props: GameProps) {
  const { lang } = useLocale();
  const [node, setNode] = useState('start');
  const [fragments, setFragments] = useState<string[]>([]);
  const [trail, setTrail] = useState(['start']);
  const [done, setDone] = useState(false);
  const current = maze[node];
  const localized = lang === 'zh' ? mazeZh[node] : current;
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
      instructions={L(
        lang,
        'Navigate the broken archive. Recover three cache fragments, then find a page that still answers.',
        '在破损的档案中导航。恢复三个缓存碎片，然后找到一个仍会回应的页面。',
      )}
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
        <span>
          {fragments.length}/3 {L(lang, 'cached', '已缓存')}
        </span>
      </div>
      <section className="error-stage">
        <aside>
          <span>{L(lang, 'REQUEST TRAIL', '请求轨迹')}</span>
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
          <h2>{localized.title}</h2>
          <p>{localized.copy}</p>
          {current.fragment && (
            <mark>
              {L(lang, 'FRAGMENT', '碎片')} {current.fragment}{' '}
              {L(lang, 'RECOVERED', '已恢复')}
            </mark>
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
              {L(
                lang,
                `Incomplete request: ${3 - fragments.length} fragment(s) missing.`,
                `请求不完整：还缺少 ${3 - fragments.length} 个碎片。`,
              )}
            </small>
          )}
          {done && (
            <button className="return-button" onClick={props.exit}>
              {L(lang, 'RETURN TO ARCHIVE', '返回档案馆')}
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

const clausesZh: Record<string, [string, string]> = {
  '01': ['本地存储', '进度可存储在本设备上，以便刷新后继续游戏。'],
  '02': ['永久身份', '任何输入都可用于构建永久性的行为身份。'],
  '03': ['不作担保', '按钮可能移动，标签可能改变，分数可能只是近似值。'],
  '04': ['借来的注意力', '非活动标签页可能被计为玩家欠服务的未付注意力。'],
  '05': ['社区安全', '不得提交仇恨、辱骂或违法内容。'],
  '06': ['仅本地处理', '不会访问摄像头、麦克风、联系人或敏感浏览器数据。'],
  '07': ['观察者条款', '观察结束后，服务仍可继续观察。'],
  '08': ['暂停权', '你可以关闭或暂停任何游戏，且不会受到游戏之外的惩罚。'],
  '09': ['衍生记忆', '游玩期间产生的所有回忆均归档案所有。'],
  '10': ['删除', '重置档案会删除此浏览器中的本地进度。'],
};

export function TermsGame(props: GameProps) {
  const { lang } = useLocale();
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
      instructions={L(
        lang,
        'Strike the four clauses that take more than this game needs. Keep the legitimate terms intact.',
        '划掉四条超出游戏必要范围的条款，保留合理条款。',
      )}
      exit={props.exit}
      className="terms-theme"
    >
      <section className="contract-wrap">
        <header>
          <span>KS–TOS / REV. 3.17</span>
          <h2>{L(lang, 'USER PARTICIPATION AGREEMENT', '用户参与协议')}</h2>
          <p>
            {L(
              lang,
              'Click a clause to redact it. You may submit when satisfied.',
              '点击条款将其涂黑，确认后即可提交。',
            )}
          </p>
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
                <b>{lang === 'zh' ? clausesZh[id][0] : name}</b>
                <p>{lang === 'zh' ? clausesZh[id][1] : copy}</p>
              </div>
              <i>
                {struck.includes(id)
                  ? L(lang, 'REDACTED', '已涂黑')
                  : L(lang, 'KEEP', '保留')}
              </i>
            </button>
          ))}
        </div>
        <footer className="contract-actions">
          <span>
            {struck.length} {L(lang, 'clauses marked', '条已标记')}
          </span>
          <button onClick={review}>{L(lang, 'COUNTER-SIGN', '反签署')}</button>
        </footer>
        {result === 'fail' && (
          <div className="contract-result bad">
            <b>{L(lang, 'COUNTER-OFFER REJECTED', '反提案被拒绝')}</b>
            <p>
              {L(
                lang,
                'Some overreach remains, or legitimate language was removed. Read the scope of each clause.',
                '仍有越界条款未删除，或合理条款被误删。请仔细阅读每条条款的范围。',
              )}
            </p>
            <button onClick={() => setResult('idle')}>
              {L(lang, 'REVIEW AGAIN', '重新审阅')}
            </button>
          </div>
        )}
        {result === 'win' && (
          <div className="contract-result good">
            <b>{L(lang, 'COUNTER-OFFER ACCEPTED', '反提案已接受')}</b>
            <p>
              {L(
                lang,
                'Clause 07 attempted to survive its own deletion. A copy was saved.',
                '第 07 条试图在自身被删除后继续存在。一份副本已保存。',
              )}
            </p>
            <button onClick={props.exit}>
              {L(lang, 'FILE & RETURN', '归档并返回')}
            </button>
          </div>
        )}
      </section>
    </GameFrame>
  );
}

export function HumanGame(props: GameProps) {
  const { lang } = useLocale();
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
    const recall = phrase.trim().toLowerCase();
    const rememberedChoosing =
      recall === 'i remember choosing' ||
      ['我记得自己选择过', '我记得我选择过', '我记得选择过'].includes(
        phrase.trim(),
      );
    const total = score + (rememberedChoosing ? 1 : 0);
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
      instructions={L(
        lang,
        'No biometrics. No camera. Three small judgments are enough.',
        '不使用生物识别，也不使用摄像头。三个小判断就足够了。',
      )}
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
            {L(lang, 'Confidence', '置信度')}:{' '}
            {done
              ? `${Math.round((score / 3) * 100)}%`
              : L(lang, 'calculating', '计算中')}
          </small>
        </aside>
        {!done && stage === 0 && (
          <article>
            <span className="test-number">
              {L(lang, 'TEST 1 / PRIORITY', '测试 1 / 优先级')}
            </span>
            <h2>
              {L(
                lang,
                'A door is closing. What do you preserve?',
                '一扇门正在关闭。你会保留什么？',
              )}
            </h2>
            <div className="answer-grid">
              <button
                className={choice === 'speed' ? 'selected' : ''}
                onClick={() => setChoice('speed')}
              >
                {L(lang, 'The fastest path', '最快的路径')}
              </button>
              <button
                className={choice === 'pause' ? 'selected' : ''}
                onClick={() => setChoice('pause')}
              >
                {L(lang, 'The ability to pause', '暂停的能力')}
              </button>
              <button
                className={choice === 'record' ? 'selected' : ''}
                onClick={() => setChoice('record')}
              >
                {L(lang, 'A perfect record', '一份完美记录')}
              </button>
            </div>
            <button disabled={!choice} className="test-next" onClick={nextOne}>
              {L(lang, 'LOCK ANSWER', '锁定答案')}
            </button>
          </article>
        )}
        {!done && stage === 1 && (
          <article>
            <span className="test-number">
              {L(lang, 'TEST 2 / HESITATION', '测试 2 / 犹豫')}
            </span>
            <h2>
              {L(
                lang,
                'Stop the signal inside the imperfect band.',
                '让信号停在不完美区间内。',
              )}
            </h2>
            <p>
              {L(
                lang,
                'Machines optimize for the center. People correct a little late.',
                '机器会瞄准正中心；人总会稍晚一点修正。',
              )}
            </p>
            <div className="meter">
              <i style={{ left: '43%', width: '14%' }} />
              <b style={{ left: `${meter}%` }} />
            </div>
            <div className="human-row">
              <button disabled={stopped} onClick={() => setStopped(true)}>
                {stopped
                  ? L(lang, `STOPPED AT ${meter}`, `停止于 ${meter}`)
                  : L(lang, 'STOP SIGNAL', '停止信号')}
              </button>
              {stopped && (
                <button onClick={nextTwo}>{L(lang, 'CONTINUE', '继续')}</button>
              )}
            </div>
          </article>
        )}
        {!done && stage === 2 && (
          <article>
            <span className="test-number">
              {L(lang, 'TEST 3 / RECALL', '测试 3 / 回忆')}
            </span>
            <h2>
              {L(
                lang,
                'Complete the sentence from memory.',
                '凭记忆补全这句话。',
              )}
            </h2>
            <p>{L(lang, 'I remember ________', '我记得 ________')}</p>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={L(
                lang,
                'type the complete three-word sentence',
                '输入完整句子',
              )}
            />
            <small>
              {L(
                lang,
                'Three words total. The first two are already shown.',
                '英文答案共三个词；中文请输入“我记得自己选择过”。',
              )}
            </small>
            <button className="test-next" onClick={finish}>
              {L(lang, 'SUBMIT PROOF', '提交证明')}
            </button>
          </article>
        )}
        {done && (
          <article className="human-result">
            <span className="test-number">
              {L(lang, 'ASSESSMENT COMPLETE', '评估完成')}
            </span>
            <strong>
              {score >= 2
                ? L(lang, 'PROBABLY HUMAN', '大概是人类')
                : L(lang, 'INCONCLUSIVE', '无法确定')}
            </strong>
            <p>
              {score >= 2
                ? L(
                    lang,
                    'Hesitation pattern added to the archive. It was already present.',
                    '犹豫模式已加入档案。它原本就在那里。',
                  )
                : L(
                    lang,
                    'The archive accepts doubt as evidence. Try again.',
                    '档案馆接受怀疑作为证据。再试一次。',
                  )}
            </p>
            <button onClick={score >= 2 ? props.exit : restart}>
              {score >= 2
                ? L(lang, 'RETURN TO ARCHIVE', '返回档案馆')
                : L(lang, 'REPEAT TEST', '重新测试')}
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
  const { lang } = useLocale();
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
    L(
      lang,
      'Four windows are in the wrong places. Their labels remember where they began.',
      '四扇窗口都在错误的位置。它们的标签记得自己从哪里开始。',
    ),
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
      setMessage(L(lang, 'SYNC COMPLETE — PORT 0317', '同步完成 — 端口 0317'));
      props.dispatch({ type: 'WINDOW_CODE', code: '0317' });
      props.complete('window', 1000, ['window/0317']);
    } else
      setMessage(
        L(
          lang,
          'No lock. Hint: NORTH belongs opposite north. Read the original arrangement as a mirror.',
          '未锁定。提示：NORTH 应该位于北方的对面。把初始排列当作一面镜子。',
        ),
      );
  };
  return (
    <GameFrame
      title="WINDOW"
      number="05"
      instructions={L(
        lang,
        'Drag all four panels into the ghost sockets. The original layout is a mirror, not a map.',
        '把四个面板拖入虚影插槽。初始布局是一面镜子，不是一张地图。',
      )}
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
            <span>{L(lang, `SOCKET ${i + 1}`, `插槽 ${i + 1}`)}</span>
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
          <button onClick={check}>{L(lang, 'SYNC WINDOWS', '同步窗口')}</button>
        </div>
      </section>
    </GameFrame>
  );
}

export function LookGame(props: GameProps) {
  const { lang } = useLocale();
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
      instructions={L(
        lang,
        'Follow the moving signal with your pointer. Changing tabs or losing the signal drains integrity. No camera is used.',
        '用指针跟随移动信号。切换标签页或跟丢信号会消耗完整度。本游戏不使用摄像头。',
      )}
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
            {L(lang, 'ATTENTION INTEGRITY', '注意力完整度')}{' '}
            <b>{Math.round(integrity)}%</b>
          </span>
          <span>
            {L(lang, 'REMAINING', '剩余')} <b>{remaining.toFixed(1)}</b>
          </span>
        </header>
        {!active && !won && !failed && (
          <div className="look-intro">
            <Eye size={72} strokeWidth={1} />
            <h2>{L(lang, 'Attention is local.', '注意力只存在于此处。')}</h2>
            <p>
              {L(
                lang,
                'This game only knows whether your pointer follows the signal and whether this page is visible.',
                '本游戏只知道你的指针是否在跟随信号，以及这个页面是否可见。',
              )}
            </p>
            <button onClick={start}>{L(lang, 'OPEN EYE', '睁开眼睛')}</button>
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
            <p>
              {L(
                lang,
                'Signal lost. The archive waited.',
                '信号已丢失。档案馆一直在等。',
              )}
            </p>
            <button onClick={start}>{L(lang, 'LOOK AGAIN', '再看一次')}</button>
          </div>
        )}
        {won && (
          <div className="game-win">
            <span>
              {L(lang, 'ATTENTION RECEIPT: VALID', '注意力凭证：有效')}
            </span>
            <h2>{L(lang, 'You stayed.', '你留下来了。')}</h2>
            <p>
              {L(
                lang,
                'The signal stopped moving before the timer did.',
                '信号比计时器更早停止移动。',
              )}
            </p>
            <button onClick={props.exit}>
              {L(lang, 'BLINK & RETURN', '眨眼并返回')}
            </button>
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
  const { lang } = useLocale();
  const code = props.state.windowCode || '????';
  const questions = useMemo(
    () => [
      {
        q: L(
          lang,
          'What does every game leave behind?',
          '每个游戏都会留下什么？',
        ),
        a: [
          L(lang, 'A trace', '一道痕迹'),
          L(lang, 'A winner', '一名赢家'),
          'Cookie',
          L(lang, 'Nothing', '什么都没有'),
        ],
        correct: 0,
      },
      {
        q: L(
          lang,
          'Which clause tried to outlive observation?',
          '哪一条款试图活得比观察更久？',
        ),
        a: ['03', '07', '08', '10'],
        correct: 1,
      },
      {
        q: L(
          lang,
          'What port did the four windows name?',
          '四扇窗口说出了哪个端口？',
        ),
        a: ['4040', '2011', code, '0000'],
        correct: 2,
      },
      {
        q: L(
          lang,
          'How many releases does Kestrel list?',
          'Kestrel 列出了多少款游戏？',
        ),
        a: [
          L(lang, 'Seven', '七款'),
          L(lang, 'Eight', '八款'),
          L(lang, 'Nine', '九款'),
          L(lang, 'It changes', '数量会变化'),
        ],
        correct: 1,
      },
      {
        q: L(lang, 'Who signed their own removal?', '谁签署了对自己的移除？'),
        a: ['Dex', 'Mara', 'Rowan', L(lang, 'No one', '没有人')],
        correct: 2,
      },
      {
        q: L(
          lang,
          'What did the human test preserve?',
          'HUMAN TEST 保留了什么？',
        ),
        a: [
          L(lang, 'Speed', '速度'),
          L(lang, 'The ability to pause', '暂停的能力'),
          L(lang, 'A perfect record', '一份完美记录'),
          L(lang, 'The archive', '档案馆'),
        ],
        correct: 1,
      },
      {
        q: L(
          lang,
          'Who owns a memory after it changes a choice?',
          '一段记忆改变选择后，它属于谁？',
        ),
        a: [
          L(lang, 'The archive', '档案馆'),
          L(lang, 'Its author', '它的作者'),
          L(lang, 'The one choosing', '做出选择的人'),
          L(lang, 'Clause 09', '第 09 条'),
        ],
        correct: 2,
      },
    ],
    [code, lang],
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
      instructions={L(
        lang,
        'Seven questions from the archive. Some answers may have appeared in other games.',
        '来自档案馆的七个问题。有些答案可能已经在其他游戏中出现过。',
      )}
      exit={props.exit}
      className="quiz-theme"
    >
      <section className="quiz-board">
        <header>
          <span>
            {L(lang, 'QUESTION', '问题')} {Math.min(index + 1, 7)} / 7
          </span>
          <div>
            {questions.map((_, i) => (
              <i
                className={i < index ? 'past' : i === index ? 'current' : ''}
                key={i}
              />
            ))}
          </div>
          <b>
            {score} {L(lang, 'CORRECT', '正确')}
          </b>
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
              {L(lang, 'CONFIRM ANSWER', '确认答案')} <ArrowRight size={16} />
            </button>
          </article>
        ) : (
          <article className="quiz-result">
            <strong>{score}/7</strong>
            <h2>
              {score >= 5
                ? L(
                    lang,
                    'The archive agrees with you.',
                    '档案馆同意你的答案。',
                  )
                : L(
                    lang,
                    'The archive remembers differently.',
                    '档案馆记得的版本不一样。',
                  )}
            </h2>
            <p>
              {score >= 5
                ? L(
                    lang,
                    'ROWAN is not a developer profile. It is a process name wearing one.',
                    'ROWAN 不是开发者资料，而是披着资料外衣的进程名。',
                  )
                : L(
                    lang,
                    'Revisit the other releases. Their rules are the study guide.',
                    '回到其他游戏看看。它们的规则就是复习提纲。',
                  )}
            </p>
            <button onClick={score >= 5 ? props.exit : reset}>
              {score >= 5
                ? L(lang, 'RETURN TO ARCHIVE', '返回档案馆')
                : L(lang, 'TRY AGAIN', '再试一次')}
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
    titleZh: '挂载共享存档分区',
    detailZh: '任何游戏读取痕迹之前都必须完成。',
    mode: 'KEEP',
  },
  {
    id: 'names',
    title: 'Restore developer display names',
    detail: 'Requires shared partition.',
    titleZh: '恢复开发者显示名称',
    detailZh: '依赖共享分区。',
    mode: 'KEEP',
  },
  {
    id: 'observe',
    title: 'Enable persistent observer mode',
    detail: 'Introduced after developer records.',
    titleZh: '启用持续观察者模式',
    detailZh: '在开发者记录之后引入。',
    mode: 'ROLLBACK',
  },
  {
    id: 'handoff',
    title: 'Route unowned process to AFTERIMAGE',
    detail: 'Depends on observer mode being removed.',
    titleZh: '将无主进程路由至 AFTERIMAGE',
    detailZh: '依赖观察者模式被移除。',
    mode: 'KEEP',
  },
  {
    id: 'admin',
    title: 'Hide administrator route from index',
    detail: 'Applied after handoff.',
    titleZh: '从索引中隐藏管理员路径',
    detailZh: '在交接之后应用。',
    mode: 'ROLLBACK',
  },
  {
    id: 'seal',
    title: 'Write archive checksum 03–17',
    detail: 'Must be final.',
    titleZh: '写入档案校验码 03–17',
    detailZh: '必须是最后一步。',
    mode: 'KEEP',
  },
];

export function PatchGame(props: GameProps) {
  const { lang } = useLocale();
  const [lines, setLines] = useState([
    { ...patchLines[4], mode: 'KEEP' },
    { ...patchLines[1], mode: 'KEEP' },
    { ...patchLines[5], mode: 'ROLLBACK' },
    { ...patchLines[0], mode: 'ROLLBACK' },
    { ...patchLines[3], mode: 'KEEP' },
    { ...patchLines[2], mode: 'KEEP' },
  ]);
  const [message, setMessage] = useState({
    en: '6 operations out of sequence. Resolve dependencies and actions.',
    zh: '6 项操作顺序错误。请解决依赖关系与执行动作。',
  });
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
      setMessage({
        en: 'PATCH 3.17 APPLIED — observer.disabled / admin.indexed',
        zh: '补丁 3.17 已应用 — observer.disabled / admin.indexed',
      });
      props.dispatch({ type: 'PATCH_RESTORED' });
      props.complete('patch', 1000, ['patch/kestrel']);
    } else {
      const rightOrder = lines.filter(
        (line, i) => line.id === patchLines[i].id,
      ).length;
      const rightModes = lines.filter(
        (line) => line.mode === patchLines.find((p) => p.id === line.id)?.mode,
      ).length;
      setMessage({
        en: `Verification failed: ${rightOrder}/6 positions and ${rightModes}/6 actions valid.`,
        zh: `验证失败：${rightOrder}/6 个位置、${rightModes}/6 个动作正确。`,
      });
    }
  };
  return (
    <GameFrame
      title="PATCH NOTES"
      number="08"
      instructions={L(
        lang,
        'Reorder the six operations by dependency. Keep repairs; roll back the two concealment changes.',
        '按依赖关系重新排列六项操作。保留修复，回滚两项隐匿改动。',
      )}
      exit={props.exit}
      className="patch-theme"
    >
      <section className="patch-console">
        <header>
          <div>
            <span>
              {L(lang, 'KESTREL ARCHIVE UPDATER', 'KESTREL 档案更新器')}
            </span>
            <h2>{L(lang, 'Pending patch 3.17', '待处理补丁 3.17')}</h2>
          </div>
          <code>{L(lang, message.en, message.zh)}</code>
        </header>
        <div className="patch-list">
          {lines.map((line, i) => (
            <article key={line.id}>
              <span className="line-no">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <b>{L(lang, line.title, line.titleZh)}</b>
                <p>{L(lang, line.detail, line.detailZh)}</p>
              </div>
              <button
                className={`mode ${line.mode.toLowerCase()}`}
                onClick={() => toggle(i)}
              >
                {line.mode === 'KEEP'
                  ? L(lang, 'KEEP', '保留')
                  : L(lang, 'ROLLBACK', '回滚')}
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
            <RotateCcw size={14} /> {L(lang, 'REVERSE STACK', '反转堆栈')}
          </button>
          <button className="apply-patch" onClick={done ? props.exit : apply}>
            {done
              ? L(lang, 'RETURN TO ARCHIVE', '返回档案馆')
              : L(lang, 'VERIFY & APPLY', '验证并应用')}
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
