/* MiniApart V3 — bản bấm thử. Không build, không mạng: mở index.html là chạy. Lõi + khung + màn Chủ nhà / Quản lý. */
const D = window.D
const M = {} // bảng màn: 'vai/ten' → hàm trả { tieuDe, html, chinh? }
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const so = (n) => Math.round(n).toLocaleString('vi-VN')
const tien = (n, cls = '') => `<span class="so ${cls}">${so(n)}<span class="d">₫</span></span>`
const ngay = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—')
const ngayNgan = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`
const sdt = (s) => (s ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : '—')
const dau = (ten) => ten.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase()
const tong = (a, f) => a.reduce((s, x) => s + f(x), 0)
const pt = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const IC = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', vi: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2zm14 7h.01',
  toa: 'M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8 7h4M8 11h4M8 15h4', nguoi: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  giay: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6', sua: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  bieu: 'M4 20V10M10 20V4M16 20v-7M22 20H2', tim: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', chuong: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0',
  goi: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z', tin: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z',
  xong: 'M5 12.5l4.5 4.5L19 7.5', phai: 'M9 6l6 6-6 6', xuong: 'M6 9l6 6 6-6', dong: 'M6 6l12 12M18 6L6 18', them: 'M12 5v14M5 12h14', canh: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  gio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', anh: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  chep: 'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1', menu: 'M4 7h16M4 12h16M4 17h16',
  lich: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4', chinh: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4', tai: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  mang: 'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.6M19 13a10 10 0 0 0-5-2.9M12 20h.01', khoa: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3',
  dien: 'M13 3L5 14h6l-1 7 8-11h-6z', nuoc: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', cho: 'M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ra: 'M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9', lui: 'M15 6l-6 6 6 6', ba: 'M5 12h.01M12 12h.01M19 12h.01',
}
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"/></svg>`
const LOGO = '<svg viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="6" fill="#14181d"/><path d="M7 20.5V10l7 6 7-6v10.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>'

