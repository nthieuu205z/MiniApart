import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, type ThongTinHoaDonQuanLy, type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinToaNha, type ThongTinYeuCauSuaChua } from './api'
import { chuCaiDau } from './bangQuanTriChung'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { Breadcrumb } from './design/shell/Breadcrumb'
import { Button } from './design/core/Button'
import { Field, Select } from './design/forms/Field'
import type { TrangProps } from './dinhTuyen'
import { getLedger, type LedgerEntry } from './financeApi'
import { NganFormNguoiThue } from './HoSoNguoiThue'
import { fetchGhiChuLienHe, managementRequest, themGhiChuLienHe, type GhiChuLienHe, type KenhLienHe, type Tenant } from './managementApi'
import { today, useBuildings } from './ManagementShared'
import { nhomNo, tuHoaDonQuanLy, type DongNo } from './nhomNoTheoNguoi'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo } from './design/layout/KhoiSo'
import { ChanDinh } from './design/layout/ChanDinh'
import { HangTong } from './design/table/HangTong'
import { NganNhacNo } from './design/money/NganNhacNo'
import { dinhDangSdt, nhanThang } from './tienTheoNguoi'
import './HoSoNguoiPhong.css'

type NguoiDayDu = Tenant & { loaiGiayTo?: string; diaChiThuongTru?: string; diaChiLienHe?: string; email?: string }
export type HopDongToa = ThongTinHopDong & { toaNhaId: number; tenToa: string }
export type HoaDonHoSo = ThongTinHoaDonQuanLy & { toaNhaId: number; kyNhan: string }
type NoKy = DongNo & { kyNhan: string }
export type HoatDong = { ngay: string; cham: 'ok' | 'warn' | 'red' | ''; noiDung: ReactNode }
type DuLieu = {
  nguoi: NguoiDayDu
  hopDong: HopDongToa[]
  hoaDon: HoaDonHoSo[]
  no: NoKy[]
  suCo: ThongTinYeuCauSuaChua[]
  thanhToan: LedgerEntry | null
  khongTai: string[]
}

export const SU_CO_DONG = ['DA_DONG', 'DA_HUY']
export const kyNhanCua = (ky?: Pick<ThongTinKyThanhToan, 'nam' | 'thang'> | null) => (ky ? `${String(ky.thang).padStart(2, '0')}/${ky.nam}` : 'Quyết toán')
export const tien = (v: string | number) => `${dinhDangTien(v)} ₫`

/** Tải theo `khoa` (chỉ khi `san`); `lai` tải lại mà giữ dữ liệu cũ trên màn tới khi có bản mới. Lỗi → `loi` kèm nút Thử lại ở nơi gọi. */
export function useTai<T>(tai: () => Promise<T>, khoa: string, san = true) {
  const [du, setDu] = useState<T | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [lan, setLan] = useState(0)
  useEffect(() => {
    if (!san) return undefined
    let active = true
    setLoi(null)
    tai().then((d) => { if (active) setDu(d) }).catch((e: unknown) => { if (active) setLoi(e instanceof Error ? e.message : 'Không tải được dữ liệu.') })
    return () => { active = false }
  }, [khoa, lan, san])
  return { du, loi, lai: useCallback(() => setLan((n) => n + 1), []) }
}

