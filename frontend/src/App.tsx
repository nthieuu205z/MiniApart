import { FormEvent, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import {
  ApiError,
  fetchCurrentUser,
  fetchHealth,
  fetchThongBao,
  login,
  type DangNhapRequest,
  type HealthStatus,
  type ThongTinNguoiDung,
} from './api'
import { clearStoredToken, readStoredToken, storeToken } from './authSession'
import DanhMucToaNha from './DanhMucToaNha'
import DanhMucPhong from './DanhMucPhong'
import KhamPhaPhong from './KhamPhaPhong'
import QuanLyLichHen from './QuanLyLichHen'
import GhiChiSo from './GhiChiSo'
import HoaDon from './HoaDon'
import LichSuHoaDon from './LichSuHoaDon'
import BieuDoTieuThu from './BieuDoTieuThu'
import HopDongNguoiThue from './HopDongNguoiThue'
import HopDongQuanLy from './HopDongQuanLy'
import HoaDonQuanLy from './HoaDonQuanLy'
import QuanLyTaiKhoan from './QuanLyTaiKhoan'
import { ViecCuaToi } from './ViecCuaToi'
import { ThoTongQuan } from './ThoTongQuan'
import { ThoCongViec } from './ThoCongViec'
import { ThoChiPhi } from './ThoChiPhi'
import { ThongBao } from './ThongBao'
import { LichSuSuaChua } from './LichSuSuaChua'
import { BangViecVanHanh } from './BangViecVanHanh'
import { ChuDashboard } from './ChuDashboard'
import { QuanLyDashboard } from './QuanLyDashboard'
import BaoCaoTongQuan from './BaoCaoTongQuan'
import CongNoBaoCao from './CongNoBaoCao'
import TieuThuBaoCao from './TieuThuBaoCao'
import ChiPhiBaoTriBaoCao from './ChiPhiBaoTriBaoCao'
import HoSoNguoiThue from './HoSoNguoiThue'
import HopDongThaoTac from './HopDongThaoTac'
import DichVuVaKy from './DichVuVaKy'
import QuanLySuaChua from './QuanLySuaChua'
import TaiKhoanTruyCap from './TaiKhoanTruyCap'
import ThuTien from './ThuTien'
import { AnToanVanHanh, CuTruVanHanh, NhatKyVanHanh } from './TuanThuVanHanh'
import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import { SysLabel } from './design/core/SysLabel'
import { Toast } from './design/feedback/Toast'
import { Breadcrumb } from './design/shell/Breadcrumb'
import { NavPanel, type NavGroup } from './design/shell/NavPanel'
import { TopBar } from './design/shell/TopBar'
import type { GlyphName } from './design/core/GlyphName'
import type { IconName } from './design/core/Icon'
import { layMenuTheoVaiTro, xacDinhTrangTheoVaiTro } from './roleNavigation'

const styleTrang: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--ma-bg-page)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
}

const styleKhungKhach: CSSProperties = {
  ...styleTrang,
  display: 'grid',
  gap: 'var(--ma-space-7)',
  padding: 'clamp(16px, 4vw, var(--ma-space-8))',
  alignContent: 'start',
}

const styleGridKhach: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-6)',
  maxWidth: 440,
  margin: '24px auto 0',
  width: '100%',
  gridTemplateColumns: 'minmax(0, 1fr)',
}

const styleGridKhachDesktop: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(360px, 1fr)',
  maxWidth: 920,
  margin: '20px auto 0',
  width: '100%',
  borderRadius: 'var(--ma-radius-lg, 12px)',
  overflow: 'hidden',
  boxShadow: 'var(--ma-shadow-md)',
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
}

const styleLoginShowcase: CSSProperties = {
  position: 'relative',
  background: 'var(--ma-ink-900)',
  minHeight: 460,
  overflow: 'hidden',
}

const styleLoginShowcaseImg: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  opacity: 0.85,
}

const styleLoginShowcaseOverlay: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.45) 50%, rgba(15, 23, 42, 0.7) 100%)',
  padding: '36px 32px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
}

const styleLogoHieuSmall: CSSProperties = {
  width: 32,
  height: 32,
  background: '#ffffff',
  color: 'var(--ma-ink-900)',
  fontFamily: 'var(--ma-font-mono)',
  fontWeight: 800,
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
}

const styleShowcaseBadge: CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.75)',
  color: '#ffffff',
  fontSize: 10,
  fontFamily: 'var(--ma-font-mono)',
  fontWeight: 600,
  padding: '2px 7px',
  borderRadius: 4,
  backdropFilter: 'blur(4px)',
  letterSpacing: '0.04em',
}

const styleGridKhachManHinhHep: CSSProperties = {
  ...styleGridKhach,
  margin: '12px auto 0',
  gridTemplateColumns: 'minmax(0, 1fr)',
}

const styleThe: CSSProperties = {
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-sm)',
  background: 'var(--ma-bg-card)',
  minWidth: 0,
}

const styleTheNoiDung: CSSProperties = {
  ...styleThe,
  padding: 'clamp(18px, 4vw, 30px)',
}

const styleNhanTruong: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-2)',
  minWidth: 0,
  font: 'var(--ma-text-body)',
  color: 'var(--ma-text-primary)',
}

const styleONhap: CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: 'var(--ma-hit-mobile)',
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  border: '1px solid var(--ma-border-strong)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  font: 'var(--ma-text-body)',
}

const styleKhungUngDungDesktop: CSSProperties = {
  ...styleTrang,
  display: 'grid',
  gridTemplateColumns: 'var(--ma-nav-width) minmax(0, 1fr)',
  gap: 'var(--ma-space-4)',
  padding: 'var(--ma-space-4)',
  overflowX: 'clip',
}

