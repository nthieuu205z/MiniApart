import { useEffect, useState } from 'react'
import {
  ApiError,
  fetchBaoCaoTongQuan,
  type BoLocTongQuanBaoCao,
  type ThongTinTongQuanBaoCao,
} from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { Card } from './design/layout/Card'
import { Field, Input, Select } from './design/forms/Field'
import { DataTable } from './design/table/DataTable'
import { BieuDoCot } from './design/charts/BieuDoCot'
import { useToaKhung } from './useToaKhung'
import { BaoCaoDangTai, BaoCaoLoi, DauBaoCao, ThanhLoc, gioTinh } from './baoCaoChung'
import { EmptyState } from './design/feedback/EmptyState'
import ExcelExportButton from './ExcelExportButton'

type Props = { token: string; mobile?: boolean }

/** FR-RPT-01 renders the owner-only financial/operational overview from one server snapshot. */
export default function BaoCaoTongQuan({ token, mobile = false }: Props): React.ReactElement {
  const [boLoc, setBoLoc] = useState<BoLocTongQuanBaoCao>(() => docBoLocTuUrl())
  const [baoCao, setBaoCao] = useState<ThongTinTongQuanBaoCao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  useToaKhung(boLoc.toaNhaId, (toaNhaId) => setBoLoc((b) => ({ ...b, toaNhaId })))

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
  if (dangTai && !baoCao) return <BaoCaoDangTai testid="report-overview-screen" variant={variant} nhan="Đang tải báo cáo tổng quan…" />
  if (loi && !baoCao) return <BaoCaoLoi testid="report-overview-screen" variant={variant} loi={loi} />
  if (!baoCao) {
    return <div data-testid="report-overview-screen" data-layout-variant={variant}><EmptyState title="Chưa có báo cáo để hiển thị." /></div>
  }

  const { kpi } = baoCao
  const tien = (v: string) => `${dinhDangTien(v)} ₫`
  const luoi3 = { gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }
  const hang = (key: string, label: string, value: string, note: string, danger = false) => (
    <article key={key} data-report-kpi={key} className="card">
      <h2 className="h3" style={{ color: 'var(--ma-text-secondary)', fontWeight: 500 }}>{label}</h2>
      <p className={`kpi-value${danger ? ' t-danger' : ''}`} style={SO_KPI}>{value}</p>
      <p className="kpi-desc" style={{ marginTop: 8 }}>{note}</p>
    </article>
  )
  const nhan = baoCao.theoThang.map((t) => t.nhan)
  const lay = (khoa: 'doanhThuPhatHanh' | 'daThu' | 'congNo') => baoCao.theoThang.map((t) => Number(t[khoa]))

  return (
    <div data-testid="report-overview-screen" data-layout-variant={variant} aria-labelledby="report-overview-title" className="stack">
      <DauBaoCao
        id="report-overview-title"
        tieuDe="Báo cáo tổng quan"
        moTa={`${baoCao.tenToaNha} · ${dinhDangNgayIso(baoCao.tuNgay)} – ${dinhDangNgayIso(baoCao.denNgay)}. Số tài chính theo khoảng ngày; phòng và sự cố là trạng thái hiện tại.`}
        action={<ExcelExportButton token={token} report="tong-quan" filters={boLoc} loading={dangTai} />}
      />

      <ThanhLoc nhan="Bộ lọc báo cáo">
        <Field label="Từ ngày">
          <Input aria-label="Từ ngày" type="date" value={boLoc.tuNgay} onChange={(event) => setBoLoc((current) => ({ ...current, tuNgay: event.target.value }))} />
        </Field>
        <Field label="Đến ngày">
          <Input aria-label="Đến ngày" type="date" value={boLoc.denNgay} onChange={(event) => setBoLoc((current) => ({ ...current, denNgay: event.target.value }))} />
        </Field>
      </ThanhLoc>

      {dangTai ? <p className="t-2" role="status" aria-live="polite">Đang cập nhật báo cáo…</p> : null}
      {loi ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loi}</p> : null}

      <section aria-label="Sáu chỉ số chính" className="grid" style={{ ...luoi3, gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr))' }}>
        {hang('doanh-thu-phat-hanh', 'Doanh thu phát hành', tien(kpi.doanhThuPhatHanh), 'Tổng hoá đơn đã phát hành')}
        {hang('da-thu', 'Đã thu', tien(kpi.daThu), 'Theo sổ giao dịch tại thời điểm xem')}
        {hang('cong-no', 'Công nợ', tien(kpi.congNo), 'Không âm sau đối soát', Number(kpi.congNo) > 0)}
        <article data-report-kpi="ty-le-lap-day" className="card">
          <h2 className="h3" style={{ color: 'var(--ma-text-secondary)', fontWeight: 500 }}>Tỷ lệ lấp đầy</h2>
          <p className="kpi-value" style={SO_KPI}>{dinhDangPhanTram(kpi.tyLeLapDay)}%</p>
          <div className="progress" role="img" aria-label={`Lấp đầy ${dinhDangPhanTram(kpi.tyLeLapDay)}%`} style={{ marginTop: 12 }}><span style={{ width: `${Math.min(100, Math.max(0, Number(kpi.tyLeLapDay)))}%` }} /></div>
          <p className="kpi-desc" style={{ marginTop: 8 }}>{kpi.soPhongDangThue}/{kpi.tongSoPhong} phòng đang thuê</p>
        </article>
        {hang('phong-trong', 'Phòng trống', String(kpi.soPhongTrong), 'Tính theo trạng thái hiệu lực hiện tại')}
        {hang('su-co-dang-mo', 'Sự cố đang mở', String(kpi.soSuCoDangMo), 'Áp dụng quy tắc hiệu lực 72 giờ')}
      </section>

      {!baoCao.coDuLieuTaiChinh ? (
        <div data-report-empty className="card">
          <EmptyState title="Chưa có dữ liệu tài chính trong khoảng ngày đã chọn." body="Các chỉ số vận hành vẫn được tính theo trạng thái hiện tại." />
        </div>
      ) : null}

      <Card
        aria-labelledby="report-chart-title"
        title={<span id="report-chart-title">Doanh thu, đã thu và công nợ theo tháng</span>}
        action={<div className="legend"><span><i style={{ background: 'var(--ma-chart-3)' }} />Doanh thu</span><span><i style={{ background: 'var(--ma-chart-1)' }} />Đã thu</span><span><i style={{ background: 'var(--ma-chart-2)' }} />Công nợ</span></div>}
      >
        <div data-report-chart>
          <BieuDoCot
            tieuDe="Biểu đồ cột doanh thu, đã thu và công nợ theo tháng"
            nhan={nhan}
            chuoi={[
              { ten: 'Doanh thu', mau: 'var(--ma-chart-3)', giaTri: lay('doanhThuPhatHanh') },
              { ten: 'Đã thu', mau: 'var(--ma-chart-1)', giaTri: lay('daThu') },
              { ten: 'Công nợ', mau: 'var(--ma-chart-2)', giaTri: lay('congNo') },
            ]}
            thuocTinhNhom={(i) => ({ 'data-report-chart-month': baoCao.theoThang[i].thang })}
          />
        </div>
      </Card>

      <Card aria-labelledby="report-table-title" title={<span id="report-table-title">Chi tiết theo tháng</span>}>
        <div data-report-monthly-table>
          <DataTable
            rows={baoCao.theoThang}
            getRowId={(t) => t.thang}
            noun="tháng"
            pageSize={24}
            rowProps={(t) => ({ 'data-report-month': t.thang })}
            columns={[
              { key: 'thang', label: 'Tháng', render: (t) => <b>{t.nhan}</b> },
              { key: 'dt', label: 'Doanh thu', align: 'num', render: (t) => tien(t.doanhThuPhatHanh) },
              { key: 'thu', label: 'Đã thu', align: 'num', render: (t) => tien(t.daThu) },
              { key: 'no', label: 'Công nợ', align: 'num', render: (t) => <span className={Number(t.congNo) > 0 ? 't-danger' : undefined}>{tien(t.congNo)}</span> },
            ]}
          />
        </div>
      </Card>

      <p className="t-meta" style={{ margin: 0 }}>Tính lúc {gioTinh(baoCao.tinhLuc)}. Bộ lọc ngày chỉ ảnh hưởng số liệu tài chính; phòng và sự cố là trạng thái hiện tại.</p>
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

function dinhDangPhanTram(value: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return value
  const phanNguyen = match[2].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${match[1]}${phanNguyen},${(match[3] ?? '').padEnd(2, '0')}`
}

const SO_KPI = { fontSize: 'clamp(26px, 2.6vw, 34px)', margin: '8px 0 0' } as const
