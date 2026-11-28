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
import BaoHongKhach from './BaoHongKhach'
import TaiKhoanTruyCap from './TaiKhoanTruyCap'
import ThuTien from './ThuTien'
import { AnToanVanHanh, CuTruVanHanh, NhatKyVanHanh } from './TuanThuVanHanh'
import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import { Toast } from './design/feedback/Toast'
import { ChonToa } from './design/shell/ChonToa'
import { NavPanel, type NavGroup, type NavItem } from './design/shell/NavPanel'
import { TabTrang } from './design/shell/TabTrang'
import { TopBar } from './design/shell/TopBar'
import { Icon } from './design/core/Icon'
import { layCauHinhDieuHuong, mucDangChon, timMucTheoDuongDan, type MucDieuHuong } from './roleNavigation'
import { TRANG_DAU, laVaiTro, timTuyen, type KetQuaTuyen, type KhoaTrang, type TrangProps, type VaiTro } from './dinhTuyen'
import { useSoDemDieuHuong } from './soDemDieuHuong'
import { matDoTheoVaiTro } from './matDo'
import CongKhaiKhung from './congKhai/CongKhaiKhung'
import TrangChu from './congKhai/TrangChu'
import TimPhong from './congKhai/TimPhong'
import ChiTietPhong from './congKhai/ChiTietPhong'
import CongCuDan from './congKhai/CongCuDan'
import { layTuyenCongKhai } from './congKhai/tuyen'
import ChuongThongBao from './ChuongThongBao'
import HomNay from './HomNay'
import ChuKyThang from './ChuKyThang'
import HoSoNguoiThue360 from './HoSoNguoiThue360'
import HoSoPhong360 from './HoSoPhong360'
import HoSoHopDong360 from './HoSoHopDong360'
import HoSoToa360 from './HoSoToa360'
import TaoHopDong from './TaoHopDong'
import TrangSuCo from './TrangSuCo'
import TimNhanh from './TimNhanh'
import TrangKhongCoQuyen from './TrangKhongCoQuyen'
import { ToaDangChonProvider, useToaDangChon } from './toaDangChon'

const styleTrang: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--ma-bg-page)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
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
  display: 'grid',
  alignContent: 'start',
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
  const [viTri, setViTri] = useState(() => layViTri())
  const duongDanHienTai = viTri.duongDan
  const [laManHinhHep, setLaManHinhHep] = useState(() => kiemTraManHinhHep())
  const [laManHinhThuGon, setLaManHinhThuGon] = useState(() => kiemTraManHinhThuGon())
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
      setViTri(layViTri())
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

  // Bảng định tuyến quyết định; đường dẫn cũ đã gộp thì thay thế (không thêm mục lịch sử) rồi đọc lại.
  // Trang công khai (/, /tim-phong, /phong-trong/:id) ai cũng xem được, kể cả người đã đăng nhập: không chuyển hướng họ đi.
  const tuyenCongKhai = layTuyenCongKhai(duongDanHienTai)
  const laCongKhaiMo = tuyenCongKhai !== null && tuyenCongKhai.loai !== 'dang-nhap'
  const ketQuaTuyen = nguoiDung && !tuyenCongKhai ? timTuyen(nguoiDung.vaiTro, viTri.duongDan, viTri.search) : null
  const toiChuyen = ketQuaTuyen?.loai === 'chuyen' ? ketQuaTuyen.toi : null
  useEffect(() => {
    if (toiChuyen) thayTheDuongDan(toiChuyen)
  }, [toiChuyen])

  // Đường dẫn cũ /kham-pha → /tim-phong (giữ query); đã đăng nhập mà vào /dang-nhap → trang đầu theo vai;
  // chưa có phiên mà vào trang của app → /dang-nhap (chờ kiểm tra phiên xong để không đá nhầm người đã đăng nhập).
  const trangDauTheoVai = nguoiDung && laVaiTro(nguoiDung.vaiTro) ? TRANG_DAU[nguoiDung.vaiTro] : null
  useEffect(() => {
    if (duongDanHienTai === '/kham-pha') thayTheDuongDan(`/tim-phong${viTri.search}`)
    else if (nguoiDung && duongDanHienTai === '/dang-nhap') thayTheDuongDan(trangDauTheoVai ?? '/')
    else if (!nguoiDung && !dangTaiPhien && !tuyenCongKhai && duongDanHienTai !== '/kham-pha') thayTheDuongDan('/dang-nhap')
  }, [duongDanHienTai, viTri.search, nguoiDung, dangTaiPhien, tuyenCongKhai, trangDauTheoVai])

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
      thayTheDuongDan(laVaiTro(response.nguoiDung.vaiTro) ? TRANG_DAU[response.nguoiDung.vaiTro] : '/')
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


  if (!nguoiDung && moTroGiupTaiKhoan) return <TaiKhoanTruyCap onLogin={() => { setMoTroGiupTaiKhoan(false); thayTheDuongDan('/dang-nhap') }} />

  if (tuyenCongKhai && (laCongKhaiMo || !nguoiDung)) {
    return (
      <CongKhaiKhung nguoiDung={nguoiDung} trangDau={trangDauTheoVai} duongDan={duongDanHienTai} search={viTri.search} onClick={chanLienKetNoiBo}>
        {tuyenCongKhai.loai === 'trang-chu' ? <TrangChu />
          : tuyenCongKhai.loai === 'tim-phong' ? <TimPhong key={viTri.search} search={viTri.search} />
          : tuyenCongKhai.loai === 'phong' ? <ChiTietPhong id={tuyenCongKhai.id} />
          : <CongCuDan form={form} setForm={setForm} onSubmit={handleSubmit} dangDangNhap={dangDangNhap} dangTaiPhien={dangTaiPhien} authError={authError} healthError={healthError} onTroGiup={() => setMoTroGiupTaiKhoan(true)} />}
      </CongKhaiKhung>
    )
  }
  if (!nguoiDung) return null

  if (!ketQuaTuyen || ketQuaTuyen.loai === 'chuyen') return null

  return (
    <ToaDangChonProvider token={token} vaiTro={nguoiDung.vaiTro} search={viTri.search}>
      <KhungUngDung
        nguoiDung={nguoiDung}
        token={token}
        viTri={viTri}
        ketQuaTuyen={ketQuaTuyen}
        laManHinhHep={laManHinhHep}
        laManHinhThuGon={laManHinhThuGon}
        healthError={healthError}
        soThongBaoChuaDoc={soThongBaoChuaDoc}
        capNhatChuaDoc={setSoThongBaoChuaDoc}
        onLogout={handleLogout}
      />
    </ToaDangChonProvider>
  )
}

