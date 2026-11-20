/* Đo QA trong trang: cuộn ngang, vùng chạm, tên truy cập, cỡ chữ, font thật, ảnh thiếu alt. Trả JSON. */
(() => {
  const mobile = innerWidth < 600;
  const minHit = mobile ? 44 : 36, minText = mobile ? 13 : 12;
  const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute('placeholder') || '').trim();
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const ctrls = [...document.querySelectorAll(sel)].filter(vis);
  const small = [], noName = [];
  for (const el of ctrls) {
    // ô check/switch: vùng chạm là cả <label> bao quanh
    const hitEl = el.matches('input[type=checkbox], input[type=radio]') && el.closest('label') ? el.closest('label') : el;
    const r = hitEl.getBoundingClientRect();
    // liên kết nằm trong đoạn văn được miễn (WCAG 2.5.8 inline)
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
    if (!inline && (r.height < minHit - 0.5 || r.width < Math.min(minHit, 24) - 0.5)) small.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${label(el).slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    if (!label(el)) noName.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
  }
  // Tương phản thật: màu chữ tính toán so với nền đặc gần nhất (bỏ qua chữ nằm trên ảnh/gradient)
  const rgb = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none' || e.tagName === 'IMG') return null; const c = rgb(s.backgroundColor); if (c && (c[3] === undefined || c[3] >= 0.95)) return c; } return [255, 255, 255]; };
  const lowContrast = new Set(); let minRatio = 99, checked = 0;
  const tiny = new Set(), fonts = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = tw.nextNode())) {
    if (!t.nodeValue.trim()) continue;
    const p = t.parentElement; if (!p || !vis(p)) continue;
    const s = getComputedStyle(p);
    fonts.add(s.fontFamily.split(',')[0].replace(/["']/g, ''));
    // chữ trong SVG biểu đồ: cỡ hiệu dụng = font-size × hệ số scale của viewBox
    const sc = p.closest('svg') ? (p.getScreenCTM()?.a || 1) : 1;
    if (sc !== 1 && parseFloat(s.fontSize) * sc < minText - 0.05) { tiny.add(`svg ${(parseFloat(s.fontSize) * sc).toFixed(1)}px "${t.nodeValue.trim().slice(0, 20)}"`); continue; }
    const fg = rgb(s.color), bg = bgOf(p);
    if (fg && bg && !p.closest('[aria-disabled="true"], :disabled, .is-loading') && !(p.closest('svg') && !p.closest('svg.chart'))) {
      const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700);
      const r = ratio(fg.slice(0, 3), bg.slice(0, 3)) * 1; checked++; minRatio = Math.min(minRatio, r);
      if (r < (big ? 3 : 4.5) - 0.005) lowContrast.add(`${r.toFixed(2)} "${t.nodeValue.trim().slice(0, 20)}" ${s.color} / rgb(${bg.slice(0, 3)})`);
    }
    if (parseFloat(s.fontSize) < minText) tiny.add(`${parseFloat(s.fontSize)}px "${t.nodeValue.trim().slice(0, 20)}"`);
  }
  // chữ sinh bằng ::after (badge số đếm)
  for (const el of document.querySelectorAll('[data-count]')) { const f = parseFloat(getComputedStyle(el, '::after').fontSize); if (vis(el) && f < minText) tiny.add(`::after ${f}px "${el.dataset.count}"`); }
  return {
    viewport: `${innerWidth}×${innerHeight}`,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth - innerWidth : 0,
    controls: ctrls.length,
    belowHit: small,
    noAccessibleName: noName,
    textBelowFloor: [...tiny],
    contrast: { textNodesChecked: checked, minRatio: +minRatio.toFixed(2), below: [...lowContrast].slice(0, 12) },
    fontFamiliesUsed: [...fonts],
    fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`),
    imgNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
    focusOutline: (() => { const b = ctrls.find((e) => e.tagName === 'BUTTON' || e.tagName === 'A'); if (!b) return null; b.focus({ focusVisible: true }); const s = getComputedStyle(b); const o = `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`; b.blur(); return o; })(),
    docHeight: document.documentElement.scrollHeight,
  };
})()
