import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchBaoCaoTongQuan,
  fetchToaNha,
  type BoLocTongQuanBaoCao,
  type ThongTinBaoCaoTheoThang,
  type ThongTinToaNha,
  type ThongTinTongQuanBaoCao,
} from './api'
import { dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableFrame, TableHeadCell } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = { token: string; mobile?: boolean }

/** FR-RPT-01 renders the owner-only financial/operational overview from one server snapshot. */
export default function BaoCaoTongQuan({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocTongQuanBaoCao>(() => docBoLocTuUrl())
  const [baoCao, setBaoCao] = useState<ThongTinTongQuanBaoCao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((items) => {
        if (mounted) setToaNha(items)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    const query = new URLSearchParams()
    query.set('tuNgay', boLoc.tuNgay)
    query.set('denNgay', boLoc.denNgay)
    if (boLoc.toaNhaId !== null) query.set('toaNhaId', String(boLoc.toaNhaId))
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchBaoCaoTongQuan(token, boLoc)
      .then((data) => {
        if (mounted) setBaoCao(data)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setBaoCao(null)
          setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải báo cáo tổng quan.')
        }
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })
    return () => { mounted = false }
  }, [boLoc, token])

  useEffect(() => {
    function docLaiBoLocTuLichSu() {
      setBoLoc(docBoLocTuUrl())
    }

    window.addEventListener('popstate', docLaiBoLocTuLichSu)
    return () => window.removeEventListener('popstate', docLaiBoLocTuLichSu)
  }, [])

  const variant = mobile ? 'mobile' : 'desktop'
  if (dangTai && !baoCao) {
    return <ScreenSurface data-testid="report-overview-screen" data-layout-variant={variant} aria-busy="true" aria-live="polite">Đang tải báo cáo tổng quan…</ScreenSurface>
  }
  if (loi && !baoCao) {
    return (
      <ScreenSurface data-testid="report-overview-screen" data-layout-variant={variant} role="alert">
        <SysLabel>FR-RPT-01 · FR-RPT-02</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
      </ScreenSurface>
    )
  }
  if (!baoCao) {
    return <ScreenSurface data-testid="report-overview-screen" data-layout-variant={variant}><EmptyState title="Chưa có báo cáo để hiển thị." /></ScreenSurface>
  }

  const kpiItems = [
    { key: 'doanh-thu-phat-hanh', label: 'Doanh thu phát hành', value: `${dinhDangTien(baoCao.kpi.doanhThuPhatHanh)} ₫`, note: 'Tổng hoá đơn đã phát hành' },
    { key: 'da-thu', label: 'Đã thu', value: `${dinhDangTien(baoCao.kpi.daThu)} ₫`, note: 'Theo sổ giao dịch tại thời điểm xem' },
    { key: 'cong-no', label: 'Công nợ', value: `${dinhDangTien(baoCao.kpi.congNo)} ₫`, note: 'Không âm sau đối soát' },
    { key: 'ty-le-lap-day', label: 'Tỷ lệ lấp đầy', value: `${dinhDangPhanTram(baoCao.kpi.tyLeLapDay)}%`, note: `${baoCao.kpi.soPhongDangThue}/${baoCao.kpi.tongSoPhong} phòng đang thuê` },
    { key: 'phong-trong', label: 'Phòng trống', value: String(baoCao.kpi.soPhongTrong), note: 'Tính theo trạng thái hiệu lực hiện tại' },
    { key: 'su-co-dang-mo', label: 'Sự cố đang mở', value: String(baoCao.kpi.soSuCoDangMo), note: 'Áp dụng quy tắc hiệu lực 72 giờ' },
  ]

  return (
    <ScreenSurface data-testid="report-overview-screen" data-layout-variant={variant} aria-labelledby="report-overview-title">
      <ScreenHeader>
        <SysLabel>FR-RPT-01 · FR-RPT-02</SysLabel>
        <h3 id="report-overview-title" style={{ margin: '8px 0 0' }}>Tổng quan tài chính và vận hành</h3>
        <p style={styleMuted}>Một ảnh chụp nhất quán cho {baoCao.tenToaNha}, không trộn dữ liệu ngoài phạm vi được cấp quyền.</p>
      </ScreenHeader>

      <section aria-label="Bộ lọc báo cáo" style={styleFilterGrid}>
        <label style={styleField}>
          <span>Toà nhà</span>
          <select
            aria-label="Lọc theo toà nhà"
            value={boLoc.toaNhaId === null ? '' : String(boLoc.toaNhaId)}
            onChange={(event) => setBoLoc((current) => ({ ...current, toaNhaId: event.target.value ? Number(event.target.value) : null }))}
            style={styleInput}
          >
            <option value="">Tất cả toà được phân quyền</option>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
        </label>
        <label style={styleField}>
          <span>Từ ngày</span>
          <input aria-label="Từ ngày" type="date" value={boLoc.tuNgay} onChange={(event) => setBoLoc((current) => ({ ...current, tuNgay: event.target.value }))} style={styleInput} />
        </label>
        <label style={styleField}>
          <span>Đến ngày</span>
          <input aria-label="Đến ngày" type="date" value={boLoc.denNgay} onChange={(event) => setBoLoc((current) => ({ ...current, denNgay: event.target.value }))} style={styleInput} />
        </label>
      </section>

      {dangTai ? <ScreenNotice live>Đang cập nhật báo cáo…</ScreenNotice> : null}
      {loi ? <ScreenNotice tone="urgent">{loi}</ScreenNotice> : null}

      <section aria-label="Sáu chỉ số chính" style={{ display: 'grid', gap: 12, gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {kpiItems.map((item) => (
          <article key={item.key} data-report-kpi={item.key} style={styleKpi}>
            <SysLabel>{item.label}</SysLabel>
            <strong style={styleKpiValue}>{item.value}</strong>
            <span style={styleKpiNote}>{item.note}</span>
          </article>
        ))}
      </section>

      {!baoCao.coDuLieuTaiChinh ? (
        <div data-report-empty>
          <EmptyState title="Chưa có dữ liệu tài chính trong khoảng ngày đã chọn." body="Các chỉ số vận hành vẫn được tính theo trạng thái hiện tại." />
        </div>
      ) : null}

      <section aria-labelledby="report-chart-title" style={{ display: 'grid', gap: 12 }}>
        <div>
          <SysLabel>DIỄN BIẾN THEO THÁNG</SysLabel>
          <h4 id="report-chart-title" style={{ margin: '6px 0 0' }}>Doanh thu, đã thu và công nợ</h4>
        </div>
        <BieuDoTheoThang data={baoCao.theoThang} />
      </section>

      <section aria-labelledby="report-table-title" style={{ display: 'grid', gap: 12 }}>
        <div>
          <SysLabel>BẢNG SỐ LIỆU</SysLabel>
          <h4 id="report-table-title" style={{ margin: '6px 0 0' }}>Chi tiết theo tháng</h4>
        </div>
        <div data-report-monthly-table>
          <TableFrame minWidth={mobile ? 650 : 620}>
            <thead>
              <tr>
                <TableHeadCell>Tháng</TableHeadCell>
                <TableHeadCell align="right">Doanh thu</TableHeadCell>
                <TableHeadCell align="right">Đã thu</TableHeadCell>
                <TableHeadCell align="right">Công nợ</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {baoCao.theoThang.map((item) => <DongTheoThang key={item.thang} item={item} />)}
            </tbody>
          </TableFrame>
        </div>
      </section>

      <p style={{ ...styleMuted, margin: 0 }}>Tính lúc {baoCao.tinhLuc}. Bộ lọc ngày chỉ ảnh hưởng số liệu tài chính; phòng và sự cố là trạng thái hiện tại.</p>
    </ScreenSurface>
  )
}

function DongTheoThang({ item }: { item: ThongTinBaoCaoTheoThang }): React.ReactElement {
  return (
    <tr>
      <TableCell header>{item.nhan}</TableCell>
      <TableCell align="right">{dinhDangTien(item.doanhThuPhatHanh)} ₫</TableCell>
      <TableCell align="right">{dinhDangTien(item.daThu)} ₫</TableCell>
      <TableCell align="right">{dinhDangTien(item.congNo)} ₫</TableCell>
    </tr>
  )
}

function BieuDoTheoThang({ data }: { data: ThongTinBaoCaoTheoThang[] }): React.ReactElement {
  const max = useMemo(() => data.reduce((current, item) => {
    const itemMax = [item.doanhThuPhatHanh, item.daThu, item.congNo]
      .map(soTienCent)
      .reduce((inner, value) => value > inner ? value : inner, 0n)
    return itemMax > current ? itemMax : current
  }, 0n), [data])

  return (
    <div data-report-chart role="img" aria-label="Biểu đồ doanh thu, đã thu và công nợ theo tháng" style={styleChart}>
      <div style={styleChartLegend}>
        <span><i style={{ ...styleLegendDot, background: 'var(--ma-ink-900)' }} />Doanh thu</span>
        <span><i style={{ ...styleLegendDot, background: 'var(--ma-done-text)' }} />Đã thu</span>
        <span><i style={{ ...styleLegendDot, background: 'var(--ma-urgent)' }} />Công nợ</span>
      </div>
      <div style={styleChartRows}>
        {data.map((item) => (
          <div key={item.thang} data-report-chart-month={item.thang} style={styleChartRow}>
            <span style={styleChartLabel}>{item.nhan}</span>
            <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
              <ThanhBieuDo label="Doanh thu" value={item.doanhThuPhatHanh} max={max} color="var(--ma-ink-900)" />
              <ThanhBieuDo label="Đã thu" value={item.daThu} max={max} color="var(--ma-done-text)" />
              <ThanhBieuDo label="Công nợ" value={item.congNo} max={max} color="var(--ma-urgent)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThanhBieuDo({ label, value, max, color }: { label: string; value: string; max: bigint; color: string }): React.ReactElement {
  return (
    <div aria-label={`${label}: ${dinhDangTien(value)} đồng`} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ width: 66, flex: '0 0 auto', fontSize: 11, color: 'var(--ma-text-secondary)' }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, height: 8, background: 'var(--ma-bg-sunken)' }}>
        <div style={{ width: `${tiLeCot(value, max)}%`, height: '100%', background: color, minWidth: value === '0.00' ? 0 : 2 }} />
      </div>
    </div>
  )
}

function docBoLocTuUrl(): BoLocTongQuanBaoCao {
  const denNgay = ngayKinhDoanhHienTai()
  const tuNgay = `${denNgay.slice(0, 8)}01`
  const query = new URLSearchParams(window.location.search)
  const toaNha = query.get('toaNhaId')
  return {
    toaNhaId: toaNha && /^\d+$/.test(toaNha) ? Number(toaNha) : null,
    tuNgay: query.get('tuNgay') || tuNgay,
    denNgay: query.get('denNgay') || denNgay,
  }
}

function ngayKinhDoanhHienTai(): string {
  const phanNgay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const lay = (type: string) => phanNgay.find((part) => part.type === type)?.value ?? ''
  return `${lay('year')}-${lay('month')}-${lay('day')}`
}

function soTienCent(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return 0n
  const phanLe = (match[3] ?? '').padEnd(2, '0')
  const cent = BigInt(match[2]) * 100n + BigInt(phanLe)
  return match[1] === '-' ? -cent : cent
}

function tiLeCot(value: string, max: bigint): number {
  if (max <= 0n) return 0
  const cent = soTienCent(value)
  if (cent <= 0n) return 0
  return Number((cent * 100n) / max)
}

function dinhDangPhanTram(value: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return value
  const phanNguyen = match[2].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${match[1]}${phanNguyen},${(match[3] ?? '').padEnd(2, '0')}`
}

const styleMuted: CSSProperties = { margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.6 }
const styleFilterGrid: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', padding: 14, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }
const styleField: CSSProperties = { display: 'grid', gap: 6, minWidth: 0 }
const styleInput: CSSProperties = { width: '100%', minWidth: 0, minHeight: 'var(--ma-hit-mobile)', padding: '0 10px', border: '1px solid var(--ma-border-strong)', borderRadius: 0, background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)' }
const styleKpi: CSSProperties = { display: 'grid', gap: 8, minWidth: 0, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }
const styleKpiValue: CSSProperties = { fontFamily: 'var(--ma-font-mono)', fontSize: 'clamp(20px, 3vw, 28px)', overflowWrap: 'anywhere' }
const styleKpiNote: CSSProperties = { minHeight: 34, color: 'var(--ma-text-secondary)', fontSize: 12, lineHeight: 1.45 }
const styleChart: CSSProperties = { display: 'grid', gap: 16, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)', minWidth: 0 }
const styleChartLegend: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--ma-text-secondary)', fontSize: 12 }
const styleLegendDot: CSSProperties = { display: 'inline-block', width: 10, height: 10, marginRight: 5 }
const styleChartRows: CSSProperties = { display: 'grid', gap: 12, minWidth: 0 }
const styleChartRow: CSSProperties = { display: 'grid', gap: 8, gridTemplateColumns: '72px minmax(0, 1fr)', alignItems: 'center', minWidth: 0 }
const styleChartLabel: CSSProperties = { fontFamily: 'var(--ma-font-mono)', fontSize: 12, color: 'var(--ma-text-secondary)' }
