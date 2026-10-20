// Rewrites the PULSE block in README.md with live GitHub numbers.
// Runs from .github/workflows/pulse.yml. Node 20+, no dependencies.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { renderSnakeGame } from "./snake-game.mjs";
import { checkSites, renderStatusBoard } from "./status-board.mjs";

const USER = process.env.GH_USER || "bytemel";
const TOKEN = process.env.GITHUB_TOKEN;
const README = new URL("../README.md", import.meta.url);
const START = "<!--PULSE:START-->";
const END = "<!--PULSE:END-->";

// One of these shows up each day. Add your own.
const QUESTS = [
  "Ship something before lunch",
  "Delete more code than I write",
  "Build a thing in under an hour, just because",
  "Fix the bug I have been ignoring",
  "Write the docs nobody asked for",
  "Push to production on a Friday (kidding. mostly)",
  "Make one page load faster",
  "Try a tool I have never used",
  "Teach someone one thing I learned this week",
  "Close a tab I opened in 2025",
  "Write a post instead of a draft",
  "Say no to one meeting, say yes to one build",
  "Automate something I did by hand twice",
  "Ship it ugly, polish it after",
];

const STREAK_GOAL = 100;

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function lastPush() {
  const res = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=50`, {
    headers: { Authorization: `bearer ${TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  const events = await res.json();
  return events.find((e) => e.type === "PushEvent" && e.repo.name.toLowerCase() !== `${USER}/${USER}`.toLowerCase()) || null;
}

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function streaks(days) {
  // days: oldest first, [{ date, count }]. Today may still be at 0, so it does not break the streak.
  let current = 0;
  let i = days.length - 1;
  if (days[i] && days[i].count === 0) i--;
  for (; i >= 0 && days[i].count > 0; i--) current++;
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return { current, longest };
}

function bar(value, goal, width = 20) {
  const filled = Math.min(width, Math.round((value / goal) * width));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function row(label, value) {
  return `${label} ${".".repeat(Math.max(2, 26 - label.length))} ${value}`;
}

const { user } = await gql(
  `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount weekday } }
        }
      }
    }
  }`,
  { login: USER },
);

const cal = user.contributionsCollection.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount }));
const { current, longest } = streaks(days);
const week = days.slice(-7).reduce((sum, d) => sum + d.count, 0);
const busiest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
const push = await lastPush();

const now = new Date();
const dayOfYear = Math.floor((now - new Date(now.getUTCFullYear(), 0, 0)) / 86400000);
const quest = QUESTS[dayOfYear % QUESTS.length];
const fire = current >= 30 ? "🔥🔥🔥" : current >= 7 ? "🔥" : current > 0 ? "🌱" : "😴 (time to wake up)";

const lines = [
  row("contributions, last year", cal.totalContributions.toLocaleString("en-US")),
  row("this week", week),
  row("current streak", `${current} day${current === 1 ? "" : "s"} ${fire}`),
  row("longest streak", `${longest} days`),
  row("best day", `${busiest.count} on ${busiest.date}`),
  row("last public push", push ? `${push.repo.name.split("/")[1]}, ${ago(push.created_at)}` : "inside a client repo 🤫"),
  "",
  `100-day streak challenge`,
  `[${bar(current, STREAK_GOAL)}] ${Math.min(current, STREAK_GOAL)}/${STREAK_GOAL}`,
  "",
  `today's side quest: ${quest}`,
];

const block = [
  START,
  "```text",
  ...lines,
  "```",
  END,
].join("\n");

const readme = await readFile(README, "utf8");
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!pattern.test(readme)) throw new Error("PULSE markers missing from README.md");
await writeFile(README, readme.replace(pattern, block));
console.log(block);

// The self-playing snake under ./activity, and the board for the playable game it links to.
const ASSETS = new URL("../assets/", import.meta.url);
const DOCS = new URL("../docs/", import.meta.url);
await mkdir(ASSETS, { recursive: true });
await mkdir(DOCS, { recursive: true });
const weeksForGame = cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday })));
const demo = renderSnakeGame(weeksForGame, { user: USER, total: cal.totalContributions });
await writeFile(new URL("snake-game.svg", ASSETS), demo.svg);
await writeFile(new URL("contributions.json", DOCS), JSON.stringify({
  user: USER,
  total: cal.totalContributions,
  bot: { score: demo.score, outcome: demo.outcome },
  weeks: weeksForGame.map((days) => days.map((d) => [d.date, d.count, d.weekday])),
}));

// The uptime board beside `whoami`.
await writeFile(new URL("status-board.svg", ASSETS), renderStatusBoard(await checkSites()));
