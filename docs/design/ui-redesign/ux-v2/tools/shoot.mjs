// Chụp PNG + xuất SVG figma-ready + đo QA cho bản xem trước UX v2 (bản rút gọn của ../../tools/cdp-run.mjs, thêm hash route).
// Chạy từ docs/design/ui-redesign/ux-v2:  node tools/shoot.mjs tools/jobs.json > tools/shoot-result.json
//   job: { name, hash, w, h, full?, svg? }  → screens/png/<name>.png, figma/<name>.svg
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs';
const { Browser } = await import(pathToFileURL(CDP).href);
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), TOOLS = resolve(ROOT, '../tools');
const page = pathToFileURL(join(ROOT, 'prototype/index.html')).href;
const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8')).filter((j) => !process.argv[3] || j.name.includes(process.argv[3]));
const faces = (readFileSync(resolve(ROOT, '../assets/tokens.css'), 'utf8').match(/@font-face\s*\{[^}]*\}/g) || []).join('').replace(/url\('fonts\//g, "url('../../assets/fonts/");
mkdirSync(join(ROOT, 'screens/png'), { recursive: true }); mkdirSync(join(ROOT, 'figma'), { recursive: true });
const b = await Browser.launch({ width: 1440, height: 900 });
const out = [];
try {
  for (const j of jobs) {
    const p = await b.newPage({ width: j.w, height: j.h, mobile: j.w < 600, dsf: 1 });
    await p.goto(page + '#' + j.hash, { settleMs: 600 });
    await p.eval('localStorage.removeItem("ma.toa"); 1');
    await p.eval('document.fonts.ready.then(()=>1)');
    const r = { name: j.name, hash: j.hash, w: j.w };
    r.qa = await p.eval(readFileSync(join(TOOLS, 'qa-probe.js'), 'utf8'));
    r.primaryButtons = await p.eval(`[...document.querySelectorAll('.btn-primary')].filter(e => e.getBoundingClientRect().width > 0).length`);
    if (j.full) await p.eval(`(() => { const H = document.documentElement.scrollHeight; for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); if (s.position === 'fixed' && r.bottom >= innerHeight - 1 && r.top > innerHeight / 2) Object.assign(e.style, { position: 'absolute', top: (H - (innerHeight - r.top)) + 'px', bottom: 'auto' }); } return 1; })()`);
    await p.screenshot({ path: join(ROOT, 'screens/png', j.name + '.png'), format: 'png', fullPage: !!j.full });
    if (j.svg !== false) {
      const svg = (await p.eval(readFileSync(join(TOOLS, 'dom2svg.js'), 'utf8'))).replace('<defs>', `<defs><style>${faces}</style>`);
      writeFileSync(join(ROOT, 'figma', j.name + '.svg'), svg);
      r.svgBytes = svg.length;
    }
    r.errors = p.consoleErrors;
    out.push(r);
    await p.close();
  }
} finally { await b.close(); }
console.log(JSON.stringify(out, null, 1));
