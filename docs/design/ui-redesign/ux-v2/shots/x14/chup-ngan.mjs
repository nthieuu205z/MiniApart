// Chụp ngăn thao tác của hồ sơ hợp đồng từ app thật. Chỉ đăng nhập + đọc + MỞ ngăn; KHÔNG bấm nút ghi trong ngăn.
// Chạy từ gốc repo: MA_APP_URL=http://localhost:5324 node docs/design/ui-redesign/ux-v2/shots/x14/chup-ngan.mjs <thư_mục_ảnh>
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs'
const { Browser, sleep } = await import(pathToFileURL(CDP).href)
const HERE = dirname(fileURLToPath(import.meta.url))
const PROBE = readFileSync(join(HERE, '../../../tools/qa-probe.js'), 'utf8')
const BASE = process.env.MA_APP_URL
const out = process.argv[2]; mkdirSync(out, { recursive: true })
const fill = (sel, val) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(val)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const bamNut = (nhan) => `(() => { const b = [...document.querySelectorAll('.ph-acts button')].find((x) => x.textContent.trim() === ${JSON.stringify(nhan)}); if (!b) return false; b.click(); return true })()`
const bamMenu = (nhan) => `(() => { document.querySelector('.ph-acts button[aria-haspopup="menu"]').click(); return new Promise((r) => setTimeout(() => { const m = [...document.querySelectorAll('[role="menuitem"]')].find((x) => x.textContent.trim() === ${JSON.stringify(nhan)}); if (m) m.click(); r(!!m) }, 250)) })()`
const CA = [ // [id, trạng thái, [thao tác]]; 'N:' = nút chính, 'M:' = mục trong …
  [9, 'sap-het-han', ['N:Gia hạn', 'M:Thanh lý hợp đồng', 'M:Phụ lục', 'M:Người ở cùng']],
  [10, 'cho-ky', ['N:Ký hợp đồng', 'M:Thanh lý hợp đồng', 'M:Phụ lục', 'M:Người ở cùng']],
  [1, 'binh-thuong', ['M:Thanh lý hợp đồng', 'M:Phụ lục', 'M:Người ở cùng']],
]
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const b = await Browser.launch({ width: 1440, height: 900 }); const kq = []
try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await b.newPage({ width: w, height: h, mobile: w < 600, dsf: 1 })
    await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
    if (await p.eval(`!!document.querySelector('input[autocomplete="username"]')`)) {
      await p.eval(fill('input[autocomplete="username"]', '0999000011')); await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD))
      await p.eval(`document.querySelector('form button[type="submit"]').click()`)
    }
    for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[data-navigation-layout], nav[aria-label]')`)); i++) await sleep(250)
    for (const [id, tt, ops] of CA) for (const op of ops) {
      await p.goto(`${BASE}/hop-dong/${id}`, { settleMs: 1800 })
      const ok = await p.eval(op.startsWith('N:') ? bamNut(op.slice(2)) : bamMenu(op.slice(2)))
      await sleep(1800)
      const ten = `14-hd${id}-${tt}-${slug(op.slice(2))}-${w}`
      const tieuDe = await p.eval(`document.querySelector('[role="dialog"] h2')?.textContent ?? null`)
      const qa = await p.eval(PROBE)
      await p.screenshot({ path: join(out, `${ten}.png`), format: 'png', fullPage: false })
      kq.push({ name: ten, w, moDuoc: ok, tieuDe, qa }); console.log(ten, ok, tieuDe, 'overflow', qa.horizontalOverflow, 'belowHit', qa.belowHit.length, 'contrast', qa.contrast.below.length, 'text', qa.textBelowFloor.length)
    }
    await p.close()
  }
} finally { await b.close() }
writeFileSync(join(out, 'qa-ngan.json'), JSON.stringify(kq, null, 1))
