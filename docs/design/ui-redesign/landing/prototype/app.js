'use strict';
/* MiniApart — bản xem trước phần công khai. Không build, không gọi mạng.
   Dữ liệu: data.js = JSON thật của GET /api/public/toa-nha và /api/public/phong (xem tools/gen-data.mjs). */

const D = window.MA_DATA;
// Giống fetchPublicPhong trong frontend/src/api.ts: đổi tên trường backend sang kiểu PublicPhong.
const PHONG = D.phong.map((p) => ({
  ...p,
  giaThueMacDinh: p.giaThue ?? p.giaThueMacDinh,
  danhSachDichVu: (p.bangGiaDichVu || []).map((dv) => ({ id: dv.id, tenDichVu: dv.ten, loaiThu: dv.cachTinh, cheDoGia: dv.cheDoGia, donGia: dv.donGia, donViTinh: dv.donVi })),
}));
const TOA = D.toaNha;

/* ---------- tiện ích nhỏ ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const so = (n) => new Intl.NumberFormat('vi-VN').format(n);
const tien = (n) => `${so(n)}&nbsp;<span class="d">₫</span>`;
const thanhPho = (diaChi) => (diaChi || '').split(',').pop().trim();
const anh = (p) => 'img' + p.anhDaiDien.replace(/^\/rooms/, '');
const laTrong = (p) => p.trangThai === 'TRONG';
const noi = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} và ${a.at(-1)}`);
const CHU_SO = ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
const chu = (n) => CHU_SO[n] ?? String(n);
const MT = '<svg class="mt" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const moTaNgan = (p) => `${esc(p.loaiPhong)} · ${so(p.dienTich)} m² · tầng ${p.tang}`;
const donGia = (dv) => (dv.cheDoGia === 'BAC_THANG' ? 'theo bậc thang' : dv.donGia == null ? 'chưa có giá' : dv.donGia === 0 ? 'Miễn phí' : `${tien(dv.donGia)}/${esc(dv.donViTinh)}`);
const NHAN_TT = { DANG_THUE: 'Đang có người thuê', DA_COC: 'Đã có người đặt cọc', DANG_SUA: 'Đang sửa chữa', DANG_SUA_CHUA: 'Đang sửa chữa' };

const TRONG = PHONG.filter(laTrong);
const TP = [...new Set(TOA.map((t) => thanhPho(t.diaChi)))];
const RE_NHAT = [...TRONG].sort((a, b) => a.giaThueMacDinh - b.giaThueMacDinh)[0];
const anhToa = (t) => anh(TRONG.find((p) => p.toaNhaId === t.id) || PHONG.find((p) => p.toaNhaId === t.id));

/* ---------- tính tiền một tháng từ bảng giá thật ---------- */
// Dịch vụ "khi dùng mới tính" chỉ lấy gửi xe máy; khoản chưa có đơn giá (điện bậc thang) trả về ở chuaTinh.
function tinhThang(p, { nguoi, xe, kwh, m3 }) {
  const dong = [{ ten: 'Tiền phòng', ct: '', tien: p.giaThueMacDinh }];
  const chuaTinh = [];
  for (const dv of p.danhSachDichVu) {
    let sl = null;
    if (dv.loaiThu === 'THEO_CHI_SO') sl = dv.donViTinh === 'kWh' ? kwh : m3;
    else if (dv.loaiThu === 'THEO_NGUOI') sl = nguoi;
    else if (dv.loaiThu === 'CO_DINH') sl = 1;
    else if (/xe máy/i.test(dv.tenDichVu)) sl = xe;
    if (sl == null || (sl === 0 && dv.loaiThu !== 'CO_DINH')) continue;
    if (dv.donGia == null) { chuaTinh.push(dv.tenDichVu); continue; }
    dong.push({ ten: dv.tenDichVu, ct: dv.loaiThu === 'CO_DINH' ? '' : `${so(sl)} ${dv.donViTinh} × ${so(dv.donGia)} ₫`, tien: sl * dv.donGia });
  }
  return { dong, chuaTinh, tong: dong.reduce((s, d) => s + d.tien, 0) };
}

/* ---------- lọc phòng (giữ đúng cách lọc của KhamPhaPhong.tsx; mặc định chỉ phòng trống) ---------- */
const GIA = { DUOI_3_5: [0, 3500000], '3_5_DEN_5': [3500000, 5000000], TREN_5: [5000000, Infinity] };
function locPhong(b) {
  const q = (b.q || '').trim().toLowerCase();
  const [tu, den] = GIA[b.gia] || [0, Infinity];
  return PHONG.filter((p) =>
    (b.tatca || laTrong(p))
    && (!b.toa || p.toaNhaId === +b.toa)
    && (!b.tp || thanhPho(p.diaChiToaNha) === b.tp)
    && (!b.loai || p.loaiPhong === b.loai)
    && p.giaThueMacDinh >= tu && p.giaThueMacDinh <= den
    && (b.ti || []).every((t) => p.tienIch.includes(t))
    && (!q || [p.soPhong, p.tenToaNha, p.diaChiToaNha, p.moTa].some((s) => (s || '').toLowerCase().includes(q))),
  ).sort((a, c) => laTrong(c) - laTrong(a) || a.giaThueMacDinh - c.giaThueMacDinh);
}

// Tự kiểm: chạy mỗi lần mở trang, sai thì báo ở console.
console.assert(tinhThang({ giaThueMacDinh: 1000, danhSachDichVu: [
  { tenDichVu: 'Điện', loaiThu: 'THEO_CHI_SO', donGia: 10, donViTinh: 'kWh' },
  { tenDichVu: 'Nước', loaiThu: 'THEO_CHI_SO', donGia: null, donViTinh: 'm³', cheDoGia: 'BAC_THANG' },
  { tenDichVu: 'Rác', loaiThu: 'CO_DINH', donGia: 5, donViTinh: 'phòng' },
  { tenDichVu: 'Vệ sinh', loaiThu: 'THEO_NGUOI', donGia: 3, donViTinh: 'người' },
  { tenDichVu: 'Gửi xe máy', loaiThu: 'THEO_SO_LUONG', donGia: 7, donViTinh: 'xe' },
  { tenDichVu: 'Giặt sấy', loaiThu: 'THEO_SO_LUONG', donGia: 99, donViTinh: 'kg' },
] }, { nguoi: 2, xe: 1, kwh: 10, m3: 4 }).tong === 1118, 'tinhThang sai');
console.assert(locPhong({}).every(laTrong) && locPhong({ tatca: 1 }).length === PHONG.length, 'locPhong sai');
console.assert(locPhong({ tatca: 1, gia: 'TREN_5' }).every((p) => p.giaThueMacDinh >= 5000000), 'locPhong giá sai');

