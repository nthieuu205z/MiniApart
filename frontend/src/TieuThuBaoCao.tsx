import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchKyThanhToan,
  fetchPhong,
  fetchTieuThuBaoCao,
  fetchToaNha,
  type BoLocTieuThuBaoCao,
  type ThongTinDiemTieuThuBaoCao,
  type ThongTinDongTieuThuBaoCao,
  type ThongTinKyThanhToan,
  type ThongTinPhong,
  type ThongTinToaNha,
  type ThongTinTieuThuBaoCao,
} from './api'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableFrame, TableHeadCell } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = { token: string; mobile?: boolean }

/** FR-RPT-02/FR-RPT-05 renders one owner-scoped electricity and water snapshot. */
export default function TieuThuBaoCao({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [phong, setPhong] = useState<ThongTinPhong[]>([])
  const [ky, setKy] = useState<ThongTinKyThanhToan[]>([])
  const [boLoc, setBoLoc] = useState<BoLocTieuThuBaoCao>(() => (
    typeof window === 'undefined' ? boLocRong() : layBoLocTuUrl(window.location.href)
  ))
  const [baoCao, setBaoCao] = useState<ThongTinTieuThuBaoCao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [dangTaiBoLoc, setDangTaiBoLoc] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [loiBoLoc, setLoiBoLoc] = useState<string | null>(null)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((items) => {
        if (mounted) setToaNha(items)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoiBoLoc(thongBaoLoi(reason, 'Không thể tải danh sách toà nhà.'))
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (boLoc.toaNhaId === null) {
      setPhong([])
      setKy([])
      setLoiBoLoc(null)
      return
    }

    let mounted = true
    setDangTaiBoLoc(true)
    setLoiBoLoc(null)
    Promise.all([fetchPhong(token, boLoc.toaNhaId), fetchKyThanhToan(token, boLoc.toaNhaId)])
      .then(([rooms, periods]) => {
        if (!mounted) return
        setPhong(rooms)
        setKy(periods)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setPhong([])
          setKy([])
          setLoiBoLoc(thongBaoLoi(reason, 'Không thể tải bộ lọc phòng và kỳ.'))
        }
      })
      .finally(() => {
        if (mounted) setDangTaiBoLoc(false)
      })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  useEffect(() => {
    const query = new URLSearchParams()
    if (boLoc.toaNhaId !== null) query.set('toaNhaId', String(boLoc.toaNhaId))
    if (boLoc.phongId !== null) query.set('phongId', String(boLoc.phongId))
    if (boLoc.kyId !== null) query.set('kyId', String(boLoc.kyId))
    const queryString = query.toString()
    window.history.replaceState({}, '', queryString ? `/bao-cao/tieu-thu?${queryString}` : '/bao-cao/tieu-thu')

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchTieuThuBaoCao(token, boLoc)
      .then((data) => {
        if (mounted) setBaoCao(data)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setBaoCao(null)
          setLoi(thongBaoLoi(reason, 'Không thể tải báo cáo tiêu thụ.'))
        }
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })
    return () => { mounted = false }
  }, [boLoc, token])

  useEffect(() => {
    function docLaiBoLocTuLichSu() {
      setBoLoc(layBoLocTuUrl(window.location.href))
    }

    window.addEventListener('popstate', docLaiBoLocTuLichSu)
    return () => window.removeEventListener('popstate', docLaiBoLocTuLichSu)
  }, [])

  if (dangTai && !baoCao) {
    return <ScreenSurface data-testid="consumption-report-screen" data-layout-variant={variant} aria-busy="true" aria-live="polite">Đang tải báo cáo tiêu thụ…</ScreenSurface>
  }
  if (loi && !baoCao) {
    return (
      <ScreenSurface data-testid="consumption-report-screen" data-layout-variant={variant} role="alert">
        <SysLabel>FR-RPT-02 · FR-RPT-05</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
      </ScreenSurface>
    )
  }

  return (
    <ScreenSurface data-testid="consumption-report-screen" data-layout-variant={variant} aria-labelledby="consumption-report-title">
      <ScreenHeader>
        <SysLabel>FR-RPT-02 · FR-RPT-05</SysLabel>
        <h3 id="consumption-report-title" style={{ margin: '8px 0 0' }}>Tiêu thụ điện và nước</h3>
        <p style={styleMuted}>Bảng và biểu đồ dùng cùng một ảnh chụp dữ liệu, tách riêng theo kWh và m³ để đối soát.</p>
      </ScreenHeader>

      <BoLoc
        boLoc={boLoc}
        toaNha={toaNha}
        phong={phong}
        ky={ky}
        dangTai={dangTaiBoLoc}
        onChange={setBoLoc}
      />
      {loiBoLoc ? <ScreenNotice tone="urgent">{loiBoLoc}</ScreenNotice> : null}
      {dangTai && baoCao ? <ScreenNotice live>Đang cập nhật báo cáo tiêu thụ…</ScreenNotice> : null}
      {loi && baoCao ? <ScreenNotice tone="urgent">{loi}</ScreenNotice> : null}

      {!baoCao || (baoCao.cacDong.length === 0 && baoCao.bieuDo.length === 0) ? (
        <EmptyState title="Không có dữ liệu tiêu thụ phù hợp bộ lọc." body="Phòng chưa có chỉ số vẫn được giữ trong bảng khi có hợp đồng và dịch vụ theo chỉ số." />
      ) : (
        <>
          <BieuDoTieuThuBaoCao points={baoCao.bieuDo} />
          <BangTieuThu rows={baoCao.cacDong} mobile={mobile} />
          <p style={{ ...styleMuted, margin: 0 }}>Tính lúc {baoCao.tinhLuc}. Phòng thiếu chỉ số được hiển thị là chưa có dữ liệu, không quy đổi thành 0.</p>
        </>
      )}
    </ScreenSurface>
  )
}

function BoLoc({
  boLoc,
  toaNha,
  phong,
  ky,
  dangTai,
  onChange,
}: {
  boLoc: BoLocTieuThuBaoCao
  toaNha: ThongTinToaNha[]
  phong: ThongTinPhong[]
  ky: ThongTinKyThanhToan[]
  dangTai: boolean
  onChange: (value: BoLocTieuThuBaoCao) => void
}): React.ReactElement {
  return (
    <section aria-label="Bộ lọc báo cáo tiêu thụ" style={styleFilterGrid}>
      <label style={styleField}>
        <span>Toà nhà</span>
        <select
          aria-label="Lọc tiêu thụ theo toà nhà"
          value={boLoc.toaNhaId === null ? '' : String(boLoc.toaNhaId)}
          onChange={(event) => onChange({ toaNhaId: event.target.value ? Number(event.target.value) : null, phongId: null, kyId: null })}
          style={styleInput}
        >
          <option value="">Tất cả toà được phân quyền</option>
          {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
        </select>
      </label>
      <label style={styleField}>
        <span>Phòng</span>
        <select
          aria-label="Lọc tiêu thụ theo phòng"
          value={boLoc.phongId === null ? '' : String(boLoc.phongId)}
          disabled={boLoc.toaNhaId === null || dangTai}
          onChange={(event) => onChange({ ...boLoc, phongId: event.target.value ? Number(event.target.value) : null })}
          style={styleInput}
        >
          <option value="">Tất cả phòng</option>
          {phong.map((item) => <option key={item.id ?? item.soPhong} value={item.id ?? ''}>Phòng {item.soPhong}</option>)}
        </select>
      </label>
      <label style={styleField}>
        <span>Kỳ thanh toán</span>
        <select
          aria-label="Lọc tiêu thụ theo kỳ"
          value={boLoc.kyId === null ? '' : String(boLoc.kyId)}
          disabled={boLoc.toaNhaId === null || dangTai}
          onChange={(event) => onChange({ ...boLoc, kyId: event.target.value ? Number(event.target.value) : null })}
          style={styleInput}
        >
          <option value="">Tất cả kỳ</option>
          {ky.map((item) => <option key={item.id} value={item.id}>Kỳ {String(item.thang).padStart(2, '0')}/{item.nam}</option>)}
        </select>
      </label>
    </section>
  )
}

function BieuDoTieuThuBaoCao({ points }: { points: ThongTinDiemTieuThuBaoCao[] }): React.ReactElement {
  const maxTheoDonVi = useMemo(() => {
    const max = new Map<string, bigint>()
    points.forEach((point) => {
      if (point.mucTieuThu === null) return
      const value = soDoNho(point.mucTieuThu)
      const current = max.get(point.donVi) ?? 0n
      if (value > current) max.set(point.donVi, value)
    })
    return max
  }, [points])

  return (
    <section data-consumption-report-chart aria-labelledby="consumption-report-chart-title" style={styleChart}>
      <div>
        <SysLabel>BIỂU ĐỒ CÙNG ẢNH CHỤP</SysLabel>
        <h4 id="consumption-report-chart-title" style={{ margin: '6px 0 0' }}>Mức tiêu thụ theo kỳ và đơn vị</h4>
      </div>
      <div role="list" aria-label="Biểu đồ tiêu thụ, tách riêng theo đơn vị" style={{ display: 'grid', gap: 10 }}>
        {points.map((point, index) => (
          <ThanhTieuThu key={`${point.kyId}-${point.donVi}-${index}`} point={point} max={maxTheoDonVi.get(point.donVi) ?? 0n} />
        ))}
      </div>
      <div style={styleLegend} aria-label="Chú giải đơn vị">
        {Array.from(new Set(points.map((point) => point.donVi))).map((unit) => (
          <span key={unit}><i aria-hidden="true" style={{ ...styleLegendDot, background: mauTheoDonVi(unit) }} />{hienThiDonVi(unit)}</span>
        ))}
      </div>
    </section>
  )
}

function ThanhTieuThu({ point, max }: { point: ThongTinDiemTieuThuBaoCao; max: bigint }): React.ReactElement {
  const value = point.mucTieuThu === null ? null : soDoNho(point.mucTieuThu)
  const width = value === null || value <= 0n || max <= 0n ? 0 : Math.max(3, Number((value * 100n) / max))
  const unit = hienThiDonVi(point.donVi)
  return (
    <div
      data-consumption-report-chart-point={point.donVi}
      role="listitem"
      aria-label={`${point.nhanKy} · ${point.laDien ? 'Điện' : 'Nước'}: ${value === null ? 'Chưa có chỉ số' : `${dinhDangSoDo(point.mucTieuThu!)} ${unit}`}`}
      style={{ display: 'grid', gridTemplateColumns: 'minmax(74px, 5.5rem) minmax(0, 1fr) auto', alignItems: 'center', gap: 8, minWidth: 0, minHeight: 'var(--ma-hit-mobile)' }}
    >
      <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <strong style={{ fontSize: 13 }}>{point.nhanKy}</strong>
        <span style={{ color: 'var(--ma-text-secondary)', fontSize: 12 }}>{point.laDien ? 'Điện' : 'Nước'}</span>
      </span>
      <span aria-hidden="true" style={{ display: 'block', width: '100%', minWidth: 0, height: 16, background: 'var(--ma-bg-sunken)', border: '1px solid var(--ma-border-subtle)' }}>
        <span style={{ display: 'block', width: `${width}%`, minWidth: width > 0 ? 4 : 0, height: '100%', background: mauTheoDonVi(point.donVi) }} />
      </span>
      <strong style={{ whiteSpace: 'nowrap', fontFamily: 'var(--ma-font-mono)', fontSize: 12 }}>{value === null ? 'Chưa có chỉ số' : `${dinhDangSoDo(point.mucTieuThu!)} ${unit}`}</strong>
    </div>
  )
}

function BangTieuThu({ rows, mobile }: { rows: ThongTinDongTieuThuBaoCao[]; mobile: boolean }): React.ReactElement {
  return (
    <section data-consumption-report-table aria-labelledby="consumption-report-table-title" style={{ display: 'grid', gap: 10 }}>
      <div>
        <SysLabel>BẢNG ĐỐI SOÁT</SysLabel>
        <h4 id="consumption-report-table-title" style={{ margin: '6px 0 0' }}>Chi tiết phòng, kỳ và chỉ số</h4>
      </div>
      <TableFrame minWidth={mobile ? 760 : 900}>
        <caption className="sr-only">Bảng tiêu thụ điện và nước theo phòng, kỳ và đơn vị</caption>
        <thead>
          <tr>
            <TableHeadCell>Kỳ / phòng</TableHeadCell>
            <TableHeadCell>Dịch vụ</TableHeadCell>
            <TableHeadCell>Chỉ số</TableHeadCell>
            <TableHeadCell align="right">Tiêu thụ</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => <DongTieuThu key={`${row.kyId}-${row.phongId}-${row.dichVuId}`} row={row} />)}
        </tbody>
      </TableFrame>
    </section>
  )
}

