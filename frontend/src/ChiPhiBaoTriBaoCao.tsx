import { useEffect, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchChiPhiBaoTriBaoCao,
  fetchPhong,
  type BoLocChiPhiBaoTriBaoCao,
  type ThongTinChiPhiBaoTriBaoCao,
  type ThongTinDiemChiPhiBaoTriBaoCao,
  type ThongTinDongChiPhiBaoTriBaoCao,
  type ThongTinNhomChiPhiBaoTriBaoCao,
  type ThongTinPhong,
} from './api'
import { dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { Card } from './design/layout/Card'
import { Field, Input, Select } from './design/forms/Field'
import { DataTable } from './design/table/DataTable'
import { BieuDoCot } from './design/charts/BieuDoCot'
import { useToaKhung } from './useToaKhung'
import { BaoCaoDangTai, BaoCaoLoi, DauBaoCao, ThanhLoc, gioTinh } from './baoCaoChung'
import ExcelExportButton from './ExcelExportButton'

type Props = { token: string; mobile?: boolean }

/** FR-RPT-02/FR-RPT-08 renders one owner-scoped maintenance-cost snapshot with source-request drill-down. */
export default function ChiPhiBaoTriBaoCao({ token, mobile = false }: Props): React.ReactElement {
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
  useToaKhung(boLoc.toaNhaId, (toaNhaId) => setBoLoc((b) => ({ ...b, toaNhaId, phongId: null })))

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

  if (dangTai && !baoCao) return <BaoCaoDangTai testid="maintenance-cost-report-screen" variant={variant} nhan="Đang tải báo cáo chi phí bảo trì…" />
  if (loi && !baoCao) return <BaoCaoLoi testid="maintenance-cost-report-screen" variant={variant} loi={loi} />
  if (!baoCao) {
    return <div data-testid="maintenance-cost-report-screen" data-layout-variant={variant}><EmptyState title="Chưa có báo cáo chi phí bảo trì để hiển thị." /></div>
  }

  const tomTat = (key: string, nhan: string, giaTri: string, ghiChu: string, canhBao = false) => (
    <article key={key} data-maintenance-cost-summary={key} className="card">
      <h2 className="h3" style={{ color: 'var(--ma-text-secondary)', fontWeight: 500 }}>{nhan}</h2>
      <p className={`kpi-value${canhBao ? ' t-danger' : ''}`} style={SO_KPI}>{giaTri}</p>
      <p className="kpi-desc" style={{ marginTop: 8 }}>{ghiChu}</p>
    </article>
  )

  return (
    <div data-testid="maintenance-cost-report-screen" data-layout-variant={variant} aria-labelledby="maintenance-cost-report-title" className="stack">
      <DauBaoCao
        id="maintenance-cost-report-title"
        tieuDe="Chi phí bảo trì"
        moTa="Chi phí lấy từ yêu cầu sửa chữa, tách theo bên chịu chi phí và không cộng lại khoản phát sinh hoá đơn."
        action={<ExcelExportButton token={token} report="chi-phi-bao-tri" filters={boLoc} loading={dangTai} />}
      />

      <BoLoc boLoc={boLoc} phong={phong} dangTai={dangTaiBoLoc} onChange={setBoLoc} />
      {loiBoLoc ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loiBoLoc}</p> : null}
      {dangTai ? <p className="t-2" role="status" aria-live="polite">Đang cập nhật báo cáo chi phí bảo trì…</p> : null}
      {loi ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loi}</p> : null}

      <section aria-label="Tổng hợp chi phí bảo trì" className="grid" style={{ gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr))' }}>
        {tomTat('owner', 'Chủ nhà', hienThiTongTien(baoCao.tongChiPhiChuNha), 'Chi phí đã ghi nhận')}
        {tomTat('tenant', 'Người thuê', hienThiTongTien(baoCao.tongChiPhiNguoiThue), 'Nguồn sửa chữa, tính một lần')}
        {tomTat('missing', 'Chưa ghi nhận', String(baoCao.soDongThieuChiPhi), 'Dòng giữ nguyên trạng thái thiếu chi phí', baoCao.soDongThieuChiPhi > 0)}
      </section>

      {baoCao.cacDong.length === 0 && baoCao.bieuDo.length === 0 ? (
        <div className="card"><EmptyState title="Không có chi phí bảo trì phù hợp bộ lọc." body="Các yêu cầu chưa có chi phí vẫn được giữ khi có dữ liệu báo cáo." /></div>
      ) : (
        <>
          <BieuDoChiPhi points={baoCao.bieuDo} />
          <BangChiPhi rows={baoCao.cacDong} />
          {baoCao.cacNhom.length > 0 ? <BangNhom groups={baoCao.cacNhom} /> : null}
        </>
      )}
      <p className="t-meta" style={{ margin: 0 }}>Tính lúc {gioTinh(baoCao.tinhLuc)}. Bảng và biểu đồ dùng cùng một ảnh chụp dữ liệu.</p>
    </div>
  )
}

