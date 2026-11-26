import { cloneElement, useEffect, useRef, useState, type ReactElement } from 'react'
import './TaoHopDong.css'
import { fetchPhong, type ThongTinHopDong, type ThongTinPhong } from './api'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { EmptyState } from './design/feedback/EmptyState'
import { Input, Select } from './design/forms/Field'
import { DauTrang } from './design/layout/DauTrang'
import { ChanDinh } from './design/layout/ChanDinh'
import { NhanMinhHoa } from './design/feedback/NhanMinhHoa'
import type { TrangProps } from './dinhTuyen'
import { kiemTraFormTao, useFormTaoHopDong, type FormTaoHopDong } from './HopDongThaoTac'
import { managementRequest, type Service, type Tenant } from './managementApi'
import { useMotToa } from './toaDangChon'

/** Ô có nhãn luôn hiện, gợi ý (help) dưới ô, lỗi theo ô. */
function Muc({ nhan, help, loi, mh, children }: { nhan: string; help?: string; loi?: string; mh?: boolean; children: ReactElement<Record<string, unknown>> }) {
  return (
    <label className="field">
      <span className="label">{nhan}{mh ? <> <NhanMinhHoa>cần backend</NhanMinhHoa></> : null}</span>
      {loi ? cloneElement(children, { 'aria-invalid': true }) : children}
      {help ? <span className="help">{help}</span> : null}
      {loi ? <span className="error-text" role="alert">{loi}</span> : null}
    </label>
  )
}

/** Ngày kết thúc = bắt đầu + n tháng − 1 ngày (01/12/2026 + 12 tháng → 30/11/2027). */
export function tinhNgayKetThuc(batDau: string, thang: number): string {
  const [y, m, d] = batDau.split('-').map(Number)
  if (!y || !m || !d) return ''
  const hanChot = new Date(Date.UTC(y, m - 1 + thang + 1, 0)).getUTCDate() // không tràn sang tháng sau (31/08 + 6 tháng)
  return new Date(Date.UTC(y, m - 1 + thang, Math.min(d, hanChot) - 1)).toISOString().slice(0, 10)
}

const CACH_TINH: Record<string, string> = { THEO_CHI_SO: 'theo công tơ', THEO_NGUOI: 'theo số người', CO_DINH: 'cố định mỗi tháng', THEO_SO_LUONG: 'theo số lượng' }
const NHAN_THIEU: Partial<Record<keyof FormTaoHopDong, string>> = { phongId: 'Chưa chọn phòng', nguoiThueId: 'Chưa chọn người thuê', ngayBatDau: 'Chưa nhập ngày bắt đầu', ngayKetThuc: 'Chưa có ngày kết thúc', giaThue: 'Chưa nhập giá thuê', tienCoc: 'Chưa nhập tiền cọc', soNgayBaoTruoc: 'Chưa nhập số ngày báo trước' }
type DuLieu = { phong: ThongTinPhong[]; nguoiThue: Tenant[]; dichVu: Service[] }