function DongTieuThu({ row }: { row: ThongTinDongTieuThuBaoCao }): React.ReactElement {
  const unit = hienThiDonVi(row.donVi)
  const value = row.coDuLieu && row.mucTieuThu !== null ? `${dinhDangSoDo(row.mucTieuThu)} ${unit}` : 'Chưa có chỉ số'
  return (
    <tr data-consumption-report-row={`${row.soPhong}-${row.kyId}-${row.laDien ? 'electricity' : 'water'}`}>
      <TableCell header>
        <span style={{ display: 'block' }}>{row.nhanKy}</span>
        <span style={styleMuted}>Phòng {row.soPhong} · {row.tenToaNha}</span>
      </TableCell>
      <TableCell>
        <strong>{row.tenDichVu}</strong>
        <span style={{ display: 'block', color: 'var(--ma-text-secondary)', fontSize: 12, marginTop: 3 }}>{unit}</span>
      </TableCell>
      <TableCell>
        {row.coDuLieu ? (
          <>
            <span style={{ display: 'block' }}>Đầu {row.chiSoDau} · cuối {row.chiSoCuoi}</span>
            {row.coThayCongTo ? <span style={{ display: 'block', color: 'var(--ma-text-secondary)', fontSize: 12, marginTop: 3 }}>Công tơ cũ {row.chiSoCuoiCongToCu} · mới {row.chiSoDauCongToMoi}</span> : null}
          </>
        ) : <span style={{ color: 'var(--ma-text-secondary)' }}>Chưa có chỉ số đầu và cuối</span>}
      </TableCell>
      <TableCell align="right"><strong>{value}</strong></TableCell>
    </tr>
  )
}