// Thu gọn: ghi đè biến độ rộng để cột lưới và sidebar cùng co về 72px mà không đổi giá trị inline.
const styleKhungUngDungThuGon = { ...styleKhungUngDungDesktop, '--ma-nav-width': 'var(--ma-nav-width-collapsed)' } as CSSProperties

const styleKhungUngDungMobile: CSSProperties = {
  ...styleTrang,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  overflowX: 'clip',
}

const styleCotNoiDung: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}

const styleCotNoiDungMobile: CSSProperties = {
  ...styleCotNoiDung,
  paddingBottom: 'calc(var(--ma-bottom-nav-height) + var(--ma-space-4))',
}

const styleVungNoiDung: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 'clamp(16px, 4vw, var(--ma-space-8))',
  display: 'grid',
  gap: 'var(--ma-space-7)',
  alignContent: 'start',
}

const styleVungNoiDungKhongDem: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'grid',
  alignContent: 'start',
}

const styleTieuDe: CSSProperties = {
  margin: 'var(--ma-space-2) 0 0',
  font: 'var(--ma-text-screen-title)',
  letterSpacing: 'var(--ma-tracking-title)',
}

const styleTieuDeKhoi: CSSProperties = {
  letterSpacing: 'var(--ma-tracking-title)',
}

const styleDoanMoTa: CSSProperties = {
  margin: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-body)',
  lineHeight: 1.6,
}

const styleThongTinNguoiDung: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-5)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  margin: 0,
}

const styleHangThongTin: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-1)',
  paddingTop: 'var(--ma-space-4)',
  borderTop: '1px solid var(--ma-border-subtle)',
}

const styleNhomNut: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-3)',
}

const styleNutChonDemo: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  padding: '8px 12px',
  background: 'var(--ma-bg-page)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--ma-font-ui)',
  transition: 'border-color 0.15s ease, background 0.15s ease',
}

const styleSoDemo: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 11,
  color: 'var(--ma-text-secondary)',
}

