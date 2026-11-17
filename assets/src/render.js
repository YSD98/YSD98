// Renders every README section image into assets/ using headless Edge.
// Usage: node assets/src/fetch-data.js && node assets/src/render.js
// (set BROWSER to a Chrome/Edge executable if Edge is elsewhere)
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const browser = process.env.BROWSER ||
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const SRC = __dirname;
const OUT = path.join(SRC, "..");

// Material-style UI icons (24x24) + devicon / simple-icons tech logos.
const ICONS = {
  person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  wrench: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
  bars: "M4 20V11h4v9H4zm6 0V6h4v14h-4zm6 0V3h4v17h-4z",
  pie: "M11 2v20c-5.07-.5-9-4.79-9-9.95s3.93-9.45 9-10.05zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z",
  gamepad: "M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",
  sprout: "M6.05 8.05c-2.73 2.73-2.73 7.15-.02 9.88 1.47-3.4 4.09-6.24 7.36-7.93-2.77 2.34-4.71 5.61-5.39 9.32 2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z",
  bolt: "M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z",
  award: "M12 1.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm0 3.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM7.2 15.6 5.5 22.5 9 21l3 2.5V18a9.4 9.4 0 0 1-4.8-2.4zm9.6 0A9.4 9.4 0 0 1 12 18v5.5l3-2.5 3.5 1.5-1.7-6.9z",
};
const svg24 = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
const icons = Object.fromEntries(Object.entries(ICONS).map(([k, d]) => [k, svg24(d)]));
icons.cube = `<svg viewBox="0 0 24 24"><path d="M12 1.5 2.5 6.5v11L12 22.5l9.5-5v-11z"/>
  <path d="M2.5 6.5 12 11.5l9.5-5M12 11.5v11" style="fill:none!important" stroke="var(--card)" stroke-width="1.6"/></svg>`;
const file = f => fs.readFileSync(path.join(SRC, "icons", f), "utf8")
  .replace(/<title>.*?<\/title>/, "").replace(/\sfill="[^"]*"/g, "");
Object.assign(icons, {
  unity: file("unity-plain.svg"), unreal: file("unrealengine-original.svg"),
  blender: file("blender.svg"), csharp: file("csharp-plain.svg"),
  cpp: file("cplusplus-plain.svg"), python: file("python-plain.svg"), git: file("git-plain.svg"),
});

const data = JSON.parse(fs.readFileSync(path.join(SRC, "data.json"), "utf8"));
const build = path.join(SRC, "_build.html");
fs.writeFileSync(build, fs.readFileSync(path.join(SRC, "sections.html"), "utf8")
  .replace("/*INJECT*/", `window.DATA=${JSON.stringify(data)};window.ICONS=${JSON.stringify(icons)};`));
const url = pathToFileURL(build).href;

function shot(name, params, w, h) {
  const out = path.join(OUT, `${name}.png`);
  // Headless Edge occasionally hangs on exit; kill it after a while and retry.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { fs.unlinkSync(out); } catch {}
    try {
      execFileSync(browser, [
        "--headless", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
        "--no-first-run", "--disable-extensions", `--user-data-dir=${path.join(require("os").tmpdir(), "readme-render")}`,
        "--force-device-scale-factor=2", "--default-background-color=00000000",
        `--window-size=${w},${h}`, `--screenshot=${out}`, `${url}?${params}`,
      ], { stdio: "ignore", timeout: 25000 });
    } catch {}
    if (fs.existsSync(out)) return console.log("wrote", path.relative(OUT, out));
  }
  throw new Error(`failed to render ${name}`);
}

// Themed sections: [name, width, height]
const THEMED = [
  ["about", 1000, 190], ["projects", 1000, 60],
  ["project-1", 250, 232], ["project-2", 250, 232], ["project-3", 250, 232], ["project-4", 250, 232],
  ["tech", 1000, 170], ["stats", 1000, 182], ["certs", 1000, 60],
  ["cert-1", 250, 104], ["cert-2", 250, 104],
];
for (const [c, w, h] of THEMED)
  for (const theme of ["light", "dark"]) shot(`${c}-${theme}`, `c=${c}&theme=${theme}`, w, h);

// Photo sections look the same in both themes.
shot("hero", "c=hero", 1000, 353);
const FOOTER_SLICES = [["a", 0, 444], ["linkedin", 444, 499], ["instagram", 499, 557], ["b", 557, 1000]];
for (const [n, x0, x1] of FOOTER_SLICES) shot(`footer-${n}`, `c=footer&x=${x0}`, x1 - x0, 152);

fs.unlinkSync(build);
