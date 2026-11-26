// Chụp mọi màn của prototype V3 (file://, không cần server) ở 1440 và 390, đồng thời đo QA theo ngưỡng của BRIEF.
// Chạy từ thư mục v3:  TASTE_CDP=<đường dẫn cdp.mjs của taste-skill> node tools/shoot.mjs [lọc]
import { pathToFileURL, fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
const { Browser } = await import(pathToFileURL(process.env.TASTE_CDP).href)
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(V3, 'screens/png'); mkdirSync(OUT, { recursive: true })
const URL0 = pathToFileURL(join(V3, 'prototype/index.html')).href + '?shot'
const loc = process.argv[2]

// Đo trong trang. Ngưỡng: vùng chạm 44 (≤760px) / 36; chữ ≥13px, riêng Người thuê/Thợ ≥16px; tương phản ≥4,5; ≤1 nút chính.
const PROBE = `(() => {
  const hep = innerWidth <= 760, thoang = !!document.querySelector('.d-thoang'), sanChu = thoang ? 16 : 13, sanCham = hep || thoang ? 44 : 36
  const hien = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return .2126 * r + .7152 * g + .0722 * b }
  const rgb = (s) => (s.match(/[\\d.]+/g) || []).map(Number)
  const nen = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length && (c[3] === undefined || c[3] > .5)) return c } return [255, 255, 255] }
  const lop = document.querySelector('#lop').children.length ? document.querySelector('#lop') : document.querySelector('#goc')
  const cham = [...lop.querySelectorAll('a,button,input,select,textarea,[tabindex]')].filter(hien).filter((el) => getComputedStyle(el).display !== 'inline' && !el.disabled).map((el) => {
    const hop = el.type === 'checkbox' ? (el.closest('label') || el) : el, r = hop.getBoundingClientRect(); return { el, w: Math.round(r.width), h: Math.round(r.height) } })
  const nho = cham.filter((c) => c.h < sanCham || c.w < Math.min(sanCham, 36)).map((c) => (c.el.className || c.el.tagName) + ' ' + c.w + 'x' + c.h + ' "' + (c.el.textContent || c.el.getAttribute('aria-label') || '').trim().slice(0, 24) + '"')
  const chuNho = [], tuongPhan = []; let soChu = 0, minTp = 99
  const w = document.createTreeWalker(document.querySelector('#goc').parentElement, NodeFilter.SHOW_TEXT)
  for (let n; (n = w.nextNode());) { const t = n.textContent.trim(), el = n.parentElement; if (!t || !hien(el) || el.closest('.pbar,script,noscript,option,[hidden]')) continue
    const s = getComputedStyle(el), fs = parseFloat(s.fontSize); soChu++
    if (fs < sanChu && !el.closest('.mau')) chuNho.push(fs + 'px "' + t.slice(0, 24) + '"')
    const a = lum(rgb(s.color)), b = lum(nen(el)), tp = (Math.max(a, b) + .05) / (Math.min(a, b) + .05); if (tp < minTp) minTp = tp
    if (tp < 4.5) tuongPhan.push(tp.toFixed(2) + ' "' + t.slice(0, 24) + '"') }
  return { rong: innerWidth, cao: document.documentElement.scrollHeight, tranNgang: Math.max(0, document.documentElement.scrollWidth - innerWidth), soVungCham: cham.length, vungChamNho: nho, soChu, chuNho, tuongPhanThap: tuongPhan, tuongPhanMin: +minTp.toFixed(2),
    nutChinh: [...lop.querySelectorAll('.nut.chinh')].filter(hien).length, h1: document.querySelectorAll('h1').length, font: document.fonts.check('600 15px "IBM Plex Sans"', 'Ễ₫0') }
})()`

const b = await Browser.launch({ width: 1440, height: 900 })
const kq = []
try {
  const p0 = await b.newPage({ width: 1440, height: 900 }); await p0.goto(URL0, { settleMs: 400 })
  const DS = await p0.eval('window.DS'); await p0.close()
  let i = 0
  for (const [duong, ten, kieu] of DS) {
    i++
    const slug = String(i).padStart(2, '0') + '-' + duong.replace(/\?mo=/, '-').replace(/[&?=].*$/, '').replace(/\//g, '-')
    if (loc && !slug.includes(loc)) continue
    for (const w of kieu === 1 ? [1440] : kieu === 2 ? [1440, 390] : [390]) {
      const p = await b.newPage({ width: w, height: w === 390 ? 844 : 900, mobile: w === 390, dsf: w === 390 ? 2 : 1 })
      const loi = []
      await p.goto(`${URL0}#/${duong}`, { settleMs: 500 })
      await p.eval('document.fonts.ready.then(() => 1)')
      const qa = await p.eval(PROBE)
      const png = join(OUT, `${slug}-${w}.png`)
      if (!duong.includes('mo=')) await p.setViewport({ width: w, height: Math.max(qa.cao, w === 390 ? 844 : 900), mobile: w === 390, dsf: w === 390 ? 2 : 1 }) // kéo dài khung nhìn để thanh dính đáy nằm đúng đáy ảnh
      await p.screenshot({ path: png, format: 'png' })
      kq.push({ man: ten, file: `${slug}-${w}.png`, ...qa, loi })
      const xau = [qa.tranNgang && 'tràn ngang ' + qa.tranNgang, qa.vungChamNho.length && 'chạm nhỏ ' + qa.vungChamNho.length, qa.chuNho.length && 'chữ nhỏ ' + qa.chuNho.length, qa.tuongPhanThap.length && 'tương phản ' + qa.tuongPhanThap.length, qa.nutChinh > 1 && 'nút chính ' + qa.nutChinh, qa.h1 !== 1 && 'h1=' + qa.h1, !qa.font && 'font chưa nạp'].filter(Boolean)
      console.log(`${slug}-${w}`.padEnd(34), String(qa.cao).padStart(5), xau.length ? 'LỖI: ' + xau.join('; ') : 'đạt')
      await p.close()
    }
  }
} finally { await b.close() }
if (!loc) writeFileSync(join(V3, 'screens/qa.json'), JSON.stringify(kq, null, 1))
const hong = kq.filter((r) => r.tranNgang || r.vungChamNho.length || r.chuNho.length || r.tuongPhanThap.length || r.nutChinh > 1 || r.h1 !== 1 || !r.font)
for (const r of hong) console.log('\n' + r.file, JSON.stringify({ cham: r.vungChamNho.slice(0, 6), chu: r.chuNho.slice(0, 6), tp: r.tuongPhanThap.slice(0, 6), nutChinh: r.nutChinh, h1: r.h1 }))
console.log(`\n${kq.length} ảnh, ${hong.length} ảnh còn lỗi đo`)