export default App

type KhungProps = {
  nguoiDung: ThongTinNguoiDung
  token: string | null
  viTri: { duongDan: string; search: string }
  ketQuaTuyen: Exclude<KetQuaTuyen, { loai: 'chuyen' }>
  laManHinhHep: boolean
  laManHinhThuGon: boolean
  healthError: string | null
  soThongBaoChuaDoc: number | null
  capNhatChuaDoc: (n: number) => void
  onLogout: () => void
}

/** Khung sau đăng nhập: sidebar nhóm theo việc (hoặc bottom-nav cho Thợ/Khách), thanh trên, tab trang, nội dung. */
function KhungUngDung({ nguoiDung, token, viTri, ketQuaTuyen, laManHinhHep, laManHinhThuGon, healthError, soThongBaoChuaDoc, capNhatChuaDoc, onLogout }: KhungProps) {
  const [dangMoTim, setDangMoTim] = useState(false)
  const [moNgan, setMoNgan] = useState(false)
  const toa = useToaDangChon()
  const vaiTro = nguoiDung.vaiTro as VaiTro
  const duongDan = viTri.duongDan
  const soDem = useSoDemDieuHuong(token, vaiTro, toa.toaNhaId, duongDan)
  const cauHinh = layCauHinhDieuHuong(vaiTro)
  const coThanhDuoi = laManHinhHep && cauHinh.bottomNav
  const coNgan = laManHinhHep && !cauHinh.bottomNav
  const quanLy = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'
  const khoa = ketQuaTuyen.loai === 'trang' ? ketQuaTuyen.khoa : null
  const trangProps: TrangProps = { token: token ?? '', vaiTro, mobile: laManHinhHep, thamSo: ketQuaTuyen.loai === 'trang' ? ketQuaTuyen.thamSo : {}, dieuHuong: dieuHuongToi }

  // Sang trang khác hoặc về màn rộng thì ngăn menu tự đóng.
  useEffect(() => { setMoNgan(false) }, [duongDan, coNgan])

  const taoMuc = (muc: MucDieuHuong): NavItem => ({
    label: muc.dem === 'chuKy' && soDem.thangMo ? `Tháng ${soDem.thangMo}` : muc.nhan, // nhãn tĩnh = tháng hiện tại, dùng khi chưa tải tháng
    href: muc.duongDan,
    active: mucDangChon(muc, duongDan),
    glyph: 'o-vuong',
    icon: muc.icon,
    shortLabel: muc.nhanNgan,
    count: muc.dem ? soDem[muc.dem] : undefined,
    hot: muc.nong,
  })
  const nhomDieuHuong: NavGroup[] = cauHinh.nhom.map((nhom) => ({ label: nhom.nhan, items: nhom.muc.map(taoMuc) }))
  // Đáy điện thoại của Chủ: chỉ vài mục + "Thêm" mở ngăn nav đầy đủ.
  const nhomThanhDuoi: NavGroup[] = nhomDieuHuong.map((n) => ({ ...n, items: cauHinh.thanhDuoi ? n.items.filter((i) => cauHinh.thanhDuoi!.includes(i.href ?? '')) : n.items }))
  const chanSidebar = cauHinh.chanSidebar.map(taoMuc)
  const nutDangXuat = coThanhDuoi || !quanLy ? onLogout : undefined
  const tieuDeTrang = timMucTheoDuongDan(vaiTro, duongDan)?.nhan

  const nguoi = { initials: layChuCaiDau(nguoiDung.hoTen), name: nguoiDung.hoTen, role: nguoiDung.tenVaiTro }
  const oChonToa = quanLy ? <ChonToa collapsed={laManHinhThuGon && !coNgan} /> : undefined
  const kieuNav = coThanhDuoi ? 'bar' : coNgan ? 'drawer' : 'side'

  return (
    <main className="ma-app-shell" data-bottom-nav={coThanhDuoi ? '' : undefined} data-density={matDoTheoVaiTro(vaiTro, laManHinhHep)} onClick={chanLienKetNoiBo} style={laManHinhHep ? styleKhungUngDungMobile : laManHinhThuGon ? styleKhungUngDungThuGon : styleKhungUngDungDesktop}>
      <NavPanel
        className="ma-no-print"
        variant={kieuNav}
        aria-label="Điều hướng theo vai trò"
        groups={kieuNav === 'bar' ? nhomThanhDuoi : nhomDieuHuong}
        onThem={kieuNav === 'bar' && cauHinh.thanhDuoi ? () => setMoNgan(true) : undefined}
        footerItems={chanSidebar}
        toa={oChonToa}
        user={nguoi}
        collapsed={laManHinhThuGon && !coNgan}
        open={moNgan}
        onClose={() => setMoNgan(false)}
        onLogout={onLogout}
        style={{ width: laManHinhHep ? '100%' : 'var(--ma-nav-width)', minWidth: 0 }}
      />

      {coThanhDuoi && cauHinh.thanhDuoi ? (
        <NavPanel className="ma-no-print" variant="drawer" aria-label="Điều hướng theo vai trò" groups={nhomDieuHuong} footerItems={chanSidebar} toa={oChonToa} user={nguoi} open={moNgan} onClose={() => setMoNgan(false)} onLogout={onLogout} />
      ) : null}

      <div style={coThanhDuoi ? styleCotNoiDungMobile : styleCotNoiDung}>
        <TopBar
          className="ma-no-print"
          tieuDe={laManHinhHep && !quanLy && vaiTro !== 'QTHT' ? tieuDeTrang : undefined}
          onMoMenu={coNgan ? () => setMoNgan(true) : undefined}
          menuDangMo={moNgan}
          onTim={quanLy ? () => setDangMoTim(true) : undefined}
          chuong={quanLy || vaiTro === 'THO' || vaiTro === 'NGUOI_THUE' ? <ChuongThongBao {...trangProps} /> : undefined}
          notifications={soThongBaoChuaDoc ?? undefined}
          notificationHref={['CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE'].includes(vaiTro) ? '/thong-bao' : undefined}
          onLogout={nutDangXuat}
          style={{ padding: laManHinhHep ? '8px 16px' : undefined }}
        />

        <section className="ma-vung-noi-dung" style={styleVungNoiDung}>
          {healthError ? (
            <div role="alert" style={{ marginBottom: 'var(--ma-space-4)' }}>
              <BlockedNotice title="Mất kết nối máy chủ" reason={healthError} />
            </div>
          ) : null}
          <TabTrang vaiTro={vaiTro} duongDan={duongDan} search={viTri.search} className="ma-no-print" />
          {token && khoa ? (
            <ManTheoKhoa khoa={khoa} {...trangProps} capNhatChuaDoc={capNhatChuaDoc} />
          ) : ketQuaTuyen.loai === 'khong-co-quyen' ? (
            <TrangKhongCoQuyen vaiTro={vaiTro} vaiTroSoHuu={ketQuaTuyen.vaiTroSoHuu} duongDan={duongDan} dieuHuong={dieuHuongToi} />
          ) : null}
        </section>
      </div>
      <TimNhanh {...trangProps} mo={dangMoTim} datMo={setDangMoTim} />
    </main>
  )
}

