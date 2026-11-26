// Bấm thử tự động: đi mọi màn trong DS và mọi liên kết #/ trên đó; báo lỗi JS, màn trắng, màn "chưa vẽ". Chạy từ thư mục v3.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const { Browser } = await import(pathToFileURL(process.env.TASTE_CDP).href)
const URL0 = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../prototype/index.html')).href
const b = await Browser.launch({ width: 1440, height: 900 }), p = await b.newPage({ width: 1440, height: 900 })
await p.goto(URL0, { settleMs: 400 })
await p.eval(`window.__loi = []; addEventListener('error', (e) => __loi.push(location.hash + ' :: ' + e.message)); 1`)
const di = (h) => p.eval(`(async () => { location.hash = ${JSON.stringify(h)}; await new Promise((r) => setTimeout(r, 30)); try { ve() } catch (e) { __loi.push(location.hash + ' :: ' + e.message) }
  return { chu: document.querySelector('#goc').innerText.length, chuaVe: !!document.querySelector('[data-chua-ve]') || /Chưa vẽ|chưa vẽ|Chưa có màn này/.test(document.querySelector('#goc').innerText), link: [...new Set([...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href')))] } })()`)
const DS = (await p.eval('window.DS')).map((x) => '#/' + x[0]), xong = new Map(), hang = [...DS]
while (hang.length && xong.size < 2500) { const h = hang.shift(); if (xong.has(h)) continue; const r = await di(h); xong.set(h, r); for (const l of r.link) if (!xong.has(l)) hang.push(l) }
const loi = await p.eval('__loi'); await b.close()
const trang = [...xong].filter(([, r]) => r.chu < 40).map(([h]) => h), chuaVe = [...new Set([...xong].filter(([, r]) => r.chuaVe).map(([h]) => h.split('?')[0]))]
console.log(`đã đi ${xong.size} địa chỉ; lỗi JS: ${loi.length}; màn trắng: ${trang.length}; màn chưa vẽ (có ghi rõ): ${chuaVe.length}`)
if (loi.length) console.log([...new Set(loi)].slice(0, 15).join('\n')); if (trang.length) console.log('trắng:', trang.slice(0, 10)); console.log('chưa vẽ:', chuaVe.join(' '))
process.exit(loi.length || trang.length ? 1 : 0)
