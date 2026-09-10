import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchChiPhiBaoTriBaoCao,
  fetchPhong,
  fetchToaNha,
  type BoLocChiPhiBaoTriBaoCao,
  type ThongTinChiPhiBaoTriBaoCao,
  type ThongTinDiemChiPhiBaoTriBaoCao,
  type ThongTinDongChiPhiBaoTriBaoCao,
  type ThongTinNhomChiPhiBaoTriBaoCao,
  type ThongTinPhong,
  type ThongTinToaNha,
} from './api'
import { dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableFrame, TableHeadCell } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = { token: string; mobile?: boolean }

/** FR-RPT-04 renders one owner-scoped maintenance-cost snapshot with source-request drill-down. */
export default function ChiPhiBaoTriBaoCao({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [phong, setPhong] = useState<ThongTinPhong[]>([])
  const [boLoc, setBoLoc] = useState<BoLocChiPhiBaoTriBaoCao>(() => (
    typeof window === 'undefined' ? boLocMacDinh() : layBoLocChiPhiBaoTriTuUrl(window.location.href)
  ))
  const [baoCao, setBaoCao] = useState<ThongTinChiPhiBaoTriBaoCao | null>(null)
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
      setLoiBoLoc(null)
      return
    }

    let mounted = true
    setDangTaiBoLoc(true)
    setLoiBoLoc(null)
    fetchPhong(token, boLoc.toaNhaId)
      .then((items) => {
        if (mounted) setPhong(items)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setPhong([])
          setLoiBoLoc(thongBaoLoi(reason, 'Không thể tải danh sách phòng.'))
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
    query.set('tuNgay', boLoc.tuNgay)
    query.set('denNgay', boLoc.denNgay)
    window.history.replaceState({}, '', `/bao-cao/chi-phi-bao-tri?${query.toString()}`)

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchChiPhiBaoTriBaoCao(token, boLoc)
      .then((data) => {
        if (mounted) setBaoCao(data)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setBaoCao(null)
          setLoi(thongBaoLoi(reason, 'Không thể tải báo cáo chi phí bảo trì.'))
        }
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })
    return () => { mounted = false }
  }, [boLoc, token])

  useEffect(() => {
    function docLaiBoLocTuLichSu() {
      setBoLoc(layBoLocChiPhiBaoTriTuUrl(window.location.href))
    }

    window.addEventListener('popstate', docLaiBoLocTuLichSu)
    return () => window.removeEventListener('popstate', docLaiBoLocTuLichSu)
  }, [])

  if (dangTai && !baoCao) {
    return <ScreenSurface data-testid="maintenance-cost-report-screen" data-layout-variant={variant} aria-busy="true" aria-live="polite">Đang tải báo cáo chi phí bảo trì…</ScreenSurface>
  }
  if (loi && !baoCao) {
    return (
      <ScreenSurface data-testid="maintenance-cost-report-screen" data-layout-variant={variant} role="alert">
        <SysLabel>FR-RPT-04</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
      </ScreenSurface>
    )
  }
  if (!baoCao) {
    return <ScreenSurface data-testid="maintenance-cost-report-screen" data-layout-variant={variant}><EmptyState title="Chưa có báo cáo chi phí bảo trì để hiển thị." /></ScreenSurface>
  }

  return (
    <ScreenSurface data-testid="maintenance-cost-report-screen" data-layout-variant={variant} aria-labelledby="maintenance-cost-report-title">
      <ScreenHeader>
        <SysLabel>FR-RPT-04</SysLabel>
        <h3 id="maintenance-cost-report-title" style={{ margin: '8px 0 0' }}>Chi phí bảo trì</h3>
        <p style={styleMuted}>Chi phí lấy từ yêu cầu sửa chữa, tách theo bên chịu chi phí và không cộng lại khoản phát sinh hoá đơn.</p>
      </ScreenHeader>

      <BoLoc boLoc={boLoc} toaNha={toaNha} phong={phong} dangTai={dangTaiBoLoc} onChange={setBoLoc} />
      {loiBoLoc ? <ScreenNotice tone="urgent">{loiBoLoc}</ScreenNotice> : null}
      {dangTai ? <ScreenNotice live>Đang cập nhật báo cáo chi phí bảo trì…</ScreenNotice> : null}
      {loi ? <ScreenNotice tone="urgent">{loi}</ScreenNotice> : null}

      <section aria-label="Tổng hợp chi phí bảo trì" style={styleSummary}>
        <article data-maintenance-cost-summary="owner" style={styleSummaryCard}>
          <SysLabel>Chủ nhà</SysLabel>
          <strong style={styleSummaryValue}>{dinhDangTien(baoCao.tongChiPhiChuNha)} ₫</strong>
          <span style={styleMuted}>Chi phí đã ghi nhận</span>
        </article>
        <article data-maintenance-cost-summary="tenant" style={styleSummaryCard}>
          <SysLabel>Người thuê</SysLabel>
          <strong style={styleSummaryValue}>{dinhDangTien(baoCao.tongChiPhiNguoiThue)} ₫</strong>
          <span style={styleMuted}>Nguồn sửa chữa, tính một lần</span>
        </article>
        <article data-maintenance-cost-summary="missing" style={styleSummaryCard}>
          <SysLabel>Chưa ghi nhận</SysLabel>
          <strong style={styleSummaryValue}>{baoCao.soDongThieuChiPhi}</strong>
          <span style={styleMuted}>Dòng giữ nguyên trạng thái thiếu chi phí</span>
        </article>
      </section>

      {baoCao.cacDong.length === 0 && baoCao.bieuDo.length === 0 ? (
        <EmptyState title="Không có chi phí bảo trì phù hợp bộ lọc." body="Các yêu cầu chưa có chi phí vẫn được giữ khi có dữ liệu báo cáo." />
      ) : (
        <>
          <BieuDoChiPhi points={baoCao.bieuDo} />
          <BangChiPhi rows={baoCao.cacDong} mobile={mobile} />
          {baoCao.cacNhom.length > 0 ? <BangNhom groups={baoCao.cacNhom} mobile={mobile} /> : null}
        </>
      )}
      <p style={{ ...styleMuted, margin: 0 }}>Tính lúc {baoCao.tinhLuc}. Bảng và biểu đồ dùng cùng một ảnh chụp dữ liệu.</p>
    </ScreenSurface>
  )
}

