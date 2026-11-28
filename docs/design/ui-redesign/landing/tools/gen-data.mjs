// Sinh prototype/data.js từ API công khai thật (chỉ GET). Chạy: node tools/gen-data.mjs [http://localhost:5190]
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = process.argv[2] || 'http://localhost:5190';
const lay = async (p) => {
  const r = await fetch(goc + p);
  if (!r.ok) throw new Error(`${p} → HTTP ${r.status}`);
  return r.json();
};
const phong = await lay('/api/public/phong?chiPhongTrong=false');
// Toà TN-A/TN-B là dữ liệu test, không có phòng công khai nào: bỏ khỏi bản xem trước.
const coPhong = new Set(phong.map((p) => p.toaNhaId));
const toaNha = (await lay('/api/public/toa-nha')).filter((t) => coPhong.has(t.id));
if (toaNha.length !== 6 || phong.length < 12) throw new Error(`Dữ liệu lạ: ${toaNha.length} toà, ${phong.length} phòng`);

const ra = join(dirname(fileURLToPath(import.meta.url)), '../prototype/data.js');
writeFileSync(ra, `// Sinh bởi tools/gen-data.mjs từ ${goc} ngày ${new Date().toISOString().slice(0, 10)}. Đúng hình dạng JSON của backend, không sửa tay.\n// GET /api/public/toa-nha · GET /api/public/phong?chiPhongTrong=false\nwindow.MA_DATA = ${JSON.stringify({ toaNha, phong })};\n`);
console.log(`${toaNha.length} toà, ${phong.length} phòng, ${phong.filter((p) => p.trangThai === 'TRONG').length} trống → ${ra}`);
