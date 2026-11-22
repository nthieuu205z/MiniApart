// Tự kiểm tương tác của prototype (không cần máy chủ): redirect đường dẫn cũ, Ctrl+K lọc, chọn toà nhớ, điều hướng menu, đổi vai trò.
// Chạy: node tools/interact-check.mjs  → in OK/FAIL từng mục, exit 1 nếu có FAIL.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
const { Browser, sleep } = await import(pathToFileURL(process.env.TASTE_CDP || 'C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs').href);
const page = pathToFileURL(join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'prototype/index.html')).href;
const b = await Browser.launch({ width: 1440, height: 900 });
let fail = 0;
const ok = (name, cond, got) => { console.log(cond ? 'OK  ' : 'FAIL', name, cond ? '' : JSON.stringify(got)); if (!cond) fail++; };
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.goto(page + '#/CHU/hom-nay', { settleMs: 500 });
  await p.eval('localStorage.clear(); 1');
  const nav = async (h) => { await p.eval(`location.hash = ${JSON.stringify(h)}; 1`); await sleep(250); };
  await nav('/hoa-don');
  ok('đường dẫn cũ /hoa-don → Thu tiền tab Hoá đơn', (await p.eval('location.hash')) === '#/CHU/tien?tab=hoa-don', await p.eval('location.hash'));
  await nav('/ghi-chi-so');
  ok('đường dẫn cũ /ghi-chi-so → Chu kỳ tháng', (await p.eval('location.hash')) === '#/CHU/chu-ky', await p.eval('location.hash'));
  await nav('/CHU/hom-nay');
  await p.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })); 1`); await sleep(250);
  ok('Ctrl+K mở bảng lệnh', await p.eval(`!!document.querySelector('.cmdk')`), null);
  await p.eval(`(() => { const i = document.getElementById('kq'); i.value = 'quang huy'; i.dispatchEvent(new Event('input')); return 1 })()`); await sleep(100);
  const hits = await p.eval(`[...document.querySelectorAll('#kres .cmdk-i .t')].map(e => e.textContent)`);
  ok('gõ "quang huy" (không dấu) ra Nguyễn Quang Huy', hits.some((t) => t.includes('Nguyễn Quang Huy')), hits);
  await p.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); 1`); await sleep(250);
  ok('Esc đóng bảng lệnh', !(await p.eval(`!!document.querySelector('.cmdk')`)), null);
  await p.eval(`document.querySelector('.sb-toa').click(); 1`); await sleep(250);
  await p.eval(`[...document.querySelectorAll('[data-toa]')].find(a => a.dataset.toa === 'Mộc Lan Home').click(); 1`); await sleep(300);
  ok('chọn toà Mộc Lan hiện ở khung', (await p.eval(`document.querySelector('.sb-toa .t1').textContent`)) === 'Mộc Lan Home', await p.eval(`document.querySelector('.sb-toa .t1').textContent`));
  await nav('/CHU/tien');
  const people = await p.eval(`document.querySelector('.tab[aria-selected="true"] .n').textContent`);
  ok('toà được nhớ khi sang Thu tiền (chỉ người của Mộc Lan)', people === '5 người', people);
  await p.eval(`localStorage.removeItem('ma.toa'); 1`);
  await p.eval(`document.querySelector('.nav-item[href$="/su-co"]').click(); 1`); await sleep(250);
  ok('bấm menu Sự cố đổi màn', (await p.eval('location.hash')).startsWith('#/CHU/su-co') && (await p.eval(`document.querySelector('h1').textContent`)) === 'Sự cố', await p.eval('location.hash'));
  await nav('/CHU/tien');
  await p.eval(`document.querySelector('.gtable tr.grp a.td-person').click(); 1`); await sleep(250);
  ok('bấm hàng người nợ mở hồ sơ 360°', (await p.eval('location.hash')).startsWith('#/CHU/nguoi-thue/'), await p.eval('location.hash'));
  await p.eval(`document.querySelector('[data-act="role"]').click(); 1`); await sleep(250);
  await p.eval(`document.querySelector('.pop a[href="#/THO/viec"]').click(); 1`); await sleep(300);
  ok('đổi vai trò sang Thợ ra màn điện thoại', await p.eval(`!!document.querySelector('.bottom-nav') && document.querySelector('.h-title').textContent.startsWith('Việc của tôi')`), null);
  await nav('/CHU/phong');
  ok('CHU mở /phong (route của Quản lý) ra trang Không có quyền', (await p.eval(`document.querySelector('h1')?.textContent || ''`)) === 'Trang này dành cho vai trò khác', await p.eval(`document.querySelector('h1')?.textContent`));
} finally { await b.close(); }
process.exit(fail ? 1 : 0);
