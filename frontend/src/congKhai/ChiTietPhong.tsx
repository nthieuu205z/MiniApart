import { useEffect, useRef, useState, type FormEvent } from 'react'
import { guiDatLichHen, type PublicPhong } from '../api'
import { Anh, DonGia, MuiTen, Tien, laTrong, moTaNgan, nhanTrangThai, noi, so, thanhPho, tinhThang, useDuLieuCongKhai } from './dungChung'
import { ThePhong } from './TimPhong'

const NHOM_DV: Array<[string, string]> = [['THEO_CHI_SO', 'Theo công tơ riêng của phòng'], ['CO_DINH', 'Cố định mỗi tháng'], ['THEO_NGUOI', 'Theo số người ở'], ['THEO_SO_LUONG', 'Chỉ tính khi bạn dùng']]
const THU = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy']
const pad = (n: number) => String(n).padStart(2, '0')
const dtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const gioHen = (s: string) => { const d = new Date(s); return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${THU[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
const sdtDep = (s: string) => s.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3')
const gomSdt = (s: string) => s.replace(/[\s.]/g, '')

type Truong = 'hoTen' | 'soDienThoai' | 'thoiGianHen' | 'email'
export function kiemForm(v: Record<Truong, string>, bay = new Date()): Partial<Record<Truong, string>> {
  const loi: Partial<Record<Truong, string>> = {}
  if (v.hoTen.trim().length < 2) loi.hoTen = 'Nhập họ và tên của bạn.'
  if (!/^\d{10}$/.test(gomSdt(v.soDienThoai))) loi.soDienThoai = 'Số điện thoại gồm đúng 10 chữ số.'
  if (!v.thoiGianHen) loi.thoiGianHen = 'Chọn ngày giờ bạn muốn đến xem.'
  else if (new Date(v.thoiGianHen) < bay) loi.thoiGianHen = 'Giờ hẹn phải từ bây giờ trở đi.'
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) loi.email = 'Email chưa đúng dạng ten@vidu.com.'
  return loi
}

/** Chi tiết phòng `/phong-trong/:id`. (Không dùng `/phong/:id`: đó là hồ sơ phòng của Chủ/Quản lý trong app.) */
export default function ChiTietPhong({ id }: { id: number }) {
  const { phong, dangTai, loi, taiLai } = useDuLieuCongKhai()
  const p = phong.find((x) => x.id === id)
  useEffect(() => { document.title = `${p ? `Phòng ${p.soPhong} · ${p.tenToaNha}` : dangTai ? 'Đang tải' : 'Không tìm thấy phòng'} — MiniApart` }, [p, dangTai])

  if (dangTai) return <section className="khung trang"><h1 className="tc2">Đang tải phòng…</h1></section>
  if (loi) return <section className="khung trang" role="alert"><h1 className="tc2">Chưa tải được phòng này</h1><p className="le">{loi}</p><button type="button" className="nut nut-muc" onClick={taiLai}>Tải lại</button></section>
  if (!p) return <section className="khung trang"><h1 className="tc2">Không tìm thấy phòng này</h1><p className="le">Có thể phòng đã ngừng cho thuê hoặc đường dẫn bị sai.</p><a className="nut nut-muc" href="/tim-phong">Xem phòng đang trống</a></section>
  return <NoiDung key={p.id} p={p} />
}

function NoiDung({ p }: { p: PublicPhong }) {
  const { phong } = useDuLieuCongKhai()
  const trongKhac = phong.filter((x) => laTrong(x) && x.id !== p.id)
  const cungToa = trongKhac.filter((x) => x.toaNhaId === p.toaNhaId)
  const khac = (cungToa.length ? cungToa : trongKhac.filter((x) => thanhPho(x.diaChiToaNha) === thanhPho(p.diaChiToaNha))).slice(0, 3)
  const [daGui, setDaGui] = useState<{ gio: string; hoTen: string; sdt: string; ma?: number } | null>(null)
  const benRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dayRef = useRef<HTMLDivElement>(null)
  const xongRef = useRef<HTMLDivElement>(null)

  // Cột bên dính theo: màn thấp hơn cột thì dính theo đáy (CSS đọc --cao). Thanh đáy điện thoại ẩn khi form đang trong tầm nhìn.
  useEffect(() => {
    const ben = benRef.current, form = formRef.current, day = dayRef.current
    const ro = ben && 'ResizeObserver' in window ? new ResizeObserver(() => ben.style.setProperty('--cao', `${ben.offsetHeight}px`)) : null
    if (ben) ro?.observe(ben)
    const io = form && day && 'IntersectionObserver' in window ? new IntersectionObserver(([en]) => day.classList.toggle('an', en.isIntersecting)) : null
    if (form) io?.observe(form)
    return () => { ro?.disconnect(); io?.disconnect() }
  }, [daGui])
  useEffect(() => { if (daGui) xongRef.current?.focus() }, [daGui])

  return (
    <>
      <article className="khung trang ct">
        <a className="lk lui" href={`/tim-phong?toa=${p.toaNhaId}`}><MuiTen /> Phòng ở {p.tenToaNha}</a>
        <div className="ct-luoi">
          <figure className="ct-anh"><Anh p={p} alt={`Phòng ${p.soPhong}, ${p.tenToaNha}`} /></figure>

          <aside className="ct-ben" ref={benRef}>
            <p className="ct-toa">{p.tenToaNha} · {p.diaChiToaNha}</p>
            <h1 className="tc2">Phòng {p.soPhong}</h1>
            <p className="ct-mo">{moTaNgan(p)} · tối đa {p.sucChua} người</p>
            <p className="ct-gia"><b><Tien n={p.giaThueMacDinh} /></b> /tháng</p>
            {laTrong(p)
              ? <><p className="tt-cong tt-xong">Đang trống, vào ở được ngay</p>
                {daGui
                  ? <XacNhan p={p} d={daGui} xongRef={xongRef} />
                  : <FormDatLich p={p} formRef={formRef} onXong={setDaGui} />}</>
              : <><p className="tt-cong tt-canh">{nhanTrangThai(p)}</p>
                <div className="dl"><h2 className="tc4">Phòng này chưa nhận lịch xem</h2><p>Bảng giá bên dưới vẫn đúng với các phòng cùng toà.</p><a className="nut nut-muc nut-day" href={`/tim-phong?toa=${p.toaNhaId}`}>Xem phòng trống ở {p.tenToaNha}</a></div></>}
          </aside>

          <div className="ct-than">
            <section>
              <h2 className="tc3">Mỗi tháng trả những gì</h2>
              <table className="bang-gia">
                <caption>Bảng giá niêm yết của {p.tenToaNha}</caption>
                <tbody>
                  <tr className="nhom"><th scope="rowgroup" colSpan={2}>Tiền thuê</th></tr>
                  <tr><th scope="row">Tiền phòng</th><td><Tien n={p.giaThueMacDinh} />/tháng</td></tr>
                  {NHOM_DV.map(([k, nhan]) => {
                    const ds = p.danhSachDichVu.filter((d) => d.loaiThu === k)
                    return ds.length ? [
                      <tr className="nhom" key={k}><th scope="rowgroup" colSpan={2}>{nhan}</th></tr>,
                      ...ds.map((d) => <tr key={`${k}-${d.id}`}><th scope="row">{d.tenDichVu}</th><td><DonGia dv={d} /></td></tr>),
                    ] : null
                  })}
                </tbody>
              </table>
            </section>
            <UocTinh p={p} />
            <section>
              <h2 className="tc4">Trong phòng có sẵn</h2>
              <ul className="tien-ich">{p.tienIch.length ? p.tienIch.map((t) => <li key={t}>{t}</li>) : <li>Chưa có thông tin</li>}</ul>
            </section>
            {p.moTa ? <section><h2 className="tc4">Về phòng này</h2><p className="ct-mota">{p.moTa}</p></section> : null}
          </div>
        </div>
        {khac.length ? (
          <section className="ct-khac">
            <h2 className="tc3">Phòng trống khác {cungToa.length ? `ở ${p.tenToaNha}` : `tại ${thanhPho(p.diaChiToaNha)}`}</h2>
            <div className="luoi-phong">{khac.map((x) => <ThePhong key={x.id} p={x} />)}</div>
          </section>
        ) : null}
      </article>
      {laTrong(p) && !daGui ? (
        <div className="day" ref={dayRef}>
          <span><b><Tien n={p.giaThueMacDinh} /></b> /tháng</span>
          <a className="nut nut-muc" href="#dat-lich" onClick={(e) => { e.preventDefault(); formRef.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); formRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }) }}>Đặt lịch xem</a>
        </div>
      ) : null}
    </>
  )
}

