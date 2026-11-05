import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ApiError, fetchHoaDonQuanLy, fetchKyThanhToan, fetchToaNha, type ThongTinHoaDonQuanLy, type ThongTinToaNha, type ThongTinKyThanhToan } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'
import { Button } from './design/core/Button'
import { bulkInvoice, type BulkResult } from './financeApi'

type Props = { token: string; mobile?: boolean; vaiTro?: string }

export type BoLocHoaDonQuanLy = {
  toaNhaId: number | null
  trangThai: string
}

/** FR-INV-02 keeps the manager invoice worklist query shareable from the operational dashboard. */
export function layBoLocHoaDonQuanLyTuUrl(url: string | URL): BoLocHoaDonQuanLy {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    trangThai: searchParams.get('trangThai') || 'NO_QUA_HAN',
  }
}

export default function HoaDonQuanLy({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocHoaDonQuanLy>(() => (
    typeof window === 'undefined' ? { toaNhaId: null, trangThai: 'NO_QUA_HAN' } : layBoLocHoaDonQuanLyTuUrl(window.location.href)
  ))
  const [hoaDons, setHoaDons] = useState<ThongTinHoaDonQuanLy[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [loiKy, setLoiKy] = useState<string | null>(null)
  const [ky, setKy] = useState<ThongTinKyThanhToan[]>([])
  const [kyId, setKyId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [reload, setReload] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((data) => {
        if (!mounted) return
        setToaNha(data)
        setBoLoc((current) => ({ ...current, toaNhaId: current.toaNhaId ?? data[0]?.id ?? null }))
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (boLoc.toaNhaId === null) { setKy([]); setKyId(null); return }
    let active = true
    setKy([]); setKyId(null); setResult(null); setLoiKy(null)
    fetchKyThanhToan(token, boLoc.toaNhaId).then((data) => {
      if (!active) return
      setKy(data); setKyId(null)
    }).catch((cause: unknown) => { if (active) setLoiKy(cause instanceof Error ? cause.message : 'Không thể tải kỳ thanh toán.') })
    return () => { active = false }
  }, [token, boLoc.toaNhaId])

  useEffect(() => {
    if (typeof window === 'undefined' || boLoc.toaNhaId === null) return
    const query = new URLSearchParams({ toaNhaId: String(boLoc.toaNhaId), trangThai: boLoc.trangThai })
    window.history.replaceState({}, '', `/hoa-don?${query.toString()}`)
  }, [boLoc])

  useEffect(() => {
    if (boLoc.toaNhaId === null) {
      setHoaDons([])
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHoaDonQuanLy(token, boLoc.toaNhaId, boLoc.trangThai)
      .then((data) => { if (mounted) setHoaDons(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách hoá đơn.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, boLoc.trangThai, token, reload])

  async function runBulk(action: 'tao-hang-loat' | 'phat-hanh-hang-loat') {
    if (busy || boLoc.toaNhaId === null || kyId === null) return
    setBusy(true); setLoi(null); setResult(null)
    try { setResult(await bulkInvoice(token, boLoc.toaNhaId, kyId, action)); setBoLoc((value) => ({ ...value, trangThai: action === 'tao-hang-loat' ? 'NHAP' : '' })); setReload((value) => value + 1) }
    catch (cause) { setLoi(cause instanceof Error ? cause.message : 'Không thể xử lý hoá đơn hàng loạt.') }
    finally { setBusy(false) }
  }

  const visible = kyId === null ? hoaDons : hoaDons.filter((value) => value.kyId === kyId)

  const tieuDeBoLoc = useMemo(() => boLoc.trangThai === 'NO_QUA_HAN' ? 'Nợ quá hạn' : `Trạng thái: ${boLoc.trangThai}`, [boLoc.trangThai])

  return (
    <ScreenSurface data-testid="manager-invoice-screen" data-layout-variant={variant} aria-labelledby="manager-invoice-title">
      <ScreenHeader>
        <SysLabel>FR-INV-02</SysLabel>
        <h3 id="manager-invoice-title" style={{ margin: '8px 0 0' }}>Danh sách hoá đơn quản lý</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>Worklist theo toà nhà và trạng thái vận hành.</p>
      </ScreenHeader>

      <label style={styleField}>Toà nhà
        <select
          data-invoice-building-select
          value={boLoc.toaNhaId ?? ''}
          onChange={(event) => setBoLoc((current) => ({ ...current, toaNhaId: soNguyenDuong(event.target.value) }))}
          style={styleInput}
        >
          <option value="">Chọn toà nhà</option>
          {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
        </select>
      </label>

      <label style={styleField}>Trạng thái<select aria-label="Lọc trạng thái hoá đơn" value={boLoc.trangThai} onChange={(event) => setBoLoc((value) => ({ ...value, trangThai: event.target.value }))} style={styleInput}>
        <option value="">Tất cả trạng thái</option><option value="NO_QUA_HAN">Nợ quá hạn</option><option value="NHAP">Bản nháp</option><option value="DA_PHAT_HANH">Đã phát hành</option><option value="DA_THU_MOT_PHAN">Đã thu một phần</option><option value="DA_THANH_TOAN">Đã thanh toán</option><option value="QUA_HAN">Quá hạn</option><option value="DA_HUY">Đã huỷ</option>
      </select></label>
      <label style={styleField}>Kỳ thanh toán<select aria-label="Lọc kỳ hoá đơn" value={kyId ?? ''} onChange={(event) => { setKyId(event.target.value ? Number(event.target.value) : null); setResult(null) }} style={styleInput}><option value="">Tất cả kỳ</option>{ky.map((value) => <option key={value.id} value={value.id}>{value.thang}/{value.nam} · {value.trangThai}</option>)}</select></label>
      {loiKy ? <p role="status">{loiKy}</p> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Button blocked={busy || kyId === null} blockedReason="Chọn một kỳ thanh toán và chờ thao tác trước hoàn tất." onClick={() => void runBulk('tao-hang-loat')}>Tạo hoá đơn nháp hàng loạt</Button><Button variant="secondary" blocked={busy || kyId === null} blockedReason="Chọn một kỳ thanh toán và chờ thao tác trước hoàn tất." onClick={() => void runBulk('phat-hanh-hang-loat')}>Phát hành hoá đơn trong kỳ</Button></div>
      {result ? <div role="status"><p>Tạo mới: {result.soHoaDonTaoMoi ?? 0} · Đã phát hành: {result.soHoaDonDaPhatHanh ?? 0} · Đã có / trạng thái khác: {result.soHoaDonDaTonTai ?? result.soHoaDonDaOTrangThaiKhac ?? 0} · Bỏ qua: {result.soPhongBoQua ?? result.soHoaDonBoQua ?? 0}</p>{result.lyDoBoQua.map((value, index) => <p key={`${value.phongId}-${index}`}>Phòng #{value.phongId}: {value.moTa} ({value.ma})</p>)}</div> : null}

      <p data-invoice-active-filter style={styleActiveFilter}>Đang lọc: {tieuDeBoLoc}</p>
      {dangTai ? <p aria-live="polite">Đang tải danh sách hoá đơn…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : boLoc.toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hoá đơn." />
            : visible.length === 0 ? <EmptyState title="Không có hoá đơn phù hợp bộ lọc." />
              : <div data-invoice-list={variant} style={styleList}>{visible.map((hoaDon) => <HoaDonQuanLyRow key={hoaDon.hoaDonId} toaNhaId={boLoc.toaNhaId!} hoaDon={hoaDon} />)}</div>}
    </ScreenSurface>
  )
}

function HoaDonQuanLyRow({ toaNhaId, hoaDon }: { toaNhaId: number; hoaDon: ThongTinHoaDonQuanLy }): React.ReactElement {
  const href = hoaDon.kyId === null
    ? null
    : `/hoa-don?toaNhaId=${toaNhaId}&kyId=${hoaDon.kyId}&hoaDonId=${hoaDon.hoaDonId}`
  return (
    <article data-invoice-row={hoaDon.hoaDonId} style={styleRow}>
      <div style={styleRowMain}>
        {href ? <a data-invoice-detail-link href={href} style={styleLink}>{hoaDon.maHoaDon}</a> : <strong data-invoice-without-period>{hoaDon.maHoaDon}</strong>}
        <strong>Phòng {hoaDon.soPhong} · {hoaDon.nguoiThue}</strong>
        <span style={styleMuted}>Hạn thanh toán: {dinhDangNgayIso(hoaDon.hanThanhToan)}</span>
        {href ? null : <span style={styleMuted}>Hoá đơn quyết toán không thuộc kỳ thanh toán.</span>}
      </div>
      <StatusTag tone={hoaDon.trangThai === 'QUA_HAN' ? 'urgent' : 'strong'}>{hoaDon.trangThai}</StatusTag>
      <div style={styleMoney}>
        <span>Tổng: {dinhDangTien(hoaDon.tongTien)} ₫</span>
        <strong>Còn lại: {dinhDangTien(hoaDon.conLai)} ₫</strong>
      </div>
    </article>
  )
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

const styleList: CSSProperties = { display: 'grid', gap: 10 }
const styleRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(14rem, 1.4fr) auto minmax(12rem, 1fr)', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)', minWidth: 0 }
const styleRowMain: CSSProperties = { display: 'grid', gap: 5, minWidth: 0, overflowWrap: 'anywhere' }
const styleMoney: CSSProperties = { display: 'grid', gap: 5, justifyItems: 'end', color: 'var(--ma-text-secondary)', textAlign: 'right' }
const styleMuted: CSSProperties = { color: 'var(--ma-text-secondary)' }
const styleField: CSSProperties = { display: 'grid', gap: 6, maxWidth: 420 }
const styleInput: CSSProperties = { minHeight: 'var(--ma-hit-mobile)', padding: '8px 10px', border: '1px solid var(--ma-border-strong)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'inherit' }
const styleLink: CSSProperties = { color: 'var(--ma-text-primary)', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }
const styleActiveFilter: CSSProperties = { margin: 0, padding: '10px 12px', borderLeft: '4px solid var(--ma-ink-900)', background: 'var(--ma-bg-sunken)', fontWeight: 700 }