/* ---- trạng thái từ địa chỉ: #/vai/man/tham-so?toa=3&mo=tim ---- */
const P = { vai: 'chu', duong: 'hom-nay', ts: [], q: {} }
function doc() {
  const [d, qs] = location.hash.replace(/^#\/?/, '').split('?')
  const p = (d || 'chu/hom-nay').split('/')
  P.vai = p[0]; P.q = Object.fromEntries(new URLSearchParams(qs || ''))
  if (p[2] && M[`${p[0]}/${p[1]}/${p[2]}`]) { P.khoa = `${p[0]}/${p[1]}/${p[2]}`; P.duong = `${p[1]}/${p[2]}`; P.ts = p.slice(3) } // vd hop-dong/moi
  else if (p[2] && M[`${p[0]}/${p[1]}/:id`]) { P.khoa = `${p[0]}/${p[1]}/:id`; P.duong = p[1]; P.ts = p.slice(2) }
  else { P.duong = p[1] || 'hom-nay'; P.khoa = `${p[0]}/${P.duong}`; P.ts = p.slice(2) }
  if (!M[P.khoa] && M[`${P.khoa}/:id`]) P.khoa += '/:id' // vd #/chu/thang mở bước mặc định
}
const toaChon = () => (P.vai === 'ql' ? D.ql.toaId : P.q.toa ? +P.q.toa : null)
const trongToa = (id) => !toaChon() || toaChon() === id
const L = (duong, o = {}) => { const q = new URLSearchParams({ ...(P.q.toa && !duong.startsWith('ql/') ? { toa: P.q.toa } : {}), ...o }).toString(); return `#/${duong}${q ? '?' + q : ''}` }
const V = (duong, o) => L(`${P.vai}/${duong}`, o) // liên kết trong cùng vai trò
const mo = (ten, o = {}) => L(`${P.vai}/${[P.duong, ...P.ts].join('/')}`, { ...P.q, mo: ten, ...o })
const T = (id) => D.toa.find((t) => t.id === +id)
const tenToa = () => (toaChon() ? T(toaChon()).ten : `Cả ${D.toa.length} toà`)
const noTrong = () => D.no.filter((n) => trongToa(n.toaId))
const hdThang = (th, toaId) => D.hoaDon.filter((h) => h.thang === th && (toaId ? h.toaId === toaId : trongToa(h.toaId)))
const TT_HD = { HIEU_LUC: ['ok', 'Đang hiệu lực'], CHO_KY: ['canh', 'Chờ ký'], DA_THANH_LY: ['', 'Đã thanh lý'] }
const TT_SC = { MOI_TIEP_NHAN: ['no', 'Mới báo', 1], DA_TIEP_NHAN: ['canh', 'Đã nhận, chưa giao thợ', 2], DA_PHAN_CONG: ['xl', 'Đã giao thợ', 3], DANG_XU_LY: ['xl', 'Đang sửa', 6], CHO_XAC_NHAN: ['canh', 'Chờ nghiệm thu', 7], DA_DONG: ['ok', 'Đã xong', 8] }
const BUOC_SC = ['Báo hỏng', 'Tiếp nhận', 'Giao thợ', 'Báo giá', 'Duyệt', 'Sửa', 'Nghiệm thu', 'Trả tiền thợ']
const nhan = (loai, chu) => `<span class="nhan ${loai}">${chu}</span>`
const cham = (loai, chu) => `<span class="nw"><i class="cham ${loai}"></i>${chu}</span>`
const the = (tieuDe, than, phai = '', phu = '') => `<section class="the"><div class="td"><h2 class="h2">${tieuDe}</h2>${phu ? `<span class="s">${phu}</span>` : ''}<span class="gian"></span>${phai}</div>${than}</section>`
const kv = (cap) => `<dl class="kv">${cap.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`
const bang = (cot, hang, { tongHang = '', lop = '' } = {}) => `<table class="b ${lop}"><thead><tr>${cot.map((c) => `<th class="${c[1] || ''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${hang.join('')}${tongHang}</tbody></table>`
const dauTrang = (tieuDe, phu, phai = '') => `<header class="dau"><div class="gian"><h1 class="h1">${tieuDe}</h1>${phu ? `<p class="s">${phu}</p>` : ''}</div>${phai}</header>`
const thanh = (a, b, lop = '') => `<span class="thanh ${lop}" role="img" aria-label="Đã thu ${pt(a, b)}%"><i style="width:${pt(a, b)}%"></i><b style="width:${100 - pt(a, b)}%"></b></span>`
const nutGoi = (so_, nhan_ = '') => `<a class="nut ${nhan_ ? '' : 'vuong'}" href="tel:${so_}" aria-label="Gọi ${sdt(so_)}" title="Gọi ${sdt(so_)}">${ic('goi')}${nhan_}</a>`
const chuaVe = (ten) => ({ tieuDe: ten, html: dauTrang(ten, 'Màn này chưa vẽ lại trong V3.') + `<div class="rong">Giữ chức năng của màn hiện tại, khoác hệ thiết kế mới (chữ, màu, bảng, nút). Danh sách màn chưa vẽ nằm trong README.</div>` })

/* ---- điều hướng theo vai trò ---- */
const soCanQuyet = () => D.suCo.filter((s) => trongToa(s.toaId) && (s.tt === 'MOI_TIEP_NHAN' || s.tt === 'DA_TIEP_NHAN')).length + (trongToa(3) ? 1 : 0)
const NAV = {
  chu: () => [['hom-nay', 'Hôm nay', 'home'], ['tien', 'Tiền', 'vi'], ['toa', 'Toà & phòng', 'toa'], ['nguoi', 'Người thuê', 'nguoi'], ['hop-dong', 'Hợp đồng', 'giay'], ['su-co', 'Sự cố', 'sua', soCanQuyet()], ['bao-cao', 'Báo cáo', 'bieu']],
  ql: () => [['hom-nay', 'Hôm nay', 'home'], ['thang/1', 'Tháng 11', 'lich'], ['tien', 'Thu tiền', 'vi'], [`toa/${D.ql.toaId}`, 'Phòng', 'toa'], ['nguoi', 'Người thuê', 'nguoi'], ['hop-dong', 'Hợp đồng', 'giay'], ['lich-xem', 'Lịch xem phòng', 'gio', D.ql.lichHen.filter((x) => x.tt === 'CHO_XAC_NHAN').length, 'xam'], ['su-co', 'Sự cố', 'sua', soCanQuyet() - 1]],
  qt: () => [['tai-khoan', 'Tài khoản', 'nguoi'], ['toa', 'Toà nhà', 'toa'], ['nhat-ky', 'Nhật ký', 'giay']],
}
const dangO = (d) => P.duong === d || P.duong.split('/')[0] === d.split('/')[0] || (d === 'toa' && P.duong === 'phong') || (d.startsWith('toa') && P.vai === 'ql' && P.duong === 'phong')
function khung(m) {
  const toi = D.me[{ chu: 'CHU', ql: 'QUAN_LY', qt: 'QTHT' }[P.vai]]
  const muc = NAV[P.vai]().map(([d, n, i, dem, lop]) => `<a href="${V(d)}" class="${dangO(d) ? 'on' : ''}">${ic(i)}<span>${n}</span>${dem ? `<span class="dem ${lop || ''}">${dem}</span>` : ''}</a>`).join('')
  const scope = P.vai === 'qt' ? '' : `<a class="scope" href="${P.vai === 'chu' ? mo('toa') : '#'}" ${P.vai === 'chu' ? 'aria-haspopup="menu"' : 'aria-disabled="true"'}>${ic('toa')}<span class="gian"><span class="m cat" style="display:block">${tenToa()}</span><small>${toaChon() ? `${T(toaChon()).phong.length} phòng` : `${tong(D.toa, (t) => t.phong.length)} phòng`}</small></span>${P.vai === 'chu' ? ic('xuong') : ''}</a>`
  const cuoi = P.vai === 'chu' ? `<a href="${V('cai-dat')}" class="${dangO('cai-dat') ? 'on' : ''}">${ic('chinh')}<span>Giá dịch vụ & cài đặt</span></a>` : P.vai === 'ql' ? `<a href="${V('pccc')}">${ic('canh')}<span>An toàn PCCC</span></a><a href="${V('thong-bao-cu-dan')}">${ic('tin')}<span>Báo cho cư dân</span></a>` : ''
  const mnav = P.vai === 'chu' ? `<nav class="dt-nav mnav" aria-label="Điều hướng">${[['hom-nay', 'Hôm nay', 'home'], ['tien', 'Tiền', 'vi'], ['toa', 'Toà', 'toa'], ['su-co', 'Sự cố', 'sua', soCanQuyet()]].map(([d, n, i, dem]) => `<a href="${V(d)}" class="${dangO(d) ? 'on' : ''}">${ic(i)}<span>${n}</span>${dem ? `<span class="dem">${dem}</span>` : ''}</a>`).join('')}<a href="${mo('them')}" class="${['nguoi', 'hop-dong', 'bao-cao', 'cai-dat'].includes(P.duong.split('/')[0]) ? 'on' : ''}">${ic('menu')}<span>Thêm</span></a></nav>` : ''
  return `<div class="app ${m.chinh ? 'co-chinh' : ''}"><aside class="side"><a class="brand" href="${V(P.vai === 'qt' ? 'tai-khoan' : 'hom-nay')}">${LOGO}MiniApart</a>${scope}
    <a class="tim" href="${mo('tim')}">${ic('tim')}<span class="gian">Tìm người, phòng…</span><kbd>Ctrl K</kbd></a>
    <nav class="nav" aria-label="Điều hướng">${muc}</nav><nav class="nav day">${cuoi}</nav>
    <div class="toi"><span class="av">${dau(toi.hoTen)}</span><span class="gian"><span class="m cat" style="display:block">${toi.hoTen}</span><span class="s">${{ chu: 'Chủ nhà', ql: 'Quản lý toà', qt: 'Quản trị hệ thống' }[P.vai]}</span></span><a class="nut vuong chu" href="#/khung/dang-nhap" aria-label="Đăng xuất" title="Đăng xuất" style="color:var(--phu)">${ic('ra')}</a></div></aside>
    <div style="min-width:0"><div class="mtop">${scope}<a class="nut vuong chu" style="color:var(--muc)" href="${mo('tim')}" aria-label="Tìm">${ic('tim')}</a><a class="nut vuong chu" style="color:var(--muc)" href="${mo('tb')}" aria-label="Thông báo">${ic('chuong')}</a></div>
    <main class="main"><div class="trang">${m.html}</div></main>${mnav}</div></div>`
}

/* ================= CHỦ NHÀ ================= */
const nguoiNo = (n, { rut = false } = {}) => `<div class="dong bam" data-href="${V(`nguoi/${n.id}`)}"><span class="av an-m">${dau(n.ten)}</span><div class="gian"><div class="m">${esc(n.ten)}</div><div class="s">phòng ${n.phong}${toaChon() ? '' : ' · ' + esc(n.toa)} · nợ ${n.hd.length} tháng, từ tháng ${n.hd[0].thang}</div></div>
  <span class="b">${tien(n.tong)}</span>${nutGoi(n.sdt)}<a class="nut ${rut ? 'an-m' : ''}" href="${mo('nhac', { id: n.id })}">${ic('tin')}Nhắc</a></div>`

M['chu/hom-nay'] = () => {
  const no = noTrong(), toas = D.toa.filter((t) => trongToa(t.id)), phong = toas.flatMap((t) => t.phong)
  const tongNo = tong(no, (n) => n.tong), thu11 = tong(hdThang(11), (h) => h.daThu), t10 = hdThang(10)
  const khan = D.suCo.filter((s) => trongToa(s.toaId) && s.khan && s.tt === 'MOI_TIEP_NHAN')
  const hetHan = D.hopDong.filter((h) => trongToa(h.toaId) && h.sapHet && h.tt === 'HIEU_LUC'), choKy = D.hopDong.filter((h) => trongToa(h.toaId) && h.tt === 'CHO_KY')
  const hen = D.lichHen.filter((x) => trongToa(x.toaId) && x.tt === 'CHO_XAC_NHAN'), bg = D.mau.baoGia, scBg = D.suCo.find((s) => s.id === bg.suCoId)
  const pccc = toas.filter((t) => t.pccc.thietBi.some((x) => x.han < D.ngay))
  const viec = [
    toas.some((t) => t.ky11.tt === 'DANG_MO') && ['no', `Hoá đơn tháng 11 chưa gửi`, `Kỳ đã đóng ${ngayNgan(toas[0].ky11.kt)}. ${toas.length > 1 ? toas.length + ' toà' : toas[0].ten} còn ở bước ghi chỉ số.`, 'Xem tiến độ', L('chu/thang/1', toaChon() ? {} : { toa: 3 })],
    khan.length && ['no', `${khan.length} sự cố khẩn chưa giao thợ`, khan.map((s) => `${s.hangMuc} phòng ${s.phong}${toaChon() ? '' : ' ' + s.toa.split(' ').slice(0, 2).join(' ')}`).join(' · '), 'Giao thợ', V(`su-co/${khan[0].id}`)],
    trongToa(scBg.toaId) && ['canh', `Duyệt báo giá ${so(tong(bg.dong, (d) => d.sl * d.gia))} ₫ <span class="mau">minh hoạ</span>`, `${scBg.hangMuc} phòng ${scBg.phong} ${scBg.toa} · thợ ${bg.tho}`, 'Xem & duyệt', V(`su-co/${scBg.id}`)],
    hetHan.length && ['canh', `${hetHan.length} hợp đồng hết hạn ${ngay(hetHan[0].kt)}`, `Còn ${hetHan[0].con} ngày · ${hetHan.map((h) => `${h.nguoi} (${h.phong})`).join(', ')}`, 'Gia hạn', V(`hop-dong/${hetHan[0].id}`)],
    choKy.length && ['', `${choKy.length} hợp đồng chờ ký`, choKy.map((h) => `${h.nguoi} · phòng ${h.phong}`).join(', '), 'Xem', V('hop-dong', { loc: 'CHO_KY' })],
    hen.length && ['', `${hen.length} lịch xem phòng chờ xác nhận`, `Gần nhất ngày ${ngayNgan(hen.map((x) => x.gio).sort()[0])} · đang có ${phong.filter((p) => p.tt === 'TRONG').length} phòng trống`, 'Xem lịch', V('lich-xem')],
    pccc.length && ['', `Bình chữa cháy quá hạn kiểm định`, `Hạn ${ngay(pccc[0].pccc.thietBi[0].han)} · ${pccc.length} toà`, 'Xem', V('pccc')],
  ].filter(Boolean)
  const html = dauTrang('Hôm nay', `Thứ Năm, ${ngay(D.ngay)} · ${tenToa()} · số liệu lúc ${D.capNhat}`, `<a class="nut an-m" href="${mo('tb')}">${ic('chuong')}Thông báo</a>`) +
    `<section class="the dai"><div class="ca"><div class="s">Còn phải thu</div><div class="lon c-no">${so(tongNo)}<span class="d">₫</span></div><div class="s">${no.length} người nợ · ${tong(no, (n) => n.hd.length)} hoá đơn, đều quá hạn trên 30 ngày</div></div>
      <div><div class="s">Hoá đơn tháng 11 đã thu</div><div class="lon">${so(thu11)}<span class="d">₫</span></div><div class="s">mới gửi ${hdThang(11).length} hoá đơn, còn lại chưa gửi</div></div>
      <div><div class="s">Tháng 10 đã thu</div><div class="lon">${pt(tong(t10, (h) => h.daThu), tong(t10, (h) => h.tong))}%</div><div class="s">${so(tong(t10, (h) => h.daThu))} / ${so(tong(t10, (h) => h.tong))} ₫</div></div>
      <div class="an-m"><div class="s">Phòng đang thuê</div><div class="lon">${phong.filter((p) => p.tt === 'DANG_THUE').length}<span class="d">/ ${phong.length}</span></div><div class="s">${phong.filter((p) => p.tt === 'TRONG').length} trống · ${phong.filter((p) => p.tt === 'DANG_SUA').length} đang sửa</div></div></section>
    <div class="luoi"><div class="c7 cot">${the('Ai đang nợ', `<div>${no.slice(0, 6).map((n) => nguoiNo(n, { rut: true })).join('')}</div><div class="chan"><span class="s gian">Hiện 6 người nợ nhiều nhất trong ${no.length} người</span><a class="nut chu" href="${V('tien')}">Xem cả ${no.length} người ${ic('phai')}</a></div>`, '', `${no.length} người`)}</div>
      <div class="c5 cot">${the('Cần quyết hôm nay', `<div>${viec.map(([loai, a, b, nut, h]) => `<div class="dong"><div class="gian"><div class="m" style="white-space:normal">${loai ? `<i class="cham ${loai}"></i>` : ''}${a}</div><div class="s" style="white-space:normal">${esc(b)}</div></div><a class="nut" href="${h}">${nut}</a></div>`).join('')}</div>`, '', `${viec.length} việc`)}</div></div>
    ${toaChon() ? '' : the('Theo toà', bang([['Toà'], ['Phòng', 'an-m'], ['Đang thuê', 'r an-m'], ['Tháng 10 đã thu', 'an-m'], ['Còn nợ', 'r'], ['Sự cố mở', 'r an-m']], D.toa.map((t) => {
      const h = hdThang(10, t.id), n = D.no.filter((x) => x.toaId === t.id)
      return `<tr class="bam" data-href="${L(`chu/toa/${t.id}`)}"><td><span class="m">${t.ten}</span><span class="s cat">${t.diaChi}</span></td><td class="an-m">${soDoNho(t)}</td><td class="r so an-m">${t.phong.filter((p) => p.tt === 'DANG_THUE').length}/${t.phong.length}</td>
        <td class="an-m"><div class="hang"><span class="so" style="width:44px">${pt(tong(h, (x) => x.daThu), tong(h, (x) => x.tong))}%</span><span class="gian">${thanh(tong(h, (x) => x.daThu), tong(h, (x) => x.tong))}</span></div></td>
        <td class="r b">${tien(tong(n, (x) => x.tong))}<span class="s" style="font-weight:400">${n.length} người</span></td><td class="r so an-m">${D.suCo.filter((s) => s.toaId === t.id && s.tt !== 'DA_DONG').length}</td></tr>` })),
      `<span class="chu-thich an-m"><span><i></i>đang thuê</span><span><i style="background:var(--no)"></i>đang nợ</span><span><i style="background:none;border:1px dashed var(--vien-o)"></i>trống</span></span>`)}`
  return { tieuDe: 'Hôm nay', html }
}
const coNo = (toaId, phong) => D.no.find((n) => n.toaId === toaId && n.phong === phong)
const lopPhong = (t, p) => (p.tt === 'TRONG' ? 'trong' : p.tt === 'DANG_SUA' ? 'sua' : coNo(t.id, p.so) ? 'no' : '')
const tangCua = (t) => [...new Set(t.phong.map((p) => p.tang))].sort((a, b) => b - a)
const soDoNho = (t) => `<div class="sodo nho" role="img" aria-label="Sơ đồ ${t.phong.length} phòng">${tangCua(t).map((g) => `<div class="tang" style="--n:${t.phong.filter((p) => p.tang === g).length}">${t.phong.filter((p) => p.tang === g).map((p) => `<i class="${lopPhong(t, p)}" title="Phòng ${p.so}"></i>`).join('')}</div>`).join('')}</div>`

M['chu/tien'] = M['ql/tien'] = () => {
  const no = noTrong(), tab = P.q.tab || 'no', laChu = P.vai === 'chu'
  const tabs = [['no', 'Còn nợ', no.length], ['thu', 'Đã thu tháng 11', hdThang(11).filter((h) => h.daThu).length], ['hd', 'Hoá đơn tháng 10', hdThang(10).length], ['coc', 'Tiền cọc', D.hopDong.filter((h) => trongToa(h.toaId) && h.tt === 'HIEU_LUC').length]]
  const hd = (ds) => bang([['Phòng'], ['Người thuê'], ['Hạn trả', 'an-m'], ['Phải trả', 'r an-m'], ['Đã trả', 'r'], ['Còn nợ', 'r'], ['Trạng thái', 'an-m']], ds.map((h) => `<tr><td class="m">${h.phong}${toaChon() ? '' : `<span class="s">${T(h.toaId).ten}</span>`}</td><td>${esc(h.nguoi)}</td><td class="an-m">${ngay(h.han)}</td><td class="r an-m">${tien(h.tong)}</td><td class="r">${tien(h.daThu)}</td><td class="r b ${h.con ? 'c-no' : ''}">${tien(h.con)}</td><td class="an-m">${h.con === 0 ? cham('ok', 'Đã trả đủ') : h.daThu ? cham('canh', 'Trả một phần') : cham('no', 'Chưa trả')}</td></tr>`),
    { tongHang: `<tr class="tong"><td colspan="2">Cộng ${ds.length} hoá đơn</td><td class="an-m"></td><td class="r an-m">${tien(tong(ds, (h) => h.tong))}</td><td class="r">${tien(tong(ds, (h) => h.daThu))}</td><td class="r">${tien(tong(ds, (h) => h.con))}</td><td class="an-m"></td></tr>` })
  let than
  if (tab === 'no' && matchMedia('(max-width:760px)').matches) than = `<div>${no.map((n) => nguoiNo(n, { rut: true })).join('')}<div class="dong"><div class="gian b">Cộng ${no.length} người</div><span class="b c-no">${tien(tong(no, (n) => n.tong))}</span></div></div>` // điện thoại: danh sách, không phải bảng
  else if (tab === 'no') {
    const moId = +(P.q.xem || no[0]?.id)
    than = `<div class="td" style="flex-wrap:wrap"><label class="chk an-m"><input type="checkbox" data-chon-het aria-label="Chọn tất cả"><span class="s" data-da-chon>Chọn để nhắc nhiều người</span></label><span class="gian"></span>
        <a class="nut an-m" href="${mo('nhac', { id: 'nhieu' })}" data-nut-nhac hidden>${ic('tin')}Nhắc người đã chọn</a><span class="loc"><a class="chip on" href="#">Tất cả <span class="so">${no.length}</span></a><a class="chip an-m" href="#">Đã trả một phần <span class="so">${no.filter((n) => n.daThu).length}</span></a></span></div>` +
      bang([['', 'an-m'], ['Người thuê'], ['Nợ mấy tháng', 'an-m'], ['Đã trả', 'r an-m'], ['Còn nợ', 'r'], ['', 'r']], no.map((n) => `<tr class="bam ${n.id === moId ? 'chon' : ''}" data-href="${V('tien', { xem: n.id })}"><td class="an-m" style="width:40px"><label class="chk"><input type="checkbox" data-chon aria-label="Chọn ${esc(n.ten)}"></label></td>
          <td><a class="m" href="${V(`nguoi/${n.id}`)}">${esc(n.ten)}</a><span class="s">${laChu && !toaChon() ? n.toa + ' · ' : ''}phòng ${n.phong}</span></td><td class="an-m">${n.hd.length} tháng<span class="s">từ tháng ${n.hd[0].thang}/2026</span></td><td class="r an-m">${tien(n.daThu)}</td><td class="r b">${tien(n.tong)}</td>
          <td class="r" style="width:1%"><span class="hang" style="justify-content:flex-end;gap:8px">${nutGoi(n.sdt)}<a class="nut an-m" href="${mo('nhac', { id: n.id })}">Nhắc</a><a class="nut" href="${mo('thu', { id: n.id })}">Ghi thu</a></span></td></tr>` +
          (n.id === moId ? n.hd.map((h) => `<tr class="con"><td class="an-m"></td><td>Tháng ${h.thang}/2026 <span class="c-phu">· hạn ${ngay(h.han)}</span></td><td class="an-m c-no">trễ ${h.tre} ngày</td><td class="r an-m">${tien(h.daThu)}</td><td class="r">${tien(h.con)}</td><td></td></tr>`).join('') : '')),
        { tongHang: `<tr class="tong"><td class="an-m"></td><td>Cộng ${no.length} người</td><td class="an-m">${tong(no, (n) => n.hd.length)} hoá đơn</td><td class="r an-m">${tien(tong(no, (n) => n.daThu))}</td><td class="r c-no">${tien(tong(no, (n) => n.tong))}</td><td></td></tr>` })
  } else if (tab === 'thu') than = hd(hdThang(11).filter((h) => h.daThu))
  else if (tab === 'hd') than = hd(hdThang(10))
  else { const c = D.hopDong.filter((h) => trongToa(h.toaId) && h.tt === 'HIEU_LUC'); than = bang([['Phòng'], ['Người thuê'], ['Hợp đồng đến', 'an-m'], ['Cọc đang giữ', 'r']], c.map((h) => `<tr class="bam" data-href="${V(`hop-dong/${h.id}`)}"><td class="m">${h.phong}${toaChon() ? '' : `<span class="s">${h.toa}</span>`}</td><td>${esc(h.nguoi)}</td><td class="an-m">${ngay(h.kt)}</td><td class="r b">${tien(h.coc)}</td></tr>`), { tongHang: `<tr class="tong"><td colspan="2">Cộng ${c.length} hợp đồng</td><td class="an-m"></td><td class="r">${tien(tong(c, (h) => h.coc))}</td></tr>` }) }
  const theoToa = laChu && !toaChon() ? `<section class="the dai an-m">${D.toa.map((t) => { const n = D.no.filter((x) => x.toaId === t.id), h = hdThang(10, t.id); return `<a href="${L('chu/tien', { toa: t.id })}" style="display:block;padding:14px 16px 16px;border-left:1px solid var(--ke)"><div class="s">${t.ten}</div><div class="vua">${so(tong(n, (x) => x.tong))}<span class="d">₫</span></div><div class="s an-m" style="margin:2px 0 8px">${n.length} người nợ · tháng 10 đã thu ${pt(tong(h, (x) => x.daThu), tong(h, (x) => x.tong))}%</div>${thanh(tong(h, (x) => x.daThu), tong(h, (x) => x.tong))}</a>` }).join('')}</section>` : ''
  return { tieuDe: laChu ? 'Tiền' : 'Thu tiền', chinh: 1, html: dauTrang(laChu ? 'Tiền' : 'Thu tiền', `${tenToa()} · còn phải thu <b class="c-no">${so(tong(no, (n) => n.tong))} ₫</b> của ${no.length} người · số liệu lúc ${D.capNhat}`, `<a class="nut an-m" href="#" data-toast="Bản xem thử: sẽ tải file Excel danh sách nợ">${ic('tai')}Xuất Excel</a><a class="nut chinh" href="${mo('thu', { id: no[0]?.id })}">${ic('them')}Ghi thu tiền</a>`) + theoToa +
    `<section class="the"><div class="tab" style="padding:0 8px">${tabs.map(([k, n, d]) => `<a class="${tab === k ? 'on' : ''}" href="${V('tien', { tab: k })}">${n} <i>${d}</i></a>`).join('')}</div>${than}</section>` }
}

M['chu/nguoi'] = M['ql/nguoi'] = () => {
  const ds = D.hopDong.filter((h) => trongToa(h.toaId) && h.tt === 'HIEU_LUC')
  return { tieuDe: 'Người thuê', html: dauTrang('Người thuê', `${tenToa()} · ${ds.length} người đang thuê`, `<a class="nut" href="${V('hop-dong/moi')}">${ic('them')}Thêm người thuê</a>`) + `<section class="the">` + bang([['Người thuê'], ['Phòng'], ['Điện thoại', 'an-m'], ['Thuê đến', 'an-m'], ['Còn nợ', 'r']], ds.map((h) => { const n = D.no.find((x) => x.id === h.nguoiId)
    return `<tr class="bam" data-href="${V(`nguoi/${h.nguoiId}`)}"><td><span class="hang"><span class="av an-m">${dau(h.nguoi)}</span><span class="m">${esc(h.nguoi)}</span></span></td><td>${h.phong}${toaChon() ? '' : `<span class="s">${h.toa}</span>`}</td><td class="an-m so">${sdt(D.nguoi[h.nguoiId]?.sdt)}</td><td class="an-m">${ngay(h.kt)}${h.sapHet ? `<span class="s c-canh">còn ${h.con} ngày</span>` : ''}</td><td class="r ${n ? 'b c-no' : 'c-phu'}">${n ? tien(n.tong) : 'Không nợ'}</td></tr>` })) + `</section>` }
}

M['chu/nguoi/:id'] = M['ql/nguoi/:id'] = () => {
  const id = +(P.ts[0] || 1), hd = D.hopDong.find((h) => h.nguoiId === id && h.tt === 'HIEU_LUC') || D.hopDong.find((h) => h.nguoiId === id), n = D.no.find((x) => x.id === id), tt = D.nguoi[id] || {}
  const sc = D.suCo.filter((s) => s.toaId === hd.toaId && s.phong === hd.phong)
  const html = `<nav class="vet"><a href="${V('nguoi')}">Người thuê</a>${ic('phai')}<span>${esc(hd.nguoi)}</span></nav>` +
    dauTrang(esc(hd.nguoi), `Phòng ${hd.phong} · ${hd.toa} · thuê từ ${ngay(hd.bd)}`, `${nutGoi(tt.sdt, sdt(tt.sdt))}<a class="nut an-m" href="${mo('nhac', { id })}">${ic('tin')}Nhắc qua Zalo</a>${n ? `<a class="nut chinh" href="${mo('thu', { id })}">Ghi thu ${so(n.tong)} ₫</a>` : ''}`) +
    `<section class="the dai"><div class="ca"><div class="s">Còn nợ</div><div class="lon ${n ? 'c-no' : ''}">${so(n?.tong || 0)}<span class="d">₫</span></div><div class="s">${n ? `${n.hd.length} tháng chưa trả đủ, cũ nhất hạn ${ngay(n.hd[0].han)}` : 'Đã trả đủ mọi hoá đơn'}</div></div>
      <div><div class="s">Tiền phòng</div><div class="vua">${so(hd.gia)}<span class="d">₫/tháng</span></div></div><div><div class="s">Cọc đang giữ</div><div class="vua">${so(hd.coc)}<span class="d">₫</span></div></div>
      <div><div class="s">Hợp đồng</div><div class="vua">còn ${hd.con} ngày</div><div class="s">đến ${ngay(hd.kt)}</div></div></section>
    <div class="luoi"><div class="c8 cot">${n ? the('Hoá đơn chưa trả đủ', bang([['Tháng'], ['Hạn trả', 'an-m'], ['Phải trả', 'r an-m'], ['Đã trả', 'r an-m'], ['Còn nợ', 'r'], ['Trễ', 'r']], n.hd.map((h) => `<tr><td class="m">Tháng ${h.thang}<span class="an-m">/2026</span></td><td class="an-m">${ngay(h.han)}</td><td class="r an-m">${tien(h.tong)}</td><td class="r an-m">${tien(h.daThu)}</td><td class="r b">${tien(h.con)}</td><td class="r c-no so">${h.tre} ngày</td></tr>`),
        { tongHang: `<tr class="tong"><td>Cộng</td><td class="an-m"></td><td class="r an-m">${tien(tong(n.hd, (h) => h.tong))}</td><td class="r an-m">${tien(n.daThu)}</td><td class="r c-no">${tien(n.tong)}</td><td></td></tr>` }), `<a class="nut chu" href="${V('tien', { xem: id })}">Mọi hoá đơn ${ic('phai')}</a>`) : the('Hoá đơn', `<div class="th"><div class="rong">Không còn hoá đơn nào chưa trả.</div></div>`)}
      ${the('Điện nước 4 tháng gần đây', bang([['Tháng'], ['Điện', 'r'], ['Nước', 'r']], D.kh.tieuThu.dien.map((d, i) => `<tr><td>Tháng ${d.thang}/2026</td><td class="r so">${d.dung} kWh <span class="c-phu an-m">(${d.dau} → ${d.cuoi})</span></td><td class="r so">${D.kh.tieuThu.nuoc[i].dung} m³</td></tr>`)), '', id === 1 ? '' : 'số liệu của phòng 101, minh hoạ')}</div>
      <div class="c4 cot">${the('Liên hệ & giấy tờ', `<div class="th">${kv([['Điện thoại', sdt(tt.sdt)], ['Email', esc(tt.email || '—')], ['Ngày sinh', ngay(tt.sinh)], ['Quê quán', esc(tt.que || '—')], ['Số CCCD', esc(tt.giayTo || '—')]])}</div>`)}
      ${the('Hợp đồng', `<div class="th">${kv([['Thời hạn', `${ngay(hd.bd)} – ${ngay(hd.kt)}`], ['Báo trước khi trả phòng', `${hd.baoTruoc} ngày`], ['Trạng thái', cham(TT_HD[hd.tt][0], TT_HD[hd.tt][1])]])}</div>`, `<a class="nut chu" href="${V(`hop-dong/${hd.id}`)}">Mở ${ic('phai')}</a>`)}
      ${the('Sự cố đã báo', sc.length ? `<div>${sc.map((s) => `<a class="dong bam" href="${V(`su-co/${s.id}`)}"><div class="gian"><div class="m">${s.hangMuc}</div><div class="s">${ngay(s.tao)}</div></div>${cham(TT_SC[s.tt][0], TT_SC[s.tt][1])}</a>`).join('')}</div>` : `<div class="th s">Phòng này chưa báo hỏng lần nào.</div>`)}
      ${the('Ghi chú liên hệ', `<div class="th s">Chưa có ghi chú. Sau mỗi lần gọi hay nhắc, ghi một dòng để người sau biết đã hẹn gì.</div>`, `<span class="mau">cần backend</span>`)}</div></div>`
  return { tieuDe: hd.nguoi, chinh: n ? 1 : 0, html }
}

M['chu/toa'] = M['qt/toa'] = () => ({ tieuDe: 'Toà & phòng', html: dauTrang('Toà & phòng', `${D.toa.length} toà · ${tong(D.toa, (t) => t.phong.length)} phòng`) + D.toa.map((t) => { const n = D.no.filter((x) => x.toaId === t.id)
  return `<a class="the hang" style="padding:16px;gap:24px" href="${L(`${P.vai}/toa/${t.id}`)}"><div class="gian"><div class="h2">${t.ten}</div><div class="s">${t.diaChi} · ${t.soTang} tầng</div></div>${soDoNho(t)}<div class="r an-m" style="width:120px"><div class="s">Đang thuê</div><div class="b so">${t.phong.filter((p) => p.tt === 'DANG_THUE').length}/${t.phong.length} phòng</div></div><div class="r" style="width:150px"><div class="s">Còn nợ</div><div class="b c-no">${tien(tong(n, (x) => x.tong))}</div></div>${ic('phai')}</a>` }).join('') })

M['chu/toa/:id'] = M['ql/toa/:id'] = M['qt/toa/:id'] = () => {
  const t = T(P.ts[0] || 3), no = D.no.filter((n) => n.toaId === t.id), h10 = hdThang(10, t.id), sc = D.suCo.filter((s) => s.toaId === t.id && s.tt !== 'DA_DONG'), hh = D.hopDong.filter((h) => h.toaId === t.id && (h.sapHet || h.tt === 'CHO_KY'))
  const o = (p) => { const n = coNo(t.id, p.so), l = lopPhong(t, p); return `<a class="${l}" href="${V(`phong/${p.id}`)}"><b>${p.so}</b><span>${l === 'trong' ? 'Trống' : l === 'sua' ? 'Đang sửa' : n ? 'nợ ' + (n.tong / 1e6).toFixed(1).replace('.', ',') + ' triệu' : esc(p.nguoi?.split(' ').slice(-2).join(' ') || '')}</span></a>` }
  const html = (P.vai === 'ql' ? '' : `<nav class="vet"><a href="${V('toa')}">Toà & phòng</a>${ic('phai')}<span>${t.ten}</span></nav>`) + dauTrang(P.vai === 'ql' ? 'Phòng' : t.ten, `${P.vai === 'ql' ? t.ten + ' · ' : ''}${t.diaChi} · ${t.soTang} tầng · ${t.phong.length} phòng`, `<a class="nut an-m" href="${V('cai-dat')}">${ic('chinh')}Giá dịch vụ</a>`) +
    `<section class="the dai"><div><div class="s">Đang thuê</div><div class="vua">${t.phong.filter((p) => p.tt === 'DANG_THUE').length}<span class="d">/ ${t.phong.length} phòng</span></div></div><div><div class="s">Còn nợ</div><div class="vua c-no">${so(tong(no, (n) => n.tong))}<span class="d">₫</span></div></div>
      <div><div class="s">Tháng 10 đã thu</div><div class="vua">${pt(tong(h10, (h) => h.daThu), tong(h10, (h) => h.tong))}%</div></div><div><div class="s">Sự cố đang mở</div><div class="vua">${sc.length}</div></div></section>
    <div class="luoi"><div class="c8 cot">${the('Sơ đồ phòng', `<div class="th"><div class="sodo">${tangCua(t).map((g) => `<div class="tang" style="--n:${t.phong.filter((p) => p.tang === g).length}"><span>Tầng ${g}</span>${t.phong.filter((p) => p.tang === g).map(o).join('')}</div>`).join('')}</div></div>`,
        `<span class="chu-thich an-m"><span><i style="background:var(--no-nen);border:1px solid #e8a29c"></i>đang nợ</span><span><i style="background:none;border:1px dashed var(--vien-o)"></i>trống</span><span><i class="gach"></i>đang sửa</span></span>`, 'bấm một phòng để mở')}
      ${the('Giá dịch vụ đang áp dụng', bang([['Dịch vụ'], ['Đơn giá', 'r']], D.hopDong.find((h) => h.toaId === t.id).dv.map((d) => `<tr><td>${d.ten}</td><td class="r">${d.gia ? tien(d.gia) + `<span class="c-phu"> / ${t.dv.find((x) => x.ten === d.ten)?.donVi || (/Điện/.test(d.ten) ? 'kWh' : 'tháng')}</span>` : 'Miễn phí'}</td></tr>`)))}</div>
      <div class="c4 cot">${the('Cần chú ý', `<div>${no.slice(0, 3).map((n) => `<a class="dong bam" href="${V(`nguoi/${n.id}`)}"><div class="gian"><div class="m">${esc(n.ten)} · ${n.phong}</div><div class="s">nợ ${n.hd.length} tháng</div></div><span class="b c-no">${tien(n.tong)}</span></a>`).join('')}
        ${hh.map((h) => `<a class="dong bam" href="${V(`hop-dong/${h.id}`)}"><div class="gian"><div class="m">Hợp đồng phòng ${h.phong}</div><div class="s">${esc(h.nguoi)}</div></div>${h.tt === 'CHO_KY' ? nhan('canh', 'Chờ ký') : nhan('canh', `còn ${h.con} ngày`)}</a>`).join('')}
        ${sc.filter((s) => s.khan).map((s) => `<a class="dong bam" href="${V(`su-co/${s.id}`)}"><div class="gian"><div class="m">${s.hangMuc} · ${s.phong}</div><div class="s">khẩn, chưa giao thợ</div></div>${nhan('no', 'Khẩn')}</a>`).join('')}</div>`)}
      ${the('An toàn PCCC', `<div class="th">${kv(t.pccc.thietBi.slice(0, 3).map((x) => [x.ten, `<span class="${x.han < D.ngay ? 'c-no' : ''}">hạn ${ngay(x.han)}</span>`]))}</div>`, '', `${t.pccc.denHan} việc đến hạn`)}</div></div>`
  return { tieuDe: t.ten, html }
}

M['chu/phong/:id'] = M['ql/phong/:id'] = () => {
  const t = D.toa.find((x) => x.phong.some((p) => p.id === +(P.ts[0] || 1))), p = t.phong.find((x) => x.id === +(P.ts[0] || 1)), hd = D.hopDong.find((h) => h.id === p.hdId), n = coNo(t.id, p.so)
  const cs = t.id === D.ql.toaId ? D.ql.chiSo.find((c) => c.phong === p.so) : null, hds = D.hoaDon.filter((h) => h.toaId === t.id && h.phong === p.so).sort((a, b) => b.thang - a.thang), sc = D.suCo.filter((s) => s.toaId === t.id && s.phong === p.so)
  const html = `<nav class="vet"><a href="${V(`toa/${t.id}`)}">${t.ten}</a>${ic('phai')}<span>Phòng ${p.so}</span></nav>` + dauTrang(`Phòng ${p.so}`, `${t.ten} · tầng ${p.tang} · ${p.dt} m² · ${p.loai}`, p.tt === 'TRONG' ? `<a class="nut chinh" href="${V('hop-dong/moi')}">${ic('them')}Tạo hợp đồng</a>` : n ? `<a class="nut chinh" href="${mo('thu', { id: n.id })}">Ghi thu ${so(n.tong)} ₫</a>` : '') +
    `<section class="the dai"><div><div class="s">Người thuê</div><div class="vua" style="font-size:18px">${hd ? `<a href="${V(`nguoi/${hd.nguoiId}`)}" class="c-xl">${esc(hd.nguoi)}</a>` : p.tt === 'TRONG' ? 'Đang trống' : 'Đang sửa'}</div></div><div><div class="s">Giá thuê</div><div class="vua">${so(hd?.gia || p.gia)}<span class="d">₫/tháng</span></div></div>
      <div><div class="s">Còn nợ</div><div class="vua ${n ? 'c-no' : ''}">${so(n?.tong || 0)}<span class="d">₫</span></div></div><div><div class="s">Hợp đồng đến</div><div class="vua">${hd ? ngay(hd.kt) : '—'}</div></div></section>
    <div class="luoi"><div class="c8 cot">${the('Hoá đơn', hds.length ? bang([['Tháng'], ['Hạn trả', 'an-m'], ['Phải trả', 'r'], ['Còn nợ', 'r'], ['', 'an-m']], hds.map((h) => `<tr><td class="m">Tháng ${h.thang}/2026</td><td class="an-m">${ngay(h.han)}</td><td class="r">${tien(h.tong)}</td><td class="r b ${h.con ? 'c-no' : ''}">${tien(h.con)}</td><td class="an-m">${h.con === 0 ? cham('ok', 'Đã trả đủ') : h.daThu ? cham('canh', 'Trả một phần') : cham('no', 'Chưa trả')}</td></tr>`)) : `<div class="th"><div class="rong">Phòng chưa có hoá đơn nào.</div></div>`)}</div>
      <div class="c4 cot">${cs ? the('Công tơ tháng 11', `<div class="th">${kv([[`${ic('dien')} Điện`, `<span class="so">${cs.dien[0]} → ${cs.dien[1]} · ${cs.dien[1] - cs.dien[0]} kWh</span>`], [`${ic('nuoc')} Nước`, `<span class="so">${cs.nuoc[0]} → ${cs.nuoc[1]} · ${cs.nuoc[1] - cs.nuoc[0]} m³</span>`]])}</div>`) : ''}
      ${the('Sự cố của phòng', sc.length ? `<div>${sc.map((s) => `<a class="dong bam" href="${V(`su-co/${s.id}`)}"><div class="gian"><div class="m">${s.hangMuc}</div><div class="s">${ngay(s.tao)}</div></div>${cham(TT_SC[s.tt][0], TT_SC[s.tt][1])}</a>`).join('')}</div>` : `<div class="th s">Chưa có sự cố nào.</div>`)}</div></div>`
  return { tieuDe: `Phòng ${p.so}`, chinh: 1, html }
}

M['chu/hop-dong'] = M['ql/hop-dong'] = () => {
  const tat = D.hopDong.filter((h) => trongToa(h.toaId)), loc = P.q.loc || 'CAN', nhom = { CAN: tat.filter((h) => (h.sapHet && h.tt === 'HIEU_LUC') || h.tt === 'CHO_KY'), HIEU_LUC: tat.filter((h) => h.tt === 'HIEU_LUC'), DA_THANH_LY: tat.filter((h) => h.tt === 'DA_THANH_LY') }
  const ds = (nhom[loc] || tat.filter((h) => h.tt === loc)).slice().sort((a, b) => a.con - b.con)
  return { tieuDe: 'Hợp đồng', chinh: 1, html: dauTrang('Hợp đồng', `${tenToa()} · ${nhom.HIEU_LUC.length} đang hiệu lực · giữ cọc ${so(tong(nhom.HIEU_LUC, (h) => h.coc))} ₫`, `<a class="nut chinh" href="${V('hop-dong/moi')}">${ic('them')}Tạo hợp đồng</a>`) +
    `<section class="the"><div class="tab" style="padding:0 8px">${[['CAN', 'Cần xử lý'], ['HIEU_LUC', 'Đang hiệu lực'], ['DA_THANH_LY', 'Đã thanh lý']].map(([k, n]) => `<a class="${loc === k ? 'on' : ''}" href="${V('hop-dong', { loc: k })}">${n} <i>${nhom[k].length}</i></a>`).join('')}</div>` +
    bang([['Phòng'], ['Người thuê'], ['Thời hạn', 'an-m'], ['Giá thuê', 'r an-m'], ['Cọc', 'r an-m'], ['Tình trạng'], ['', 'r an-m']], ds.map((h) => `<tr class="bam" data-href="${V(`hop-dong/${h.id}`)}"><td class="m">${h.phong}${toaChon() ? '' : `<span class="s">${h.toa}</span>`}</td><td>${esc(h.nguoi)}</td><td class="an-m so">${ngay(h.bd)} – ${ngay(h.kt)}</td><td class="r an-m">${tien(h.gia)}</td><td class="r an-m">${tien(h.coc)}</td>
      <td>${h.tt === 'CHO_KY' ? cham('canh', 'Chờ ký') : h.sapHet && h.tt === 'HIEU_LUC' ? cham('canh', `Hết hạn sau ${h.con} ngày`) : cham(TT_HD[h.tt][0], TT_HD[h.tt][1])}</td><td class="r an-m">${h.tt === 'CHO_KY' ? `<a class="nut" href="${V(`hop-dong/${h.id}`)}">Ghi nhận đã ký</a>` : h.sapHet && h.tt === 'HIEU_LUC' ? `<a class="nut" href="${V(`hop-dong/${h.id}`)}">Gia hạn</a>` : ''}</td></tr>`)) + `</section>` }
}

M['chu/hop-dong/:id'] = M['ql/hop-dong/:id'] = () => {
  const h = D.hopDong.find((x) => x.id === +P.ts[0]) || D.hopDong.find((x) => x.sapHet && x.tt === 'HIEU_LUC'), n = D.no.find((x) => x.id === h.nguoiId && x.toaId === h.toaId), hds = D.hoaDon.filter((x) => x.toaId === h.toaId && x.phong === h.phong && x.nguoi === h.nguoi).sort((a, b) => b.thang - a.thang)
  const sap = h.sapHet && h.tt === 'HIEU_LUC', cho = h.tt === 'CHO_KY', het = h.tt === 'DA_THANH_LY'
  const doi = [['Tạo hợp đồng', 'xong', cho ? 'bản nháp đã lưu' : ''], ['Hai bên ký', cho ? 'nay' : 'xong', cho ? 'đang chờ chữ ký' : ''], ['Đang hiệu lực', cho ? 'cho' : het ? 'xong' : sap ? 'xong' : 'nay', `${ngay(h.bd)} – ${ngay(h.kt)}`], ['Gia hạn hoặc báo trả phòng', sap ? 'nay' : het ? 'xong' : 'cho', sap ? `còn ${h.con} ngày, chưa có quyết định` : `trước ngày hết hạn ${h.baoTruoc} ngày`], ['Thanh lý, hoàn cọc', het ? 'xong' : 'cho', `cọc ${so(h.coc)} ₫ trừ nợ và hư hỏng`]]
  const html = `<nav class="vet"><a href="${V('hop-dong')}">Hợp đồng</a>${ic('phai')}<span>Phòng ${h.phong}</span></nav>` + dauTrang(`Hợp đồng phòng ${h.phong}`, `${esc(h.nguoi)} · ${h.toa}`, `<a class="nut an-m" href="#" data-toast="Bản xem thử: sẽ tải file PDF hợp đồng">${ic('tai')}Tải PDF</a>${sap ? `<a class="nut chinh" href="${mo('giahan')}">Gia hạn hợp đồng</a>` : cho ? `<a class="nut chinh" href="#" data-toast="Bản xem thử: hợp đồng chuyển sang Đang hiệu lực">Ghi nhận đã ký</a>` : ''}`) +
    (sap ? `<div class="bao">${ic('gio')}<span>Hết hạn ngày <b>${ngay(h.kt)}</b>, còn ${h.con} ngày. Người thuê phải báo trước ${h.baoTruoc} ngày nếu trả phòng, hạn báo đã qua.</span></div>` : '') +
    `<div class="luoi"><div class="c8 cot">${the('Điều khoản chính', `<div class="th">${kv([['Người thuê', `<a class="c-xl" href="${V(`nguoi/${h.nguoiId}`)}">${esc(h.nguoi)}</a>`], ['Thời hạn', `${ngay(h.bd)} – ${ngay(h.kt)}`], ['Giá thuê', tien(h.gia) + ' / tháng'], ['Tiền cọc đang giữ', tien(h.coc)], ['Báo trước khi trả phòng', `${h.baoTruoc} ngày`], ...h.dv.map((d) => [d.ten, d.gia ? tien(d.gia) : 'Miễn phí'])])}</div>`)}
      ${the('Hoá đơn theo hợp đồng', hds.length ? bang([['Tháng'], ['Phải trả', 'r'], ['Đã trả', 'r an-m'], ['Còn nợ', 'r']], hds.map((x) => `<tr><td class="m">Tháng ${x.thang}/2026</td><td class="r">${tien(x.tong)}</td><td class="r an-m">${tien(x.daThu)}</td><td class="r b ${x.con ? 'c-no' : ''}">${tien(x.con)}</td></tr>`)) : `<div class="th"><div class="rong">Chưa phát sinh hoá đơn.</div></div>`)}</div>
      <div class="c4 cot">${the('Vòng đời hợp đồng', `<div class="th"><div class="tl">${doi.map(([a, l, b]) => `<div class="${l}"><div class="m">${a}</div><div class="s">${b}</div></div>`).join('')}</div></div>`)}
      ${the('Nếu thanh lý hôm nay', `<div class="th">${kv([['Cọc đang giữ', tien(h.coc)], ['Trừ nợ hoá đơn', `<span class="${n ? 'c-no' : ''}">− ${so(n?.tong || 0)} ₫</span>`], ['Hoàn lại người thuê', `<b>${tien(Math.max(0, h.coc - (n?.tong || 0)))}</b>`]])}${n && n.tong > h.coc ? `<p class="s c-no" style="margin-top:8px">Nợ lớn hơn cọc ${so(n.tong - h.coc)} ₫. Cần thu thêm trước khi thanh lý.</p>` : ''}<a class="nut nguy day" style="margin-top:12px" href="${mo('xn')}">Thanh lý hợp đồng…</a></div>`)}</div></div>`
  return { tieuDe: `Hợp đồng phòng ${h.phong}`, chinh: sap || cho ? 1 : 0, html }
}

M['chu/su-co'] = M['ql/su-co'] = M['chu/su-co/:id'] = M['ql/su-co/:id'] = () => {
  const laChu = P.vai === 'chu', bg = D.mau.baoGia, ds = D.suCo.filter((s) => trongToa(s.toaId)), coBg = (s) => s.id === bg.suCoId
  const id = +(P.ts[0] || (laChu && trongToa(3) ? bg.suCoId : ds.find((s) => s.khan && s.tt === 'MOI_TIEP_NHAN')?.id || ds[0].id)), s = D.suCo.find((x) => x.id === id), t = T(s.toaId), tho = t.tho.find((x) => x.id === s.thoId), tongBg = tong(bg.dong, (d) => d.sl * d.gia)
  const nhom = [['Cần quyết', ds.filter((x) => coBg(x) || x.tt === 'MOI_TIEP_NHAN' || x.tt === 'DA_TIEP_NHAN')], ['Thợ đang làm', ds.filter((x) => !coBg(x) && (x.tt === 'DA_PHAN_CONG' || x.tt === 'DANG_XU_LY' || x.tt === 'CHO_XAC_NHAN'))], ['Đã xong tháng này', ds.filter((x) => x.tt === 'DA_DONG')]]
  const buocNay = coBg(s) ? 5 : TT_SC[s.tt][2]
  const dsHtml = nhom.map(([ten, a]) => a.length ? `<div class="td" style="min-height:40px;background:#f7f8fa;border-top:1px solid var(--ke)"><span class="s m">${ten}</span><span class="s so">${a.length}</span></div>` + a.map((x) => `<a class="dong bam ${x.id === id ? 'chon' : ''}" href="${V(`su-co/${x.id}`)}"><div class="gian"><div class="m">${x.hangMuc} · phòng ${x.phong}</div><div class="s">${toaChon() ? '' : x.toa + ' · '}${coBg(x) ? 'báo giá ' + so(tongBg) + ' ₫ chờ duyệt' : TT_SC[x.tt][1].toLowerCase()}</div></div>${x.khan && x.tt !== 'DA_DONG' ? nhan('no', 'Khẩn') : coBg(x) ? nhan('canh', 'Chờ duyệt') : ''}</a>`).join('') : '').join('')
  const hanhDong = coBg(s) ? `<a class="nut nguy" href="${mo('xn', { kieu: 'tuchoi' })}">Từ chối</a><a class="nut chinh" href="#" data-toast="Bản xem thử: đã duyệt, thợ nhận được thông báo">Duyệt ${so(tongBg)} ₫</a>` : s.tt === 'MOI_TIEP_NHAN' || s.tt === 'DA_TIEP_NHAN' ? `<a class="nut chinh" href="#" data-toast="Bản xem thử: đã giao việc cho thợ">Giao thợ</a>` : s.tt === 'CHO_XAC_NHAN' ? `<a class="nut chinh" href="#">Nghiệm thu</a>` : ''
  const chiTiet = `<section class="the"><div class="td" style="align-items:flex-start;padding-top:14px;flex-wrap:wrap"><div class="gian"><h2 class="h2">${s.hangMuc} · phòng ${s.phong}</h2><p class="s">${s.toa} · tầng ${s.tang} · báo ngày ${ngay(s.tao)} · ${s.ma}</p></div>${s.khan ? nhan('no', 'Khẩn') : ''}${nhan(coBg(s) ? 'canh' : TT_SC[s.tt][0], coBg(s) ? 'Báo giá chờ duyệt' : TT_SC[s.tt][1])}</div>
    <div class="th cot"><p>${esc(s.moTa)}</p>
    <ol class="hang an-m" style="list-style:none;margin:0;padding:0;gap:4px;flex-wrap:wrap" aria-label="Tiến độ">${BUOC_SC.map((b, i) => `<li class="nhan ${i + 1 < buocNay ? 'ok' : i + 1 === buocNay ? 'xl' : ''}" ${i + 1 === buocNay ? 'aria-current="step" style="font-weight:600"' : ''}>${i + 1 < buocNay ? ic('xong') : ''}${b}</li>`).join('')}</ol>
    <p class="s chi-m">Bước ${buocNay}/8: <b>${BUOC_SC[buocNay - 1]}</b></p>
    ${coBg(s) ? `<div><div class="hang" style="margin-bottom:4px"><h3 class="m gian">Báo giá của thợ ${bg.tho} <span class="mau">minh hoạ</span></h3><span class="s an-m">gửi ${bg.gui.slice(11)} hôm nay</span></div>${bang([['Hạng mục'], ['SL', 'r'], ['Đơn giá', 'r an-m'], ['Thành tiền', 'r']], bg.dong.map((d) => `<tr><td>${d.ten}</td><td class="r so">${d.sl}</td><td class="r an-m">${tien(d.gia)}</td><td class="r">${tien(d.sl * d.gia)}</td></tr>`), { tongHang: `<tr class="tong"><td colspan="2">Tổng báo giá</td><td class="an-m"></td><td class="r">${tien(tongBg)}</td></tr>` })}</div>
      <label class="o" style="max-width:320px"><span>Ai chịu chi phí</span><select><option>Chủ nhà (hao mòn tự nhiên)</option><option>Người thuê (làm hỏng)</option></select></label>` : ''}
    ${!coBg(s) && (s.tt === 'MOI_TIEP_NHAN' || s.tt === 'DA_TIEP_NHAN') ? `<label class="o" style="max-width:320px"><span>Giao cho thợ</span><select>${t.tho.map((x) => `<option>${x.hoTen} · ${sdt(x.soDienThoai)}</option>`).join('')}</select><small>Thợ nhận tin ngay trên điện thoại.</small></label>` : ''}
    ${kv([['Người thuê liên hệ', `<a class="c-xl" href="tel:${s.sdt}">${sdt(s.sdt)}</a>`], ['Thợ', tho ? `${tho.hoTen} · <a class="c-xl" href="tel:${tho.soDienThoai}">${sdt(tho.soDienThoai)}</a>` : 'Chưa giao'], ['Chi phí', s.chiPhi ? tien(s.chiPhi) : coBg(s) ? `${so(tongBg)} ₫ (chờ duyệt)` : 'Chưa có báo giá']])}</div>
    ${hanhDong ? `<div class="chan" style="justify-content:flex-end">${hanhDong}</div>` : ''}</section>`
  const hep = matchMedia('(max-width:760px)').matches
  const html = dauTrang('Sự cố', `${tenToa()} · ${nhom[0][1].length} việc cần quyết · ${nhom[1][1].length} thợ đang làm`, laChu ? '' : `<a class="nut" href="#" data-toast="Bản xem thử: mở phiếu báo hỏng thay người thuê">${ic('them')}Ghi sự cố mới</a>`) +
    (hep ? (P.ts[0] ? `<a class="nut chu" style="justify-self:start;padding:0" href="${V('su-co')}">${ic('lui')}Tất cả sự cố</a>` + chiTiet : `<section class="the">${dsHtml}</section>`) : `<div class="luoi"><div class="c5"><section class="the" style="overflow:hidden">${dsHtml}</section></div><div class="c7">${chiTiet}</div></div>`)
  return { tieuDe: 'Sự cố', html }
}

M['chu/bao-cao'] = () => {
  const toas = D.toa.filter((t) => trongToa(t.id)), hd = D.hoaDon.filter((h) => trongToa(h.toaId)), ph = tong(hd, (h) => h.tong), thu = tong(hd, (h) => h.daThu), no = tong(hd, (h) => h.con)
  console.assert(ph === thu + no, 'phát hành phải bằng đã thu + còn nợ')
  const th = [7, 8, 9, 10, 11].map((m) => ({ m, ph: tong(hd.filter((h) => h.thang === m), (h) => h.tong), thu: tong(hd.filter((h) => h.thang === m), (h) => h.daThu) })), max = Math.max(...th.map((x) => x.ph))
  const phong = toas.flatMap((t) => t.phong), chiPhi = tong(D.suCo.filter((s) => trongToa(s.toaId)), (s) => s.chiPhi)
  return { tieuDe: 'Báo cáo', html: dauTrang('Báo cáo', `${tenToa()} · từ tháng 7 đến hết ${ngay(D.ngay)} · tính trên hoá đơn đã gửi`, `<span class="loc an-m"><a class="chip" href="#">Tháng 11</a><a class="chip on" href="#">5 tháng</a><a class="chip" href="#">Cả năm</a></span><a class="nut" href="#" data-toast="Bản xem thử: sẽ tải file Excel">${ic('tai')}Xuất Excel</a>`) +
    `<section class="the dai"><div class="ca"><div class="s">Đã thu</div><div class="lon">${so(thu)}<span class="d">₫</span></div><div class="s">${pt(thu, ph)}% của ${so(ph)} ₫ đã gửi hoá đơn</div></div><div><div class="s">Còn nợ</div><div class="lon c-no">${so(no)}<span class="d">₫</span></div><div class="s">đều quá hạn trên 30 ngày</div></div>
      <div><div class="s">Phòng đang thuê</div><div class="lon">${pt(phong.filter((p) => p.tt === 'DANG_THUE').length, phong.length)}%</div><div class="s">${phong.filter((p) => p.tt === 'DANG_THUE').length}/${phong.length} phòng</div></div><div class="an-m"><div class="s">Chi sửa chữa</div><div class="lon">${so(chiPhi)}<span class="d">₫</span></div><div class="s">${D.suCo.filter((s) => trongToa(s.toaId) && s.chiPhi).length} việc đã xong</div></div></section>
    <div class="luoi"><div class="c7 cot">${the('Gửi hoá đơn và đã thu theo tháng', `<div class="th"><div class="bd" role="img" aria-label="Cột theo tháng">${th.map((x) => `<div><i style="height:${pt(x.ph, max)}%" title="Đã gửi ${so(x.ph)} ₫"></i><b style="height:${pt(x.thu, max)}%" title="Đã thu ${so(x.thu)} ₫"></b></div>`).join('')}</div><div class="bd-n">${th.map((x) => `<div><div class="m" style="color:var(--muc)">Tháng ${x.m}</div><div class="so">${so(x.thu / 1e6)}<span class="an-m"> / ${so(x.ph / 1e6)}</span> tr</div></div>`).join('')}</div>
        <p class="s" style="margin-top:10px">Tháng 11 thấp vì hoá đơn tháng 11 chưa gửi (mới có ${hdThang(11).length} hoá đơn).</p></div>`, `<span class="chu-thich"><span><i></i>đã gửi hoá đơn</span><span><i style="background:var(--muc)"></i>đã thu</span></span>`)}</div>
      <div class="c5 cot">${the('Nợ theo thời gian quá hạn', `<div class="th">${kv([['Chưa đến hạn', tien(0)], ['Quá hạn 1–7 ngày', tien(0)], ['Quá hạn 8–30 ngày', tien(0)], [`Quá hạn trên 30 ngày`, `<b class="c-no">${tien(no)}</b>`]])}<p class="s" style="margin-top:10px">${hd.filter((h) => h.con).length} hoá đơn của ${noTrong().length} người. <a class="c-xl" href="${V('tien')}">Mở danh sách nợ</a></p></div>`)}</div></div>
    ${the('Theo toà', bang([['Toà'], ['Đã gửi hoá đơn', 'r an-m'], ['Đã thu', 'r'], ['Tỷ lệ thu', 'r an-m'], ['Còn nợ', 'r'], ['Đang thuê', 'r an-m'], ['Chi sửa chữa', 'r an-m']], toas.map((t) => { const h = D.hoaDon.filter((x) => x.toaId === t.id), a = tong(h, (x) => x.tong), b = tong(h, (x) => x.daThu)
      return `<tr class="bam" data-href="${L(`chu/toa/${t.id}`)}"><td class="m">${t.ten}</td><td class="r an-m">${tien(a)}</td><td class="r">${tien(b)}</td><td class="r so an-m">${pt(b, a)}%</td><td class="r b c-no">${tien(a - b)}</td><td class="r so an-m">${t.phong.filter((p) => p.tt === 'DANG_THUE').length}/${t.phong.length}</td><td class="r an-m">${tien(tong(D.suCo.filter((s) => s.toaId === t.id), (s) => s.chiPhi))}</td></tr>` }),
      { tongHang: toas.length > 1 ? `<tr class="tong"><td>Cộng</td><td class="r an-m">${tien(ph)}</td><td class="r">${tien(thu)}</td><td class="r so an-m">${pt(thu, ph)}%</td><td class="r c-no">${tien(no)}</td><td class="r so an-m">${phong.filter((p) => p.tt === 'DANG_THUE').length}/${phong.length}</td><td class="r an-m">${tien(chiPhi)}</td></tr>` : '' }))}` }
}
