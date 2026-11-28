// kalvina's website check (runs in GitHub on her work branch; Calvin 2026-11-27). Nothing here can change the live site.
// 1) every inline <script> in the HTML files she changed must parse (a broken script blanks the whole back office)
// 2) phone + desktop screenshots of the pages she lists (or the pages she changed), and any page errors while loading
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
const OUT = 'kalvina-out'; mkdirSync(OUT, { recursive: true });
const problems = []; const notes = [];
let changed = [];
try { changed = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean); } catch (e) { notes.push('could not list changed files: ' + e.message); }
const htmls = changed.filter((f) => /\.html?$/i.test(f) && existsSync(f));
export function inlineScripts(html) {
  const out = []; const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi; let m;
  while ((m = re.exec(html))) { const attrs = m[1] || ''; if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = ((attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '').toLowerCase();
    if (type && !/^(text\/javascript|application\/javascript|module)$/.test(type)) continue;
    out.push({ module: type === 'module', code: m[2], line: html.slice(0, m.index).split('\n').length }); }
  return out;
}
for (const f of htmls) {
  const list = inlineScripts(readFileSync(f, 'utf8'));
  list.forEach((s, i) => { const tmp = `${OUT}/_s${i}.${s.module ? 'mjs' : 'js'}`; writeFileSync(tmp, s.code);
    try { execSync(`node --check ${tmp}`, { stdio: 'pipe' }); } catch (e) { const msg = String(e.stderr || e.message).split('\n').filter((l) => /Error/.test(l))[0] || 'syntax error';
      const at = (String(e.stderr || '').match(/:(\d+)\n/) || [])[1]; problems.push(`${f}: script starting at line ${s.line} does not parse${at ? ' (about line ' + (s.line + Number(at) - 1) + ')' : ''}: ${msg.trim()}`); } });
  notes.push(`${f}: ${list.length} scripts checked`);
}
let pages = String(process.env.PAGES || '').split(',').map((s) => s.trim()).filter((p) => /^[\w./-]+$/.test(p));
if (!pages.length) pages = htmls.slice(0, 4);
const shots = [];
if (pages.length) {
  const srv = spawn('python3', ['-m', 'http.server', '8080'], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 1500));
  const { chromium, devices } = (await import('node:module')).createRequire(import.meta.url)('playwright'); const b = await chromium.launch();
  for (const p of pages.slice(0, 6)) {
    for (const [kind, opt] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }]]) {
      const ctx = await b.newContext(opt); const pg = await ctx.newPage(); const errs = [];
      pg.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 200)));
      try { await pg.goto('http://localhost:8080/' + p.replace(/^\/+/, ''), { waitUntil: 'load', timeout: 30000 }); await pg.waitForTimeout(2500); } catch (e) { errs.push('did not load: ' + e.message.slice(0, 150)); }
      const name = `${p.replace(/[^\w]+/g, '_')}-${kind}.png`; await pg.screenshot({ path: `${OUT}/${name}` }).catch(() => {});
      if (kind === 'phone') { const w = await pg.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]).catch(() => null); if (w && w[0] > w[1] + 2) problems.push(`${p}: on a phone the page is wider than the screen (${w[0]}px vs ${w[1]}px) — sideways scrolling`); }
      shots.push(name); for (const e of errs) problems.push(`${p} (${kind}): page error — ${e}`); await ctx.close();
    }
  }
  await b.close(); srv.kill();
  notes.push('Pages behind the back-office sign-in show the sign-in screen in these screenshots.');
}
writeFileSync(`${OUT}/report.json`, JSON.stringify({ passed: problems.length === 0, problems, changed, pages, screenshots: shots, notes }, null, 1));
console.log(JSON.stringify({ problems, notes }, null, 1));
if (problems.length) process.exit(1);
