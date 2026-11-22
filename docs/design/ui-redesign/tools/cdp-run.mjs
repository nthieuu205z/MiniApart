// Công cụ chụp + đo + xuất SVG cho bộ design. Chạy: node tools/cdp-run.mjs <lệnh> [tham số]
// Dùng client CDP không phụ thuộc của skill taste (Edge headless). Không ghi gì ngoài docs/design/ui-redesign.
//   batch  <jobs.json>   mỗi job {html, w, h, png?, svg?, qa?, probe?, full?, reduced?}: chụp PNG, xuất SVG figma-ready, đo QA
//   eval   <html> <js>   chạy biểu thức trong trang, in JSON
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs';
const { Browser } = await import(pathToFileURL(CDP).href);
const HERE = dirname(fileURLToPath(import.meta.url));

const [cmd, ...a] = process.argv.slice(2);
const url = (p) => pathToFileURL(resolve(p)).href;
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  if (cmd === 'batch') {
    // batch <jobs.json>: [{html, png?, svg?, qa?, w, h, full?, reduced?}]
    const jobs = JSON.parse(readFileSync(a[0], 'utf8'));
    const out = [];
    for (const j of jobs) {
      const mobile = j.w < 600;
      const p = await b.newPage({ width: j.w, height: j.h, mobile, dsf: 1, reducedMotion: !!j.reduced });
      await p.goto(url(j.html), { settleMs: 700 });
      await p.eval('document.fonts.ready.then(()=>1)');
      const r = { html: j.html };
      if (j.qa) r.qa = await p.eval(readFileSync(join(HERE, 'qa-probe.js'), 'utf8'));
      if (j.probe) r.probe = await p.eval(readFileSync(join(HERE, j.probe), 'utf8')); // ví dụ focus-motion-probe.js
      // Ảnh/SVG full-page: phần tử fixed ở đáy (bottom-nav, bàn phím số) ghim về đáy trang thay vì nằm giữa khung (QA đã đo ở trên với bố cục thật)
      if (j.full) await p.eval(`(() => { if (!document.body) return 0; const H = document.documentElement.scrollHeight; for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); if (s.position === 'fixed' && r.bottom >= innerHeight - 1 && r.top > innerHeight / 2) Object.assign(e.style, { position: 'absolute', top: (H - (innerHeight - r.top)) + 'px', bottom: 'auto' }); } return 1; })()`);
      if (j.png) await p.screenshot({ path: j.png, format: 'png', fullPage: !!j.full });
      if (j.svg) {
        // @font-face trỏ ../assets/fonts để mở SVG bằng trình duyệt vẫn đúng Inter; Figma bỏ qua và dùng font đã cài
        const faces = (readFileSync(join(HERE, '../assets/tokens.css'), 'utf8').match(/@font-face\s*\{[^}]*\}/g) || []).join('').replace(/url\('fonts\//g, "url('../assets/fonts/");
        const svg = (await p.eval(readFileSync(join(HERE, 'dom2svg.js'), 'utf8'))).replace('<defs>', `<defs><style>${faces}</style>`);
        writeFileSync(j.svg, svg);
        r.svgBytes = svg.length;
      }
      r.errors = p.consoleErrors;
      out.push(r);
      await p.close();
    }
    console.log(JSON.stringify(out, null, 1));
  } else if (cmd === 'eval') {
    const p = await b.newPage({ width: 1440, height: 900 });
    await p.goto(url(a[0]), { settleMs: 500 });
    await p.eval('document.fonts.ready.then(()=>1)');
    console.log(JSON.stringify(await p.eval(a[1]), null, 1));
  }
} finally {
  await b.close();
}