/* ---------- mảnh dùng chung ---------- */
function thePhong(p) {
  const dv = p.danhSachDichVu.filter((d) => d.loaiThu === 'THEO_CHI_SO').slice(0, 2).map((d) => `${esc(d.tenDichVu)} ${donGia(d)}`).join(' · ');
  return `<a class="phong${laTrong(p) ? '' : ' het'}" href="#/phong/${p.id}">
  <span class="phong-anh"><img src="${anh(p)}" alt="Phòng ${esc(p.soPhong)}, ${esc(p.tenToaNha)}" width="960" height="720">${laTrong(p) ? '' : `<span class="nhan">${NHAN_TT[p.trangThai] || esc(p.nhanTrangThai)}</span>`}</span>
  <span class="phong-gia"><b>${tien(p.giaThueMacDinh)}</b> /tháng</span>
  <span class="phong-ten">Phòng ${esc(p.soPhong)} · ${esc(p.tenToaNha)}</span>
  <span class="phong-phu">${esc(thanhPho(p.diaChiToaNha))} · ${moTaNgan(p)}</span>
  ${dv ? `<span class="phong-phu">${dv}</span>` : ''}
</a>`;
}

/* ---------- Trang chủ ---------- */
function manTrangChu() {
  const t0 = TOA[0];
  const p0 = PHONG.find((p) => p.toaNhaId === t0.id);
  const noiBat = TOA.map((t) => TRONG.filter((p) => p.toaNhaId === t.id).sort((a, b) => a.giaThueMacDinh - b.giaThueMacDinh)[0]).filter(Boolean);
  const mau = RE_NHAT || PHONG[0];
  const hd = tinhThang(mau, { nguoi: 2, xe: 1, kwh: 96, m3: 6 });
  const chiSo = { kWh: '384 → 480 · ', 'm³': '31 → 37 · ' }; // chỉ số công tơ là ví dụ, đơn giá là thật
  return `
<section class="hero">
  <img class="hero-anh" src="img/moclan_ban_cong.webp" alt="Căn phòng ở Mộc Lan Home: cửa ban công mở, rèm trắng, ghế gỗ và chậu cây" width="960" height="720" fetchpriority="high">
  <div class="hero-trong khung">
    <div class="hero-chu">
      <h1 class="t1">Chỗ ở tử tế,<br>giá <em class="n">rõ ràng</em></h1>
      <p class="hero-phu">${TRONG.length
        ? `${TRONG.length} phòng đang trống ở ${TOA.length} toà tại ${esc(noi(TP))}. Giá điện, nước và từng khoản phí được ghi sẵn trước khi bạn đến xem.`
        : `Hiện chưa có phòng trống ở ${TOA.length} toà. Bạn vẫn xem được bảng giá điện, nước của từng toà.`}</p>
    </div>
    <div class="hero-phai">
      ${RE_NHAT ? `<a class="hero-the" href="#/phong/${RE_NHAT.id}">
        <span class="ht-chu"><span class="ht-nhan">Giá thấp nhất đang trống</span><span class="ht-ten">Phòng ${esc(RE_NHAT.soPhong)} · ${esc(RE_NHAT.tenToaNha)}</span><span class="ht-gia">${tien(RE_NHAT.giaThueMacDinh)} /tháng</span></span>
        <img src="${anh(RE_NHAT)}" alt="" width="960" height="720">
      </a>` : ''}
      <a class="nut nut-trang nut-lon" href="#/tim-phong">Tìm phòng</a>
    </div>
  </div>
</section>

<section class="dai khung" id="vi-sao">
  <h2 class="t2 loi" data-hien>Mỗi phòng <img class="chen" src="img/annhien_studio_ban_cong.webp" alt=""> đều ghi sẵn tiền&nbsp;thuê, giá&nbsp;điện, giá&nbsp;nước <img class="chen" src="img/phonho_studio_bep.webp" alt=""> <em class="n">trước khi</em> bạn đến&nbsp;xem</h2>
  <div class="luoi vs">
    <div class="vs-gia" data-hien>
      <h3 class="t4">Bảng giá đang áp dụng ở ${esc(t0.ten)}</h3>
      <ul class="hang-gia">
        ${p0.danhSachDichVu.slice(0, 6).map((d) => `<li><span>${esc(d.tenDichVu)}</span><span>${donGia(d)}</span></li>`).join('')}
      </ul>
      <a class="lk" href="#/tim-phong?toa=${t0.id}">Xem ${t0.soPhongTrong} phòng trống ở toà này ${MT}</a>
    </div>
    <div class="vs-buoc" data-hien style="--i:1">
      <h3 class="t4">Thuê phòng trong ba bước</h3>
      <ol class="buoc">
        <li><h4>Tìm phòng</h4><p>Lọc theo toà, mức giá, loại phòng. Không cần tài khoản.</p></li>
        <li><h4>Hẹn giờ đến xem</h4><p>Để lại tên và số điện thoại. Quản lý toà gọi lại để xác nhận.</p></li>
        <li><h4>Ký hợp đồng, vào ở</h4><p>Từ đó hoá đơn hằng tháng, mã QR trả tiền và báo hỏng nằm trong Cổng cư dân.</p></li>
      </ol>
    </div>
  </div>
</section>

<section class="dai khung luoi toa" id="toa-nha">
  <div class="toa-trai">
    <h2 class="t2" data-hien>${chu(TOA.length)} toà,<br>${chu(TP.length).toLowerCase()} <em class="n">thành phố</em></h2>
    <ul class="hang-ds" id="ds-toa" data-hien style="--i:1">
      ${TOA.map((t) => `<li><a href="#/tim-phong?toa=${t.id}" data-anh="${anhToa(t)}" data-chu="${esc(t.ten)} · ${esc(t.diaChi)}">
        <span class="hd-ten">${esc(t.ten)}</span>
        <span class="hd-phu">${esc(thanhPho(t.diaChi))} · ${t.soPhongTrong ? `${t.soPhongTrong} phòng trống` : 'đã kín phòng'}</span>${MT}</a></li>`).join('')}
    </ul>
    <p class="toa-phu">Chọn một toà để xem phòng đang trống và bảng giá điện nước của toà đó.</p>
    <a class="nut nut-vien" href="#/tim-phong">Xem tất cả phòng trống</a>
  </div>
  <figure class="toa-anh" data-hien style="--i:2">
    <img id="toa-anh" src="${anhToa(t0)}" alt="" width="960" height="720">
    <figcaption id="toa-chu">${esc(t0.ten)} · ${esc(t0.diaChi)}</figcaption>
  </figure>
</section>

<section class="so" aria-labelledby="so-td">
  <div class="khung">
    <h2 class="t3" id="so-td" data-hien>Số liệu lấy thẳng từ <em class="n">hệ thống</em></h2>
    <ul class="so-cot">
      <li data-hien><strong>${TOA.length}</strong><span>toà nhà ở ${TP.length} thành phố</span></li>
      <li data-hien style="--i:1"><strong>${TRONG.length}</strong><span>phòng đang trống trên ${PHONG.length} phòng</span></li>
      ${RE_NHAT ? `<li data-hien style="--i:2"><strong>${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(RE_NHAT.giaThueMacDinh / 1e6)} <small>triệu</small></strong><span>${tien(RE_NHAT.giaThueMacDinh)} mỗi tháng, giá thuê thấp nhất đang trống</span></li>` : ''}
    </ul>
  </div>
</section>

${noiBat.length ? `<section class="noi-bat" aria-roledescription="băng chuyền" aria-labelledby="nb-td">
  <div class="nb-nen" aria-hidden="true"><img src="${anh(noiBat[0])}" alt=""><img src="${anh(noiBat[0])}" alt=""></div>
  <div class="nb-the">
    <h2 class="t3" id="nb-td">Phòng đang <em class="n">trống</em></h2>
    <div id="nb-than" aria-live="polite"></div>
    <div class="nb-dk">
      <button type="button" id="nb-truoc" aria-label="Phòng trước">${MT}</button>
      <span id="nb-dem"></span>
      <button type="button" id="nb-sau" aria-label="Phòng sau">${MT}</button>
    </div>
  </div>
</section>` : ''}

<section class="chu-nha" id="chu-nha">
  <div class="khung luoi dai">
    <div class="cn-trai">
      <h2 class="t2" data-hien>Dành cho <em class="n">chủ nhà</em></h2>
      <p class="cn-mo" data-hien style="--i:1">MiniApart là phần mềm vận hành phía sau những toà nhà ở trên. Ghi chỉ số một lần, hoá đơn tự ra; người thuê quét mã để trả; hỏng gì báo ngay trên điện thoại.</p>
      <ul class="hang-tn" data-hien style="--i:2">
        <li><h3>Hoá đơn tự tính điện nước</h3><p>Ghi chỉ số công tơ, hệ thống nhân đơn giá và cộng các khoản cố định của từng phòng.</p></li>
        <li><h3>Thu tiền bằng mã QR</h3><p>Mỗi hoá đơn có mã VietQR đúng số tiền. Người thuê báo đã chuyển, quản lý ghi thu.</p></li>
        <li><h3>Sự cố có người nhận</h3><p>Người thuê báo hỏng kèm ảnh, quản lý giao thợ, thợ báo lại khi xong.</p></li>
        <li><h3>Hợp đồng điện tử</h3><p>Lập hợp đồng, phụ lục và gia hạn ngay trong hệ thống. Người thuê xem lại hợp đồng của mình lúc nào cũng được.</p></li>
      </ul>
      <div class="cn-nut">
        <a class="nut nut-zalo" href="https://zalo.me/" data-pt="Chưa có số Zalo nhận liên hệ. Khi có, nút này mở Zalo với lời nhắn soạn sẵn.">Nhắn Zalo để được tư vấn</a>
        <a class="lk" href="#/dang-nhap">Đã có tài khoản? Đăng nhập ${MT}</a>
      </div>
    </div>
    <div class="cn-phai" data-hien style="--i:2">
      <div class="hd" data-ui>
        <div class="hd-dau"><div><b>Hoá đơn tháng 11/2026</b><span>Phòng ${esc(mau.soPhong)} · ${esc(mau.tenToaNha)}</span></div><span class="hd-tt">Chờ thanh toán</span></div>
        <table>
          <tbody>
            ${hd.dong.map((d) => { const dv = mau.danhSachDichVu.find((x) => x.tenDichVu === d.ten); return `<tr><th scope="row">${esc(d.ten)}${d.ct ? `<span>${dv && dv.loaiThu === 'THEO_CHI_SO' ? chiSo[dv.donViTinh] || '' : ''}${esc(d.ct)}</span>` : ''}</th><td>${tien(d.tien)}</td></tr>`; }).join('')}
          </tbody>
          <tfoot><tr><th scope="row">Cần trả</th><td>${tien(hd.tong)}</td></tr></tfoot>
        </table>
        <div class="hd-qr"><span class="qr" aria-hidden="true">Mã VietQR</span><p>Quét mã để chuyển đúng ${tien(hd.tong)}. Nội dung chuyển khoản đã điền sẵn.</p></div>
      </div>
      <p class="chu-thich">Minh hoạ màn hoá đơn trong ứng dụng. Đơn giá là giá thật của ${esc(mau.tenToaNha)}, chỉ số công tơ là ví dụ.</p>
    </div>
  </div>
</section>

<section class="ket">
  <img class="ket-anh" src="img/vuonnang_studio_nang.webp" alt="" width="960" height="720">
  <div class="ket-giua" data-hien>
    <h2 class="t2">Chọn phòng, hẹn giờ,<br><em class="n">đến xem</em></h2>
    <p>Không cần tài khoản. Quản lý toà sẽ gọi lại để xác nhận giờ hẹn.</p>
    <a class="nut nut-muc nut-lon" href="#/tim-phong">Tìm phòng</a>
  </div>
  <img class="ket-anh" src="img/binhminh_ban_cong.webp" alt="" width="960" height="720">
</section>`;
}