function BoLoc({
  boLoc,
  phong,
  dangTai,
  onChange,
}: {
  boLoc: BoLocChiPhiBaoTriBaoCao
  phong: ThongTinPhong[]
  dangTai: boolean
  onChange: (value: BoLocChiPhiBaoTriBaoCao) => void
}): React.ReactElement {
  return (
    <ThanhLoc nhan="Bộ lọc báo cáo chi phí bảo trì">
      <Field label="Phòng">
        <Select
          aria-label="Lọc chi phí bảo trì theo phòng"
          value={boLoc.phongId === null ? '' : String(boLoc.phongId)}
          disabled={boLoc.toaNhaId === null || dangTai}
          onChange={(event) => onChange({ ...boLoc, phongId: event.target.value ? Number(event.target.value) : null })}
        >
          <option value="">Tất cả phòng</option>
          {phong.map((item) => item.id === null ? null : <option key={item.id} value={item.id}>Phòng {item.soPhong}</option>)}
        </Select>
      </Field>
      <Field label="Từ ngày">
        <Input aria-label="Từ ngày chi phí bảo trì" type="date" value={boLoc.tuNgay} onChange={(event) => onChange({ ...boLoc, tuNgay: event.target.value })} />
      </Field>
      <Field label="Đến ngày">
        <Input aria-label="Đến ngày chi phí bảo trì" type="date" value={boLoc.denNgay} onChange={(event) => onChange({ ...boLoc, denNgay: event.target.value })} />
      </Field>
    </ThanhLoc>
  )
}

function BieuDoChiPhi({ points }: { points: ThongTinDiemChiPhiBaoTriBaoCao[] }): React.ReactElement {
  const so = (v: string | null) => (v === null ? null : Number(v))
  return (
    <Card
      data-maintenance-cost-chart
      aria-labelledby="maintenance-cost-chart-title"
      title={<span id="maintenance-cost-chart-title">Chi phí theo tháng</span>}
      action={<div className="legend" aria-label="Chú giải bên chịu chi phí"><span><i style={{ background: 'var(--ma-chart-1)' }} />Chủ nhà</span><span><i style={{ background: 'var(--ma-chart-2)' }} />Người thuê</span></div>}
    >
      <BieuDoCot
        tieuDe="Biểu đồ cột chi phí bảo trì theo tháng, tách chủ nhà và người thuê"
        nhan={points.map((p) => p.nhan)}
        chuoi={[
          { ten: 'Chủ nhà', mau: 'var(--ma-chart-1)', giaTri: points.map((p) => so(p.chiPhiChuNha)) },
          { ten: 'Người thuê', mau: 'var(--ma-chart-2)', giaTri: points.map((p) => so(p.chiPhiNguoiThue)) },
        ]}
        thuocTinhNhom={(i) => ({ 'data-maintenance-cost-chart-point': points[i].thang })}
        moTaNhom={(i) => `${points[i].nhan}: ${points[i].soDongThieuChiPhi} dòng thiếu chi phí, ${points[i].soDongThieuBenChiuChiPhi} dòng thiếu bên chịu chi phí`}
      />
      <p className="t-meta" style={{ margin: '8px 0 0' }}>Dấu “—”: chưa ghi nhận chi phí (khác với 0 ₫).</p>
    </Card>
  )
}