export const TrangThaiTai = ({ loi, lai, ten }: { loi: string | null; lai: () => void; ten: string }) => (
  loi ? <EmptyState kind="error" title={`Không tải được ${ten}`} body={`${loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={lai} />
    : <div aria-busy="true" role="status" aria-label={`Đang tải ${ten}`} className="hs-khoi"><div className="skel skel-kpi" /><div className="skel skel-line" style={{ width: '60%' }} /><div className="skel skel-line" /><div className="skel skel-line" style={{ width: '80%' }} /></div>
)

export function trangThaiHoaDon(r: Pick<ThongTinHoaDonQuanLy, 'trangThai' | 'daThu' | 'conLai'>) {
  if (Number(r.conLai) <= 0) return <StatusTag tone="done">Đã thu đủ</StatusTag>
  if (Number(r.daThu) > 0) return <StatusTag tone="waiting">Trả một phần</StatusTag>
  return r.trangThai === 'QUA_HAN' ? <StatusTag tone="urgent">Quá hạn</StatusTag> : <StatusTag tone="neutral">Chưa trả</StatusTag>
}

/** Hoá đơn của người/phòng: mỗi tháng một dòng, tháng là liên kết mở hoá đơn. */
export function BangHoaDon({ rows, hienNguoi = false }: { rows: HoaDonHoSo[]; hienNguoi?: boolean }) {
  return (
    <div className="table-wrap table-wrap-cards"><table className="table table-cards">
      <thead><tr><th scope="col">Tháng</th>{hienNguoi ? <th scope="col">Người thuê</th> : null}<th scope="col">Hạn</th><th scope="col" className="num">Phải trả</th><th scope="col" className="num">Còn nợ</th><th scope="col">Trạng thái</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.hoaDonId}>
          <td data-label="Tháng" data-the="tieu-de" className="td-main"><a className="hs-hang-link" href={`/hoa-don?toaNhaId=${r.toaNhaId}${r.kyId ? `&kyId=${r.kyId}` : ''}&hoaDonId=${r.hoaDonId}`}>{nhanThang(r)}</a></td>
          {hienNguoi ? <td data-label="Người thuê">{r.nguoiThue}</td> : null}
          <td data-label="Hạn">{dinhDangNgayIso(r.hanThanhToan)}</td>
          <td data-label="Phải trả" className="num">{tien(r.tongTien)}</td>
          <td data-label="Còn nợ" className={`num t-money${Number(r.conLai) > 0 ? ' t-danger' : ''}`}>{tien(r.conLai)}</td>
          <td data-label="Trạng thái">{trangThaiHoaDon(r)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  )
}

export function KhoiSuCo({ rows, tieuDe = 'Sự cố của phòng' }: { rows: ThongTinYeuCauSuaChua[]; tieuDe?: string }) {
  const mo = rows.filter((s) => !SU_CO_DONG.includes(s.trangThai))
  const hien = [...rows].sort((a, b) => Number(SU_CO_DONG.includes(a.trangThai)) - Number(SU_CO_DONG.includes(b.trangThai)) || b.taoLuc.localeCompare(a.taoLuc)).slice(0, 5)
  return (
    <section className="card" aria-labelledby="hs-su-co">
      <div className="blk-h"><h2 id="hs-su-co">{tieuDe}</h2><span className="t-meta">{mo.length} đang mở · {rows.length - mo.length} đã xong</span><a className="link-more brand push" href="/su-co">Mở Sự cố</a></div>
      <div style={{ margin: '4px -24px -8px' }}>
        {hien.length === 0 ? <p className="t-sm t-2" style={{ padding: '0 24px 12px' }}>Phòng này chưa báo hỏng lần nào.</p> : hien.map((s) => (
          <a key={s.id} className="irow" href={`/su-co?yeuCauId=${s.id}`}>
            <div className="body"><div className="t">{s.hangMuc}</div><div className="s">{s.maYeuCau} · báo {dinhDangNgayIso(s.taoLuc.slice(0, 10))}</div></div>
            <StatusTag tone={SU_CO_DONG.includes(s.trangThai) ? 'closed' : s.trangThai === 'DANG_XU_LY' ? 'strong' : 'waiting'}>{s.tenTrangThai ?? s.trangThai}</StatusTag>
            {s.mucDo !== 'THUONG' ? <StatusTag tone="urgent">{s.tenMucDo}</StatusTag> : null}
          </a>
        ))}
      </div>
    </section>
  )
}

export function KhoiHoatDong({ muc }: { muc: HoatDong[] }) {
  const ds = [...muc].sort((a, b) => b.ngay.localeCompare(a.ngay))
  return (
    <section className="card" aria-labelledby="hs-hoat-dong">
      <div className="blk-h"><h2 id="hs-hoat-dong">Hoạt động</h2><span className="t-meta">từ hoá đơn, thanh toán, sự cố</span></div>
      {ds.length === 0 ? <p className="t-sm t-2">Chưa có hoạt động nào.</p> : <ul className="tl" style={{ listStyle: 'none', padding: 0 }}>
        {ds.map((m, i) => <li key={i}><span className={`dot ${m.cham}`} /><span>{m.noiDung}</span><span className="when">{dinhDangNgayIso(m.ngay.slice(0, 10))}</span></li>)}
      </ul>}
    </section>
  )
}

/** Gom hoạt động từ dữ liệu đã tải: không có nguồn nào thì không bịa dòng. */
export function dungHoatDong({ suCo, thanhToan, no, hopDong }: { suCo: ThongTinYeuCauSuaChua[]; thanhToan: LedgerEntry | null; no: Array<{ kyNhan: string; hanThanhToan: string }>; hopDong?: Pick<HopDongToa, 'id' | 'soPhong' | 'ngayBatDau'> | null }): HoatDong[] {
  const ds: HoatDong[] = []
  const sc = suCo.filter((s) => !SU_CO_DONG.includes(s.trangThai)).sort((a, b) => b.taoLuc.localeCompare(a.taoLuc))[0]
  if (sc) ds.push({ ngay: sc.taoLuc, cham: 'warn', noiDung: <>Báo sự cố <b>{sc.hangMuc}</b></> })
  if (thanhToan?.ngayThu) ds.push({ ngay: thanhToan.ngayThu, cham: 'ok', noiDung: `Thu ${tien(thanhToan.soTien)}${thanhToan.hinhThuc === 'CHUYEN_KHOAN' ? ' chuyển khoản' : ''} · biên lai ${thanhToan.maBienLai}` })
  const treNhat = [...no].sort((a, b) => b.hanThanhToan.localeCompare(a.hanThanhToan))[0]
  if (treNhat) ds.push({ ngay: treNhat.hanThanhToan, cham: 'red', noiDung: `Hoá đơn tháng ${treNhat.kyNhan} quá hạn` })
  if (hopDong) ds.push({ ngay: hopDong.ngayBatDau, cham: '', noiDung: `Bắt đầu hợp đồng #${hopDong.id}, phòng ${hopDong.soPhong}` })
  return ds
}

async function taiHoSo(token: string, id: number, toa: ThongTinToaNha[], homNay: string): Promise<DuLieu> {
  const nguoi = await managementRequest<NguoiDayDu>(token, `/api/nguoi-thue/${id}`)
  const theoToa = await Promise.all(toa.map(async (t) => {
    const [hd, hoaDon, ky] = await Promise.all([fetchHopDongQuanLy(token, t.id), fetchHoaDonQuanLy(token, t.id, ''), fetchKyThanhToan(token, t.id)])
    return { t, hd, hoaDon, ky }
  }))
  const hopDong: HopDongToa[] = theoToa.flatMap(({ t, hd }) => hd.filter((h) => h.nguoiThueId === id).map((h) => ({ ...h, toaNhaId: t.id, tenToa: t.ten })))
    .sort((a, b) => Number(b.trangThai === 'HIEU_LUC') - Number(a.trangThai === 'HIEU_LUC') || b.ngayBatDau.localeCompare(a.ngayBatDau))
  // /api/hoa-don không trả hopDongId: ghép người ↔ hoá đơn theo phòng + họ tên (cùng cách `tuHoaDonQuanLy` làm).
  const hoaDon: HoaDonHoSo[] = []
  const no: NoKy[] = []
  for (const { t, hd, hoaDon: rows, ky } of theoToa) {
    const cuaNguoi = new Set(hd.filter((h) => h.nguoiThueId === id).map((h) => `${h.soPhong}|${h.hoTenNguoiThue}`))
    const nhanKy = (kyId: number | null) => kyNhanCua(ky.find((k) => k.id === kyId))
    rows.filter((r) => r.trangThai !== 'NHAP' && cuaNguoi.has(`${r.soPhong}|${r.nguoiThue}`)).forEach((r) => hoaDon.push({ ...r, toaNhaId: t.id, kyNhan: nhanKy(r.kyId) }))
    no.push(...tuHoaDonQuanLy(rows, t, homNay, hd).filter((d) => d.nguoiThueId === id).map((d) => ({ ...d, kyNhan: nhanKy(d.kyId) })))
  }
  hoaDon.sort((a, b) => b.hanThanhToan.localeCompare(a.hanThanhToan))

  const hd0 = hopDong[0]
  const khongTai: string[] = []
  const phu = async <T,>(ten: string, viec: Promise<T>, macDinh: T) => { try { return await viec } catch { khongTai.push(ten); return macDinh } }
  const [suCo, thanhToan] = await Promise.all([
    hd0 ? phu('sự cố', managementRequest<ThongTinYeuCauSuaChua[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${hd0.toaNhaId}`).then((rows) => rows.filter((s) => s.phongId === hd0.phongId)), [] as ThongTinYeuCauSuaChua[]) : [],
    (async () => {
      const gan = hoaDon.filter((h) => Number(h.daThu) > 0)[0] // hoaDon đã xếp hạn mới nhất trước
      if (!gan) return null
      const l = await phu('thanh toán', getLedger(token, gan.hoaDonId), null)
      return l?.giaoDich.filter((g) => g.loai === 'THU' && g.ngayThu).sort((a, b) => String(b.ngayThu).localeCompare(String(a.ngayThu)))[0] ?? null
    })(),
  ])
  return { nguoi, hopDong, hoaDon, no, suCo, thanhToan, khongTai }
}

const KENH: Record<KenhLienHe, string> = { GOI: 'Gọi', ZALO: 'Zalo', GAP: 'Gặp' }

/** Ghi chú liên hệ (gọi/Zalo/gặp), mới nhất trước; lưu ở backend để người sau biết đã hẹn gì. */
export function KhoiGhiChu({ token, nguoiThueId }: { token: string; nguoiThueId: number }) {
  const [ds, setDs] = useState<GhiChuLienHe[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [noiDung, setNoiDung] = useState('')
  const [kenh, setKenh] = useState<KenhLienHe>('GOI')
  const [dangLuu, setDangLuu] = useState(false)
  useEffect(() => {
    let song = true
    fetchGhiChuLienHe(token, nguoiThueId).then((d) => { if (song) setDs(d) }, () => { if (song) setLoi('Chưa tải được ghi chú liên hệ.') })
    return () => { song = false }
  }, [token, nguoiThueId])
  const luu = async () => {
    if (!noiDung.trim()) return
    setDangLuu(true); setLoi(null)
    try { const moi = await themGhiChuLienHe(token, nguoiThueId, noiDung.trim(), kenh); setDs((c) => [moi, ...(c ?? [])]); setNoiDung('') }
    catch (e) { setLoi(e instanceof Error ? e.message : 'Chưa lưu được ghi chú.') } finally { setDangLuu(false) }
  }
  return (
    <section className="card" aria-labelledby="hs-ghi-chu" data-ghi-chu>
      <div className="blk-h"><h2 id="hs-ghi-chu">Ghi chú liên hệ</h2></div>
      <form className="hs-ghi-chu-form" onSubmit={(e) => { e.preventDefault(); void luu() }}>
        <Field label="Nội dung"><textarea className="input" rows={2} maxLength={1000} value={noiDung} onChange={(e) => setNoiDung(e.target.value)} placeholder="Ví dụ: hẹn trả thứ Sáu" /></Field>
        <Field label="Kênh"><Select value={kenh} onChange={(e) => setKenh(e.target.value as KenhLienHe)}>{(Object.keys(KENH) as KenhLienHe[]).map((k) => <option key={k} value={k}>{KENH[k]}</option>)}</Select></Field>
        <Button type="submit" variant="secondary" blocked={dangLuu || !noiDung.trim()} blockedReason={dangLuu ? 'Đang lưu…' : 'Nhập nội dung ghi chú'}>Lưu ghi chú</Button>
      </form>
      {loi ? <p className="error-text" role="alert">{loi}</p> : null}
      {ds === null ? (loi ? null : <p className="t-sm t-2" aria-busy="true">Đang tải…</p>)
        : ds.length === 0 ? <p className="t-sm t-2">Chưa có ghi chú nào.</p>
          : <ul className="tl" style={{ listStyle: 'none', padding: 0 }}>{ds.map((g) => <li key={g.id} data-ghi-chu-dong><span className="dot" /><span><b>{KENH[g.kenh]}</b> · {g.noiDung}<br /><span className="t-meta">{g.nguoiTao}</span></span><span className="when">{new Date(g.taoLuc).toLocaleDateString('vi-VN')}</span></li>)}</ul>}
    </section>
  )
}

function MenuThem({ nhan, muc }: { nhan: string; muc: Array<{ nhan: string; href?: string; chay?: () => void }> }) {
  const [mo, setMo] = useState(false)
  const goc = useRef<HTMLDivElement>(null)
  const nut = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!mo) return undefined
    goc.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const ngoai = (e: MouseEvent) => { if (!goc.current?.contains(e.target as Node)) setMo(false) }
    document.addEventListener('mousedown', ngoai)
    return () => document.removeEventListener('mousedown', ngoai)
  }, [mo])
  const phim = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); setMo(false); nut.current?.focus(); return }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const ds = [...(goc.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const i = ds.indexOf(document.activeElement as HTMLElement)
    ds[(i + (e.key === 'ArrowDown' ? 1 : -1) + ds.length) % ds.length]?.focus()
  }
  return (
    <div className="hs-menu" ref={goc} onKeyDown={phim}>
      <button ref={nut} type="button" className="icon-btn boxed" aria-haspopup="menu" aria-expanded={mo} aria-label={nhan} onClick={() => setMo((v) => !v)}><Icon name="more-h" /></button>
      {mo ? <div className="hs-menu-list" role="menu">{muc.map((m) => m.href
        ? <a key={m.nhan} role="menuitem" href={m.href}>{m.nhan}</a>
        : <button key={m.nhan} type="button" role="menuitem" onClick={() => { setMo(false); m.chay?.() }}>{m.nhan}</button>)}</div> : null}
    </div>
  )
}

const TAB = [['tong-quan', 'Tổng quan'], ['hoa-don', 'Hoá đơn'], ['hop-dong', 'Hợp đồng'], ['su-co', 'Sự cố'], ['giay-to', 'Giấy tờ & cư trú']] as const

export function ThanhThoiHan({ hd }: { hd: Pick<ThongTinHopDong, 'ngayBatDau' | 'ngayKetThuc' | 'soNgayConLai'> }) {
  const tong = (Date.parse(hd.ngayKetThuc) - Date.parse(hd.ngayBatDau)) / 864e5
  const p = tong > 0 ? Math.max(0, Math.min(100, Math.round((1 - hd.soNgayConLai / tong) * 100))) : 0
  return <div className="progress" style={{ marginTop: 14 }} role="img" aria-label={`Đã qua ${p}% thời hạn`}><span style={{ width: `${p}%` }} /></div>
}

/** Bảng "Hoá đơn chưa trả đủ" của một người: tháng cũ trước, hàng Cộng. Dùng `no` (đã gộp theo người) nên không cần gọi thêm API. */
function BangNoNguoi({ no }: { no: NoKy[] }) {
  if (no.length === 0) return <p className="t-sm t-2 hs-trong">Không còn hoá đơn nào chưa trả đủ.</p>
  const cong = (k: 'tongTien' | 'daThu' | 'conLai') => tien(no.reduce((t, d) => t + d[k], 0))
  return (
    <div className="table-wrap table-wrap-cards"><table className="table table-cards">
      <thead><tr><th scope="col">Tháng</th><th scope="col">Hạn trả</th><th scope="col" className="num">Phải trả</th><th scope="col" className="num">Đã trả</th><th scope="col" className="num">Còn nợ</th><th scope="col" className="num">Trễ</th></tr></thead>
      <tbody>{no.map((d) => (
        <tr key={d.hoaDonId}>
          <td data-label="Tháng" data-the="tieu-de" className="td-main"><a className="hs-hang-link" href={`/hoa-don?toaNhaId=${d.toaNhaId}${d.kyId ? `&kyId=${d.kyId}` : ''}&hoaDonId=${d.hoaDonId}`}>{nhanThang(d)}</a></td>
          <td data-label="Hạn trả">{dinhDangNgayIso(d.hanThanhToan.slice(0, 10))}</td>
          <td data-label="Phải trả" className="num">{tien(d.tongTien)}</td>
          <td data-label="Đã trả" className="num">{tien(d.daThu)}</td>
          <td data-label="Còn nợ" className="num t-danger">{tien(d.conLai)}</td>
          <td data-label="Trễ" className={`num${d.soNgayQuaHan > 0 ? ' t-danger' : ''}`}>{d.soNgayQuaHan > 0 ? `${d.soNgayQuaHan} ngày` : '—'}</td>
        </tr>
      ))}</tbody>
      <tfoot><HangTong o={['Cộng', '', cong('tongTien'), cong('daThu'), cong('conLai'), '']} canhPhai={[2, 3, 4, 5]} /></tfoot>
    </table></div>
  )
}

export default function HoSoNguoiThue360({ token, mobile, thamSo }: TrangProps) {
  const id = Number(thamSo.id)
  const { buildings } = useBuildings(token)
  const [dangSua, setDangSua] = useState(false)
  const [dangNhac, setDangNhac] = useState(false)
  const tabQuery = new URLSearchParams(window.location.search).get('tab')
  const tab = TAB.some(([k]) => k === tabQuery) ? tabQuery! : 'tong-quan'
  const { du, loi, lai } = useTai(() => taiHoSo(token, id, buildings, today()), `${token}|${id}|${buildings.map((b) => b.id).join(',')}`, buildings.length > 0)

  if (!Number.isSafeInteger(id) || id <= 0) return <EmptyState kind="error" title="Không có người thuê này" body="Đường dẫn không đúng. Dữ liệu chưa bị thay đổi." />
  if (!du) return <section className="hs-khoi"><Breadcrumb items={[{ nhan: 'Người thuê', href: '/nguoi-thue' }, 'Đang tải…']} /><TrangThaiTai loi={loi} lai={lai} ten="hồ sơ người thuê" /></section>

  const { nguoi, hopDong, hoaDon, no, suCo } = du
  const hd0 = hopDong[0]
  const dangThue = hd0?.trangThai === 'HIEU_LUC'
  const tongNo = no.reduce((t, d) => t + d.conLai, 0)
  const noCu = [...no].sort((a, b) => a.hanThanhToan.localeCompare(b.hanThanhToan))
  const nhom = nhomNo(no)[0]
  const tabHref = (k: string) => `/nguoi-thue/${id}${k === 'tong-quan' ? '' : `?tab=${k}`}`
  const dem: Record<string, number | undefined> = { 'hoa-don': hoaDon.length, 'hop-dong': hopDong.length, 'su-co': suCo.length }
  // Nút chính duy nhất, chỉ khi còn nợ; < 768 nằm ở chân dính.
  const nutChinh = tongNo > 0 ? <a className="btn btn-primary" href={`/thu-tien?nguoiThueId=${id}`}>Ghi thu {tien(tongNo)}</a> : null
  const sdt = dinhDangSdt(nguoi.soDienThoai)

  const noKhoi = (
    <section className="card" aria-labelledby="hs-tien">
      <div className="blk-h"><h2 id="hs-tien">Hoá đơn chưa trả đủ</h2><a className="link-more brand push" href={`/thu-tien?xem=${id}`}>Mọi hoá đơn →</a></div>
      <BangNoNguoi no={noCu} />
    </section>
  )
  const hoaDonTab = (
    <section className="card" aria-labelledby="hs-tien">
      <div className="blk-h"><h2 id="hs-tien">Hoá đơn</h2></div>
      {hoaDon.length ? <BangHoaDon rows={hoaDon} /> : <p className="t-sm t-2">Người này chưa có hoá đơn nào.</p>}
    </section>
  )
  const hopDongKhoi = (
    <section className="card" aria-labelledby="hs-hop-dong">
      <div className="blk-h"><h2 id="hs-hop-dong">Hợp đồng</h2>{hd0 ? <a className="link-more brand push" href={`/hop-dong/${hd0.id}`}>Mở →</a> : null}</div>
      {hd0 ? (
        <dl className="kv" style={{ marginTop: 8 }}>
          <dt>Thời hạn</dt><dd>{dinhDangNgayIso(hd0.ngayBatDau)} – {dinhDangNgayIso(hd0.ngayKetThuc)}</dd>
          <dt>Báo trước khi trả phòng</dt><dd>{hd0.soNgayBaoTruoc} ngày</dd>
          <dt>Trạng thái</dt><dd><StatusTag tone={dangThue ? 'done' : 'neutral'}>{hd0.tenTrangThai}</StatusTag></dd>
        </dl>
      ) : <p className="t-sm t-2">Người này chưa có hợp đồng. Tạo hợp đồng ở màn Hợp đồng.</p>}
    </section>
  )
  const lienHe = (
    <section className="card" aria-labelledby="hs-lien-he">
      <div className="blk-h"><h2 id="hs-lien-he">Liên hệ & giấy tờ</h2></div>
      <dl className="kv" style={{ marginTop: 8 }}>
        <dt>Điện thoại</dt><dd>{sdt}</dd>
        {nguoi.email ? <><dt>Email</dt><dd>{nguoi.email}</dd></> : null}
        <dt>Ngày sinh</dt><dd>{dinhDangNgayIso(nguoi.ngaySinh)}</dd>
        <dt>Quê quán</dt><dd>{nguoi.queQuan || 'Chưa cập nhật'}</dd>
        <dt>Số CCCD</dt><dd>{[nguoi.loaiGiayTo, nguoi.soGiayToChe].filter(Boolean).join(' ') || 'Chưa cập nhật'}</dd>
      </dl>
    </section>
  )
  const ghiChu = <KhoiGhiChu token={token} nguoiThueId={id} />
  const giayTo = (
    <section className="card" aria-labelledby="hs-giay-to">
      <div className="blk-h"><h2 id="hs-giay-to">Giấy tờ & cư trú</h2></div>
      {nguoi.canhBao.length ? <div className="row-wrap" style={{ margin: '8px 0' }}>{nguoi.canhBao.map((c) => <StatusTag key={c} tone="waiting">{c}</StatusTag>)}</div> : <p className="t-sm t-2" style={{ margin: '8px 0' }}>Giấy tờ đã đủ, không có cảnh báo.</p>}
      <div className="row-wrap">
        <Button variant="secondary" onClick={() => setDangSua(true)}>Sửa hồ sơ và ảnh giấy tờ</Button>
        <a className="btn btn-secondary" href="/cu-tru">Khai báo cư trú</a>
      </div>
    </section>
  )
  const trai = tab === 'hoa-don' ? hoaDonTab : tab === 'hop-dong' ? (hopDong.length ? <>{hopDong.map((h) => <ThuHopDong key={h.id} h={h} />)}</> : hopDongKhoi) : tab === 'su-co' ? <KhoiSuCo rows={suCo} tieuDe="Sự cố đã báo" /> : tab === 'giay-to' ? giayTo : noKhoi
  const phai = <>{lienHe}{hopDongKhoi}<KhoiSuCo rows={suCo} tieuDe="Sự cố đã báo" />{ghiChu}</>

  return (
    <section className={`hs-khoi${mobile && nutChinh ? ' hs-pad-sticky' : ''}`} style={{ minWidth: 0 }}>
      <DauTrang
        vet={[{ nhan: 'Người thuê', href: '/nguoi-thue' }, { nhan: nguoi.hoTen, href: `/nguoi-thue/${id}` }]}
        tieuDe={nguoi.hoTen}
        phu={hd0 ? `Phòng ${hd0.soPhong} · ${hd0.tenToa} · thuê từ ${dinhDangNgayIso(hd0.ngayBatDau)}` : 'Chưa có hợp đồng'}
        hanhDong={<>
          <a className="btn btn-secondary" href={`tel:${nguoi.soDienThoai}`}>{sdt}</a>
          {!mobile && nhom ? <Button variant="secondary" onClick={() => setDangNhac(true)}>Nhắc qua Zalo</Button> : null}
          {mobile ? null : nutChinh}
          <MenuThem nhan="Thao tác khác: sửa hồ sơ, khai báo cư trú, ảnh giấy tờ" muc={[{ nhan: 'Sửa hồ sơ', chay: () => setDangSua(true) }, { nhan: 'Khai báo cư trú', href: '/cu-tru' }, { nhan: 'Ảnh giấy tờ', chay: () => setDangSua(true) }]} />
        </>}
      />
      <KhoiSo so={[
        { nhan: 'Còn nợ', giaTri: tien(tongNo), tone: tongNo > 0 ? 'no' : 'thuong', phu: tongNo > 0 ? `${no.length} tháng chưa trả đủ, cũ nhất hạn ${dinhDangNgayIso(noCu[0].hanThanhToan.slice(0, 10))}` : 'Đã trả đủ mọi hoá đơn' },
        { nhan: 'Tiền phòng', giaTri: hd0 ? tien(hd0.giaThue) : '—', donVi: hd0 ? '/ tháng' : undefined },
        { nhan: 'Cọc đang giữ', giaTri: hd0 ? tien(hd0.tienCoc) : '—' },
        { nhan: 'Hợp đồng', giaTri: dangThue ? `còn ${hd0.soNgayConLai} ngày` : hd0?.tenTrangThai ?? '—', phu: hd0 ? `đến ${dinhDangNgayIso(hd0.ngayKetThuc)}` : undefined },
      ]} />
      {du.khongTai.length ? <p className="banner banner-info" role="status"><Icon name="info" />Chưa tải được: {du.khongTai.join(', ')}. Phần còn lại vẫn đúng. <button type="button" className="nt-phu-nut" onClick={lai}>Tải lại</button></p> : null}
      <nav className="tabs" aria-label="Các phần của hồ sơ">
        {TAB.map(([k, nhan]) => <a key={k} className="tab" href={tabHref(k)} aria-current={tab === k ? 'page' : undefined}>{nhan}{dem[k] !== undefined ? <span className="n">{dem[k]}</span> : null}</a>)}
      </nav>
      <div className="cols">
        <div className="side">{trai}</div>
        <div className="side">{phai}</div>
      </div>
      {mobile && nutChinh ? <ChanDinh>{nutChinh}</ChanDinh> : null}
      {dangNhac && nhom ? <NganNhacNo nhom={nhom} sdt={nguoi.soDienThoai} hanTra={dinhDangNgayIso(today())} onDong={() => setDangNhac(false)} /> : null}
      {dangSua ? <NganFormNguoiThue token={token} id={id} onSaved={lai} onClose={() => setDangSua(false)} /> : null}
    </section>
  )
}

function ThuHopDong({ h }: { h: HopDongToa }) {
  return (
    <Card>
      <div className="blk-h"><h2>Hợp đồng #{h.id} · Phòng {h.soPhong}</h2><StatusTag tone={h.trangThai === 'HIEU_LUC' ? 'done' : 'neutral'}>{h.tenTrangThai}</StatusTag><a className="link-more brand push" href={`/hop-dong/${h.id}`}>Mở hợp đồng</a></div>
      <p className="t-sm t-2" style={{ marginTop: 4 }}>{h.tenToa} · {dinhDangNgayIso(h.ngayBatDau)} – {dinhDangNgayIso(h.ngayKetThuc)} · {tien(h.giaThue)}/tháng</p>
    </Card>
  )
}