function sauTrangChu() {
  // Danh sách toà: rê chuột hoặc focus thì đổi ảnh bên cạnh.
  const anhEl = $('#toa-anh'), chuEl = $('#toa-chu');
  $$('#ds-toa a').forEach((a) => {
    const doi = () => { if (anhEl.getAttribute('src') !== a.dataset.anh) { anhEl.src = a.dataset.anh; chuEl.textContent = a.dataset.chu; } };
    a.addEventListener('mouseenter', doi); a.addEventListener('focus', doi);
  });
  // Băng chuyền phòng trống: mỗi toà một phòng trống rẻ nhất.
  const ds = TOA.map((t) => TRONG.filter((p) => p.toaNhaId === t.id).sort((a, b) => a.giaThueMacDinh - b.giaThueMacDinh)[0]).filter(Boolean);
  if (!ds.length) return;
  const nen = $$('.nb-nen img');
  let i = 0, lop = 0;
  const ve = () => {
    const p = ds[i];
    const khac = PHONG.find((x) => x.toaNhaId === p.toaNhaId && x.anhDaiDien !== p.anhDaiDien) || p; // nền: ảnh khác của cùng toà
    lop = 1 - lop; nen[lop].src = anh(khac); nen[lop].classList.add('hien'); nen[1 - lop].classList.remove('hien');
    $('#nb-than').innerHTML = `<a class="nb-phong" href="#/phong/${p.id}"><img src="${anh(p)}" alt="Phòng ${esc(p.soPhong)}, ${esc(p.tenToaNha)}" width="960" height="720">
      <span class="nb-ten">Phòng ${esc(p.soPhong)} · ${esc(p.tenToaNha)}</span><span class="nb-phu">${esc(thanhPho(p.diaChiToaNha))} · ${moTaNgan(p)}</span>
      <span class="nb-gia"><b>${tien(p.giaThueMacDinh)}</b> /tháng</span><span class="nut nut-muc">Xem phòng này</span></a>`;
    $('#nb-dem').textContent = `${i + 1} / ${ds.length}`;
  };
  $('#nb-truoc').onclick = () => { i = (i - 1 + ds.length) % ds.length; ve(); };
  $('#nb-sau').onclick = () => { i = (i + 1) % ds.length; ve(); };
  ve();
}