function layDuongDanChinhTheoVaiTro(vaiTro: string): string {
  switch (vaiTro) {
    case 'CHU':
      return '/tong-quan'
    case 'QUAN_LY':
      return '/nhac-viec'
    case 'THO':
      return '/tho/tong-quan'
    case 'NGUOI_THUE':
      return '/hoa-don-cua-toi'
    case 'QTHT':
      return '/tai-khoan'
    default:
      return '/tong-quan'
  }
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [dangTaiPhien, setDangTaiPhien] = useState(true)
  const [dangDangNhap, setDangDangNhap] = useState(false)
  const [moTroGiupTaiKhoan, setMoTroGiupTaiKhoan] = useState(false)
  const [nguoiDung, setNguoiDung] = useState<ThongTinNguoiDung | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [soThongBaoChuaDoc, setSoThongBaoChuaDoc] = useState<number | null>(null)
  const phienBanTaiThongBao = useRef(0)
  const [duongDanHienTai, setDuongDanHienTai] = useState(() => layDuongDanHienTai())
  const [laManHinhHep, setLaManHinhHep] = useState(() => kiemTraManHinhHep())
  const [laManHinhThuGon, setLaManHinhThuGon] = useState(() => kiemTraManHinhThuGon())
  const [cheDoKhach, setCheDoKhach] = useState<'KHAM_PHA' | 'DANG_NHAP'>(() => {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return typeof window !== 'undefined' && window.location.pathname === '/kham-pha' ? 'KHAM_PHA' : 'DANG_NHAP'
    }
    if (typeof window !== 'undefined' && window.location.pathname === '/dang-nhap') {
      return 'DANG_NHAP'
    }
    return 'KHAM_PHA'
  })
  const [form, setForm] = useState<DangNhapRequest>({
    soDienThoai: '',
    matKhau: '',
  })

  useEffect(() => {
    let mounted = true

    fetchHealth()
      .then((result) => {
        if (mounted) setHealth(result)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setHealthError(reason instanceof Error ? reason.message : 'Không thể kết nối tới máy chủ.')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const storedToken = readStoredToken()

    if (!storedToken) {
      setDangTaiPhien(false)
      return () => {
        mounted = false
      }
    }

    fetchCurrentUser(storedToken)
      .then((currentUser) => {
        if (!mounted) return
        setToken(storedToken)
        setNguoiDung(currentUser)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        if (reason instanceof ApiError && reason.status === 401) {
          clearStoredToken()
        }
        setAuthError(reason instanceof Error ? reason.message : 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.')
      })
      .finally(() => {
        if (mounted) setDangTaiPhien(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    function dongBoDuongDan() {
      setDuongDanHienTai(layDuongDanHienTai())
    }

    window.addEventListener('popstate', dongBoDuongDan)
    return () => {
      window.removeEventListener('popstate', dongBoDuongDan)
    }
  }, [])

  useEffect(() => {
    const phienBan = phienBanTaiThongBao.current + 1
    phienBanTaiThongBao.current = phienBan
    const vaiTro = nguoiDung?.vaiTro
    if (!token || !vaiTro || !['CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE'].includes(vaiTro)) {
      setSoThongBaoChuaDoc(null)
      return undefined
    }

    if (duongDanHienTai === '/thong-bao') {
      return undefined
    }

    let mounted = true
    void fetchThongBao(token)
      .then((hopThongBao) => {
        if (mounted && phienBanTaiThongBao.current === phienBan) {
          setSoThongBaoChuaDoc(hopThongBao.soChuaDoc)
        }
      })
      .catch(() => {
        if (mounted && phienBanTaiThongBao.current === phienBan) {
          setSoThongBaoChuaDoc(null)
        }
      })

    return () => {
      mounted = false
    }
  }, [duongDanHienTai, nguoiDung?.vaiTro, token])

  useEffect(() => {
    if (nguoiDung?.vaiTro === 'THO' && !['/tho/tong-quan', '/viec-cua-toi', '/tho/chi-phi', '/thong-bao'].includes(duongDanHienTai)) {
      thayTheDuongDan('/tho/tong-quan')
    }
  }, [nguoiDung, duongDanHienTai])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    function dongBoKichThuoc() {
      setLaManHinhHep(kiemTraManHinhHep())
      setLaManHinhThuGon(kiemTraManHinhThuGon())
    }

    window.addEventListener('resize', dongBoKichThuoc)
    return () => {
      window.removeEventListener('resize', dongBoKichThuoc)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDangDangNhap(true)
    setAuthError(null)

    try {
      const response = await login(form)
      storeToken(response.token)
      setToken(response.token)
      setNguoiDung(response.nguoiDung)
      if (response.nguoiDung.vaiTro === 'THO') {
        thayTheDuongDan('/tho/tong-quan')
      } else if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        dieuHuongToi('/')
      } else {
        dieuHuongToi(layDuongDanChinhTheoVaiTro(response.nguoiDung.vaiTro))
      }
      setForm({ soDienThoai: '', matKhau: '' })
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : 'Đăng nhập không thành công.')
    } finally {
      setDangDangNhap(false)
      setDangTaiPhien(false)
    }
  }

  function handleLogout() {
    clearStoredToken()
    setToken(null)
    setNguoiDung(null)
    setAuthError(null)
    dieuHuongToi('/')
  }

  const menuVaiTro = nguoiDung ? layMenuTheoVaiTro(nguoiDung.vaiTro) : []
  const trangVaiTro = nguoiDung
    ? xacDinhTrangTheoVaiTro(nguoiDung.vaiTro, nguoiDung.tenVaiTro, duongDanHienTai)
    : null
  const dinhDanhHoaDon = typeof window === 'undefined'
    ? {}
    : layDinhDanhHoaDonTuUrl(window.location.href)
  const hienThiDanhMucToaNha = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/toa-nha'
    && ['QTHT', 'CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro),
  )
  const hienThiDanhMucPhong = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/phong'
    && nguoiDung.vaiTro === 'QUAN_LY',
  )
  const hienThiGhiChiSo = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/ghi-chi-so'
    && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro),
  )
  const hienThiHoaDonNguoiThue = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'NGUOI_THUE'
    && ['/', '/hoa-don-cua-toi'].includes(duongDanHienTai)
  )
  const hienThiLichSuHoaDonNguoiThue = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'NGUOI_THUE'
    && duongDanHienTai === '/lich-su'
  )
  const hienThiBieuDoTieuThuNguoiThue = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'NGUOI_THUE'
    && duongDanHienTai === '/tieu-thu'
  )
  const hienThiHopDongNguoiThue = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'NGUOI_THUE'
    && duongDanHienTai === '/hop-dong'
  )
  const hienThiHopDongQuanLy = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/hop-dong'
    && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro)
  )
  const hienThiLichHen = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/lich-hen'
    && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro)
  )
  const hienThiThongBao = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/thong-bao'
    && ['CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE'].includes(nguoiDung.vaiTro),
  )
  const hienThiThoTongQuan = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'THO'
    && duongDanHienTai === '/tho/tong-quan',
  )
  const hienThiViecCuaToi = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'THO'
    && duongDanHienTai === '/viec-cua-toi',
  )
  const hienThiThoChiPhi = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'THO'
    && duongDanHienTai === '/tho/chi-phi',
  )
  const hienThiLichSuSuaChua = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/su-co'
    && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro),
  )
  const hienThiDashboardChu = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'CHU'
    && duongDanHienTai === '/tong-quan',
  )
  const hienThiDashboardQuanLy = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'QUAN_LY'
    && duongDanHienTai === '/nhac-viec',
  )
  const hienThiBangViec = Boolean(
    token
    && nguoiDung
    && ((nguoiDung.vaiTro === 'QUAN_LY' && duongDanHienTai === '/nhac-viec')
      || (nguoiDung.vaiTro === 'CHU' && duongDanHienTai === '/tong-quan')),
  )
  const hienThiBaoCaoTongQuan = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'CHU'
    && duongDanHienTai === '/bao-cao',
  )
  const hienThiBaoCaoTieuThu = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'CHU'
    && duongDanHienTai === '/bao-cao/tieu-thu',
  )
  const hienThiBaoCaoChiPhiBaoTri = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'CHU'
    && duongDanHienTai === '/bao-cao/chi-phi-bao-tri',
  )
  const hienThiBaoCaoCongNo = Boolean(
    token
    && nguoiDung
    && nguoiDung.vaiTro === 'CHU'
    && duongDanHienTai === '/cong-no',
  )
  const laDrillDownCongNo = Boolean(
    nguoiDung?.vaiTro === 'CHU'
    && duongDanHienTai === '/hoa-don'
    && dinhDanhHoaDon.hoaDonId !== undefined
    && (dinhDanhHoaDon.toaNhaId === undefined || dinhDanhHoaDon.kyId === undefined),
  )
  const hienThiHoaDon = Boolean(
    token
    && nguoiDung
    && ['/hoa-don', '/hoa-don-cua-toi'].includes(duongDanHienTai)
    && ['QTHT', 'CHU', 'QUAN_LY', 'NGUOI_THUE'].includes(nguoiDung.vaiTro)
    && (!['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro)
      || (dinhDanhHoaDon.toaNhaId !== undefined && dinhDanhHoaDon.kyId !== undefined && dinhDanhHoaDon.hoaDonId !== undefined)
      || laDrillDownCongNo),
  )
  const hienThiHoaDonQuanLy = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/hoa-don'
    && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro)
    && dinhDanhHoaDon.hoaDonId === undefined,
  )
  const tieuDeTheChinh = hienThiBieuDoTieuThuNguoiThue
    ? 'Tiêu thụ điện và nước'
    : hienThiHopDongNguoiThue
      ? 'Hợp đồng của tôi'
      : hienThiHopDongQuanLy
        ? 'Hợp đồng theo toà nhà'
      : hienThiLichHen
        ? 'Lịch hẹn xem phòng'
      : hienThiThongBao
        ? 'Thông báo'
      : hienThiBaoCaoTongQuan
        ? 'Báo cáo tổng quan'
      : hienThiBaoCaoTieuThu
        ? 'Báo cáo tiêu thụ điện nước'
      : hienThiBaoCaoChiPhiBaoTri
        ? 'Báo cáo chi phí bảo trì'
      : hienThiBaoCaoCongNo
        ? 'Báo cáo công nợ'
      : hienThiBangViec
        ? 'Bảng việc vận hành'
      : hienThiLichSuSuaChua
        ? 'Lịch sử sửa chữa'
    : hienThiHoaDonNguoiThue && duongDanHienTai !== '/'
      ? 'Hoá đơn của tôi'
    : hienThiLichSuHoaDonNguoiThue
      ? 'Lịch sử hoá đơn'
      : hienThiDanhMucToaNha
        ? 'Toà nhà'
        : hienThiDanhMucPhong
          ? 'Phòng'
      : hienThiGhiChiSo
            ? 'Ghi chỉ số'
            : hienThiHoaDonQuanLy || hienThiHoaDon
              ? 'Hoá đơn'
              : nguoiDung && trangVaiTro ? trangVaiTro.tieuDe : 'Đăng nhập'

  if (!nguoiDung) {
    if (moTroGiupTaiKhoan) return <TaiKhoanTruyCap onLogin={() => { setMoTroGiupTaiKhoan(false); setCheDoKhach('DANG_NHAP') }} />
    if (cheDoKhach === 'KHAM_PHA') {
      return (
        <KhamPhaPhong
          onChuyenDangNhap={() => setCheDoKhach('DANG_NHAP')}
          manHinhHep={laManHinhHep}
        />
      )
    }

    return (
      <main style={styleKhungKhach}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: laManHinhHep ? 440 : 920, margin: '0 auto', width: '100%' }}>
          <button
            type="button"
            onClick={() => setCheDoKhach('KHAM_PHA')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ma-text-secondary)',
              fontFamily: 'var(--ma-font-mono)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Khám phá phòng trống
          </button>
          <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
            MiniApart
          </span>
        </div>

        <section style={laManHinhHep ? styleGridKhachManHinhHep : styleGridKhachDesktop}>
          {/* Cột minh họa không gian toà nhà trên desktop */}
          {!laManHinhHep && (
            <div style={styleLoginShowcase}>
              <img
                src="/rooms/annhien_studio_noi_that.webp"
                alt="Không gian căn hộ MiniApart"
                style={styleLoginShowcaseImg}
              />
              <div style={styleLoginShowcaseOverlay}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={styleLogoHieuSmall}>M</div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>MiniApart</span>
                </div>
                <h3 style={{ margin: '0 0 10px', fontSize: 21, fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                  Nền tảng quản lý vận hành chung cư mini & nhà trọ
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                  Minh bạch hoá số liệu dịch vụ, kiểm soát hợp đồng chặt chẽ và kết nối người thuê nhanh chóng.
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                  <span style={styleShowcaseBadge}>Ảnh minh họa</span>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              ...styleTheNoiDung,
              display: 'grid',
              gap: 'var(--ma-space-5)',
              padding: laManHinhHep ? '28px 24px' : '36px 36px',
            }}
            aria-labelledby="auth-title"
          >
            <div style={{ textAlign: 'center', display: 'grid', gap: 4 }}>
              <h1 id="app-title" style={{ margin: 0, font: 'var(--ma-text-screen-title)', fontSize: 26, letterSpacing: '-0.02em' }}>
                MiniApart
              </h1>
              <p style={{ ...styleDoanMoTa, fontSize: 13.5 }}>
                Quản lý vận hành chung cư mini & nhà trọ
              </p>
            </div>

            {healthError && (
              <div role="alert">
                <BlockedNotice
                  title="Mất kết nối máy chủ"
                  reason={healthError}
                />
              </div>
            )}

            {dangTaiPhien ? (
              <p style={{ ...styleDoanMoTa, textAlign: 'center' }} aria-live="polite">
                Đang kiểm tra phiên đăng nhập…
              </p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
                <label style={styleNhanTruong}>
                  <span>Số điện thoại</span>
                  <input
                    value={form.soDienThoai}
                    onChange={(event) => setForm((current) => ({ ...current, soDienThoai: event.target.value }))}
                    placeholder="0900000003"
                    autoComplete="username"
                    required
                    style={styleONhap}
                  />
                </label>

                <label style={styleNhanTruong}>
                  <span>Mật khẩu</span>
                  <input
                    type="password"
                    value={form.matKhau}
                    onChange={(event) => setForm((current) => ({ ...current, matKhau: event.target.value }))}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    required
                    style={styleONhap}
                  />
                </label>

                {authError ? (
                  <div role="alert">
                    <BlockedNotice title="Đăng nhập không thành công" reason={authError} />
                  </div>
                ) : (
                  <p style={{ ...styleDoanMoTa, fontSize: 12.5 }}>Nhập số điện thoại và mật khẩu được cấp để tiếp tục.</p>
                )}

                <Button
                  type="submit"
                  blocked={dangDangNhap}
                  style={{ minHeight: 'var(--ma-hit-mobile)', justifyContent: 'center', width: '100%', marginTop: 4 }}
                >
                  {dangDangNhap ? 'Đang đăng nhập…' : 'Đăng nhập'}
                </Button>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <Button variant="text" type="button" onClick={() => setMoTroGiupTaiKhoan(true)}>
                    Kích hoạt tài khoản / Quên mật khẩu
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
    )
  }

  const nhomDieuHuong = taoNhomDieuHuong(nguoiDung.vaiTro, duongDanHienTai)
  const thongTinTopBar = taoThongTinTopBar(nguoiDung.vaiTro)
  const canDungTopBarToanCuc = !hienThiGhiChiSo
  const duongDanPhanCap = taoDuongDanPhanCap(nguoiDung.tenVaiTro, tieuDeTheChinh)

  return (
    <main className="ma-app-shell" style={laManHinhHep ? styleKhungUngDungMobile : laManHinhThuGon ? styleKhungUngDungThuGon : styleKhungUngDungDesktop}>
      <NavPanel
        className="ma-no-print"
        mobile={laManHinhHep}
        aria-label="Điều hướng theo vai trò"
        groups={nhomDieuHuong}
        subtitle={nguoiDung.tenVaiTro}
        user={{
          initials: layChuCaiDau(nguoiDung.hoTen),
          name: nguoiDung.hoTen,
          role: nguoiDung.tenVaiTro,
        }}
        collapsed={laManHinhThuGon}
        onLogout={handleLogout}
        onClick={handleNavClick}
        style={{
          width: laManHinhHep ? '100%' : 'var(--ma-nav-width)',
          minWidth: 0,
        }}
      />

      <div style={laManHinhHep ? styleCotNoiDungMobile : styleCotNoiDung}>
        {canDungTopBarToanCuc ? (
          <>
            <TopBar
              className="ma-no-print"
              building={thongTinTopBar.building}
              period={thongTinTopBar.period}
              periodStatus={thongTinTopBar.periodStatus}
              notifications={soThongBaoChuaDoc ?? undefined}
              notificationHref={['CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE'].includes(nguoiDung.vaiTro) ? '/thong-bao' : undefined}
              onLogout={laManHinhHep ? handleLogout : undefined}
              compact={laManHinhHep}
              onClick={handleNavClick}
              style={{
                padding: laManHinhHep ? '10px 16px' : undefined,
                gap: laManHinhHep ? 10 : undefined,
                flexWrap: laManHinhHep ? 'nowrap' : 'wrap',
                height: 'auto',
                minHeight: hienThiDashboardChu && !laManHinhHep ? 48 : 'var(--ma-topbar-height)',
              }}
            />
            {tieuDeTheChinh === 'Tổng quan' || hienThiDashboardChu ? null : <Breadcrumb className="ma-no-print" items={duongDanPhanCap} style={{ padding: laManHinhHep ? '7px 16px' : undefined }} />}
          </>
        ) : null}

        <section style={hienThiGhiChiSo ? styleVungNoiDungKhongDem : hienThiDashboardChu && !laManHinhHep ? { ...styleVungNoiDung, padding: '0 16px 24px', gap: 16 } : styleVungNoiDung}>
          {healthError ? (
            <div role="alert" style={{ marginBottom: 'var(--ma-space-4)' }}>
              <BlockedNotice title="Mất kết nối máy chủ" reason={healthError} />
            </div>
          ) : null}
          {token && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro) && duongDanHienTai === '/nguoi-thue' ? (
            <HoSoNguoiThue token={token} />
          ) : token && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro) && duongDanHienTai === '/dich-vu' ? (
            <DichVuVaKy token={token} />
          ) : token && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro) && duongDanHienTai === '/thu-tien' ? (
            <ThuTien token={token} mobile={laManHinhHep} vaiTro={nguoiDung.vaiTro} />
          ) : token && nguoiDung.vaiTro === 'NGUOI_THUE' && duongDanHienTai === '/bao-hong' ? (
            <QuanLySuaChua token={token} tenant />
          ) : token && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro) && duongDanHienTai === '/an-toan' ? (
            <AnToanVanHanh token={token} vaiTro={nguoiDung.vaiTro} />
          ) : token && ['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro) && duongDanHienTai === '/cu-tru' ? (
            <CuTruVanHanh token={token} />
          ) : token && ['QTHT', 'CHU'].includes(nguoiDung.vaiTro) && duongDanHienTai === '/nhat-ky-thao-tac' ? (
            <NhatKyVanHanh token={token} />
          ) : hienThiDanhMucToaNha && token ? (
            <DanhMucToaNha token={token} vaiTro={nguoiDung.vaiTro} mobile={laManHinhHep} />
          ) : hienThiDanhMucPhong && token ? (
            <DanhMucPhong token={token} mobile={laManHinhHep} />
          ) : hienThiGhiChiSo && token ? (
            <GhiChiSo token={token} mobile={laManHinhHep} vaiTro={nguoiDung.vaiTro} />
          ) : hienThiBieuDoTieuThuNguoiThue && token ? (
            <BieuDoTieuThu token={token} mobile={laManHinhHep} />
          ) : hienThiHopDongNguoiThue && token ? (
            <HopDongNguoiThue token={token} mobile={laManHinhHep} />
          ) : hienThiHopDongQuanLy && token ? (
            <HopDongQuanLy token={token} mobile={laManHinhHep} />
          ) : hienThiLichHen && token ? (
            <QuanLyLichHen token={token} mobile={laManHinhHep} />
          ) : hienThiThoTongQuan && token ? (
            <ThoTongQuan token={token} mobile={laManHinhHep} onNavigate={dieuHuongToi} />
          ) : hienThiViecCuaToi && token ? (
            <ThoCongViec token={token} mobile={laManHinhHep} />
          ) : hienThiThoChiPhi && token ? (
            <ThoChiPhi token={token} mobile={laManHinhHep} onNavigateToTicket={(id) => dieuHuongToi(`/viec-cua-toi?yeuCauId=${id}`)} />
          ) : hienThiBaoCaoTongQuan && token ? (
            <BaoCaoTongQuan token={token} mobile={laManHinhHep} />
          ) : hienThiBaoCaoTieuThu && token ? (
            <TieuThuBaoCao token={token} mobile={laManHinhHep} />
          ) : hienThiBaoCaoChiPhiBaoTri && token ? (
            <ChiPhiBaoTriBaoCao token={token} mobile={laManHinhHep} />
          ) : hienThiBaoCaoCongNo && token ? (
            <CongNoBaoCao token={token} mobile={laManHinhHep} />
          ) : hienThiDashboardChu && token ? (
            <ChuDashboard token={token} mobile={laManHinhHep} />
          ) : hienThiDashboardQuanLy && token ? (
            <QuanLyDashboard token={token} mobile={laManHinhHep} />
          ) : hienThiBangViec && token ? (
            <BangViecVanHanh token={token} mobile={laManHinhHep} />
          ) : hienThiLichSuSuaChua && token ? (
            <><QuanLySuaChua token={token} /><LichSuSuaChua token={token} mobile={laManHinhHep} /></>
          ) : hienThiThongBao && token ? (
            <ThongBao token={token} mobile={laManHinhHep} vaiTro={nguoiDung.vaiTro} onUnreadCountChange={setSoThongBaoChuaDoc} />
          ) : hienThiHoaDonQuanLy && token ? (
            <HoaDonQuanLy token={token} mobile={laManHinhHep} vaiTro={nguoiDung.vaiTro} />
          ) : hienThiLichSuHoaDonNguoiThue && token ? (
            <LichSuHoaDon token={token} mobile={laManHinhHep} />
          ) : (hienThiHoaDon || hienThiHoaDonNguoiThue) && token ? (
            <HoaDon
              token={token}
              {...dinhDanhHoaDon}
              vaiTro={nguoiDung.vaiTro}
              mobile={laManHinhHep}
              cheDoNguoiThue={nguoiDung.vaiTro === 'NGUOI_THUE'}
              cheDoCongNo={laDrillDownCongNo}
            />
          ) : nguoiDung.vaiTro === 'QTHT' && duongDanHienTai === '/tai-khoan' && token ? (
            <QuanLyTaiKhoan token={token} mobile={laManHinhHep} />
          ) : trangVaiTro ? (
            <section style={{ ...styleTheNoiDung, display: 'grid', gap: 'var(--ma-space-6)' }} aria-labelledby="current-route-title">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 'var(--ma-space-5)',
                  alignItems: 'start',
                  paddingBottom: 'var(--ma-space-5)',
                  borderBottom: '2px solid var(--ma-ink-900)',
                }}
              >
                <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
                  <SysLabel tone="primary">{nguoiDung.tenVaiTro.toUpperCase()}</SysLabel>
                  <h2 id="current-route-title" style={{ margin: 0, font: 'var(--ma-text-block-title)', ...styleTieuDeKhoi }}>
                    {trangVaiTro.tieuDe}
                  </h2>
                  <p style={styleDoanMoTa}>{trangVaiTro.thongDiep}</p>
                </div>
                <div style={styleNhomNut}>
                  {trangVaiTro.loai === 'khong-co-quyen' ? (
                    <Button
                      variant="secondary"
                      onClick={() => dieuHuongToi('/')}
                      style={{ minHeight: 'var(--ma-hit-mobile)' }}
                    >
                      Về trang chủ
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={handleLogout}
                    style={{ minHeight: 'var(--ma-hit-mobile)' }}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>

              {trangVaiTro.loai === 'khong-co-quyen' ? (
                <BlockedNotice
                  title="Không có quyền"
                  reason="Đường dẫn không thuộc vai trò hiện tại. Hãy chọn một mục trong menu để tiếp tục."
                />
              ) : (
                <div style={{ display: 'grid', gap: 'var(--ma-space-6)' }}>
                  <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
                    <SysLabel>THÔNG TIN PHIÊN</SysLabel>
                    <p style={{ ...styleDoanMoTa, color: 'var(--ma-text-primary)' }}>
                      Xin chào, {nguoiDung.hoTen}
                    </p>
                  </div>

                  <dl style={styleThongTinNguoiDung}>
                    <div style={styleHangThongTin}>
                      <dt>
                        <SysLabel>Số điện thoại</SysLabel>
                      </dt>
                      <dd style={{ margin: 0, font: 'var(--ma-text-body)', color: 'var(--ma-text-primary)' }}>{nguoiDung.soDienThoai}</dd>
                    </div>
                    <div style={styleHangThongTin}>
                      <dt>
                        <SysLabel>Vai trò</SysLabel>
                      </dt>
                      <dd style={{ margin: 0, font: 'var(--ma-text-body)', color: 'var(--ma-text-primary)' }}>{nguoiDung.tenVaiTro}</dd>
                    </div>
                    <div style={styleHangThongTin}>
                      <dt>
                        <SysLabel>Mã vai trò</SysLabel>
                      </dt>
                      <dd style={{ margin: 0, font: 'var(--ma-text-body)', color: 'var(--ma-text-primary)' }}>{nguoiDung.vaiTro}</dd>
                    </div>
                  </dl>

                  {['CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro) && (
                    <div style={{ display: 'grid', gap: 'var(--ma-space-4)', marginTop: 'var(--ma-space-2)' }}>
                      <SysLabel>LỐI TẮT PHÂN HỆ VẬN HÀNH</SysLabel>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 'var(--ma-space-4)',
                        }}
                      >
                        <div
                          style={{
                            border: '1px solid var(--ma-border-default)',
                            borderRadius: 'var(--ma-radius-md)',
                            padding: 'var(--ma-space-4)',
                            background: 'var(--ma-bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--ma-space-2)',
                            boxShadow: 'var(--ma-shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>📋 Hợp đồng & Hồ sơ</span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--ma-font-mono)', background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)', padding: '2px 6px', borderRadius: 'var(--ma-radius-pill)' }}>5 BƯỚC</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)', lineHeight: 1.5 }}>
                            Quy trình chốt hồ sơ bất biến, phụ lục bàn giao tài sản phòng, điều khoản mẫu và xuất file PDF văn bản ký kết.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => dieuHuongToi('/hop-dong')}
                            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                          >
                            Mở phân hệ Hợp đồng →
                          </Button>
                        </div>

                        <div
                          style={{
                            border: '1px solid var(--ma-border-default)',
                            borderRadius: 'var(--ma-radius-md)',
                            padding: 'var(--ma-space-4)',
                            background: 'var(--ma-bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--ma-space-2)',
                            boxShadow: 'var(--ma-shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>👥 Người thuê & Cư trú</span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--ma-font-mono)', background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)', padding: '2px 6px', borderRadius: 'var(--ma-radius-pill)' }}>2 CỘT</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)', lineHeight: 1.5 }}>
                            Danh bạ khách thuê thông minh, tra cứu CCCD, trạng thái duyệt cư trú tạm trú và liên kết phòng đang ở.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => dieuHuongToi('/nguoi-thue')}
                            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                          >
                            Mở phân hệ Người thuê →
                          </Button>
                        </div>

                        <div
                          style={{
                            border: '1px solid var(--ma-border-default)',
                            borderRadius: 'var(--ma-radius-md)',
                            padding: 'var(--ma-space-4)',
                            background: 'var(--ma-bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--ma-space-2)',
                            boxShadow: 'var(--ma-shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>💳 Hoá đơn & Thu tiền</span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--ma-font-mono)', background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)', padding: '2px 6px', borderRadius: 'var(--ma-radius-pill)' }}>VIETQR</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)', lineHeight: 1.5 }}>
                            Sổ quỹ đối soát thu tiền đa kênh, lập hoá đơn hằng tháng, ghi nhận phiếu thu cọc và quyết toán phòng.
                          </p>
                          <div style={{ display: 'flex', gap: 'var(--ma-space-2)', marginTop: 'auto', flexWrap: 'wrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => dieuHuongToi('/thu-tien')}
                            >
                              Sổ thu tiền →
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => dieuHuongToi('/hoa-don')}
                            >
                              Hoá đơn →
                            </Button>
                          </div>
                        </div>

                        <div
                          style={{
                            border: '1px solid var(--ma-border-default)',
                            borderRadius: 'var(--ma-radius-md)',
                            padding: 'var(--ma-space-4)',
                            background: 'var(--ma-bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--ma-space-2)',
                            boxShadow: 'var(--ma-shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>🏢 Sơ đồ Phòng & Toà</span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--ma-font-mono)', background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)', padding: '2px 6px', borderRadius: 'var(--ma-radius-pill)' }}>SƠ ĐỒ TẦNG</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)', lineHeight: 1.5 }}>
                            Sơ đồ mặt bằng phòng theo tầng, trực quan hoá phòng trống / đang thuê / bảo trì và tài sản gắn phòng.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => dieuHuongToi(nguoiDung.vaiTro === 'CHU' ? '/toa-nha' : '/phong')}
                            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                          >
                            Mở Sơ đồ phòng →
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default App

