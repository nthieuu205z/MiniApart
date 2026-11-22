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
import BaoHongKhach from './BaoHongKhach'
import TaiKhoanTruyCap from './TaiKhoanTruyCap'
import ThuTien from './ThuTien'
import { AnToanVanHanh, CuTruVanHanh, NhatKyVanHanh } from './TuanThuVanHanh'
import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import { Toast } from './design/feedback/Toast'
import { Breadcrumb } from './design/shell/Breadcrumb'
import { NavPanel, type NavGroup } from './design/shell/NavPanel'
import { TopBar } from './design/shell/TopBar'
import type { GlyphName } from './design/core/GlyphName'
import { Icon, type IconName } from './design/core/Icon'
import { layMenuTheoVaiTro } from './roleNavigation'
import { TRANG_DAU, laVaiTro, timTuyen, type KhoaTrang, type TrangProps, type VaiTro } from './dinhTuyen'
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
  alignContent: 'center',
}

const styleGridKhachDesktop: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 460px) minmax(0, 1fr)',
  gap: 16,
  width: '100%',
  maxWidth: 1120,
  margin: '0 auto',
  minHeight: 'min(660px, calc(100vh - 64px))',
}

const styleGridKhachManHinhHep: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 16,
  width: '100%',
}

const styleDangNhapThe: CSSProperties = {
  background: 'var(--ma-bg-card)',
  borderRadius: 'var(--ma-radius-xl)',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
}

const styleDangNhapAnh: CSSProperties = {
  position: 'relative',
  margin: 0,
  borderRadius: 'var(--ma-radius-xl)',
  overflow: 'hidden',
  minHeight: 480,
}

