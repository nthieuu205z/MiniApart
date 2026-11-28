/* Đo QA trong trang cho phần công khai. Trả JSON. Gọi: (probe)(W) với W = bề ngang khung đã cấu hình
   (ở chế độ giả lập điện thoại innerWidth nở theo nội dung tràn, nên phải so với W). */
(W) => {
  const dt = W < 900;
  const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const ten = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;
  const chu = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 28);

  // 1. cuộn ngang
  const trongKhungCuon = (e) => { for (let x = e.parentElement; x; x = x.parentElement) if (/auto|scroll|hidden/.test(getComputedStyle(x).overflowX)) return true; return false; };
  const tran = [...document.querySelectorAll('body *')].filter((e) => vis(e) && e.getBoundingClientRect().right > W + 1 && !e.closest('[hidden]') && !trongKhungCuon(e)).slice(0, 6).map((e) => `${ten(e)} right=${Math.round(e.getBoundingClientRect().right)}`);

  // 2. vùng chạm (miễn link nằm trong câu chữ, theo WCAG 2.5.8)
  const nho = [];
  for (const el of document.querySelectorAll('a[href], button, input, select, textarea, summary')) {
    if (!vis(el) || el.closest('[hidden]')) continue;
    const r = (el.matches('input,select,textarea') ? el : el).getBoundingClientRect();
    const trongCau = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
    if (!trongCau && (r.height < 43.5 || r.width < 43.5)) nho.push(`${ten(el)} "${chu(el)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
  }

  // 3. chữ: cỡ, font thật, tương phản trên nền đặc (chữ trên ảnh đo riêng bằng điểm ảnh trong shoot.mjs)
  const rgb = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const TREN_ANH = '.hero, .dn-phai, .dau.trong';
  const nenCua = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && (c[3] === undefined || c[3] >= 0.95)) return c; } return [255, 255, 255]; };
  const be = new Map(), fonts = new Set(), thap = new Set();
  let minRatio = 99, soChu = 0;
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = tw.nextNode())) {
    if (!t.nodeValue.trim()) continue;
    const p = t.parentElement; if (!p || !vis(p) || p.closest('[hidden], script, noscript')) continue;
    const s = getComputedStyle(p), fs = parseFloat(s.fontSize);
    fonts.add(s.fontFamily.split(',')[0].replace(/["']/g, ''));
    if (fs < 15.95) { const k = `${fs}px ${ten(p)}`; be.set(k, (be.get(k) || 0) + 1); }
    if (p.closest(TREN_ANH) || p.closest(':disabled')) continue;
    const fg = rgb(s.color), bg = nenCua(p);
    const r = ratio(fg.slice(0, 3), bg.slice(0, 3)); soChu++; minRatio = Math.min(minRatio, r);
    if (r < 4.5) thap.add(`${r.toFixed(2)} "${t.nodeValue.trim().slice(0, 20)}" ${ten(p)}`);
  }

  // 4. tiêu đề: số h1, chiều cao dòng, số dòng
  const td = [...document.querySelectorAll('h1, h2, h3')].filter(vis).map((h) => { const s = getComputedStyle(h); const fs = parseFloat(s.fontSize); const lh = parseFloat(s.lineHeight) / fs; return { the: h.tagName, chu: h.textContent.trim().slice(0, 30), fs: Math.round(fs), lh: +lh.toFixed(2), dong: Math.round(h.getBoundingClientRect().height / parseFloat(s.lineHeight)) }; });

  return {
    khung: W,
    cuonNgang: Math.max(0, document.documentElement.scrollWidth - W),
    tran,
    h1: document.querySelectorAll('h1').length,
    vungChamNho: nho,
    chuDuoi16: [...be].map(([k, n]) => `${k} ×${n}`),
    fonts: [...fonts],
    tuongPhan: { min: +minRatio.toFixed(2), soChu, duoi45: [...thap] },
    lhMin: Math.min(...td.map((x) => x.lh)),
    tieuDeNhieuDong: td.filter((x) => x.dong > 2).map((x) => `${x.the} ${x.dong} dòng "${x.chu}"`),
    anhThieuAlt: [...document.querySelectorAll('img:not([alt])')].length,
    anhHong: [...document.images].filter((i) => vis(i) && i.complete && !i.naturalWidth).map((i) => i.getAttribute('src')),
  };
}
