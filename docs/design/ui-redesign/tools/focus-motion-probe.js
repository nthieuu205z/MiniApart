/* Đo focus + chuyển động trong trang. Trả JSON.
   - focus: focus từng control (focusVisible) → đếm control không có outline/box-shadow thấy được.
   - motion: liệt kê animation đang chạy và transition > 120ms (khi bật reduced-motion phải rỗng; có transform trong transition cũng tính). */
(() => {
  const sel = 'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; };
  const ctrls = [...document.querySelectorAll(sel)].filter(vis);
  const noRing = [];
  for (const el of ctrls) {
    el.focus({ focusVisible: true });
    if (document.activeElement !== el) { noRing.push(`không focus được: ${el.tagName} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 20)}"`); continue; }
    // ô check/switch: vòng focus vẽ trên chính input
    const s = getComputedStyle(el);
    const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || (s.boxShadow !== 'none' && /\d+px \d+px 0px [2-9]px|0px 0px 0px [2-9]px/.test(s.boxShadow));
    if (!ring) noRing.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${(el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 20)}"`);
    el.blur();
  }
  const ms = (v) => Math.max(...v.split(',').map((x) => (x.includes('ms') ? parseFloat(x) : parseFloat(x) * 1000)));
  const anim = [], slow = [];
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.animationName !== 'none' && ms(s.animationDuration) > 0 && s.animationPlayState === 'running' && vis(el)) anim.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${s.animationName} ${s.animationDuration}`);
    if (s.transitionProperty !== 'none' && ms(s.transitionDuration) > 120) slow.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${s.transitionProperty} ${s.transitionDuration}`);
  }
  return { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, focusables: ctrls.length, noFocusRing: noRing, runningAnimations: [...new Set(anim)], transitionsOver120ms: [...new Set(slow)].slice(0, 12), slowCount: new Set(slow).size };
})()