export default function TaoHopDong({ token, mobile, dieuHuong }: TrangProps) {
  const { toaNhaId, canChonTaiCho, danhSach, chon } = useMotToa({ tuChonDau: true })
  const [tai, setTai] = useState<{ trang: 'tai' } | { trang: 'loi'; loi: string } | { trang: 'xong'; du: DuLieu }>({ trang: 'tai' })
  const [lanThu, setLanThu] = useState(0)
  useEffect(() => {
    if (!toaNhaId) return undefined
    let active = true
    setTai({ trang: 'tai' })
    Promise.all([
      fetchPhong(token, toaNhaId),
      managementRequest<Tenant[]>(token, '/api/nguoi-thue'),
      managementRequest<Service[]>(token, `/api/toa-nha/${toaNhaId}/dich-vu`),
    ])
      .then(([phong, nguoiThue, dichVu]) => { if (active) setTai({ trang: 'xong', du: { phong, nguoiThue, dichVu } }) })
      .catch((e: unknown) => { if (active) setTai({ trang: 'loi', loi: e instanceof Error ? e.message : 'Không tải được dữ liệu.' }) })
    return () => { active = false }
  }, [token, toaNhaId, lanThu])

  const dau = <DauTrang vet={[{ nhan: 'Hợp đồng', href: '/hop-dong' }, { nhan: 'Tạo hợp đồng', href: '/hop-dong/moi' }]} tieuDe="Tạo hợp đồng" />
  if (!toaNhaId) {
    return (
      <>{dau}
        <section className="card" style={{ padding: 24, maxWidth: 480 }}>
          {canChonTaiCho ? (
            <label className="field">
              <span className="label">Toà nhà của hợp đồng</span>
              <Select value="" onChange={(e) => chon(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Chọn toà nhà</option>
                {danhSach.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
              </Select>
            </label>
          ) : <EmptyState kind="loading" title="Đang tải toà nhà" />}
        </section>
      </>
    )
  }
  if (tai.trang === 'tai') return <>{dau}<section className="card" style={{ padding: 24 }}><EmptyState kind="loading" title="Đang tải dữ liệu hợp đồng" /></section></>
  if (tai.trang === 'loi') return <>{dau}<section className="card"><EmptyState kind="error" title="Không tải được dữ liệu tạo hợp đồng" body={`${tai.loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setLanThu((n) => n + 1)} /></section></>
  return <LuongTao token={token} mobile={mobile} dieuHuong={dieuHuong} du={tai.du} tenToa={danhSach.find((t) => t.id === toaNhaId)?.ten ?? ''} />
}

function LuongTao({ token, mobile, dieuHuong, du, tenToa }: Pick<TrangProps, 'token' | 'mobile' | 'dieuHuong'> & { du: DuLieu; tenToa: string }) {
  const f = useFormTaoHopDong(du.phong, du.nguoiThue, du.dichVu)
  const { form, setForm, applied, setApplied, phongChon, nguoiThueChon } = f
  const [tim, setTim] = useState('')
  const [cccd, setCccd] = useState('')
  const [soNguoi, setSoNguoi] = useState('1')
  const [soThang, setSoThang] = useState(12)
  const [cocSuaTay, setCocSuaTay] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loiGui, setLoiGui] = useState<string | null>(null)

  const dvDung = du.dichVu.filter((s) => s.dangSuDung)
  const phongTrong = du.phong.filter((p) => p.trangThai === 'TRONG' || String(p.id) === form.phongId)
  const nhanNguoi = (t: Tenant) => `${t.hoTen} · ${t.soDienThoai}`
  // Giá niêm yết → giá thuê; cọc theo 2 tháng cho tới khi người dùng tự sửa cọc.
  const datGia = (gia: string, coc = cocSuaTay) => setForm((p) => ({ ...p, giaThue: gia, tienCoc: coc || gia === '' ? p.tienCoc : String(Number(gia) * 2) }))
  const chonPhong = (id: string) => {
    f.chonPhong(id)
    const gia = du.phong.find((p) => p.id === Number(id))?.giaThueMacDinh
    if (gia) datGia(gia, false), setCocSuaTay(false)
  }

  // Mặc định mọi dịch vụ đang dùng của toà được áp dụng, theo bảng giá toà; bỏ tích hoặc nhập giá riêng nếu cần.
  useEffect(() => { setApplied(Object.fromEntries(dvDung.map((s) => [s.id, '']))) }, [])
  // ?phongId= (từ hồ sơ phòng trống): điền sẵn phòng một lần.
  const daDienSan = useRef(false)
  useEffect(() => {
    if (daDienSan.current) return
    daDienSan.current = true
    const id = new URLSearchParams(window.location.search).get('phongId')
    if (id && du.phong.some((p) => p.id === Number(id))) chonPhong(id)
  }, [])
  useEffect(() => { setForm((p) => ({ ...p, ngayKetThuc: tinhNgayKetThuc(p.ngayBatDau, soThang) })) }, [form.ngayBatDau, soThang])

  const timNguoi = (v: string) => {
    setTim(v)
    const t = du.nguoiThue.find((x) => nhanNguoi(x) === v) ?? du.nguoiThue.find((x) => x.soDienThoai === v.trim() || x.hoTen.toLowerCase() === v.trim().toLowerCase())
    setForm((p) => ({ ...p, nguoiThueId: t ? String(t.id) : '' }))
    const gt = (t?.soGiayTo ?? '').replace(/\D/g, '')
    setCccd(gt.length === 12 ? gt : '')
  }

  const loiForm = kiemTraFormTao(form, 5)
  const sucChua = phongChon?.sucChua
  const loiSoNguoi = !(Number(soNguoi) >= 1) || !Number.isInteger(Number(soNguoi)) ? 'Nhập số người ở từ 1.' : sucChua && Number(soNguoi) > sucChua ? `Phòng này ở tối đa ${sucChua} người.` : ''
  const thieu = [
    ...(Object.keys(loiForm) as (keyof FormTaoHopDong)[]).map((k) => NHAN_THIEU[k] ?? 'Chưa đủ thông tin'),
    ...(/^\d{12}$/.test(cccd) ? [] : ['Chưa có số CCCD']),
    ...(loiSoNguoi ? ['Số người ở chưa đúng'] : []),
  ]
  const duDieuKien = thieu.length === 0
  const lyDoChan = busy ? 'Đang tạo hợp đồng, vui lòng chờ.' : duDieuKien ? undefined : `Còn thiếu: ${thieu.join(', ').toLowerCase()}.`

  const gui = async () => {
    if (!duDieuKien || busy) return
    setBusy(true); setLoiGui(null)
    try {
      const row = await managementRequest<ThongTinHopDong>(token, '/api/hop-dong', 'POST', f.taoBody())
      dieuHuong(`/hop-dong/${row.id}`)
    } catch (e) {
      setLoiGui(e instanceof Error ? e.message : 'Không tạo được hợp đồng.')
      setBusy(false)
    }
  }
  const daNhap = form.phongId !== '' || form.nguoiThueId !== '' || form.giaThue !== '' || tim !== ''
  const huy = () => { if (!daNhap || window.confirm('Bỏ hợp đồng đang nhập? Dữ liệu đã nhập sẽ mất.')) dieuHuong('/hop-dong') }
  const nutTao = <Button variant="primary" blocked={!duDieuKien || busy} blockedReason={lyDoChan} onClick={() => void gui()}>Tạo hợp đồng</Button>
  const nutHuy = <Button variant="secondary" onClick={huy}>Huỷ</Button>
  const set = (k: keyof FormTaoHopDong) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const tien = (n: number) => `${dinhDangTien(n)} ₫`
  const thuKhiKy = (
    <section className="card hd-khoi" aria-labelledby="hd-thu">
      <h2 id="hd-thu">Thu khi ký</h2>
      <div>
        <div className="hd-tong"><span>Tiền cọc</span><b>{tien(f.tienCocSo)}</b></div>
        <div className="hd-tong"><span>Tiền phòng tháng đầu</span><b>{tien(f.giaThueSo)}</b></div>
        <div className="hd-tong cuoi"><span>Tổng thu khi ký</span><b data-tong-thu>{tien(f.tongThanhToanDauKy)}</b></div>
      </div>
      <p className="hd-ghichu">Điện nước tính từ chỉ số bàn giao, vào hoá đơn tháng sau.</p>
    </section>
  )
  const conThieu = (
    <section className="card hd-khoi" aria-labelledby="hd-thieu">
      <h2 id="hd-thieu">Còn thiếu</h2>
      <ul className="hd-thieu">
        {duDieuKien
          ? <li className="du"><Icon name="check" size="sm" />Phòng, thời hạn, giá, dịch vụ đã đủ</li>
          : thieu.map((t) => <li key={t} className="thieu"><Icon name="alert" size="sm" />{t}</li>)}
      </ul>
    </section>
  )

  return (
    <>
      <DauTrang
        vet={[{ nhan: 'Hợp đồng', href: '/hop-dong' }, { nhan: 'Tạo hợp đồng', href: '/hop-dong/moi' }]}
        tieuDe="Tạo hợp đồng"
        phu={`${tenToa} · một trang, điền từ trên xuống`}
        hanhDong={mobile ? undefined : <>{nutHuy}{nutTao}</>}
      />
      <form className="hd-moi" onSubmit={(e) => { e.preventDefault(); void gui() }} noValidate data-testid="tao-hop-dong">
        <div className="hd-moi-trai">
          <section className="card hd-khoi" aria-labelledby="hd-k1">
            <h2 id="hd-k1">1. Phòng và người thuê</h2>
            <div className="hd-luoi">
              <Muc nhan="Phòng" help={`Chỉ hiện ${du.phong.filter((p) => p.trangThai === 'TRONG').length} phòng đang trống.`}>
                <Select value={form.phongId} onChange={(e) => chonPhong(e.target.value)}>
                  <option value="">Chọn phòng</option>
                  {phongTrong.map((r) => <option key={r.id} value={r.id ?? ''}>{r.soPhong} · {r.dienTich} m² · {dinhDangTien(r.giaThueMacDinh || '0')} ₫/tháng</option>)}
                </Select>
              </Muc>
              <Muc nhan="Người thuê" help="Chưa có trong danh sách? Tạo người thuê ở mục Người thuê trước.">
                <Input list="hd-nguoi-thue" value={tim} placeholder="Gõ tên hoặc số điện thoại" autoComplete="off" onChange={(e) => timNguoi(e.target.value)} />
              </Muc>
              <datalist id="hd-nguoi-thue">{du.nguoiThue.map((t) => <option key={t.id} value={nhanNguoi(t)} />)}</datalist>
              <Muc nhan="Số CCCD" mh>
                <Input inputMode="numeric" maxLength={12} placeholder="12 số" value={cccd} onChange={(e) => setCccd(e.target.value.replace(/\D/g, ''))} />
              </Muc>
              <Muc nhan="Số người ở" mh loi={loiSoNguoi && phongChon ? loiSoNguoi : undefined} help={sucChua ? `Phòng này ở tối đa ${sucChua} người.` : undefined}>
                <Input type="number" min="1" step="1" value={soNguoi} onChange={(e) => setSoNguoi(e.target.value)} />
              </Muc>
            </div>
          </section>

          <section className="card hd-khoi" aria-labelledby="hd-k2">
            <h2 id="hd-k2">2. Thời hạn và tiền</h2>
            <div className="hd-luoi ba">
              <Muc nhan="Ngày bắt đầu" loi={loiForm.ngayBatDau}><Input type="date" value={form.ngayBatDau} onChange={set('ngayBatDau')} /></Muc>
              <Muc nhan="Thuê bao lâu">
                <Select value={soThang} onChange={(e) => setSoThang(Number(e.target.value))}>
                  {[6, 12, 24].map((t) => <option key={t} value={t}>{t} tháng</option>)}
                </Select>
              </Muc>
              <Muc nhan="Ngày kết thúc" help="Tự tính."><Input type="date" value={form.ngayKetThuc} disabled readOnly /></Muc>
              <Muc nhan="Giá thuê mỗi tháng" loi={loiForm.giaThue} help={phongChon ? 'Giá niêm yết của phòng.' : undefined}>
                <Input type="number" min="0" step="1000" value={form.giaThue} onChange={(e) => datGia(e.target.value)} />
              </Muc>
              <Muc nhan="Tiền cọc" loi={loiForm.tienCoc} help="Mặc định 2 tháng tiền phòng.">
                <Input type="number" min="0" step="1000" value={form.tienCoc} onChange={(e) => { setCocSuaTay(true); set('tienCoc')(e) }} />
              </Muc>
              <Muc nhan="Báo trước khi trả phòng" loi={loiForm.soNgayBaoTruoc}>
                <Select value={form.soNgayBaoTruoc} onChange={set('soNgayBaoTruoc')}>
                  {[30, 45].map((n) => <option key={n} value={n}>{n} ngày</option>)}
                </Select>
              </Muc>
            </div>
          </section>

          <section className="card hd-khoi" aria-labelledby="hd-k3">
            <h2 id="hd-k3">3. Dịch vụ tính hàng tháng <small>lấy theo bảng giá của toà, đổi riêng cho hợp đồng này nếu cần</small></h2>
            {dvDung.length === 0 ? <p className="hd-ghichu">Toà chưa có dịch vụ đang dùng. Bạn vẫn có thể tạo hợp đồng.</p> : (
              <table className="hd-dv">
                <thead><tr><th scope="col">Dịch vụ</th><th scope="col" className="cach">Cách tính</th><th scope="col" className="gia">Đơn giá</th></tr></thead>
                <tbody>
                  {dvDung.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <label>
                          <input type="checkbox" checked={s.id in applied} onChange={(e) => { const c = { ...applied }; if (e.target.checked) c[s.id] = ''; else delete c[s.id]; setApplied(c) }} />
                          {s.ten}
                        </label>
                      </td>
                      <td className="cach">{CACH_TINH[s.cachTinh] ?? 'theo bảng giá'}</td>
                      <td className="gia">
                        {s.id in applied
                          ? <Input type="number" min="0" step="0.01" placeholder="Theo bảng giá toà" aria-label={`Giá riêng của ${s.ten}`} value={applied[s.id]} onChange={(e) => setApplied({ ...applied, [s.id]: e.target.value })} />
                          : <span className="hd-ghichu">Không áp dụng</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          {loiGui ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{loiGui}</p> : null}
        </div>
        <div className="hd-moi-phai">
          {thuKhiKy}
          {conThieu}
          {mobile ? <ChanDinh>{nutHuy}{nutTao}</ChanDinh> : null}
        </div>
      </form>
    </>
  )
}
