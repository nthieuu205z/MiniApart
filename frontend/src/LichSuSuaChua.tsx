import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchLichSuSuaChua,
  fetchPhong,
  fetchToaNha,
  type BoLocLichSuSuaChua,
  type ThongTinLichSuSuaChua,
  type ThongTinPhong,
  type ThongTinToaNha,
} from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { SysLabel } from './design/core/SysLabel'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'

type Props = { token: string; mobile?: boolean }

type BoLocTrang = {
  toaNhaId: string
  phongId: string
  hangMuc: string
  hienThiDaHuy: boolean
  boLocVanHanh: '' | 'TON_DONG_QUA_48_GIO'
}

const BO_LOC_TRONG: BoLocTrang = { toaNhaId: '', phongId: '', hangMuc: '', hienThiDaHuy: false, boLocVanHanh: '' }

/** FR-MNT-08: owner and manager operational repair lookup, separate from Slice 09 reporting. */
export function LichSuSuaChua({ token, mobile = false }: Props): React.ReactElement {
  const [boLoc, setBoLoc] = useState<BoLocTrang>(() => docBoLocTuUrl())
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [phong, setPhong] = useState<ThongTinPhong[]>([])
  const [ketQua, setKetQua] = useState<ThongTinLichSuSuaChua | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const coBoLoc = Boolean(boLoc.toaNhaId || boLoc.phongId || boLoc.hangMuc.trim() || boLoc.hienThiDaHuy || boLoc.boLocVanHanh)
  const boLocApi = useMemo(() => taoBoLocApi(boLoc), [boLoc])

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((data) => { if (mounted) setToaNha(data) })
      .catch(() => { if (mounted) setToaNha([]) })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (!boLoc.toaNhaId) {
      setPhong([])
      return undefined
    }
    let mounted = true
    fetchPhong(token, Number(boLoc.toaNhaId))
      .then((data) => { if (mounted) setPhong(data) })
      .catch(() => { if (mounted) setPhong([]) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  useEffect(() => {
    dongBoBoLocVaoUrl(boLoc)
    if (!coBoLoc) {
      setKetQua(null)
      setLoi(null)
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchLichSuSuaChua(token, boLocApi)
      .then((data) => { if (mounted) setKetQua(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải lịch sử sửa chữa.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc, boLocApi, coBoLoc, token])

  function capNhatBoLoc(thayDoi: Partial<BoLocTrang>) {
    setBoLoc((hienTai) => ({ ...hienTai, ...thayDoi }))
  }

  return (
    <ScreenSurface data-testid="repair-history-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="repair-history-title">
      <ScreenHeader>
        <SysLabel>FR-MNT-08</SysLabel>
        <h3 id="repair-history-title" style={{ margin: '8px 0 0' }}>Lịch sử sửa chữa</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)' }}>Tra cứu theo toà, phòng hoặc hạng mục. Không phải báo cáo theo kỳ.</p>
      </ScreenHeader>

      <section aria-label="Bộ lọc lịch sử sửa chữa" style={styleBoLoc}>
        <label style={styleNhan}>Toà nhà
          <select name="toaNhaId" value={boLoc.toaNhaId} onChange={(event) => capNhatBoLoc({ toaNhaId: event.target.value, phongId: '' })} style={styleInput}>
            <option value="">Tất cả toà được phân quyền</option>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
        </label>
        <label style={styleNhan}>Phòng
          <select name="phongId" value={boLoc.phongId} disabled={!boLoc.toaNhaId} onChange={(event) => capNhatBoLoc({ phongId: event.target.value })} style={styleInput}>
            <option value="">Tất cả phòng</option>
            {phong.map((item) => <option key={item.id} value={item.id ?? ''}>Phòng {item.soPhong}</option>)}
          </select>
        </label>
        <label style={styleNhan}>Hạng mục
          <input name="hangMuc" value={boLoc.hangMuc} onChange={(event) => capNhatBoLoc({ hangMuc: event.target.value })} placeholder="Ví dụ: Điện" style={styleInput} />
        </label>
        <label style={styleCheckbox}><input type="checkbox" checked={boLoc.hienThiDaHuy} onChange={(event) => capNhatBoLoc({ hienThiDaHuy: event.target.checked })} /> Hiện yêu cầu đã huỷ</label>
        <label style={styleCheckbox}>
          <input
            data-repair-filter-over-48-hours
            type="checkbox"
            checked={boLoc.boLocVanHanh === 'TON_DONG_QUA_48_GIO'}
            onChange={(event) => capNhatBoLoc({ boLocVanHanh: event.target.checked ? 'TON_DONG_QUA_48_GIO' : '' })}
          />
          Chỉ hiện tồn đọng quá 48 giờ
        </label>
      </section>

      {boLoc.boLocVanHanh === 'TON_DONG_QUA_48_GIO' ? (
        <p data-active-repair-filter style={styleActiveFilter}>Đang lọc: Tồn đọng quá 48 giờ</p>
      ) : null}

      {!coBoLoc ? <EmptyState data-repair-history-first-empty title="Chọn ít nhất một bộ lọc để tra cứu lịch sử sửa chữa." body="Kết quả sẽ chỉ hiển thị trong phạm vi toà nhà bạn được phân quyền." />
        : dangTai ? <p aria-live="polite">Đang tải lịch sử sửa chữa…</p>
          : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
            : ketQua?.yeuCau.length === 0 ? <EmptyState data-repair-history-filter-empty title="Không có yêu cầu sửa chữa phù hợp bộ lọc." body="Hãy đổi toà, phòng hoặc hạng mục để tra cứu lại." />
              : ketQua ? <KetQuaLichSu ketQua={ketQua} mobile={mobile} /> : null}
    </ScreenSurface>
  )
}

function KetQuaLichSu({ ketQua, mobile }: { ketQua: ThongTinLichSuSuaChua; mobile: boolean }) {
  return <section style={{ display: 'grid', gap: 16 }}>
    <div style={styleTong} aria-label="Tổng chi phí sửa chữa">
      <strong>Chủ nhà chịu: {dinhDangTien(ketQua.tongChiPhiChuNha)} ₫</strong>
      <strong>Người thuê chịu: {dinhDangTien(ketQua.tongChiPhiNguoiThue)} ₫</strong>
    </div>
    <div style={mobile ? { display: 'grid', gap: 10 } : styleBang}>
      {ketQua.yeuCau.map((item) => <article key={item.id} data-repair-history-item={item.id} style={mobile ? styleDongMobile : styleDong}>
        <div style={styleDongChinh}>
          <strong>Phòng {item.soPhong} · {item.hangMuc}</strong>
          <span>{item.moTa}</span>
        </div>
        <span>{item.toaNha} · {dinhDangNgayIso(ngayDiaPhuongTuInstant(item.taoLuc))}</span>
        <span>{item.tenTrangThai}</span>
        <span>{item.chiPhi === null ? 'Chưa ghi chi phí' : `${dinhDangTien(item.chiPhi)} ₫`}{item.benChiuChiPhi ? ` · ${item.benChiuChiPhi === 'CHU_NHA' ? 'Chủ nhà chịu' : 'Người thuê chịu'}` : ''}</span>
      </article>)}
    </div>
  </section>
}

function ngayDiaPhuongTuInstant(value: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const theoTen = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  if (!theoTen.year || !theoTen.month || !theoTen.day) return value.slice(0, 10)
  return `${theoTen.year}-${theoTen.month}-${theoTen.day}`
}

function docBoLocTuUrl(): BoLocTrang {
  if (typeof window === 'undefined') return BO_LOC_TRONG
  const query = new URLSearchParams(window.location.search)
  return {
    toaNhaId: query.get('toaNhaId') ?? '',
    phongId: query.get('phongId') ?? '',
    hangMuc: query.get('hangMuc') ?? '',
    hienThiDaHuy: query.get('hienThiDaHuy') === 'true',
    boLocVanHanh: query.get('boLoc') === 'TON_DONG_QUA_48_GIO' ? 'TON_DONG_QUA_48_GIO' : '',
  }
}

function taoBoLocApi(boLoc: BoLocTrang): BoLocLichSuSuaChua {
  return {
    toaNhaId: soNguyen(boLoc.toaNhaId),
    phongId: soNguyen(boLoc.phongId),
    hangMuc: boLoc.hangMuc,
    hienThiDaHuy: boLoc.hienThiDaHuy,
    boLoc: boLoc.boLocVanHanh || undefined,
  }
}

function soNguyen(value: string): number | undefined {
  return /^\d+$/.test(value) ? Number(value) : undefined
}

function dongBoBoLocVaoUrl(boLoc: BoLocTrang) {
  if (typeof window === 'undefined') return
  const query = new URLSearchParams()
  if (boLoc.toaNhaId) query.set('toaNhaId', boLoc.toaNhaId)
  if (boLoc.phongId) query.set('phongId', boLoc.phongId)
  if (boLoc.hangMuc.trim()) query.set('hangMuc', boLoc.hangMuc.trim())
  if (boLoc.hienThiDaHuy) query.set('hienThiDaHuy', 'true')
  if (boLoc.boLocVanHanh) query.set('boLoc', boLoc.boLocVanHanh)
  window.history.replaceState({}, '', `/su-co${query.toString() ? `?${query}` : ''}`)
}

const styleBoLoc: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))', gap: 12 }
const styleNhan: CSSProperties = { display: 'grid', gap: 6, font: 'var(--ma-text-body)' }
const styleInput: CSSProperties = { minHeight: 'var(--ma-hit-mobile)', padding: '8px 10px', border: '1px solid var(--ma-border-strong)', borderRadius: 'var(--ma-radius)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'inherit' }
const styleCheckbox: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--ma-hit-mobile)', font: 'var(--ma-text-body)' }
const styleActiveFilter: CSSProperties = { margin: 0, padding: '10px 12px', borderLeft: '4px solid var(--ma-ink-900)', background: 'var(--ma-bg-sunken)', fontWeight: 700 }
const styleTong: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }
const styleBang: CSSProperties = { display: 'grid', gap: 1, border: '1px solid var(--ma-border-default)' }
const styleDong: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(12rem, 1fr) repeat(3, minmax(8rem, auto))', gap: 12, padding: 14, background: 'var(--ma-bg-card)', borderBottom: '1px solid var(--ma-border-subtle)', alignItems: 'center', minWidth: 0 }
const styleDongMobile: CSSProperties = { ...styleDong, gridTemplateColumns: 'minmax(0, 1fr)', gap: 8, overflowWrap: 'anywhere' }
const styleDongChinh: CSSProperties = { display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' }