function UocTinh({ p }: { p: PublicPhong }) {
  const [v, setV] = useState({ nguoi: Math.min(2, p.sucChua), xe: 1, kwh: 100, m3: 8 })
  const gioiHan = { nguoi: [1, p.sucChua], xe: [0, 6], kwh: [0, 2000], m3: [0, 200] } as const
  const doi = (k: keyof typeof v, s: string) => setV((c) => ({ ...c, [k]: Math.max(gioiHan[k][0], Math.min(gioiHan[k][1], Math.floor(+s || 0))) }))
  const r = tinhThang(p, v)
  const o = (k: keyof typeof v, nhan: string) => <label className="o"><span>{nhan}</span><input type="number" name={k} min={gioiHan[k][0]} max={gioiHan[k][1]} value={v[k]} inputMode="numeric" onChange={(e) => doi(k, e.target.value)} /></label>
  return (
    <section className="ut" id="uoc-tinh">
      <h2 className="tc4">Ước tính một tháng ở phòng này</h2>
      <div className="ut-o">{o('nguoi', 'Số người ở')}{o('xe', 'Xe máy gửi')}{o('kwh', 'Điện dùng (kWh)')}{o('m3', 'Nước dùng (m³)')}</div>
      <div className="ut-kq" aria-live="polite">
        <p className="ut-tong"><span>Khoảng</span> <b><Tien n={r.tong} /></b> <span>mỗi tháng{r.chuaTinh.length ? `, chưa gồm ${noi(r.chuaTinh).toLowerCase()}` : ''}</span></p>
        {r.chuaTinh.length ? <p className="tt-cong tt-canh">{noi(r.chuaTinh)} ở toà này tính theo bậc thang nên chưa cộng vào.</p> : null}
        <ul>{r.dong.map((d) => <li key={d.ten}><span>{d.ten}{d.ct ? <i>{d.ct}</i> : null}</span><span><Tien n={d.tien} /></span></li>)}</ul>
      </div>
      <p className="chu-thich">Số điện và nước là ví dụ, bạn sửa theo mức mình hay dùng. Tiền thật tính theo chỉ số công tơ mỗi tháng.</p>
    </section>
  )
}

