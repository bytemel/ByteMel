// Streak card under ./activity: total, current streak (ring) and longest streak.
// Drawn here from the same calendar pulse.mjs already fetches, so it never depends on an outside image service.
// Called from pulse.mjs every 6 hours, once per theme.

import { THEMES, MONO } from "./themes.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function range(r) {
  if (!r) return "No streak yet";
  if (r.start === r.end) return fmt(r.start);
  const sameYear = r.start.slice(0, 4) === r.end.slice(0, 4);
  return `${sameYear ? fmt(r.start).replace(/, \d{4}$/, "") : fmt(r.start)} - ${fmt(r.end)}`;
}

// days: oldest first, [{ date, count }]. Today may still be at 0, so it does not break the streak.
export function streakRanges(days) {
  let i = days.length - 1;
  if (days[i] && days[i].count === 0) i--;
  let current = null;
  if (i >= 0 && days[i].count > 0) {
    const end = days[i].date;
    let n = 0;
    for (; i >= 0 && days[i].count > 0; i--) n++;
    current = { length: n, start: days[i + 1].date, end };
  }
  let longest = null;
  let run = 0;
  days.forEach((d, idx) => {
    run = d.count > 0 ? run + 1 : 0;
    if (run > 0 && (!longest || run > longest.length)) {
      longest = { length: run, start: days[idx - run + 1].date, end: d.date };
    }
  });
  return { current, longest };
}

export function renderStreakCard(days, total, t = THEMES.dark) {
  const W = 495;
  const H = 195;
  const { current, longest } = streakRanges(days);
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const col = [W / 6, W / 2, (W * 5) / 6];
  const cur = current ? current.length : 0;
  const best = longest ? longest.length : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Current streak ${cur} days, longest streak ${best} days, ${total} contributions in the last year">
  <style>
    text { font-family: ${MONO}; text-anchor: middle; }
    .num { font-size: 28px; font-weight: 700; fill: ${t.text}; }
    .cur { font-size: 28px; font-weight: 700; fill: ${t.accent}; }
    .label { font-size: 14px; fill: ${t.muted}; }
    .curlabel { font-size: 14px; font-weight: 700; fill: ${t.accent}; }
    .dates { font-size: 11px; fill: ${t.muted}; }
    .ring { animation: pulse 2.4s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
    @media (prefers-reduced-motion: reduce) { .ring { animation: none; } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="8" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
  <line x1="${W / 3}" y1="28" x2="${W / 3}" y2="${H - 28}" stroke="${t.border}" stroke-width="1"/>
  <line x1="${(W * 2) / 3}" y1="28" x2="${(W * 2) / 3}" y2="${H - 28}" stroke="${t.border}" stroke-width="1"/>

  <text x="${col[0]}" y="80" class="num">${total.toLocaleString("en-US")}</text>
  <text x="${col[0]}" y="116" class="label">Contributions</text>
  <text x="${col[0]}" y="142" class="dates">${first ? `${fmt(first)} - Present` : ""}</text>

  <circle class="ring" cx="${col[1]}" cy="71" r="40" fill="none" stroke="${t.accent}" stroke-width="5"/>
  <circle cx="${col[1]}" cy="31" r="11" fill="${t.bg}"/>
  <path transform="translate(${col[1] - 7} 21)" fill="${t.accent}" d="M7 0c1 3.5 5 5.6 5 10.2A5 5 0 0 1 2 10.2C2 7.8 3.4 6.4 4.4 5c.3 1.6 1 2.4 2 2.6C6.2 5.2 6.2 2.6 7 0z"/>
  <text x="${col[1]}" y="81" class="cur">${cur}</text>
  <text x="${col[1]}" y="140" class="curlabel">Current Streak</text>
  <text x="${col[1]}" y="162" class="dates">${current ? range(current) : last ? fmt(last) : ""}</text>

  <text x="${col[2]}" y="80" class="num">${best}</text>
  <text x="${col[2]}" y="116" class="label">Longest Streak</text>
  <text x="${col[2]}" y="142" class="dates">${range(longest)}</text>
</svg>
`;
}
