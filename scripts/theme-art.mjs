// Draws the static header and footer in both themes: node scripts/theme-art.mjs
// Not part of the 6-hourly pulse run; rerun it by hand after changing the lines below.
import { writeFile } from "node:fs/promises";
import { THEMES, MONO } from "./themes.mjs";

const LINES = [
  "I make programmes and communities run.",
  "And I build the tools they need.",
  "Next.js + Supabase + Vercel, shipped solo.",
  "Paystack, M-Pesa, SMS, email: wired for Kenya.",
  "Tafsiri: live on the Chrome Web Store.",
];

const W = 1000;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function hero(t) {
  const H = 330;
  const size = 20;
  const cw = size * 0.6; // textLength pins every line to this width, whatever monospace font loads
  const x0 = 72;
  const slot = 4.2; // seconds per line: type, hold, erase
  const T = slot * LINES.length;
  const p = (s) => `${((s / T) * 100).toFixed(3)}%`;

  let css = "";
  let lines = "";
  LINES.forEach((line, i) => {
    const w = line.length * cw;
    const a = i * slot;
    const typed = a + line.length * 0.045;
    const erase = a + slot - 0.9;
    const gone = a + slot - 0.35;
    css += `.l${i}{opacity:0;animation:o${i} ${T}s infinite step-end}`
      + `@keyframes o${i}{0%{opacity:0}${p(a)}{opacity:1}${p(a + slot)}{opacity:0}}`
      + `.c${i}{animation:c${i} ${T}s infinite linear}`
      + `@keyframes c${i}{0%,${p(a)}{transform:translateX(0)}${p(typed)},${p(erase)}{transform:translateX(${w}px)}${p(gone)},100%{transform:translateX(0)}}`;
    lines += `<g class="l${i}"><text x="${x0}" y="252" textLength="${w}" lengthAdjust="spacingAndGlyphs" class="line">${esc(line)}</text>`
      + `<g class="c${i}"><rect x="${x0}" y="230" width="${w + 20}" height="30" fill="${t.bg}"/><rect class="cur" x="${x0 + 2}" y="235" width="11" height="22" fill="${t.accent}"/></g></g>`;
  });

  // A heartbeat that keeps crossing the window: systems that keep running.
  const beat = "M600 132 H700 l12 -2 l8 6 l10 -44 l12 74 l10 -40 l8 6 H820 l10 -18 l10 18 H960";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Timothy Mwangi. I make programmes and communities run, and I build the tools they need.">
<style>
text{font-family:${MONO}}
.dim{fill:${t.muted};font-size:14px}
.acc{fill:${t.accent}}
.cmd{fill:${t.text};font-size:18px}
.name{fill:${t.text};font-size:58px;font-weight:700}
.line{fill:${t.text};font-size:${size}px}
.cur{animation:blink 1s step-end infinite}
@keyframes blink{50%{opacity:0}}
.beat{fill:none;stroke:${t.accent};stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:140 900;animation:run 3.2s linear infinite}
@keyframes run{from{stroke-dashoffset:140}to{stroke-dashoffset:-760}}
${css}
@media (prefers-reduced-motion:reduce){.cur,.beat,[class^=c]{animation:none}.beat{stroke-dasharray:none}[class^=l]{animation:none}.l0{opacity:1}.c0{transform:translateX(${LINES[0].length * cw}px)}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${t.bg}" stroke="${t.border}" stroke-width="2"/>
<path d="M1 44 H${W - 1}" stroke="${t.border}" stroke-width="2"/>
<circle cx="28" cy="23" r="7" fill="#ff5f56"/><circle cx="50" cy="23" r="7" fill="#ffbd2e"/><circle cx="72" cy="23" r="7" fill="#27c93f"/>
<text x="${W / 2}" y="28" text-anchor="middle" class="dim">tim@nairobi: ~/ByteMel</text>
<text x="40" y="88" class="cmd"><tspan class="acc">$</tspan> whoami</text>
<text x="40" y="156" class="name" textLength="${14 * 58 * 0.6}" lengthAdjust="spacingAndGlyphs">Timothy Mwangi</text>
<path d="M600 132 H960" stroke="${t.border}" stroke-width="2" stroke-dasharray="2 6"/>
<path class="beat" d="${beat}"/>
<text x="960" y="186" text-anchor="end" class="dim">systems that keep running</text>
<text x="40" y="216" class="cmd"><tspan class="acc">$</tspan> cat ./mission</text>
<text x="40" y="252" class="line acc">&gt;</text>
<clipPath id="inner"><rect x="3" y="46" width="${W - 6}" height="${H - 50}"/></clipPath>
<g clip-path="url(#inner)">${lines}</g>
<text x="40" y="306" class="dim">-1.2921, 36.8219 · Nairobi, Kenya</text>
<text x="960" y="306" text-anchor="end" class="dim">timmwangi.com</text>
</svg>
`;
}

function footer(t) {
  const H = 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Thanks for reading.">
<style>
text{font-family:${MONO};font-size:16px;fill:${t.text}}
.dim{fill:${t.muted}}
.acc{fill:${t.accent}}
.cur{animation:blink 1s step-end infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.cur{animation:none}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${t.bg}" stroke="${t.border}" stroke-width="2"/>
<text x="40" y="42" textLength="57.6" lengthAdjust="spacingAndGlyphs"><tspan class="acc">$</tspan> exit</text>
<text x="40" y="70" class="dim">logout. Connection to tim@nairobi closed. Thanks for reading.</text>
<rect class="cur" x="106" y="28" width="9" height="18" fill="${t.accent}"/>
</svg>
`;
}

for (const [name, t] of Object.entries(THEMES)) {
  await writeFile(new URL(`../assets/hero-${name}.svg`, import.meta.url), hero(t));
  await writeFile(new URL(`../assets/footer-${name}.svg`, import.meta.url), footer(t));
}
console.log("hero and footer drawn for", Object.keys(THEMES).join(", "));