/** Một `switch` duy nhất khoá → màn. Màn cũ nhận đúng props cũ; vỏ mới nhận `TrangProps`. */
function ManTheoKhoa({ khoa, capNhatChuaDoc, ...p }: TrangProps & { khoa: KhoaTrang; capNhatChuaDoc: (n: number) => void }) {
  const { token, vaiTro, mobile } = p
  switch (khoa) {
    case 'hom-nay': return <HomNay {...p} />
    case 'tong-quan': return <ChuDashboard token={token} mobile={mobile} />
    case 'chu-ky': return <ChuKyThang {...p} />
    case 'thu-tien': return <ThuTien token={token} mobile={mobile} vaiTro={vaiTro} />
    case 'hoa-don': return <ManHoaDon {...p} />
    case 'toa-nha': return <DanhMucToaNha token={token} vaiTro={vaiTro} mobile={mobile} />
    case 'ho-so-toa': return <HoSoToa360 {...p} />
    case 'phong': return <DanhMucPhong token={token} mobile={mobile} />
    case 'ho-so-phong': return <HoSoPhong360 {...p} />
    case 'nguoi-thue': return <HoSoNguoiThue token={token} vaiTro={vaiTro} />
    case 'ho-so-nguoi-thue': return <HoSoNguoiThue360 {...p} />
    case 'cu-tru': return <CuTruVanHanh token={token} />
    case 'hop-dong': return <HopDongQuanLy token={token} mobile={mobile} />
    case 'tao-hop-dong': return <TaoHopDong {...p} />
    case 'ho-so-hop-dong': return <HoSoHopDong360 {...p} />
    case 'lich-hen': return <QuanLyLichHen token={token} mobile={mobile} />
    case 'su-co': return <TrangSuCo {...p} />
    case 'an-toan': return <AnToanVanHanh token={token} vaiTro={vaiTro} />
    case 'dich-vu': return <DichVuVaKy token={token} />
    case 'thong-bao': return <ThongBao token={token} mobile={mobile} vaiTro={vaiTro} onUnreadCountChange={capNhatChuaDoc} />
    case 'bao-cao': return <BaoCaoTongQuan token={token} mobile={mobile} />
    case 'bao-cao-tieu-thu': return <TieuThuBaoCao token={token} mobile={mobile} />
    case 'bao-cao-chi-phi': return <ChiPhiBaoTriBaoCao token={token} mobile={mobile} />
    case 'nhat-ky': return <NhatKyVanHanh token={token} />
    case 'tai-khoan': return <QuanLyTaiKhoan token={token} mobile={mobile} />
    case 'viec-tho': return <ThoCongViec token={token} mobile={mobile} />
    case 'tien-cong': return <ThoChiPhi token={token} mobile={mobile} onNavigateToTicket={(id) => p.dieuHuong(`/viec-cua-toi?yeuCauId=${id}`)} />
    case 'can-tra': return <ManHoaDon {...p} />
    case 'lich-su-hoa-don': return <LichSuHoaDon token={token} mobile={mobile} />
    case 'bao-hong': return <BaoHongKhach token={token} />
    case 'hop-dong-cua-toi': return <HopDongNguoiThue token={token} mobile={mobile} />
    case 'tieu-thu-cua-toi': return <BieuDoTieuThu token={token} mobile={mobile} />
  }
}

