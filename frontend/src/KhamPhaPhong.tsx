import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
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
import { Icon } from './design/core/Icon'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { hasAllAmenities } from './roomAmenities'

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

export function anhXaTrangThaiPhong(trangThai: string): { label: string; tone: 'done' | 'waiting' | 'neutral' | 'urgent' } {
  switch (trangThai) {
    case 'TRONG':
      return { label: 'Còn trống', tone: 'done' }
    case 'DA_COC':
      return { label: 'Đã đặt cọc', tone: 'waiting' }
    case 'DANG_THUE':
      return { label: 'Đang thuê', tone: 'neutral' }
    case 'DANG_SUA':
    case 'DANG_SUA_CHUA':
      return { label: 'Đang sửa chữa', tone: 'urgent' }
    default:
      return { label: trangThai || 'Không xác định', tone: 'neutral' }
  }
}

export function layHinhAnhPhong(tenToaNha?: string, loaiPhong?: string, soPhong?: string): string {
  const toa = (tenToaNha || '').toLowerCase()
  const loai = (loaiPhong || '').toLowerCase()

  if (toa.includes('an nhiên')) {
    if (loai.includes('ban công')) return '/rooms/annhien_studio_ban_cong.webp'
    if (loai.includes('gác')) return '/rooms/annhien_gac_xep.webp'
    if (loai.includes('nội thất')) return '/rooms/annhien_studio_noi_that.webp'
    return '/rooms/annhien_co_ban.webp'
  }
  if (toa.includes('nhà xanh')) {
    if (loai.includes('gác')) return '/rooms/nhaxanh_phong_gac.webp'
    if (loai.includes('studio') || loai.includes('nội thất')) return '/rooms/nhaxanh_studio_gon.webp'
    return '/rooms/nhaxanh_co_ban.webp'
  }
  if (toa.includes('mộc lan')) {
    if (loai.includes('ban công')) return '/rooms/moclan_ban_cong.webp'
    if (loai.includes('gác')) return '/rooms/moclan_gac_xep.webp'
    if (loai.includes('studio') || loai.includes('nội thất')) return '/rooms/moclan_studio_go.webp'
    return '/rooms/moclan_co_ban.webp'
  }
  if (toa.includes('phố nhỏ')) {
    if (loai.includes('bếp') || loai.includes('studio')) return '/rooms/phonho_studio_bep.webp'
    if (loai.includes('nội thất')) return '/rooms/phonho_studio_gon.webp'
    return '/rooms/phonho_co_ban.webp'
  }
  if (toa.includes('bình minh')) {
    if (loai.includes('ban công')) return '/rooms/binhminh_ban_cong.webp'
    if (loai.includes('cửa sổ') || loai.includes('thoáng')) return '/rooms/binhminh_cua_so_lon.webp'
    if (loai.includes('studio') || loai.includes('nội thất')) return '/rooms/binhminh_studio_thoang.webp'
    return '/rooms/binhminh_co_ban.webp'
  }
  if (toa.includes('vườn nắng')) {
    if (loai.includes('ban công')) return '/rooms/vuonnang_ban_cong.webp'
    if (loai.includes('cây xanh') || loai.includes('thoáng')) return '/rooms/vuonnang_cay_xanh.webp'
    return '/rooms/vuonnang_studio_nang.webp'
  }

  return '/rooms/annhien_studio_ban_cong.webp'
}

