// Chụp các bước tạo hợp đồng từ app thật (vite 5321 → backend 5190). Chỉ đăng nhập + đọc + bấm "Tiếp"; KHÔNG bấm "Tạo hợp đồng".
// Chạy từ gốc repo: MA_APP_URL=http://localhost:5321 node docs/design/ui-redesign/ux-v2/shots/x11/chup.mjs <thư_mục_ảnh>
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs'
const { Browser, sleep } = await import(pathToFileURL(CDP).href)
const HERE = dirname(fileURLToPath(import.meta.url))
const PROBE = readFileSync(join(HERE, '../../../tools/qa-probe.js'), 'utf8')
const BASE = process.env.MA_APP_URL || 'http://localhost:5321'
const out = process.argv[2]
mkdirSync(out, { recursive: true })
if (!process.env.MA_DEMO_PASSWORD) { console.error('Thiếu MA_DEMO_PASSWORD'); process.exit(2) }

const fill = (sel, val) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(val)});
  el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const chonOption = (labelText, optMau) => `(() => { const l = [...document.querySelectorAll('label.field')].find((x) => x.querySelector('.label')?.textContent === ${JSON.stringify(labelText)}); const s = l?.querySelector('select'); if (!s) return false;
  const o = [...s.options].find((x) => x.value && x.textContent.includes(${JSON.stringify(optMau)})) || [...s.options].find((x) => x.value); if (!o) return false;
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, o.value); s.dispatchEvent(new Event('change', { bubbles: true })); return o.value })()`
const bam = (nhan) => `(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(nhan)})); if (!b) return false; b.click(); return true })()`

const b = await Browser.launch({ width: 1440, height: 900 })
const kq = []
try {
  for (const [w, h, cacBuoc] of [[1440, 900, [1, 2, 3, 4, 5]], [390, 844, [1, 2, 3, 4, 5]]]) {
    const p = await b.newPage({ width: w, height: h, mobile: w < 600, dsf: 1 })
    await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
    if (await p.eval(`!!document.querySelector('input[autocomplete="username"]')`)) { // phiên đã đăng nhập từ khung trước thì bỏ qua
      await p.eval(fill('input[autocomplete="username"]', '0999000011'))
      await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD))
      await p.eval(`document.querySelector('form button[type="submit"]').click()`)
    }
    for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[data-navigation-layout], nav[aria-label]')`)); i++) await sleep(250)
    await p.goto(`${BASE}/hop-dong/moi?toaNhaId=3`, { settleMs: 1800 })
    const phongId = await p.eval(chonOption('Phòng cần thuê', 'Phòng 401 '))
    console.log(w, 'phongId 401 =', phongId)
    await p.goto(`${BASE}/hop-dong/moi?phongId=${phongId}&toaNhaId=3`, { settleMs: 1800 })
    await p.eval(chonOption('Người thuê đứng tên hợp đồng', ''))
    for (const n of cacBuoc) {
      if (n === 2) await p.eval(bam('Tiếp'))
      if (n === 3) { await p.eval(bam('1 năm')); await sleep(200); await p.eval(bam('Tiếp')) }
      if (n === 4) { await p.eval(bam('Chọn tất cả')); await sleep(200); await p.eval(bam('Tiếp')) }
      if (n === 5) { await p.eval(bam('Cọc 2 tháng')); await sleep(200); await p.eval(bam('Tiếp')) }
      await sleep(600)
      const qa = await p.eval(PROBE)
      const name = `11-ql-tao-hop-dong-b${n}-${w}`
      const png = join(out, `${name}.png`)
      await p.screenshot({ path: png, format: 'png', fullPage: true })
      kq.push({ name, url: await p.eval('location.pathname + location.search'), w, png, qa })
    }
    await p.close()
  }
} finally { await b.close() }
writeFileSync(join(out, 'qa.json'), JSON.stringify(kq, null, 1))
for (const r of kq) console.log(r.name, r.url, JSON.stringify(r.qa).slice(0, 200))
