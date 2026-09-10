import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ApiError, fetchHoaDonQuanLy, fetchToaNha, type ThongTinHoaDonQuanLy, type ThongTinToaNha } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = { token: string; mobile?: boolean }

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
  }, [boLoc.toaNhaId, boLoc.trangThai, token])

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

      <p data-invoice-active-filter style={styleActiveFilter}>Đang lọc: {tieuDeBoLoc}</p>
      {dangTai ? <p aria-live="polite">Đang tải danh sách hoá đơn…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : boLoc.toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hoá đơn." />
            : hoaDons.length === 0 ? <EmptyState title="Không có hoá đơn phù hợp bộ lọc." />
              : <div data-invoice-list={variant} style={styleList}>{hoaDons.map((hoaDon) => <HoaDonQuanLyRow key={hoaDon.hoaDonId} toaNhaId={boLoc.toaNhaId!} hoaDon={hoaDon} />)}</div>}
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