function layBoLocTuUrl(url: string | URL): BoLocTieuThuBaoCao {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    phongId: soNguyenDuong(searchParams.get('phongId')),
    kyId: soNguyenDuong(searchParams.get('kyId')),
  }
}

function boLocRong(): BoLocTieuThuBaoCao {
  return { toaNhaId: null, phongId: null, kyId: null }
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function thongBaoLoi(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback
}

function hienThiDonVi(unit: string): string {
  return unit === 'm3' ? 'm³' : unit
}

function dinhDangSoDo(value: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return value
  const integer = match[2].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${match[1]}${integer},${(match[3] ?? '').padEnd(2, '0')}`
}

function soDoNho(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return 0n
  const hundredths = BigInt(`${match[2]}${(match[3] ?? '').padEnd(2, '0')}`)
  return match[1] === '-' ? -hundredths : hundredths
}

function mauTheoDonVi(unit: string): string {
  return unit === 'm3' || unit === 'm³' ? 'var(--ma-waiting)' : 'var(--ma-ink-screen-title)'
}

const styleMuted: CSSProperties = { margin: '4px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.5 }
const styleFilterGrid: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', padding: 14, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }
const styleField: CSSProperties = { display: 'grid', gap: 6, minWidth: 0 }
const styleInput: CSSProperties = { width: '100%', minWidth: 0, minHeight: 'var(--ma-hit-mobile)', padding: '0 10px', border: '1px solid var(--ma-border-strong)', borderRadius: 0, background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)' }
const styleChart: CSSProperties = { display: 'grid', gap: 14, minWidth: 0, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }
const styleLegend: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--ma-text-secondary)', fontSize: 12 }
const styleLegendDot: CSSProperties = { display: 'inline-block', width: 10, height: 10, marginRight: 5 }