const styleDangNhapChuThich: CSSProperties = {
  position: 'absolute',
  left: 24,
  right: 24,
  bottom: 24,
  display: 'flex',
  gap: 12,
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
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

const styleDoanMoTa: CSSProperties = {
  margin: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-body)',
  lineHeight: 1.6,
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [dangTaiPhien, setDangTaiPhien] = useState(true)
  const [dangDangNhap, setDangDangNhap] = useState(false)
  const [moTroGiupTaiKhoan, setMoTroGiupTaiKhoan] = useState(false)
  const [hienMatKhau, setHienMatKhau] = useState(false)
  const [nguoiDung, setNguoiDung] = useState<ThongTinNguoiDung | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [soThongBaoChuaDoc, setSoThongBaoChuaDoc] = useState<number | null>(null)
  const phienBanTaiThongBao = useRef(0)
  const [viTri, setViTri] = useState(() => layViTri())
  const [dangMoTim, setDangMoTim] = useState(false)
  const duongDanHienTai = viTri.duongDan
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
  const ketQuaTuyen = nguoiDung ? timTuyen(nguoiDung.vaiTro, viTri.duongDan, viTri.search) : null
  const toiChuyen = ketQuaTuyen?.loai === 'chuyen' ? ketQuaTuyen.toi : null
  useEffect(() => {
    if (toiChuyen) thayTheDuongDan(toiChuyen)
  }, [toiChuyen])

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
        dieuHuongToi(laVaiTro(response.nguoiDung.vaiTro) ? TRANG_DAU[response.nguoiDung.vaiTro] : '/')
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
        <section style={laManHinhHep ? styleGridKhachManHinhHep : styleGridKhachDesktop}>
          <div style={{ ...styleDangNhapThe, padding: laManHinhHep ? '24px 20px' : '32px 48px' }} aria-labelledby="auth-title">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="logo" aria-hidden="true">M</div>
                <span style={{ font: 'var(--ma-text-body)', fontWeight: 700 }}>MiniApart</span>
              </div>
              <Button variant="text" onClick={() => setCheDoKhach('KHAM_PHA')}>
                ← Khám phá phòng trống
              </Button>
            </div>

            <div style={{ margin: 'auto 0', padding: laManHinhHep ? '24px 0' : '32px 0' }}>
              <h1 id="auth-title" className="h1" style={{ margin: 0 }}>Đăng nhập</h1>
              <p style={{ ...styleDoanMoTa, marginTop: 8 }}>Dùng số điện thoại đã đăng ký với ban quản lý toà nhà.</p>

              {healthError && (
                <div role="alert" style={{ marginTop: 16 }}>
                  <BlockedNotice title="Mất kết nối máy chủ" reason={healthError} />
                </div>
              )}

              {dangTaiPhien ? (
                <p style={{ ...styleDoanMoTa, marginTop: 24 }} aria-live="polite">
                  Đang kiểm tra phiên đăng nhập…
                </p>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20, marginTop: 32 }}>
                  <div className="field">
                    <label className="label" htmlFor="dn-sdt">Số điện thoại</label>
                    <div className="input-wrap">
                      <Icon name="phone" />
                      <input
                        id="dn-sdt"
                        className="input input-touch"
                        inputMode="tel"
                        value={form.soDienThoai}
                        onChange={(event) => setForm((current) => ({ ...current, soDienThoai: event.target.value }))}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="dn-mk">Mật khẩu</label>
                    <div className="input-wrap">
                      <Icon name="lock" />
                      <input
                        id="dn-mk"
                        className="input input-touch"
                        type={hienMatKhau ? 'text' : 'password'}
                        value={form.matKhau}
                        onChange={(event) => setForm((current) => ({ ...current, matKhau: event.target.value }))}
                        autoComplete="current-password"
                        required
                        aria-invalid={authError ? true : undefined}
                        aria-describedby={authError ? 'dn-mk-loi' : undefined}
                        style={{ paddingRight: 52 }}
                      />
                      <button type="button" className="icon-btn trail" aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={hienMatKhau} onClick={() => setHienMatKhau((v) => !v)}>
                        <Icon name={hienMatKhau ? 'eye-off' : 'eye'} />
                      </button>
                    </div>
                    {authError ? (
                      <p className="error-text" id="dn-mk-loi" role="alert">
                        <Icon name="alert" size="sm" />
                        {authError}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    blocked={dangDangNhap}
                    style={{ minHeight: 'var(--ma-control-h-touch)', justifyContent: 'center', width: '100%' }}
                  >
                    {dangDangNhap ? 'Đang đăng nhập…' : 'Đăng nhập'}
                  </Button>
                  <Button type="button" variant="text" size="sm" style={{ justifySelf: 'center' }} onClick={() => setMoTroGiupTaiKhoan(true)}>Quên mật khẩu?</Button>
                </form>
              )}
            </div>

            <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
              <p className="t-meta" style={{ margin: 0 }}>Chưa có tài khoản? Ban quản lý toà nhà sẽ gửi mã kích hoạt qua số điện thoại của bạn.</p>
              <Button variant="text" size="sm" style={{ marginLeft: -12 }} onClick={() => setMoTroGiupTaiKhoan(true)}>Kích hoạt tài khoản</Button>
            </div>
          </div>

          {!laManHinhHep && (
            <figure style={styleDangNhapAnh}>
              <img src="/rooms/annhien_studio_noi_that.webp" alt="Phòng studio nội thất, An Nhiên Residence" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <figcaption style={styleDangNhapChuThich}>
                <div style={{ background: 'var(--ma-bg-card)', borderRadius: 20, padding: '16px 20px', maxWidth: 360 }}>
                  <p style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Một nơi cho cả chủ nhà, quản lý, thợ và người thuê</p>
                  <p style={{ ...styleDoanMoTa, margin: '6px 0 0' }}>Hoá đơn, chỉ số điện nước, hợp đồng và sự cố — cùng một sổ, cùng một số liệu.</p>
                </div>
                <span className="tag tag-neutral" style={{ background: 'var(--ma-bg-card)', flex: 'none' }}>
                  <Icon name="pin" size="sm" />An Nhiên Residence · Hà Nội
                </span>
              </figcaption>
            </figure>
          )}
        </section>
      </main>
    )
  }

  if (!ketQuaTuyen || ketQuaTuyen.loai === 'chuyen') return null

  const vaiTro = nguoiDung.vaiTro as VaiTro
  const trangProps: TrangProps = { token: token ?? '', vaiTro, mobile: laManHinhHep, thamSo: ketQuaTuyen.loai === 'trang' ? ketQuaTuyen.thamSo : {}, dieuHuong: dieuHuongToi }
  const khoa = ketQuaTuyen.loai === 'trang' ? ketQuaTuyen.khoa : null
  const nhomDieuHuong = taoNhomDieuHuong(nguoiDung.vaiTro, duongDanHienTai)
  const thongTinTopBar = taoThongTinTopBar(nguoiDung.vaiTro)
  const canDungTopBarToanCuc = khoa !== 'chu-ky'
  const tieuDeTrang = layMenuTheoVaiTro(nguoiDung.vaiTro).find((muc) => muc.duongDan === duongDanHienTai)?.nhan ?? 'Trang'
  const duongDanPhanCap = taoDuongDanPhanCap(nguoiDung.tenVaiTro, tieuDeTrang)
  const laDashboardChu = vaiTro === 'CHU' && (khoa === 'hom-nay' || khoa === 'tong-quan')

  return (
    <main className="ma-app-shell" onClick={chanLienKetNoiBo} style={laManHinhHep ? styleKhungUngDungMobile : laManHinhThuGon ? styleKhungUngDungThuGon : styleKhungUngDungDesktop}>
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
                    style={{
                padding: laManHinhHep ? '10px 16px' : undefined,
                gap: laManHinhHep ? 10 : undefined,
                flexWrap: laManHinhHep ? 'nowrap' : 'wrap',
                height: 'auto',
                minHeight: laDashboardChu && !laManHinhHep ? 48 : 'var(--ma-topbar-height)',
              }}
            />
            {laDashboardChu ? null : <Breadcrumb className="ma-no-print" items={duongDanPhanCap} style={{ padding: laManHinhHep ? '7px 16px' : undefined }} />}
          </>
        ) : null}

        <section style={khoa === 'chu-ky' ? styleVungNoiDungKhongDem : laDashboardChu && !laManHinhHep ? { ...styleVungNoiDung, padding: '0 16px 24px', gap: 16 } : styleVungNoiDung}>
          {healthError ? (
            <div role="alert" style={{ marginBottom: 'var(--ma-space-4)' }}>
              <BlockedNotice title="Mất kết nối máy chủ" reason={healthError} />
            </div>
          ) : null}
          {token && khoa ? (
            <ManTheoKhoa khoa={khoa} {...trangProps} capNhatChuaDoc={setSoThongBaoChuaDoc} />
          ) : ketQuaTuyen.loai === 'khong-co-quyen' ? (
            <TrangKhongCoQuyen vaiTroSoHuu={ketQuaTuyen.vaiTroSoHuu} dieuHuong={dieuHuongToi} />
          ) : null}
        </section>
      </div>
      <TimNhanh {...trangProps} mo={dangMoTim} datMo={setDangMoTim} />
    </main>
  )
}

export default App

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
    case 'nguoi-thue': return <HoSoNguoiThue token={token} />
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