function BangChiPhi({ rows }: { rows: ThongTinDongChiPhiBaoTriBaoCao[] }): React.ReactElement {
  const thieuChiPhi = (r: ThongTinDongChiPhiBaoTriBaoCao) => r.chiPhi === null
  const thieuBen = (r: ThongTinDongChiPhiBaoTriBaoCao) => r.chiPhi !== null && !r.coChiPhi
  const coBen = (r: ThongTinDongChiPhiBaoTriBaoCao, ben: ThongTinDongChiPhiBaoTriBaoCao['benChiuChiPhi']) => r.chiPhi !== null && r.coChiPhi && r.benChiuChiPhi === ben
  const tien = (r: ThongTinDongChiPhiBaoTriBaoCao, ben: ThongTinDongChiPhiBaoTriBaoCao['benChiuChiPhi']) => (coBen(r, ben) ? `${dinhDangTien(r.chiPhi!)} ₫` : '—')
  return (
    <Card data-maintenance-cost-table aria-labelledby="maintenance-cost-table-title" title={<span id="maintenance-cost-table-title">Chi tiết yêu cầu theo toà, hạng mục, tháng và phòng</span>}>
      <DataTable
        rows={rows}
        getRowId={(r) => r.yeuCauId}
        noun="yêu cầu"
        searchLabel="Tìm toà, phòng, hạng mục"
        timTheo={(r) => `${r.tenToaNha} ${r.soPhong} ${r.hangMuc} ${r.yeuCauId}`}
        rowProps={(r) => ({ 'data-maintenance-cost-row': String(r.yeuCauId) })}
        chips={[
          { key: 'thieu-chi-phi', label: 'Thiếu chi phí', match: thieuChiPhi },
          { key: 'thieu-ben', label: 'Thiếu bên chịu', match: thieuBen },
          { key: 'chu-nha', label: 'Chủ nhà', match: (r) => coBen(r, 'CHU_NHA') },
          { key: 'nguoi-thue', label: 'Người thuê', match: (r) => coBen(r, 'NGUOI_THUE') },
        ]}
        columns={[
          { key: 'toa', label: 'Toà / phòng', sortable: true, sortValue: (r) => `${r.tenToaNha} ${r.soPhong}`, render: (r) => <><b>{r.tenToaNha}</b><div className="t-meta">Phòng {r.soPhong}</div></> },
          { key: 'hm', label: 'Tháng / hạng mục', sortable: true, sortValue: (r) => r.thang, render: (r) => <><b>{r.hangMuc}</b><div className="t-meta">{r.nhanThang}</div></> },
          {
            key: 'yc',
            label: 'Yêu cầu',
            render: (r) => <><a href={r.lienKet} onClick={dieuHuongLienKet} style={styleLink}>Yêu cầu #{r.yeuCauId}</a><div className="t-meta">{r.tenTrangThai}</div></>,
          },
          { key: 'chu', label: 'Chủ nhà', align: 'num', render: (r) => tien(r, 'CHU_NHA') },
          { key: 'thue', label: 'Người thuê', align: 'num', render: (r) => tien(r, 'NGUOI_THUE') },
          {
            key: 'tt',
            label: 'Trạng thái chi phí',
            render: (r) => (
              <>
                <StatusTag tone={thieuChiPhi(r) || thieuBen(r) ? 'waiting' : 'done'}>{r.tenTrangThaiChiPhi}</StatusTag>
                {thieuBen(r) ? <div className="t-meta">Nguồn: {dinhDangTien(r.chiPhi!)} ₫</div> : null}
              </>
            ),
          },
        ]}
      />
    </Card>
  )
}

function BangNhom({ groups }: { groups: ThongTinNhomChiPhiBaoTriBaoCao[] }): React.ReactElement {
  const tien = (v: string | null) => (v === null ? 'Chưa ghi nhận' : `${dinhDangTien(v)} ₫`)
  return (
    <Card data-maintenance-cost-groups aria-labelledby="maintenance-cost-groups-title" title={<span id="maintenance-cost-groups-title">Tổng hợp theo hạng mục và phòng</span>}>
      <DataTable
        rows={groups}
        getRowId={(g) => `${g.toaNhaId}-${g.phongId}-${g.hangMuc}-${g.thang}`}
        noun="nhóm"
        rowProps={(g) => ({ 'data-maintenance-cost-group-row': g.thang })}
        columns={[
          { key: 'toa', label: 'Toà / phòng', render: (g) => <b>{g.tenToaNha} · {g.soPhong}</b> },
          { key: 'hm', label: 'Tháng / hạng mục', render: (g) => `${g.nhan} · ${g.hangMuc}` },
          { key: 'chu', label: 'Chủ nhà', align: 'num', render: (g) => tien(g.chiPhiChuNha) },
          { key: 'thue', label: 'Người thuê', align: 'num', render: (g) => tien(g.chiPhiNguoiThue) },
          { key: 'dong', label: 'Dòng', align: 'num', render: (g) => <>{g.soDong}<div className="t-meta">{g.soDongThieuChiPhi} thiếu chi phí · {g.soDongThieuBenChiuChiPhi} thiếu bên</div></> },
        ]}
      />
    </Card>
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

function hienThiTongTien(giaTri: string | null): string {
  return giaTri === null ? 'Chưa ghi nhận' : `${dinhDangTien(giaTri)} ₫`
}

function dieuHuongLienKet(event: React.MouseEvent<HTMLAnchorElement>) {
  if (typeof window === 'undefined') return
  const href = event.currentTarget.getAttribute('href')
  if (!href || href.startsWith('http')) return
  event.preventDefault()
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
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

function thongBaoLoi(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback
}

const SO_KPI = { fontSize: 'clamp(26px, 2.6vw, 34px)', margin: '8px 0 0' } as const
// Giữ inline: test khoá vùng chạm của liên kết nguồn.
const styleLink: CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 'var(--ma-hit-mobile)', color: 'var(--ma-text-link)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }
