import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, fetchHopDongQuanLy, fetchToaNha, type ThongTinHopDong, type ThongTinToaNha } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { Icon } from './design/core/Icon'
import { Card } from './design/layout/Card'
import { FilterChip } from './design/forms/FilterChip'
import { DataTable, type DataTableColumn, type DataTableChip } from './design/table/DataTable'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenNotice } from './design/layout/Screen'
import { downloadManagementFile } from './managementApi'
import HopDongThaoTac from './HopDongThaoTac'

type Props = { token: string; mobile?: boolean }

export type BoLocHopDongQuanLy = {
  toaNhaId: number | null
  sapHetHan: boolean
  hopDongId: number | null
}

/** FR-BLD-06 keeps the manager contract worklist state in the URL for dashboard click-through. */
export function layBoLocHopDongQuanLyTuUrl(url: string | URL): BoLocHopDongQuanLy {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    sapHetHan: searchParams.get('sapHetHan') === 'true',
    hopDongId: soNguyenDuong(searchParams.get('hopDongId')),
  }
}

export default function HopDongQuanLy({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocHopDongQuanLy>(() => (
    typeof window === 'undefined' ? { toaNhaId: null, sapHetHan: false, hopDongId: null } : layBoLocHopDongQuanLyTuUrl(window.location.href)
  ))
  const [hopDongs, setHopDongs] = useState<ThongTinHopDong[]>([])
  const [hienThiFormTao, setHienThiFormTao] = useState(false)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((data) => {
        if (!mounted) return
        setToaNha(data)
        setBoLoc((current) => ({ ...current, toaNhaId: current.toaNhaId ?? data[0]?.id ?? null }))
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (typeof window === 'undefined' || boLoc.toaNhaId === null) return
    const query = new URLSearchParams()
    query.set('toaNhaId', String(boLoc.toaNhaId))
    if (boLoc.sapHetHan) query.set('sapHetHan', 'true')
    if (boLoc.hopDongId) query.set('hopDongId', String(boLoc.hopDongId))
    window.history.replaceState({}, '', `/hop-dong?${query.toString()}`)
  }, [boLoc])

  useEffect(() => {
    if (boLoc.toaNhaId === null) {
      setHopDongs([])
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHopDongQuanLy(token, boLoc.toaNhaId)
      .then((data) => { if (mounted) setHopDongs(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách hợp đồng.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  const hopDongsHienThi = useMemo(
    () => boLoc.sapHetHan ? hopDongs.filter((hopDong) => hopDong.sapHetHan) : hopDongs,
    [boLoc.sapHetHan, hopDongs],
  )
  const variant = mobile ? 'mobile' : 'desktop'
  const chiTietRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hienThiFormTao) {
      chiTietRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [hienThiFormTao])

  // DataTable chưa có sắp xếp mặc định: xếp Phòng tăng dần (số tự nhiên) trước khi đưa vào.
  const hangSapXep = useMemo(() => [...hopDongsHienThi].sort((a, b) => a.soPhong.localeCompare(b.soPhong, 'vi', { numeric: true })), [hopDongsHienThi])
  const hieuLuc = hopDongs.filter((h) => h.trangThai === 'HIEU_LUC')
  const tongThue = hieuLuc.reduce((t, h) => t + Number(h.giaThue), 0)
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
  const chonHopDong = (id: number) => { setBoLoc((curr) => ({ ...curr, hopDongId: id })); setHienThiFormTao(false) }
  // Chip "Đã cọc" chỉ hiện khi có hợp đồng ở trạng thái đó.
  const chips = useMemo(() => CHIP.filter((c) => c.key !== 'DA_COC' || hopDongsHienThi.some(c.match)), [hopDongsHienThi])
  const cot = useMemo(() => cotHopDong(chonHopDong), [])

  return (
    <section data-testid="manager-contract-screen" data-layout-variant={variant} aria-labelledby="manager-contract-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <style>{CSS_THE_MOBILE}</style>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1" id="manager-contract-title">Hợp đồng</h1>
          <p className="sub">{hieuLuc.length} đang hiệu lực · tổng tiền thuê {dinhDangTien(tongThue)} ₫/tháng · tiền cọc đang giữ {dinhDangTien(tongCoc)} ₫</p>
        </div>
        <div className="topbar-actions">
          <label className="sr-only" htmlFor="hop-dong-toa">Toà nhà</label>
          <select
            id="hop-dong-toa"
            className="select"
            data-contract-building-select
            style={{ width: 220 }}
            value={boLoc.toaNhaId ?? ''}
            onChange={(event) => setBoLoc((current) => ({ ...current, toaNhaId: soNguyenDuong(event.target.value), hopDongId: null }))}
          >
            <option value="">Chọn toà nhà</option>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const next = !hienThiFormTao
              setHienThiFormTao(next)
              if (next) setBoLoc((curr) => ({ ...curr, hopDongId: null }))
            }}
          >
            <Icon name={hienThiFormTao ? 'x' : 'plus'} />{hienThiFormTao ? 'Đóng form tạo' : 'Tạo hợp đồng'}
          </button>
        </div>
      </header>

      {boLoc.sapHetHan ? (
        <p data-contract-filter className="row-wrap" style={{ margin: '12px 0 0' }}>
          <FilterChip active data-contract-expiring-filter onRemove={() => setBoLoc((current) => ({ ...current, sapHetHan: false }))}>Đang lọc hợp đồng sắp hết hạn</FilterChip>
        </p>
      ) : null}
      {thongBaoPdf ? <div role="alert"><ScreenNotice tone="urgent">{thongBaoPdf}</ScreenNotice></div> : null}
      {dangTai ? <p aria-live="polite">Đang tải danh sách hợp đồng…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : boLoc.toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hợp đồng." />
            : hopDongsHienThi.length === 0 ? <EmptyState title={boLoc.sapHetHan ? 'Không có hợp đồng sắp hết hạn.' : 'Chưa có hợp đồng nào trong toà nhà này.'} />
              : (
                <Card className="hd-bang" data-contract-list={variant}>
                  <DataTable
                    rows={hangSapXep}
                    columns={cot}
                    getRowId={(h) => h.id}
                    chips={chips}
                    timTheo={(h) => `${h.soPhong} ${h.hoTenNguoiThue}`}
                    searchLabel="Tìm phòng, người thuê"
                    bulkActions={[{ label: 'In PDF', onClick: (rows) => void inPdf(rows) }]}
                    noun="hợp đồng"
                    pageSize={20}
                    rowLabel={(h) => `phòng ${h.soPhong}`}
                    rowProps={(h) => ({ 'data-contract-row': String(h.id) })}
                  />
                </Card>
              )}

      {/* CHI TIẾT HỒ SƠ & THAO TÁC HỢP ĐỒNG ĐƯỢC CHỌN HOẶC FORM TẠO */}
      {(boLoc.hopDongId !== null || hienThiFormTao) && (
        <div ref={chiTietRef} style={{ marginTop: 24, borderTop: '2px solid var(--ma-border-subtle)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>
              {hienThiFormTao ? '📝 Tạo hợp đồng thuê mới' : `📄 Hồ sơ chi tiết hợp đồng #${boLoc.hopDongId}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setHienThiFormTao(false)
                setBoLoc((curr) => ({ ...curr, hopDongId: null }))
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--ma-radius)',
                background: 'transparent',
                border: '1px solid var(--ma-border-default)',
                fontSize: 12.5,
                color: 'var(--ma-text-secondary)',
                cursor: 'pointer',
              }}
            >
              ✕ Đóng chi tiết
            </button>
          </div>
          <HopDongThaoTac
            token={token}
            buildingId={boLoc.toaNhaId}
            selectedHopDongId={boLoc.hopDongId}
            onSelectHopDong={(id) => setBoLoc((curr) => ({ ...curr, hopDongId: id }))}
            hienThiFormTao={hienThiFormTao}
            onToggleFormTao={setHienThiFormTao}
            onDongChiTiet={() => setBoLoc((curr) => ({ ...curr, hopDongId: null }))}
            embedded={true}
          />
        </div>
      )}
    </section>
  )
}

const CSS_THE_MOBILE = `@media (min-width: 768px) { .hd-bang .table td { white-space: nowrap } }`

const CHIP: DataTableChip<ThongTinHopDong>[] = [
  { key: 'HIEU_LUC', label: 'Hiệu lực', match: (h) => h.trangThai === 'HIEU_LUC' },
  { key: 'SAP_HET_HAN', label: 'Sắp hết hạn', match: (h) => h.sapHetHan },
  { key: 'CHO_KY', label: 'Chờ ký', match: (h) => h.trangThai === 'CHO_KY' },
  { key: 'DA_COC', label: 'Đã cọc', match: (h) => h.trangThai === 'DA_COC' },
  { key: 'DA_THANH_LY', label: 'Đã thanh lý', match: (h) => h.trangThai === 'DA_THANH_LY' },
]

function chuCaiDau(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean)
  return tu.slice(-2).map((t) => Array.from(t)[0]).join('').toUpperCase()
}

function soNgayTu(ngay: string): number {
  return Math.round((new Date(`${ngay}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
}

function ghiChuThoiHan(h: ThongTinHopDong): string {
  if (h.trangThai === 'DA_THANH_LY') return 'đã thanh lý'
  const batDau = soNgayTu(h.ngayBatDau)
  if (batDau > 0) return `bắt đầu sau ${batDau} ngày`
  return `còn ${h.soNgayConLai} ngày`
}

function cotHopDong(xem: (id: number) => void): DataTableColumn<ThongTinHopDong>[] {
  return [
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <span className="td-main">{h.soPhong}</span> },
    { key: 'nguoiThue', label: 'Người thuê', the: 'tieu-de', sortable: true, sortValue: (h) => h.hoTenNguoiThue, render: (h) => <div className="td-person"><span className={`avatar sm h${(h.id % 5) + 1}`} aria-hidden="true">{chuCaiDau(h.hoTenNguoiThue)}</span>{h.hoTenNguoiThue}</div> },
    {
      key: 'thoiHan', label: 'Thời hạn', sortable: true, sortValue: (h) => h.ngayKetThuc,
      render: (h) => <>{dinhDangNgayIso(h.ngayBatDau)} – {dinhDangNgayIso(h.ngayKetThuc)}<div className="td-sub" style={h.sapHetHan ? { color: 'var(--ma-accent-warm-text)' } : undefined}>{ghiChuThoiHan(h)}</div></>,
    },
    { key: 'giaThue', label: 'Giá thuê', align: 'num', sortable: true, sortValue: (h) => Number(h.giaThue), render: (h) => <span className="t-money">{dinhDangTien(h.giaThue)} ₫</span> },
    { key: 'tienCoc', label: 'Tiền cọc', align: 'num', sortable: true, sortValue: (h) => Number(h.tienCoc), render: (h) => <>{dinhDangTien(h.tienCoc)} ₫</> },
    { key: 'trangThai', label: 'Trạng thái', render: (h) => <StatusTag tone={tongTrangThai(h)}>{h.sapHetHan ? 'Sắp hết hạn' : h.tenTrangThai}</StatusTag> },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (h) => <div className="td-acts"><button type="button" className="btn btn-ghost btn-sm" onClick={() => xem(h.id)}>{h.sapHetHan ? 'Gia hạn' : h.trangThai === 'CHO_KY' ? 'Ghi nhận ký' : 'Xem'}</button></div>,
    },
  ]
}

function tongTrangThai(h: ThongTinHopDong): 'waiting' | 'done' | 'draft' | 'strong' | 'closed' {
  if (h.sapHetHan) return 'waiting'
  return ({ HIEU_LUC: 'done', CHO_KY: 'draft', DA_COC: 'strong', DA_THANH_LY: 'closed' } as const)[h.trangThai as 'HIEU_LUC'] ?? 'draft'
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}
