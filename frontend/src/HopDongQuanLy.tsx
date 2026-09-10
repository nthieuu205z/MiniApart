import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ApiError, fetchHopDongQuanLy, fetchToaNha, type ThongTinHopDong, type ThongTinToaNha } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = { token: string; mobile?: boolean }

export type BoLocHopDongQuanLy = {
  toaNhaId: number | null
  sapHetHan: boolean
}

/** FR-BLD-06 keeps the manager contract worklist state in the URL for dashboard click-through. */
export function layBoLocHopDongQuanLyTuUrl(url: string | URL): BoLocHopDongQuanLy {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    sapHetHan: searchParams.get('sapHetHan') === 'true',
  }
}

export default function HopDongQuanLy({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocHopDongQuanLy>(() => (
    typeof window === 'undefined' ? { toaNhaId: null, sapHetHan: false } : layBoLocHopDongQuanLyTuUrl(window.location.href)
  ))
  const [hopDongs, setHopDongs] = useState<ThongTinHopDong[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

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
    const query = new URLSearchParams()
    query.set('toaNhaId', String(boLoc.toaNhaId))
    if (boLoc.sapHetHan) query.set('sapHetHan', 'true')
    window.history.replaceState({}, '', `/hop-dong?${query.toString()}`)
  }, [boLoc])

  useEffect(() => {
    if (boLoc.toaNhaId === null) {
      setHopDongs([])
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHopDongQuanLy(token, boLoc.toaNhaId)
      .then((data) => { if (mounted) setHopDongs(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách hợp đồng.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  const hopDongsHienThi = useMemo(
    () => boLoc.sapHetHan ? hopDongs.filter((hopDong) => hopDong.sapHetHan) : hopDongs,
    [boLoc.sapHetHan, hopDongs],
  )
  const variant = mobile ? 'mobile' : 'desktop'

  return (
    <ScreenSurface data-testid="manager-contract-screen" data-layout-variant={variant} aria-labelledby="manager-contract-title">
      <ScreenHeader>
        <SysLabel>FR-BLD-06</SysLabel>
        <h3 id="manager-contract-title" style={{ margin: '8px 0 0' }}>Hợp đồng theo toà nhà</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>Danh sách hợp đồng trong phạm vi được máy chủ phân quyền.</p>
      </ScreenHeader>

      <label style={styleField}>Toà nhà
        <select
          data-contract-building-select
          value={boLoc.toaNhaId ?? ''}
          onChange={(event) => setBoLoc((current) => ({ ...current, toaNhaId: soNguyenDuong(event.target.value) }))}
          style={styleInput}
        >
          <option value="">Chọn toà nhà</option>
          {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
        </select>
      </label>

      <label style={styleCheckbox}>
        <input
          data-contract-expiring-filter
          type="checkbox"
          checked={boLoc.sapHetHan}
          onChange={(event) => setBoLoc((current) => ({ ...current, sapHetHan: event.target.checked }))}
        />
        Chỉ hiện hợp đồng sắp hết hạn (30 ngày)
      </label>

      {boLoc.sapHetHan ? <p data-contract-filter style={styleActiveFilter}>Đang lọc hợp đồng sắp hết hạn</p> : null}
      {dangTai ? <p aria-live="polite">Đang tải danh sách hợp đồng…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : boLoc.toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hợp đồng." />
            : hopDongsHienThi.length === 0 ? <EmptyState title={boLoc.sapHetHan ? 'Không có hợp đồng sắp hết hạn.' : 'Chưa có hợp đồng nào trong toà nhà này.'} />
              : <div data-contract-list={variant} style={styleList}>{hopDongsHienThi.map((hopDong) => <HopDongQuanLyRow key={hopDong.id} hopDong={hopDong} />)}</div>}
    </ScreenSurface>
  )
}

function HopDongQuanLyRow({ hopDong }: { hopDong: ThongTinHopDong }): React.ReactElement {
  return (
    <article data-contract-row={hopDong.id} style={styleRow}>
      <div style={styleRowMain}>
        <strong>Phòng {hopDong.soPhong}</strong>
        <span>{hopDong.hoTenNguoiThue}</span>
        <span style={styleMuted}>{dinhDangNgayIso(hopDong.ngayBatDau)} → {dinhDangNgayIso(hopDong.ngayKetThuc)}</span>
      </div>
      <StatusTag tone={hopDong.sapHetHan ? 'urgent' : hopDong.trangThai === 'HIEU_LUC' ? 'done' : 'neutral'}>{hopDong.tenTrangThai}</StatusTag>
      <div style={styleMoney}>
        <span>Giá thuê: {dinhDangTien(hopDong.giaThue)} ₫</span>
        <span>{hopDong.sapHetHan ? `Còn ${hopDong.soNgayConLai} ngày` : 'Chưa vào ngưỡng cảnh báo'}</span>
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
const styleCheckbox: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--ma-hit-mobile)' }
const styleActiveFilter: CSSProperties = { margin: 0, padding: '10px 12px', borderLeft: '4px solid var(--ma-ink-900)', background: 'var(--ma-bg-sunken)', fontWeight: 700 }
