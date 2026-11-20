/* DOM → SVG thuần cho Figma: hình nền/viền là <rect>/<line>, chữ là <text> (không rasterize),
   icon/biểu đồ SVG giữ vector, ảnh là <image>. Chạy trong trang (Runtime.evaluate), trả về chuỗi SVG.
   Giới hạn có chủ đích (ghi trong figma/IMPORT.md): bỏ box-shadow, bỏ animation, pseudo-element chỉ dựng lại các trường hợp đã biết. */
(() => {
  const W = document.documentElement.clientWidth;
  const H = Math.max(document.documentElement.scrollHeight, innerHeight);
  const out = [], defs = [], late = [];
  let clipN = 0, gradN = 0;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const px = (v) => parseFloat(v) || 0;
  const n = (v) => Math.round(v * 100) / 100;
  function col(c) {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    const hex = '#' + p.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
    return { hex, a: Math.round(a * 1000) / 1000 };
  }
  const paint = (attr, c) => (c ? `${attr}="${c.hex}"${c.a < 1 ? ` ${attr}-opacity="${c.a}"` : ''}` : `${attr}="none"`);
  const fixedShift = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.position === 'fixed') { const r = e.getBoundingClientRect(); return r.bottom >= innerHeight - 1 && r.top > innerHeight / 2 ? H - innerHeight : 0; } // computed top luôn là px, nên nhận diện "dính đáy" bằng hình học
    }
    return 0;
  };
  const box = (el) => { const r = el.getBoundingClientRect(); const dy = fixedShift(el); return { x: r.left + scrollX, y: r.top + scrollY + dy, w: r.width, h: r.height, dy }; };
  const radius = (s, b) => { let r = s.borderTopLeftRadius; r = r.endsWith('%') ? (px(r) / 100) * b.w : px(r); return Math.min(r, b.w / 2, b.h / 2); };
  const visible = (el, s) => s.display !== 'none' && s.visibility !== 'hidden' && px(s.opacity) !== 0;
  const name = (el) => (el.getAttribute('aria-label') || el.id || el.className && String(el.className).split(' ')[0] || el.tagName.toLowerCase()).slice(0, 40);

  function rectFor(el, s, b) {
    const bg = col(s.backgroundColor);
    const bw = [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].map(px);
    const bc = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor];
    const bs = [s.borderTopStyle, s.borderRightStyle, s.borderBottomStyle, s.borderLeftStyle];
    const uniform = bw.every((w) => w === bw[0]) && bc.every((c) => c === bc[0]) && bs.every((x) => x === bs[0]) && bw[0] > 0 && bs[0] !== 'none';
    const r = radius(s, b);
    if (bg || uniform) {
      const st = uniform ? col(bc[0]) : null, w = uniform ? bw[0] : 0;
      out.push(`<rect data-name="${esc(name(el))}" x="${n(b.x + w / 2)}" y="${n(b.y + w / 2)}" width="${n(Math.max(0, b.w - w))}" height="${n(Math.max(0, b.h - w))}"${r ? ` rx="${n(Math.max(0, r - w / 2))}"` : ''} ${paint('fill', bg)}${st ? ` ${paint('stroke', st)} stroke-width="${w}"${bs[0] === 'dashed' ? ' stroke-dasharray="4 3"' : ''}` : ''}/>`);
    }
    if (!uniform) {
      const sides = [[b.x, b.y + bw[0] / 2, b.x + b.w, b.y + bw[0] / 2], [b.x + b.w - bw[1] / 2, b.y, b.x + b.w - bw[1] / 2, b.y + b.h], [b.x, b.y + b.h - bw[2] / 2, b.x + b.w, b.y + b.h - bw[2] / 2], [b.x + bw[3] / 2, b.y, b.x + bw[3] / 2, b.y + b.h]];
      sides.forEach((L, i) => { const c = col(bc[i]); if (bw[i] > 0 && bs[i] !== 'none' && c) out.push(`<line x1="${n(L[0])}" y1="${n(L[1])}" x2="${n(L[2])}" y2="${n(L[3])}" ${paint('stroke', c)} stroke-width="${bw[i]}"/>`); });
    }
  }
  function textAttrs(s, extra = '') {
    const c = col(s.color) || { hex: '#000000', a: 1 };
    const ls = s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing);
    return `font-family="Archivo" font-size="${px(s.fontSize)}" font-weight="${s.fontWeight}"${ls ? ` letter-spacing="${n(ls)}"` : ''} ${paint('fill', c)}${extra}`;
  }
  const base = (top, h, fs) => top + h / 2 + fs * 0.35; // đường chân chữ xấp xỉ cho Archivo
  function textNode(t, s, dy) {
    const raw = t.nodeValue; if (!raw.trim()) return;
    const tr = s.textTransform === 'uppercase' ? (x) => x.toLocaleUpperCase('vi') : (x) => x;
    const rg = document.createRange(), lines = [];
    const re = /\S+/g; let m;
    while ((m = re.exec(raw))) {
      rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length);
      const rs = rg.getClientRects(); if (!rs.length) continue;
      const r = rs[0], key = Math.round(r.top);
      let L = lines.find((l) => Math.abs(l.key - key) < 3);
      if (!L) lines.push(L = { key, x: r.left, top: r.top, h: r.height, a: m.index, z: m.index + m[0].length });
      L.x = Math.min(L.x, r.left); L.z = m.index + m[0].length;
    }
    const fs = px(s.fontSize);
    // SVG không có text-overflow: tự cắt chữ + "…" theo bề rộng thật của phần tử
    const pe = t.parentElement, cut = s.textOverflow === 'ellipsis' && pe.scrollWidth > pe.clientWidth + 1;
    if (cut) lines.splice(1);
    for (const L of lines) {
      let txt = tr(raw.slice(L.a, L.z).replace(/\s+/g, ' '));
      if (cut) {
        const ctx = (textNode.c ||= document.createElement('canvas').getContext('2d'));
        ctx.font = `${s.fontWeight} ${s.fontSize} Archivo`;
        const avail = pe.getBoundingClientRect().right - px(s.paddingRight) - L.x;
        while (txt && ctx.measureText(txt + '…').width > avail) txt = txt.slice(0, -1);
        txt = txt.trimEnd() + '…';
      }
      out.push(`<text x="${n(L.x + scrollX)}" y="${n(base(L.top + scrollY + dy, L.h, fs))}" ${textAttrs(s)} xml:space="preserve">${esc(txt)}</text>`);
    }
  }
  function controlText(el, s, b) {
    let txt = '', ph = false;
    if (el.tagName === 'SELECT') txt = el.options[el.selectedIndex]?.text || '';
    else if (el.type === 'checkbox' || el.type === 'radio') return checkbox(el, s, b);
    else { txt = el.value; if (!txt) { txt = el.placeholder || ''; ph = true; } }
    if (!txt) return;
    const fs = px(s.fontSize), x = b.x + px(s.paddingLeft) + px(s.borderLeftWidth);
    const st = ph ? getComputedStyle(el, '::placeholder') : s;
    out.push(`<text x="${n(x)}" y="${n(base(b.y, b.h, fs))}" ${textAttrs({ ...s, color: st.color, fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing })} xml:space="preserve">${esc(txt)}</text>`);
    if (el.tagName === 'SELECT' && s.backgroundImage !== 'none') out.push(`<path d="M${n(b.x + b.w - 26)} ${n(b.y + b.h / 2 - 2.5)}l5 5 5-5" fill="none" stroke="#57534E" stroke-width="1.6" stroke-linecap="round"/>`);
  }
  function checkbox(el, s, b) {
    if (el.closest('.switch')) {
      out.push(`<circle cx="${n(b.x + (el.checked ? b.w - 12 : 12))}" cy="${n(b.y + b.h / 2)}" r="9" fill="#FFFFFF"/>`);
    } else if (el.checked) {
      out.push(`<path d="M${n(b.x + 5)} ${n(b.y + 10)}l3.5 3.5 6.5-7" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
    } else if (el.indeterminate) {
      out.push(`<path d="M${n(b.x + 5)} ${n(b.y + b.h / 2)}h10" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`);
    }
  }
  function pseudo(el, b) {
    for (const p of ['::before', '::after']) {
      const s = getComputedStyle(el, p);
      if (s.content === 'none' || s.content === 'normal' || s.display === 'none') continue;
      const bg = col(s.backgroundColor);
      if (s.position === 'absolute' && bg) {
        const w = s.width !== 'auto' ? px(s.width) : b.w - px(s.left) - px(s.right);
        const h = s.height !== 'auto' ? px(s.height) : b.h - px(s.top) - px(s.bottom);
        const x = s.left !== 'auto' ? b.x + px(s.left) : b.x + b.w - px(s.right) - w;
        const y = s.top !== 'auto' ? b.y + px(s.top) : b.y + b.h - px(s.bottom) - h;
        if (w <= 0 || h <= 0) continue;
        const r = Math.min(px(s.borderTopLeftRadius), w / 2, h / 2);
        out.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r ? ` rx="${n(r)}"` : ''} ${paint('fill', bg)}/>`);
        const label = /attr\(/.test(s.content) ? el.dataset.count : s.content.replace(/^"|"$/g, ''); // Chrome mới trả về chuỗi đã thay attr()
        if (label) out.push(`<text x="${n(x + w / 2)}" y="${n(base(y, h, px(s.fontSize)))}" text-anchor="middle" ${textAttrs(s)}>${esc(label)}</text>`);
      }
    }
  }
  const SVG_ATTR = ['d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'text-anchor', 'transform', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits'];
  function svgEl(svg, b) {
    let vb = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal : null;
    const color = getComputedStyle(svg).color;
    const kids = [];
    const walk = (node, depth) => {
      let s = '';
      for (const c of node.children) {
        const tag = c.tagName.toLowerCase();
        if (tag === 'defs') { for (const g of c.children) { const id = g.id; const cl = g.cloneNode(true); cl.id = id; defs.push(cl.outerHTML); } continue; }
        if (tag === 'use') {
          const sym = document.querySelector(c.getAttribute('href'));
          if (!sym) continue;
          if (!vb && sym.viewBox.baseVal.width) vb = sym.viewBox.baseVal;
          const stroke = sym.getAttribute('stroke') === 'currentColor' ? col(color) : null;
          s += `<g fill="none" ${paint('stroke', stroke)} stroke-width="${sym.getAttribute('stroke-width')}" stroke-linecap="round" stroke-linejoin="round">${sym.innerHTML}</g>`;
          continue;
        }
        const cs = getComputedStyle(c);
        let a = SVG_ATTR.filter((k) => c.hasAttribute(k)).map((k) => `${k}="${esc(c.getAttribute(k))}"`).join(' ');
        if (['path', 'line', 'rect', 'circle', 'polyline', 'polygon', 'ellipse', 'text'].includes(tag)) {
          const f = c.getAttribute('fill') || '';
          a += f.startsWith('url(') ? ` fill="${f}"` : ` ${paint('fill', col(cs.fill))}`;
          const sk = col(cs.stroke);
          if (sk) a += ` ${paint('stroke', sk)} stroke-width="${px(cs.strokeWidth)}"${cs.strokeDasharray !== 'none' ? ` stroke-dasharray="${cs.strokeDasharray.replace(/px/g, '').replace(/,/g, ' ')}"` : ''}${cs.strokeLinecap !== 'butt' ? ` stroke-linecap="${cs.strokeLinecap}"` : ''}${cs.strokeLinejoin !== 'miter' ? ` stroke-linejoin="${cs.strokeLinejoin}"` : ''}`;
          if (px(cs.opacity) < 1) a += ` opacity="${cs.opacity}"`;
        }
        if (tag === 'text') { s += `<text ${a} font-family="Archivo" font-size="${px(cs.fontSize)}" font-weight="${cs.fontWeight}">${esc(c.textContent)}</text>`; continue; }
        s += c.children.length && tag !== 'text' ? `<${tag} ${a}>${walk(c, depth + 1)}</${tag}>` : `<${tag} ${a}/>`;
      }
      return s;
    };
    const inner = walk(svg, 0);
    vb = vb || { x: 0, y: 0, width: b.w, height: b.h };
    const sc = Math.min(b.w / vb.width, b.h / vb.height);
    const ox = b.x + (b.w - vb.width * sc) / 2 - vb.x * sc, oy = b.y + (b.h - vb.height * sc) / 2 - vb.y * sc;
    out.push(`<g data-name="${esc(svg.getAttribute('aria-label') || 'icon')}" transform="translate(${n(ox)} ${n(oy)}) scale(${n(sc * 1000) / 1000})">${inner}</g>`);
  }
  function image(el, s, b) {
    const r = radius(s, b); let clip = '';
    if (r) { const id = 'c' + (++clipN); defs.push(`<clipPath id="${id}"><rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" rx="${n(r)}"/></clipPath>`); clip = ` clip-path="url(#${id})"`; }
    out.push(`<image data-name="${esc(el.alt || 'ảnh')}" href="${esc(el.getAttribute('src'))}" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" preserveAspectRatio="xMidYMid slice"${clip}/>`);
  }
  function visit(el) {
    const s = getComputedStyle(el);
    if (!visible(el, s)) return;
    const b = box(el);
    if (el.classList.contains('sr-only') || (b.w <= 1 && b.h <= 1)) return; // chỉ dành cho trình đọc màn hình
    if (el.tagName === 'svg' || el instanceof SVGSVGElement) { if (b.w > 0 && b.h > 0) {
      rectFor(el, s, b);
      const l = px(s.paddingLeft) + px(s.borderLeftWidth), t = px(s.paddingTop) + px(s.borderTopWidth); // nội dung vẽ trong content-box
      svgEl(el, { ...b, x: b.x + l, y: b.y + t, w: b.w - l - px(s.paddingRight) - px(s.borderRightWidth), h: b.h - t - px(s.paddingBottom) - px(s.borderBottomWidth) });
    } return; }
    if (b.w === 0 && b.h === 0 && s.overflow !== 'visible') return;
    rectFor(el, s, b);
    if (el.tagName === 'IMG') { image(el, s, b); return; }
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) { controlText(el, s, b); pseudo(el, b); return; }
    // Phần tử absolute (icon trong ô tìm kiếm, badge…) vẽ sau để nằm trên anh em trong luồng, như trình duyệt
    const abs = (c) => c.nodeType === 1 && /absolute|fixed/.test(getComputedStyle(c).position);
    const kids = [...el.childNodes];
    for (const c of [...kids.filter((k) => !abs(k)), ...kids.filter(abs)]) {
      if (c.nodeType === 3) textNode(c, s, b.dy);
      else if (abs(c) && getComputedStyle(c).zIndex !== 'auto') late.push(c); // menu, bottom-nav: vẽ trên cùng cả trang
      else if (c.nodeType === 1) visit(c);
    }
    pseudo(el, b);
  }
  const bs = getComputedStyle(document.body);
  out.push(`<rect data-name="nền trang" x="0" y="0" width="${W}" height="${H}" ${paint('fill', col(bs.backgroundColor) || { hex: '#FFFFFF', a: 1 })}/>`);
  for (const c of document.body.children) if (c.tagName !== 'SCRIPT') visit(c);
  for (let i = 0; i < late.length; i++) visit(late[i]); // late có thể dài thêm khi visit
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<title>${esc(document.title)}</title>\n<defs>${defs.join('')}</defs>\n${out.join('\n')}\n</svg>\n`;
})()