/* ---------- Tìm phòng ---------- */
function manTimPhong(q) {
  const loai = [...new Set(PHONG.map((p) => p.loaiPhong).filter(Boolean))].sort();
  const chon = q.get('tp') ? `tp:${q.get('tp')}` : q.get('toa') || '';
  const o = (v, nhan, dang) => `<option value="${esc(v)}"${String(v) === String(dang) ? ' selected' : ''}>${nhan}</option>`;
  return `
<section class="khung trang tp">
  <div class="tp-dau">
    <h1 class="t2">Tìm <em class="n">phòng</em></h1>
    <p>${TRONG.length} phòng đang trống ở ${TOA.length} toà${RE_NHAT ? `, giá từ ${tien(RE_NHAT.giaThueMacDinh)} mỗi tháng` : ''}.</p>
  </div>
  <form class="loc" id="loc" role="search" aria-label="Lọc phòng" onsubmit="return false">
    <label class="o"><span>Toà nhà</span><select name="noi">
      ${o('', 'Tất cả toà', chon)}
      ${TP.map((tp) => `<optgroup label="${esc(tp)}">${o(`tp:${tp}`, `Cả ${esc(tp)}`, chon)}${TOA.filter((t) => thanhPho(t.diaChi) === tp).map((t) => o(t.id, `${esc(t.ten)} (${t.soPhongTrong} trống)`, chon)).join('')}</optgroup>`).join('')}
    </select></label>
    <label class="o"><span>Mức giá mỗi tháng</span><select name="gia">
      ${o('', 'Tất cả mức giá', q.get('gia'))}${o('DUOI_3_5', 'Dưới 3.500.000 ₫', q.get('gia'))}${o('3_5_DEN_5', '3.500.000 đến 5.000.000 ₫', q.get('gia'))}${o('TREN_5', 'Trên 5.000.000 ₫', q.get('gia'))}
    </select></label>
    <label class="o"><span>Loại phòng</span><select name="loai">${o('', 'Tất cả loại', q.get('loai'))}${loai.map((l) => o(l, esc(l), q.get('loai'))).join('')}</select></label>
    <label class="o"><span>Số phòng hoặc địa chỉ</span><input type="search" name="q" value="${esc(q.get('q') || '')}" placeholder="Ví dụ: 401, Duy Tân" autocomplete="off"></label>
    <div class="chip-hang" id="chip-hang"></div>
  </form>
  <div class="kq-dau"><h2 class="t4" id="kq-td" aria-live="polite"></h2><button type="button" class="lk" id="dat-lai" hidden>Đặt lại bộ lọc</button></div>
  <div id="kq"></div>
</section>`;
}