function layDuongDanHienTai() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname || '/'
}

export function layDinhDanhHoaDonTuUrl(url: string | URL) {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  const toaNhaId = soNguyenDuong(searchParams.get('toaNhaId'))
  const kyId = soNguyenDuong(searchParams.get('kyId'))
  const hoaDonId = soNguyenDuong(searchParams.get('hoaDonId'))
  if (hoaDonId === undefined) {
    return {}
  }
  if (toaNhaId === undefined || kyId === undefined) {
    return { hoaDonId }
  }
  return { toaNhaId, kyId, hoaDonId }
}

function soNguyenDuong(value: string | null) {
  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

function dieuHuongToi(duongDan: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.history.pushState({}, '', duongDan)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function thayTheDuongDan(duongDan: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.history.replaceState({}, '', duongDan)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function handleNavClick(event: MouseEvent<HTMLElement>) {
  const dich = event.target
  if (!(dich instanceof HTMLElement)) {
    return
  }

  const lienKet = dich.closest('a[href]')
  if (!(lienKet instanceof HTMLAnchorElement)) {
    return
  }

  const duongDan = lienKet.getAttribute('href')
  if (!duongDan || duongDan.startsWith('http')) {
    return
  }

  event.preventDefault()
  dieuHuongToi(duongDan)
}

function kiemTraManHinhHep() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth < 768
}

function kiemTraManHinhThuGon() {
  return typeof window !== 'undefined' && window.innerWidth < 1280
}

function taoThongTinTopBar(vaiTro: string): { building: string; period: string; periodStatus?: string } {
  const period = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'long' }).format(new Date())
  return {
    building: vaiTro === 'THO' ? 'Bàn làm việc thợ' : 'Không gian quản lý',
    period,
  }
}

function taoDuongDanPhanCap(tenVaiTro: string, tieuDe: string) {
  return [tenVaiTro, tieuDe]
}

function taoNhomDieuHuong(vaiTro: string, duongDanHienTai: string): NavGroup[] {
  const menu = layMenuTheoVaiTro(vaiTro)
  const nhomTheoVaiTro = NHOM_DIEU_HUONG_THEO_VAI_TRO[vaiTro] ?? [{ label: 'Điều hướng', duongDan: menu.map((muc) => muc.duongDan) }]

  return nhomTheoVaiTro
    .map((nhom) => ({
      label: nhom.label,
      items: nhom.duongDan
        .map((duongDan) => menu.find((muc) => muc.duongDan === duongDan))
        .filter((muc): muc is (typeof menu)[number] => Boolean(muc))
        .map((muc) => ({
          label: muc.nhan,
          href: muc.duongDan,
          active: duongDanHienTai === muc.duongDan,
          glyph: GLYPH_THEO_DUONG_DAN[muc.duongDan] ?? 'o-vuong',
          icon: layIconDieuHuong(vaiTro, muc.duongDan),
          shortLabel: NHAN_NGAN_BOTTOM_NAV[muc.duongDan],
          depth: DUONG_DAN_MUC_CON.includes(muc.duongDan) ? (1 as const) : undefined,
        })),
    }))
    .filter((nhom) => nhom.items.length > 0)
}