export function HinhAnhPhong({
  anhDaiDien,
  tenToaNha,
  loaiPhong,
  soPhong,
  chieuCao = 160,
  style,
  className,
}: {
  anhDaiDien?: string | null
  tenToaNha?: string
  loaiPhong?: string
  soPhong?: string
  chieuCao?: number | string
  style?: CSSProperties
  className?: string
}): React.ReactElement {
  const anhMinhHoa = useMemo(
    () => layHinhAnhPhong(tenToaNha, loaiPhong, soPhong),
    [tenToaNha, loaiPhong, soPhong],
  )
  const coAnhApiBanDau = Boolean(anhDaiDien && anhDaiDien.trim())
  const [nguonAnh, setNguonAnh] = useState(() => (coAnhApiBanDau ? anhDaiDien!.trim() : anhMinhHoa))
  const [laAnhMinhHoa, setLaAnhMinhHoa] = useState(!coAnhApiBanDau)

  useEffect(() => {
    if (anhDaiDien && anhDaiDien.trim()) {
      setNguonAnh(anhDaiDien.trim())
      setLaAnhMinhHoa(false)
    } else {
      setNguonAnh(anhMinhHoa)
      setLaAnhMinhHoa(true)
    }
  }, [anhDaiDien, anhMinhHoa])

  function xuLyLoiTaiAnh() {
    if (!laAnhMinhHoa) {
      setNguonAnh(anhMinhHoa)
      setLaAnhMinhHoa(true)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: chieuCao,
        borderRadius: 'var(--ma-radius)',
        overflow: 'hidden',
        background: 'var(--ma-bg-sunken)',
        position: 'relative',
        ...style,
      }}
      className={className}
    >
      <img
        src={nguonAnh}
        alt={`Ảnh phòng ${soPhong || ''} - ${tenToaNha || ''}`}
        loading="lazy"
        onError={xuLyLoiTaiAnh}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <span
        data-testid="badge-nguon-anh"
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: 'var(--ma-bg-card)',
          color: 'var(--ma-text-secondary)',
          font: 'var(--ma-text-badge)',
          padding: '3px 10px',
          borderRadius: 'var(--ma-radius-pill)',
        }}
      >
        {laAnhMinhHoa ? 'Ảnh minh hoạ' : loaiPhong || 'Ảnh phòng'}
      </span>
    </div>
  )
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
  const [loaiPhongChon, setLoaiPhongChon] = useState('')
  const [soHienThi, setSoHienThi] = useState(12)
  const ketQuaRef = useRef<HTMLElement>(null)

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
  const idSelectLoai = useId()

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

  const danhSachTheoBoLocChung = useMemo(() => {
    return danhSachPhong.filter((p) => {
      if (toaNhaIdChon !== '' && p.toaNhaId !== toaNhaIdChon) return false

      if (chiHienPhongTrong && p.trangThai !== 'TRONG') return false

      if (loaiPhongChon && p.loaiPhong !== loaiPhongChon) return false

      if (khoangGiaChon === 'DUOI_3_5') {
        if (p.giaThueMacDinh > 3500000) return false
      } else if (khoangGiaChon === '3_5_DEN_5') {
        if (p.giaThueMacDinh < 3500000 || p.giaThueMacDinh > 5000000) return false
      } else if (khoangGiaChon === 'TREN_5') {
        if (p.giaThueMacDinh < 5000000) return false
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
  }, [danhSachPhong, toaNhaIdChon, chiHienPhongTrong, khoangGiaChon, tuKhoa, loaiPhongChon])

  const danhSachLoc = useMemo(
    () => danhSachTheoBoLocChung.filter((phong) => hasAllAmenities(phong.tienIch, tienIchDaChon)),
    [danhSachTheoBoLocChung, tienIchDaChon],
  )

  const soPhongTheoTienIch = useMemo(() => new Map(CAC_TIEN_ICH_PHO_BIEN.map((ti) => {
    const required = [...tienIchDaChon.filter((value) => value !== ti), ti]
    return [ti, danhSachTheoBoLocChung.filter((phong) => hasAllAmenities(phong.tienIch, required)).length]
  })), [danhSachTheoBoLocChung, tienIchDaChon])

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

  const tatCaToaNha = danhSachToaNha.length
  const cacLoaiPhong = [...new Set(danhSachPhong.map((p) => p.loaiPhong).filter((v): v is string => Boolean(v)))].sort()
  const coBoLoc = toaNhaIdChon !== '' || khoangGiaChon !== 'TAT_CA' || tienIchDaChon.length > 0 || Boolean(tuKhoa) || chiHienPhongTrong || loaiPhongChon !== ''
  const danhSachSapXep = [...danhSachLoc].sort((a, b) => Number(b.trangThai === 'TRONG') - Number(a.trangThai === 'TRONG') || a.giaThueMacDinh - b.giaThueMacDinh)
  const soPhongTrongTrongKetQua = danhSachLoc.filter((p) => p.trangThai === 'TRONG').length
  function datLaiBoLoc() {
    setToaNhaIdChon('')
    setKhoangGiaChon('TAT_CA')
    setTienIchDaChon([])
    setTuKhoa('')
    setChiHienPhongTrong(false)
    setLoaiPhongChon('')
  }

  return (
    <div style={styleTrangPortal}>
      <div style={{ maxWidth: 1408, margin: '0 auto', padding: manHinhHep ? '0 16px 32px' : '0 16px 48px', display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo" aria-hidden="true">M</div>
            <span style={{ font: 'var(--ma-text-body)', fontWeight: 700 }}>MiniApart</span>
          </div>
          <Button variant="secondary" onClick={onChuyenDangNhap} data-testid="btn-chuyen-dang-nhap">
            Đăng nhập
          </Button>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: manHinhHep ? 'minmax(0, 1fr)' : 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 16 }}>
          <div className="card" style={{ padding: manHinhHep ? '24px 20px' : '48px 40px', gap: 16, justifyContent: 'center' }}>
            <h1 className="h1" style={{ margin: 0, fontSize: manHinhHep ? 28 : 40, lineHeight: 1.1 }}>Phòng trống, giá rõ từng khoản điện nước</h1>
            <p style={{ ...styleHeroSub, margin: 0 }}>
              {tongSoPhongTrong} phòng đang trống ở {tatCaToaNha} toà nhà. Xem đơn giá điện, nước, dịch vụ trước khi đến xem phòng.
            </p>
            <p className="t-meta" style={{ margin: 0 }}>
              Toà nhà vận hành <strong>{tatCaToaNha}</strong> · Phòng đang quản lý <strong>{danhSachPhong.length}</strong>
            </p>
            <div style={{ ...styleKhuVucBoLoc, gridTemplateColumns: manHinhHep ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div className="field">
                <label className="label" htmlFor={idSelectToa}>Khu vực (toà nhà)</label>
                <select id={idSelectToa} className="select" value={toaNhaIdChon} onChange={(e) => setToaNhaIdChon(e.target.value === '' ? '' : Number(e.target.value))}>
                  <option value="">Tất cả toà nhà</option>
                  {danhSachToaNha.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ten} ({t.soPhongTrong} phòng trống)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor={idSelectGia}>Mức giá thuê</label>
                <select id={idSelectGia} className="select" value={khoangGiaChon} onChange={(e) => setKhoangGiaChon(e.target.value)}>
                  <option value="TAT_CA">Tất cả mức giá</option>
                  <option value="DUOI_3_5">Dưới 3.500.000 đ/tháng</option>
                  <option value="3_5_DEN_5">Từ 3.500.000 - 5.000.000 đ</option>
                  <option value="TREN_5">Trên 5.000.000 đ/tháng</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor={idSelectLoai}>Loại phòng</label>
                <select id={idSelectLoai} className="select" value={loaiPhongChon} onChange={(e) => setLoaiPhongChon(e.target.value)}>
                  <option value="">Tất cả</option>
                  {cacLoaiPhong.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor={idInputTuKhoa}>Số phòng / địa chỉ</label>
                <input id={idInputTuKhoa} type="text" className="input" placeholder="Ví dụ: 401, Duy Tân" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={() => ketQuaRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })}>
                  <Icon name="search" />Tìm phòng
                </Button>
              </div>
            </div>
          </div>

          {!manHinhHep && (
            <figure style={{ position: 'relative', margin: 0, borderRadius: 'var(--ma-radius-xl)', overflow: 'hidden', minHeight: 360 }}>
              <img src="/rooms/annhien_studio_ban_cong.webp" alt="Không gian căn hộ mẫu MiniApart" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <figcaption style={{ position: 'absolute', left: 16, bottom: 16 }}>
                <span className="tag tag-neutral" style={{ background: 'var(--ma-bg-card)' }}>
                  <Icon name="image" size="sm" />Ảnh minh hoạ không gian căn hộ
                </span>
              </figcaption>
            </figure>
          )}
        </section>

        <main ref={ketQuaRef} style={{ display: 'grid', gap: 16, scrollMarginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>{danhSachLoc.length} phòng phù hợp</h2>
              <p className="t-meta" style={{ margin: '2px 0 0' }}>
                {soPhongTrongTrongKetQua} còn trống · Phòng trống trước, giá thấp đến cao · cập nhật {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
            {coBoLoc && (
              <Button variant="secondary" size="sm" onClick={datLaiBoLoc}>
                Đặt lại tất cả bộ lọc
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <FilterChip active={chiHienPhongTrong} count={tongSoPhongTrong} onClick={() => setChiHienPhongTrong((v) => !v)}>Còn trống</FilterChip>
            {CAC_TIEN_ICH_PHO_BIEN.map((ti) => {
              const active = tienIchDaChon.includes(ti)
              const count = soPhongTheoTienIch.get(ti) ?? 0
              const disabled = !active && count === 0
              return (
                <FilterChip
                  key={ti}
                  active={active}
                  count={count}
                  aria-label={`${ti} (${count} phòng)`}
                  {...{ disabled }}
                  style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                  onClick={() => toggleTienIch(ti)}
                >
                  {ti}
                </FilterChip>
              )
            })}
            {tienIchDaChon.length > 0 && (
              <Button variant="text" size="sm" onClick={() => setTienIchDaChon([])} style={{ color: 'var(--ma-urgent)' }}>
                Xoá bộ lọc tiện ích (bỏ {tienIchDaChon.length})
              </Button>
            )}
          </div>

          {dangTai ? (
            <EmptyState kind="loading" title="Đang tải danh mục phòng còn trống…" />
          ) : loi ? (
            <EmptyState kind="error" title="Chưa tải được danh sách phòng" body={loi} />
          ) : danhSachLoc.length === 0 ? (
            <EmptyState
              kind="filtered"
              title="Không tìm thấy phòng khớp với bộ lọc hiện tại"
              body="Hãy thử bỏ bớt tiện ích lọc hoặc chọn mức giá rộng hơn để xem thêm phòng trống khác."
              actionLabel="Đặt lại tất cả bộ lọc"
              onAction={datLaiBoLoc}
            />
          ) : (
            <>
              <div style={styleGridPhong}>
                {danhSachSapXep.slice(0, soHienThi).map((phong) => {
                  const { label: nhanTrangThai, tone } = anhXaTrangThaiPhong(phong.trangThai)
                  const dichVuTomTat = (phong.danhSachDichVu ?? []).slice(0, 2).map((dv) => `${dv.tenDichVu} ${dv.cheDoGia === 'BAC_THANG' ? 'bậc thang' : dv.donGia != null ? `${dinhDangTien(dv.donGia)}/${dv.donViTinh}` : 'chưa có giá'}`).join(' · ')
                  const diaChi = phong.diaChiToaNha || 'Đang cập nhật địa chỉ'

                  return (
                    <article key={phong.id} style={styleCardPhong} data-testid={`card-phong-${phong.soPhong}`}>
                      <div style={{ position: 'relative' }}>
                        <HinhAnhPhong anhDaiDien={phong.anhDaiDien} tenToaNha={phong.tenToaNha} loaiPhong={phong.loaiPhong} soPhong={phong.soPhong} chieuCao={190} style={{ borderRadius: 16 }} />
                        <StatusTag tone={tone} style={{ position: 'absolute', top: 8, left: 8, background: 'var(--ma-bg-card)' }}>{nhanTrangThai}</StatusTag>
                      </div>
                      <div style={{ display: 'grid', gap: 6, padding: '4px 6px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ font: 'var(--ma-text-figure)' }}>{dinhDangTien(phong.giaThueMacDinh)}</span>
                            <span className="t-meta"> /tháng</span>
                          </div>
                        </div>
                        <div style={styleTruncate} title={`${phong.tenToaNha} · Phòng ${phong.soPhong}`}>
                          <strong style={{ font: 'var(--ma-text-task-name)' }}>{phong.tenToaNha} · Phòng {phong.soPhong}</strong>
                        </div>
                        <div className="t-sm" style={{ ...styleTruncate, color: 'var(--ma-text-secondary)' }} title={`${phong.loaiPhong || 'Studio'} · ${phong.dienTich} m² · Tầng ${phong.tang} · ${phong.sucChua} người`}>
                          {phong.loaiPhong || 'Studio'} · {phong.dienTich} m² · Tầng {phong.tang} · {phong.sucChua} người
                        </div>
                        <div className="t-sm" style={{ ...styleTruncate, color: 'var(--ma-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }} title={diaChi}>
                          <Icon name="pin" size="sm" />
                          <span style={styleTruncate}>{diaChi}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {phong.tienIch && phong.tienIch.length > 0 ? (
                            <>
                              {phong.tienIch.slice(0, 3).map((ti, idx) => <span key={idx} className="tag tag-neutral">{ti}</span>)}
                              {phong.tienIch.length > 3 && <span className="tag tag-neutral">+{phong.tienIch.length - 3}</span>}
                            </>
                          ) : (
                            <span className="t-meta">Đầy đủ tiện ích cơ bản</span>
                          )}
                        </div>
                        {dichVuTomTat && <div className="t-meta" style={styleTruncate} title={dichVuTomTat}>{dichVuTomTat}</div>}
                      </div>
                      <div style={styleCardActions}>
                        <Button
                          variant="secondary"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            setPhongDatLich(phong)
                            setThongBaoLich(null)
                          }}
                          data-testid={`btn-dat-lich-${phong.soPhong}`}
                        >
                          Đặt lịch xem
                        </Button>
                        <Button variant="text" size="sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPhongXemChiTiet(phong)} data-testid={`btn-xem-bieu-phi-${phong.soPhong}`}>
                          Biểu phí & Tiện ích
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
              {danhSachSapXep.length > soHienThi && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Button variant="text" onClick={() => setSoHienThi((n) => n + 12)}>
                    Xem thêm {danhSachSapXep.length - soHienThi} phòng <Icon name="chevron-down" size="sm" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal 1: Chi tiết phòng & Bảng biểu phí dịch vụ công khai */}
      {phongXemChiTiet && (
        <ChiTietPhongModal
          phong={phongXemChiTiet}
          onClose={() => setPhongXemChiTiet(null)}
          onDatLich={(phong) => {
            setPhongDatLich(phong)
            setPhongXemChiTiet(null)
            setThongBaoLich(null)
          }}
        />
      )}

      {/* Modal 2: Đặt lịch hẹn xem phòng trực tiếp */}
      {phongDatLich && (
        <DatLichModal
          phong={phongDatLich}
          thongBaoLich={thongBaoLich}
          dangGuiLich={dangGuiLich}
          formLichHen={formLichHen}
          onChangeForm={setFormLichHen}
          onSubmit={handleGuiLichHen}
          onClose={() => {
            setPhongDatLich(null)
            setThongBaoLich(null)
          }}
        />
      )}

    </div>
  )
}

// ----------------- Modern PropTech SaaS Styles -----------------



function ChiTietPhongModal({
  phong,
  onClose,
  onDatLich,
}: {
  phong: PublicPhong
  onClose: () => void
  onDatLich: (phong: PublicPhong) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef, onClose })

  return (
    <div style={styleBackdropModal} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-chitiet-title"
        tabIndex={-1}
        style={styleModalHop}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styleModalHeader}>
          <div>
            <SysLabel>MINH BẠCH CHI PHÍ · TOÀ NHÀ {phong.tenToaNha}</SysLabel>
            <h3 id="modal-chitiet-title" style={styleModalTitle}>
              Thông tin phòng {phong.soPhong}
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
              📍 {phong.diaChiToaNha} (Tầng {phong.tang} · Diện tích {phong.dienTich} m²)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styleNutDongModal}
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        <div style={styleModalBody}>
          {/* Ảnh phòng: ưu tiên anhDaiDien từ API, fallback sang ảnh minh hoạ khi thiếu hoặc lỗi */}
          <HinhAnhPhong
            anhDaiDien={phong.anhDaiDien}
            tenToaNha={phong.tenToaNha}
            loaiPhong={phong.loaiPhong}
            soPhong={phong.soPhong}
            chieuCao={200}
            style={{ marginBottom: 'var(--ma-space-4)' }}
          />

          {/* Tiền thuê phòng */}
          <div style={styleHopGiaChinh}>
            <div>
              <span style={{ fontSize: 12, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-text-secondary)' }}>
                TIỀN THUÊ CỐ ĐỊNH HẰNG THÁNG
              </span>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-ink-900)' }}>
                {dinhDangTien(phong.giaThueMacDinh)}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ma-text-secondary)' }}> / tháng</span>
              </div>
            </div>
            {(() => {
              const { label: modalNhanTrangThai, tone: modalTone } = anhXaTrangThaiPhong(phong.trangThai)
              return <StatusTag tone={modalTone}>{modalNhanTrangThai}</StatusTag>
            })()}
          </div>

          {/* Bảng biểu phí dịch vụ */}
          <div style={{ marginTop: 'var(--ma-space-4)' }}>
            <h4 style={styleTieuDePhu}>BẢNG BIỂU PHÍ DỊCH VỤ NIÊM YẾT</h4>
            <p style={{ margin: '0 0 var(--ma-space-2)', fontSize: 12, color: 'var(--ma-text-secondary)' }}>
              Cam kết thu đúng theo đồng hồ công tơ riêng và biểu giá niêm yết của toà nhà, không tự ý tăng giá.
            </p>

            {phong.danhSachDichVu && phong.danhSachDichVu.length > 0 ? (
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
                  {phong.danhSachDichVu.map((dv) => (
                    <tr key={dv.id}>
                      <td style={styleTd}>
                        <strong>{dv.tenDichVu}</strong>
                      </td>
                      <td style={styleTd}>{dv.loaiThu === 'DONG_HO' ? 'Theo chỉ số công tơ' : dv.loaiThu === 'CO_DINH' ? 'Phí cố định/tháng' : dv.loaiThu}</td>
                      <td style={{ ...styleTd, fontFamily: 'var(--ma-font-mono)', fontWeight: 700 }}>
                        {dv.cheDoGia === 'BAC_THANG'
                          ? 'Theo biểu giá bậc thang'
                          : dv.donGia != null
                          ? dinhDangTien(dv.donGia) + ' / ' + dv.donViTinh
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

          {/* Tiền ích phòng */}
          <div style={{ marginTop: 'var(--ma-space-5)' }}>
            <h4 style={styleTieuDePhu}>TIỆN ÍCH & TRANG THIẾT BỊ SẴN CÓ TRONG PHÒNG</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--ma-space-2)' }}>
              {phong.tienIch && phong.tienIch.length > 0 ? (
                phong.tienIch.map((ti, idx) => (
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
          {phong.moTa && (
            <div style={{ marginTop: 'var(--ma-space-5)' }}>
              <h4 style={styleTieuDePhu}>MÔ TẢ CHI TIẾT</h4>
              <p style={{ margin: 'var(--ma-space-2) 0 0', lineHeight: 1.6, fontSize: 14 }}>
                {phong.moTa}
              </p>
            </div>
          )}
        </div>

        <div style={styleModalFooter}>
          <Button variant="secondary" onClick={onClose}>
            Đóng lại
          </Button>
          <Button
            variant="primary"
            onClick={() => onDatLich(phong)}
          >
            Đặt lịch hẹn xem phòng này →
          </Button>
        </div>
      </div>
    </div>
  )
}

function DatLichModal({
  phong,
  thongBaoLich,
  dangGuiLich,
  formLichHen,
  onChangeForm,
  onSubmit,
  onClose,
}: {
  phong: PublicPhong
  thongBaoLich: { thanhCong: boolean; message: string; lichHenId?: number } | null
  dangGuiLich: boolean
  formLichHen: { hoTen: string; soDienThoai: string; email: string; thoiGianHen: string; ghiChu: string }
  onChangeForm: (form: { hoTen: string; soDienThoai: string; email: string; thoiGianHen: string; ghiChu: string }) => void
  onSubmit: (e: FormEvent) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef, onClose })

  return (
    <div style={styleBackdropModal} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-datlich-title"
        tabIndex={-1}
        style={styleModalHop}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styleModalHeader}>
          <div>
            <SysLabel>ĐẶT LỊCH HẸN TRỰC TIẾP</SysLabel>
            <h3 id="modal-datlich-title" style={styleModalTitle}>
              Hẹn xem phòng {phong.soPhong} - {phong.tenToaNha}
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
              📍 {phong.diaChiToaNha}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                onClick={onClose}
              >
                Đã hiểu & Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
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
                    onChange={(e) => onChangeForm({ ...formLichHen, hoTen: e.target.value })}
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
                    onChange={(e) => onChangeForm({ ...formLichHen, soDienThoai: e.target.value })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--ma-text-muted)', fontFamily: 'var(--ma-font-mono)' }}>
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
                    onChange={(e) => onChangeForm({ ...formLichHen, email: e.target.value })}
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
                    onChange={(e) => onChangeForm({ ...formLichHen, thoiGianHen: e.target.value })}
                  />
                </div>

                <div style={styleNhanTruong}>
                  <label style={styleLabelForm}>Ghi chú thêm cho quản lý toà nhà</label>
                  <textarea
                    rows={3}
                    style={styleTextareaForm}
                    placeholder="Ví dụ: Tôi muốn hỏi thêm về chỗ để xe máy, có thể chuyển vào ở từ đầu tháng tới..."
                    value={formLichHen.ghiChu}
                    onChange={(e) => onChangeForm({ ...formLichHen, ghiChu: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={styleModalFooter}>
              <Button variant="secondary" type="button" onClick={onClose}>
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
  )
}

const styleTrangPortal: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--ma-bg-page)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  display: 'flex',
  flexDirection: 'column',
}

const styleHeroSub: CSSProperties = {
  maxWidth: 560,
  font: 'var(--ma-text-body)',
  color: 'var(--ma-text-secondary)',
}

const styleKhuVucBoLoc: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 16,
  marginTop: 8,
  background: 'var(--ma-bg-sunken)',
  borderRadius: 20,
}

const styleTruncate: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}

const styleGridPhong: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
}

const styleCardPhong: CSSProperties = {
  background: 'var(--ma-bg-card)',
  borderRadius: 'var(--ma-radius-xl)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
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

const styleCardActions: CSSProperties = {
  marginTop: 'auto',
  padding: '8px 6px 4px',
  display: 'grid',
  gap: 4,
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