function sauTimPhong(q) {
  const form = $('#loc');
  // Tiện ích phòng nào cũng có thì lọc không có nghĩa: chỉ đưa lên chip những tiện ích phân biệt được phòng.
  const tienIch = [...new Set(PHONG.flatMap((p) => p.tienIch))].filter((t) => PHONG.some((p) => !p.tienIch.includes(t)));
  const b = { tatca: q.get('tatca') === '1', ti: (q.get('ti') || '').split(',').filter(Boolean), tt: q.get('tt') };
  let soHien = 12;
  const doc = () => {
    const f = new FormData(form), n = f.get('noi');
    Object.assign(b, { tp: n.startsWith('tp:') ? n.slice(3) : '', toa: n.startsWith('tp:') ? '' : n, gia: f.get('gia'), loai: f.get('loai'), q: f.get('q') });
  };
  const ve = () => {
    doc();
    const kq = locPhong(b);
    const coLoc = b.tp || b.toa || b.gia || b.loai || b.q || b.ti.length || b.tatca;
    // Ghi bộ lọc lên địa chỉ để gửi link và bấm Quay lại vẫn đúng (replaceState không kích hashchange).
    const qs = new URLSearchParams(Object.entries({ tp: b.tp, toa: b.toa, gia: b.gia, loai: b.loai, q: b.q, ti: b.ti.join(','), tatca: b.tatca ? '1' : '', tt: b.tt || '' }).filter(([, v]) => v));
    history.replaceState(null, '', `#/tim-phong${qs.toString() ? `?${qs}` : ''}`);
    $('#chip-hang').innerHTML = `<button type="button" class="chip" data-tatca aria-pressed="${!b.tatca}">Chỉ phòng trống <b>${locPhong({ ...b, tatca: false }).length}</b></button>`
      + tienIch.map((t) => { const bat = b.ti.includes(t), n = locPhong({ ...b, ti: [...new Set([...b.ti, t])] }).length; return `<button type="button" class="chip" data-ti="${esc(t)}" aria-pressed="${bat}"${!bat && !n ? ' disabled' : ''}>${esc(t)} <b>${n}</b></button>`; }).join('');
    $('#dat-lai').hidden = !coLoc;
    const td = $('#kq-td'), o = $('#kq');
    if (b.tt === 'tai') { td.textContent = 'Đang tải phòng…'; o.innerHTML = `<div class="luoi-phong" aria-hidden="true">${'<div class="xuong"><i></i><b></b><b></b><b></b></div>'.repeat(6)}</div>`; return; }
    if (b.tt === 'loi') { td.textContent = 'Chưa tải được danh sách phòng'; o.innerHTML = `<div class="trong-kq" role="alert"><p>Không kết nối được máy chủ. Bộ lọc của bạn vẫn được giữ.</p><a class="nut nut-muc" href="#/tim-phong">Tải lại</a></div>`; return; }
    const soTrong = kq.filter(laTrong).length;
    td.innerHTML = kq.length ? `${kq.length} phòng${b.tatca ? `, ${soTrong} đang trống` : ' đang trống'} <span>Phòng trống trước, giá thấp đến cao</span>` : 'Không có phòng nào khớp';
    if (!kq.length) {
      const neuTatCa = b.tatca ? 0 : locPhong({ ...b, tatca: true }).length;
      o.innerHTML = `<div class="trong-kq"><p>${neuTatCa ? `Có ${neuTatCa} phòng khớp điều kiện nhưng đang có người thuê. Bạn có thể xem để biết giá, hoặc nới bộ lọc.` : 'Thử bỏ bớt tiện ích hoặc chọn mức giá rộng hơn.'}</p>
        ${neuTatCa ? '<button type="button" class="nut nut-muc" data-tatca>Xem cả phòng đang có người thuê</button>' : ''}<button type="button" class="nut nut-vien" data-dat-lai>Đặt lại bộ lọc</button></div>`;
      return;
    }
    o.innerHTML = `<div class="luoi-phong">${kq.slice(0, soHien).map(thePhong).join('')}</div>${kq.length > soHien ? `<div class="them"><button type="button" class="nut nut-vien" data-them>Xem thêm ${kq.length - soHien} phòng</button></div>` : ''}`;
  };
  const datLai = () => { form.reset(); $$('select', form).forEach((s) => { s.selectedIndex = 0; }); form.q.value = ''; b.ti = []; b.tatca = false; b.tt = ''; soHien = 12; ve(); };
  form.addEventListener('input', () => { soHien = 12; ve(); });
  $('.tp').addEventListener('click', (e) => {
    const c = e.target.closest('button'); if (!c) return;
    if ('tatca' in c.dataset) b.tatca = !b.tatca;
    else if (c.dataset.ti) b.ti = b.ti.includes(c.dataset.ti) ? b.ti.filter((t) => t !== c.dataset.ti) : [...b.ti, c.dataset.ti];
    else if ('them' in c.dataset) soHien += 12;
    else if ('datLai' in c.dataset || c.id === 'dat-lai') return datLai();
    else return;
    const khoa = c.dataset.ti; ve();
    if (khoa) $(`.chip[data-ti="${CSS.escape(khoa)}"]`)?.focus(); else if ('tatca' in c.dataset) $('.chip[data-tatca]')?.focus();
  });
  ve();
}