function BoLoc({
  boLoc,
  toaNha,
  phong,
  dangTai,
  onChange,
}: {
  boLoc: BoLocChiPhiBaoTriBaoCao
  toaNha: ThongTinToaNha[]
  phong: ThongTinPhong[]
  dangTai: boolean
  onChange: (value: BoLocChiPhiBaoTriBaoCao) => void
}): React.ReactElement {
  return (
    <section aria-label="Bộ lọc báo cáo chi phí bảo trì" style={styleFilterGrid}>
      <label style={styleField}>
        <span>Toà nhà</span>
        <select
          aria-label="Lọc chi phí bảo trì theo toà nhà"
          value={boLoc.toaNhaId === null ? '' : String(boLoc.toaNhaId)}
          onChange={(event) => onChange({ ...boLoc, toaNhaId: event.target.value ? Number(event.target.value) : null, phongId: null })}
          style={styleInput}
        >
          <option value="">Tất cả toà được phân quyền</option>
          {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
        </select>
      </label>
      <label style={styleField}>
        <span>Phòng</span>
        <select
          aria-label="Lọc chi phí bảo trì theo phòng"
          value={boLoc.phongId === null ? '' : String(boLoc.phongId)}
          disabled={boLoc.toaNhaId === null || dangTai}
          onChange={(event) => onChange({ ...boLoc, phongId: event.target.value ? Number(event.target.value) : null })}
          style={styleInput}
        >
          <option value="">Tất cả phòng</option>
          {phong.map((item) => item.id === null ? null : <option key={item.id} value={item.id}>Phòng {item.soPhong}</option>)}
        </select>
      </label>
      <label style={styleField}>
        <span>Từ ngày</span>
        <input aria-label="Từ ngày chi phí bảo trì" type="date" value={boLoc.tuNgay} onChange={(event) => onChange({ ...boLoc, tuNgay: event.target.value })} style={styleInput} />
      </label>
      <label style={styleField}>
        <span>Đến ngày</span>
        <input aria-label="Đến ngày chi phí bảo trì" type="date" value={boLoc.denNgay} onChange={(event) => onChange({ ...boLoc, denNgay: event.target.value })} style={styleInput} />
      </label>
    </section>
  )
}

function BieuDoChiPhi({ points }: { points: ThongTinDiemChiPhiBaoTriBaoCao[] }): React.ReactElement {
  const max = useMemo(() => points.reduce((current, point) => {
    const values = [point.chiPhiChuNha, point.chiPhiNguoiThue]
      .filter((value): value is string => value !== null)
      .map(soTienCent)
    return values.reduce((inner, value) => value > inner ? value : inner, current)
  }, 0n), [points])

  return (
    <section data-maintenance-cost-chart aria-labelledby="maintenance-cost-chart-title" style={styleChart}>
      <div>
        <SysLabel>BIỂU ĐỒ CÙNG ẢNH CHỤP</SysLabel>
        <h4 id="maintenance-cost-chart-title" style={{ margin: '6px 0 0' }}>Chi phí theo tháng</h4>
      </div>
      <div role="list" aria-label="Biểu đồ chi phí bảo trì theo tháng" style={styleChartRows}>
        {points.map((point) => <DiemBieuDo key={point.thang} point={point} max={max} />)}
      </div>
      <div style={styleLegend} aria-label="Chú giải bên chịu chi phí">
        <span><i aria-hidden="true" style={{ ...styleLegendDot, background: 'var(--ma-ink-screen-title)' }} />Chủ nhà</span>
        <span><i aria-hidden="true" style={{ ...styleLegendDot, background: 'var(--ma-waiting)' }} />Người thuê</span>
      </div>
    </section>
  )
}

function DiemBieuDo({ point, max }: { point: ThongTinDiemChiPhiBaoTriBaoCao; max: bigint }): React.ReactElement {
  return (
    <div data-maintenance-cost-chart-point={point.thang} role="listitem" aria-label={`${point.nhan}: ${point.soDongThieuChiPhi} dòng chưa ghi nhận`} style={styleChartRow}>
      <span style={styleChartLabel}>{point.nhan}</span>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <ThanhBieuDo label="Chủ nhà" value={point.chiPhiChuNha} max={max} color="var(--ma-ink-screen-title)" />
        <ThanhBieuDo label="Người thuê" value={point.chiPhiNguoiThue} max={max} color="var(--ma-waiting)" />
      </div>
    </div>
  )
}

function ThanhBieuDo({ label, value, max, color }: { label: string; value: string | null; max: bigint; color: string }): React.ReactElement {
  const width = value === null || max <= 0n ? 0 : Number((soTienCent(value) * 100n) / max)
  return (
    <div aria-label={`${label}: ${value === null ? 'Chưa ghi nhận' : `${dinhDangTien(value)} đồng`}`} style={styleBarRow}>
      <span style={styleBarLabel}>{label}</span>
      <div aria-hidden="true" style={styleBarTrack}><div style={{ width: `${width}%`, height: '100%', background: color, minWidth: width > 0 ? 3 : 0 }} /></div>
      <strong style={styleBarValue}>{value === null ? 'Chưa ghi nhận' : `${dinhDangTien(value)} ₫`}</strong>
    </div>
  )
}

function BangChiPhi({ rows, mobile }: { rows: ThongTinDongChiPhiBaoTriBaoCao[]; mobile: boolean }): React.ReactElement {
  return (
    <section data-maintenance-cost-table aria-labelledby="maintenance-cost-table-title" style={{ display: 'grid', gap: 10 }}>
      <div>
        <SysLabel>BẢNG ĐỐI SOÁT</SysLabel>
        <h4 id="maintenance-cost-table-title" style={{ margin: '6px 0 0' }}>Chi tiết yêu cầu theo toà, hạng mục, tháng và phòng</h4>
      </div>
      <TableFrame minWidth={mobile ? 1040 : 1080}>
        <caption className="sr-only">Bảng chi phí bảo trì theo yêu cầu sửa chữa và bên chịu chi phí</caption>
        <thead>
          <tr>
            <TableHeadCell>Toà / phòng</TableHeadCell>
            <TableHeadCell>Tháng / hạng mục</TableHeadCell>
            <TableHeadCell>Yêu cầu</TableHeadCell>
            <TableHeadCell align="right">Chủ nhà</TableHeadCell>
            <TableHeadCell align="right">Người thuê</TableHeadCell>
            <TableHeadCell>Trạng thái chi phí</TableHeadCell>
          </tr>
        </thead>
        <tbody>{rows.map((row) => <DongChiPhi key={row.yeuCauId} row={row} />)}</tbody>
      </TableFrame>
    </section>
  )
}

function DongChiPhi({ row }: { row: ThongTinDongChiPhiBaoTriBaoCao }): React.ReactElement {
  const coChiPhi = row.chiPhi !== null && row.coChiPhi
  const hienThiChuNha = coChiPhi && row.benChiuChiPhi === 'CHU_NHA' ? `${dinhDangTien(row.chiPhi!)} ₫` : '—'
  const hienThiNguoiThue = coChiPhi && row.benChiuChiPhi === 'NGUOI_THUE' ? `${dinhDangTien(row.chiPhi!)} ₫` : '—'
  return (
    <tr data-maintenance-cost-row={row.yeuCauId}>
      <TableCell header><span style={{ display: 'block' }}>{row.tenToaNha}</span><span style={styleMuted}>Phòng {row.soPhong}</span></TableCell>
      <TableCell><strong>{row.hangMuc}</strong><span style={{ display: 'block', color: 'var(--ma-text-secondary)', fontSize: 12, marginTop: 3 }}>{row.nhanThang}</span></TableCell>
      <TableCell><a href={row.lienKet} style={styleLink}>Yêu cầu #{row.yeuCauId}</a><span style={{ display: 'block', color: 'var(--ma-text-secondary)', fontSize: 12, marginTop: 3 }}>{row.tenTrangThai}</span></TableCell>
      <TableCell align="right">{hienThiChuNha}</TableCell>
      <TableCell align="right">{hienThiNguoiThue}</TableCell>
      <TableCell><span style={row.chiPhi === null ? styleMissing : undefined}>{row.tenTrangThaiChiPhi}</span></TableCell>
    </tr>
  )
}

function BangNhom({ groups, mobile }: { groups: ThongTinNhomChiPhiBaoTriBaoCao[]; mobile: boolean }): React.ReactElement {
  return (
    <section data-maintenance-cost-groups aria-labelledby="maintenance-cost-groups-title" style={{ display: 'grid', gap: 10 }}>
      <div>
        <SysLabel>NHÓM ĐỐI SOÁT</SysLabel>
        <h4 id="maintenance-cost-groups-title" style={{ margin: '6px 0 0' }}>Tổng hợp theo hạng mục và phòng</h4>
      </div>
      <TableFrame minWidth={mobile ? 920 : 960}>
        <thead><tr><TableHeadCell>Toà / phòng</TableHeadCell><TableHeadCell>Tháng / hạng mục</TableHeadCell><TableHeadCell align="right">Chủ nhà</TableHeadCell><TableHeadCell align="right">Người thuê</TableHeadCell><TableHeadCell align="right">Dòng</TableHeadCell></tr></thead>
        <tbody>{groups.map((group) => <tr key={`${group.toaNhaId}-${group.phongId}-${group.hangMuc}-${group.thang}`}><TableCell header>{group.tenToaNha} · {group.soPhong}</TableCell><TableCell>{group.nhan} · {group.hangMuc}</TableCell><TableCell align="right">{group.chiPhiChuNha === null ? 'Chưa ghi nhận' : `${dinhDangTien(group.chiPhiChuNha)} ₫`}</TableCell><TableCell align="right">{group.chiPhiNguoiThue === null ? 'Chưa ghi nhận' : `${dinhDangTien(group.chiPhiNguoiThue)} ₫`}</TableCell><TableCell align="right">{group.soDong}</TableCell></tr>)}</tbody>
      </TableFrame>
    </section>
  )
}

export function layBoLocChiPhiBaoTriTuUrl(url: string | URL): BoLocChiPhiBaoTriBaoCao {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  const homNay = ngayKinhDoanhHienTai()
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    phongId: soNguyenDuong(searchParams.get('phongId')),
    tuNgay: ngayHopLe(searchParams.get('tuNgay')) ? searchParams.get('tuNgay')! : `${homNay.slice(0, 8)}01`,
    denNgay: ngayHopLe(searchParams.get('denNgay')) ? searchParams.get('denNgay')! : homNay,
  }
}

