import { useEffect, useMemo, useState } from 'react'
import { ApiError, fetchHopDongQuanLy, type ThongTinHopDong } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { DauTrang } from './design/layout/DauTrang'
import { Icon } from './design/core/Icon'
import { Card } from './design/layout/Card'
import { FilterChip } from './design/forms/FilterChip'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenNotice } from './design/layout/Screen'
import { downloadManagementFile } from './managementApi'
import { useMotToa } from './toaDangChon'

type Props = { token: string; mobile?: boolean }

export type TabHopDong = 'can-xu-ly' | 'hieu-luc' | 'da-thanh-ly'
export type BoLocHopDongQuanLy = {
  toaNhaId: number | null
  sapHetHan: boolean
  hopDongId: number | null
  loc: TabHopDong
}

const TAB: { khoa: TabHopDong; nhan: string; match: (h: ThongTinHopDong) => boolean }[] = [
  { khoa: 'can-xu-ly', nhan: 'Cần xử lý', match: (h) => h.trangThai === 'CHO_KY' || h.trangThai === 'DA_COC' || (h.trangThai === 'HIEU_LUC' && h.sapHetHan) },
  { khoa: 'hieu-luc', nhan: 'Đang hiệu lực', match: (h) => h.trangThai === 'HIEU_LUC' },
  { khoa: 'da-thanh-ly', nhan: 'Đã thanh lý', match: (h) => h.trangThai === 'DA_THANH_LY' },
]

/** FR-BLD-06 keeps the manager contract worklist state in the URL for dashboard click-through. */
export function layBoLocHopDongQuanLyTuUrl(url: string | URL): BoLocHopDongQuanLy {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    sapHetHan: searchParams.get('sapHetHan') === 'true',
    hopDongId: soNguyenDuong(searchParams.get('hopDongId')),
    // ?sapHetHan=true (link cũ từ Hôm nay) luôn mở Cần xử lý.
    loc: TAB.find((t) => t.khoa === searchParams.get('loc') && searchParams.get('sapHetHan') !== 'true')?.khoa ?? 'can-xu-ly',
  }
}