/* ---------- Chi tiết phòng ---------- */
const NHOM_DV = [['THEO_CHI_SO', 'Theo công tơ riêng của phòng'], ['CO_DINH', 'Cố định mỗi tháng'], ['THEO_NGUOI', 'Theo số người ở'], ['THEO_SO_LUONG', 'Chỉ tính khi bạn dùng']];
function manPhong(id) {
  const p = PHONG.find((x) => x.id === +id);
  if (!p) return `<section class="khung trang"><h1 class="t2">Không tìm thấy phòng này</h1><p class="le">Có thể phòng đã ngừng cho thuê hoặc đường dẫn bị sai.</p><a class="nut nut-muc" href="#/tim-phong">Xem phòng đang trống</a></section>`;
  const khac = (TRONG.filter((x) => x.toaNhaId === p.toaNhaId && x.id !== p.id).length ? TRONG.filter((x) => x.toaNhaId === p.toaNhaId && x.id !== p.id) : TRONG.filter((x) => thanhPho(x.diaChiToaNha) === thanhPho(p.diaChiToaNha) && x.id !== p.id)).slice(0, 3);
  const cungToa = khac.length && khac[0].toaNhaId === p.toaNhaId;
  const mai = new Date(Date.now() + 864e5); mai.setHours(9, 30, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  const dtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `
<article class="khung trang ct">
  <a class="lk lui" href="#/tim-phong?toa=${p.toaNhaId}">${MT} Phòng ở ${esc(p.tenToaNha)}</a>
  <div class="ct-luoi">
    <figure class="ct-anh"><img src="${anh(p)}" alt="Phòng ${esc(p.soPhong)}, ${esc(p.tenToaNha)}" width="960" height="720"></figure>

    <aside class="ct-ben">
      <p class="ct-toa">${esc(p.tenToaNha)} · ${esc(p.diaChiToaNha)}</p>
      <h1 class="t2">Phòng ${esc(p.soPhong)}</h1>
      <p class="ct-mo">${moTaNgan(p)} · tối đa ${p.sucChua} người</p>
      <p class="ct-gia"><b>${tien(p.giaThueMacDinh)}</b> /tháng</p>
      ${laTrong(p) ? `<p class="tt tt-xong">Đang trống, vào ở được ngay</p>
      <form class="dl" id="dat-lich" novalidate>
        <h2 class="t4">Đặt lịch xem phòng</h2>
        <label class="o"><span>Họ và tên</span><input name="hoTen" autocomplete="name" required aria-describedby="l-hoTen"><small class="loi-o" id="l-hoTen"></small></label>
        <label class="o"><span>Số điện thoại</span><input name="soDienThoai" type="tel" inputmode="numeric" autocomplete="tel" required aria-describedby="g-sdt l-soDienThoai"><small id="g-sdt">Quản lý toà sẽ gọi số này để xác nhận.</small><small class="loi-o" id="l-soDienThoai"></small></label>
        <label class="o"><span>Ngày giờ muốn xem</span><input name="thoiGianHen" type="datetime-local" value="${dtLocal(mai)}" min="${dtLocal(new Date())}" required aria-describedby="l-thoiGianHen"><small class="loi-o" id="l-thoiGianHen"></small></label>
        <details class="them-o"><summary>Thêm email hoặc lời nhắn</summary>
          <label class="o"><span>Email (không bắt buộc)</span><input name="email" type="email" autocomplete="email" aria-describedby="l-email"><small class="loi-o" id="l-email"></small></label>
          <label class="o"><span>Lời nhắn cho quản lý toà</span><textarea name="ghiChu" rows="3" placeholder="Ví dụ: tôi muốn hỏi chỗ để xe máy"></textarea></label>
        </details>
        <button class="nut nut-muc nut-day" type="submit">Gửi lịch hẹn xem phòng ${esc(p.soPhong)}</button>
        <p class="dl-chu">Không cần tài khoản.</p>
      </form>` : `<p class="tt tt-canh">${NHAN_TT[p.trangThai] || esc(p.nhanTrangThai)}</p>
      <div class="dl"><h2 class="t4">Phòng này chưa nhận lịch xem</h2><p>Bảng giá bên dưới vẫn đúng với các phòng cùng toà.</p><a class="nut nut-muc nut-day" href="#/tim-phong?toa=${p.toaNhaId}">Xem phòng trống ở ${esc(p.tenToaNha)}</a></div>`}
    </aside>

    <div class="ct-than">
      <section>
        <h2 class="t3">Mỗi tháng trả <em class="n">những gì</em></h2>
        <table class="bang-gia">
          <caption>Bảng giá niêm yết của ${esc(p.tenToaNha)}</caption>
          <tbody>
            <tr class="nhom"><th scope="rowgroup" colspan="2">Tiền thuê</th></tr>
            <tr><th scope="row">Tiền phòng</th><td>${tien(p.giaThueMacDinh)}/tháng</td></tr>
            ${NHOM_DV.map(([k, nhan]) => { const ds = p.danhSachDichVu.filter((d) => d.loaiThu === k); return ds.length ? `<tr class="nhom"><th scope="rowgroup" colspan="2">${nhan}</th></tr>${ds.map((d) => `<tr><th scope="row">${esc(d.tenDichVu)}</th><td>${donGia(d)}</td></tr>`).join('')}` : ''; }).join('')}
          </tbody>
        </table>
      </section>

      <section class="ut" id="uoc-tinh">
        <h2 class="t4">Ước tính một tháng ở phòng này</h2>
        <form class="ut-o" id="ut-form" onsubmit="return false">
          <label class="o"><span>Số người ở</span><input type="number" name="nguoi" min="1" max="${p.sucChua}" value="${Math.min(2, p.sucChua)}" inputmode="numeric"></label>
          <label class="o"><span>Xe máy gửi</span><input type="number" name="xe" min="0" max="6" value="1" inputmode="numeric"></label>
          <label class="o"><span>Điện dùng (kWh)</span><input type="number" name="kwh" min="0" max="2000" value="100" inputmode="numeric"></label>
          <label class="o"><span>Nước dùng (m³)</span><input type="number" name="m3" min="0" max="200" value="8" inputmode="numeric"></label>
        </form>
        <div class="ut-kq" id="ut-kq" aria-live="polite"></div>
        <p class="chu-thich">Số điện và nước là ví dụ, bạn sửa theo mức mình hay dùng. Tiền thật tính theo chỉ số công tơ mỗi tháng.</p>
      </section>

      <section>
        <h2 class="t4">Trong phòng có sẵn</h2>
        <ul class="tien-ich">${p.tienIch.map((t) => `<li>${esc(t)}</li>`).join('') || '<li>Chưa có thông tin</li>'}</ul>
      </section>
      ${p.moTa ? `<section><h2 class="t4">Về phòng này</h2><p class="ct-mota">${esc(p.moTa)}</p></section>` : ''}
    </div>
  </div>
  ${khac.length ? `<section class="ct-khac"><h2 class="t3">Phòng trống khác ${cungToa ? `ở ${esc(p.tenToaNha)}` : `tại ${esc(thanhPho(p.diaChiToaNha))}`}</h2><div class="luoi-phong">${khac.map(thePhong).join('')}</div></section>` : ''}
</article>
${laTrong(p) ? `<div class="day" id="day"><span><b>${tien(p.giaThueMacDinh)}</b> /tháng</span><a class="nut nut-muc" href="#dat-lich" id="day-nut">Đặt lịch xem</a></div>` : ''}`;
}

const THU = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
function gioHen(s) {
  const d = new Date(s), pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${THU[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
const sdtDep = (s) => s.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

function sauPhong(id) {
  const p = PHONG.find((x) => x.id === +id); if (!p) return;
  // Ước tính
  const ut = $('#ut-form');
  const veUt = () => {
    const v = Object.fromEntries(['nguoi', 'xe', 'kwh', 'm3'].map((k) => [k, Math.max(0, Math.min(+ut[k].max, Math.floor(+ut[k].value || 0)))]));
    const r = tinhThang(p, v);
    $('#ut-kq').innerHTML = `<p class="ut-tong"><span>Khoảng</span> <b>${tien(r.tong)}</b> <span>mỗi tháng${r.chuaTinh.length ? `, chưa gồm ${esc(noi(r.chuaTinh).toLowerCase())}` : ''}</span></p>
      ${r.chuaTinh.length ? `<p class="tt tt-canh">${esc(noi(r.chuaTinh))} ở toà này tính theo bậc thang nên chưa cộng vào.</p>` : ''}
      <ul>${r.dong.map((d) => `<li><span>${esc(d.ten)}${d.ct ? ` <i>${esc(d.ct)}</i>` : ''}</span><span>${tien(d.tien)}</span></li>`).join('')}</ul>`;
  };
  ut.addEventListener('input', veUt); veUt();
  // Đo chiều cao cột bên cho CSS: màn thấp thì cột dính theo đáy (xem .ct-ben).
  const ben = $('.ct-ben');
  if ('ResizeObserver' in window) new ResizeObserver(() => ben.style.setProperty('--cao', `${ben.offsetHeight}px`)).observe(ben);

  // Đặt lịch: kiểm tra tại chỗ, lỗi hiện ngay dưới ô (không dùng bong bóng của trình duyệt).
  const f = $('#dat-lich'); if (!f) return;
  const kiem = {
    hoTen: (v) => (v.trim().length < 2 ? 'Nhập họ và tên của bạn.' : ''),
    soDienThoai: (v) => (/^\d{10}$/.test(v.replace(/[\s.]/g, '')) ? '' : 'Số điện thoại gồm đúng 10 chữ số.'),
    thoiGianHen: (v) => (!v ? 'Chọn ngày giờ bạn muốn đến xem.' : new Date(v) < new Date() ? 'Giờ hẹn phải từ bây giờ trở đi.' : ''),
    email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Email chưa đúng dạng ten@vidu.com.'),
  };
  const soat = (ten) => { const loi = kiem[ten](f[ten].value); $(`#l-${ten}`).textContent = loi; f[ten].setAttribute('aria-invalid', loi ? 'true' : 'false'); return !loi; };
  Object.keys(kiem).forEach((ten) => f[ten].addEventListener('blur', () => { if (f[ten].value || f[ten].getAttribute('aria-invalid') === 'true') soat(ten); }));
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const sai = Object.keys(kiem).filter((ten) => !soat(ten));
    if (sai.length) { if (sai[0] === 'email') $('.them-o', f).open = true; f[sai[0]].focus(); return; }
    // Đúng hình dạng YeuCauDatLichHen của POST /api/public/dat-lich-hen. Bản xem trước không gửi đi.
    const yeuCau = { hoTen: f.hoTen.value.trim(), soDienThoai: f.soDienThoai.value.replace(/[\s.]/g, ''), email: f.email.value.trim() || undefined, phongId: p.id, toaNhaId: p.toaNhaId, thoiGianHen: f.thoiGianHen.value, ghiChu: f.ghiChu.value.trim() || undefined };
    f.outerHTML = `<div class="dl da-gui" id="dat-lich" role="status" tabindex="-1">
      <h2 class="t4">Đã gửi lịch hẹn</h2>
      <dl><div><dt>Phòng</dt><dd>${esc(p.soPhong)} · ${esc(p.tenToaNha)}</dd></div><div><dt>Giờ hẹn</dt><dd>${gioHen(yeuCau.thoiGianHen)}</dd></div><div><dt>Người hẹn</dt><dd>${esc(yeuCau.hoTen)} · ${esc(sdtDep(yeuCau.soDienThoai))}</dd></div></dl>
      <p>Quản lý toà sẽ gọi ${esc(sdtDep(yeuCau.soDienThoai))} để xác nhận. Bạn chưa cần chuẩn bị gì thêm.</p>
      <a class="nut nut-vien nut-day" href="#/tim-phong">Xem các phòng trống khác</a>
      <p class="ghi-chu-pt">Bản xem trước không gửi lên máy chủ. Trong ứng dụng thật, chỗ này hiện thêm mã lịch hẹn do máy chủ cấp.</p></div>`;
    $('#day')?.remove();
    $('#dat-lich').focus();
  });
  // Thanh dính đáy trên điện thoại: ẩn khi form đang trong tầm nhìn.
  const day = $('#day');
  if (day && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => day.classList.toggle('an', en.isIntersecting)).observe(f);
  $('#day-nut')?.addEventListener('click', (e) => { e.preventDefault(); $('#dat-lich').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); f.hoTen?.focus({ preventScroll: true }); });
}

/* ---------- Đăng nhập ---------- */
function manDangNhap() {
  return `
<section class="dn">
  <div class="dn-trai">
    <div class="dn-hop">
      <h1 class="t2">Đăng <em class="n">nhập</em></h1>
      <p class="dn-mo">Dành cho người đang thuê, chủ nhà, quản lý và thợ. Hệ thống tự đưa bạn về đúng trang của mình.</p>
      <form class="dn-form" id="dn-form" novalidate data-ui>
        <label class="o"><span>Số điện thoại</span><input name="soDienThoai" type="tel" inputmode="numeric" autocomplete="username" required aria-describedby="l-dn-sdt"><small class="loi-o" id="l-dn-sdt"></small></label>
        <label class="o"><span>Mật khẩu</span><input name="matKhau" type="password" autocomplete="current-password" required aria-describedby="l-dn-mk"><small class="loi-o" id="l-dn-mk"></small></label>
        <button class="nut nut-muc nut-day" type="submit">Đăng nhập</button>
        <p class="dn-phu"><a href="#/dang-nhap" data-pt="Mở màn Đặt lại mật khẩu của ứng dụng (đã có sẵn, giữ nguyên luồng).">Quên mật khẩu?</a> <a href="#/dang-nhap" data-pt="Mở màn Kích hoạt tài khoản của ứng dụng (đã có sẵn, giữ nguyên luồng).">Kích hoạt tài khoản lần đầu</a></p>
      </form>
      <p class="dn-chan">Người thuê chưa có tài khoản: hỏi quản lý toà để nhận tin nhắn kích hoạt.<br>Chưa thuê phòng? <a href="#/tim-phong">Tìm phòng đang trống</a></p>
    </div>
  </div>
  <div class="dn-phai">
    <img src="img/binhminh_cua_so_lon.webp" alt="" width="960" height="720">
    <div class="dn-vai">
      <h2 class="t4">Sau khi đăng nhập</h2>
      <ul>
        <li><b>Người thuê</b><span>Hoá đơn tháng này, mã QR để trả, báo hỏng.</span></li>
        <li><b>Chủ nhà, quản lý</b><span>Hôm nay: đã thu, còn nợ, việc cần quyết.</span></li>
        <li><b>Thợ</b><span>Việc được giao và lịch sửa chữa.</span></li>
      </ul>
    </div>
  </div>
</section>`;
}

function sauDangNhap() {
  const f = $('#dn-form');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const loiSdt = /^\d{10}$/.test(f.soDienThoai.value.replace(/[\s.]/g, '')) ? '' : 'Số điện thoại gồm đúng 10 chữ số.';
    const loiMk = f.matKhau.value ? '' : 'Nhập mật khẩu.';
    $('#l-dn-sdt').textContent = loiSdt; $('#l-dn-mk').textContent = loiMk;
    f.soDienThoai.setAttribute('aria-invalid', !!loiSdt); f.matKhau.setAttribute('aria-invalid', !!loiMk);
    if (loiSdt) return f.soDienThoai.focus();
    if (loiMk) return f.matKhau.focus();
    f.outerHTML = `<div class="ghi-chu-pt lon" role="status" tabindex="-1" id="dn-xong"><b>Bản xem trước dừng ở đây.</b> Trong ứng dụng thật, đăng nhập đúng sẽ vào thẳng: Người thuê → Hoá đơn của tôi · Chủ nhà, quản lý → Hôm nay · Thợ → Việc của tôi. Sai mật khẩu thì báo ngay dưới ô mật khẩu.<br><a href="#/">Về trang chủ</a></div>`;
    $('#dn-xong').focus();
  });
}

