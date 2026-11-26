// Đo 8 font ứng viên trong Chrome thật và chụp ảnh specimen. Chạy: TASTE_CDP=<đường dẫn cdp.mjs> node tools/font-measure.mjs
import { pathToFileURL, fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
const { Browser } = await import(pathToFileURL(process.env.TASTE_CDP).href)
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..')
const b = await Browser.launch({ width: 1648, height: 1000 })
try {
  const p = await b.newPage({ width: 1648, height: 1000, dsf: 2 })
  await p.goto(pathToFileURL(join(V3, 'font-compare/index.html')).href, { settleMs: 800 })
  const m = await p.eval('window.measure()')
  writeFileSync(join(V3, 'font-compare/measure.json'), JSON.stringify(m, null, 1))
  console.table(m)
  await p.screenshot({ path: join(V3, 'font-compare/so-sanh-font.png'), format: 'png', fullPage: true })
} finally { await b.close() }
