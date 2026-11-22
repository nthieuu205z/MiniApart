// Đo cấu trúc app thật 5190: mỗi vai trò đăng nhập (POST login duy nhất), mở từng mục menu (GET), đếm ô chọn toà, bảng, breadcrumb, chiều cao.
// Không bấm nút nghiệp vụ; riêng CHU/Người thuê bấm "Xem và sửa hồ sơ" (chỉ mở form, không lưu) để xem chi tiết hiện ở đâu.
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
const { Browser, sleep } = await import(pathToFileURL('C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs').href)
const BASE = 'http://localhost:5190'
const SDT = { QTHT: '0999000001', CHU: '0999000011', QUAN_LY: '0999000020', THO: '0999000031', NGUOI_THUE: '0999100001' }
const role = process.argv[2], W = +(process.argv[3] || 1440)
const fill = (sel, val) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(val)});
  el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const b = await Browser.launch({ width: W, height: 900 })
const out = { role, w: W, pages: [] }
try {
  const p = await b.newPage({ width: W, height: W < 600 ? 844 : 900, mobile: W < 600 })
  await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
  await p.eval(fill('input[autocomplete="username"]', SDT[role])); await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD))
  await p.eval(`document.querySelector('form button[type="submit"]').click()`)
  for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[aria-label]')`)); i++) await sleep(250)
  await sleep(800)
  const links = await p.eval(`[...new Set([...document.querySelectorAll('nav a[href^="/"]')].map(a => a.getAttribute('href')))]`)
  out.menu = links
  for (const path of links) {
    await p.goto(BASE + path, { settleMs: 1500 })
    out.pages.push(await p.eval(`(() => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 };
      const selects = [...document.querySelectorAll('main select, main [role=combobox]')].filter(vis).map(s => (s.labels?.[0]?.textContent || s.getAttribute('aria-label') || '').trim().slice(0,30));
      const btns = [...document.querySelectorAll('main button')].filter(vis);
      return { path: location.pathname, h1: document.querySelector('main h1, h1')?.textContent.trim(),
        crumbs: !!document.querySelector('nav[aria-label*="readcrumb"], .breadcrumb, [aria-label="Đường dẫn"]'),
        selects, tables: document.querySelectorAll('main table').length, h2: [...document.querySelectorAll('main h2')].filter(vis).map(h => h.textContent.trim().slice(0,40)),
        buttons: btns.length, primary: btns.filter(x => getComputedStyle(x).backgroundColor === 'rgb(15, 118, 110)').map(x => x.textContent.trim().slice(0,30)),
        docH: document.documentElement.scrollHeight }
    })()`))
  }
  if (role === 'CHU') {
    await p.goto(BASE + '/nguoi-thue', { settleMs: 1500 })
    const y0 = await p.eval('document.documentElement.scrollHeight')
    const clicked = await p.eval(`(() => { const a = [...document.querySelectorAll('main button, main a')].find(x => /Xem và sửa/.test(x.textContent)); if (!a) return false; a.click(); return true })()`)
    await sleep(1200)
    out.nguoiThueClick = { clicked, url: await p.eval('location.pathname + location.search'), hBefore: y0, hAfter: await p.eval('document.documentElement.scrollHeight'),
      newHeadings: await p.eval(`[...document.querySelectorAll('main h2, main h3')].map(h => [h.textContent.trim().slice(0,40), Math.round(h.getBoundingClientRect().top + scrollY)])`) }
  }
} finally { await b.close() }
writeFileSync(`C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/cache/scratch/uxv2/probe-${role}-${W}.json`, JSON.stringify(out, null, 1))
console.log(JSON.stringify(out).slice(0, 200))
