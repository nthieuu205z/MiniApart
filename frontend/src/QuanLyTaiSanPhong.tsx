import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
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

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setDangTai(true)
    setLoi(null)
    try {
      const [taiSan, bienBan] = await Promise.all([
        fetchTaiSanPhong(token, phongId),
        hopDongId ? fetchBienBanTaiSan(token, hopDongId) : Promise.resolve([]),
      ])
      if (isCancelled && isCancelled()) return
      setDanhSachTaiSan(taiSan)
      setDanhSachBienBan(bienBan)
      if (onBienBanLoaded) {
        onBienBanLoaded(bienBan)
      }
    } catch (e: unknown) {
      if (isCancelled && isCancelled()) return
      setLoi(e instanceof Error ? e.message : 'Không thể tải dữ liệu tài sản.')
    } finally {
      if (!isCancelled || !isCancelled()) {
        setDangTai(false)
      }
    }
  }, [token, phongId, hopDongId, onBienBanLoaded])

  useEffect(() => {
    let active = true
    // Reset form / checklist khi đổi phòng hoặc đổi hợp đồng
    setChiTietKiemKe([])
    setGhiChuBienBan('')
    setLoaiBienBan('NHAN_PHONG')
    setThongBao(null)
    setLoi(null)

    void loadData(() => !active)

    return () => {
      active = false
    }
  }, [loadData])

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
    setDangLuu(true)
    setLoi(null)
    setThongBao(null)
    try {
      await themTaiSanPhong(token, phongId, bieuMauTaiSan)
      setThongBao(`Đã thêm thiết bị "${bieuMauTaiSan.tenTaiSan}" vào phòng.`)
      setBieuMauTaiSan({
        tenTaiSan: '',
        loaiTaiSan: 'NỘI THẤT',
        soLuong: 1,
        tinhTrang: 'Tốt',
        giaTriUocTinh: '',
        ghiChu: '',
      })
      await loadData()
    } catch (e: unknown) {
      setLoi(e instanceof Error ? e.message : 'Lỗi thêm tài sản.')
    } finally {
      setDangLuu(false)
    }
  }

  async function handleXoaTaiSan(id: number, ten: string) {
    if (!window.confirm(`Xoá tài sản "${ten}" khỏi danh mục phòng?`)) return
    setDangLuu(true)
    setLoi(null)
    try {
      await xoaTaiSanPhong(token, id)
      setThongBao(`Đã xoá thiết bị "${ten}".`)
      await loadData()
    } catch (e: unknown) {
      setLoi(e instanceof Error ? e.message : 'Lỗi xoá tài sản.')
    } finally {
      setDangLuu(false)
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
      await lapBienBanTaiSan(token, hopDongId, payload)
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
      await loadData()
    } catch (e: unknown) {
      setLoi(e instanceof Error ? e.message : 'Lỗi lập biên bản bàn giao.')
    } finally {
      setDangLuu(false)
    }
  }

  return (
    <section
      data-testid="room-assets-section"
      style={{
        display: 'grid',
        gap: 'var(--ma-space-4)',
        background: 'var(--ma-bg-card)',
        padding: mobile ? 'var(--ma-space-3)' : 'var(--ma-space-5)',
        border: '1px solid var(--ma-border-default)',
        borderRadius: 'var(--ma-radius)',
      }}
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
          <SysLabel>FR-BLD-09 · US-07</SysLabel>
          <h3 style={{ margin: '4px 0 0', font: 'var(--ma-text-task-name)' }}>
            Tiện nghi & Biên bản tài sản {soPhong ? `(Phòng ${soPhong})` : ''}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="button"
            variant={tab === 'DANH_MUC' ? 'primary' : 'secondary'}
            onClick={() => setTab('DANH_MUC')}
          >
            📦 Danh mục ({danhSachTaiSan.length})
          </Button>
          {hopDongId ? (
            <Button
              type="button"
              variant={tab === 'BIEN_BAN' ? 'primary' : 'secondary'}
              onClick={() => {
                setTab('BIEN_BAN')
                chuanBiKiemKe('NHAN_PHONG')
              }}
            >
              📋 Biên bản bàn giao ({danhSachBienBan.length})
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
              ⚡ THÊM NHANH THIẾT BỊ PHỔ BIẾN:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TAI_SAN_MAU.map((m) => (
                <button
                  key={m.ten}
                  type="button"
                  onClick={() => handleChonTaiSanMau(m)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    background: 'var(--ma-bg-sunken)',
                    border: '1px solid var(--ma-border-default)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: 'var(--ma-text-primary)',
                  }}
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
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--ma-ink-900)' }}>
                    <th style={{ padding: '8px 6px' }}>Tên tài sản / Thiết bị</th>
                    <th style={{ padding: '8px 6px' }}>Phân loại</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>SL</th>
                    <th style={{ padding: '8px 6px' }}>Tình trạng</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Giá trị ước tính</th>
                    <th style={{ padding: '8px 6px' }}>Ghi chú</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachTaiSan.map((ts) => (
                    <tr
                      key={ts.id}
                      style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}
                    >
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{ts.tenTaiSan}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            background: 'var(--ma-bg-sunken)',
                            border: '1px solid var(--ma-border-default)',
                          }}
                        >
                          {ts.loaiTaiSan}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>{ts.soLuong}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <StatusTag tone="neutral">{ts.tinhTrang}</StatusTag>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 500 }}>
                        {ts.giaTriUocTinh ? `${dinhDangSoTien(ts.giaTriUocTinh)} ₫` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '8px 6px',
                          color: 'var(--ma-text-secondary)',
                          fontSize: 12,
                        }}
                      >
                        {ts.ghiChu || '—'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <Button
                          variant="secondary"
                          blocked={dangLuu}
                          onClick={() => handleXoaTaiSan(ts.id, ts.tenTaiSan)}
                          style={{ minHeight: 28, padding: '2px 8px', fontSize: 11 }}
                        >
                          Xoá
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form thêm tài sản */}
          <form
            onSubmit={handleThemTaiSan}
            style={{
              padding: 12,
              background: 'var(--ma-bg-sunken)',
              border: '1px solid var(--ma-border-default)',
              borderRadius: 'var(--ma-radius)',
              display: 'grid',
              gap: 10,
            }}
          >
            <strong style={{ fontSize: 13 }}>Khai báo thêm tiện ích / tài sản mới:</strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '1fr' : '2fr 1fr 1fr 1fr',
                gap: 8,
              }}
            >
              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Tên thiết bị *</span>
                <input
                  required
                  style={inputStyle}
                  value={bieuMauTaiSan.tenTaiSan}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, tenTaiSan: e.target.value })
                  }
                  placeholder="Ví dụ: Tủ lạnh Samsung 180L"
                />
              </label>

              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Loại tài sản</span>
                <select
                  style={inputStyle}
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
              </label>

              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Số lượng</span>
                <input
                  type="number"
                  min="1"
                  required
                  style={inputStyle}
                  value={bieuMauTaiSan.soLuong}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, soLuong: Number(e.target.value) || 1 })
                  }
                />
              </label>

              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Tình trạng</span>
                <input
                  style={inputStyle}
                  value={bieuMauTaiSan.tinhTrang}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, tinhTrang: e.target.value })
                  }
                  placeholder="Tốt / Mới 100%"
                />
              </label>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '1fr' : '1fr 2fr auto',
                gap: 8,
                alignItems: 'end',
              }}
            >
              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Giá trị ước tính (₫)</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  style={inputStyle}
                  value={bieuMauTaiSan.giaTriUocTinh}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, giaTriUocTinh: e.target.value })
                  }
                  placeholder="Ví dụ: 3500000"
                />
              </label>

              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Ghi chú</span>
                <input
                  style={inputStyle}
                  value={bieuMauTaiSan.ghiChu}
                  onChange={(e) =>
                    setBieuMauTaiSan({ ...bieuMauTaiSan, ghiChu: e.target.value })
                  }
                  placeholder="Kèm remote, dây nguồn..."
                />
              </label>

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
                📜 Lịch sử biên bản của hợp đồng #{hopDongId}:
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
                            ? 'BÀN GIAO NHẬN PHÒNG'
                            : 'BIÊN BẢN TRẢ PHÒNG'}
                        </StatusTag>
                        <strong>Biên bản #{bb.id}</strong>
                        <span style={{ color: 'var(--ma-text-secondary)', fontSize: 12 }}>
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
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--ma-text-secondary)' }}>
                        Ghi chú: {bb.ghiChuChung}
                      </p>
                    ) : null}

                    {/* Danh sách hạng mục bàn giao */}
                    <div style={{ overflowX: 'auto', marginTop: 4 }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--ma-border-default)' }}>
                            <th style={{ padding: '4px 6px', textAlign: 'left' }}>Tài sản</th>
                            <th style={{ padding: '4px 6px', textAlign: 'center' }}>SL</th>
                            <th style={{ padding: '4px 6px', textAlign: 'left' }}>
                              Tình trạng lúc giao
                            </th>
                            {bb.loaiBienBan === 'TRA_PHONG' && (
                              <>
                                <th style={{ padding: '4px 6px', textAlign: 'left' }}>
                                  Tình trạng lúc trả
                                </th>
                                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Khấu trừ</th>
                                <th style={{ padding: '4px 6px', textAlign: 'left' }}>Lý do</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {bb.chiTiet.map((ct, idx) => (
                            <tr
                              key={ct.id ?? idx}
                              style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}
                            >
                              <td style={{ padding: '4px 6px', fontWeight: 600 }}>
                                {ct.tenTaiSan}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                {ct.soLuong}
                              </td>
                              <td style={{ padding: '4px 6px' }}>
                                {ct.tinhTrangLucGiao || '—'}
                              </td>
                              {bb.loaiBienBan === 'TRA_PHONG' && (
                                <>
                                  <td style={{ padding: '4px 6px' }}>
                                    {ct.tinhTrangLucTra || '—'}
                                  </td>
                                  <td
                                    style={{
                                      padding: '4px 6px',
                                      textAlign: 'right',
                                      color:
                                        Number(ct.tienKhauTru) > 0
                                          ? 'var(--ma-urgent)'
                                          : 'inherit',
                                      fontWeight: Number(ct.tienKhauTru) > 0 ? 600 : 400,
                                    }}
                                  >
                                    {ct.tienKhauTru ? `${dinhDangSoTien(ct.tienKhauTru)} ₫` : '0 ₫'}
                                  </td>
                                  <td style={{ padding: '4px 6px', fontSize: 11 }}>
                                    {ct.lyDoKhauTru || '—'}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
              <strong>✍️ Lập biên bản bàn giao thiết bị phòng #{hopDongId}</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  type="button"
                  variant={loaiBienBan === 'NHAN_PHONG' ? 'primary' : 'secondary'}
                  onClick={() => chuanBiKiemKe('NHAN_PHONG')}
                  style={{ minHeight: 32, fontSize: 12 }}
                >
                  Bàn giao Nhận phòng
                </Button>
                <Button
                  type="button"
                  variant={loaiBienBan === 'TRA_PHONG' ? 'primary' : 'secondary'}
                  onClick={() => chuanBiKiemKe('TRA_PHONG')}
                  style={{ minHeight: 32, fontSize: 12 }}
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
              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Ngày thực hiện</span>
                <input
                  type="date"
                  required
                  style={inputStyle}
                  value={ngayThucHien}
                  onChange={(e) => setNgayThucHien(e.target.value)}
                />
              </label>

              <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                <span>Ghi chú chung biên bản</span>
                <input
                  style={inputStyle}
                  value={ghiChuBienBan}
                  onChange={(e) => setGhiChuBienBan(e.target.value)}
                  placeholder="Biên bản lập có sự chứng kiến của 2 bên..."
                />
              </label>
            </div>

            {/* Bảng checklist kiểm kê */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--ma-ink-900)' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Tài sản</th>
                    <th style={{ padding: '6px', textAlign: 'center', width: 50 }}>SL</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Tình trạng bàn giao</th>
                    {loaiBienBan === 'TRA_PHONG' && (
                      <>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Tình trạng khi trả</th>
                        <th style={{ padding: '6px', textAlign: 'right', width: 110 }}>
                          Khấu trừ (₫)
                        </th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Lý do khấu trừ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chiTietKiemKe.map((ct, idx) => (
                    <tr
                      key={ct.taiSanId || idx}
                      style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}
                    >
                      <td style={{ padding: '6px', fontWeight: 600 }}>{ct.tenTaiSan}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{ct.soLuong}</td>
                      <td style={{ padding: '6px' }}>
                        <input
                          style={{ ...inputStyle, width: '100%' }}
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
                          <td style={{ padding: '6px' }}>
                            <input
                              style={{ ...inputStyle, width: '100%' }}
                              value={ct.tinhTrangLucTra}
                              placeholder="Còn tốt / Bị vỡ / Hỏng..."
                              onChange={(e) => {
                                const clone = [...chiTietKiemKe]
                                clone[idx].tinhTrangLucTra = e.target.value
                                setChiTietKiemKe(clone)
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              style={{ ...inputStyle, width: 100, textAlign: 'right' }}
                              value={ct.tienKhauTru}
                              onChange={(e) => {
                                const clone = [...chiTietKiemKe]
                                clone[idx].tienKhauTru = e.target.value
                                setChiTietKiemKe(clone)
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              style={{ ...inputStyle, width: '100%' }}
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

const inputStyle: CSSProperties = {
  padding: '6px 8px',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontSize: 13,
}