/** Hoá đơn: danh sách (Chủ/QL) hay chi tiết theo `?hoaDonId=…` như app cũ. */
function ManHoaDon({ token, vaiTro, mobile }: TrangProps) {
  const dinhDanh = layDinhDanhHoaDonTuUrl(window.location.href)
  const laDrillDownCongNo = vaiTro === 'CHU' && dinhDanh.hoaDonId !== undefined && (dinhDanh.toaNhaId === undefined || dinhDanh.kyId === undefined)
  const quanLy = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'
  const day = dinhDanh.toaNhaId !== undefined && dinhDanh.kyId !== undefined && dinhDanh.hoaDonId !== undefined
  if (quanLy && !day && !laDrillDownCongNo) return <HoaDonQuanLy token={token} mobile={mobile} vaiTro={vaiTro} />
  return <HoaDon token={token} {...dinhDanh} vaiTro={vaiTro} mobile={mobile} cheDoNguoiThue={vaiTro === 'NGUOI_THUE'} cheDoCongNo={laDrillDownCongNo} />
}

function layViTri() {
  if (typeof window === 'undefined') return { duongDan: '/', search: '' }
  return { duongDan: window.location.pathname || '/', search: window.location.search }
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

// Chặn click vào <a href> nội bộ (cùng origin, không target/download, không phím bổ trợ) để điều hướng SPA.
function chanLienKetNoiBo(event: MouseEvent<HTMLElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const dich = event.target
  if (!(dich instanceof Element)) return
  const lienKet = dich.closest('a[href]')
  if (!(lienKet instanceof HTMLAnchorElement) || (lienKet.target && lienKet.target !== '_self') || lienKet.hasAttribute('download')) return
  const url = new URL(lienKet.href, window.location.href)
  if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return
  event.preventDefault()
  dieuHuongToi(url.pathname + url.search + url.hash)
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

function layChuCaiDau(hoTen: string) {
  return hoTen
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((tu) => tu[0]?.toUpperCase() ?? '')
    .join('')
}
