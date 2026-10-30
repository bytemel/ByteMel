// Live uptime board beside `whoami`: pings each shipped site and draws a terminal card.
// Called from pulse.mjs every 6 hours, once per theme. No timestamp, so the SVG only changes when a site does.

import { THEMES, MONO } from "./themes.mjs";

export const SITES = [
  "afriesg.africa",
  "epicprime.co.ke",
  "nawirisisters.org",
  "mozinigifts.com",
  "weamplifyafrica.org",
  "canvathon-kenya.vercel.app",
  "arkaivafrica.com",
  "magotheinnocent.com",
  "docent-drab.vercel.app",
  "timmwangi.com",
];

async function isUp(host) {
  // Two tries, so one slow response does not paint a site red.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://${host}`, { redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (res.status < 500) return true;
    } catch {}
  }
  return false;
}

export async function checkSites(sites = SITES) {
  return Promise.all(sites.map(async (host) => ({ host, up: await isUp(host) })));
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function renderStatusBoard(results, t = THEMES.dark) {
  const W = 300;
  const top = 58;
  const rowH = 22;
  const H = top + results.length * rowH + 24;
  const upCount = results.filter((r) => r.up).length;
  const allUp = upCount === results.length;

  const rows = results.map((r, i) => {
    const y = top + i * rowH;
    const color = r.up ? t.accent : t.down;
    return `
  <circle class="dot ${r.up ? "up" : "down"}" style="animation-delay:${(i * 0.23).toFixed(2)}s" cx="22" cy="${y - 4}" r="4" fill="${color}"/>
  <text x="34" y="${y}" class="host">${esc(r.host)}</text>
  <text x="${W - 16}" y="${y}" class="state" fill="${color}" text-anchor="end">${r.up ? "up" : "down"}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${upCount} of ${results.length} sites I built are up">
  <style>
    text { font-family: ${MONO}; font-size: 12px; }
    .host { fill: ${t.text}; }
    .head { fill: ${t.accent}; font-weight: 600; }
    .sub { fill: ${t.muted}; font-size: 11px; }
    .dot.up { animation: beat 2.4s ease-in-out infinite; }
    .dot.down { animation: blink 0.8s steps(2) infinite; }
    .cursor { animation: blink 1s steps(2) infinite; }
    @keyframes beat { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .dot, .cursor { animation: none; } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="8" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
  <circle cx="16" cy="14" r="4" fill="#ff5f56"/><circle cx="30" cy="14" r="4" fill="#ffbd2e"/><circle cx="44" cy="14" r="4" fill="#27c93f"/>
  <text x="14" y="38" class="head">&gt; ./uptime --built-by-me</text>${rows}
  <text x="14" y="${H - 14}" class="sub">${upCount}/${results.length} up${allUp ? ", still running without me" : ", I am on it"}</text>
  <rect class="cursor" x="${W - 22}" y="${H - 24}" width="7" height="13" fill="${t.accent}"/>
</svg>
`;
}
