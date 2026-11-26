import { useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  fetchDashboardChu,
  fetchKyThanhToan,
  fetchPhong,
  fetchTieuThuBaoCao,
  type BoLocTieuThuBaoCao,
  type ThongTinDiemTieuThuBaoCao,
  type ThongTinDashboardChu,
  type ThongTinDongTieuThuBaoCao,
  type ThongTinKyThanhToan,
  type ThongTinPhong,
  type ThongTinTieuThuBaoCao,
} from './api'
import { useToaKhung } from './useToaKhung'
import { EmptyState } from './design/feedback/EmptyState'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { Card } from './design/layout/Card'
import { Field, Select } from './design/forms/Field'
import { DataTable } from './design/table/DataTable'
import { BaoCaoDangTai, BaoCaoLoi, DauBaoCao, ThanhLoc, gioTinh } from './baoCaoChung'
import ExcelExportButton from './ExcelExportButton'

type Props = { token: string; mobile?: boolean }

/** FR-RPT-02/FR-RPT-05 renders one owner-scoped electricity and water snapshot. */
export default function TieuThuBaoCao({ token, mobile = false }: Props): React.ReactElement {
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
  const [doiSoat, setDoiSoat] = useState<DoiSoatCongToTong | null | undefined>(undefined)
  const variant = mobile ? 'mobile' : 'desktop'
  useToaKhung(boLoc.toaNhaId, (toaNhaId) => setBoLoc((b) => ({ ...b, toaNhaId, phongId: null, kyId: null })))

  // Đối soát công tơ tổng lấy từ dashboard chủ (cùng nguồn với dòng "Cần chú ý"); lỗi chỉ làm trống khối này, không chặn báo cáo.
  useEffect(() => {
    let mounted = true
    setDoiSoat(undefined)
    if (boLoc.toaNhaId === null) return
    fetchDashboardChu(token, boLoc.toaNhaId)
      .then((d) => mounted && setDoiSoat(d.dienNuocDungChung.doiSoat))
      .catch(() => mounted && setDoiSoat(null))
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

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

  if (dangTai && !baoCao) return <BaoCaoDangTai testid="consumption-report-screen" variant={variant} nhan="Đang tải báo cáo tiêu thụ…" />
  if (loi && !baoCao) return <BaoCaoLoi testid="consumption-report-screen" variant={variant} loi={loi} />

  const trong = !baoCao || (baoCao.cacDong.length === 0 && baoCao.bieuDo.length === 0)
  return (
    <div data-testid="consumption-report-screen" data-layout-variant={variant} aria-labelledby="consumption-report-title" className="stack">
      <DauBaoCao
        id="consumption-report-title"
        tieuDe="Tiêu thụ điện và nước"
        moTa="Bảng và biểu đồ dùng cùng một ảnh chụp dữ liệu, tách riêng theo kWh và m³ để đối soát."
        action={<ExcelExportButton token={token} report="tieu-thu" filters={boLoc} loading={dangTai} />}
      />

      <BoLoc boLoc={boLoc} phong={phong} ky={ky} dangTai={dangTaiBoLoc} onChange={setBoLoc} />
      {loiBoLoc ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loiBoLoc}</p> : null}
      {dangTai && baoCao ? <p className="t-2" role="status" aria-live="polite">Đang cập nhật báo cáo tiêu thụ…</p> : null}
      {loi && baoCao ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loi}</p> : null}

      <DoiSoatCongToTong toaNhaId={boLoc.toaNhaId} doiSoat={doiSoat} />

      {trong ? (
        <div className="card"><EmptyState title="Không có dữ liệu tiêu thụ phù hợp bộ lọc." body="Phòng chưa có chỉ số vẫn được giữ trong bảng khi có hợp đồng và dịch vụ theo chỉ số." /></div>
      ) : (
        <>
          <BieuDoTieuThuBaoCao points={baoCao.bieuDo} rows={baoCao.cacDong} />
          <BangTieuThu rows={baoCao.cacDong} />
          <p className="t-meta" style={{ margin: 0 }}>Tính lúc {gioTinh(baoCao.tinhLuc)}. Phòng thiếu chỉ số được hiển thị là chưa có dữ liệu, không quy đổi thành 0.</p>
        </>
      )}
    </div>
  )
}

type DoiSoatCongToTong = NonNullable<ThongTinDashboardChu['dienNuocDungChung']['doiSoat']>
const NHAN_DOI_SOAT: Record<string, { nhan: string; tone: 'done' | 'urgent' | 'neutral' }> = {
  KHOP_DOI_SOAT: { nhan: 'Khớp đối soát', tone: 'done' },
  CANH_BAO_THAT_THOAT: { nhan: 'Cảnh báo thất thoát', tone: 'urgent' },
}