/* ---------- chân trang ---------- */
function veChan() {
  $('#chan').innerHTML = `
<div class="khung chan-luoi">
  <div class="chan-ve">
    <a class="logo" href="#/">MiniApart</a>
    <p>Phần mềm quản lý chung cư mini và nhà trọ cho thuê.</p>
    <div class="chan-dn"><a class="nut nut-trang nut-nho" href="#/dang-nhap">Cổng cư dân</a><a class="nut nut-vien-sang nut-nho" href="#/dang-nhap">Chủ nhà, quản lý đăng nhập</a></div>
  </div>
  <nav aria-label="Tìm phòng theo thành phố"><h2>Tìm phòng</h2><ul>${TP.map((tp) => `<li><a href="#/tim-phong?tp=${encodeURIComponent(tp)}">${esc(tp)}</a></li>`).join('')}<li><a href="#/tim-phong">Tất cả phòng trống</a></li></ul></nav>
  <nav aria-label="Toà nhà"><h2>Toà nhà</h2><ul>${TOA.map((t) => `<li><a href="#/tim-phong?toa=${t.id}">${esc(t.ten)}</a></li>`).join('')}</ul></nav>
  <nav aria-label="Về MiniApart"><h2>MiniApart</h2><ul><li><a href="#/vi-sao">Vì sao MiniApart</a></li><li><a href="#/chu-nha">Dành cho chủ nhà</a></li><li><a href="#/dang-nhap">Đăng nhập</a></li></ul></nav>
</div>
<p class="khung chan-day">© 2026 MiniApart <span>Bản xem trước thiết kế. Dữ liệu demo lấy từ API công khai.</span></p>`;
}

