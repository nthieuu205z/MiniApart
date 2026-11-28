// Chụp và đo bản xem trước. Chạy từ thư mục landing/:
//   TASTE_CDP=<đường dẫn cdp.mjs của skill taste> node tools/shoot.mjs [lọc-tên]
// Ra: screens/*.png và screens/qa.json. Chỉ ghi trong landing/.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const GOC = join(HERE, '..');
const CDP = process.env.TASTE_CDP || join(homedir(), '.hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs');
const { Browser } = await import(pathToFileURL(CDP).href);
const TRANG = pathToFileURL(join(GOC, 'prototype/index.html')).href;
const PROBE = readFileSync(join(HERE, 'qa-probe.js'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/, '');
const RA = join(GOC, 'screens');
mkdirSync(RA, { recursive: true });

const DIEN = `(() => { const f = document.querySelector('#dat-lich'); f.hoTen.value = 'Nguyễn Văn An'; f.soDienThoai.value = '0912345678'; f.thoiGianHen.value = '2026-11-30T09:30'; })()`;
const GUI = `document.querySelector('#dat-lich').requestSubmit()`;
const TOI = (sel) => `document.querySelector('${sel}').scrollIntoView({ block: 'start' }); scrollBy(0, -80)`;
// full: cả trang · do: chạy JS trước khi chụp · qa: đo · anh: đo tương phản chữ trên ảnh (danh sách selector)
const VIEC = [
  { ten: '01-trang-chu', hash: '#/', full: true, qa: true, anh: ['.hero h1', '.hero-phu', '.dau.trong .logo', '.dau.trong .dau-nav a', '.dau.trong .dau-cong', '.dau.trong .dau-menu'] },
  { ten: '01-trang-chu-man-dau', hash: '#/' },
  { ten: '01-trang-chu-cuon', hash: '#/', do: [TOI('#toa-nha')], chi: [1440] },
  { ten: '02-tim-phong', hash: '#/tim-phong', full: true, qa: true },
  { ten: '02-tim-phong-khong-khop', hash: '#/tim-phong?gia=DUOI_3_5', qa: true },
  { ten: '02-tim-phong-ca-phong-dang-thue', hash: '#/tim-phong?toa=3&tatca=1', full: true, chi: [1440] },
  { ten: '02-tim-phong-dang-tai', hash: '#/tim-phong?tt=tai', chi: [390] },
  { ten: '02-tim-phong-loi', hash: '#/tim-phong?tt=loi', chi: [390] },
  { ten: '03-chi-tiet-phong', hash: '#/phong/10', full: true, qa: true },
  { ten: '03-chi-tiet-phong-da-gui', hash: '#/phong/10', do: [DIEN, GUI, TOI('.ct-ben')], qa: true },
  { ten: '03-chi-tiet-phong-loi-form', hash: '#/phong/10', do: [GUI, TOI('#dat-lich')], chi: [390] },
  { ten: '03-chi-tiet-phong-dang-thue', hash: '#/phong/1', chi: [1440] },
  { ten: '03-chi-tiet-phong-bac-thang', hash: '#/phong/70', do: [TOI('#uoc-tinh')], chi: [390] },
  { ten: '04-dang-nhap', hash: '#/dang-nhap', full: true, qa: true, anh: ['.dn-vai h2', '.dn-vai li'] },
  { ten: '05-menu', hash: '#/', do: [`document.querySelector('#mo-menu').click()`], chi: [390], qa: true },
];
const KHUNG = [[1440, 900], [1024, 768], [390, 844]];
const loc = process.argv[2];

// Tương phản chữ trắng trên ảnh: ẩn chữ, chụp, lấy điểm sáng nhất từng kênh trong ô chữ (cận trên của độ sáng nền).
function doTrenAnh(png, o) {
  const [r, g, b] = execFileSync('magick', [png, '-crop', `${o.w}x${o.h}+${o.x}+${o.y}`, '+repage', '-format', '%[fx:maxima.r] %[fx:maxima.g] %[fx:maxima.b]', 'info:']).toString().trim().split(' ').map(Number);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return +(1.05 / (0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) + 0.05)).toFixed(2);
}

const b = await Browser.launch({ width: 1440, height: 900 });
const qa = [];
try {
  for (const v of VIEC) {
    if (loc && !v.ten.includes(loc)) continue;
    for (const [w, h] of KHUNG) {
      if (v.chi && !v.chi.includes(w)) continue;
      if (!v.chi && w === 1024 && !v.full) continue; // 1024 chỉ chụp cả trang của 4 màn chính
      const p = await b.newPage({ width: w, height: h, mobile: w < 600, dsf: 1, reducedMotion: true });
      await p.goto(TRANG + v.hash, { settleMs: 400 });
      await p.eval('document.fonts.ready.then(() => 1)');
      for (const js of v.do || []) { await p.eval(js); await new Promise((r) => setTimeout(r, 250)); }
      const png = join(RA, `${v.ten}-${w}.png`);
      const r = { man: v.ten, khung: w, loiConsole: p.consoleErrors };
      if (v.qa) Object.assign(r, await p.eval(`(${PROBE})(${w})`));
      if (v.anh) {
        const o = await p.eval(`(() => { const ds = [${v.anh.map((s) => JSON.stringify(s)).join(',')}].flatMap((s) => [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.bottom <= innerHeight; }).map((e) => { const r = e.getBoundingClientRect(); e.style.color = 'transparent'; return { s, x: Math.max(0, Math.floor(r.x)), y: Math.max(0, Math.floor(r.y)), w: Math.ceil(r.width), h: Math.ceil(r.height) }; })); return ds; })()`);
        const tam = join(RA, `.tam-${w}.png`);
        await p.screenshot({ path: tam, format: 'png' });
        r.chuTrenAnh = o.map((x) => `${x.s} ${doTrenAnh(tam, x)}`);
        execFileSync('rm', [tam]);
        await p.eval(`document.querySelectorAll('[style*="transparent"]').forEach((e) => { e.style.color = ''; })`);
      }
      await p.screenshot({ path: png, format: 'png', fullPage: !!v.full });
      qa.push(r);
      console.log(`${v.ten}-${w}`, r.loiConsole.length ? `LỖI JS: ${r.loiConsole.join(' | ')}` : 'ok');
      await p.close();
    }
  }
} finally {
  await b.close();
}
if (!loc) writeFileSync(join(RA, 'qa.json'), JSON.stringify(qa, null, 1));
// Tóm tắt: chỉ in chỗ cần nhìn.
for (const r of qa.filter((x) => 'cuonNgang' in x)) console.log(`${r.man}-${r.khung}: cuộn ngang ${r.cuonNgang} · h1 ${r.h1} · chạm<44 ${r.vungChamNho.length} · chữ<16 [${r.chuDuoi16.join('; ')}] · tương phản min ${r.tuongPhan.min} (${r.tuongPhan.duoi45.length} dưới 4,5) · lh min ${r.lhMin}${r.chuTrenAnh ? ` · trên ảnh [${r.chuTrenAnh.join('; ')}]` : ''}${r.anhHong.length ? ` · ẢNH HỎNG ${r.anhHong}` : ''}${r.tran.length ? ` · TRÀN ${r.tran}` : ''}`);