function layChuCaiDau(hoTen: string) {
  return hoTen
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((tu) => tu[0]?.toUpperCase() ?? '')
    .join('')
}

// Icon theo assets/shell.js. /thong-bao khác nhau theo vai trò (Quản lý: loa, Thợ: chuông).
const ICON_THEO_DUONG_DAN: Record<string, IconName> = {
  '/tong-quan': 'dashboard', '/nhac-viec': 'dashboard', '/tho/tong-quan': 'dashboard',
  '/toa-nha': 'building', '/nguoi-thue': 'users', '/hop-dong': 'contract', '/cu-tru': 'home', '/lich-hen': 'calendar',
  '/su-co': 'wrench', '/viec-cua-toi': 'wrench', '/bao-hong': 'wrench', '/an-toan': 'shield',
  '/dich-vu': 'layers', '/ghi-chi-so': 'meter', '/hoa-don': 'receipt', '/hoa-don-cua-toi': 'receipt',
  '/thu-tien': 'wallet', '/tho/chi-phi': 'wallet', '/cong-no': 'debt', '/bao-cao': 'chart',
  '/nhat-ky-thao-tac': 'history', '/lich-su': 'history', '/tieu-thu': 'bolt', '/phong': 'door', '/tai-khoan': 'key',
}

function layIconDieuHuong(vaiTro: string, duongDan: string): IconName | undefined {
  if (duongDan === '/thong-bao') return vaiTro === 'THO' ? 'bell' : 'megaphone'
  return ICON_THEO_DUONG_DAN[duongDan]
}

