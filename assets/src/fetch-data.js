// Pulls public GitHub data for the stats cards into assets/src/data.json.
// Usage: node assets/src/fetch-data.js   (set GITHUB_TOKEN to avoid rate limits)
const fs = require("fs");
const path = require("path");

const USER = "YSD98";
const headers = { "User-Agent": "readme-builder", Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function json(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

(async () => {
  const user = await json(`https://api.github.com/users/${USER}`);
  const commits = await json(`https://api.github.com/search/commits?q=author:${USER}`);
  const repos = await json(`https://api.github.com/users/${USER}/repos?per_page=100`);

  // Language share by number of original repos using it as their main language.
  const counts = {};
  for (const r of repos) {
    if (r.fork || !r.language || r.name === USER) continue;
    counts[r.language] = (counts[r.language] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3).map(([name, n]) => ({ name, pct: (100 * n) / total }));
  const rest = 100 - top.reduce((a, l) => a + l.pct, 0);
  if (rest > 0) top.push({ name: "Others", pct: rest });

  // Last ~17 weeks of the public contribution calendar (levels 0-4).
  const html = await (await fetch(`https://github.com/users/${USER}/contributions`)).text();
  const days = [...html.matchAll(/data-date="([\d-]+)"[^>]*data-level="(\d)"/g)]
    .map(m => ({ date: m[1], level: +m[2] }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const data = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    commits: commits.total_count,
    repos: user.public_repos,
    years: new Date().getFullYear() - new Date(user.created_at).getFullYear(),
    languages: top,
    contributions: days.slice(-17 * 7).map(d => d.level),
  };
  fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ ...data, contributions: `${data.contributions.length} days` }, null, 2));
})();
