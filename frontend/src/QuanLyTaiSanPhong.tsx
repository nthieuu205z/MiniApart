import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  fetchTaiSanPhong,
  themTaiSanPhong,
  xoaTaiSanPhong,
  fetchBienBanTaiSan,
  lapBienBanTaiSan,
  type TaiSanPhong,
  type BienBanBanGiao,
  type YeuCauKhaiBaoTaiSan,
  type YeuCauLapBienBan,
  type YeuCauChiTietBienBan,
} from './api'
import { Button } from './design/core/Button'
import { SysLabel } from './design/core/SysLabel'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { dinhDangTien } from './design/core/format'
import { Field } from './design/forms/Field'
import { DataTable, type DataTableColumn } from './design/table/DataTable'

const NHAN_ENUM: Record<string, string> = {
  DIEN_LANH: 'Điện lạnh', NOI_THAT: 'Nội thất', DIEN_NUOC: 'Điện nước', DIEN_TU: 'Điện tử', GIA_DUNG: 'Gia dụng', AN_NINH: 'An ninh',
  HOAT_DONG_TOT: 'Hoạt động tốt', HU_HONG: 'Hư hỏng', MOI: 'Mới',
}
// shortcut: giá trị lạ chỉ được đổi dấu gạch dưới, chưa có dấu tiếng Việt; thêm vào NHAN_ENUM khi gặp.
const nhanEnum = (v: string) => NHAN_ENUM[v] ?? (/^[A-Z0-9_]+$/.test(v) ? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ') : v)

function dinhDangSoTien(value: string | number | undefined | null): string {
  if (value === null || value === undefined || value === '') return '0'
  return dinhDangTien(String(value))
}

type Props = {
  token: string
  phongId: number
  soPhong?: string
  hopDongId?: number
  onKhauTruThayDoi?: (tienKhauTru: number, lyDo: string) => void
  onBienBanLoaded?: (bienBans: BienBanBanGiao[]) => void
  mobile?: boolean
}

const TAI_SAN_MAU = [
  { ten: 'Điều hoà Panasonic 9000BTU', loai: 'ĐIỆN LẠNH', giaTri: '7500000', tinhTrang: 'Tốt' },
  { ten: 'Tủ lạnh Sharp 150L Inverter', loai: 'ĐIỆN LẠNH', giaTri: '4500000', tinhTrang: 'Tốt' },
  { ten: 'Bình nóng lạnh Rossi 20L', loai: 'ĐIỆN NƯỚC', giaTri: '2200000', tinhTrang: 'Tốt' },
  { ten: 'Giường gỗ MDF 1m6 x 2m', loai: 'NỘI THẤT', giaTri: '3200000', tinhTrang: 'Tốt' },
  { ten: 'Tủ quần áo 2 cánh gỗ MDF', loai: 'NỘI THẤT', giaTri: '2500000', tinhTrang: 'Tốt' },
  { ten: 'Bộ bàn ghế làm việc', loai: 'NỘI THẤT', giaTri: '1200000', tinhTrang: 'Tốt' },
  { ten: 'Bếp từ đơn Kangaroo', loai: 'GIA DỤNG', giaTri: '800000', tinhTrang: 'Tốt' },
]

export default function QuanLyTaiSanPhong({
  token,
  phongId,
  soPhong,
  hopDongId,
  onKhauTruThayDoi,
  onBienBanLoaded,
  mobile = false,
}: Props) {
  const [tab, setTab] = useState<'DANH_MUC' | 'BIEN_BAN'>('DANH_MUC')
  const [danhSachTaiSan, setDanhSachTaiSan] = useState<TaiSanPhong[]>([])
  const [danhSachBienBan, setDanhSachBienBan] = useState<BienBanBanGiao[]>([])
  const [dangTai, setDangTai] = useState(false)
  const [dangLuu, setDangLuu] = useState(false)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  // Form Thêm tài sản
  const [bieuMauTaiSan, setBieuMauTaiSan] = useState<YeuCauKhaiBaoTaiSan>({
    tenTaiSan: '',
    loaiTaiSan: 'NỘI THẤT',
    soLuong: 1,
    tinhTrang: 'Tốt',
    giaTriUocTinh: '',
    ghiChu: '',
  })

  // Form Lập biên bản bàn giao
  const [loaiBienBan, setLoaiBienBan] = useState<'NHAN_PHONG' | 'TRA_PHONG'>('NHAN_PHONG')
  const [ngayThucHien, setNgayThucHien] = useState(() => new Date().toISOString().slice(0, 10))
  const [ghiChuBienBan, setGhiChuBienBan] = useState('')
  const [chiTietKiemKe, setChiTietKiemKe] = useState<
    Array<{
      taiSanId: number
      tenTaiSan: string
      soLuong: number
      tinhTrangLucGiao: string
      tinhTrangLucTra: string
      tienKhauTru: string
      lyDoKhauTru: string
    }>
  >([])

  const requestIdRef = useRef(0)
  const mutationIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      requestIdRef.current++
      mutationIdRef.current++
    }
  }, [])

  async function loadData(targetReqId?: number) {
    const curPhong = phongId
    const curHd = hopDongId
    const reqId = targetReqId ?? ++requestIdRef.current
    setDangTai(true)
    try {
      const [taiSan, bienBan] = await Promise.all([
        fetchTaiSanPhong(token, curPhong),
        curHd ? fetchBienBanTaiSan(token, curHd) : Promise.resolve([]),
      ])
      if (requestIdRef.current !== reqId || !isMountedRef.current) return
      setDanhSachTaiSan(taiSan)
      setDanhSachBienBan(bienBan)
      if (onBienBanLoaded) {
        onBienBanLoaded(bienBan)
      }
    } catch (e: unknown) {
      if (requestIdRef.current === reqId && isMountedRef.current) {
        setLoi(e instanceof Error ? e.message : 'Không thể tải dữ liệu tài sản.')
      }
    } finally {
      if (requestIdRef.current === reqId && isMountedRef.current) {
        setDangTai(false)
      }
    }
  }

  useEffect(() => {
    const reqId = ++requestIdRef.current
    // Invalidate active mutation of previous scope and reset saving state
    mutationIdRef.current++
    setDangLuu(false)

    // Reset form / checklist khi đổi phòng hoặc đổi hợp đồng
    setChiTietKiemKe([])
    setGhiChuBienBan('')
    setLoaiBienBan('NHAN_PHONG')
    setThongBao(null)
    setLoi(null)

    setDangTai(true)
    Promise.all([
      fetchTaiSanPhong(token, phongId),
      hopDongId ? fetchBienBanTaiSan(token, hopDongId) : Promise.resolve([]),
    ])
      .then(([taiSan, bienBan]) => {
        if (requestIdRef.current !== reqId || !isMountedRef.current) return
        setDanhSachTaiSan(taiSan)
        setDanhSachBienBan(bienBan)
        if (onBienBanLoaded) {
          onBienBanLoaded(bienBan)
        }
      })
      .catch((e: unknown) => {
        if (requestIdRef.current !== reqId || !isMountedRef.current) return
        setLoi(e instanceof Error ? e.message : 'Không thể tải dữ liệu tài sản.')
      })
      .finally(() => {
        if (requestIdRef.current === reqId && isMountedRef.current) {
          setDangTai(false)
        }
      })
  }, [token, phongId, hopDongId])

  // Chuẩn bị danh sách kiểm kê khi chuyển sang lập biên bản
  function chuanBiKiemKe(kieu: 'NHAN_PHONG' | 'TRA_PHONG') {
    setLoaiBienBan(kieu)
    setChiTietKiemKe(
      danhSachTaiSan.map((ts) => ({
        taiSanId: ts.id,
        tenTaiSan: ts.tenTaiSan,
        soLuong: ts.soLuong,
        tinhTrangLucGiao: ts.tinhTrang,
        tinhTrangLucTra: kieu === 'TRA_PHONG' ? ts.tinhTrang : '',
        tienKhauTru: '0',
        lyDoKhauTru: '',
      }))
    )
  }

  async function handleThemTaiSan(e: FormEvent) {
    e.preventDefault()
    const mutationId = ++mutationIdRef.current
    const targetPhongId = phongId
    const tenDaThem = bieuMauTaiSan.tenTaiSan
    setDangLuu(true)
    setLoi(null)
    setThongBao(null)
    try {
      await themTaiSanPhong(token, targetPhongId, bieuMauTaiSan)
      if (mutationIdRef.current !== mutationId || !isMountedRef.current) return
      setThongBao(`Đã thêm thiết bị "${tenDaThem}" vào phòng.`)
      setBieuMauTaiSan({
        tenTaiSan: '',
        loaiTaiSan: 'NỘI THẤT',
        soLuong: 1,
        tinhTrang: 'Tốt',
        giaTriUocTinh: '',
        ghiChu: '',
      })
      await loadData(requestIdRef.current)
    } catch (e: unknown) {
      if (mutationIdRef.current === mutationId && isMountedRef.current) {
        setLoi(e instanceof Error ? e.message : 'Lỗi thêm tài sản.')
      }
    } finally {
      if (mutationIdRef.current === mutationId && isMountedRef.current) {
        setDangLuu(false)
      }
    }
  }

  async function handleXoaTaiSan(id: number, ten: string) {
    if (!window.confirm(`Xoá tài sản "${ten}" khỏi danh mục phòng?`)) return
    const mutationId = ++mutationIdRef.current
    setDangLuu(true)
    setLoi(null)
    try {
      await xoaTaiSanPhong(token, id)
      if (mutationIdRef.current !== mutationId || !isMountedRef.current) return
      setThongBao(`Đã xoá thiết bị "${ten}".`)
      await loadData(requestIdRef.current)
    } catch (e: unknown) {
      if (mutationIdRef.current === mutationId && isMountedRef.current) {
        setLoi(e instanceof Error ? e.message : 'Lỗi xoá tài sản.')
      }
    } finally {
      if (mutationIdRef.current === mutationId && isMountedRef.current) {
        setDangLuu(false)
      }
    }
  }

  function handleChonTaiSanMau(mau: typeof TAI_SAN_MAU[0]) {
    setBieuMauTaiSan({
      tenTaiSan: mau.ten,
      loaiTaiSan: mau.loai,
      soLuong: 1,
      tinhTrang: mau.tinhTrang,
      giaTriUocTinh: mau.giaTri,
      ghiChu: 'Theo tiêu chuẩn bàn giao phòng',
    })
  }

  const tongKhauTruBienBan = chiTietKiemKe.reduce(
    (sum, item) => sum + (Number(item.tienKhauTru) || 0),
    0
  )

  async function handleLapBienBan(e: FormEvent) {
    e.preventDefault()
    if (!hopDongId) {
      setLoi('Cần chỉ định hợp đồng để lập biên bản bàn giao.')
      return
    }
    const mutationId = ++mutationIdRef.current
    const submittingHopDongId = hopDongId
    const submittingPhongId = phongId
    setDangLuu(true)
    setLoi(null)
    setThongBao(null)
    try {
      const payload: YeuCauLapBienBan = {
        loaiBienBan,
        ngayThucHien,
        ghiChuChung: ghiChuBienBan,
        chiTiet: chiTietKiemKe.map((ct) => ({
          taiSanId: ct.taiSanId,
          tenTaiSan: ct.tenTaiSan,
          soLuong: ct.soLuong,
          tinhTrangLucGiao: ct.tinhTrangLucGiao,
          tinhTrangLucTra: ct.tinhTrangLucTra,
          tienKhauTru: ct.tienKhauTru ? Number(ct.tienKhauTru) : 0,
          lyDoKhauTru: ct.lyDoKhauTru,
        })),
      }
      await lapBienBanTaiSan(token, submittingHopDongId, payload)
      if (mutationIdRef.current !== mutationId || !isMountedRef.current) return
      setThongBao(
        `Lập biên bản ${loaiBienBan === 'NHAN_PHONG' ? 'nhận phòng' : 'trả phòng'} thành công!`
      )
      if (loaiBienBan === 'TRA_PHONG' && onKhauTruThayDoi) {
        const lyDoTongHop = chiTietKiemKe
          .filter((ct) => Number(ct.tienKhauTru) > 0)
          .map((ct) => `${ct.tenTaiSan}: ${ct.lyDoKhauTru || 'Hư hỏng/Mất mát'}`)
          .join('; ')
        onKhauTruThayDoi(tongKhauTruBienBan, lyDoTongHop)
      }
      const [taiSan, bienBan] = await Promise.all([
        fetchTaiSanPhong(token, submittingPhongId),
        fetchBienBanTaiSan(token, submittingHopDongId),
      ])
      if (mutationIdRef.current !== mutationId || !isMountedRef.current) return
      setDanhSachTaiSan(taiSan)
      setDanhSachBienBan(bienBan)
      if (onBienBanLoaded) onBienBanLoaded(bienBan)
    } catch (e: unknown) {
      if (mutationIdRef.current === mutationId && isMountedRef.current) {
        setLoi(e instanceof Error ? e.message : 'Lỗi lập biên bản bàn giao.')
      }
    } finally {
      if (mutationIdRef.current === mutationId && isMountedRef.current) {
        setDangLuu(false)
      }
    }
  }

  const cotTaiSan: DataTableColumn<TaiSanPhong>[] = [
    { key: 'ten', label: 'Tên tài sản / Thiết bị', sortable: true, sortValue: (ts) => ts.tenTaiSan, render: (ts) => <span className="td-main">{ts.tenTaiSan}</span> },
    { key: 'loai', label: 'Phân loại', render: (ts) => <StatusTag tone="draft">{nhanEnum(ts.loaiTaiSan)}</StatusTag> },
    { key: 'sl', label: 'SL', align: 'num', render: (ts) => ts.soLuong },
    { key: 'tinhTrang', label: 'Tình trạng', render: (ts) => <StatusTag tone="neutral">{nhanEnum(ts.tinhTrang)}</StatusTag> },
    { key: 'gia', label: 'Giá trị ước tính', align: 'num', sortable: true, sortValue: (ts) => Number(ts.giaTriUocTinh ?? 0), render: (ts) => ts.giaTriUocTinh ? <span className="t-money">{dinhDangSoTien(ts.giaTriUocTinh)} ₫</span> : '—' },
    { key: 'ghiChu', label: 'Ghi chú', render: (ts) => <span className="bq-toa" title={ts.ghiChu ?? ''}>{ts.ghiChu || '—'}</span> },
    { key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong', render: (ts) => <div className="td-acts"><Button variant="danger" size="sm" blocked={dangLuu} onClick={() => handleXoaTaiSan(ts.id, ts.tenTaiSan)}>Xoá<span className="sr-only"> {ts.tenTaiSan}</span></Button></div> },
  ]
  type ChiTietLichSu = NonNullable<BienBanBanGiao['chiTiet']>[number] & { _k: number }
  const cotChiTietBienBan = (traPhong: boolean): DataTableColumn<ChiTietLichSu>[] => [
    { key: 'ten', label: 'Tài sản', render: (ct) => <span className="td-main">{ct.tenTaiSan}</span> },
    { key: 'sl', label: 'SL', align: 'num', render: (ct) => ct.soLuong },
    { key: 'giao', label: 'Tình trạng lúc giao', render: (ct) => ct.tinhTrangLucGiao || '—' },
    ...(traPhong ? [
      { key: 'tra', label: 'Tình trạng lúc trả', render: (ct: ChiTietLichSu) => ct.tinhTrangLucTra || '—' },
      { key: 'khauTru', label: 'Khấu trừ', align: 'num' as const, render: (ct: ChiTietLichSu) => Number(ct.tienKhauTru) > 0 ? <strong style={{ color: 'var(--ma-urgent)' }}>{dinhDangSoTien(ct.tienKhauTru)} ₫</strong> : '0 ₫' },
      { key: 'lyDo', label: 'Lý do', render: (ct: ChiTietLichSu) => ct.lyDoKhauTru || '—' },
    ] : []),
  ]

  return (
    <section
      data-testid="room-assets-section"
      className="card-sunken"
      style={{ display: 'grid', gap: 'var(--ma-space-4)', minWidth: 0, maxWidth: '100%' }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid var(--ma-border-subtle)',
          paddingBottom: 12,
        }}
      >
        <div>
          <SysLabel>Quản lý tài sản bàn giao</SysLabel>
          <h3 className="h3" style={{ margin: '4px 0 0' }}>
            Tiện nghi & Biên bản tài sản {soPhong ? `(Phòng ${soPhong})` : ''}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            aria-pressed={tab === 'DANH_MUC'}
            style={tab === 'DANH_MUC' ? { borderColor: 'var(--ma-text-primary)', fontWeight: 600 } : undefined}
            onClick={() => setTab('DANH_MUC')}
          >
            Danh mục ({danhSachTaiSan.length})
          </Button>
          {hopDongId ? (
            <Button
              type="button"
              variant="secondary"
              aria-pressed={tab === 'BIEN_BAN'}
              style={tab === 'BIEN_BAN' ? { borderColor: 'var(--ma-text-primary)', fontWeight: 600 } : undefined}
              onClick={() => {
                setTab('BIEN_BAN')
                chuanBiKiemKe('NHAN_PHONG')
              }}
            >
              Biên bản bàn giao ({danhSachBienBan.length})
            </Button>
          ) : null}
        </div>
      </header>

      {thongBao ? (
        <div
          role="status"
          style={{
            padding: '8px 12px',
            background: 'var(--ma-done-bg)',
            color: 'var(--ma-done-text)',
            borderRadius: 'var(--ma-radius)',
            fontSize: 'var(--ma-text-caption)',
            fontWeight: 600,
          }}
        >
          {thongBao}
        </div>
      ) : null}

      {loi ? (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            background: 'var(--ma-urgent-bg)',
            color: 'var(--ma-urgent)',
            borderRadius: 'var(--ma-radius)',
            fontSize: 'var(--ma-text-caption)',
            fontWeight: 600,
          }}
        >
          {loi}
        </div>
      ) : null}

      {dangTai ? (
        <p style={{ margin: 0, color: 'var(--ma-text-secondary)' }}>Đang tải dữ liệu thiết bị…</p>
      ) : tab === 'DANH_MUC' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Quick presets */}
          <div>
            <span
              style={{
                fontSize: 'var(--ma-text-caption)',
                color: 'var(--ma-text-secondary)',
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              THÊM NHANH THIẾT BỊ PHỔ BIẾN:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TAI_SAN_MAU.map((m) => (
                <button
                  key={m.ten}
                  type="button"
                  onClick={() => handleChonTaiSanMau(m)}
                  className="chip"
                >
                  + {m.ten}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          {danhSachTaiSan.length === 0 ? (
            <EmptyState
              title="Phòng chưa khai báo tài sản nào"
              body="Chọn thiết bị mẫu phía trên hoặc nhập form bên dưới để thêm tiện nghi (Điều hoà, tủ lạnh, giường...) vào phòng."
            />
          ) : (
            <DataTable
              rows={danhSachTaiSan}
              columns={cotTaiSan}
              getRowId={(ts) => ts.id}
              noun="tài sản"
              pageSize={10}
              timTheo={(ts) => `${ts.tenTaiSan} ${ts.loaiTaiSan}`}
              searchLabel="Tìm tên tài sản"
            />
          )}

          {/* Form thêm tài sản */}
          <form
            onSubmit={handleThemTaiSan}
            className="card"
            style={{
              display: 'grid',
              gap: 10,
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <strong style={{ fontSize: 13 }}>Khai báo thêm tiện ích / tài sản mới:</strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                gap: 8,
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <Field label="Tên thiết bị *">
                <input
                  required
                  className="input"
                  value={bieuMauTaiSan.tenTaiSan}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, tenTaiSan: e.target.value })
                  }
                  placeholder="Ví dụ: Tủ lạnh Samsung 180L"
                />
              </Field>

              <Field label="Loại tài sản">
                <select
                  className="input"
                  value={bieuMauTaiSan.loaiTaiSan}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, loaiTaiSan: e.target.value })
                  }
                >
                  <option value="ĐIỆN LẠNH">Điện lạnh</option>
                  <option value="NỘI THẤT">Nội thất</option>
                  <option value="ĐIỆN NƯỚC">Điện nước</option>
                  <option value="GIA DỤNG">Gia dụng</option>
                  <option value="AN NINH">An ninh / Khác</option>
                </select>
              </Field>

              <Field label="Số lượng">
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={bieuMauTaiSan.soLuong}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, soLuong: Number(e.target.value) || 1 })
                  }
                />
              </Field>

              <Field label="Tình trạng">
                <input
                  className="input"
                  value={bieuMauTaiSan.tinhTrang}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, tinhTrang: e.target.value })
                  }
                  placeholder="Tốt / Mới 100%"
                />
              </Field>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                gap: 8,
                alignItems: 'end',
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <Field label="Giá trị ước tính (₫)">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="input"
                  value={bieuMauTaiSan.giaTriUocTinh}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, giaTriUocTinh: e.target.value })
                  }
                  placeholder="Ví dụ: 3500000"
                />
              </Field>

              <Field label="Ghi chú">
                <input
                  className="input"
                  value={bieuMauTaiSan.ghiChu}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, ghiChu: e.target.value })
                  }
                  placeholder="Kèm remote, dây nguồn..."
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                blocked={dangLuu}
                style={{ minHeight: 38 }}
              >
                {dangLuu ? 'Đang lưu…' : 'Lưu tài sản'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* TAB BIÊN BẢN BÀN GIAO */
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Lịch sử biên bản đã lập */}
          {danhSachBienBan.length > 0 && (
            <div>
              <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                Lịch sử biên bản của hợp đồng #{hopDongId}:
              </strong>
              <div style={{ display: 'grid', gap: 10 }}>
                {danhSachBienBan.map((bb) => (
                  <article
                    key={bb.id}
                    style={{
                      border: '1px solid var(--ma-border-default)',
                      padding: 12,
                      background: 'var(--ma-bg-sunken)',
                      borderRadius: 'var(--ma-radius)',
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <StatusTag tone={bb.loaiBienBan === 'NHAN_PHONG' ? 'done' : 'urgent'}>
                          {bb.loaiBienBan === 'NHAN_PHONG'
                            ? 'Bàn giao nhận phòng'
                            : 'Biên bản trả phòng'}
                        </StatusTag>
                        <strong>Biên bản #{bb.id}</strong>
                        <span style={{ color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                          Ngày: {bb.ngayThucHien}
                        </span>
                      </div>
                      {Number(bb.tongTienKhauTru) > 0 && (
                        <strong style={{ color: 'var(--ma-urgent)' }}>
                          Khấu trừ cọc: {dinhDangSoTien(bb.tongTienKhauTru)} ₫
                        </strong>
                      )}
                    </div>

                    {bb.ghiChuChung ? (
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                        Ghi chú: {bb.ghiChuChung}
                      </p>
                    ) : null}

                    {/* Danh sách hạng mục bàn giao */}
                    <DataTable
                      rows={bb.chiTiet.map((ct, idx) => ({ ...ct, _k: ct.id ?? idx }))}
                      columns={cotChiTietBienBan(bb.loaiBienBan === 'TRA_PHONG')}
                      getRowId={(ct) => ct._k}
                      noun="hạng mục"
                      pageSize={50}
                    />
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Form lập biên bản mới */}
          <form
            onSubmit={handleLapBienBan}
            style={{
              padding: 14,
              border: '2px solid var(--ma-ink-900)',
              borderRadius: 'var(--ma-radius)',
              background: 'var(--ma-bg-card)',
              display: 'grid',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <strong>Lập biên bản bàn giao thiết bị phòng #{hopDongId}</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  type="button"
                  variant="secondary"
                  aria-pressed={loaiBienBan === 'NHAN_PHONG'}
                  onClick={() => chuanBiKiemKe('NHAN_PHONG')}
                  style={loaiBienBan === 'NHAN_PHONG' ? { borderColor: 'var(--ma-text-primary)', fontWeight: 600 } : undefined}
                >
                  Bàn giao Nhận phòng
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-pressed={loaiBienBan === 'TRA_PHONG'}
                  onClick={() => chuanBiKiemKe('TRA_PHONG')}
                  style={loaiBienBan === 'TRA_PHONG' ? { borderColor: 'var(--ma-text-primary)', fontWeight: 600 } : undefined}
                >
                  Kiểm kê Trả phòng
                </Button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '1fr' : '1fr 2fr',
                gap: 8,
              }}
            >
              <Field label="Ngày thực hiện">
                <input
                  type="date"
                  required
                  className="input"
                  value={ngayThucHien}
                  onChange={(e) => setNgayThucHien(e.target.value)}
                />
              </Field>

              <Field label="Ghi chú chung biên bản">
                <input
                  className="input"
                  value={ghiChuBienBan}
                  onChange={(e) => setGhiChuBienBan(e.target.value)}
                  placeholder="Biên bản lập có sự chứng kiến của 2 bên..."
                />
              </Field>
            </div>

            {/* Bảng checklist kiểm kê */}
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tài sản</th>
                    <th>SL</th>
                    <th>Tình trạng bàn giao</th>
                    {loaiBienBan === 'TRA_PHONG' && (
                      <>
                        <th>Tình trạng khi trả</th>
                        <th>
                          Khấu trừ (₫)
                        </th>
                        <th>Lý do khấu trừ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chiTietKiemKe.map((ct, idx) => (
                    <tr key={ct.taiSanId || idx}>
                      <td>{ct.tenTaiSan}</td>
                      <td>{ct.soLuong}</td>
                      <td>
                        <input
                          className="input"
                          value={ct.tinhTrangLucGiao}
                          onChange={(e) => {
                            const clone = [...chiTietKiemKe]
                            clone[idx].tinhTrangLucGiao = e.target.value
                            setChiTietKiemKe(clone)
                          }}
                        />
                      </td>
                      {loaiBienBan === 'TRA_PHONG' && (
                        <>
                          <td>
                            <input
                              className="input"
                              value={ct.tinhTrangLucTra}
                              placeholder="Còn tốt / Bị vỡ / Hỏng..."
                              onChange={(e) => {
                                const clone = [...chiTietKiemKe]
                                clone[idx].tinhTrangLucTra = e.target.value
                                setChiTietKiemKe(clone)
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              className="input" style={{ minWidth: 110, textAlign: 'right' }}
                              value={ct.tienKhauTru}
                              onChange={(e) => {
                                const clone = [...chiTietKiemKe]
                                clone[idx].tienKhauTru = e.target.value
                                setChiTietKiemKe(clone)
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={ct.lyDoKhauTru}
                              placeholder="Hư hỏng remote, nứt mặt kính..."
                              onChange={(e) => {
                                const clone = [...chiTietKiemKe]
                                clone[idx].lyDoKhauTru = e.target.value
                                setChiTietKiemKe(clone)
                              }}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loaiBienBan === 'TRA_PHONG' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--ma-bg-sunken)',
                  border: '1px solid var(--ma-border-default)',
                }}
              >
                <span>
                  Tổng tiền khấu trừ cọc do hư hỏng / thiếu hụt:
                </span>
                <strong style={{ fontSize: 16, color: 'var(--ma-urgent)' }}>
                  {dinhDangSoTien(tongKhauTruBienBan)} ₫
                </strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button
                type="submit"
                variant="primary"
                blocked={dangLuu || chiTietKiemKe.length === 0}
                style={{ minHeight: 40 }}
              >
                {dangLuu
                  ? 'Đang lưu…'
                  : `Xác nhận & Lưu biên bản ${loaiBienBan === 'NHAN_PHONG' ? 'Nhận phòng' : 'Trả phòng'}`}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

