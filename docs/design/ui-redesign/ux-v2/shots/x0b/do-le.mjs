// Đo toạ độ h1 đầu trang + thanh tab trên app thật. Dùng: node do-le.mjs <out.json>
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
const CDP = 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs'
const { Browser, sleep } = await import(pathToFileURL(CDP).href)
const BASE = 'http://localhost:5330'
const SDT = { CHU: '0999000011', QUAN_LY: '0999000020' }
const DUONG = ['/hom-nay', '/thu-tien', '/thu-tien?tab=hoa-don', '/nguoi-thue', '/nguoi-thue/1', '/hop-dong', '/hop-dong/9', '/toa-nha', '/toa-nha/3', '/phong/1?toaNhaId=3', '/chu-ky', '/su-co', '/bao-cao', '/lich-hen', '/an-toan']
const THEM = { QUAN_LY: ['/phong'] }
const fill = (s, v) => `(() => { const el = document.querySelector(${JSON.stringify(s)}); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const JS = `(() => { const s = document.querySelector('.ux-top ~ section'); if (!s) return null
 const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY)] }
 const tab = s.querySelector('nav.tabs-trang'); const kh = [...s.children].find((c) => c !== tab && !c.matches('nav.tabs-trang')); const tb = document.querySelector('.ux-top')
 const h1 = [...s.querySelectorAll('h1')].find((h) => !h.closest('nav'))
 return { khoi: r(kh), h1: r(h1), tab: r(tab), tabBottom: tab ? Math.round(tab.getBoundingClientRect().bottom + scrollY) : null, topBottom: Math.round(tb.getBoundingClientRect().bottom), khongQuyen: !!document.querySelector('#khong-co-quyen'), h1Text: h1 ? h1.textContent.slice(0, 30) : null } })()`
const b = await Browser.launch({ width: 1440, height: 900 })
const out = []
try {
  for (const role of ['CHU', 'QUAN_LY']) for (const w of [1440, 390]) {
    const p = await b.newPage({ width: w, height: 900, mobile: w < 600, dsf: 1 })
    await p.goto(`${BASE}/dang-nhap`, { settleMs: 300 }); await p.eval('localStorage.clear(); sessionStorage.clear(); 1')
    await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
    await p.eval(fill('input[autocomplete="username"]', SDT[role])); await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD))
    await p.eval(`document.querySelector('form button[type="submit"]').click()`)
    for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[aria-label]')`)); i++) await sleep(250)
    for (const d of [...DUONG, ...(THEM[role] ?? [])]) {
      await p.goto(`${BASE}${d}`, { settleMs: 1800 })
      out.push({ role, w, d, ...(await p.eval(JS)) })
    }
    await p.close()
  }
} finally { await b.close() }
writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
for (const o of out) console.log(o.role, o.w, o.d.padEnd(24), 'khoi', JSON.stringify(o.khoi), 'h1', JSON.stringify(o.h1), 'tab', JSON.stringify(o.tab), o.tabBottom ?? '', o.khongQuyen ? 'KHONG-QUYEN' : '', o.h1Text ?? '')
