import { useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  fetchCongNoBaoCao,
  fetchToaNha,
  type ThongTinKhoanNoBaoCao,
  type ThongTinToaNha,
  type ThongTinCongNoBaoCao,
} from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { Icon } from './design/core/Icon'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableChip, type DataTableColumn } from './design/table/DataTable'
import ExcelExportButton from './ExcelExportButton'

type Props = { token: string; mobile?: boolean }

export type BoLocCongNo = { toaNhaId: number | null }

/** FR-RPT-02 keeps the owner debt filter shareable without allowing a client-side scope override. */
export function layBoLocCongNoTuUrl(url: string | URL): BoLocCongNo {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  const raw = searchParams.get('toaNhaId')
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return { toaNhaId: null }
  const toaNhaId = Number(raw)
  return Number.isSafeInteger(toaNhaId) ? { toaNhaId } : { toaNhaId: null }
}

/** FR-RPT-02/FR-RPT-03 renders the server-sorted debt report and exact invoice drill-down links. */
export default function CongNoBaoCao({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocCongNo>(() => (
    typeof window === 'undefined' ? { toaNhaId: null } : layBoLocCongNoTuUrl(window.location.href)
  ))
  const [baoCao, setBaoCao] = useState<ThongTinCongNoBaoCao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const variant = mobile ? 'mobile' : 'desktop'

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
    if (boLoc.toaNhaId !== null) query.set('toaNhaId', String(boLoc.toaNhaId))
    const queryString = query.toString()
    window.history.replaceState({}, '', queryString ? `/cong-no?${queryString}` : '/cong-no')

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchCongNoBaoCao(token, boLoc.toaNhaId)
      .then((data) => {
        if (mounted) setBaoCao(data)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setBaoCao(null)
          setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải báo cáo công nợ.')
        }
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  useEffect(() => {
    function docLaiBoLocTuLichSu() {
      setBoLoc(layBoLocCongNoTuUrl(window.location.href))
    }

    window.addEventListener('popstate', docLaiBoLocTuLichSu)
    return () => window.removeEventListener('popstate', docLaiBoLocTuLichSu)
  }, [])


  const goc = (noiDung: React.ReactNode) => <section data-testid="debt-report-screen" data-layout-variant={variant} style={{ display: 'grid', gap: 16, minWidth: 0 }}>{noiDung}</section>
  if (dangTai && !baoCao) {
    return goc(<div aria-busy="true" aria-live="polite"><span className="sr-only">Đang tải báo cáo công nợ…</span><EmptyState kind="loading" title="Đang tải báo cáo công nợ…" /></div>)
  }
  if (loi && !baoCao) {
    return goc(<div role="alert"><EmptyState kind="error" title={loi} /></div>)
  }
  if (!baoCao) {
    return goc(<EmptyState title="Chưa có báo cáo công nợ để hiển thị." />)
  }

  const tong = baoCao.congNo.reduce((t, n) => t + Number(n.conLai), 0)
  const quaHan = baoCao.congNo.filter((n) => n.soNgayQuaHan > 0).length
  return goc(<>
    <header className="topbar">
      <div className="title-block">
        <h1 className="h1" id="debt-report-title">Công nợ</h1>
        <p className="sub">{baoCao.congNo.length} khoản còn nợ · {quaHan} quá hạn · tổng {dinhDangTien(String(tong))} ₫. Nợ đọc từ sổ thanh toán lúc xem, xếp theo số ngày quá hạn từ cao xuống thấp.</p>
      </div>
      <div className="topbar-actions">
        <label className="sr-only" htmlFor="cong-no-toa">Toà nhà</label>
        <select
          id="cong-no-toa"
          className="select"
          style={{ width: 240 }}
          aria-label="Lọc công nợ theo toà nhà"
          value={boLoc.toaNhaId === null ? '' : String(boLoc.toaNhaId)}
          onChange={(event) => setBoLoc({ toaNhaId: event.target.value ? Number(event.target.value) : null })}
        >
          <option value="">Tất cả toà được phân quyền</option>
          {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
        </select>
        <ExcelExportButton token={token} report="cong-no" filters={boLoc} loading={dangTai} />
      </div>
    </header>

    {dangTai ? <p className="t-sm" aria-live="polite">Đang cập nhật báo cáo công nợ…</p> : null}
    {loi ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{loi}</p> : null}
    {baoCao.congNo.length === 0 ? <EmptyState title="Không có hoá đơn còn nợ trong phạm vi này." /> : (
      <Card data-debt-list aria-label="Danh sách công nợ, sắp xếp từ nợ quá hạn lâu nhất">
        <DataTable
          rows={baoCao.congNo}
          columns={COT}
          getRowId={(n) => n.hoaDonId}
          chips={CHIP}
          timTheo={(n) => `${n.tenToaNha} ${n.soPhong} ${n.hoTenNguoiThue} ${n.maHoaDon}`}
          searchLabel="Tìm phòng, người thuê, mã hoá đơn"
          noun="khoản nợ"
          pageSize={250}
          rowProps={(n) => ({ 'data-debt-row': String(n.hoaDonId) })}
        />
      </Card>
    )}
    <p className="t-meta" style={{ margin: 0 }}>Tính lúc {baoCao.tinhLuc}. Bấm mã hoá đơn để đối chiếu chi tiết.</p>
  </>)
}

const CHIP: DataTableChip<ThongTinKhoanNoBaoCao>[] = [
  { key: 'QUA_HAN', label: 'Quá hạn', match: (n) => n.soNgayQuaHan > 0 },
  { key: 'QUA_30', label: 'Quá hạn trên 30 ngày', match: (n) => n.soNgayQuaHan > 30 },
  { key: 'CHUA_QUA_HAN', label: 'Chưa quá hạn', match: (n) => n.soNgayQuaHan <= 0 },
]

const COT: DataTableColumn<ThongTinKhoanNoBaoCao>[] = [
  { key: 'phong', label: 'Toà / phòng', sortable: true, sortValue: (n) => `${n.tenToaNha} ${n.soPhong}`, render: (n) => <span className="td-main">{n.tenToaNha} · {n.soPhong}</span> },
  { key: 'nguoiThue', label: 'Người thuê', the: 'tieu-de', sortable: true, sortValue: (n) => n.hoTenNguoiThue, render: (n) => <span title={n.hoTenNguoiThue}>{n.hoTenNguoiThue}</span> },
  { key: 'hoaDon', label: 'Hoá đơn', render: (n) => <a href={`/hoa-don?hoaDonId=${n.hoaDonId}`} style={{ color: 'var(--ma-brand-accent)', textDecoration: 'none', fontWeight: 600 }}>{n.maHoaDon}</a> },
  { key: 'han', label: 'Hạn thanh toán', sortable: true, sortValue: (n) => n.hanThanhToan, render: (n) => dinhDangNgayIso(n.hanThanhToan) },
  { key: 'quaHan', label: 'Quá hạn', align: 'num', sortable: true, sortValue: (n) => n.soNgayQuaHan, render: (n) => <span className={n.soNgayQuaHan > 0 ? 't-danger t-strong' : undefined}>{n.soNgayQuaHan} ngày</span> },
  { key: 'conLai', label: 'Còn nợ', align: 'num', sortable: true, sortValue: (n) => Number(n.conLai), render: (n) => <span className="t-money">{dinhDangTien(n.conLai)} ₫</span> },
]
