// Chụp ảnh nghiệm thu từ APP THẬT (stack demo 5190 hoặc vite dev trỏ proxy về 5190) + đo QA bằng qa-probe.js.
// Chạy từ gốc repo:  node docs/design/ui-redesign/tools/app-shot.mjs <jobs.json> <thư_mục_ảnh>
//   jobs.json: [{ "name": "05-hop-dong-1440", "path": "/hop-dong?toaNhaId=3", "role": "CHU"|null, "w": 1440, "h": 900, "full": true }]
// Đăng nhập bằng form thật (POST /api/auth/login là lệnh ghi DUY NHẤT tool này gây ra; không bấm nút nghiệp vụ nào).
// Mật khẩu demo lấy từ biến môi trường MA_DEMO_PASSWORD (giá trị ghi ở đầu docker-compose.demo.yml); không ghi vào file.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const CDP = process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs'
const { Browser, sleep } = await import(pathToFileURL(CDP).href)
const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.MA_APP_URL || 'http://localhost:5190'
const SDT = { QTHT: '0999000001', CHU: '0999000011', QUAN_LY: '0999000020', THO: '0999000031', NGUOI_THUE: '0999100001' }

const [jobsFile, outDir] = process.argv.slice(2)
if (!jobsFile || !outDir) { console.error('Dùng: app-shot.mjs <jobs.json> <thư_mục_ảnh>'); process.exit(2) }
const jobs = JSON.parse(readFileSync(jobsFile, 'utf8'))
if (jobs.some((j) => j.role) && !process.env.MA_DEMO_PASSWORD) { console.error('Thiếu MA_DEMO_PASSWORD cho job cần đăng nhập'); process.exit(2) }
mkdirSync(outDir, { recursive: true })

// Gõ vào ô React: phải đi qua setter gốc rồi phát sự kiện input, gán .value trực tiếp React không thấy.
const fill = (sel, val) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(val)});
  el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`

const b = await Browser.launch({ width: 1440, height: 900 })
const ketQua = []
try {
  for (const j of jobs) {
    const p = await b.newPage({ width: j.w, height: j.h, mobile: j.w < 600, dsf: 1 })
    if (j.role) {
      await p.goto(`${BASE}/dang-nhap`, { settleMs: 800 })
      const ok = (await p.eval(fill('input[autocomplete="username"]', SDT[j.role]))) && (await p.eval(fill('input[autocomplete="current-password"]', process.env.MA_DEMO_PASSWORD)))
      if (!ok) throw new Error(`${j.name}: không thấy ô đăng nhập`)
      await p.eval(`document.querySelector('form button[type="submit"]').click()`)
      for (let i = 0; i < 40 && !(await p.eval(`!!document.querySelector('nav[data-navigation-layout], nav[aria-label]')`)); i++) await sleep(250)
    }
    await p.goto(`${BASE}${j.path}`, { settleMs: 1500 })
    await p.eval('document.fonts.ready.then(() => 1)')
    const qa = await p.eval(readFileSync(join(HERE, 'qa-probe.js'), 'utf8'))
    const png = join(outDir, `${j.name}.png`)
    await p.screenshot({ path: png, format: 'png', fullPage: !!j.full })
    ketQua.push({ name: j.name, path: j.path, role: j.role ?? null, w: j.w, png, qa })
    await p.close()
  }
} finally {
  await b.close()
}
writeFileSync(join(outDir, 'qa.json'), JSON.stringify(ketQua, null, 1))
for (const r of ketQua) console.log(r.name, JSON.stringify(r.qa).slice(0, 240))