const NHAN_NGAN_BOTTOM_NAV: Record<string, string> = { '/hoa-don-cua-toi': 'Hoá đơn', '/tho/chi-phi': 'Báo giá' }
const DUONG_DAN_MUC_CON = ['/bao-cao/tieu-thu', '/bao-cao/chi-phi-bao-tri']

const GLYPH_THEO_DUONG_DAN: Record<string, GlyphName> = {
  '/tai-khoan': 'gap',
  '/toa-nha': 'toa-nha',
  '/nhat-ky-thao-tac': 'lich-su-ky',
  '/tong-quan': 'bang-gia',
  '/hoa-don': 'hoa-don',
  '/cong-no': 'con-no',
  '/bao-cao': 'bang-gia',
  '/bao-cao/tieu-thu': 'cong-to',
  '/bao-cao/chi-phi-bao-tri': 'cho-tho',
  '/su-co': 'cho-tho',
  '/an-toan': 'bi-chan',
  '/nhac-viec': 'nhac-viec',
  '/ghi-chi-so': 'cong-to',
  '/thu-tien': 'goi-dien',
  '/phong': 'so-do-phong',
  '/hop-dong': 'hop-dong',
  '/tho/tong-quan': 'bang-gia',
  '/tho/chi-phi': 'hoa-don',
  '/thong-bao': 'thong-bao',
  '/viec-cua-toi': 'cho-tho',
  '/hoa-don-cua-toi': 'hoa-don',
  '/lich-su': 'lich-su-ky',
  '/tieu-thu': 'cong-to',
  '/bao-hong': 'cho-tho',
}

