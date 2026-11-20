/* Dựng sidebar / bottom-nav theo vai trò, bám đúng frontend/src/roleNavigation.ts
   (cùng đường dẫn, cùng nhãn). Chỉ thêm nhóm + icon. Dùng:
   <aside class="sidebar" data-role="CHU" data-active="/tong-quan" data-user="Nguyễn Hoàng Phúc|Chủ sở hữu"></aside>
   <nav class="bottom-nav" data-role="THO" data-active="/viec-cua-toi"></nav> */
(function () {
  const G = (label, items) => ({ label, items });
  const M = (duongDan, nhan, icon, extra = {}) => ({ duongDan, nhan, icon, ...extra });
  const NAV = {
    CHU: [
      G(null, [M('/tong-quan', 'Tổng quan', 'dashboard')]),
      G('Vận hành', [M('/toa-nha', 'Toà nhà', 'building'), M('/nguoi-thue', 'Người thuê', 'users'), M('/hop-dong', 'Hợp đồng', 'contract'),
        M('/cu-tru', 'Cư trú', 'home'), M('/lich-hen', 'Lịch hẹn', 'calendar'), M('/su-co', 'Sự cố', 'wrench', { count: 12 }), M('/an-toan', 'An toàn', 'shield')]),
      G('Tiền', [M('/dich-vu', 'Dịch vụ và kỳ', 'layers'), M('/ghi-chi-so', 'Ghi chỉ số', 'meter'), M('/hoa-don', 'Hoá đơn', 'receipt'),
        M('/thu-tien', 'Thu tiền', 'wallet'), M('/cong-no', 'Công nợ', 'debt')]),
      G('Theo dõi', [M('/bao-cao', 'Báo cáo', 'chart', { sub: [M('/bao-cao/tieu-thu', 'Tiêu thụ điện nước'), M('/bao-cao/chi-phi-bao-tri', 'Chi phí bảo trì')] }),
        M('/nhat-ky-thao-tac', 'Nhật ký thao tác', 'history')]),
    ],
    QUAN_LY: [
      G('Hằng ngày', [M('/nhac-viec', 'Nhắc việc', 'dashboard', { count: 4 }), M('/ghi-chi-so', 'Ghi chỉ số', 'meter'), M('/lich-hen', 'Lịch hẹn', 'calendar'), M('/su-co', 'Sự cố', 'wrench')]),
      G('Tiền', [M('/hoa-don', 'Hoá đơn', 'receipt'), M('/thu-tien', 'Thu tiền', 'wallet'), M('/dich-vu', 'Dịch vụ và kỳ', 'layers')]),
      G('Toà nhà', [M('/phong', 'Phòng', 'door'), M('/hop-dong', 'Hợp đồng', 'contract'), M('/nguoi-thue', 'Người thuê', 'users'),
        M('/cu-tru', 'Cư trú', 'home'), M('/an-toan', 'An toàn', 'shield'), M('/thong-bao', 'Thông báo', 'megaphone')]),
    ],
    QTHT: [
      G('Quản trị', [M('/tai-khoan', 'Tài khoản', 'key'), M('/toa-nha', 'Toà nhà', 'building')]),
      G('Theo dõi', [M('/nhat-ky-thao-tac', 'Nhật ký thao tác', 'history')]),
    ],
    THO: [G(null, [M('/tho/tong-quan', 'Tổng quan', 'dashboard'), M('/viec-cua-toi', 'Công việc', 'wrench', { count: 6 }),
      M('/tho/chi-phi', 'Báo giá & thanh toán', 'wallet', { short: 'Báo giá' }), M('/thong-bao', 'Thông báo', 'bell', { count: 9 })])],
    NGUOI_THUE: [G(null, [M('/hoa-don-cua-toi', 'Hoá đơn của tôi', 'receipt', { short: 'Hoá đơn' }), M('/lich-su', 'Lịch sử', 'history'),
      M('/tieu-thu', 'Tiêu thụ', 'bolt'), M('/hop-dong', 'Hợp đồng', 'contract'), M('/bao-hong', 'Báo hỏng', 'wrench')])],
  };
  const SCOPE = { CHU: 'Chủ sở hữu · 3 toà', QUAN_LY: 'Quản lý · An Nhiên Residence', QTHT: 'Quản trị hệ thống', THO: 'Thợ sửa chữa', NGUOI_THUE: 'Người thuê · Phòng 101' };
  const ic = (n, c = 'ic') => `<svg class="${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const initials = (name) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

  function sidebar(el) {
    const role = el.dataset.role, active = el.dataset.active, [uName, uRole] = (el.dataset.user || '|').split('|');
    let h = `<div class="sb-brand"><div class="logo" aria-hidden="true">M</div><div><div class="sb-name">MiniApart</div><div class="sb-scope">${SCOPE[role]}</div></div></div><nav aria-label="Điều hướng chính">`;
    for (const g of NAV[role]) {
      if (g.label) h += `<div class="sb-label">${g.label}</div>`;
      for (const m of g.items) {
        const on = m.duongDan === active, subOn = m.sub && m.sub.some((s) => s.duongDan === active);
        h += `<a class="nav-item" href="#${m.duongDan}"${on ? ' aria-current="page"' : ''}${m.sub ? ` aria-expanded="${subOn}"` : ''}>${ic(m.icon)}<span>${m.nhan}</span>${m.count ? `<b class="count" aria-label="${m.count} việc cần xử lý">${m.count}</b>` : ''}${m.sub ? ic(subOn ? 'chevron-up' : 'chevron-down', 'ic-sm chev') : ''}</a>`;
        if (m.sub && subOn) h += `<div class="sb-sub">${m.sub.map((s) => `<a class="nav-item" href="#${s.duongDan}"${s.duongDan === active ? ' aria-current="page"' : ''}><span>${s.nhan}</span></a>`).join('')}</div>`;
      }
    }
    h += `</nav><div class="sb-spacer"></div><div class="sb-user"><span class="avatar sm h4" aria-hidden="true">${initials(uName)}</span><div style="min-width:0;flex:1"><div class="name">${uName}</div><div class="t-meta">${uRole}</div></div><button class="icon-btn sm" aria-label="Đăng xuất">${ic('logout')}</button></div>`;
    el.innerHTML = h;
    el.setAttribute('aria-label', 'Thanh bên');
  }
  function bottomNav(el) {
    const role = el.dataset.role, active = el.dataset.active;
    const items = NAV[role].flatMap((g) => g.items).slice(0, 5); // tối đa 5 mục
    el.innerHTML = items.map((m) => `<a href="#${m.duongDan}"${m.duongDan === active ? ' aria-current="page"' : ''}>${ic(m.icon)}<span>${m.short || m.nhan}</span>${m.count ? `<b class="count" aria-label="${m.count} mới">${m.count}</b>` : ''}</a>`).join('');
    el.setAttribute('aria-label', 'Điều hướng chính');
  }
  const run = () => { document.querySelectorAll('aside.sidebar[data-role]').forEach(sidebar); document.querySelectorAll('nav.bottom-nav[data-role]').forEach(bottomNav); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.MA_NAV = NAV;
})();
