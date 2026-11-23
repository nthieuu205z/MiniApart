import { cloneElement, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import './TaoHopDong.css'
import { fetchPhong, type ThongTinHopDong, type ThongTinPhong } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { EmptyState } from './design/feedback/EmptyState'
import { Input, Select } from './design/forms/Field'
import { Breadcrumb } from './design/shell/Breadcrumb'
import type { TrangProps } from './dinhTuyen'
import { kiemTraFormTao, useFormTaoHopDong, type FormTaoHopDong } from './HopDongThaoTac'
import { managementRequest, type Service, type Tenant } from './managementApi'
import { useMotToa } from './toaDangChon'

const BUOC = ['Phòng & người thuê', 'Thời hạn & giá', 'Dịch vụ áp dụng', 'Người ở cùng & cọc', 'Xem lại & tạo'] as const
type So = 1 | 2 | 3 | 4 | 5

/** Ô có nhãn luôn hiện, gợi ý (help) dưới ô, lỗi theo ô. */
function Muc({ nhan, help, loi, children }: { nhan: string; help?: string; loi?: string; children: ReactElement<Record<string, unknown>> }) {
  return (
    <label className="field">
      <span className="label">{nhan}</span>
      {loi ? cloneElement(children, { 'aria-invalid': true }) : children}
      {help ? <span className="help">{help}</span> : null}
      {loi ? <span className="error-text" role="alert">{loi}</span> : null}
    </label>
  )
}

/** Bước hiện tại nằm trên URL (?buoc=) để nút Back của trình duyệt đi lùi bước. */
function useBuoc(): [number, (n: number) => string] {
  const [search, setSearch] = useState(() => window.location.search)
  useEffect(() => {
    const dongBo = () => setSearch(window.location.search)
    window.addEventListener('popstate', dongBo)
    return () => window.removeEventListener('popstate', dongBo)
  }, [])
  const n = Number(new URLSearchParams(search).get('buoc'))
  const href = (b: number) => {
    const p = new URLSearchParams(search)
    p.set('buoc', String(b))
    return `/hop-dong/moi?${p.toString()}`
  }
  return [Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1, href]
}

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

  const dau = (
    <>
      <Breadcrumb items={[{ nhan: 'Hợp đồng', href: '/hop-dong' }, 'Tạo hợp đồng']} />
      <h1 className="h1">Tạo hợp đồng</h1>
    </>
  )
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
  return <LuongTao token={token} mobile={mobile} dieuHuong={dieuHuong} du={tai.du} dau={dau} />
}

