// Draws an arcade attract screen: a bot snake plays Snake on the contribution graph by itself,
// hunts the green days, grows, keeps score, then dares the reader to beat it and loops.
// Pure CSS animation, so it runs inside a GitHub README. The README links it to the playable game.
// Drawn once per theme: a neon arcade at night, a black snake on a light board by day.
import { THEMES } from "./themes.mjs";

const C = 12; // cell size
const GAP = 2;
const H = 7;
const OX = 16;
const OY = 52;
const FONT = "'Courier New', Courier, monospace";

function shader(counts) {
  // Four shades split by quartile of the active days, like GitHub.
  const sorted = counts.filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => sorted[Math.floor((sorted.length - 1) * p)] || 1;
  const [a, b, c] = [q(0.25), q(0.5), q(0.75)];
  return (n) => (n === 0 ? 0 : n <= a ? 1 : n <= b ? 2 : n <= c ? 3 : 4);
}

function play(weeks) {
  const W = weeks.length;
  const key = (x, y) => x * H + y;
  const xy = (k) => [Math.floor(k / H), k % H];
  const level = shader(weeks.flat().map((d) => d.count));
  const valid = new Set();
  const food = new Map();
  weeks.forEach((days, x) =>
    days.forEach((d) => {
      const k = key(x, d.weekday);
      valid.add(k);
      if (d.count > 0) food.set(k, { count: d.count, level: level(d.count) });
    }),
  );
  const board = new Map([...valid].map((k) => [k, food.get(k)?.level ?? 0]));

  const neighbors = (k) => {
    const [x, y] = xy(k);
    return [[1, 0], [0, 1], [-1, 0], [0, -1]]
      .map(([dx, dy]) => [x + dx, y + dy])
      .filter(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && valid.has(key(a, b)))
      .map(([a, b]) => key(a, b));
  };

  const bfs = (start, blocked, goal) => {
    const prev = new Map([[start, -1]]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      if (c !== start && goal(c)) {
        const path = [];
        for (let n = c; n !== start; n = prev.get(n)) path.push(n);
        return path.reverse();
      }
      for (const n of neighbors(c)) {
        if (prev.has(n) || (blocked.has(n) && !goal(n))) continue;
        prev.set(n, c);
        queue.push(n);
      }
    }
    return null;
  };

  const tailReachable = (b) => b.length < 4 || !!bfs(b[0], new Set(b.slice(0, -1)), (c) => c === b[b.length - 1]);

  let body = [key(3, 3), key(2, 3), key(1, 3)]; // head first
  body.forEach((k) => food.delete(k));
  const trail = [...body].reverse();
  const bites = [];
  let step = 0;
  let starve = 0;
  let outcome = "crash";

  const move = (k) => {
    const meal = food.get(k);
    body.unshift(k);
    step++;
    if (meal) {
      food.delete(k);
      bites.push({ step, k, ...meal });
      starve = 0;
    } else {
      body.pop();
      starve++;
    }
    trail.push(k);
  };

  while (step < 3000) {
    if (!food.size) { outcome = "win"; break; }
    if (starve > W * H * 2) { outcome = "starved"; break; }
    const blocked = new Set(body.slice(0, -1));
    const path = bfs(body[0], blocked, (c) => food.has(c));
    if (path) {
      const v = [...body];
      for (const c of path) { v.unshift(c); if (!food.has(c)) v.pop(); }
      if (tailReachable(v)) { path.forEach(move); continue; }
    }
    // No safe meal: chase the tail and wait for a way to open up.
    const options = neighbors(body[0]).filter((n) => !blocked.has(n));
    let best = null;
    let bestDist = -1;
    for (const n of options) {
      const v = [n, ...body];
      if (!food.has(n)) v.pop();
      if (!tailReachable(v)) continue;
      const d = (bfs(n, new Set(v.slice(1, -1)), (c) => c === v[v.length - 1]) || []).length;
      if (d > bestDist) { bestDist = d; best = n; }
    }
    if (best == null) best = options[0];
    if (best == null) break; // boxed in: crash
    move(best);
  }

  return { W, xy, board, trail, bites, steps: step, outcome, foodLeft: food.size };
}

const pct = (t, T) => `${((t / T) * 100).toFixed(4)}%`;
const pad = (n) => String(n).padStart(6, "0");