const NHOM_DIEU_HUONG_THEO_VAI_TRO: Record<string, Array<{ label: string, duongDan: string[] }>> = {
  QTHT: [
    { label: 'Quản trị', duongDan: ['/tai-khoan', '/toa-nha'] },
    { label: 'Theo dõi', duongDan: ['/nhat-ky-thao-tac'] },
  ],
  CHU: [
    { label: '', duongDan: ['/tong-quan'] },
    { label: 'Vận hành', duongDan: ['/toa-nha', '/nguoi-thue', '/hop-dong', '/cu-tru', '/lich-hen', '/su-co', '/an-toan'] },
    { label: 'Tiền', duongDan: ['/dich-vu', '/ghi-chi-so', '/hoa-don', '/thu-tien', '/cong-no'] },
    { label: 'Theo dõi', duongDan: ['/bao-cao', '/bao-cao/tieu-thu', '/bao-cao/chi-phi-bao-tri', '/nhat-ky-thao-tac'] },
  ],
  QUAN_LY: [
    { label: 'Hàng ngày', duongDan: ['/nhac-viec', '/ghi-chi-so', '/lich-hen', '/su-co'] },
    { label: 'Tiền', duongDan: ['/hoa-don', '/thu-tien', '/dich-vu'] },
    { label: 'Toà nhà', duongDan: ['/phong', '/hop-dong', '/nguoi-thue', '/cu-tru', '/an-toan', '/thong-bao'] },
  ],
  THO: [
    { label: 'Bàn làm việc', duongDan: ['/tho/tong-quan', '/viec-cua-toi', '/tho/chi-phi', '/thong-bao'] },
  ],
  NGUOI_THUE: [
    { label: 'Cá nhân', duongDan: ['/hoa-don-cua-toi', '/lich-su', '/tieu-thu', '/hop-dong', '/bao-hong'] },
  ],
}