function LuongTao({ token, mobile, dieuHuong, du, dau }: Pick<TrangProps, 'token' | 'mobile' | 'dieuHuong'> & { du: DuLieu; dau: ReactNode }) {
  const f = useFormTaoHopDong(du.phong, du.nguoiThue, du.dichVu)
  const { form, setForm, applied, setApplied, phongChon, nguoiThueChon } = f
  const [buocUrl, hrefBuoc] = useBuoc()
  const [daCham, setDaCham] = useState(false) // chỉ hiện lỗi sau khi bấm Tiếp
  const [busy, setBusy] = useState(false)
  const [loiGui, setLoiGui] = useState<string | null>(null)

  // ?phongId= (từ hồ sơ phòng trống): điền sẵn phòng một lần, kèm giá/cọc mặc định như chọn tay.
  const daDienSan = useRef(false)
  useEffect(() => {
    if (daDienSan.current) return
    daDienSan.current = true
    const id = new URLSearchParams(window.location.search).get('phongId')
    if (id && du.phong.some((p) => p.id === Number(id))) f.chonPhong(id)
  }, [])

  // Chỉ vào được bước n khi mọi bước trước đã hợp lệ (tính từ dữ liệu form, không từ lịch sử bấm).
  const toiDa = useMemo(() => {
    for (const b of [1, 2, 3, 4] as const) if (Object.keys(kiemTraFormTao(form, b)).length) return b
    return 5
  }, [form])
  const buoc = Math.min(buocUrl, toiDa) as So
  const loi = daCham ? kiemTraFormTao(form, buoc) : {}
  const daNhap = form.phongId !== '' || form.nguoiThueId !== '' || form.ngayKetThuc !== '' || form.giaThue !== '' || form.tienCoc !== '' || Object.keys(applied).length > 0

  const di = (b: number) => { setDaCham(false); dieuHuong(hrefBuoc(b)) }
  const huy = () => { if (!daNhap || window.confirm('Bỏ hợp đồng đang nhập? Dữ liệu đã nhập sẽ mất.')) dieuHuong('/hop-dong') }
  const gui = async () => {
    setBusy(true); setLoiGui(null)
    try {
      const row = await managementRequest<ThongTinHopDong>(token, '/api/hop-dong', 'POST', f.taoBody())
      dieuHuong(`/hop-dong/${row.id}`)
    } catch (e) {
      setLoiGui(e instanceof Error ? e.message : 'Không tạo được hợp đồng.')
      setBusy(false)
    }
  }
  const tiep = () => {
    if (Object.keys(kiemTraFormTao(form, buoc)).length) { setDaCham(true); return }
    if (buoc === 5) void gui(); else di(buoc + 1)
  }

  const set = (k: keyof FormTaoHopDong) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const dvDung = du.dichVu.filter((s) => s.dangSuDung)
  const dvChon = dvDung.filter((s) => s.id in applied)
  const thoiHan = form.ngayKetThuc ? `${dinhDangNgayIso(form.ngayBatDau)} – ${dinhDangNgayIso(form.ngayKetThuc)}` : ''
  const tomTat: Record<number, string> = {
    1: phongChon && nguoiThueChon ? `P.${phongChon.soPhong} · ${nguoiThueChon.hoTen}` : '',
    2: thoiHan,
    3: `${dvChon.length} dịch vụ`,
    4: form.tienCoc !== '' ? `Cọc ${dinhDangTien(form.tienCoc)} ₫` : '',
  }

  const nav = mobile ? (
    <div className="wiz-m" aria-label={`Bước ${buoc}/5: ${BUOC[buoc - 1]}`}>
      <div className="mstep" aria-hidden="true">{BUOC.map((_, i) => <span key={i} className={i < buoc ? 'on' : ''} />)}</div>
      <p className="t-sm t-2">Bước {buoc}/5 · {BUOC[buoc - 1]}</p>
    </div>
  ) : (
    <section className="card" aria-label="Các bước tạo hợp đồng">
      <div className="vsteps">
        {BUOC.map((ten, i) => {
          const n = i + 1
          const trang = n < buoc ? 'done' : n === buoc ? 'cur' : 'todo'
          const noi = (
            <>
              <span className="n">{trang === 'done' ? <Icon name="check" size="sm" /> : n}</span>
              <div><div className="tt">{ten}</div><div className="st">{trang === 'cur' ? 'Đang điền' : trang === 'done' ? tomTat[n] : ''}</div></div>
            </>
          )
          return trang === 'done'
            ? <a key={n} className="vstep done" href={hrefBuoc(n)}>{noi}</a>
            : <div key={n} className={`vstep ${trang}`} {...(trang === 'cur' ? { 'aria-current': 'step' as const } : {})}>{noi}</div>
        })}
      </div>
    </section>
  )

  const dong = (nhan: string, v: ReactNode) => <div className="sumrow"><span>{nhan}</span><b>{v}</b></div>
  const tomTatBen = (
    <>
      {dong('Phòng', phongChon ? `${phongChon.soPhong} · Tầng ${phongChon.tang}` : '—')}
      {dong('Người thuê', nguoiThueChon?.hoTen ?? '—')}
      {dong('Thời hạn', thoiHan || '—')}
      {dong('Giá thuê', form.giaThue ? `${dinhDangTien(f.giaThueSo)} ₫` : '—')}
      {dong('Tiền cọc', form.tienCoc ? `${dinhDangTien(f.tienCocSo)} ₫` : '—')}
      {dong('Dịch vụ', dvChon.length ? `${dvChon.length} dịch vụ` : 'Chưa chọn')}
      {dong('Tổng đầu kỳ (thuê + cọc)', `${dinhDangTien(f.tongThanhToanDauKy)} ₫`)}
      <p className="t-meta" style={{ marginTop: 12 }}>Hợp đồng ở trạng thái Chờ ký cho tới khi hai bên ký.</p>
    </>
  )
  const tomTatKhung = mobile
    ? <details className="card wiz-sum"><summary className="h3">Tóm tắt</summary>{tomTatBen}</details>
    : <section className="card" aria-labelledby="w-sum"><h2 className="h3" id="w-sum" style={{ marginBottom: 8 }}>Tóm tắt</h2>{tomTatBen}</section>

  const thanBuoc: Record<So, ReactNode> = {
    1: (
      <div className="form-grid">
        <Muc nhan="Phòng cần thuê" loi={loi.phongId} help="Giá thuê và tiền cọc mặc định lấy theo phòng.">
          <Select value={form.phongId} onChange={(e) => f.chonPhong(e.target.value)}>
            <option value="">-- Chọn phòng --</option>
            {du.phong.map((r) => <option key={r.id} value={r.id ?? ''}>Phòng {r.soPhong} · Tầng {r.tang} · {r.tenTrangThai} ({dinhDangTien(r.giaThueMacDinh || '0')} đ)</option>)}
          </Select>
        </Muc>
        <Muc nhan="Người thuê đứng tên hợp đồng" loi={loi.nguoiThueId}>
          <Select value={form.nguoiThueId} onChange={set('nguoiThueId')}>
            <option value="">-- Chọn người thuê --</option>
            {du.nguoiThue.map((t) => <option key={t.id} value={t.id}>{t.hoTen} · SĐT: {t.soDienThoai}</option>)}
          </Select>
        </Muc>
      </div>
    ),
    2: (
      <div className="form-grid">
        <Muc nhan="Ngày bắt đầu" loi={loi.ngayBatDau}><Input type="date" value={form.ngayBatDau} onChange={set('ngayBatDau')} /></Muc>
        <div>
          <Muc nhan="Ngày kết thúc hợp đồng" loi={loi.ngayKetThuc}><Input type="date" min={form.ngayBatDau} value={form.ngayKetThuc} onChange={set('ngayKetThuc')} /></Muc>
          <div className="wiz-chips">
            {([[3, '3 tháng'], [6, '6 tháng'], [12, '1 năm'], [24, '2 năm']] as const).map(([t, n]) => <button key={t} type="button" className="btn btn-secondary btn-sm" onClick={() => f.chonThoiHan(t)}>{n}</button>)}
          </div>
        </div>
        <Muc nhan="Giá thuê mỗi tháng (đồng)" loi={loi.giaThue} help={phongChon ? `Giá mặc định của phòng ${phongChon.soPhong}: ${dinhDangTien(phongChon.giaThueMacDinh || '0')} ₫` : undefined}>
          <Input type="number" min="0" step="0.01" placeholder="VD: 4500000" value={form.giaThue} onChange={set('giaThue')} />
        </Muc>
      </div>
    ),
    3: (
      <>
        <div className="wiz-chips" style={{ marginTop: 0, marginBottom: 12 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={f.chonTatCaDichVu}>Chọn tất cả</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={f.boChonTatCaDichVu}>Bỏ chọn</button>
        </div>
        {dvDung.length === 0 ? <p className="t-sm t-2">Toà chưa có dịch vụ đang dùng. Bạn vẫn có thể sang bước tiếp theo.</p> : (
          <div className="wiz-dv">
            {dvDung.map((s) => (
              <div key={s.id} className={`wiz-dv-row${s.id in applied ? ' on' : ''}`}>
                <label>
                  <input type="checkbox" checked={s.id in applied} onChange={(e) => { const c = { ...applied }; if (e.target.checked) c[s.id] = ''; else delete c[s.id]; setApplied(c) }} />
                  <span>{s.ten}</span>
                </label>
                {s.id in applied
                  ? <Input type="number" min="0" step="0.01" placeholder="Giá riêng" aria-label={`Giá riêng của ${s.ten}`} value={applied[s.id]} onChange={(e) => setApplied({ ...applied, [s.id]: e.target.value })} />
                  : <span className="help">Bảng giá chuẩn</span>}
              </div>
            ))}
          </div>
        )}
      </>
    ),
    4: (
      <>
        <div className="form-grid">
          <div>
            <Muc nhan="Tiền cọc cam kết (đồng)" loi={loi.tienCoc}><Input type="number" min="0" step="0.01" placeholder="VD: 4500000" value={form.tienCoc} onChange={set('tienCoc')} /></Muc>
            <div className="wiz-chips">
              {([[1, 'Cọc 1 tháng'], [1.5, 'Cọc 1,5 tháng'], [2, 'Cọc 2 tháng']] as const).map(([h, n]) => <button key={h} type="button" className="btn btn-secondary btn-sm" onClick={() => f.chonTienCoc(h)}>{n}</button>)}
            </div>
          </div>
          <Muc nhan="Số ngày báo trước khi chuyển" loi={loi.soNgayBaoTruoc}><Input type="number" min="1" step="1" value={form.soNgayBaoTruoc} onChange={set('soNgayBaoTruoc')} /></Muc>
        </div>
        <p className="t-sm t-2" style={{ marginTop: 16 }}>Người ở cùng được thêm ở hồ sơ hợp đồng sau khi tạo.</p>
      </>
    ),
    5: (
      <>
        {dong('Phòng', phongChon ? `${phongChon.soPhong} · Tầng ${phongChon.tang}` : '—')}
        {dong('Người thuê', nguoiThueChon ? `${nguoiThueChon.hoTen} · ${nguoiThueChon.soDienThoai}` : '—')}
        {dong('Thời hạn', `${dinhDangNgayIso(form.ngayBatDau)} – ${form.ngayKetThuc ? dinhDangNgayIso(form.ngayKetThuc) : '—'}`)}
        {dong('Giá thuê', `${dinhDangTien(f.giaThueSo)} ₫ / tháng`)}
        {dong('Tiền cọc', `${dinhDangTien(f.tienCocSo)} ₫`)}
        {dong('Báo trước khi chuyển', `${form.soNgayBaoTruoc} ngày`)}
        {dong('Dịch vụ áp dụng', dvChon.length ? dvChon.map((s) => s.ten).join(', ') : 'Chưa chọn')}
        {loiGui ? <p role="alert" className="alert alert-danger" style={{ marginTop: 12 }}><Icon name="alert" />{loiGui}</p> : null}
      </>
    ),
  }

  const nhanTiep = buoc === 5 ? 'Tạo hợp đồng' : `Tiếp: ${BUOC[buoc]}`
  return (
    <>
      {dau}
      <div className="wiz">
        {nav}
        <form className="card" aria-labelledby="w-buoc" onSubmit={(e) => { e.preventDefault(); tiep() }} noValidate>
          <p className="t-meta wiz-buoc">Bước {buoc}/5</p>
          <h2 className="h2" id="w-buoc" style={{ margin: '2px 0 18px' }}>{BUOC[buoc - 1]}</h2>
          {thanBuoc[buoc]}
          <div className="wiz-f">
            <Button type="button" variant="text" onClick={huy}>Huỷ</Button>
            <span className="push" />
            {buoc > 1 ? <Button type="button" variant="secondary" onClick={() => di(buoc - 1)}>Quay lại</Button> : null}
            <Button type="submit" variant="primary" blocked={busy} blockedReason={busy ? 'Đang tạo hợp đồng, vui lòng chờ.' : undefined}>{nhanTiep}</Button>
          </div>
        </form>
        {tomTatKhung}
      </div>
    </>
  )
}