export function renderSnakeGame(weeks, { user, total, theme = THEMES.dark }) {
  const g = play(weeks);
  const { shades: SHADES, accent: NEON } = theme;
  const dt = Math.min(0.09, Math.max(0.035, 60 / Math.max(1, g.steps)));
  const Tg = g.steps * dt; // game time
  const T = Tg + 4.5; // plus the game over screen
  const width = OX * 2 + g.W * C - GAP;
  const height = OY + H * C + 34;
  const center = (k) => {
    const [x, y] = g.xy(k);
    return [OX + x * C + (C - GAP) / 2, OY + y * C + (C - GAP) / 2];
  };

  // The snake is one stroke along the path its head takes. A dash of the snake's length slides along it.
  const d = g.trail.map((k, i) => `${i ? "L" : "M"}${center(k).map((n) => n.toFixed(1)).join(" ")}`).join("");
  const far = (g.trail.length + 10) * C;
  const start = 2 * C;
  const headAt = (t) => start + Math.min(t, Tg) / dt * C;
  const lens = [[0, start]];
  let len = start;
  for (const b of g.bites) {
    lens.push([(b.step - 1) * dt, len]);
    len += C;
    lens.push([b.step * dt, len]);
  }
  lens.push([Tg, len], [T, len]);
  const seen = new Map();
  for (const [t, l] of lens) seen.set(t.toFixed(4), [t, l]);
  const bodyFrames = [...seen.values()]
    .map(([t, l]) => `${pct(t, T)}{stroke-dasharray:${l.toFixed(1)} ${far};stroke-dashoffset:${(l - headAt(t)).toFixed(1)}}`)
    .join("");
  const headFrames = [0, Tg, T].map((t) => `${pct(t, T)}{stroke-dashoffset:${(-headAt(t)).toFixed(1)}}`).join("");

  // Squares vanish when eaten.
  const eaten = new Map(g.bites.map((b) => [b.k, b.step * dt]));
  let css = "";
  let cells = "";
  let i = 0;
  for (const [k, lvl] of g.board) {
    const [x, y] = g.xy(k);
    const when = eaten.get(k);
    const cls = when != null ? ` class="f${i}"` : "";
    if (when != null) css += `@keyframes f${i}{0%{opacity:1}${pct(when, T)}{opacity:0}}.f${i}{animation:f${i} ${T.toFixed(2)}s step-end infinite}`;
    // An empty square sits under each meal, so an eaten day goes dark instead of leaving a hole.
    if (when != null) cells += `<rect x="${OX + x * C}" y="${OY + y * C}" width="${C - GAP}" height="${C - GAP}" rx="2" fill="${SHADES[0]}"/>`;
    cells += `<rect${cls} x="${OX + x * C}" y="${OY + y * C}" width="${C - GAP}" height="${C - GAP}" rx="2" fill="${SHADES[lvl]}"/>`;
    i++;
  }

  // Score ticks up at every bite.
  let score = 0;
  const scores = [{ from: 0, value: 0 }];
  for (const b of g.bites) { score += b.count; scores.push({ from: b.step * dt, value: score }); }
  let scoreText = "";
  scores.forEach((s, j) => {
    const to = scores[j + 1]?.from;
    const frames = `${pct(s.from, T)}{opacity:1}` + (to != null ? `${pct(to, T)}{opacity:0}` : "");
    css += `@keyframes s${j}{0%{opacity:0}${frames}}.s${j}{opacity:0;animation:s${j} ${T.toFixed(2)}s step-end infinite}`;
    scoreText += `<text class="s${j}" x="${OX + 108}" y="30">${pad(s.value)}</text>`;
  });

  const won = g.outcome === "win";
  const title = won ? "PERFECT RUN" : g.outcome === "starved" ? "SNAKE GOT BORED" : "GAME OVER";
  const sub = won
    ? `THE BOT ATE ALL ${score.toLocaleString("en-US")}. THINK YOU CAN MATCH IT?`
    : `THE BOT ATE ${score.toLocaleString("en-US")} OF ${total.toLocaleString("en-US")}. YOU CAN DO BETTER.`;
  const midY = OY + (H * C) / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="A snake bot playing Snake on ${user}'s GitHub contribution graph">
<style>
text{font-family:${FONT};font-weight:700;fill:${theme.text};font-size:13px}
.dim{fill:${theme.muted};font-size:11px}
.neon{fill:${NEON}}
.blink{animation:blink 1s step-end infinite}
@keyframes blink{50%{opacity:0}}
.body{fill:none;stroke:${theme.snake};stroke-width:${C * 0.72};stroke-linecap:round;stroke-linejoin:round;animation:body ${T.toFixed(2)}s linear infinite}
@keyframes body{${bodyFrames}}
.head{fill:none;stroke:${theme.snakeHead};stroke-width:${C * 0.5};stroke-linecap:round;stroke-dasharray:0.01 ${far};animation:head ${T.toFixed(2)}s linear infinite}
@keyframes head{${headFrames}}
.over{opacity:0;animation:over ${T.toFixed(2)}s step-end infinite}
@keyframes over{0%{opacity:0}${pct(Tg, T)}{opacity:1}}
${css}
@media (prefers-reduced-motion:reduce){.blink{animation:none}}
</style>
<defs><filter id="glow" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10" fill="${theme.panel}" stroke="${theme.border}" stroke-width="2"/>
<text x="${OX}" y="30" class="neon blink">1UP</text>
<text x="${OX + 60}" y="30" class="dim">SCORE</text>
${scoreText}
<text x="${width - OX - 190}" y="30" class="dim">HI-SCORE</text>
<text x="${width - OX - 120}" y="30">${pad(total)}</text>
<text x="${width - OX}" y="30" class="neon" text-anchor="end">DEMO</text>
${cells}
<g${theme.glow ? ' filter="url(#glow)"' : ""}><path class="body" d="${d}"/><path class="head" d="${d}"/></g>
<g class="over">
<rect x="${OX - 6}" y="${OY - 6}" width="${g.W * C + 10}" height="${H * C + 10}" rx="6" fill="${theme.panel}" opacity="0.88"/>
<text x="${width / 2}" y="${midY - 14}" text-anchor="middle" class="neon" style="font-size:22px">${title}</text>
<text x="${width / 2}" y="${midY + 6}" text-anchor="middle" class="dim">${sub}</text>
<text x="${width / 2}" y="${midY + 30}" text-anchor="middle" class="neon blink" style="font-size:15px">&#9654; CLICK TO PLAY</text>
</g>
<text x="${OX}" y="${height - 14}" class="dim">PLAYER 1: A BOT  ·  PLAYER 2: YOU?</text>
<text x="${width - OX}" y="${height - 14}" class="neon blink" text-anchor="end" style="font-size:11px">INSERT COIN: CLICK TO PLAY &#9654;</text>
</svg>
`;
  return { svg, score, outcome: g.outcome };
}