/** Đối soát công tơ tổng đầy đủ (dashboard chỉ còn một dòng "Cần chú ý"): công tơ tổng, tổng phòng, dùng chung đo riêng, chênh lệch so với ngưỡng. */
function DoiSoatCongToTong({ toaNhaId, doiSoat }: { toaNhaId: number | null; doiSoat: DoiSoatCongToTong | null | undefined }): React.ReactElement {
  const trangThai = doiSoat ? NHAN_DOI_SOAT[doiSoat.trangThai] ?? { nhan: 'Chưa đủ số liệu', tone: 'neutral' as const } : null
  const so = (v: number | string | null, donVi: string) => (v === null ? 'Chưa có' : `${dinhDangSoDo(String(v))} ${donVi}`)
  return (
    <Card
      data-consumption-reconcile
      aria-labelledby="consumption-reconcile-title"
      title={<span id="consumption-reconcile-title">Đối soát công tơ tổng{doiSoat?.tenToaNha ? ` · ${doiSoat.tenToaNha}` : ''}{doiSoat?.tenKy ? ` · ${doiSoat.tenKy}` : ''}</span>}
      action={trangThai ? <StatusTag tone={trangThai.tone}>{trangThai.nhan}</StatusTag> : undefined}
    >
      {toaNhaId === null ? (
        <p className="t-2" style={{ margin: 0 }}>Chọn một toà nhà ở bộ lọc để xem đối soát công tơ tổng của toà đó.</p>
      ) : doiSoat === undefined ? (
        <p className="t-2" style={{ margin: 0 }} role="status">Đang tải đối soát công tơ tổng…</p>
      ) : doiSoat === null || doiSoat.trangThai === 'CHON_TOA_NHA' ? (
        <p className="t-2" style={{ margin: 0 }}>Chưa có số đối soát công tơ tổng cho toà này.</p>
      ) : (
        <>
          <div className="facts" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
            <div className="fact"><div className="k">Công tơ tổng</div><div className="v">{so(doiSoat.mucTong, doiSoat.donVi)}</div></div>
            <div className="fact"><div className="k">Tổng các phòng</div><div className="v">{so(doiSoat.mucPhong, doiSoat.donVi)}</div></div>
            <div className="fact"><div className="k">Dùng chung đo riêng</div><div className="v">{so(doiSoat.mucChungDoRieng, doiSoat.donVi)}</div></div>
            <div className="fact"><div className="k">Chênh lệch (ngưỡng {so(doiSoat.nguongChoPhep, doiSoat.donVi)})</div><div className={`v${doiSoat.vuotNguong ? ' t-danger' : ''}`}>{so(doiSoat.chenhLech, doiSoat.donVi)}</div></div>
          </div>
          {doiSoat.ghiChu ? <p className="t-2" style={{ margin: '12px 0 0' }}>{doiSoat.ghiChu}</p> : null}
        </>
      )}
    </Card>
  )
}

function BoLoc({
  boLoc,
  phong,
  ky,
  dangTai,
  onChange,
}: {
  boLoc: BoLocTieuThuBaoCao
  phong: ThongTinPhong[]
  ky: ThongTinKyThanhToan[]
  dangTai: boolean
  onChange: (value: BoLocTieuThuBaoCao) => void
}): React.ReactElement {
  return (
    <ThanhLoc nhan="Bộ lọc báo cáo tiêu thụ">
      <Field label="Phòng">
        <Select
          aria-label="Lọc tiêu thụ theo phòng"
          value={boLoc.phongId === null ? '' : String(boLoc.phongId)}
          disabled={boLoc.toaNhaId === null || dangTai}
          onChange={(event) => onChange({ ...boLoc, phongId: event.target.value ? Number(event.target.value) : null })}
        >
          <option value="">Tất cả phòng</option>
          {phong.map((item) => <option key={item.id ?? item.soPhong} value={item.id ?? ''}>Phòng {item.soPhong}</option>)}
        </Select>
      </Field>
      <Field label="Tháng">
        <Select
          aria-label="Lọc tiêu thụ theo kỳ"
          value={boLoc.kyId === null ? '' : String(boLoc.kyId)}
          disabled={boLoc.toaNhaId === null || dangTai}
          onChange={(event) => onChange({ ...boLoc, kyId: event.target.value ? Number(event.target.value) : null })}
        >
          <option value="">Tất cả tháng</option>
          {ky.map((item) => <option key={item.id} value={item.id}>Tháng {String(item.thang).padStart(2, '0')}/{item.nam}</option>)}
        </Select>
      </Field>
    </ThanhLoc>
  )
}

