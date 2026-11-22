/* UX v2 — bản xem trước bấm thử được. Định tuyến bằng hash: #/<VAI_TRO>/<màn>[/<id>][?tham số]
   Dữ liệu: window.D (data.js, GET thật từ 5190). Không gọi mạng. */
(function () {
  const D = window.D;
  const H = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const vnd = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
  const num = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dmy = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
  const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const ic = (n, c = 'ic') => `<svg class="${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const ini = (name) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  const hue = (s) => ['', 'h1', 'h2', 'h3', 'h4', 'h5'][[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 6];
  const av = (name, cls = '') => `<span class="avatar ${cls} ${hue(name)}" aria-hidden="true">${H(ini(name))}</span>`;
  const tag = (kind, text, icon) => `<span class="tag tag-${kind}">${icon ? ic(icon, 'ic-sm') : ''}${H(text)}</span>`;
  const shortToa = (t) => t.replace(' Residence', '').replace(' Riverside', '').replace(' Home', '');
  const TODAY = '2026-11-22';
  const daysTo = (iso) => Math.round((new Date(iso) - new Date(TODAY)) / 864e5);
  const ROLE_NAME = { CHU: 'Chủ sở hữu', QUAN_LY: 'Quản lý toà nhà', THO: 'Thợ sửa chữa', NGUOI_THUE: 'Người thuê', QTHT: 'Quản trị hệ thống' };
  const MOBILE = { THO: 1, NGUOI_THUE: 1 };

  /* ---------- Kiến trúc thông tin mới: nav theo CÔNG VIỆC (đường dẫn app giữ nguyên, xem 02-kien-truc-thong-tin.md) ---------- */
  const openSuCo = D.suCo.filter((s) => !['DA_DONG', 'DA_HUY'].includes(s.tt));
  const canPhanCong = openSuCo.filter((s) => ['MOI_TIEP_NHAN', 'DA_TIEP_NHAN'].includes(s.tt));
  const lhCho = D.lichHen.filter((l) => l.tt === 'CHO_XAC_NHAN').length;
  const qlLhCho = D.ql.lichHen.filter((l) => l.trangThai === 'CHO_XAC_NHAN').length;
  const qlSuCo = openSuCo.filter((s) => s.toa === 'An Nhiên Residence');
  const I = (id, nhan, icon, extra = {}) => ({ id, nhan, icon, ...extra });
  const NAV = {
    CHU: [[null, [I('hom-nay', 'Hôm nay', 'dashboard')]],
      ['Thu tiền', [I('tien', 'Thu tiền', 'wallet'), I('chu-ky', 'Chu kỳ tháng', 'meter')]],
      ['Phòng & người thuê', [I('toa-nha', 'Toà & phòng', 'building'), I('nguoi-thue', 'Người thuê', 'users'), I('hop-dong', 'Hợp đồng', 'contract'), I('lich-hen', 'Lịch hẹn', 'calendar', { n: lhCho })]],
      ['Vận hành', [I('su-co', 'Sự cố', 'wrench', { n: canPhanCong.length, hot: 1 }), I('an-toan', 'An toàn PCCC', 'shield')]],
      ['Báo cáo', [I('bao-cao', 'Báo cáo', 'chart')]]],
    QUAN_LY: [[null, [I('hom-nay', 'Hôm nay', 'dashboard')]],
      ['Thu tiền', [I('chu-ky', 'Chu kỳ tháng', 'meter', { n: D.ql.kpi.soCongToChuaGhi, hot: 1 }), I('tien', 'Thu tiền', 'wallet')]],
      ['Phòng & người thuê', [I('phong', 'Phòng', 'door'), I('nguoi-thue', 'Người thuê', 'users'), I('hop-dong', 'Hợp đồng', 'contract'), I('lich-hen', 'Lịch hẹn', 'calendar', { n: qlLhCho })]],
      ['Vận hành', [I('su-co', 'Sự cố', 'wrench', { n: qlSuCo.length, hot: 1 }), I('an-toan', 'An toàn PCCC', 'shield'), I('thong-bao-cu-dan', 'Thông báo cư dân', 'megaphone')]]],
    QTHT: [[null, [I('tai-khoan', 'Tài khoản', 'key'), I('toa-nha', 'Toà nhà', 'building'), I('nhat-ky', 'Nhật ký thao tác', 'history')]]],
    THO: [I('viec', 'Việc', 'wrench', { n: D.tho.viec.length }), I('tien-cong', 'Tiền công', 'wallet'), I('thong-bao', 'Thông báo', 'bell', { n: D.tbCount.THO })],
    NGUOI_THUE: [I('can-tra', 'Cần trả', 'receipt'), I('bao-hong', 'Báo hỏng', 'wrench'), I('phong-cua-toi', 'Phòng của tôi', 'home')],
  };
  const SETTINGS = { CHU: 1, QUAN_LY: 1 };
  const HOME = { CHU: 'hom-nay', QUAN_LY: 'hom-nay', QTHT: 'tai-khoan', THO: 'viec', NGUOI_THUE: 'can-tra' };
  /* Đường dẫn cũ của app → vị trí mới (tương thích/redirect). Đủ 42 mục menu + 2 màn công khai, xem bảng ánh xạ. */
  const LEGACY = {
    '/tong-quan': 'bao-cao', '/bao-cao': 'bao-cao', '/bao-cao/tieu-thu': 'bao-cao?tab=tieu-thu', '/bao-cao/chi-phi-bao-tri': 'bao-cao?tab=chi-phi',
    '/nhac-viec': 'hom-nay', '/hoa-don': 'tien?tab=hoa-don', '/thu-tien': 'tien?tab=da-thu', '/cong-no': 'tien', '/ghi-chi-so': 'chu-ky', '/dich-vu': 'cai-dat',
    '/toa-nha': 'toa-nha', '/phong': 'phong', '/nguoi-thue': 'nguoi-thue', '/cu-tru': 'nguoi-thue?tab=cu-tru', '/hop-dong': 'hop-dong', '/lich-hen': 'lich-hen',
    '/su-co': 'su-co', '/an-toan': 'an-toan', '/thong-bao': 'thong-bao', '/nhat-ky-thao-tac': 'nhat-ky', '/tai-khoan': 'tai-khoan',
    '/tho/tong-quan': 'viec', '/viec-cua-toi': 'viec', '/tho/chi-phi': 'tien-cong', '/hoa-don-cua-toi': 'can-tra', '/lich-su': 'can-tra?tab=lich-su', '/tieu-thu': 'phong-cua-toi?tab=tieu-thu', '/bao-hong': 'bao-hong',
  };

  let S = { role: 'CHU', page: 'hom-nay', id: null, q: new URLSearchParams() };
  const go = (r, p, extra = '') => `#/${r}/${p}${extra}`;
  const toaSel = () => (S.role === 'CHU' ? localStorage.getItem('ma.toa') || '' : S.role === 'QUAN_LY' ? 'An Nhiên Residence' : '');
  const inToa = (t) => !toaSel() || t === toaSel();

  /* ---------- Khung desktop ---------- */
  function sidebar() {
    const me = D.me[S.role];
    const cur = toaSel();
    const toaBtn = S.role === 'CHU'
      ? `<button class="sb-toa" data-act="toa" aria-haspopup="true" aria-expanded="${S.q.has('toa')}">${ic('building')}<span class="grow"><span class="t1">${H(cur || 'Tất cả 3 toà')}</span><span class="t2">${cur ? `${D.toa.find((t) => t.ten === cur).soPhong} phòng` : '36 phòng · Chủ sở hữu'}</span></span>${ic('chevron-down', 'ic-sm')}</button>`
      : S.role === 'QUAN_LY' ? `<div class="sb-toa static">${ic('building')}<span class="grow"><span class="t1">An Nhiên Residence</span><span class="t2">12 phòng · được phân công</span></span></div>` : '';
    let h = `<div class="sb-brand"><div class="logo" aria-hidden="true">M</div><div class="sb-name">MiniApart</div></div>${toaBtn}<nav aria-label="Điều hướng chính">`;
    for (const [label, items] of NAV[S.role]) {
      if (label) h += `<div class="sb-label">${label}</div>`;
      for (const m of items) h += `<a class="nav-item" href="${go(S.role, m.id)}"${S.page === m.id ? ' aria-current="page"' : ''}>${ic(m.icon)}<span>${m.nhan}</span>${m.n ? `<b class="count${m.hot ? ' hot' : ''}" aria-label="${m.n} cần xử lý">${m.n}</b>` : ''}</a>`;
    }
    h += `</nav><div class="sb-spacer"></div>`;
    if (SETTINGS[S.role]) h += `<a class="nav-item" href="${go(S.role, 'cai-dat')}"${S.page === 'cai-dat' ? ' aria-current="page"' : ''}>${ic('settings')}<span>Dịch vụ &amp; đơn giá</span></a>`;
    h += `<div class="sb-user" style="margin-top:6px">${av(me.hoTen, 'sm')}<div style="min-width:0;flex:1"><div class="name">${H(me.hoTen)}</div><div class="t-meta">${ROLE_NAME[S.role]}</div></div><button class="icon-btn sm" data-act="role" aria-label="Đổi vai trò xem thử, đăng xuất">${ic('more-v')}</button></div>`;
    return `<aside class="sidebar" aria-label="Thanh bên">${h}</aside>`;
  }
  function topbar() {
    const n = D.tbCount[S.role] || 0;
    return `<header class="ux-top"><button class="icon-btn m-only" data-act="nav" aria-label="Mở menu" aria-expanded="${S.q.has('nav')}">${ic('menu')}</button><button class="ux-search" data-act="k" aria-label="Tìm nhanh: người thuê, phòng, hợp đồng, hoá đơn (Ctrl K)">${ic('search')}<span class="grow">Tìm người thuê, phòng, hợp đồng, hoá đơn…</span><span class="search-kbd">Ctrl K</span></button>
      <div class="push"></div><button class="icon-btn has-n" data-act="tb" aria-label="Thông báo${n ? `, ${n} chưa đọc` : ''}">${ic('bell')}${n ? `<b>${n}</b>` : ''}</button></header>`;
  }
  const ph = (title, sub, acts = '', crumb = '') => `<div class="ph"><div class="grow">${crumb}<h1 class="h1">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${acts ? `<div class="ph-acts">${acts}</div>` : ''}</div>`;
  const crumb = (href, label, here) => `<nav class="crumb" aria-label="Vị trí"><a href="${href}">${label}</a>${ic('chevron-right', 'ic-sm')}<span aria-current="page">${H(here)}</span></nav>`;

  /* ---------- Hôm nay (Chủ) / Nhắc việc (Quản lý) ---------- */
  function homNay() {
    if (S.role === 'QUAN_LY') return homNayQL();
    const k = D.kpiChu, debt = D.debtors.filter((d) => inToa(d.toa));
    const tongNo = debt.reduce((a, d) => a + d.tong, 0), soHd = debt.reduce((a, d) => a + d.hd.length, 0);
    const sapHet = D.hopDong.filter((h) => h.sapHet && inToa(h.toa)), choKy = D.hopDong.filter((h) => h.tt === 'CHO_KY' && inToa(h.toa));
    const khan = canPhanCong.filter((s) => s.tt === 'MOI_TIEP_NHAN' && inToa(s.toa));
    const toas = D.toa.filter((t) => inToa(t.ten));
    const lhToday = D.lichHen.filter((l) => l.gio.startsWith(TODAY) && inToa(l.toa));
    const strip = `<div class="strip">
      <a href="${go('CHU', 'bao-cao')}"><div class="k">Thực thu 6 tháng</div><div class="v">${vnd(k.thucThu)}</div><div class="s">66,8% trên ${vnd(k.doanhThuPhatHanh)} phát hành</div></a>
      <a href="${go('CHU', 'tien')}"><div class="k">Còn phải thu</div><div class="v t-danger">${vnd(tongNo)}</div><div class="s">${soHd} hoá đơn · ${debt.length} người</div></a>
      <a href="${go('CHU', 'toa-nha')}"><div class="k">Lấp đầy</div><div class="v">${Math.round(k.tyLeLapDay)}%</div><div class="s">${k.soPhongDangThue}/${k.tongSoPhong} phòng · ${k.soPhongTrong} trống, 3 đang sửa</div></a>
      <a href="${go('CHU', 'su-co')}"><div class="k">Sự cố đang mở</div><div class="v">${openSuCo.length}</div><div class="s">${canPhanCong.length} chưa phân công thợ</div></a></div>`;
    const sec1 = `<section class="sec" aria-labelledby="s1"><div class="sec-h"><h2 id="s1">Nợ quá hạn theo người</h2><span class="meta">${debt.length} người · ${vnd(tongNo)}</span><a class="link-more brand push" href="${go('CHU', 'tien')}">Mở Thu tiền ${ic('arrow-right', 'ic-sm')}</a></div>
      ${debt.slice(0, 5).map((d) => `<a class="irow" href="${go('CHU', 'nguoi-thue', '/' + d.id)}">${av(d.ten)}<div class="body"><div class="t">${H(d.ten)}</div><div class="s">${H(d.toa)} · Phòng ${d.phong} · ${d.hd.length} kỳ chưa trả đủ</div></div>${tag('danger', `Trễ ${d.tre} ngày`, 'clock')}<div class="end" style="width:132px"><div class="money">${vnd(d.tong)}</div></div>${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}</section>`;
    const sec2 = `<section class="sec" aria-labelledby="s2"><div class="sec-h"><h2 id="s2">Hợp đồng sắp hết hạn</h2><span class="meta">${sapHet.length} hết hạn ${sapHet[0] ? dmy(sapHet[0].kt) : ''} · ${choKy.length} chờ ký</span></div>
      ${sapHet.map((h) => `<a class="irow" href="${go('CHU', 'hop-dong', '/' + h.id)}"><span class="tile warm">${ic('contract')}</span><div class="body"><div class="t">Phòng ${h.phong} · ${H(h.toa)}</div><div class="s">${H(h.nguoi)} · ${vnd(h.gia)}/tháng · hết ${dmy(h.kt)}</div></div>${tag('warning', `Còn ${daysTo(h.kt)} ngày`, 'clock')}${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}
      <a class="irow" href="${go('CHU', 'hop-dong', '?loc=cho-ky')}"><span class="tile">${ic('edit')}</span><div class="body"><div class="t">${choKy.length} hợp đồng chờ ký</div><div class="s">${choKy.map((h) => `P.${h.phong} ${shortToa(h.toa)}`).join(' · ')}</div></div>${ic('chevron-right', 'ic-sm chev')}</a></section>`;
    const sec3 = `<section class="sec" aria-labelledby="s3"><div class="sec-h"><h2 id="s3">Sự cố cần quyết</h2><span class="meta">${khan.length} khẩn cấp chưa phân công</span></div>
      ${khan.map((s) => `<a class="irow" href="${go('CHU', 'su-co', '/' + s.ma)}"><span class="tile red">${ic('alert')}</span><div class="body"><div class="t">${H(s.hangMuc)} · Phòng ${s.phong} ${H(s.toa)}</div><div class="s">${H(s.tenTt)} ${dm(s.tao)} · chưa có thợ · ${H(s.moTa)}</div></div>${tag('danger', s.tenMucDo, 'alert')}${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}
      <div class="irow done"><span class="tile ok">${ic('check')}</span><div class="body"><div class="t">Không có báo giá nào chờ bạn duyệt chi phí</div></div></div></section>`;
    const sec4 = `<section class="sec" aria-labelledby="s4"><div class="sec-h"><h2 id="s4">Phòng chưa cho thuê</h2><span class="meta">${toas.reduce((a, t) => a + t.trong.length, 0)} trống · ${toas.reduce((a, t) => a + t.dangSua.length, 0)} đang sửa</span></div>
      ${toas.map((t) => { const n = D.lichHen.filter((l) => l.toa === t.ten).length; return `<a class="irow" href="${go('CHU', 'toa-nha', '/' + t.id)}"><span class="tile">${ic('door')}</span><div class="body"><div class="t">${H(t.ten)}</div><div class="s">Trống: ${t.trong.join(', ')} · Đang sửa: ${t.dangSua.join(', ')}</div></div><span class="t-meta">${n} lịch hẹn xem</span>${ic('chevron-right', 'ic-sm chev')}</a>`; }).join('')}</section>`;
    const maxNo = Math.max(...D.toa.map((t) => D.debtors.filter((d) => d.toa === t.ten).reduce((a, d) => a + d.tong, 0)));
    const side = `<div class="side">
      <section class="card" aria-labelledby="r1"><div class="blk-h"><h2 id="r1">Lịch hẹn hôm nay</h2><a class="link-more brand push" href="${go('CHU', 'lich-hen')}">${lhCho} chờ xác nhận</a></div>
        <ul class="tl">${lhToday.map((l) => `<li><span class="dot ok"></span><span><b>${l.gio.slice(11, 16)}</b> · ${H(l.ten)}<br><span class="t-meta">Xem phòng ${l.phong} · ${H(l.toa)}</span></span><span class="when">${l.tt === 'DA_XAC_NHAN' ? 'Đã xác nhận' : 'Chờ'}</span></li>`).join('') || '<li><span></span><span class="t-meta">Không có lịch hẹn</span></li>'}</ul></section>
      <section class="card" aria-labelledby="r2"><div class="blk-h"><h2 id="r2">Còn phải thu theo toà</h2></div><div class="hbars" style="margin-top:8px">
        ${D.toa.map((t) => { const v = D.debtors.filter((d) => d.toa === t.ten).reduce((a, d) => a + d.tong, 0); return `<div class="hbar"><span class="hbar-label">${H(t.ten)}</span><span class="hbar-value">${vnd(v)}</span><div class="hbar-track"><div class="hbar-fill warm" style="width:${(v / maxNo * 100).toFixed(1)}%"></div></div></div>`; }).join('')}</div></section>
      <section class="card" aria-labelledby="r3"><div class="blk-h"><h2 id="r3">Kỳ tháng 11</h2><a class="link-more brand push" href="${go('CHU', 'chu-ky')}">Chu kỳ tháng</a></div>
        <p class="t-sm t-2">Cả 3 toà đang mở kỳ 26/10 – 25/11/2026, chốt sau ${daysTo('2026-11-25')} ngày. Quản lý An Nhiên còn 4 công tơ phòng trống/đang sửa chưa ghi.</p></section></div>`;
    return ph('Hôm nay', `Chủ nhật, 22/11/2026 · ${toaSel() || '3 toà, 36 phòng'} · cập nhật ${D.capNhat.slice(11)}`) + strip +
      `<div class="cols"><div class="surface">${sec1}${sec2}${sec3}${sec4}</div>${side}</div>`;
  }
  function homNayQL() {
    const k = D.ql.kpi, ct = D.ql.congTo;
    const strip = `<div class="strip">
      <a href="${go('QUAN_LY', 'tien')}"><div class="k">Còn phải thu</div><div class="v t-danger">${vnd(k.khoanConPhaiThu)}</div><div class="s">${k.soHoaDonQuaHan} hoá đơn quá hạn trên 30 ngày</div></a>
      <a href="${go('QUAN_LY', 'chu-ky')}"><div class="k">Công tơ kỳ 11/2026</div><div class="v">${ct.soCongToDaGhi}/${ct.tongSoCongTo}</div><div class="s">còn ${ct.soCongToChuaGhi} công tơ · chốt 25/11</div></a>
      <a href="${go('QUAN_LY', 'su-co')}"><div class="k">Sự cố đang mở</div><div class="v">${qlSuCo.length}</div><div class="s">${qlSuCo.filter((s) => s.mucDo !== 'THUONG').length} gấp hoặc khẩn cấp</div></a>
      <a href="${go('QUAN_LY', 'phong')}"><div class="k">Lấp đầy</div><div class="v">${Math.round(k.tyLeLapDay)}%</div><div class="s">${k.soPhongDangThue}/${k.tongSoPhong} phòng · ${k.soPhongTrong} trống</div></a></div>`;
    const ACT = { NO_QUA_HAN: ['Mở danh sách', go('QUAN_LY', 'tien'), 'receipt'], THIEU_CHI_SO: ['', '', 'meter'], HOP_DONG_SAP_HET_HAN: ['Gia hạn', go('QUAN_LY', 'hop-dong', '/9'), 'contract'], SU_CO_TON_DONG: ['Mở sự cố', go('QUAN_LY', 'su-co'), 'wrench'], PCCC: ['Mở An toàn', go('QUAN_LY', 'an-toan'), 'shield'] };
    const viec = D.bangViec.filter((v) => v.trangThai !== 'DA_XONG'), xong = D.bangViec.filter((v) => v.trangThai === 'DA_XONG');
    const cycle = cycleSteps();
    const sec0 = `<section class="sec" aria-labelledby="q0"><div class="sec-h"><h2 id="q0">Chu kỳ tháng 11/2026</h2><span class="meta">bước 1/4 · chốt sổ 25/11</span><a class="link-more brand push" href="${go('QUAN_LY', 'chu-ky')}">Mở chu kỳ ${ic('arrow-right', 'ic-sm')}</a></div>
      <div style="padding:4px 16px 12px"><div class="dots" style="gap:10px">${cycle.map((c, i) => `<span style="display:inline-flex;align-items:center;gap:6px"><i class="${c.cls !== 'todo' ? 'on' : ''}"></i>${i + 1}. ${c.tt}</span>`).join('')}</div></div>
      <div class="irow"><span class="tile warm">${ic('meter')}</span><div class="body"><div class="t">Ghi ${ct.soCongToChuaGhi} công tơ còn thiếu</div><div class="s">${ct.danhSachChuaGhi.map((c) => `${c.tenViTri} · ${c.tenDichVu.replace(' sinh hoạt', '').replace(' sạch', '')}`).join(' · ')}</div></div><a class="btn btn-primary btn-sm" href="${go('QUAN_LY', 'chu-ky')}">Ghi chỉ số</a></div></section>`;
    const sec1 = `<section class="sec" aria-labelledby="q1"><div class="sec-h"><h2 id="q1">Việc cần làm</h2><span class="meta">${viec.length} việc · ${xong.length} đã xong</span></div>
      ${viec.map((v) => { const a = ACT[v.ma]; return `<a class="irow" href="${a[1]}"><span class="tile ${v.khanCap ? 'red' : 'warm'}">${ic(a[2])}</span><div class="body"><div class="t">${H(v.tieuDe)}</div><div class="s">${v.khanCap ? 'Khẩn · ' : ''}${H(v.tenTrangThai)}</div></div><span class="bignum" style="font-size:20px;min-width:40px;text-align:right">${v.soLuong}</span><span class="btn btn-secondary btn-sm">${a[0]}</span></a>`; }).join('')}
      ${xong.map((v) => `<div class="irow done"><span class="tile ok">${ic('check')}</span><div class="body"><div class="t">${H(v.tieuDe)}: không còn</div></div></div>`).join('')}</section>`;
    const side = `<div class="side"><section class="card" aria-labelledby="q2"><div class="blk-h"><h2 id="q2">Lịch hẹn xem phòng</h2><a class="link-more brand push" href="${go('QUAN_LY', 'lich-hen')}">Tất cả</a></div>
      <ul class="tl">${D.ql.lichHen.map((l) => `<li><span class="dot ${l.trangThai === 'DA_XAC_NHAN' ? 'ok' : l.trangThai === 'HUY' ? '' : 'warn'}"></span><span><b>${dm(l.thoiGian)} ${new Date(l.thoiGian).toISOString().slice(11, 16)}</b> · ${H(l.hoTen)}<br><span class="t-meta">Phòng ${H(l.soPhong.replace(' (An Nhiên Residence)', ''))} · ${l.soDienThoai}</span></span><span class="when">${{ CHO_XAC_NHAN: 'Chờ xác nhận', DA_XAC_NHAN: 'Đã xác nhận', HUY: 'Đã huỷ' }[l.trangThai]}</span></li>`).join('')}</ul></section>
      <section class="card" aria-labelledby="q3"><div class="blk-h"><h2 id="q3">Cảnh báo điện nước</h2></div><p class="t-sm t-2">Không có cảnh báo tiêu thụ bất thường trong kỳ này.</p></section></div>`;
    return ph('Hôm nay', `Chủ nhật, 22/11/2026 · An Nhiên Residence · kỳ 11/2026 đang mở`) + strip + `<div class="cols"><div class="surface">${sec0}${sec1}</div>${side}</div>`;
  }

  /* ---------- Thu tiền: Cần thu | Hoá đơn | Đã thu — một không gian, một bộ lọc ---------- */
  function tien() {
    const tab = S.q.get('tab') || 'can-thu';
    const debt = D.debtors.filter((d) => inToa(d.toa));
    const hd = D.hoaDon.filter((h) => inToa(h.toa));
    const paid = hd.filter((h) => h.tt === 'DA_THANH_TOAN');
    const tabs = `<div class="tabs" role="tablist" style="padding:0 16px">${[['can-thu', 'Cần thu', debt.length + ' người'], ['hoa-don', 'Hoá đơn', hd.length], ['da-thu', 'Đã thu', paid.length]].map(([id, l, n]) => `<a class="tab" role="tab" href="${go(S.role, 'tien', '?tab=' + id)}" aria-selected="${tab === id}">${l}<span class="n">${n}</span></a>`).join('')}</div>`;
    let body;
    if (tab === 'can-thu') {
      const sel = S.q.has('sel') ? 2 : 0, chosen = debt.slice(0, sel);
      const partial = debt.filter((d) => d.hd.some((h) => h.daThu > 0)).length;
      const bar = sel ? `<div class="bulkbar" style="margin:12px 24px 0">${ic('check-circle')}<span>Đã chọn <b>${sel} người</b> · ${vnd(chosen.reduce((a, d) => a + d.tong, 0))}</span><span class="push"></span><a class="btn btn-secondary btn-sm" href="${go(S.role, 'nguoi-thue', '/' + chosen[0].id)}">Ghi nhận thu</a><a class="btn btn-secondary btn-sm" href="#" data-act="noop">Xuất danh sách</a><button class="btn btn-secondary btn-sm" aria-disabled="true" aria-describedby="why">Gửi nhắc nợ</button><span class="reason" id="why">cần API nhắc nợ</span><a class="btn btn-ghost btn-sm" href="${go(S.role, 'tien')}">Bỏ chọn</a></div>`
        : `<div class="toolbar"><label class="input-wrap"><span class="sr-only">Tìm trong danh sách cần thu</span>${ic('search')}<input class="input" type="search" placeholder="Tìm người, phòng, mã hoá đơn"></label>
          <button class="chip" aria-pressed="true">Tất cả <span class="n">${debt.length}</span></button><button class="chip" aria-pressed="false">Trễ trên 30 ngày <span class="n">${debt.filter((d) => d.tre > 30).length}</span></button><button class="chip" aria-pressed="false">Đã trả một phần <span class="n">${partial}</span></button>
          <span class="push t-meta">Nhóm theo</span><div class="seg" role="group" aria-label="Nhóm theo"><button aria-pressed="true">Người thuê</button><button aria-pressed="false">Phòng</button></div></div>`;
      const rows = debt.slice(0, 10).map((d, i) => {
        const open = i === 0 && !sel;
        const g = `<tr class="grp${i < sel ? ' is-selected' : ''}"><td style="width:48px"><label class="check"><input type="checkbox"${i < sel ? ' checked' : ''}><span class="sr-only">Chọn ${H(d.ten)}</span></label></td>
          <td><a class="td-person" href="${go(S.role, 'nguoi-thue', '/' + d.id)}" style="color:inherit">${av(d.ten, 'sm')}<span><span class="td-main">${H(d.ten)}</span><span class="td-sub" style="display:block">${H(d.toa)} · Phòng ${d.phong}</span></span></a></td>
          <td>${d.hd.length} kỳ</td><td>${tag('danger', `${d.tre} ngày`, 'clock')}</td><td class="num">${vnd(d.hd.reduce((a, h) => a + h.daThu, 0))}</td><td class="num t-money">${vnd(d.tong)}</td>
          <td style="width:52px"><button class="icon-btn xbtn" aria-expanded="${open}" aria-label="${open ? 'Thu gọn' : 'Mở'} hoá đơn của ${H(d.ten)}">${ic(open ? 'chevron-up' : 'chevron-down', 'ic-sm')}</button></td></tr>`;
        const kids = open ? d.hd.map((h) => `<tr class="kid"><td></td><td>Kỳ ${h.ky} <span class="t-meta">· ${H(h.ma)}</span></td><td>hạn ${dmy(h.han)}</td><td>${h.daThu ? tag('warning', 'Trả một phần', 'clock') : tag('danger', 'Chưa trả', 'alert')}</td><td class="num">${vnd(h.daThu)} / ${vnd(h.tong)}</td><td class="num t-money">${vnd(h.conLai)}</td><td></td></tr>`).join('') : '';
        return g + kids;
      }).join('');
      body = `${bar}<div class="table-wrap"><table class="table gtable"><thead><tr><th><span class="sr-only">Chọn</span></th><th>Người thuê · phòng</th><th>Chưa trả đủ</th><th>Trễ lâu nhất</th><th class="num">Đã thu</th><th class="num">Còn nợ</th><th><span class="sr-only">Mở</span></th></tr></thead>
        <tbody>${rows}<tr class="tot"><td></td><td>Tổng ${debt.length} người</td><td>${debt.reduce((a, d) => a + d.hd.length, 0)} kỳ</td><td></td><td class="num">${vnd(debt.reduce((a, d) => a + d.hd.reduce((b, h) => b + h.daThu, 0), 0))}</td><td class="num t-danger">${vnd(debt.reduce((a, d) => a + d.tong, 0))}</td><td></td></tr></tbody></table></div>
        <div class="pager"><span>1–10 trong ${debt.length} người</span><span class="push"></span><button class="pg" aria-current="page">1</button><button class="pg">2</button></div>`;
    } else {
      const list = (tab === 'hoa-don' ? hd : paid).slice(0, 12);
      const TT = { QUA_HAN: ['danger', 'Quá hạn', 'alert'], DA_PHAT_HANH: ['warning', 'Chưa thu đủ', 'clock'], DA_THANH_TOAN: ['success', 'Đã thu đủ', 'check'] };
      body = `<div class="toolbar"><label class="input-wrap"><span class="sr-only">Tìm hoá đơn</span>${ic('search')}<input class="input" type="search" placeholder="Tìm người thuê, phòng, mã hoá đơn"></label>
        ${tab === 'hoa-don' ? `<button class="chip" aria-pressed="true">Mọi kỳ</button><button class="chip" aria-pressed="false">Kỳ 10/2026</button><button class="chip" aria-pressed="false">Kỳ 09/2026</button>` : ''}
        <span class="push"></span>${tab === 'hoa-don' ? `<a class="link-more brand" href="${go(S.role, 'chu-ky')}">Phát hành hoá đơn kỳ mới ở Chu kỳ tháng ${ic('arrow-right', 'ic-sm')}</a>` : ''}</div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Kỳ</th><th>Phòng · người thuê</th><th>Hạn</th><th class="num">Tổng</th><th class="num">Còn lại</th><th>Trạng thái</th></tr></thead><tbody>
        ${list.map((h) => { const t = TT[h.tt]; return `<tr><td><div class="td-main">${h.phatHanh.slice(5, 7)}/${h.phatHanh.slice(0, 4)}</div><div class="td-sub">${H(h.ma)}</div></td><td><div class="td-main">${H(h.nguoi)}</div><div class="td-sub">${H(h.toa)} · Phòng ${h.phong}</div></td><td>${dmy(h.han)}</td><td class="num">${vnd(h.tong)}</td><td class="num t-money${h.conLai ? ' t-danger' : ''}">${vnd(h.conLai)}</td><td>${tag(t[0], t[1], t[2])}</td></tr>`; }).join('')}
        </tbody></table></div><div class="pager"><span>1–12 trong ${(tab === 'hoa-don' ? hd : paid).length} hoá đơn</span></div>`;
    }
    return ph('Thu tiền', `${toaSel() || 'Tất cả 3 toà'} · ${tab === 'can-thu' ? 'nhóm theo người thuê, mỗi người một hàng tổng' : 'gộp Hoá đơn, Thu tiền, Công nợ cũ'}`, `<a class="btn btn-primary" href="${go(S.role, 'nguoi-thue', '/1')}">${ic('plus')}Ghi nhận thu tiền</a>`) +
      `<section class="card flush">${tabs}${body}</section>`;
  }

  /* ---------- Hồ sơ 360°: Người thuê ---------- */
  function nguoiThue360() {
    const id = +S.id, base = D.nguoiThue.find((x) => x.id === id) || D.nguoiThue[0];
    const full = id === D.nt1.id ? D.nt1 : null;
    const debt = D.debtors.find((d) => d.id === id);
    const hop = D.hopDong.filter((h) => h.nguoiId === id);
    const hd0 = hop[0];
    const room = hd0 ? { toa: hd0.toa, phong: hd0.phong } : debt ? { toa: debt.toa, phong: debt.phong } : null;
    const sc = room ? D.suCo.filter((s) => s.toa === room.toa && s.phong === room.phong) : [];
    const scOpen = sc.filter((s) => !['DA_DONG', 'DA_HUY'].includes(s.tt));
    const tab = S.q.get('tab') || 'tong-quan';
    const no = debt ? debt.tong : 0;
    const head = `<div class="prof">${av(base.ten, 'xl')}<div class="grow"><h1 class="h1">${H(base.ten)}</h1>
      <div class="meta">${room ? `<span>${ic('door', 'ic-sm')}${H(room.toa)} · Phòng ${room.phong}</span>` : ''}<span>${ic('phone', 'ic-sm')}${base.sdt.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</span><span>${ic('pin', 'ic-sm')}${H(base.que)}</span></div>
      <div class="tags">${hd0 ? tag(hd0.tt === 'HIEU_LUC' ? 'success' : 'neutral', hd0.tt === 'HIEU_LUC' ? 'Đang thuê' : hd0.tenTt, 'check') : tag('neutral', 'Chưa có hợp đồng', 'info')}${no ? tag('danger', `Nợ ${vnd(no)}`, 'alert') : tag('success', 'Không nợ', 'check')}${scOpen.length ? tag('warning', `${scOpen.length} sự cố đang mở`, 'wrench') : ''}</div></div>
      <div class="ph-acts"><a class="btn btn-secondary" href="tel:${base.sdt}">${ic('phone')}Gọi</a><button class="btn btn-primary" data-act="noop">${ic('wallet')}Ghi nhận thu tiền</button><button class="icon-btn boxed" aria-label="Thao tác khác: sửa hồ sơ, khai báo cư trú, ảnh giấy tờ">${ic('more-h')}</button></div></div>`;
    const tabs = `<div class="tabs" role="tablist">${[['tong-quan', 'Tổng quan'], ['hoa-don', 'Hoá đơn', debt ? debt.hd.length : 0], ['hop-dong', 'Hợp đồng', hop.length], ['su-co', 'Sự cố', sc.length], ['giay-to', 'Giấy tờ & cư trú']].map(([k, l, n]) => `<a class="tab" role="tab" href="${go(S.role, 'nguoi-thue', `/${id}?tab=${k}`)}" aria-selected="${tab === k}">${l}${n !== undefined ? `<span class="n">${n}</span>` : ''}</a>`).join('')}</div>`;
    const money = `<section class="card" aria-labelledby="n1"><div class="blk-h"><h2 id="n1">Tiền</h2><a class="link-more brand push" href="${go(S.role, 'nguoi-thue', `/${id}?tab=hoa-don`)}">Tất cả hoá đơn</a></div>
      ${debt ? `<div class="row" style="gap:24px;margin:6px 0 10px"><div><div class="t-meta">Còn nợ</div><div class="bignum t-danger">${vnd(no)}</div></div><div><div class="t-meta">Kỳ chưa trả đủ</div><div class="bignum">${debt.hd.length}</div></div><div><div class="t-meta">Trễ lâu nhất</div><div class="bignum">${debt.tre} ngày</div></div></div>
      <table class="table"><thead><tr><th>Kỳ</th><th>Hạn</th><th class="num">Đã thu</th><th class="num">Còn lại</th><th>Trạng thái</th></tr></thead><tbody>${debt.hd.map((h) => `<tr><td class="td-main">${h.ky}</td><td>${dmy(h.han)}</td><td class="num">${vnd(h.daThu)}</td><td class="num t-money t-danger">${vnd(h.conLai)}</td><td>${h.daThu ? tag('warning', 'Trả một phần', 'clock') : tag('danger', 'Chưa trả', 'alert')}</td></tr>`).join('')}</tbody></table>`
        : `<p class="t-sm t-2">Không còn khoản nợ nào.</p>`}</section>`;
    const contract = hd0 ? `<section class="card" aria-labelledby="n2"><div class="blk-h"><h2 id="n2">Hợp đồng #${hd0.id}</h2>${tag(hd0.tt === 'HIEU_LUC' ? 'success' : 'neutral', hd0.tenTt)}<a class="link-more brand push" href="${go(S.role, 'hop-dong', '/' + hd0.id)}">Mở hợp đồng</a></div>
      <div class="row" style="gap:28px;margin-top:6px;flex-wrap:wrap"><div><div class="t-meta">Thời hạn</div><div class="t-strong">${dmy(hd0.bd)} – ${dmy(hd0.kt)}</div></div><div><div class="t-meta">Còn lại</div><div class="t-strong">${hd0.conLai} ngày</div></div><div><div class="t-meta">Giá thuê</div><div class="t-strong">${vnd(hd0.gia)}/tháng</div></div><div><div class="t-meta">Tiền cọc</div><div class="t-strong">${vnd(hd0.coc)}</div></div></div>
      <div class="progress" style="margin-top:14px" role="img" aria-label="Đã qua ${Math.round((1 - hd0.conLai / ((new Date(hd0.kt) - new Date(hd0.bd)) / 864e5)) * 100)}% thời hạn"><span style="width:${Math.round((1 - hd0.conLai / ((new Date(hd0.kt) - new Date(hd0.bd)) / 864e5)) * 100)}%"></span></div></section>` : '';
    const scBlk = `<section class="card" aria-labelledby="n3"><div class="blk-h"><h2 id="n3">Sự cố của phòng</h2><span class="t-meta">${scOpen.length} đang mở · ${sc.length - scOpen.length} đã xong</span><a class="link-more brand push" href="${go(S.role, 'su-co')}">Mở Sự cố</a></div>
      <div style="margin:4px -24px -8px">${scOpen.slice(0, 5).map((s) => `<a class="irow" href="${go(S.role, 'su-co', '/' + s.ma)}"><div class="body"><div class="t">${H(s.hangMuc)}</div><div class="s">${H(s.ma)} · báo ${dmy(s.tao)}</div></div>${tag(s.tt === 'DANG_XU_LY' ? 'info' : 'warning', s.tenTt)}${s.mucDo !== 'THUONG' ? tag('danger', s.tenMucDo) : ''}</a>`).join('') || '<p class="t-sm t-2" style="padding:0 24px 12px">Không có sự cố đang mở.</p>'}</div></section>`;
    const p = D.pay31[0];
    const act = `<section class="card" aria-labelledby="n4"><div class="blk-h"><h2 id="n4">Hoạt động</h2><span class="t-meta">từ hoá đơn, thanh toán, sự cố</span></div><ul class="tl">
      ${scOpen[0] ? `<li><span class="dot warn"></span><span>Báo sự cố <b>${H(scOpen[0].hangMuc)}</b></span><span class="when">${dmy(scOpen[0].tao)}</span></li>` : ''}
      ${id === 1 && p ? `<li><span class="dot ok"></span><span>Thu ${vnd(+p.soTien)} chuyển khoản · biên lai ${H(p.maBienLai)}</span><span class="when">${dmy(p.ngayThu)}</span></li>` : ''}
      ${debt ? `<li><span class="dot red"></span><span>Hoá đơn kỳ ${debt.hd[debt.hd.length - 1].ky} quá hạn</span><span class="when">${dmy(debt.hd[debt.hd.length - 1].han)}</span></li>` : ''}
      ${hd0 ? `<li><span class="dot"></span><span>Bắt đầu hợp đồng #${hd0.id}, phòng ${hd0.phong}</span><span class="when">${dmy(hd0.bd)}</span></li>` : ''}</ul>
      <p class="t-meta" style="margin-top:8px">Ghi chú cuộc gọi/nhắn tin: cần API mới (xem Phụ thuộc backend).</p></section>`;
    const info = `<section class="card" aria-labelledby="n5"><div class="blk-h"><h2 id="n5">Liên hệ & giấy tờ</h2></div><dl class="kv" style="margin-top:8px">
      <dt>Điện thoại</dt><dd>${base.sdt.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</dd>${full ? `<dt>Email</dt><dd>${H(full.email)}</dd><dt>Ngày sinh</dt><dd>${dmy(full.ngaySinh)}</dd><dt>Giấy tờ</dt><dd>${H(full.loaiGiayTo)} ${H(full.soGiayToChe)}</dd><dt>Thường trú</dt><dd>${H(full.diaChiThuongTru)}</dd>` : ''}<dt>Quê quán</dt><dd>${H(base.que)}</dd></dl></section>`;
    const tt = D.ntTieuThu.dien.slice(0, 4).reverse();
    const use = id === 1 ? `<section class="card" aria-labelledby="n6"><div class="blk-h"><h2 id="n6">Điện 4 kỳ gần nhất</h2></div><div class="hbars" style="margin-top:8px">${tt.map((x) => `<div class="hbar"><span class="hbar-label">Kỳ ${String(x.thang).padStart(2, '0')}/${x.nam}</span><span class="hbar-value">${num(+x.mucTieuThu)} kWh</span><div class="hbar-track"><div class="hbar-fill" style="width:${(+x.mucTieuThu / 120 * 100).toFixed(0)}%"></div></div></div>`).join('')}</div></section>` : '';
    let main = tab === 'tong-quan' ? money + contract + scBlk + act : tab === 'hoa-don' ? money : tab === 'hop-dong' ? contract || '<section class="card"><p>Chưa có hợp đồng.</p></section>' : tab === 'su-co' ? scBlk : info;
    return crumb(go(S.role, 'nguoi-thue'), 'Người thuê', base.ten) + head + tabs + `<div class="cols"><div class="side">${main}</div><div class="side">${info}${use}</div></div>`;
  }

  /* ---------- Hồ sơ 360°: Phòng / Hợp đồng / Toà ---------- */
  function phong360() {
    const p = D.phong3.find((x) => x.id === +S.id) || D.phong3[0];
    const hop = D.hopDong.filter((h) => h.phongId === p.id), cur = hop.find((h) => h.tt === 'HIEU_LUC') || hop[0];
    const sc = D.suCo.filter((s) => s.toa === 'An Nhiên Residence' && s.phong === p.soPhong);
    const hd = D.hoaDon.filter((h) => h.toa === 'An Nhiên Residence' && h.phong === p.soPhong);
    const st = { DANG_THUE: ['success', 'Đang thuê'], TRONG: ['warning', 'Trống'], DANG_SUA: ['info', 'Đang sửa'] }[p.trangThai] || ['neutral', p.tenTrangThai];
    const head = `<div class="prof"><span class="avatar xl" aria-hidden="true">${p.soPhong}</span><div class="grow"><h1 class="h1">Phòng ${p.soPhong}</h1><div class="meta"><span>${ic('building', 'ic-sm')}An Nhiên Residence · tầng ${p.tang}</span><span>${ic('ruler', 'ic-sm')}${num(+p.dienTich)} m² · ${H(p.loaiPhong)}</span><span>${ic('users', 'ic-sm')}tối đa ${p.sucChua} người</span></div><div class="tags">${tag(st[0], st[1])}${tag('neutral', `Giá mặc định ${vnd(+p.giaThueMacDinh)}`)}</div></div>
      <div class="ph-acts"><button class="btn btn-secondary" data-act="noop">${ic('wrench')}Báo sự cố</button>${p.trangThai === 'TRONG' ? `<a class="btn btn-primary" href="${go(S.role, 'hop-dong', '/moi')}">${ic('plus')}Tạo hợp đồng</a>` : cur ? `<a class="btn btn-secondary" href="${go(S.role, 'hop-dong', '/' + cur.id)}">${ic('contract')}Mở hợp đồng</a>` : ''}</div></div>`;
    const left = `<section class="card"><div class="blk-h"><h2>Người đang ở</h2></div>${cur ? `<div style="margin:4px -24px -8px"><a class="irow" href="${go(S.role, 'nguoi-thue', '/' + cur.nguoiId)}">${av(cur.nguoi)}<div class="body"><div class="t">${H(cur.nguoi)}</div><div class="s">Hợp đồng #${cur.id} · ${dmy(cur.bd)} – ${dmy(cur.kt)} · ${vnd(cur.gia)}/tháng</div></div>${ic('chevron-right', 'ic-sm chev')}</a></div>` : '<p class="t-sm t-2">Phòng trống.</p>'}</section>
      <section class="card"><div class="blk-h"><h2>Hoá đơn của phòng</h2><span class="t-meta">${hd.length} hoá đơn</span></div><table class="table"><thead><tr><th>Kỳ</th><th>Người thuê</th><th class="num">Còn lại</th><th>Trạng thái</th></tr></thead><tbody>${hd.slice(-4).reverse().map((h) => `<tr><td class="td-main">${h.phatHanh.slice(5, 7)}/${h.phatHanh.slice(0, 4)}</td><td>${H(h.nguoi)}</td><td class="num t-money">${vnd(h.conLai)}</td><td>${h.tt === 'DA_THANH_TOAN' ? tag('success', 'Đã thu đủ', 'check') : tag('danger', 'Còn nợ', 'alert')}</td></tr>`).join('')}</tbody></table></section>
      <section class="card"><div class="blk-h"><h2>Sự cố</h2><span class="t-meta">${sc.length} yêu cầu</span></div><div style="margin:4px -24px -8px">${sc.slice(0, 5).map((s) => `<a class="irow" href="${go(S.role, 'su-co', '/' + s.ma)}"><div class="body"><div class="t">${H(s.hangMuc)}</div><div class="s">${H(s.ma)} · ${dmy(s.tao)}</div></div>${tag(['DA_DONG', 'DA_HUY'].includes(s.tt) ? 'neutral' : 'warning', s.tenTt)}</a>`).join('')}</div></section>`;
    const right = `<section class="card"><div class="blk-h"><h2>Điện nước kỳ 11/2026</h2></div>${(D.chiSo.phong.find((x) => x.soPhong === p.soPhong)?.dichVu || []).map((d) => `<div class="sumrow"><span>${H(d.tenDichVu)}</span><b>${num(+d.chiSoDau)} → ${num(+d.chiSoCuoi)} ${H(d.donVi)} · dùng ${num(+d.mucTieuThu)}</b></div>`).join('') || '<p class="t-sm t-2">Chưa ghi chỉ số kỳ này.</p>'}</section>
      <section class="card"><div class="blk-h"><h2>Lịch sử hợp đồng</h2></div><ul class="tl">${hop.map((h) => `<li><span class="dot ${h.tt === 'HIEU_LUC' ? 'ok' : ''}"></span><span>#${h.id} · ${H(h.nguoi)}<br><span class="t-meta">${dmy(h.bd)} – ${dmy(h.kt)}</span></span><span class="when">${H(h.tenTt)}</span></li>`).join('')}</ul></section>`;
    return crumb(go(S.role, 'toa-nha', '/3'), 'An Nhiên Residence', 'Phòng ' + p.soPhong) + head + `<div class="cols"><div class="side">${left}</div><div class="side">${right}</div></div>`;
  }
  function hopDong360() {
    if (S.id === 'moi') return hopDongMoi();
    const h = D.hopDong.find((x) => x.id === +S.id) || D.hopDong[0];
    const debt = D.debtors.find((d) => d.hopDongId === h.id);
    const tong = (new Date(h.kt) - new Date(h.bd)) / 864e5, qua = Math.max(0, Math.min(100, Math.round((1 - h.conLai / tong) * 100)));
    const head = `<div class="prof"><span class="avatar xl h2" aria-hidden="true">${ic('contract', 'ic-lg')}</span><div class="grow"><h1 class="h1">Hợp đồng #${h.id} · Phòng ${h.phong}</h1><div class="meta"><span>${ic('building', 'ic-sm')}${H(h.toa)}</span><span>${ic('user', 'ic-sm')}${H(h.nguoi)}</span><span>${ic('calendar', 'ic-sm')}${dmy(h.bd)} – ${dmy(h.kt)}</span></div>
      <div class="tags">${tag(h.tt === 'HIEU_LUC' ? 'success' : h.tt === 'CHO_KY' ? 'warning' : 'neutral', h.tenTt)}${h.sapHet ? tag('warning', `Hết hạn sau ${daysTo(h.kt)} ngày`, 'clock') : ''}${debt ? tag('danger', `Nợ ${vnd(debt.tong)}`, 'alert') : ''}</div></div>
      <div class="ph-acts"><button class="btn btn-secondary" data-act="noop">${ic('download')}Tải PDF</button>${h.tt === 'HIEU_LUC' && h.sapHet ? `<button class="btn btn-primary" data-act="noop">Gia hạn</button>` : h.tt === 'CHO_KY' ? `<button class="btn btn-primary" data-act="noop">Ký hợp đồng</button>` : ''}<button class="icon-btn boxed" aria-label="Thao tác khác: thanh lý, phụ lục, khoản phát sinh, người ở cùng, giao dịch cọc">${ic('more-h')}</button></div></div>`;
    const left = `<section class="card"><div class="blk-h"><h2>Điều khoản</h2></div><div class="row" style="gap:28px;flex-wrap:wrap;margin-top:6px"><div><div class="t-meta">Giá thuê</div><div class="bignum">${vnd(h.gia)}</div></div><div><div class="t-meta">Tiền cọc</div><div class="bignum">${vnd(h.coc)}</div></div><div><div class="t-meta">Báo trước</div><div class="bignum">${h.baoTruoc} ngày</div></div></div>
      <div class="progress" style="margin-top:16px" role="img" aria-label="Đã qua ${qua}% thời hạn"><span style="width:${qua}%"></span></div><p class="t-meta" style="margin-top:6px">Đã qua ${qua}% thời hạn · còn ${h.conLai} ngày</p></section>
      <section class="card"><div class="blk-h"><h2>Dịch vụ áp dụng</h2></div>${h.dv.map(([t, g]) => `<div class="sumrow"><span>${H(t)}</span><b>${g ? vnd(g) : 'Miễn phí'}</b></div>`).join('')}</section>
      <section class="card"><div class="blk-h"><h2>Hoá đơn theo hợp đồng</h2><span class="t-meta">${debt ? debt.hd.length + ' kỳ còn nợ' : 'không còn nợ'}</span></div>${debt ? `<table class="table"><thead><tr><th>Kỳ</th><th>Hạn</th><th class="num">Còn lại</th></tr></thead><tbody>${debt.hd.map((x) => `<tr><td class="td-main">${x.ky}</td><td>${dmy(x.han)}</td><td class="num t-money t-danger">${vnd(x.conLai)}</td></tr>`).join('')}</tbody></table>` : ''}</section>`;
    const right = `<section class="card"><div class="blk-h"><h2>Liên kết</h2></div><div style="margin:4px -22px -8px">
      <a class="irow" href="${go(S.role, 'nguoi-thue', '/' + h.nguoiId)}">${av(h.nguoi, 'sm')}<div class="body"><div class="t">${H(h.nguoi)}</div><div class="s">Người thuê chính</div></div>${ic('chevron-right', 'ic-sm chev')}</a>
      <a class="irow" href="${go(S.role, 'phong', '/' + h.phongId)}"><span class="tile">${ic('door')}</span><div class="body"><div class="t">Phòng ${h.phong}</div><div class="s">${H(h.toa)}</div></div>${ic('chevron-right', 'ic-sm chev')}</a></div></section>
      <section class="card"><div class="blk-h"><h2>Mốc</h2></div><div class="vsteps" style="margin-top:8px">${[['Tạo & ký', dmy(h.bd), 1], ['Đang hiệu lực', `${h.conLai} ngày còn lại`, h.tt === 'HIEU_LUC'], [h.sapHet ? 'Gia hạn hoặc báo trả phòng' : 'Báo trước 30 ngày', 'trước ' + dmy(h.kt), 0], ['Thanh lý & quyết toán cọc', '', 0]].map(([t, s, on], i) => `<div class="vstep ${on ? (i === 1 ? 'cur' : 'done') : 'todo'}"><span class="n">${on && i === 0 ? ic('check', 'ic-sm') : i + 1}</span><div><div class="tt">${t}</div><div class="st">${s}</div></div></div>`).join('')}</div></section>`;
    return crumb(go(S.role, 'hop-dong'), 'Hợp đồng', '#' + h.id) + head + `<div class="cols"><div class="side">${left}</div><div class="side">${right}</div></div>`;
  }
  function toa360() {
    const t = D.toa.find((x) => x.id === +S.id) || D.toa[0];
    const rooms = t.id === 3 ? D.phong3 : null;
    const no = D.debtors.filter((d) => d.toa === t.ten).reduce((a, d) => a + d.tong, 0);
    const sc = openSuCo.filter((s) => s.toa === t.ten);
    const head = `<div class="prof"><span class="avatar xl h5" aria-hidden="true">${ic('building', 'ic-lg')}</span><div class="grow"><h1 class="h1">${H(t.ten)}</h1><div class="meta"><span>${ic('pin', 'ic-sm')}${H(t.diaChi)}</span><span>${t.soTang} tầng · ${t.soPhong} phòng</span><span>chốt sổ ngày ${t.ngayChotSo}</span></div></div>
      <div class="ph-acts"><button class="btn btn-secondary" data-act="noop">${ic('edit')}Sửa thông tin toà</button><button class="btn btn-primary" data-act="noop">${ic('plus')}Khai báo phòng</button></div></div>`;
    const strip = `<div class="strip"><a href="${go(S.role, 'toa-nha', '/' + t.id)}"><div class="k">Đang thuê</div><div class="v">${t.dangThue}/${t.soPhong}</div><div class="s">${t.trong.length} trống · ${t.dangSua.length} đang sửa</div></a><a href="${go(S.role, 'tien')}"><div class="k">Còn phải thu</div><div class="v t-danger">${vnd(no)}</div><div class="s">${D.debtors.filter((d) => d.toa === t.ten).length} người</div></a><a href="${go(S.role, 'su-co')}"><div class="k">Sự cố đang mở</div><div class="v">${sc.length}</div><div class="s">${sc.filter((s) => s.mucDo !== 'THUONG').length} gấp/khẩn</div></a><a href="${go(S.role, 'chu-ky')}"><div class="k">Kỳ đang mở</div><div class="v">${String(t.ky.thang).padStart(2, '0')}/${t.ky.nam}</div><div class="s">${dmy(t.ky.ngayBatDau)} – ${dmy(t.ky.ngayKetThuc)}</div></a></div>`;
    const grid = rooms ? `<section class="card"><div class="blk-h"><h2>Sơ đồ phòng</h2><span class="t-meta">bấm vào phòng để mở hồ sơ phòng</span></div><div class="rooms" style="margin-top:10px">${rooms.map((p) => { const c = { TRONG: 'trong', DANG_SUA: 'sua' }[p.trangThai] || ''; const h = D.hopDong.find((x) => x.phongId === p.id && x.tt === 'HIEU_LUC'); return `<a class="room ${c}" href="${go(S.role, 'phong', '/' + p.id)}"><b>${p.soPhong}</b><span>${h ? H(h.nguoi.split(' ').slice(-2).join(' ')) : H(p.tenTrangThai)}</span></a>`; }).join('')}</div></section>`
      : `<section class="card"><p class="t-sm t-2">Sơ đồ phòng dùng GET /api/toa-nha/${t.id}/phong như An Nhiên.</p></section>`;
    const deb = D.debtors.filter((d) => d.toa === t.ten), het = D.hopDong.filter((h) => h.toa === t.ten && (h.sapHet || h.tt === 'CHO_KY'));
    const watch = `<section class="surface"><div class="sec"><div class="sec-h"><h2>Cần chú ý ở toà này</h2><span class="meta">${deb.length} người còn nợ · ${het.length} hợp đồng cần xử lý</span></div>
      ${deb.slice(0, 3).map((d) => `<a class="irow" href="${go(S.role, 'nguoi-thue', '/' + d.id)}">${av(d.ten)}<div class="body"><div class="t">${H(d.ten)} · Phòng ${d.phong}</div><div class="s">${d.hd.length} kỳ chưa trả đủ · trễ ${d.tre} ngày</div></div><div class="money">${vnd(d.tong)}</div>${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}
      ${het.map((h) => `<a class="irow" href="${go(S.role, 'hop-dong', '/' + h.id)}"><span class="tile warm">${ic('contract')}</span><div class="body"><div class="t">Hợp đồng #${h.id} · Phòng ${h.phong} · ${H(h.nguoi)}</div><div class="s">${h.sapHet ? 'hết hạn ' + dmy(h.kt) : 'chờ ký, bắt đầu ' + dmy(h.bd)}</div></div>${tag(h.sapHet ? 'warning' : 'neutral', h.sapHet ? `Còn ${daysTo(h.kt)} ngày` : 'Chờ ký')}${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}</div></section>`;
    return crumb(go(S.role, 'toa-nha'), 'Toà & phòng', t.ten) + head + strip + grid + watch;
  }

  /* ---------- Sự cố: một danh sách + ngăn chi tiết bên phải ---------- */
  const SC_STEPS = ['Tiếp nhận', 'Phân công thợ', 'Khảo sát & báo giá', 'Duyệt báo giá', 'Sửa xong · chờ nghiệm thu', 'Thanh toán thợ'];
  const scStep = (s) => ({ MOI_TIEP_NHAN: 0, DA_TIEP_NHAN: 1, DA_PHAN_CONG: 2, DANG_XU_LY: 2, CHO_XAC_NHAN: 4, DA_DONG: 6, DA_HUY: 6 }[s.tt] ?? 0);
  function suCo() {
    const pool = (S.role === 'QUAN_LY' ? D.suCo.filter((s) => s.toa === 'An Nhiên Residence') : D.suCo.filter((s) => inToa(s.toa)));
    const f = S.q.get('loc') || 'mo';
    const groups = { mo: ['Đang mở', (s) => !['DA_DONG', 'DA_HUY'].includes(s.tt)], can: ['Cần phân công', (s) => ['MOI_TIEP_NHAN', 'DA_TIEP_NHAN'].includes(s.tt)], dang: ['Đang sửa', (s) => ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_XAC_NHAN'].includes(s.tt)], xong: ['Đã đóng', (s) => ['DA_DONG', 'DA_HUY'].includes(s.tt)] };
    const list = pool.filter(groups[f][1]).sort((a, b) => (a.mucDo === 'KHAN_CAP' ? -1 : 0) - (b.mucDo === 'KHAN_CAP' ? -1 : 0));
    const cur = pool.find((s) => s.ma === S.id) || list[0] || pool[0];
    const chips = Object.entries(groups).map(([k, [l, fn]]) => `<a class="chip" href="${go(S.role, 'su-co', `/${cur.ma}?loc=${k}`)}" aria-pressed="${f === k}">${l} <span class="n">${pool.filter(fn).length}</span></a>`).join('');
    const rows = list.slice(0, 11).map((s) => `<a class="irow${s.ma === cur.ma ? ' sel' : ''}" href="${go(S.role, 'su-co', `/${s.ma}?loc=${f}`)}"${s.ma === cur.ma ? ' aria-current="true"' : ''}><span class="tile ${s.mucDo === 'KHAN_CAP' ? 'red' : s.mucDo === 'GAP' ? 'warm' : ''}">${ic(s.mucDo === 'THUONG' ? 'wrench' : 'alert')}</span><div class="body"><div class="t">${H(s.hangMuc)}</div><div class="s">${H(s.toa)} · Phòng ${s.phong} · ${H(s.ma)}</div></div>${s.mucDo !== 'THUONG' ? tag(s.mucDo === 'KHAN_CAP' ? 'danger' : 'warning', s.tenMucDo) : ''}<span class="t-meta" style="width:64px;text-align:right">${daysTo(s.tao) === 0 ? 'hôm nay' : -daysTo(s.tao) + ' ngày'}</span></a>`).join('');
    const k = scStep(cur);
    const primary = ['Phân công thợ', 'Phân công thợ', 'Nhắc thợ gửi báo giá', 'Duyệt báo giá', 'Nghiệm thu', 'Xác nhận thanh toán thợ', ''][k];
    const drawer = `<aside class="drawer" aria-labelledby="dh"><div class="drawer-h"><div class="row" style="gap:8px">${tag(cur.mucDo === 'KHAN_CAP' ? 'danger' : cur.mucDo === 'GAP' ? 'warning' : 'neutral', cur.tenMucDo, cur.mucDo === 'THUONG' ? '' : 'alert')}${tag('info', cur.tenTt)}<span class="push t-meta">${H(cur.ma)}</span></div>
      <h2 class="h2" id="dh" style="margin-top:10px">${H(cur.hangMuc)}</h2><p class="t-sm t-2" style="margin-top:2px">${H(cur.toa)} · Phòng ${cur.phong} · tầng ${cur.tang}</p></div>
      <div class="drawer-b"><p>${H(cur.moTa)}</p>
      <div><div class="blk-h"><h2 style="font-size:15px">Tiến độ</h2><span class="t-meta">${Math.min(k, 6)}/6 bước</span></div><div class="vsteps" style="margin-top:8px">${SC_STEPS.map((t, i) => `<div class="vstep ${i < k ? 'done' : i === k ? 'cur' : 'todo'}"><span class="n">${i < k ? ic('check', 'ic-sm') : i + 1}</span><div><div class="tt">${t}</div>${i === k ? `<div class="st">${['Chưa có người tiếp nhận', 'Chưa có thợ', 'Thợ đang khảo sát, chưa gửi báo giá', 'Chờ duyệt chi phí', 'Chờ nghiệm thu', 'Chờ thanh toán'][i]}</div>` : ''}</div></div>`).join('')}</div></div>
      <dl class="kv"><dt>Báo lúc</dt><dd>${dmy(cur.tao)}</dd><dt>Liên hệ</dt><dd>${cur.sdt || 'Chưa có'}</dd><dt>Thợ</dt><dd>${cur.tho ? 'Lê Quốc Huy' : 'Chưa phân công'}</dd><dt>Chi phí</dt><dd>${cur.chiPhi ? vnd(cur.chiPhi) : 'Chưa có báo giá'}</dd><dt>Ảnh</dt><dd>Chưa có ảnh</dd></dl></div>
      ${primary ? `<div class="drawer-f"><button class="btn btn-primary" data-act="noop">${primary}</button><button class="btn btn-secondary" data-act="noop">Huỷ yêu cầu</button></div>` : ''}</aside>`;
    return ph('Sự cố', `${S.role === 'QUAN_LY' ? 'An Nhiên Residence' : toaSel() || 'Tất cả 3 toà'} · bấm một dòng để xem chi tiết bên phải`, `<button class="btn btn-secondary" data-act="noop">${ic('plus')}Báo sự cố</button>`) +
      `<div class="split"><section class="card flush" aria-label="Danh sách sự cố"><div class="toolbar">${chips}<span class="push"></span><label class="input-wrap" style="width:220px"><span class="sr-only">Tìm sự cố</span>${ic('search')}<input class="input" type="search" placeholder="Tìm phòng, hạng mục"></label></div><div style="padding-bottom:8px">${rows}</div></section>${drawer}</div>`;
  }

  /* ---------- Chu kỳ tháng (Quản lý): Ghi chỉ số → Chốt kỳ → Phát hành → Thu tiền ---------- */
  function cycleSteps() {
    const ct = D.ql.congTo, ky4 = D.hoaDon.filter((h) => h.toa === 'An Nhiên Residence' && h.kyId === 4);
    return [
      { tt: 'Ghi chỉ số', st: `${ct.soCongToDaGhi}/${ct.tongSoCongTo} công tơ · còn ${ct.soCongToChuaGhi}`, cls: 'cur' },
      { tt: 'Chốt kỳ', st: 'mở từ 25/11/2026', cls: 'todo' },
      { tt: 'Phát hành hoá đơn', st: '9 phòng đang thuê', cls: 'todo' },
      { tt: 'Thu tiền', st: `kỳ trước còn ${ky4.filter((h) => h.conLai).length} hoá đơn chưa thu đủ`, cls: 'todo' },
    ];
  }
  function chuKy() {
    const role = S.role, steps = cycleSteps(), ct = D.ql.congTo;
    const bar = `<nav class="steps" aria-label="Các bước chu kỳ tháng">${steps.map((s, i) => `<a class="step ${s.cls}" href="${go(role, 'chu-ky', '?b=' + (i + 1))}"${s.cls === 'cur' ? ' aria-current="step"' : ''}><span class="n">${i + 1}</span><span><span class="tt" style="display:block">${s.tt}</span><span class="st" style="display:block">${s.st}</span></span></a>`).join('')}</nav>`;
    const missing = ct.danhSachChuaGhi;
    const rooms = D.chiSo.phong;
    const body = `<section class="card flush" aria-labelledby="b1"><div class="sec-h" style="padding-top:20px"><h2 id="b1">Bước 1 · Ghi chỉ số kỳ 11/2026</h2><span class="meta">${D.chiSo.daGhi}/${D.chiSo.tongPhong} phòng đang thuê đã ghi đủ</span></div>
      <div class="banner banner-warning" style="margin:8px 24px 4px">${ic('alert')}<div><b>Còn ${missing.length} công tơ chưa ghi</b> ở phòng 401 (trống) và 403 (đang sửa). Ghi chỉ số 0 hoặc chỉ số thật trước khi chốt kỳ.</div><a class="btn btn-primary btn-sm b-act" href="${go(role, 'chu-ky', '?m=1')}">Ghi ${missing.length} công tơ</a></div>
      <div class="table-wrap" style="margin:0;padding:0 16px"><table class="table"><thead><tr><th>Phòng</th><th class="num">Điện (kWh)</th><th class="num">Dùng</th><th class="num">Nước (m³)</th><th class="num">Dùng</th><th>Trạng thái</th></tr></thead><tbody>
      ${missing.filter((m, i, a) => a.findIndex((x) => x.tenViTri === m.tenViTri) === i).map((m) => `<tr><td class="td-main">${m.tenViTri}</td><td class="num t-3">—</td><td class="num t-3">—</td><td class="num t-3">—</td><td class="num t-3">—</td><td>${tag('warning', 'Chưa ghi', 'clock')}</td></tr>`).join('')}
      ${rooms.slice(0, 7).map((p) => { const e = p.dichVu[0], w = p.dichVu[1]; return `<tr><td class="td-main">${p.soPhong}</td><td class="num">${num(+e.chiSoDau)} → ${num(+e.chiSoCuoi)}</td><td class="num t-strong">${num(+e.mucTieuThu)}</td><td class="num">${num(+w.chiSoDau)} → ${num(+w.chiSoCuoi)}</td><td class="num t-strong">${num(+w.mucTieuThu)}</td><td>${tag('success', 'Đã ghi', 'check')}</td></tr>`; }).join('')}
      </tbody></table></div><div class="pager"><span>${missing.length / 2 + 7} trong ${missing.length / 2 + rooms.length} phòng</span></div></section>`;
    const ky4 = D.hoaDon.filter((h) => h.toa === 'An Nhiên Residence' && h.kyId === 4);
    const side = `<div class="side"><section class="card"><div class="blk-h"><h2>Sau bước này</h2></div><div class="vsteps" style="margin-top:8px">${steps.slice(1).map((s, i) => `<div class="vstep todo"><span class="n">${i + 2}</span><div><div class="tt">${s.tt}</div><div class="st">${['Khoá chỉ số, không sửa được nữa', 'Tạo nháp 9 hoá đơn, kiểm rồi phát hành', 'Theo dõi ở Thu tiền, nhóm theo người'][i]}</div></div></div>`).join('')}</div></section>
      <section class="card"><div class="blk-h"><h2>Kỳ 10/2026 (đã chốt)</h2><a class="link-more brand push" href="${go(role, 'tien')}">Thu tiền</a></div>
        <div class="sumrow"><span>Hoá đơn đã phát hành</span><b>${ky4.length}</b></div><div class="sumrow"><span>Đã thu đủ</span><b>${ky4.filter((h) => !h.conLai).length}</b></div><div class="sumrow"><span>Còn phải thu</span><b class="t-danger">${vnd(ky4.reduce((a, h) => a + h.conLai, 0))}</b></div></section></div>`;
    return ph('Chu kỳ tháng 11/2026', `An Nhiên Residence · kỳ 26/10 – 25/11/2026 · chốt sổ sau ${daysTo('2026-11-25')} ngày`) + bar + `<div class="cols"><div>${body}</div>${side}</div>`;
  }

  /* ---------- Tạo hợp đồng: luồng 5 bước có chỉ báo ---------- */
  function hopDongMoi() {
    const h = D.hopDong.find((x) => x.id === 10);
    const steps = ['Phòng & người thuê', 'Thời hạn & giá', 'Dịch vụ áp dụng', 'Người ở cùng & cọc', 'Xem lại & tạo'];
    const nav = `<section class="card" aria-label="Các bước tạo hợp đồng"><div class="vsteps">${steps.map((t, i) => `<a class="vstep ${i < 1 ? 'done' : i === 1 ? 'cur' : 'todo'}" href="#"${i === 1 ? ' aria-current="step"' : ''}><span class="n">${i < 1 ? ic('check', 'ic-sm') : i + 1}</span><div><div class="tt">${t}</div><div class="st">${i === 0 ? `P.${h.phong} · ${H(h.nguoi)}` : i === 1 ? 'Đang điền' : ''}</div></div></a>`).join('')}</div></section>`;
    const field = (id, l, v, help = '', type = 'text') => `<div class="field"><label class="label" for="${id}">${l}</label><input class="input" id="${id}" type="${type}" value="${H(v)}">${help ? `<span class="help">${help}</span>` : ''}</div>`;
    const form = `<section class="card" aria-labelledby="w2"><p class="t-meta">Bước 2/5</p><h2 class="h2" id="w2" style="margin:2px 0 18px">Thời hạn và giá thuê</h2><div class="form-grid">
      ${field('bd', 'Ngày bắt đầu', dmy(h.bd))}${field('kt', 'Ngày kết thúc', dmy(h.kt), 'Mặc định theo mẫu hợp đồng của toà')}
      ${field('gia', 'Giá thuê mỗi tháng', num(h.gia) + ' ₫', 'Giá mặc định của phòng 401: 3.600.000 ₫')}${field('coc', 'Tiền cọc', num(h.coc) + ' ₫', 'Bằng 2 tháng tiền thuê')}
      ${field('bt', 'Số ngày báo trước khi trả phòng', h.baoTruoc + ' ngày')}
      <div class="field"><label class="label" for="ngay">Ngày thu tiền hằng tháng</label><select class="select" id="ngay"><option>Theo kỳ của toà (ngày 25)</option></select></div></div>
      <div class="wiz-f"><a class="btn btn-ghost" href="${go(S.role, 'hop-dong')}">Huỷ</a><span class="push"></span><button class="btn btn-secondary" data-act="noop">${ic('chevron-left', 'ic-sm')}Quay lại</button><button class="btn btn-primary" data-act="noop">Tiếp: Dịch vụ áp dụng${ic('chevron-right', 'ic-sm')}</button></div></section>`;
    const sum = `<section class="card" aria-labelledby="w3"><h2 class="h3" id="w3" style="margin-bottom:8px">Tóm tắt</h2><div class="sumrow"><span>Phòng</span><b>${h.phong} · ${H(h.toa)}</b></div><div class="sumrow"><span>Người thuê</span><b>${H(h.nguoi)}</b></div><div class="sumrow"><span>Thời hạn</span><b>${dmy(h.bd)} – ${dmy(h.kt)}</b></div><div class="sumrow"><span>Giá thuê</span><b>${vnd(h.gia)}</b></div><div class="sumrow"><span>Tiền cọc</span><b>${vnd(h.coc)}</b></div><div class="sumrow"><span>Dịch vụ</span><b class="t-3">bước 3</b></div>
      <p class="t-meta" style="margin-top:12px">Lưu nháp tự động. Hợp đồng ở trạng thái Chờ ký cho tới khi hai bên ký.</p></section>`;
    return crumb(go(S.role, 'hop-dong'), 'Hợp đồng', 'Tạo hợp đồng') + `<h1 class="h1">Tạo hợp đồng</h1>` + `<div class="wiz">${nav}${form}${sum}</div>`;
  }

  /* ---------- Trang phụ: Không có quyền, trạng thái rỗng/lỗi, màn giữ nội dung cũ ---------- */
  function khongCoQuyen() {
    return `<section class="card"><div class="state"><span class="ill">${ic('lock', 'ic-lg')}</span><h1 class="h2">Trang này dành cho vai trò khác</h1><p>Đường dẫn <b>/phong</b> thuộc vai trò Quản lý toà nhà. Bạn đang đăng nhập với vai trò ${ROLE_NAME[S.role]}; phòng của bạn nằm trong Toà &amp; phòng.</p><div class="row"><a class="btn btn-primary" href="${go(S.role, 'toa-nha')}">Mở Toà &amp; phòng</a><a class="btn btn-ghost" href="${go(S.role, HOME[S.role])}">Về Hôm nay</a></div></div></section>`;
  }
  function trangThai() {
    return ph('Trạng thái nội dung', 'Mẫu dùng chung cho mọi danh sách: đang tải, rỗng, lỗi, thiếu quyền một phần') + `<div class="states3">
      <section class="card"><div class="lab">Đang tải</div><div style="padding:16px 20px 20px;display:grid;gap:14px" aria-busy="true" aria-label="Đang tải danh sách">${[70, 55, 80, 60].map((w) => `<div class="row" style="gap:12px"><span class="skel" style="width:32px;height:32px;border-radius:50%"></span><div style="flex:1;display:grid;gap:6px"><span class="skel skel-line" style="width:${w}%"></span><span class="skel skel-line" style="width:${w - 25}%;height:10px"></span></div></div>`).join('')}</div></section>
      <section class="card"><div class="lab">Rỗng</div><div class="state" style="padding:20px"><span class="ill">${ic('check-circle', 'ic-lg')}</span><h2 class="h3">Không ai còn nợ</h2><p class="t-sm">Mọi hoá đơn của An Nhiên Residence đã thu đủ.</p><a class="btn btn-secondary btn-sm" href="${go(S.role, 'tien', '?tab=da-thu')}">Xem đã thu</a></div></section>
      <section class="card"><div class="lab">Lỗi tải</div><div class="state" style="padding:20px"><span class="ill red">${ic('alert', 'ic-lg')}</span><h2 class="h3">Không tải được danh sách hoá đơn</h2><p class="t-sm">Máy chủ không phản hồi. Dữ liệu chưa bị thay đổi.</p><button class="btn btn-secondary btn-sm" data-act="noop">${ic('refresh', 'ic-sm')}Thử lại</button></div></section></div>
      <section class="card"><div class="lab" style="padding:0 0 8px">Thiếu quyền một phần</div><div class="banner banner-info">${ic('info')}<div>Báo cáo chi phí bảo trì chỉ tính các toà bạn được phân công (1/3 toà).</div></div></section>`;
  }
  const PLACE = {
    'toa-nha': ['Toà & phòng', 'Danh sách toà → hồ sơ toà (sơ đồ phòng) → hồ sơ phòng.', ['/toa-nha', '/phong (Quản lý)'], [['An Nhiên Residence', 'toa-nha/3'], ['Phòng 101', 'phong/1']]],
    'phong': ['Phòng', 'Lưới phòng theo tầng → hồ sơ phòng.', ['/phong'], [['Sơ đồ An Nhiên', 'toa-nha/3'], ['Phòng 101', 'phong/1']]],
    'nguoi-thue': ['Người thuê', 'Bảng gọn: tên, phòng, nợ, hợp đồng; bấm hàng mở hồ sơ 360°. Tab Khai báo cư trú.', ['/nguoi-thue', '/cu-tru'], [['Trần Quang Huy', 'nguoi-thue/1'], ['Nguyễn Quang Huy', 'nguoi-thue/71']]],
    'hop-dong': ['Hợp đồng', 'Bảng hợp đồng đã duyệt giữ nguyên; bấm hàng mở hồ sơ hợp đồng; “Tạo hợp đồng” mở luồng 5 bước.', ['/hop-dong'], [['Hợp đồng #1', 'hop-dong/1'], ['Tạo hợp đồng', 'hop-dong/moi']]],
    'lich-hen': ['Lịch hẹn', 'Danh sách theo ngày; lịch chờ xác nhận lên đầu.', ['/lich-hen'], []],
    'an-toan': ['An toàn PCCC', 'Hồ sơ PCCC, thiết bị, kiểm tra định kỳ: tab thay cho 3 bảng chồng.', ['/an-toan'], []],
    'bao-cao': ['Báo cáo', 'Tab: Tổng quan (màn Tổng quan Chủ vòng 2 đã duyệt, giữ nguyên) · Tiêu thụ điện nước · Chi phí bảo trì · Nhật ký thao tác.', ['/tong-quan', '/bao-cao', '/bao-cao/tieu-thu', '/bao-cao/chi-phi-bao-tri', '/nhat-ky-thao-tac'], []],
    'cai-dat': ['Dịch vụ & đơn giá', 'Danh mục dịch vụ, bảng giá, bậc thang. Phần “kỳ” chuyển sang Chu kỳ tháng.', ['/dich-vu'], []],
    'thong-bao-cu-dan': ['Thông báo cư dân', 'Soạn và xem thông báo gửi cư dân. Thông báo của chính mình xem ở chuông.', ['/thong-bao'], []],
    'tai-khoan': ['Tài khoản', `Bảng tài khoản đã duyệt giữ nguyên (${Object.values(D.users).reduce((a, b) => a + b, 0)} tài khoản).`, ['/tai-khoan'], []],
    'nhat-ky': ['Nhật ký thao tác', 'Bảng lọc theo ngày, người, loại thao tác.', ['/nhat-ky-thao-tac'], []],
  };
  function placeholder() {
    const p = PLACE[S.page];
    if (!p) return khongCoQuyen();
    return ph(p[0], p[1]) + `<section class="card"><div class="blk-h"><h2>Màn này giữ nội dung hiện có, chỉ đổi chỗ trong menu</h2></div><p class="t-sm t-2" style="margin-top:6px">Gộp từ đường dẫn cũ: ${p[2].map((x) => `<b>${x}</b>`).join(', ')} (đường dẫn cũ vẫn mở được, tự chuyển về đây).</p>
      ${p[3].length ? `<div class="row" style="margin-top:14px">${p[3].map(([l, h], i) => `<a class="btn ${i ? 'btn-secondary' : 'btn-primary'} btn-sm" href="${go(S.role, h)}">${l}</a>`).join('')}</div>` : ''}</section>`;
  }

  /* ---------- Điện thoại ---------- */
  function mShell(title, sub, body, active) {
    const n = D.tbCount[S.role] || 0;
    const items = NAV[S.role] || [];
    return `<div class="m-app"><header class="m-top"><div class="h-title">${title}<div class="h-sub">${sub}</div></div>${S.role === 'NGUOI_THUE' ? `<button class="icon-btn has-n touch" data-act="tb" aria-label="Thông báo, ${n} chưa đọc">${ic('bell')}<b>${n}</b></button>` : ''}<button class="icon-btn touch" data-act="role" aria-label="Tài khoản, đổi vai trò xem thử">${ic('user')}</button></header>
      <main class="m-body">${body}</main>${items.length ? `<nav class="bottom-nav" aria-label="Điều hướng chính">${items.map((m) => `<a href="${go(S.role, m.id)}"${m.id === active ? ' aria-current="page"' : ''}>${ic(m.icon)}<span>${m.nhan}</span>${m.n ? `<b class="count" aria-label="${m.n} mới">${m.n}</b>` : ''}</a>`).join('')}</nav>` : ''}</div>`;
  }
  function thoViec() {
    const k = D.tho.kpi, v = D.tho.viec;
    const urgent = v.filter((x) => x.mucDo !== 'THUONG');
    const f = S.q.get('loc') || 'gap';
    const list = f === 'gap' ? urgent : v;
    const stepOf = (x) => (x.trangThaiHieuLuc === 'DA_PHAN_CONG' ? 0 : x.giaTriBaoGia ? 2 : 1);
    const STEP = ['Khảo sát', 'Báo giá', 'Sửa', 'Nhận tiền'];
    const NEXT = ['Bắt đầu khảo sát', 'Gửi báo giá', 'Báo đã sửa xong'];
    const body = `<div class="m-sum"><div><div class="v">${k.dangXuLy}</div><div class="k">đang làm</div></div><div><div class="v">${v.filter((x) => !x.giaTriBaoGia).length}</div><div class="k">chưa báo giá</div></div><div><div class="v">${(k.conPhaiTra / 1e6).toFixed(2).replace('.', ',')} tr</div><div class="k">còn được trả</div></div></div>
      <nav class="seg seg-links" aria-label="Lọc việc">${[['gap', `Gấp (${urgent.length})`], ['all', `Đang làm (${v.length})`], ['xong', `Xong (${D.tho.xong})`]].map(([k2, l]) => `<a href="${go('THO', 'viec', '?loc=' + k2)}"${f === k2 ? ' aria-current="true"' : ''}>${l}</a>`).join('')}</nav>
      ${list.slice(0, 4).map((x, i) => { const s = stepOf(x); return `<article class="job"><div class="row" style="gap:8px">${x.mucDo !== 'THUONG' ? tag(x.mucDo === 'KHAN_CAP' ? 'danger' : 'warning', x.tenMucDo, 'alert') : ''}${tag('info', x.tenTrangThaiHieuLuc)}<span class="push t-meta">${dm(x.taoLuc)}</span></div>
        <div><div class="t">${H(x.hangMuc)}</div><div class="s">${H(x.toaNha)} · Phòng ${x.soPhong} · Tầng ${x.tang}</div><div class="s">${H(x.nguoiLienHeHoTen)} · ${x.soDienThoaiLienHe}</div></div>
        <div class="dots" aria-label="Bước ${s + 1}/4: ${STEP[s]}">${STEP.map((t, i) => `<i class="${i <= s ? 'on' : ''}"></i>`).join('')}<span>Bước ${s + 1}/4 · ${STEP[s]}</span></div>
        <div class="acts"><a class="icon-btn touch boxed" href="tel:${x.soDienThoaiLienHe}" aria-label="Gọi ${H(x.nguoiLienHeHoTen)}">${ic('phone')}</a><button class="btn ${i ? 'btn-secondary' : 'btn-primary'} btn-touch" data-act="noop">${NEXT[s]}</button></div></article>`; }).join('')}`;
    return mShell('Việc của tôi', `${H(D.me.THO.hoTen)} · 22/11/2026`, body, 'viec');
  }
  function ntCanTra() {
    const hd = D.debtors.find((d) => d.id === 1).hd.slice().reverse(), tong = hd.reduce((a, h) => a + h.conLai, 0);
    const body = `<section class="payhero" aria-labelledby="ct"><div class="row">${tag('danger', `${hd.length} kỳ quá hạn`, 'alert')}</div><h2 class="t-sm t-2" id="ct">Cần trả</h2><div class="amt t-danger">${vnd(tong)}</div><p class="t-sm t-2">Mỗi kỳ còn ${vnd(hd[0].conLai)} sau khi đã trả một nửa. Kỳ cũ nhất hạn ${dmy(hd[hd.length - 1].han)}.</p>
      <a class="btn btn-primary btn-touch btn-block" href="${go('NGUOI_THUE', 'tra', '/' + hd[0].id)}">Trả ${vnd(tong)}</a><a class="btn btn-ghost btn-block" href="${go('NGUOI_THUE', 'tra', '/' + hd[0].id + '?mot=1')}" style="height:44px">Chỉ trả kỳ ${hd[0].ky}</a></section>
      <h2 class="m-h">Các kỳ chưa trả đủ</h2><div class="m-list">${hd.map((h) => `<a class="irow" href="${go('NGUOI_THUE', 'tra', '/' + h.id)}"><div class="body"><div class="t">Kỳ ${h.ky}</div><div class="s">Hạn ${dmy(h.han)} · đã trả ${vnd(h.daThu)}</div></div><div class="end"><div class="money">${vnd(h.conLai)}</div><div class="t-meta" style="color:var(--ma-urgent)">trễ ${h.tre} ngày</div></div>${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}</div>
      <h2 class="m-h">Kỳ 10/2026 gồm</h2><div class="m-list">${D.ntHoaDon.cacDong.map((c) => `<div class="irow"><div class="body"><div class="t">${H(c.tenKhoan.replace('Tien phong', 'Tiền phòng').replace(' ngay', ' ngày').replace('Lam tron', 'Làm tròn'))}</div>${c.soLuong ? `<div class="s">${c.chiSoDau ? `${num(+c.chiSoDau)} → ${num(+c.chiSoCuoi)} · ` : ''}${num(+c.soLuong)} × ${vnd(+c.donGia)}</div>` : ''}</div><div class="money">${vnd(+c.thanhTien)}</div></div>`).join('')}</div>`;
    return mShell('Phòng 101', 'An Nhiên Residence · Trần Quang Huy', body, 'can-tra');
  }
  function ntTra() {
    const h = D.ntHoaDon, mot = S.q.has('mot');
    const tong = mot ? +h.conLai : D.debtors.find((d) => d.id === 1).tong;
    const body = `<div class="mstep" aria-label="Bước 2/3: Chuyển khoản"><span class="on"></span><span class="on"></span><span></span></div><p class="t-sm t-2">Bước 2/3 · Chuyển khoản</p>
      <section class="payhero"><div class="t-sm t-2">Số tiền</div><div class="amt">${vnd(tong)}</div><p class="t-sm t-2">${mot ? 'Kỳ 10/2026' : '4 kỳ 07–10/2026'} · nội dung chuyển khoản: <b>${H(h.maHoaDon)}</b></p>
        <div class="qr">${ic('qr', 'ic-lg')}<span>Mã QR chuyển khoản<br>chờ API B2 (hiện báo 404)</span></div>
        <div class="sumrow"><span>Ngân hàng</span><b>Mã 970422</b></div><div class="sumrow"><span>Số tài khoản</span><b>000000000000000</b></div><div class="sumrow"><span>Chủ tài khoản</span><b>Theo hồ sơ toà</b></div></section>
      <button class="btn btn-primary btn-touch btn-block" data-act="noop">Tôi đã chuyển khoản</button><p class="t-meta" style="text-align:center">Quản lý xác nhận rồi hoá đơn chuyển sang “Đã thu”. Bước 3/3: chờ xác nhận.</p>`;
    return mShell('Trả tiền', 'Phòng 101 · An Nhiên Residence', body, 'can-tra');
  }
  function qlGhiMobile() {
    const ct = D.ql.congTo, m = ct.danhSachChuaGhi[0];
    const body = `<div class="mstep" aria-label="Chu kỳ tháng, bước 1/4"><span class="on"></span><span></span><span></span><span></span></div><p class="t-sm t-2">Chu kỳ 11/2026 · Bước 1/4 Ghi chỉ số · ${ct.soCongToDaGhi}/${ct.tongSoCongTo}</p>
      <section class="m-card" style="display:grid;gap:12px"><div class="row"><div><div class="h3">Phòng ${m.tenViTri} · ${H(m.tenDichVu)}</div><div class="t-meta">Phòng đang sửa · kỳ trước chưa có số</div></div><span class="push">${tag('warning', 'Chưa ghi', 'clock')}</span></div>
        <label class="label" for="cs">Chỉ số mới</label><div class="meter-wrap"><input class="meter-input" id="cs" inputmode="numeric" value="0"><span class="unit-tag">${m.donVi}</span></div>
        <button class="btn btn-secondary btn-touch" data-act="noop">${ic('camera')}Chụp ảnh công tơ</button></section>
      <h2 class="m-h">Còn lại</h2><div class="m-list">${ct.danhSachChuaGhi.slice(1).map((c) => `<div class="irow"><span class="tile">${ic(c.donVi === 'kWh' ? 'bolt' : 'droplet')}</span><div class="body"><div class="t">Phòng ${c.tenViTri} · ${H(c.tenDichVu)}</div><div class="s">${c.tenViTri === '401' ? 'phòng trống' : 'phòng đang sửa'}</div></div></div>`).join('')}</div>
      <div style="height:72px"></div><div class="sticky-act" style="bottom:0"><button class="btn btn-primary btn-touch btn-block" data-act="noop">Lưu, sang 401 · Điện</button></div>`;
    return `<div class="m-app" style="padding-bottom:16px"><header class="m-top"><a class="icon-btn touch" href="${go('QUAN_LY', 'chu-ky')}" aria-label="Về Chu kỳ tháng">${ic('chevron-left')}</a><div class="h-title">Ghi chỉ số<div class="h-sub">An Nhiên Residence · còn ${ct.soCongToChuaGhi} công tơ</div></div></header><main class="m-body">${body}</main></div>`;
  }
  function mPlace(title, text, active) { return mShell(title, '', `<section class="m-card"><p class="t-sm t-2">${text}</p></section>`, active); }

  /* ---------- Lớp phủ: Ctrl+K, thông báo, chọn toà, vai trò ---------- */
  function searchIndex() {
    const out = [];
    D.nguoiThue.forEach((n) => { const h = D.hopDong.find((x) => x.nguoiId === n.id && x.tt === 'HIEU_LUC'); out.push(['Người thuê', n.ten, h ? `${h.toa} · Phòng ${h.phong}` : n.sdt, 'user', go(S.role, 'nguoi-thue', '/' + n.id)]); });
    D.phong3.forEach((p) => out.push(['Phòng', `Phòng ${p.soPhong}`, `An Nhiên Residence · ${p.tenTrangThai}`, 'door', go(S.role, 'phong', '/' + p.id)]));
    D.hopDong.forEach((h) => out.push(['Hợp đồng', `Hợp đồng #${h.id} · ${h.nguoi}`, `${h.toa} · Phòng ${h.phong} · ${h.tenTt}`, 'contract', go(S.role, 'hop-dong', '/' + h.id)]));
    D.hoaDon.forEach((h) => out.push(['Hoá đơn', h.ma, `${h.nguoi} · ${h.toa} · còn ${vnd(h.conLai)}`, 'receipt', go(S.role, 'tien', '?tab=hoa-don')]));
    return out;
  }
  const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  function cmdk(q) {
    const f = fold(q.trim());
    const hits = f ? searchIndex().filter((x) => fold(x[1] + ' ' + x[2]).includes(f)) : [];
    const groups = {};
    hits.forEach((x) => { (groups[x[0]] = groups[x[0]] || []).push(x); });
    const mark = (s) => { if (!f) return H(s); const i = fold(s).indexOf(f); return i < 0 ? H(s) : H(s.slice(0, i)) + '<mark>' + H(s.slice(i, i + f.length)) + '</mark>' + H(s.slice(i + f.length)); };
    let first = true;
    const res = Object.entries(groups).map(([g, xs]) => `<div class="cmdk-g">${g} · ${xs.length}</div>` + xs.slice(0, 4).map((x) => { const on = first; first = false; return `<a class="cmdk-i${on ? ' on' : ''}" href="${x[4]}">${ic(x[3])}<span class="grow"><span class="t" style="display:block">${mark(x[1])}</span><span class="s">${mark(x[2])}</span></span>${on ? '<span class="search-kbd">Enter</span>' : ''}</a>`; }).join('')).join('');
    const cmds = `<div class="cmdk-g">Lệnh</div><a class="cmdk-i" href="${go(S.role, 'nguoi-thue', '/1')}">${ic('wallet')}<span class="grow"><span class="t">Ghi nhận thu tiền</span></span></a><a class="cmdk-i" href="${go(S.role, 'hop-dong', '/moi')}">${ic('plus')}<span class="grow"><span class="t">Tạo hợp đồng</span></span></a><a class="cmdk-i" href="${go(S.role, 'su-co')}">${ic('wrench')}<span class="grow"><span class="t">Báo sự cố</span></span></a>`;
    return (f && !hits.length ? `<p class="t-sm t-2" style="padding:16px 10px">Không thấy “${H(q)}” trong dữ liệu đã tải.</p>` : res) + cmds;
  }
  function overlays() {
    let h = '';
    if (S.q.has('k')) {
      const q = S.q.get('k');
      h += `<div class="cmdk-wrap" data-act="close"><div class="cmdk" role="dialog" aria-modal="true" aria-label="Tìm nhanh"><div class="cmdk-in">${ic('search')}<label class="sr-only" for="kq">Tìm người thuê, phòng, hợp đồng, hoá đơn</label><input id="kq" value="${H(q)}" placeholder="Tìm người thuê, phòng, hợp đồng, hoá đơn…" autocomplete="off"><span class="search-kbd">Esc</span></div>
        <div class="cmdk-list" id="kres">${cmdk(q)}</div><div class="cmdk-f"><span>↑ ↓ chọn</span><span>Enter mở</span><span>Esc đóng</span><span class="push">Tìm trên dữ liệu đã tải · 3 toà</span></div></div></div>`;
    }
    if (S.q.has('tb')) {
      const tb = D.thongBaoQL;
      h += `<div class="pop" style="top:64px;right:16px" role="dialog" aria-label="Thông báo"><div class="pop-h"><h2 class="h3">Thông báo</h2><span class="t-meta">${D.tbCount[S.role]} chưa đọc</span><button class="btn btn-ghost btn-sm push" data-act="noop">Đánh dấu đã đọc</button></div>
        ${(S.role === 'QUAN_LY' ? tb.ds.slice(0, 5) : []).map((t) => `<a class="irow" href="${go(S.role, 'tien')}"><span class="unread" aria-label="Chưa đọc"></span><div class="body"><div class="t">${H(t.tieuDe)}</div><div class="s">${H(t.noiDung)}</div></div><span class="t-meta">${dm(t.taoLuc)}</span></a>`).join('') || '<p class="note">Không có thông báo mới.</p>'}
        <p class="note">Bấm một thông báo để mở đúng hoá đơn / sự cố liên quan.</p></div>`;
    }
    if (S.q.has('toa')) {
      const cur = toaSel();
      h += `<div class="pop" style="top:68px;left:26px;width:300px" role="dialog" aria-label="Chọn toà"><div class="pop-h"><h2 class="h3">Xem theo toà</h2></div>
        ${[['', 'Tất cả 3 toà', '36 phòng']].concat(D.toa.map((t) => [t.ten, t.ten, `${t.soPhong} phòng · ${t.dangThue} đang thuê`])).map(([v, l, s]) => `<a class="irow" href="#" data-toa="${H(v)}">${ic('building')}<div class="body"><div class="t">${l}</div><div class="s">${s}</div></div>${v === cur ? ic('check', 'ic-sm') : ''}</a>`).join('')}
        <p class="note">Lựa chọn được nhớ cho mọi trang và lần đăng nhập sau.</p></div>`;
    }
    if (S.q.has('role')) {
      h += `<div class="pop" style="${MOBILE[S.role] || S.page === 'ghi-chi-so-m' ? 'top:56px;right:8px;width:300px' : 'bottom:72px;left:26px;width:300px'}" role="dialog" aria-label="Đổi vai trò xem thử"><div class="pop-h"><h2 class="h3">Xem thử với vai trò</h2></div>
        ${Object.entries(ROLE_NAME).map(([r, n]) => `<a class="irow" href="${go(r, HOME[r])}">${av(D.me[r].hoTen, 'sm')}<div class="body"><div class="t">${n}</div><div class="s">${H(D.me[r].hoTen)}</div></div>${r === S.role ? ic('check', 'ic-sm') : ''}</a>`).join('')}
        <a class="irow" href="#/">${ic('layers')}<div class="body"><div class="t">Mục lục bản xem trước</div></div></a><div class="irow">${ic('logout')}<div class="body"><div class="t">Đăng xuất</div></div></div></div>`;
    }
    return h;
  }

  /* ---------- Mục lục ---------- */
  const SCREENS = [
    ['Khung & điều hướng', [['CHU', 'hom-nay', 'Chủ · Hôm nay (màn bắt đầu mới)'], ['CHU', 'hom-nay?k=huy', 'Tìm nhanh Ctrl+K'], ['CHU', 'hom-nay?toa=1', 'Chọn toà một lần ở khung'], ['QUAN_LY', 'hom-nay?tb=1', 'Thông báo có số'], ['CHU', 'khong-co-quyen', 'Không có quyền'], ['CHU', 'trang-thai', 'Trạng thái rỗng / lỗi / đang tải']]],
    ['Tiền', [['CHU', 'tien', 'Thu tiền · Cần thu (nhóm theo người)'], ['CHU', 'tien?sel=1', 'Thu tiền · đang chọn 2 người'], ['CHU', 'tien?tab=hoa-don', 'Thu tiền · Hoá đơn'], ['QUAN_LY', 'chu-ky', 'Quản lý · Chu kỳ tháng'], ['QUAN_LY', 'ghi-chi-so-m', 'Quản lý · Ghi chỉ số (điện thoại)']]],
    ['Hồ sơ 360°', [['CHU', 'nguoi-thue/1', 'Người thuê · Trần Quang Huy'], ['CHU', 'phong/1', 'Phòng 101'], ['CHU', 'hop-dong/1', 'Hợp đồng #1'], ['CHU', 'toa-nha/3', 'Toà An Nhiên Residence']]],
    ['Luồng', [['QUAN_LY', 'hom-nay', 'Quản lý · Hôm nay'], ['QUAN_LY', 'su-co/SC-202611-0001', 'Sự cố · danh sách + ngăn chi tiết'], ['QUAN_LY', 'hop-dong/moi', 'Tạo hợp đồng · bước 2/5'], ['THO', 'viec', 'Thợ · Việc của tôi (điện thoại)'], ['NGUOI_THUE', 'can-tra', 'Khách thuê · Cần trả (điện thoại)'], ['NGUOI_THUE', 'tra/31', 'Khách thuê · Trả tiền bước 2/3']]],
  ];
  function toc() {
    return `<main class="toc"><div><h1 class="h1">MiniApart · UX v2 — bản xem trước</h1><p class="t-2" style="margin-top:6px">Bấm thử: menu, hàng trong bảng, tab, Ctrl+K, chọn toà, chuông, đổi vai trò (nút ⋮ ở chân sidebar). Số liệu GET thật từ stack demo lúc ${D.capNhat}.</p></div>
      ${SCREENS.map(([g, xs]) => `<section class="card"><h2 class="h3" style="margin-bottom:8px">${g}</h2><div class="toc-grid">${xs.map(([r, p, l]) => `<a class="irow" href="${go(r, p)}">${ic(MOBILE[r] || p.includes('-m') ? 'phone' : 'dashboard')}<div class="body"><div class="t">${l}</div><div class="s">${ROLE_NAME[r]}</div></div>${ic('chevron-right', 'ic-sm chev')}</a>`).join('')}</div></section>`).join('')}
      <section class="card"><h2 class="h3" style="margin-bottom:8px">Đường dẫn cũ vẫn mở được (tự chuyển)</h2><div class="toc-grid">${['/hoa-don', '/cong-no', '/thu-tien', '/ghi-chi-so', '/nhac-viec', '/tong-quan'].map((p) => `<a class="irow" href="#${p}">${ic('arrow-right')}<div class="body"><div class="t">${p}</div><div class="s">→ ${LEGACY[p]}</div></div></a>`).join('')}</div></section></main>`;
  }

  /* ---------- Định tuyến ---------- */
  const DESK = { 'hom-nay': homNay, tien, 'chu-ky': chuKy, 'nguoi-thue': () => (S.id ? nguoiThue360() : placeholder()), phong: () => (S.id ? phong360() : S.role === 'CHU' ? khongCoQuyen() : placeholder()) /* CHU không có route /phong (giữ quyền app), chỉ vào hồ sơ phòng từ Toà & phòng */, 'hop-dong': () => (S.id ? hopDong360() : placeholder()), 'toa-nha': () => (S.id ? toa360() : placeholder()), 'su-co': suCo, 'khong-co-quyen': khongCoQuyen, 'trang-thai': trangThai };
  function render() {
    const raw = location.hash.slice(1) || '/';
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const app = document.getElementById('app');
    if (!parts.length) { document.title = 'Mục lục · UX v2 MiniApart'; app.innerHTML = toc(); return; }
    if (!ROLE_NAME[parts[0]]) { // đường dẫn cũ của app → vị trí mới
      const role = localStorage.getItem('ma.role') || 'CHU';
      const to = LEGACY['/' + parts.join('/')];
      location.replace(to ? go(role, to) : go(role, 'khong-co-quyen'));
      return;
    }
    S = { role: parts[0], page: parts[1] || HOME[parts[0]], id: parts.slice(2).join('/') || null, q: new URLSearchParams(qs || '') };
    localStorage.setItem('ma.role', S.role);
    let html;
    if (S.role === 'THO') html = S.page === 'viec' ? thoViec() : mPlace(S.page === 'tien-cong' ? 'Tiền công' : 'Thông báo', S.page === 'tien-cong' ? 'Báo giá & thanh toán (giữ nội dung /tho/chi-phi): còn được trả 2.085.000 ₫, đã nhận 2.475.000 ₫.' : '9 thông báo việc mới được phân công.', S.page);
    else if (S.role === 'NGUOI_THUE') html = S.page === 'can-tra' ? ntCanTra() : S.page === 'tra' ? ntTra() : mPlace(S.page === 'bao-hong' ? 'Báo hỏng' : 'Phòng của tôi', S.page === 'bao-hong' ? 'Form báo hỏng ở trên, 12 yêu cầu của bạn ở dưới (giữ nội dung /bao-hong).' : 'Hợp đồng (tải PDF) + Tiêu thụ điện nước, gộp /hop-dong và /tieu-thu.', S.page);
    else if (S.page === 'ghi-chi-so-m') html = qlGhiMobile();
    else html = `<div class="app ux${S.q.has('nav') ? ' nav-open' : ''}">${sidebar()}<main class="main">${topbar()}${(DESK[S.page] || placeholder)()}</main></div>`;
    app.innerHTML = html + overlays();
    const t = app.querySelector('h1');
    document.title = `${t ? t.textContent.trim() : S.page} · ${ROLE_NAME[S.role]} · MiniApart`;
    const kq = document.getElementById('kq');
    if (kq) { kq.focus(); kq.setSelectionRange(kq.value.length, kq.value.length); kq.oninput = () => { document.getElementById('kres').innerHTML = cmdk(kq.value); }; }
  }
  const setQ = (k, v) => { const q = new URLSearchParams(S.q); if (v == null) q.delete(k); else q.set(k, v); const s = q.toString(); location.hash = `/${S.role}/${S.page}${S.id ? '/' + S.id : ''}${s ? '?' + s : ''}`; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act], [data-toa]');
    if (!a) return;
    if (a.dataset.toa !== undefined) { e.preventDefault(); if (a.dataset.toa) localStorage.setItem('ma.toa', a.dataset.toa); else localStorage.removeItem('ma.toa'); setQ('toa', null); return; }
    const act = a.dataset.act;
    if (act === 'close' && e.target !== a) return;
    e.preventDefault();
    if (act === 'noop') return;
    if (act === 'close') { setQ('k', null); return; }
    ['k', 'tb', 'toa', 'role', 'nav'].forEach((x) => { if (x !== act) S.q.delete(x); });
    setQ(act, S.q.has(act) ? null : act === 'k' ? '' : '1');
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (ROLE_NAME[S.role] && !MOBILE[S.role]) setQ('k', S.q.has('k') ? null : ''); }
    if (e.key === 'Escape') ['k', 'tb', 'toa', 'role', 'nav'].forEach((x) => S.q.has(x) && setQ(x, null));
    if (e.key === 'Enter' && document.activeElement?.id === 'kq') { const on = document.querySelector('.cmdk-i.on'); if (on) location.hash = on.getAttribute('href'); }
  });
  window.addEventListener('hashchange', render);
  render();
})();
