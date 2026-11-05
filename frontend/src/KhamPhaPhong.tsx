import { useEffect, useId, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import {
  fetchPublicPhong,
  fetchPublicToaNha,
  guiDatLichHen,
  type PublicDichVu,
  type PublicPhong,
  type PublicToaNha,
  type YeuCauDatLichHen,
} from './api'
import { Button } from './design/core/Button'
import { FilterChip } from './design/forms/FilterChip'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'

type Props = {
  onChuyenDangNhap: () => void
  manHinhHep?: boolean
}

const CAC_TIEN_ICH_PHO_BIEN = [
  'Điều hoà',
  'Tủ lạnh',
  'Bình nóng lạnh',
  'Máy giặt',
  'Ban công',
  'Giường nệm',
  'Tủ quần áo',
  'Bếp riêng',
]

function dinhDangTien(soTien: number | string | null | undefined): string {
  if (soTien === null || soTien === undefined) return '0 đ'
  const so = typeof soTien === 'string' ? parseFloat(soTien) : soTien
  if (isNaN(so)) return '0 đ'
  return new Intl.NumberFormat('vi-VN').format(so) + ' đ'
}

export default function KhamPhaPhong({ onChuyenDangNhap, manHinhHep = false }: Props) {
  const [danhSachToaNha, setDanhSachToaNha] = useState<PublicToaNha[]>([])
  const [danhSachPhong, setDanhSachPhong] = useState<PublicPhong[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

  // Bộ lọc
  const [toaNhaIdChon, setToaNhaIdChon] = useState<number | ''>('')
  const [khoangGiaChon, setKhoangGiaChon] = useState<string>('TAT_CA')
  const [tienIchDaChon, setTienIchDaChon] = useState<string[]>([])
  const [tuKhoa, setTuKhoa] = useState<string>('')
  const [chiHienPhongTrong, setChiHienPhongTrong] = useState<boolean>(false)

  // Modal Chi tiết & Biểu phí
  const [phongXemChiTiet, setPhongXemChiTiet] = useState<PublicPhong | null>(null)

  // Modal Đặt lịch hẹn
  const [phongDatLich, setPhongDatLich] = useState<PublicPhong | null>(null)
  const [formLichHen, setFormLichHen] = useState({
    hoTen: '',
    soDienThoai: '',
    email: '',
    thoiGianHen: '',
    ghiChu: '',
  })
  const [dangGuiLich, setDangGuiLich] = useState(false)
  const [thongBaoLich, setThongBaoLich] = useState<{ thanhCong: boolean; message: string; lichHenId?: number } | null>(null)

  const idSelectToa = useId()
  const idSelectGia = useId()
  const idInputTuKhoa = useId()

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    Promise.all([fetchPublicToaNha(), fetchPublicPhong()])
      .then(([toaNhas, phongs]) => {
        if (!mounted) return
        setDanhSachToaNha(toaNhas)
        setDanhSachPhong(phongs)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setLoi(err instanceof Error ? err.message : 'Không thể tải danh sách phòng công khai.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Đặt giá trị mặc định cho ngày hẹn: 09:00 ngày hôm sau
  useEffect(() => {
    if (phongDatLich && !formLichHen.thoiGianHen) {
      const ngayMai = new Date()
      ngayMai.setDate(ngayMai.getDate() + 1)
      ngayMai.setHours(9, 30, 0, 0)
      const pad = (n: number) => String(n).padStart(2, '0')
      const chuoiHen = `${ngayMai.getFullYear()}-${pad(ngayMai.getMonth() + 1)}-${pad(ngayMai.getDate())}T${pad(ngayMai.getHours())}:${pad(ngayMai.getMinutes())}`
      setFormLichHen((f) => ({ ...f, thoiGianHen: chuoiHen }))
    }
  }, [phongDatLich, formLichHen.thoiGianHen])

  function toggleTienIch(tienIch: string) {
    setTienIchDaChon((prev) =>
      prev.includes(tienIch) ? prev.filter((item) => item !== tienIch) : [...prev, tienIch]
    )
  }

  const danhSachLoc = useMemo(() => {
    return danhSachPhong.filter((p) => {
      if (toaNhaIdChon !== '' && p.toaNhaId !== toaNhaIdChon) return false

      if (chiHienPhongTrong && p.trangThai !== 'TRONG') return false

      if (khoangGiaChon === 'DUOI_3_5') {
        if (p.giaThueMacDinh > 3500000) return false
      } else if (khoangGiaChon === '3_5_DEN_5') {
        if (p.giaThueMacDinh < 3500000 || p.giaThueMacDinh > 5000000) return false
      } else if (khoangGiaChon === 'TREN_5') {
        if (p.giaThueMacDinh < 5000000) return false
      }

      if (tienIchDaChon.length > 0) {
        const coDuTienIch = tienIchDaChon.every((ti) =>
          p.tienIch?.some((t) => t.toLowerCase().includes(ti.toLowerCase()))
        )
        if (!coDuTienIch) return false
      }

      if (tuKhoa.trim()) {
        const q = tuKhoa.toLowerCase().trim()
        const hopSoPhong = p.soPhong.toLowerCase().includes(q)
        const hopToaNha = p.tenToaNha.toLowerCase().includes(q)
        const hopDiaChi = p.diaChiToaNha?.toLowerCase().includes(q)
        const hopMoTa = p.moTa?.toLowerCase().includes(q)
        if (!hopSoPhong && !hopToaNha && !hopDiaChi && !hopMoTa) return false
      }

      return true
    })
  }, [danhSachPhong, toaNhaIdChon, chiHienPhongTrong, khoangGiaChon, tienIchDaChon, tuKhoa])

  async function handleGuiLichHen(e: FormEvent) {
    e.preventDefault()
    if (!phongDatLich) return

    setDangGuiLich(true)
    setThongBaoLich(null)

    const yeuCau: YeuCauDatLichHen = {
      hoTen: formLichHen.hoTen.trim(),
      soDienThoai: formLichHen.soDienThoai.trim(),
      email: formLichHen.email.trim() || undefined,
      phongId: phongDatLich.id,
      toaNhaId: phongDatLich.toaNhaId,
      thoiGianHen: formLichHen.thoiGianHen,
      ghiChu: formLichHen.ghiChu.trim() || undefined,
    }

    try {
      const res = await guiDatLichHen(yeuCau)
      setThongBaoLich({
        thanhCong: true,
        message: res.thongBao || 'Đặt lịch hẹn xem phòng thành công!',
        lichHenId: res.lichHenId,
      })
      setFormLichHen({
        hoTen: '',
        soDienThoai: '',
        email: '',
        thoiGianHen: '',
        ghiChu: '',
      })
    } catch (err: unknown) {
      setThongBaoLich({
        thanhCong: false,
        message: err instanceof Error ? err.message : 'Có lỗi khi đặt lịch hẹn. Vui lòng kiểm tra lại thông tin.',
      })
    } finally {
      setDangGuiLich(false)
    }
  }

  const tongSoPhongTrong = danhSachPhong.filter((p) => p.trangThai === 'TRONG').length

  return (
    <div style={styleTrangPortal}>
      {/* Header thanh điều hướng cổng công khai */}
      <header style={styleHeaderPortal}>
        <div style={styleHeaderContainer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-4)' }}>
            <div style={styleLogoHieu}>M</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-2)' }}>
                <SysLabel>CỔNG THÔNG TIN KHÁCH HÀNG</SysLabel>
                <span style={styleTagBadge}>TRỰC TUYẾN</span>
              </div>
              <h1 style={styleBrandTitle}>MiniApart</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
              Đang có <strong>{tongSoPhongTrong}</strong> phòng trống sẵn sàng
            </span>
            <Button variant="primary" onClick={onChuyenDangNhap} data-testid="btn-chuyen-dang-nhap">
              Đăng nhập hệ thống →
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section style={styleHeroBanner}>
        <div style={styleHeroContent}>
          <SysLabel>FR-PUB-01 · MINH BẠCH GIÁ THUÊ & BIỂU PHÍ</SysLabel>
          <h2 style={styleHeroHeading}>
            Tìm Căn Hộ Dịch Vụ & Phòng Trọ Tiện Nghi
          </h2>
          <p style={styleHeroSub}>
            Xem chi tiết phòng trống, bảng giá điện nước niêm yết rõ ràng, không lo chi phí phát sinh ẩn. Đặt lịch xem phòng trực tiếp miễn phí trong 30 giây.
          </p>

          {/* Dải thống kê toà nhà */}
          <div style={styleDaiThongKe}>
            <div style={styleThongKeItem}>
              <span style={styleSoThongKe}>{danhSachToaNha.length}</span>
              <span style={styleChuThongKe}>Toà nhà vận hành</span>
            </div>
            <div style={styleThongKeItem}>
              <span style={styleSoThongKe}>{tongSoPhongTrong}</span>
              <span style={styleChuThongKe}>Phòng trống ở ngay</span>
            </div>
            <div style={styleThongKeItem}>
              <span style={styleSoThongKe}>100%</span>
              <span style={styleChuThongKe}>Minh bạch biểu phí dịch vụ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Khu vực tìm kiếm & Bộ lọc */}
      <section style={styleKhuVucBoLoc}>
        <div style={styleHangBoLoc}>
          {/* Lọc toà nhà */}
          <div style={styleNhomLoc}>
            <label htmlFor={idSelectToa} style={styleLabelLoc}>
              Toà nhà:
            </label>
            <select
              id={idSelectToa}
              style={styleSelect}
              value={toaNhaIdChon}
              onChange={(e) => setToaNhaIdChon(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">-- Tất cả toà nhà ({danhSachToaNha.length}) --</option>
              {danhSachToaNha.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten} ({t.soPhongTrong} phòng trống)
                </option>
              ))}
            </select>
          </div>

          {/* Lọc khoảng giá */}
          <div style={styleNhomLoc}>
            <label htmlFor={idSelectGia} style={styleLabelLoc}>
              Mức giá thuê:
            </label>
            <select
              id={idSelectGia}
              style={styleSelect}
              value={khoangGiaChon}
              onChange={(e) => setKhoangGiaChon(e.target.value)}
            >
              <option value="TAT_CA">Tất cả mức giá</option>
              <option value="DUOI_3_5">Dưới 3.500.000 đ/tháng</option>
              <option value="3_5_DEN_5">Từ 3.500.000 - 5.000.000 đ</option>
              <option value="TREN_5">Trên 5.000.000 đ/tháng</option>
            </select>
          </div>

          {/* Ô tìm kiếm từ khoá */}
          <div style={{ ...styleNhomLoc, flex: 1, minWidth: 200 }}>
            <label htmlFor={idInputTuKhoa} style={styleLabelLoc}>
              Tìm theo số phòng / địa chỉ:
            </label>
            <input
              id={idInputTuKhoa}
              type="text"
              style={styleInputSearch}
              placeholder="Ví dụ: P.101, Hoà Bình, Đống Đa..."
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
            />
          </div>

          {/* Nút chỉ xem phòng trống */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
            <label style={styleCheckboxLabel}>
              <input
                type="checkbox"
                checked={chiHienPhongTrong}
                onChange={(e) => setChiHienPhongTrong(e.target.checked)}
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
              <span>Chỉ phòng trống ở ngay</span>
            </label>
          </div>
        </div>

        {/* Chip lọc tiện ích */}
        <div style={styleHangTienIch}>
          <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)', alignSelf: 'center' }}>
            TIỆN ÍCH TRANG BỊ:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CAC_TIEN_ICH_PHO_BIEN.map((ti) => {
              const active = tienIchDaChon.includes(ti)
              return (
                <button
                  key={ti}
                  type="button"
                  onClick={() => toggleTienIch(ti)}
                  style={{
                    ...styleChipButton,
                    background: active ? 'var(--ma-ink-900)' : 'var(--ma-bg-card)',
                    color: active ? 'var(--ma-text-on-inverse)' : 'var(--ma-text-primary)',
                    borderColor: active ? 'var(--ma-ink-900)' : 'var(--ma-border-dashed)',
                  }}
                >
                  {ti} {active ? '✓' : '+'}
                </button>
              )
            })}
            {tienIchDaChon.length > 0 && (
              <button
                type="button"
                onClick={() => setTienIchDaChon([])}
                style={{ ...styleChipButton, color: 'var(--ma-urgent)', borderColor: 'var(--ma-urgent)' }}
              >
                Xoá bộ lọc tiện ích (bỏ {tienIchDaChon.length})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Kết quả danh sách phòng */}
      <main style={styleDanhSachContainer}>
        <div style={styleKetQuaThanh}>
          <span style={{ fontFamily: 'var(--ma-font-mono)', fontSize: 13, color: 'var(--ma-text-secondary)' }}>
            KẾT QUẢ: <strong>{danhSachLoc.length}</strong> phòng phù hợp
          </span>
          {(toaNhaIdChon !== '' || khoangGiaChon !== 'TAT_CA' || tienIchDaChon.length > 0 || tuKhoa || chiHienPhongTrong) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setToaNhaIdChon('')
                setKhoangGiaChon('TAT_CA')
                setTienIchDaChon([])
                setTuKhoa('')
                setChiHienPhongTrong(false)
              }}
            >
              Đặt lại tất cả bộ lọc
            </Button>
          )}
        </div>

        {dangTai ? (
          <div style={styleKhungThongBao}>
            <p>Đang tải danh mục phòng còn trống…</p>
          </div>
        ) : loi ? (
          <div style={{ ...styleKhungThongBao, borderColor: 'var(--ma-urgent)', color: 'var(--ma-urgent)' }}>
            <p>{loi}</p>
          </div>
        ) : danhSachLoc.length === 0 ? (
          <div style={styleKhungThongBao}>
            <SysLabel>KHÔNG CÓ PHÒNG PHÙ HỢP</SysLabel>
            <h3 style={{ margin: 'var(--ma-space-2) 0', fontSize: 18 }}>Không tìm thấy phòng khớp với bộ lọc hiện tại</h3>
            <p style={{ color: 'var(--ma-text-secondary)', margin: 0 }}>
              Hãy thử bỏ bớt tiện ích lọc hoặc chọn mức giá rộng hơn để xem thêm phòng trống khác.
            </p>
          </div>
        ) : (
          <div style={styleGridPhong}>
            {danhSachLoc.map((phong) => {
              const laTrong = phong.trangThai === 'TRONG'
              const tone = laTrong ? 'done' : phong.trangThai === 'DA_COC' ? 'waiting' : 'neutral'
              const nhanTrangThai = laTrong
                ? 'TRỐNG · Ở NGAY'
                : phong.trangThai === 'DA_COC'
                  ? 'ĐÃ ĐẶT CỌC'
                  : phong.trangThai === 'DANG_THUE'
                    ? 'SẮP TRỐNG'
                    : phong.trangThai

              return (
                <article key={phong.id} style={styleCardPhong} data-testid={`card-phong-${phong.soPhong}`}>
                  {/* Thanh đỉnh thẻ phòng */}
                  <div style={styleCardHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-2)', marginBottom: 4 }}>
                        <span style={styleSoPhongHien}>{phong.soPhong}</span>
                        <StatusTag tone={tone}>{nhanTrangThai}</StatusTag>
                      </div>
                      <div style={styleTenToaNha}>{phong.tenToaNha}</div>
                    </div>
                    <div style={styleGiaThueKhoi}>
                      <span style={styleGiaSo}>{dinhDangTien(phong.giaThueMacDinh)}</span>
                      <span style={styleGiaKy}>/ tháng</span>
                    </div>
                  </div>

                  {/* Địa chỉ toà */}
                  <div style={styleDiaChiHang}>
                    <span style={{ fontFamily: 'var(--ma-font-mono)', fontSize: 11, color: 'var(--ma-text-muted)' }}>📍</span>
                    <span style={styleDiaChiText}>{phong.diaChiToaNha || 'Đang cập nhật địa chỉ'}</span>
                  </div>

                  {/* Thông số kỹ thuật phòng */}
                  <div style={styleThongSoKop}>
                    <div style={styleThongSoCell}>
                      <span style={styleThongSoNhan}>DIỆN TÍCH</span>
                      <span style={styleThongSoGiaTri}>{phong.dienTich} m²</span>
                    </div>
                    <div style={styleThongSoCell}>
                      <span style={styleThongSoNhan}>VỊ TRÍ</span>
                      <span style={styleThongSoGiaTri}>Tầng {phong.tang}</span>
                    </div>
                    <div style={styleThongSoCell}>
                      <span style={styleThongSoNhan}>SỨC CHỨA</span>
                      <span style={styleThongSoGiaTri}>{phong.sucChua} người</span>
                    </div>
                    <div style={styleThongSoCell}>
                      <span style={styleThongSoNhan}>LOẠI PHÒNG</span>
                      <span style={styleThongSoGiaTri}>{phong.loaiPhong || 'Studio'}</span>
                    </div>
                  </div>

                  {/* Mô tả ngắn */}
                  {phong.moTa && (
                    <p style={styleMoTaPhong}>
                      {phong.moTa}
                    </p>
                  )}

                  {/* Danh sách tiện ích có sẵn */}
                  <div style={styleTienIchKhoi}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {phong.tienIch && phong.tienIch.length > 0 ? (
                        phong.tienIch.slice(0, 6).map((ti, idx) => (
                          <span key={idx} style={styleTagTienIch}>
                            {ti}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--ma-text-muted)', fontFamily: 'var(--ma-font-mono)' }}>
                          Đầy đủ tiện ích cơ bản
                        </span>
                      )}
                      {phong.tienIch && phong.tienIch.length > 6 && (
                        <span style={styleTagTienIch}>+{phong.tienIch.length - 6} tiện ích</span>
                      )}
                    </div>
                  </div>

                  {/* Tóm tắt biểu phí dịch vụ */}
                  {phong.danhSachDichVu && phong.danhSachDichVu.length > 0 && (
                    <div style={styleBieuPhiTomTat}>
                      <span style={{ fontSize: 11, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
                        BIỂU PHÍ ĐI KÈM:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12, marginTop: 4 }}>
                        {phong.danhSachDichVu.slice(0, 3).map((dv) => (
                          <span key={dv.id} style={{ color: 'var(--ma-text-secondary)' }}>
                            • {dv.tenDichVu}:{' '}
                            <strong>
                              {dv.cheDoGia === 'BAC_THANG'
                                ? 'Bậc thang'
                                : dv.donGia != null
                                ? dinhDangTien(dv.donGia)
                                : 'Chưa có giá'}
                            </strong>
                            {dv.cheDoGia !== 'BAC_THANG' && dv.donGia != null ? `/${dv.donViTinh}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nút hành động */}
                  <div style={styleCardActions}>
                    <Button
                      variant="secondary"
                      onClick={() => setPhongXemChiTiet(phong)}
                      data-testid={`btn-xem-bieu-phi-${phong.soPhong}`}
                    >
                      Biểu phí & Tiện ích
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setPhongDatLich(phong)
                        setThongBaoLich(null)
                      }}
                      data-testid={`btn-dat-lich-${phong.soPhong}`}
                    >
                      Đặt lịch hẹn xem →
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal 1: Chi tiết phòng & Bảng biểu phí dịch vụ công khai */}
      {phongXemChiTiet && (
        <div style={styleBackdropModal} onClick={() => setPhongXemChiTiet(null)}>
          <div style={styleModalHop} onClick={(e) => e.stopPropagation()}>
            <div style={styleModalHeader}>
              <div>
                <SysLabel>MINH BẠCH CHI PHÍ · TOÀ NHÀ {phongXemChiTiet.tenToaNha}</SysLabel>
                <h3 style={styleModalTitle}>
                  Thông tin phòng {phongXemChiTiet.soPhong}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                  📍 {phongXemChiTiet.diaChiToaNha} (Tầng {phongXemChiTiet.tang} · Diện tích {phongXemChiTiet.dienTich} m²)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhongXemChiTiet(null)}
                style={styleNutDongModal}
                aria-label="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <div style={styleModalBody}>
              {/* Tiền thuê phòng */}
              <div style={styleHopGiaChinh}>
                <div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-text-secondary)' }}>
                    TIỀN THUÊ CỐ ĐỊNH HẰNG THÁNG
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-ink-900)' }}>
                    {dinhDangTien(phongXemChiTiet.giaThueMacDinh)}
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ma-text-secondary)' }}> / tháng</span>
                  </div>
                </div>
                <StatusTag tone={phongXemChiTiet.trangThai === 'TRONG' ? 'done' : 'waiting'}>
                  {phongXemChiTiet.trangThai === 'TRONG' ? 'TRỐNG Ở NGAY' : 'SẮP TRỐNG'}
                </StatusTag>
              </div>

              {/* Bảng biểu phí dịch vụ */}
              <div style={{ marginTop: 'var(--ma-space-4)' }}>
                <h4 style={styleTieuDePhu}>BẢNG BIỂU PHÍ DỊCH VỤ NIÊM YẾT</h4>
                <p style={{ margin: '0 0 var(--ma-space-2)', fontSize: 12, color: 'var(--ma-text-secondary)' }}>
                  Cam kết thu đúng theo đồng hồ công tơ riêng và biểu giá niêm yết của toà nhà, không tự ý tăng giá.
                </p>

                {phongXemChiTiet.danhSachDichVu && phongXemChiTiet.danhSachDichVu.length > 0 ? (
                  <table style={styleBangBieuPhi}>
                    <thead>
                      <tr>
                        <th style={styleTh}>Dịch vụ</th>
                        <th style={styleTh}>Hình thức tính</th>
                        <th style={styleTh}>Đơn giá niêm yết</th>
                        <th style={styleTh}>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phongXemChiTiet.danhSachDichVu.map((dv) => (
                        <tr key={dv.id}>
                          <td style={styleTd}>
                            <strong>{dv.tenDichVu}</strong>
                          </td>
                          <td style={styleTd}>{dv.loaiThu === 'DONG_HO' ? 'Theo chỉ số công tơ' : dv.loaiThu === 'CO_DINH' ? 'Phí cố định/tháng' : dv.loaiThu}</td>
                          <td style={{ ...styleTd, fontFamily: 'var(--ma-font-mono)', fontWeight: 700 }}>
                            {dv.cheDoGia === 'BAC_THANG'
                              ? 'Theo biểu giá bậc thang'
                              : dv.donGia != null
                              ? `${dinhDangTien(dv.donGia)} / ${dv.donViTinh}`
                              : 'Chưa cập nhật'}
                          </td>
                          <td style={{ ...styleTd, color: 'var(--ma-text-secondary)', fontSize: 12 }}>
                            {dv.ghiChu || 'Theo quy định'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--ma-text-secondary)', fontStyle: 'italic' }}>
                    Chưa cập nhật bảng biểu phí cụ thể cho toà nhà này.
                  </p>
                )}
              </div>

              {/* Tiện ích phòng */}
              <div style={{ marginTop: 'var(--ma-space-5)' }}>
                <h4 style={styleTieuDePhu}>TIỆN ÍCH & TRANG THIẾT BỊ SẴN CÓ TRONG PHÒNG</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--ma-space-2)' }}>
                  {phongXemChiTiet.tienIch && phongXemChiTiet.tienIch.length > 0 ? (
                    phongXemChiTiet.tienIch.map((ti, idx) => (
                      <span key={idx} style={styleTagTienIchLon}>
                        ✓ {ti}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Trang bị cơ bản</span>
                  )}
                </div>
              </div>

              {/* Mô tả chi tiết */}
              {phongXemChiTiet.moTa && (
                <div style={{ marginTop: 'var(--ma-space-5)' }}>
                  <h4 style={styleTieuDePhu}>MÔ TẢ CHI TIẾT</h4>
                  <p style={{ margin: 'var(--ma-space-2) 0 0', lineHeight: 1.6, fontSize: 14 }}>
                    {phongXemChiTiet.moTa}
                  </p>
                </div>
              )}
            </div>

            <div style={styleModalFooter}>
              <Button variant="secondary" onClick={() => setPhongXemChiTiet(null)}>
                Đóng lại
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setPhongDatLich(phongXemChiTiet)
                  setPhongXemChiTiet(null)
                  setThongBaoLich(null)
                }}
              >
                Đặt lịch hẹn xem phòng này →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Đặt lịch hẹn xem phòng */}
      {phongDatLich && (
        <div style={styleBackdropModal} onClick={() => setPhongDatLich(null)}>
          <div style={styleModalHop} onClick={(e) => e.stopPropagation()}>
            <div style={styleModalHeader}>
              <div>
                <SysLabel>ĐẶT LỊCH HẸN TRỰC TUYẾN</SysLabel>
                <h3 style={styleModalTitle}>
                  Hẹn xem phòng {phongDatLich.soPhong} - {phongDatLich.tenToaNha}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                  📍 {phongDatLich.diaChiToaNha}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhongDatLich(null)}
                style={styleNutDongModal}
                aria-label="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {thongBaoLich && thongBaoLich.thanhCong ? (
              <div style={styleModalBody}>
                <div style={styleHopThanhCong}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <SysLabel>YÊU CẦU ĐÃ ĐƯỢC TIẾP NHẬN</SysLabel>
                  <h3 style={{ margin: '8px 0', fontSize: 18, color: 'var(--ma-done-text)' }}>
                    Đặt lịch xem phòng thành công!
                  </h3>
                  {thongBaoLich.lichHenId && (
                    <p style={{ fontFamily: 'var(--ma-font-mono)', fontSize: 13, margin: '4px 0' }}>
                      Mã lịch hẹn: <strong>#{thongBaoLich.lichHenId}</strong>
                    </p>
                  )}
                  <p style={{ margin: '12px 0 0', lineHeight: 1.6, fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                    {thongBaoLich.message}
                  </p>
                </div>
                <div style={{ marginTop: 'var(--ma-space-6)', display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setPhongDatLich(null)
                      setThongBaoLich(null)
                    }}
                  >
                    Đã hiểu & Hoàn tất
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGuiLichHen}>
                <div style={styleModalBody}>
                  {thongBaoLich && !thongBaoLich.thanhCong && (
                    <div style={styleLoiForm}>
                      {thongBaoLich.message}
                    </div>
                  )}

                  <div style={styleFormLichGrid}>
                    <div style={styleNhanTruong}>
                      <label style={styleLabelForm}>
                        Họ và tên của bạn <span style={{ color: 'var(--ma-urgent)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        style={styleInputForm}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        value={formLichHen.hoTen}
                        onChange={(e) => setFormLichHen({ ...formLichHen, hoTen: e.target.value })}
                      />
                    </div>

                    <div style={styleNhanTruong}>
                      <label style={styleLabelForm}>
                        Số điện thoại liên hệ <span style={{ color: 'var(--ma-urgent)' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="^[0-9]{10}$"
                        title="Số điện thoại gồm đúng 10 chữ số"
                        style={styleInputForm}
                        placeholder="Ví dụ: 0912345678"
                        value={formLichHen.soDienThoai}
                        onChange={(e) => setFormLichHen({ ...formLichHen, soDienThoai: e.target.value })}
                      />
                      <span style={{ fontSize: 11, color: 'var(--ma-text-muted)', fontFamily: 'var(--ma-font-mono)' }}>
                        Quản lý toà nhà sẽ gọi xác nhận qua số này
                      </span>
                    </div>

                    <div style={styleNhanTruong}>
                      <label style={styleLabelForm}>Email nhận thông tin xác nhận (tuỳ chọn)</label>
                      <input
                        type="email"
                        style={styleInputForm}
                        placeholder="nguyenan@example.com"
                        value={formLichHen.email}
                        onChange={(e) => setFormLichHen({ ...formLichHen, email: e.target.value })}
                      />
                    </div>

                    <div style={styleNhanTruong}>
                      <label style={styleLabelForm}>
                        Thời gian bạn muốn đến xem phòng <span style={{ color: 'var(--ma-urgent)' }}>*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        style={styleInputForm}
                        value={formLichHen.thoiGianHen}
                        onChange={(e) => setFormLichHen({ ...formLichHen, thoiGianHen: e.target.value })}
                      />
                    </div>

                    <div style={styleNhanTruong}>
                      <label style={styleLabelForm}>Ghi chú thêm cho quản lý toà nhà</label>
                      <textarea
                        rows={3}
                        style={styleTextareaForm}
                        placeholder="Ví dụ: Tôi muốn hỏi thêm về chỗ để xe máy, có thể chuyển vào ở từ đầu tháng tới..."
                        value={formLichHen.ghiChu}
                        onChange={(e) => setFormLichHen({ ...formLichHen, ghiChu: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={styleModalFooter}>
                  <Button variant="secondary" type="button" onClick={() => setPhongDatLich(null)}>
                    Huỷ bỏ
                  </Button>
                  <Button variant="primary" type="submit" blocked={dangGuiLich}>
                    {dangGuiLich ? 'Đang gửi yêu cầu…' : 'Xác nhận gửi lịch hẹn →'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------- Modern PropTech SaaS Styles -----------------

const styleTrangPortal: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--ma-bg-page)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  display: 'flex',
  flexDirection: 'column',
}

const styleHeaderPortal: CSSProperties = {
  borderBottom: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
  position: 'sticky',
  top: 0,
  zIndex: 30,
  boxShadow: 'var(--ma-shadow-sm)',
}

const styleHeaderContainer: CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: 'var(--ma-space-3) var(--ma-space-6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-4)',
}

const styleLogoHieu: CSSProperties = {
  width: 44,
  height: 44,
  background: 'var(--ma-ink-900)',
  color: 'var(--ma-text-on-inverse)',
  fontFamily: 'var(--ma-font-mono)',
  fontWeight: 800,
  fontSize: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-sm)',
  border: '1px solid var(--ma-border-inverse)',
}

const styleBrandTitle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: 'var(--ma-text-primary)',
}

const styleTagBadge: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  background: 'var(--ma-done-bg)',
  color: 'var(--ma-done-text)',
  letterSpacing: '0.05em',
  borderRadius: 'var(--ma-radius-pill)',
}

const styleHeroBanner: CSSProperties = {
  background: 'radial-gradient(ellipse at 80% 20%, rgba(13, 148, 136, 0.22) 0%, rgba(15, 23, 42, 0) 70%), var(--ma-ink-900)',
  color: 'var(--ma-text-on-inverse)',
  borderBottom: '1px solid var(--ma-line-200)',
  padding: 'clamp(36px, 6vw, 68px) var(--ma-space-6) clamp(48px, 8vw, 84px)',
}

const styleHeroContent: CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
}

const styleHeroHeading: CSSProperties = {
  margin: 'var(--ma-space-3) 0 var(--ma-space-2)',
  fontSize: 'clamp(28px, 4.5vw, 44px)',
  letterSpacing: 'var(--ma-tracking-title)',
  fontWeight: 800,
  lineHeight: 1.2,
  color: 'var(--ma-text-on-inverse)',
}

const styleHeroSub: CSSProperties = {
  margin: 0,
  maxWidth: 720,
  fontSize: 'clamp(14px, 2vw, 16px)',
  color: 'var(--ma-text-secondary-on-inverse)',
  lineHeight: 1.6,
}

const styleDaiThongKe: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-4)',
  marginTop: 'var(--ma-space-6)',
  paddingTop: 'var(--ma-space-4)',
}

const styleThongKeItem: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  background: 'rgba(255, 255, 255, 0.07)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 'var(--ma-radius-md)',
  padding: '10px 20px',
}

const styleSoThongKe: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 28,
  fontWeight: 800,
  color: 'var(--ma-text-on-inverse)',
}

const styleChuThongKe: CSSProperties = {
  fontSize: 12,
  fontFamily: 'var(--ma-font-mono)',
  color: 'var(--ma-text-secondary-on-inverse)',
}

const styleKhuVucBoLoc: CSSProperties = {
  maxWidth: 1200,
  width: '100%',
  margin: '-32px auto 0',
  padding: 'var(--ma-space-5) var(--ma-space-6)',
  display: 'grid',
  gap: 'var(--ma-space-4)',
  background: 'var(--ma-bg-card)',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-md)',
  border: '1px solid var(--ma-border-default)',
  position: 'relative',
  zIndex: 10,
}

const styleHangBoLoc: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-4)',
  alignItems: 'flex-start',
}

const styleNhomLoc: CSSProperties = {
  display: 'grid',
  gap: 6,
}

const styleLabelLoc: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--ma-text-secondary)',
  letterSpacing: '0.04em',
}

const styleSelect: CSSProperties = {
  minHeight: 42,
  padding: '8px 14px',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-page)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13,
  borderRadius: 'var(--ma-radius)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
}

const styleInputSearch: CSSProperties = {
  minHeight: 42,
  padding: '8px 14px',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-page)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13,
  borderRadius: 'var(--ma-radius)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
}

const styleCheckboxLabel: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  cursor: 'pointer',
  minHeight: 42,
  userSelect: 'none',
  fontWeight: 500,
}

const styleHangTienIch: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-2)',
  paddingTop: 'var(--ma-space-3)',
  borderTop: '1px dashed var(--ma-border-dashed)',
}

const styleChipButton: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 11,
  padding: '5px 12px',
  border: '1px solid var(--ma-border-default)',
  cursor: 'pointer',
  borderRadius: 'var(--ma-radius-pill)',
  transition: 'all 0.15s ease',
}

const styleDanhSachContainer: CSSProperties = {
  maxWidth: 1200,
  width: '100%',
  margin: 'var(--ma-space-6) auto 0',
  padding: '0 var(--ma-space-6) var(--ma-space-8)',
  flex: 1,
}

const styleKetQuaThanh: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 'var(--ma-space-4)',
  borderBottom: '1px solid var(--ma-border-default)',
  marginBottom: 'var(--ma-space-6)',
}

const styleKhungThongBao: CSSProperties = {
  border: '1px dashed var(--ma-border-dashed)',
  background: 'var(--ma-bg-card)',
  borderRadius: 'var(--ma-radius-md)',
  padding: 'var(--ma-space-8)',
  textAlign: 'center',
}

const styleGridPhong: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: 'var(--ma-space-6)',
}

const styleCardPhong: CSSProperties = {
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius-md)',
  background: 'var(--ma-bg-card)',
  boxShadow: 'var(--ma-shadow-sm)',
  padding: 'var(--ma-space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ma-space-3)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
}

const styleCardHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 'var(--ma-space-3)',
}

const styleSoPhongHien: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--ma-text-primary)',
}

const styleTenToaNha: CSSProperties = {
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ma-text-secondary)',
}

const styleGiaThueKhoi: CSSProperties = {
  textAlign: 'right',
  display: 'flex',
  flexDirection: 'column',
}

const styleGiaSo: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 20,
  fontWeight: 800,
  color: 'var(--ma-green-700)',
}

const styleGiaKy: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 11,
  color: 'var(--ma-text-muted)',
}

const styleDiaChiHang: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
  fontSize: 12,
  color: 'var(--ma-text-secondary)',
}

const styleDiaChiText: CSSProperties = {
  lineHeight: 1.4,
}

const styleThongSoKop: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  background: 'var(--ma-bg-sunken)',
  border: '1px solid var(--ma-border-subtle)',
  borderRadius: 'var(--ma-radius)',
  padding: '8px 12px',
  gap: 4,
}

const styleThongSoCell: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const styleThongSoNhan: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 9,
  letterSpacing: '0.06em',
  color: 'var(--ma-text-muted)',
}

const styleThongSoGiaTri: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--ma-text-primary)',
}

const styleMoTaPhong: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'var(--ma-text-secondary)',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const styleTienIchKhoi: CSSProperties = {
  marginTop: 2,
}

const styleTagTienIch: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 10,
  padding: '3px 8px',
  background: 'var(--ma-brand-accent-light)',
  border: '1px solid var(--ma-brand-accent)',
  borderRadius: 'var(--ma-radius-pill)',
  color: 'var(--ma-brand-accent-hover)',
  fontWeight: 600,
}

const styleTagTienIchLon: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 12,
  padding: '5px 12px',
  background: 'var(--ma-brand-accent-light)',
  border: '1px solid var(--ma-brand-accent)',
  borderRadius: 'var(--ma-radius-pill)',
  color: 'var(--ma-brand-accent-hover)',
  fontWeight: 600,
}

const styleBieuPhiTomTat: CSSProperties = {
  paddingTop: 'var(--ma-space-3)',
  borderTop: '1px dashed var(--ma-border-dashed)',
}

const styleCardActions: CSSProperties = {
  marginTop: 'auto',
  paddingTop: 'var(--ma-space-3)',
  display: 'grid',
  gridTemplateColumns: '1fr 1.2fr',
  gap: 'var(--ma-space-2)',
}

// Modal styles
const styleBackdropModal: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.72)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 'var(--ma-space-4)',
}

const styleModalHop: CSSProperties = {
  background: 'var(--ma-bg-card)',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-frame)',
  border: '1px solid var(--ma-border-default)',
  width: '100%',
  maxWidth: 620,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const styleModalHeader: CSSProperties = {
  padding: 'var(--ma-space-5)',
  borderBottom: '1px solid var(--ma-border-default)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 'var(--ma-space-3)',
}

const styleModalTitle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: 'var(--ma-tracking-title)',
  color: 'var(--ma-text-primary)',
}

const styleNutDongModal: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  padding: '4px 8px',
  color: 'var(--ma-text-secondary)',
  borderRadius: '6px',
}

const styleModalBody: CSSProperties = {
  padding: 'var(--ma-space-5)',
  overflowY: 'auto',
  flex: 1,
}

const styleModalFooter: CSSProperties = {
  padding: 'var(--ma-space-4) var(--ma-space-5)',
  borderTop: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-page)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--ma-space-3)',
}

const styleHopGiaChinh: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'var(--ma-space-4)',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-sunken)',
  borderRadius: 'var(--ma-radius)',
}

const styleTieuDePhu: CSSProperties = {
  margin: '0 0 var(--ma-space-2)',
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--ma-ink-900)',
}

const styleBangBieuPhi: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
}

const styleTh: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid var(--ma-border-default)',
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 11,
  color: 'var(--ma-text-secondary)',
  letterSpacing: '0.04em',
  fontWeight: 700,
}

const styleTd: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--ma-border-subtle)',
}

const styleFormLichGrid: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-4)',
}

const styleNhanTruong: CSSProperties = {
  display: 'grid',
  gap: 4,
}

const styleLabelForm: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ma-text-primary)',
}

const styleInputForm: CSSProperties = {
  minHeight: 42,
  padding: '8px 14px',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13,
  borderRadius: 'var(--ma-radius)',
  outline: 'none',
}

const styleTextareaForm: CSSProperties = {
  padding: '8px 14px',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13,
  borderRadius: 'var(--ma-radius)',
  resize: 'vertical',
  outline: 'none',
}

const styleHopThanhCong: CSSProperties = {
  border: '1px solid var(--ma-done)',
  background: 'var(--ma-done-bg)',
  borderRadius: 'var(--ma-radius-md)',
  padding: 'var(--ma-space-6)',
  textAlign: 'center',
}

const styleLoiForm: CSSProperties = {
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  background: 'var(--ma-urgent-bg)',
  color: 'var(--ma-urgent)',
  border: '1px solid var(--ma-urgent)',
  borderRadius: 'var(--ma-radius)',
  fontSize: 13,
  marginBottom: 'var(--ma-space-4)',
}