function FormDatLich({ p, formRef, onXong }: { p: PublicPhong; formRef: React.RefObject<HTMLFormElement | null>; onXong: (d: { gio: string; hoTen: string; sdt: string; ma?: number }) => void }) {
  const [v, setV] = useState<Record<Truong | 'ghiChu', string>>(() => { const m = new Date(Date.now() + 864e5); m.setHours(9, 30, 0, 0); return { hoTen: '', soDienThoai: '', thoiGianHen: dtLocal(m), email: '', ghiChu: '' } })
  const [loi, setLoi] = useState<Partial<Record<Truong, string>>>({})
  const [dangGui, setDangGui] = useState(false)
  const [loiMay, setLoiMay] = useState<string | null>(null)
  const dat = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((c) => ({ ...c, [k]: e.target.value }))
  const soat = (k: Truong) => setLoi((c) => ({ ...c, [k]: kiemForm(v)[k] }))
  const moTa = (k: Truong, extra = '') => ({ 'aria-describedby': `${extra} l-${k}`.trim(), 'aria-invalid': loi[k] ? true : undefined, onBlur: () => { if (v[k] || loi[k]) soat(k) } })
  const them = useRef<HTMLDetailsElement>(null)

  async function gui(e: FormEvent) {
    e.preventDefault()
    const sai = kiemForm(v)
    setLoi(sai); setLoiMay(null)
    const dau = (['hoTen', 'soDienThoai', 'thoiGianHen', 'email'] as Truong[]).find((k) => sai[k])
    if (dau) { if (dau === 'email' && them.current) them.current.open = true; formRef.current?.querySelector<HTMLInputElement>(`[name="${dau}"]`)?.focus(); return }
    setDangGui(true)
    const sdt = gomSdt(v.soDienThoai)
    try {
      const res = await guiDatLichHen({ hoTen: v.hoTen.trim(), soDienThoai: sdt, email: v.email.trim() || undefined, phongId: p.id, toaNhaId: p.toaNhaId, thoiGianHen: v.thoiGianHen, ghiChu: v.ghiChu.trim() || undefined })
      onXong({ gio: v.thoiGianHen, hoTen: v.hoTen.trim(), sdt, ma: res.lichHenId })
    } catch (err) {
      setLoiMay(err instanceof Error ? err.message : 'Chưa gửi được lịch hẹn. Bạn kiểm tra lại thông tin rồi gửi lại.')
      setDangGui(false)
    }
  }

  return (
    <form className="dl" id="dat-lich" ref={formRef} noValidate onSubmit={gui}>
      <h2 className="tc4">Đặt lịch xem phòng</h2>
      <label className="o"><span>Họ và tên</span><input name="hoTen" autoComplete="name" required value={v.hoTen} onChange={dat('hoTen')} {...moTa('hoTen')} /><small className="loi-o" id="l-hoTen">{loi.hoTen}</small></label>
      <label className="o"><span>Số điện thoại</span><input name="soDienThoai" type="tel" inputMode="numeric" autoComplete="tel" required value={v.soDienThoai} onChange={dat('soDienThoai')} {...moTa('soDienThoai', 'g-sdt')} /><small id="g-sdt">Quản lý toà sẽ gọi số này để xác nhận.</small><small className="loi-o" id="l-soDienThoai">{loi.soDienThoai}</small></label>
      <label className="o"><span>Ngày giờ muốn xem</span><input name="thoiGianHen" type="datetime-local" min={dtLocal(new Date())} required value={v.thoiGianHen} onChange={dat('thoiGianHen')} {...moTa('thoiGianHen')} /><small className="loi-o" id="l-thoiGianHen">{loi.thoiGianHen}</small></label>
      <details className="them-o" ref={them}>
        <summary>Thêm email hoặc lời nhắn</summary>
        <label className="o"><span>Email (không bắt buộc)</span><input name="email" type="email" autoComplete="email" value={v.email} onChange={dat('email')} {...moTa('email')} /><small className="loi-o" id="l-email">{loi.email}</small></label>
        <label className="o"><span>Lời nhắn cho quản lý toà</span><textarea name="ghiChu" rows={3} placeholder="Ví dụ: tôi muốn hỏi chỗ để xe máy" value={v.ghiChu} onChange={dat('ghiChu')} /></label>
      </details>
      {loiMay ? <p className="tt-cong tt-no" role="alert">{loiMay}</p> : null}
      <button className="nut nut-muc nut-day" type="submit" disabled={dangGui}>{dangGui ? 'Đang gửi lịch hẹn…' : `Gửi lịch hẹn xem phòng ${p.soPhong}`}</button>
      <p className="dl-chu">Không cần tài khoản.</p>
    </form>
  )
}

function XacNhan({ p, d, xongRef }: { p: PublicPhong; d: { gio: string; hoTen: string; sdt: string; ma?: number }; xongRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="dl da-gui" id="dat-lich" role="status" tabIndex={-1} ref={xongRef}>
      <h2 className="tc4">Đã gửi lịch hẹn</h2>
      <dl>
        <div><dt>Phòng</dt><dd>{p.soPhong} · {p.tenToaNha}</dd></div>
        <div><dt>Giờ hẹn</dt><dd>{gioHen(d.gio)}</dd></div>
        <div><dt>Người hẹn</dt><dd>{d.hoTen} · {sdtDep(d.sdt)}</dd></div>
        {d.ma ? <div><dt>Mã lịch hẹn</dt><dd>#{so(d.ma)}</dd></div> : null}
      </dl>
      <p>Quản lý toà sẽ gọi {sdtDep(d.sdt)} để xác nhận. Bạn chưa cần chuẩn bị gì thêm.</p>
      <a className="nut nut-vien nut-day" href="/tim-phong">Xem các phòng trống khác</a>
    </div>
  )
}
