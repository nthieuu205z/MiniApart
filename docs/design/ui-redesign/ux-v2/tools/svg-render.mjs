// Render ngược từng SVG trong figma/ bằng Edge rồi lưu PNG vào thư mục tạm để so pixel với screens/png (tools/compare.py --svg).
// Chạy: node tools/svg-render.mjs <thư_mục_tạm>
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const { Browser } = await import(pathToFileURL(process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs').href);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), out = process.argv[2];
mkdirSync(out, { recursive: true });
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const f of readdirSync(join(ROOT, 'figma')).filter((x) => x.endsWith('.svg'))) {
    const s = readFileSync(join(ROOT, 'figma', f), 'utf8');
    const [w, h] = [+s.match(/width="(\d+)/)[1], +s.match(/height="(\d+)/)[1]];
    const p = await b.newPage({ width: w, height: Math.min(h, 4000), mobile: w < 600, dsf: 1 });
    await p.goto(pathToFileURL(join(ROOT, 'figma', f)).href, { settleMs: 600 });
    await p.screenshot({ path: join(out, f.replace('.svg', '.png')), format: 'png', fullPage: true });
    await p.close();
    console.log(f, w, h);
  }
} finally { await b.close(); }