export default function HopDongQuanLy({ token, mobile = false }: Props): React.ReactElement {
  const toa = useMotToa({ tuChonDau: true })
  const [boLoc, setBoLoc] = useState<BoLocHopDongQuanLy>(() => (
    typeof window === 'undefined' ? { toaNhaId: null, sapHetHan: false, hopDongId: null, loc: 'can-xu-ly' } : layBoLocHopDongQuanLyTuUrl(window.location.href)
  ))
  // Toà do khung quyết định; chỉ khi khung chưa có (link cũ, test riêng lẻ) mới dùng ?toaNhaId= trên URL.
  const toaNhaId = toa.toaNhaId ?? boLoc.toaNhaId
  const [hopDongs, setHopDongs] = useState<ThongTinHopDong[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [thu, setThu] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined' || toaNhaId === null) return
    const query = new URLSearchParams()
    query.set('toaNhaId', String(toaNhaId))
    if (boLoc.sapHetHan) query.set('sapHetHan', 'true')
    if (boLoc.hopDongId) query.set('hopDongId', String(boLoc.hopDongId))
    query.set('loc', boLoc.loc)
    window.history.replaceState({}, '', `/hop-dong?${query.toString()}`)
  }, [boLoc, toaNhaId])

  useEffect(() => {
    if (toaNhaId === null) {
      setHopDongs([])
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHopDongQuanLy(token, toaNhaId)
      .then((data) => { if (mounted) setHopDongs(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách hợp đồng.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [toaNhaId, token, thu])

  const variant = mobile ? 'mobile' : 'desktop'
  const tabHienTai = TAB.find((t) => t.khoa === boLoc.loc) ?? TAB[0]
  const demTab = (t: (typeof TAB)[number]) => hopDongs.filter(t.match).length
  // Ít ngày còn lại lên đầu: việc gấp nhất nằm trên cùng.
  const hangSapXep = useMemo(
    () => hopDongs.filter((h) => tabHienTai.match(h) && (!boLoc.sapHetHan || h.sapHetHan)).sort((a, b) => a.soNgayConLai - b.soNgayConLai || a.soPhong.localeCompare(b.soPhong, 'vi', { numeric: true })),
    [hopDongs, tabHienTai, boLoc.sapHetHan],
  )
  const hopDongsHienThi = hangSapXep
  const hieuLuc = hopDongs.filter((h) => h.trangThai === 'HIEU_LUC')
  const tongCoc = hieuLuc.reduce((t, h) => t + Number(h.tienCoc), 0)
  const [thongBaoPdf, setThongBaoPdf] = useState<string | null>(null)
  const inPdf = async (rows: ThongTinHopDong[]) => {
    setThongBaoPdf(null)
    try {
      for (const h of rows.slice(0, 10)) await downloadManagementFile(token, `/api/hop-dong/${h.id}/xuat-pdf`, `hop-dong-${h.id}.pdf`)
      if (rows.length > 10) setThongBaoPdf('Mỗi lần in tối đa 10 hợp đồng; đã tải 10 hợp đồng đầu.')
    } catch (reason) {
      setThongBaoPdf(reason instanceof Error ? reason.message : 'Không thể tải PDF.')
    }
  }
  const tenToa = toa.danhSach.find((t) => t.id === toaNhaId)?.ten ?? `Cả ${toa.danhSach.length} toà`
  const cot = useMemo(() => cotHopDong(toa.danhSach.find((t) => t.id === toaNhaId)?.ten ?? ''), [toa.danhSach, toaNhaId])

  return (
    <section data-testid="manager-contract-screen" data-layout-variant={variant} aria-labelledby="manager-contract-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <style>{CSS_THE_MOBILE}</style>
      <DauTrang
        tieuDe={<span id="manager-contract-title">Hợp đồng</span>}
        phu={`${tenToa} · ${hieuLuc.length} đang hiệu lực · giữ cọc ${dinhDangTien(tongCoc)} ₫`}
        hanhDong={
          <>
          {toa.canChonTaiCho ? (
            <>
              <label className="sr-only" htmlFor="hop-dong-toa">Toà nhà</label>
              <select id="hop-dong-toa" className="select" data-contract-building-select style={{ width: 220 }} value="" onChange={(event) => toa.chon(soNguyenDuong(event.target.value))}>
                <option value="">Chọn toà nhà</option>
                {toa.danhSach.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
              </select>
            </>
          ) : null}
          <a className="btn btn-primary" href="/hop-dong/moi"><Icon name="plus" />Tạo hợp đồng</a>
          </>
        }
      />

      {boLoc.sapHetHan ? (
        <p data-contract-filter className="row-wrap" style={{ margin: '12px 0 0' }}>
          <FilterChip active data-contract-expiring-filter onRemove={() => setBoLoc((current) => ({ ...current, sapHetHan: false }))}>Đang lọc hợp đồng sắp hết hạn</FilterChip>
        </p>
      ) : null}
      {boLoc.hopDongId ? <p className="t-sm"><a href={`/hop-dong/${boLoc.hopDongId}`}>Mở hồ sơ hợp đồng #{boLoc.hopDongId}</a></p> : null}
      {thongBaoPdf ? <div role="alert"><ScreenNotice tone="urgent">{thongBaoPdf}</ScreenNotice></div> : null}
      {dangTai ? <EmptyState kind="loading" title="Đang tải danh sách hợp đồng…" />
        : loi ? <EmptyState kind="error" title="Không tải được danh sách hợp đồng" body={`${loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setThu((n) => n + 1)} />
          : toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hợp đồng." />
            : (
              <Card className="hd-bang" data-contract-list={variant}>
                <div className="tabs" role="tablist" aria-label="Nhóm hợp đồng">
                  {TAB.map((t) => (
                    <button key={t.khoa} type="button" role="tab" className="tab" aria-selected={t.khoa === tabHienTai.khoa} onClick={() => setBoLoc((c) => ({ ...c, loc: t.khoa, sapHetHan: false }))}>
                      {t.nhan}<span className="n">{demTab(t)}</span>
                    </button>
                  ))}
                </div>
                {hopDongsHienThi.length === 0 ? (
                  <EmptyState title={tabHienTai.khoa === 'can-xu-ly' ? 'Không có hợp đồng nào cần xử lý.' : tabHienTai.khoa === 'hieu-luc' ? 'Chưa có hợp đồng đang hiệu lực.' : 'Chưa có hợp đồng nào đã thanh lý.'} body={<a href="/hop-dong/moi">Tạo hợp đồng</a>} />
                ) : (
                  <DataTable
                    rows={hangSapXep}
                    columns={cot}
                    getRowId={(h) => h.id}
                    timTheo={(h) => `${h.soPhong} ${h.hoTenNguoiThue}`}
                    searchLabel="Tìm phòng, người thuê"
                    bulkActions={[{ label: 'In PDF', onClick: (rows) => void inPdf(rows) }]}
                    noun="hợp đồng"
                    pageSize={20}
                    rowLabel={(h) => `phòng ${h.soPhong}`}
                    rowProps={(h) => ({ 'data-contract-row': String(h.id) })}
                  />
                )}
              </Card>
            )}
    </section>
  )
}

const CSS_THE_MOBILE = `@media (min-width: 768px) { .hd-bang .table td { white-space: nowrap } }
.hd-bang > .tabs { padding: 0 8px; }
.hd-cham { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; background: var(--ma-text-muted); }
.hd-cham.canh { background: var(--ma-waiting-border); }
@media (max-width: 767px) { .hd-bang td[data-label="Thời hạn"], .hd-bang td[data-label="Giá thuê"], .hd-bang td[data-label="Cọc"], .hd-bang td[data-the="hanh-dong"] { display: none } }`

function soNgayTu(ngay: string): number {
  return Math.round((new Date(`${ngay}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
}

function tinhTrang(h: ThongTinHopDong): { nhan: string; canh: boolean } {
  if (h.trangThai === 'CHO_KY' || h.trangThai === 'DA_COC') return { nhan: h.trangThai === 'CHO_KY' ? 'Chờ ký' : h.tenTrangThai, canh: true }
  if (h.sapHetHan) return { nhan: `Hết hạn sau ${h.soNgayConLai} ngày`, canh: true }
  if (h.trangThai === 'HIEU_LUC' && soNgayTu(h.ngayBatDau) > 0) return { nhan: `Bắt đầu sau ${soNgayTu(h.ngayBatDau)} ngày`, canh: false }
  return { nhan: h.trangThai === 'HIEU_LUC' ? 'Đang hiệu lực' : h.tenTrangThai, canh: false }
}

function cotHopDong(tenToa: string): DataTableColumn<ThongTinHopDong>[] {
  return [
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <><a className="td-main" href={`/hop-dong/${h.id}`}>{h.soPhong}<span className="sr-only"> · hợp đồng {h.id}</span></a>{tenToa ? <div className="td-sub">{tenToa}</div> : null}</> },
    { key: 'nguoiThue', label: 'Người thuê', the: 'tieu-de', sortable: true, sortValue: (h) => h.hoTenNguoiThue, render: (h) => h.hoTenNguoiThue },
    { key: 'thoiHan', label: 'Thời hạn', sortable: true, sortValue: (h) => h.ngayKetThuc, render: (h) => `${dinhDangNgayIso(h.ngayBatDau)} – ${dinhDangNgayIso(h.ngayKetThuc)}` },
    { key: 'giaThue', label: 'Giá thuê', align: 'num', sortable: true, sortValue: (h) => Number(h.giaThue), render: (h) => <span className="t-money">{dinhDangTien(h.giaThue)} ₫</span> },
    { key: 'tienCoc', label: 'Cọc', align: 'num', sortable: true, sortValue: (h) => Number(h.tienCoc), render: (h) => <>{dinhDangTien(h.tienCoc)} ₫</> },
    { key: 'tinhTrang', label: 'Tình trạng', render: (h) => { const t = tinhTrang(h); return <><span className={`hd-cham${t.canh ? ' canh' : ''}`} aria-hidden="true" />{t.nhan}</> } },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (h) => <div className="td-acts"><a className="btn btn-secondary btn-sm" href={`/hop-dong/${h.id}`}>{h.trangThai === 'CHO_KY' || h.trangThai === 'DA_COC' ? 'Ghi nhận đã ký' : h.sapHetHan ? 'Gia hạn' : 'Xem'}<span className="sr-only"> hợp đồng phòng {h.soPhong}</span></a></div>,
    },
  ]
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}