/** Thanh ngang theo kỳ, tách một khối cho mỗi đơn vị (kWh / m³) — không trộn đơn vị trên cùng thang. */
function BieuDoTieuThuBaoCao({ points, rows }: { points: ThongTinDiemTieuThuBaoCao[]; rows: ThongTinDongTieuThuBaoCao[] }): React.ReactElement {
  // Điểm biểu đồ không mang tên toà; kỳ thuộc đúng một toà nên tra qua dòng bảng. Nhiều toà thì ghi tên toà để các kỳ trùng nhãn không lẫn.
  const toaCuaKy = useMemo(() => new Map(rows.map((r) => [r.kyId, r.tenToaNha])), [rows])
  const nhieuToa = new Set(toaCuaKy.values()).size > 1
  const theoDonVi = useMemo(() => {
    const nhom = new Map<string, ThongTinDiemTieuThuBaoCao[]>()
    points.forEach((p) => nhom.set(p.donVi, [...(nhom.get(p.donVi) ?? []), p]))
    return Array.from(nhom.entries())
  }, [points])
  return (
    <section data-consumption-report-chart aria-labelledby="consumption-report-chart-title" className="grid">
      <h2 className="sr-only" id="consumption-report-chart-title">Mức tiêu thụ theo kỳ và đơn vị</h2>
      {theoDonVi.map(([donVi, diem]) => {
        const unit = hienThiDonVi(donVi)
        const lon = diem.reduce((m, p) => (p.mucTieuThu === null ? m : Math.max(m, Number(p.mucTieuThu))), 0)
        const laDien = diem[0].laDien
        return (
          <Card key={donVi} className={theoDonVi.length > 1 ? 'c-6' : 'c-12'} title={`${laDien ? 'Điện' : 'Nước'} theo kỳ (${unit})`}>
            <div className="hbars" role="list" aria-label={`Biểu đồ tiêu thụ ${laDien ? 'điện' : 'nước'}, đơn vị ${unit}`}>
              {diem.map((point, index) => {
                const co = point.mucTieuThu !== null
                const toa = nhieuToa ? toaCuaKy.get(point.kyId) : undefined
                const nhanDiem = toa ? `${point.nhanKy} · ${toa}` : point.nhanKy
                const chu = co ? `${dinhDangSoDo(point.mucTieuThu!)} ${unit}` : 'Chưa có chỉ số'
                return (
                  <div
                    key={`${point.kyId}-${index}`}
                    className="hbar"
                    data-consumption-report-chart-point={point.donVi}
                    role="listitem"
                    aria-label={`${nhanDiem} · ${point.laDien ? 'Điện' : 'Nước'}: ${chu}`}
                  >
                    <span className="hbar-label" title={nhanDiem}>{nhanDiem}</span>
                    <span className="hbar-value">{chu}</span>
                    <div className="hbar-track"><div className={laDien ? 'hbar-fill' : 'hbar-fill warm'} style={{ width: `${co && lon > 0 ? Math.max(1, (Number(point.mucTieuThu) / lon) * 100) : 0}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </section>
  )
}

function BangTieuThu({ rows }: { rows: ThongTinDongTieuThuBaoCao[] }): React.ReactElement {
  const thieu = (r: ThongTinDongTieuThuBaoCao) => !r.coDuLieu || r.mucTieuThu === null
  return (
    <Card data-consumption-report-table aria-labelledby="consumption-report-table-title" title={<span id="consumption-report-table-title">Chi tiết phòng, kỳ và chỉ số</span>}>
      <DataTable
        rows={rows}
        getRowId={(r) => `${r.kyId}-${r.phongId}-${r.dichVuId}`}
        noun="dòng"
        searchLabel="Tìm phòng, dịch vụ"
        timTheo={(r) => `${r.soPhong} ${r.tenToaNha} ${r.tenDichVu} ${r.nhanKy}`}
        rowProps={(r) => ({ 'data-consumption-report-row': `${r.soPhong}-${r.kyId}-${r.laDien ? 'electricity' : 'water'}` })}
        chips={[
          { key: 'dien', label: 'Điện', match: (r) => r.laDien },
          { key: 'nuoc', label: 'Nước', match: (r) => !r.laDien },
          { key: 'thieu', label: 'Thiếu chỉ số', match: thieu },
        ]}
        columns={[
          { key: 'ky', label: 'Tháng / phòng', sortable: true, sortValue: (r) => r.kyId, render: (r) => <><b>{r.nhanKy}</b><div className="t-meta">Phòng {r.soPhong} · {r.tenToaNha}</div></> },
          { key: 'dv', label: 'Dịch vụ', render: (r) => <><b>{r.tenDichVu}</b><div className="t-meta">{hienThiDonVi(r.donVi)}</div></> },
          {
            key: 'chiso',
            label: 'Chỉ số',
            render: (r) => (r.coDuLieu ? (
              <>
                <div>Đầu {r.chiSoDau} · cuối {r.chiSoCuoi}</div>
                {r.coThayCongTo ? <div className="t-meta">Công tơ cũ {r.chiSoCuoiCongToCu} · mới {r.chiSoDauCongToMoi}</div> : null}
              </>
            ) : <span className="t-2">Chưa có chỉ số đầu và cuối</span>),
          },
          {
            key: 'tt',
            label: 'Tiêu thụ',
            align: 'num',
            sortable: true,
            sortValue: (r) => (thieu(r) ? null : Number(r.mucTieuThu)),
            render: (r) => (thieu(r) ? <StatusTag tone="waiting">Chưa có chỉ số</StatusTag> : <b>{dinhDangSoDo(r.mucTieuThu!)} {hienThiDonVi(r.donVi)}</b>),
          },
        ]}
      />
    </Card>
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