function boLocMacDinh(): BoLocChiPhiBaoTriBaoCao {
  const homNay = ngayKinhDoanhHienTai()
  return { toaNhaId: null, phongId: null, tuNgay: `${homNay.slice(0, 8)}01`, denNgay: homNay }
}

function ngayKinhDoanhHienTai(): string {
  const phanNgay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const lay = (type: string) => phanNgay.find((part) => part.type === type)?.value ?? ''
  return `${lay('year')}-${lay('month')}-${lay('day')}`
}

function ngayHopLe(value: string | null): boolean {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function soTienCent(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return 0n
  const cent = BigInt(match[2]) * 100n + BigInt((match[3] ?? '').padEnd(2, '0'))
  return match[1] === '-' ? -cent : cent
}

function thongBaoLoi(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback
}

const styleMuted: CSSProperties = { margin: '4px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.5 }
const styleFilterGrid: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', padding: 14, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }
const styleField: CSSProperties = { display: 'grid', gap: 6, minWidth: 0 }
const styleInput: CSSProperties = { width: '100%', minWidth: 0, minHeight: 'var(--ma-hit-mobile)', padding: '0 10px', border: '1px solid var(--ma-border-strong)', borderRadius: 0, background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)' }
const styleSummary: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }
const styleSummaryCard: CSSProperties = { display: 'grid', gap: 8, minWidth: 0, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }
const styleSummaryValue: CSSProperties = { fontFamily: 'var(--ma-font-mono)', fontSize: 'clamp(20px, 3vw, 28px)', overflowWrap: 'anywhere' }
const styleChart: CSSProperties = { display: 'grid', gap: 14, minWidth: 0, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }
const styleChartRows: CSSProperties = { display: 'grid', gap: 12, minWidth: 0 }
const styleChartRow: CSSProperties = { display: 'grid', gap: 8, gridTemplateColumns: '72px minmax(0, 1fr)', alignItems: 'center', minWidth: 0 }
const styleChartLabel: CSSProperties = { fontFamily: 'var(--ma-font-mono)', fontSize: 12, color: 'var(--ma-text-secondary)' }
const styleBarRow: CSSProperties = { display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr) auto', alignItems: 'center', gap: 8, minWidth: 0 }
const styleBarLabel: CSSProperties = { color: 'var(--ma-text-secondary)', fontSize: 12 }
const styleBarTrack: CSSProperties = { minWidth: 0, height: 10, background: 'var(--ma-bg-sunken)', border: '1px solid var(--ma-border-subtle)' }
const styleBarValue: CSSProperties = { minWidth: 90, textAlign: 'right', fontFamily: 'var(--ma-font-mono)', fontSize: 12, whiteSpace: 'nowrap' }
const styleLegend: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--ma-text-secondary)', fontSize: 12 }
const styleLegendDot: CSSProperties = { display: 'inline-block', width: 10, height: 10, marginRight: 5 }
const styleLink: CSSProperties = { color: 'var(--ma-text-primary)', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }
const styleMissing: CSSProperties = { color: 'var(--ma-urgent-text)' }
