import { useEffect, useState } from 'react'
import { Anh, DonGia, Hien, MuiTen, Tien, chu, laTrong, moTaNgan, noi, thanhPho, useDuLieuCongKhai, anhPhong } from './dungChung'

const re = (a: number, b: number) => a - b

/** Trang chủ `/`: mọi con số đều tính từ API công khai. */
export default function TrangChu() {
  const { toa, phong, dangTai, loi, taiLai } = useDuLieuCongKhai()
  useEffect(() => { document.title = 'MiniApart — Chỗ ở tử tế, giá rõ ràng' }, [])
  const trong = phong.filter(laTrong)
  const tp = [...new Set(toa.map((t) => thanhPho(t.diaChi)))]
  const reNhat = [...trong].sort((a, b) => re(a.giaThueMacDinh, b.giaThueMacDinh))[0]
  const noiBat = toa.map((t) => trong.filter((p) => p.toaNhaId === t.id).sort((a, b) => re(a.giaThueMacDinh, b.giaThueMacDinh))[0]).filter(Boolean)
  const t0 = toa[0]
  const p0 = t0 ? phong.find((p) => p.toaNhaId === t0.id) : undefined

  return (
    <>
      <section className="hero">
        <img className="hero-anh" src="/rooms/moclan_ban_cong.webp" alt="Căn phòng có cửa ban công mở, rèm trắng, ghế gỗ và chậu cây" width={960} height={720} fetchPriority="high" />
        <div className="hero-trong khung">
          <div className="hero-chu">
            <h1 className="tc1">Chỗ ở tử tế,<br />giá rõ ràng</h1>
            <p className="hero-phu">
              {dangTai ? 'Đang tải phòng trống…'
                : loi ? 'Chưa tải được danh sách phòng. Bạn thử lại sau ít phút.'
                : trong.length ? `${trong.length} phòng đang trống ở ${toa.length} toà tại ${noi(tp)}. Giá điện, nước và từng khoản phí được ghi sẵn trước khi bạn đến xem.`
                : `Hiện chưa có phòng trống ở ${toa.length} toà. Bạn vẫn xem được bảng giá điện, nước của từng toà.`}
            </p>
          </div>
          <div className="hero-phai">
            {reNhat ? (
              <a className="hero-the" href={`/phong-trong/${reNhat.id}`}>
                <span className="ht-chu"><span className="ht-nhan">Giá thấp nhất đang trống</span><span className="ht-ten">Phòng {reNhat.soPhong} · {reNhat.tenToaNha}</span><span className="ht-gia"><Tien n={reNhat.giaThueMacDinh} /> /tháng</span></span>
                <img src={anhPhong(reNhat)} alt="" width={960} height={720} />
              </a>
            ) : null}
            <a className="nut nut-trang nut-lon" href="/tim-phong">Tìm phòng</a>
          </div>
        </div>
      </section>

      {loi ? (
        <section className="khung dai" role="alert">
          <p className="le">{loi}</p>
          <button type="button" className="nut nut-muc" onClick={taiLai}>Tải lại</button>
        </section>
      ) : null}

      {t0 && p0 ? <>
        <section className="dai khung" id="vi-sao">
          <Hien as="h2" className="tc2 loi">Mỗi phòng <img className="chen" src="/rooms/annhien_studio_ban_cong.webp" alt="" /> đều ghi sẵn tiền&nbsp;thuê, giá&nbsp;điện, giá&nbsp;nước <img className="chen" src="/rooms/phonho_studio_bep.webp" alt="" /> trước khi bạn đến&nbsp;xem</Hien>
          <div className="luoi vs">
            <Hien className="vs-gia">
              <h3 className="tc4">Bảng giá đang áp dụng ở {t0.ten}</h3>
              <ul className="hang-gia">
                {p0.danhSachDichVu.slice(0, 6).map((d) => <li key={d.id}><span>{d.tenDichVu}</span><span><DonGia dv={d} /></span></li>)}
              </ul>
              <a className="lk" href={`/tim-phong?toa=${t0.id}`}>Xem {t0.soPhongTrong} phòng trống ở toà này <MuiTen /></a>
            </Hien>
            <Hien className="vs-buoc" i={1}>
              <h3 className="tc4">Thuê phòng trong ba bước</h3>
              <ol className="buoc">
                <li><h4>Tìm phòng</h4><p>Lọc theo toà, mức giá, loại phòng. Không cần tài khoản.</p></li>
                <li><h4>Hẹn giờ đến xem</h4><p>Để lại tên và số điện thoại. Quản lý toà gọi lại để xác nhận.</p></li>
                <li><h4>Ký hợp đồng, vào ở</h4><p>Từ đó hoá đơn hằng tháng, mã QR trả tiền và báo hỏng nằm trong Cổng cư dân.</p></li>
              </ol>
            </Hien>
          </div>
        </section>

        <DanhSachToa />

        <section className="so" aria-labelledby="so-td">
          <div className="khung">
            <Hien as="h2" className="tc3"><span id="so-td">Số liệu lấy thẳng từ hệ thống</span></Hien>
            <ul className="so-cot">
              <Hien as="li"><strong>{toa.length}</strong><span>toà nhà ở {tp.length} thành phố</span></Hien>
              <Hien as="li" i={1}><strong>{trong.length}</strong><span>phòng đang trống trên {phong.length} phòng</span></Hien>
              {reNhat ? <Hien as="li" i={2}><strong>{new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(reNhat.giaThueMacDinh / 1e6)} <small>triệu</small></strong><span><Tien n={reNhat.giaThueMacDinh} /> mỗi tháng, giá thuê thấp nhất đang trống</span></Hien> : null}
            </ul>
          </div>
        </section>

        {noiBat.length ? <PhongNoiBat ds={noiBat} /> : null}

        <section className="ket">
          <img className="ket-anh" src="/rooms/vuonnang_studio_nang.webp" alt="" width={960} height={720} />
          <Hien className="ket-giua">
            <h2 className="tc2">Chọn phòng, hẹn giờ,<br />đến xem</h2>
            <p>Không cần tài khoản. Quản lý toà sẽ gọi lại để xác nhận giờ hẹn.</p>
            <a className="nut nut-muc nut-lon" href="/tim-phong">Tìm phòng</a>
          </Hien>
          <img className="ket-anh" src="/rooms/binhminh_ban_cong.webp" alt="" width={960} height={720} />
        </section>
      </> : null}
    </>
  )
}

