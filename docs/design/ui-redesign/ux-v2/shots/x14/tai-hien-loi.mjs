// Tái hiện lỗi "Không tìm thấy toà nhà" ở /toa-nha/3 trên app thật (chỉ đăng nhập + đọc). Chạy: MA_APP_URL=http://localhost:5324 node <file>
import { pathToFileURL } from 'node:url'
const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs'
const { Browser, sleep } = await import(pathToFileURL(CDP).href)
const BASE = process.env.MA_APP_URL
const SDT = { CHU: '0999000011', QUAN_LY: '0999000020' }
const fill = (sel, val) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(val)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const b = await Browser.launch({ width: 1024, height: 768 })
const doc = async (p) => (await p.eval(`document.body.innerText.includes('Không tìm thấy toà') ? 'KHONG-TIM-THAY' : document.querySelector('h1')?.textContent ?? '(không h1)'`))
async function dangNhap(p, vai) {
  await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
  await p.eval(fill('input[autocomplete="username"]', SDT[vai])); await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD))
  await p.eval(`document.querySelector('form button[type="submit"]').click()`)
  for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[data-navigation-layout], nav[aria-label]')`)); i++) await sleep(250)
}
try {
  const p = await b.newPage({ width: 1024, height: 768, dsf: 1 })
  await dangNhap(p, 'CHU')
  for (const luu of ['999', '1', 'abc', '']) {
    await p.eval(`localStorage.setItem('ma.toaNhaId', ${JSON.stringify(luu)}); 1`)
    await p.goto(`${BASE}/toa-nha/3`, { settleMs: 1500 })
    console.log('CHU, ma.toaNhaId=', JSON.stringify(luu), '→', await doc(p))
  }
  // đổi vai trong cùng trang (không tải lại): đăng xuất → đăng nhập QL → đi /toa-nha/3 bằng điều hướng trong app
  await p.eval(`document.querySelector('button[aria-label*="Đăng xuất"], button[aria-label*="đăng xuất"]')?.click(); 1`); await sleep(500)
  console.log('sau đăng xuất:', await p.eval('location.pathname'))
  await dangNhap(p, 'QUAN_LY')
  await p.eval(`history.pushState({}, '', '/toa-nha/3'); window.dispatchEvent(new PopStateEvent('popstate')); 1`); await sleep(1500)
  console.log('QL sau đổi vai, pushState /toa-nha/3 →', await doc(p))
  await p.goto(`${BASE}/toa-nha/3`, { settleMs: 1500 }); console.log('QL tải lại →', await doc(p))
} finally { await b.close() }