/* ---------- định tuyến bằng hash (bản thật dùng đường dẫn: / · /tim-phong · /phong/:id · /dang-nhap) ---------- */
const MUC = { '/vi-sao': 'vi-sao', '/chu-nha': 'chu-nha' };
let duongCu = null;
function dinhTuyen() {
  const [duongTho, qs = ''] = location.hash.replace(/^#/, '').split('?');
  let duong = duongTho || '/';
  if (!duong.startsWith('/')) { if (duongCu !== null) return; duong = '/'; } // neo trong trang (#man): giữ màn đang mở; mở mới bằng neo thì về trang chủ
  if (duong === '/kham-pha') { location.replace(`#/tim-phong${qs ? `?${qs}` : ''}`); return; } // route cũ
  const q = new URLSearchParams(qs);
  const man = $('#man'), dau = $('#dau');
  dongMenu();
  const laChu = duong === '/' || duong in MUC;
  const khoa = laChu ? '/' : duong;
  const mPhong = duong.match(/^\/phong\/(\d+)$/);
  if (!(laChu && duongCu === '/')) { // đang ở trang chủ mà chỉ đổi mục thì không vẽ lại
    if (laChu) { man.innerHTML = manTrangChu(); sauTrangChu(); document.title = 'MiniApart — Chỗ ở tử tế, giá rõ ràng'; }
    else if (duong === '/tim-phong') { man.innerHTML = manTimPhong(q); sauTimPhong(q); document.title = 'Tìm phòng — MiniApart'; }
    else if (mPhong) { man.innerHTML = manPhong(mPhong[1]); sauPhong(mPhong[1]); const p = PHONG.find((x) => x.id === +mPhong[1]); document.title = `${p ? `Phòng ${p.soPhong} · ${p.tenToaNha}` : 'Không tìm thấy phòng'} — MiniApart`; }
    else if (duong === '/dang-nhap') { man.innerHTML = manDangNhap(); sauDangNhap(); document.title = 'Đăng nhập — MiniApart'; }
    else { man.innerHTML = `<section class="khung trang"><h1 class="t2">Không tìm thấy trang</h1><p class="le">Đường dẫn này không có trong MiniApart.</p><a class="nut nut-muc" href="#/">Về trang chủ</a></section>`; document.title = 'Không tìm thấy trang — MiniApart'; }
    document.body.dataset.man = laChu ? 'chu' : mPhong ? 'phong' : duong.slice(1);
    hienDan();
  }
  duongCu = khoa;
  $$('[data-nav]').forEach((a) => a.toggleAttribute('aria-current', a.dataset.nav === (MUC[duong] || duong.slice(1))));
  const muc = MUC[duong] && document.getElementById(MUC[duong]);
  if (muc) muc.scrollIntoView(); else scrollTo(0, 0);
  dauTrong();
  if (document.activeElement && document.activeElement !== document.body) man.focus({ preventScroll: true }); // sau khi bấm link: đưa focus về nội dung mới
}

// Thanh menu trong suốt khi còn nằm trên ảnh hero của trang chủ.
function dauTrong() { const h = $('.hero'); $('#dau').classList.toggle('trong', !!h && scrollY < h.offsetHeight - 80); }
addEventListener('scroll', dauTrong, { passive: true });

// Hiện dần khi cuộn tới. Không có JS hoặc người dùng tắt chuyển động: nội dung luôn hiện (xem CSS).
function hienDan() {
  const ds = $$('[data-hien]');
  if (!('IntersectionObserver' in window)) return ds.forEach((e) => e.classList.add('hien'));
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('hien'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  ds.forEach((e) => io.observe(e));
}

/* ---------- menu điện thoại ---------- */
const td = $('#thuc-don'), nutMo = $('#mo-menu');
function moMenu() { td.hidden = false; document.body.classList.add('khoa'); nutMo.setAttribute('aria-expanded', 'true'); $('#dong-menu').focus(); }
function dongMenu(traFocus) { if (td.hidden) return; td.hidden = true; document.body.classList.remove('khoa'); nutMo.setAttribute('aria-expanded', 'false'); if (traFocus) nutMo.focus(); }
nutMo.addEventListener('click', moMenu);
$('#dong-menu').addEventListener('click', () => dongMenu(true));
td.addEventListener('click', (e) => { if (e.target.closest('a')) dongMenu(); }); // bấm lại đúng trang đang mở thì hash không đổi, vẫn phải đóng
td.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return dongMenu(true);
  if (e.key !== 'Tab') return;
  const o = $$('a,button', td), dauDs = o[0], cuoi = o.at(-1); // giữ Tab trong menu
  if (e.shiftKey && document.activeElement === dauDs) { e.preventDefault(); cuoi.focus(); } else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dauDs.focus(); }
});
matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) dongMenu(); });

// Chỗ bản xem trước chưa nối thật (Zalo, quên mật khẩu): bấm thì nói rõ sẽ xảy ra gì thay vì đi tới link chết.
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-pt]'); if (!a) return;
  e.preventDefault();
  let o = a.parentElement.querySelector('.ghi-chu-pt');
  if (!o) { o = document.createElement('p'); o.className = 'ghi-chu-pt'; o.setAttribute('role', 'status'); a.parentElement.append(o); }
  o.textContent = `Bản xem trước: ${a.dataset.pt}`;
});

addEventListener('hashchange', dinhTuyen);
veChan();
dinhTuyen();
