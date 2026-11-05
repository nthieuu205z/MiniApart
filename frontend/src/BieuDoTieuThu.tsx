import { useEffect, useState, type CSSProperties } from 'react'
import { ApiError, fetchTieuThuCuaNguoiThue, type ThongTinBieuDoTieuThu, type ThongTinTieuThu } from './api'
import { Button } from './design/core/Button'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableHeadCell } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = {
  token: string
  mobile?: boolean
}

type LoaiTieuThu = 'electricity' | 'water'

type CauHinhBieuDo = {
  tieuDe: string
  donViMacDinh: string
  mau: string
  mauNen: string
}

const CAU_HINH: Record<LoaiTieuThu, CauHinhBieuDo> = {
  electricity: {
    tieuDe: 'Điện',
    donViMacDinh: 'kWh',
    mau: 'var(--ma-ink-screen-title)',
    mauNen: 'var(--ma-paper-2)',
  },
  water: {
    tieuDe: 'Nước',
    donViMacDinh: 'm3',
    mau: 'var(--ma-waiting)',
    mauNen: 'var(--ma-bg-nav)',
  },
}

export default function BieuDoTieuThu({ token, mobile = false }: Props) {
  const [duLieu, setDuLieu] = useState<ThongTinBieuDoTieuThu>({ dien: [], nuoc: [] })
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    fetchTieuThuCuaNguoiThue(token)
      .then((data) => {
        if (mounted) setDuLieu(data)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải dữ liệu tiêu thụ.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [soLanTaiLai, token])

  if (dangTai) {
    return (
      <ScreenSurface data-testid="consumption-screen" data-layout-variant={variant} aria-busy="true" aria-live="polite">
        Đang tải dữ liệu tiêu thụ…
      </ScreenSurface>
    )
  }

  if (loi) {
    return (
      <ScreenSurface data-testid="consumption-screen" data-layout-variant={variant} role="alert">
        <SysLabel>FR-POR-05</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
        <Button data-retry-consumption variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>
          Thử lại
        </Button>
      </ScreenSurface>
    )
  }

  if (duLieu.dien.length === 0 && duLieu.nuoc.length === 0) {
    return (
      <ScreenSurface data-testid="consumption-screen" data-layout-variant={variant} aria-labelledby="consumption-title">
        <ScreenHeader>
          <SysLabel>FR-POR-05</SysLabel>
          <h3 id="consumption-title" style={{ margin: '8px 0 0' }}>Tiêu thụ điện và nước</h3>
        </ScreenHeader>
        <EmptyState
          data-consumption-empty
          title="Chưa có dữ liệu tiêu thụ"
          body="Dữ liệu sẽ xuất hiện sau khi có hoá đơn đã phát hành kèm chỉ số điện hoặc nước của bạn. Đây không phải lỗi kết nối."
        />
      </ScreenSurface>
    )
  }

  return (
    <ScreenSurface data-testid="consumption-screen" data-layout-variant={variant} aria-labelledby="consumption-title">
      <ScreenHeader>
        <SysLabel>FR-POR-05</SysLabel>
        <h3 id="consumption-title" style={{ margin: '8px 0 0' }}>Tiêu thụ điện và nước</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>
          {Math.max(duLieu.dien.length, duLieu.nuoc.length)} kỳ gần nhất có dữ liệu của bạn. Điện và nước được hiển thị riêng theo đúng đơn vị.
        </p>
      </ScreenHeader>

      <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
        <BieuDoSeries loai="electricity" points={duLieu.dien} />
        <BieuDoSeries loai="water" points={duLieu.nuoc} />
      </div>
    </ScreenSurface>
  )
}

function BieuDoSeries({ loai, points }: { loai: LoaiTieuThu; points: ThongTinTieuThu[] }) {
  const config = CAU_HINH[loai]
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const donVi = points[0]?.donVi || config.donViMacDinh

  if (points.length === 0) {
    return (
      <section data-consumption-chart={loai} style={styleKhoiBieuDo} aria-labelledby={`${loai}-chart-title`}>
        <header style={styleTieuDeBieuDo}>
          <div style={{ display: 'grid', gap: 4 }}>
            <SysLabel>{config.tieuDe}</SysLabel>
            <h4 id={`${loai}-chart-title`} style={{ margin: 0 }}>{config.tieuDe} chưa có dữ liệu</h4>
          </div>
          <span style={styleDonVi}>{donVi}</span>
        </header>
        <p style={{ margin: 0, color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>
          Chưa có kỳ nào có số {config.tieuDe.toLowerCase()} để hiển thị.
        </p>
      </section>
    )
  }

  const maxValue = Math.max(...points.map((point) => giaTriSo(point.mucTieuThu)), 1)
  const selectedPoint = selectedIndex === null ? null : points[selectedIndex]

  return (
    <section data-consumption-chart={loai} style={styleKhoiBieuDo} aria-labelledby={`${loai}-chart-title`}>
      <header style={styleTieuDeBieuDo}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, flex: 'none', background: config.mau, border: `1px solid ${config.mau}` }} />
          <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
            <SysLabel>{config.tieuDe}</SysLabel>
            <h4 id={`${loai}-chart-title`} style={{ margin: 0 }}>Mức tiêu thụ theo kỳ</h4>
          </div>
        </div>
        <span style={styleDonVi}>{donVi}</span>
      </header>

      <div role="group" style={{ display: 'grid', gap: 8 }} aria-label={`Biểu đồ ${config.tieuDe.toLowerCase()} theo kỳ, đơn vị ${donVi}`}>
        {points.map((point, index) => {
          const value = giaTriSo(point.mucTieuThu)
          const pointKey = `${point.kyId}-${index}`
          const isSelected = selectedIndex === index
          const width = value === 0 ? 0 : Math.max(3, Math.round((value / maxValue) * 100))

          return (
            <button
              key={pointKey}
              type="button"
              className="ma-consumption-bar"
              data-consumption-bar={`${loai}-${point.kyId}`}
              data-consumption-selected={isSelected ? 'true' : 'false'}
              aria-label={moTaDiem(point, donVi)}
              aria-pressed={isSelected}
              onClick={() => setSelectedIndex(index)}
              onFocus={() => setSelectedIndex(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(68px, 5.5rem) minmax(0, 1fr) auto',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                minWidth: 0,
                minHeight: 'var(--ma-hit-mobile)',
                padding: '6px 8px',
                border: `1px solid ${isSelected ? config.mau : 'var(--ma-border-default)'}`,
                background: isSelected ? config.mauNen : 'var(--ma-bg-card)',
                color: 'var(--ma-text-primary)',
                font: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{nhanKy(point)}</strong>
                <span style={{ color: 'var(--ma-text-secondary)', fontSize: 12, overflowWrap: 'anywhere' }}>Phòng {point.soPhong}</span>
              </span>
              <span aria-hidden="true" style={{ display: 'block', width: '100%', height: 16, minWidth: 0, background: 'var(--ma-bg-sunken)', border: '1px solid var(--ma-border-subtle)' }}>
                <span style={{ display: 'block', width: `${width}%`, minWidth: value > 0 ? 4 : 0, height: '100%', background: config.mau }} />
              </span>
              <span style={{ whiteSpace: 'nowrap', fontFamily: 'var(--ma-font-mono)', fontSize: 12, fontWeight: 700 }}>
                {hienThiGiaTri(point, donVi)}
              </span>
            </button>
          )
        })}
      </div>

      <div role="status" aria-live="polite" style={{ minHeight: 44, display: 'grid', alignContent: 'center', gap: 3, padding: '8px 10px', borderLeft: `3px solid ${config.mau}`, background: 'var(--ma-bg-sunken)' }}>
        <SysLabel>{selectedPoint ? 'Kỳ đang chọn' : 'Chi tiết tương tác'}</SysLabel>
        <span>{selectedPoint ? moTaDiem(selectedPoint, donVi) : 'Chạm, di chuột hoặc dùng Tab trên một kỳ để xem số chính xác.'}</span>
      </div>

      <div data-consumption-table>
        <div style={{ overflowX: 'auto', border: '1px solid var(--ma-border-default)', contain: 'paint' }}>
          <table aria-label={`Bảng ${config.tieuDe.toLowerCase()} theo kỳ`} style={{ width: '100%', minWidth: 0, borderCollapse: 'collapse', tableLayout: 'fixed', textAlign: 'left' }}>
            <caption className="sr-only">Bảng số liệu {config.tieuDe.toLowerCase()} theo kỳ</caption>
            <thead>
              <tr>
                <TableHeadCell>Kỳ</TableHeadCell>
                <TableHeadCell>Phòng / chỉ số</TableHeadCell>
                <TableHeadCell align="right">Tiêu thụ ({donVi})</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={`${point.kyId}-${index}`}>
                  <TableCell header>{nhanKy(point)}</TableCell>
                  <TableCell>
                    <span style={{ display: 'block' }}>Phòng {point.soPhong}</span>
                    <span style={{ display: 'block', color: 'var(--ma-text-secondary)', fontSize: 12, marginTop: 3 }}>
                      Đầu {point.chiSoDau ?? '—'} · cuối {point.chiSoCuoi ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell align="right"><strong>{hienThiGiaTri(point, donVi)}</strong></TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const styleKhoiBieuDo: CSSProperties = {
  display: 'grid',
  gap: 12,
  minWidth: 0,
  padding: '16px',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
}

const styleTieuDeBieuDo: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  minWidth: 0,
  flexWrap: 'wrap',
}

const styleDonVi: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 9px',
  border: '1px solid var(--ma-border-strong)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 12,
  fontWeight: 700,
}

function giaTriSo(value: string | null) {
  const parsed = Number.parseFloat(value ?? '0')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function hienThiGiaTri(point: ThongTinTieuThu, donVi: string) {
  return `${point.mucTieuThu ?? '—'} ${donVi}`
}

function nhanKy(point: ThongTinTieuThu) {
  return `Kỳ ${String(point.thang).padStart(2, '0')}/${point.nam}`
}

function moTaDiem(point: ThongTinTieuThu, donVi: string) {
  return `${nhanKy(point)} · Phòng ${point.soPhong}: ${hienThiGiaTri(point, donVi)}`
}