/** Hàng kẻ các toà; rê chuột hoặc focus vào hàng nào thì ảnh bên cạnh đổi theo toà đó. */
function DanhSachToa() {
  const { toa, phong } = useDuLieuCongKhai()
  const anhToa = (id: number) => { const p = phong.find((x) => x.toaNhaId === id && laTrong(x)) ?? phong.find((x) => x.toaNhaId === id); return p ? anhPhong(p) : '' }
  const [chon, setChon] = useState(toa[0].id)
  const ct = toa.find((t) => t.id === chon) ?? toa[0]
  const tp = [...new Set(toa.map((t) => thanhPho(t.diaChi)))]
  return (
    <section className="dai khung luoi toa" id="toa-nha">
      <div className="toa-trai">
        <Hien as="h2" className="tc2">{chu(toa.length)} toà,<br />{chu(tp.length).toLowerCase()} thành phố</Hien>
        <Hien as="ul" className="hang-ds" i={1}>
          {toa.map((t) => (
            <li key={t.id}>
              <a href={`/tim-phong?toa=${t.id}`} onMouseEnter={() => setChon(t.id)} onFocus={() => setChon(t.id)}>
                <span className="hd-ten">{t.ten}</span>
                <span className="hd-phu">{thanhPho(t.diaChi)} · {t.soPhongTrong ? `${t.soPhongTrong} phòng trống` : 'đã kín phòng'}</span><MuiTen />
              </a>
            </li>
          ))}
        </Hien>
        <p className="toa-phu">Chọn một toà để xem phòng đang trống và bảng giá điện nước của toà đó.</p>
        <a className="nut nut-vien" href="/tim-phong">Xem tất cả phòng trống</a>
      </div>
      <Hien as="figure" className="toa-anh" i={2}>
        <img src={anhToa(ct.id)} alt="" width={960} height={720} />
        <figcaption>{ct.ten} · {ct.diaChi}</figcaption>
      </Hien>
    </section>
  )
}

/** Băng chuyền: mỗi toà một phòng trống rẻ nhất, lật bằng hai mũi tên. */
function PhongNoiBat({ ds }: { ds: ReturnType<typeof useDuLieuCongKhai>['phong'] }) {
  const { phong } = useDuLieuCongKhai()
  const [i, setI] = useState(0)
  const p = ds[i % ds.length]
  const khac = phong.find((x) => x.toaNhaId === p.toaNhaId && x.anhDaiDien !== p.anhDaiDien) ?? p // nền: ảnh khác của cùng toà
  return (
    <section className="noi-bat" aria-roledescription="băng chuyền" aria-labelledby="nb-td">
      <div className="nb-nen" aria-hidden="true"><img className="hien" src={anhPhong(khac)} alt="" /></div>
      <div className="nb-the">
        <h2 className="tc3" id="nb-td">Phòng đang trống</h2>
        <div aria-live="polite">
          <a className="nb-phong" href={`/phong-trong/${p.id}`}>
            <Anh p={p} alt={`Phòng ${p.soPhong}, ${p.tenToaNha}`} />
            <span className="nb-ten">Phòng {p.soPhong} · {p.tenToaNha}</span><span className="nb-phu">{thanhPho(p.diaChiToaNha)} · {moTaNgan(p)}</span>
            <span className="nb-gia"><b><Tien n={p.giaThueMacDinh} /></b> /tháng</span><span className="nut nut-muc">Xem phòng này</span>
          </a>
        </div>
        <div className="nb-dk">
          <button type="button" id="nb-truoc" aria-label="Phòng trước" onClick={() => setI((i - 1 + ds.length) % ds.length)}><MuiTen /></button>
          <span>{(i % ds.length) + 1} / {ds.length}</span>
          <button type="button" id="nb-sau" aria-label="Phòng sau" onClick={() => setI((i + 1) % ds.length)}><MuiTen /></button>
        </div>
      </div>
    </section>
  )
}
