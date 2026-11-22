// Đo lề trái/phải (getBoundingClientRect) của h1 và thẻ đầu tiên theo vai trò. Mật khẩu lấy từ MA_DEMO_PASSWORD, không in ra.
import { pathToFileURL } from 'node:url'
const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs'
const { Browser, sleep } = await import(pathToFileURL(CDP).href)
const BASE = process.env.MA_APP_URL || 'http://localhost:5322'
const SDT = { QTHT: '0999000001', CHU: '0999000011', QUAN_LY: '0999000020', THO: '0999000031', NGUOI_THUE: '0999100001' }
const JOBS = [['THO', '/viec-cua-toi'], ['NGUOI_THUE', '/'], ['QTHT', '/'], ['CHU', '/'], ['QUAN_LY', '/']]
const fill = (sel, val) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(val)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const probe = `(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(innerWidth - b.right), w: Math.round(b.width) } };
  const card = document.querySelector('main .card, main article, main section[class*=card], main li, main table, main .banner'); return { path: location.pathname, h1: document.querySelectorAll('h1').length, h1box: r(document.querySelector('h1')), card: r(card), cardTag: card && (card.tagName + '.' + card.className).slice(0, 40), sx: document.documentElement.scrollWidth - innerWidth } })()`
const b = await Browser.launch({ width: 1440, height: 900 })
const out = []
try {
  for (const [role, path] of JOBS) for (const w of [1440, 390]) {
    const p = await b.newPage({ width: w, height: 900, mobile: w < 600, dsf: 1 })
    await p.goto(`${BASE}/dang-nhap`, { settleMs: 300 }); await p.eval('localStorage.clear(); sessionStorage.clear(); 1')
    await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
    await p.eval(fill('input[autocomplete="username"]', SDT[role])); await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD))
    await p.eval(`document.querySelector('form button[type="submit"]').click()`)
    for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[data-navigation-layout], nav[aria-label]')`)); i++) await sleep(250)
    await p.goto(`${BASE}${path}`, { settleMs: 1800 })
    out.push({ role, w, ...(await p.eval(probe)) }); await p.close()
  }
} finally { await b.close() }
for (const o of out) console.log(JSON.stringify(o))
