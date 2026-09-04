import { FormEvent, useEffect, useState, type CSSProperties, type MouseEvent } from 'react'
import {
  ApiError,
  fetchCurrentUser,
  fetchHealth,
  login,
  type DangNhapRequest,
  type HealthStatus,
  type ThongTinNguoiDung,
} from './api'
import { clearStoredToken, readStoredToken, storeToken } from './authSession'
import DanhMucToaNha from './DanhMucToaNha'
import DanhMucPhong from './DanhMucPhong'
import GhiChiSo from './GhiChiSo'
import HoaDon from './HoaDon'
import QuanLyTaiKhoan from './QuanLyTaiKhoan'
import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import { SysLabel } from './design/core/SysLabel'
import { Toast } from './design/feedback/Toast'
import { Breadcrumb } from './design/shell/Breadcrumb'
import { NavPanel, type NavGroup } from './design/shell/NavPanel'
import { TopBar } from './design/shell/TopBar'
import type { GlyphName } from './design/core/GlyphName'
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
  gap: 'var(--ma-space-7)',
  gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
  alignItems: 'start',
}

const styleGridKhachManHinhHep: CSSProperties = {
  ...styleGridKhach,
  gridTemplateColumns: 'minmax(0, 1fr)',
}

const styleThe: CSSProperties = {
  border: '1px solid var(--ma-border-default)',
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
  overflowX: 'clip',
}

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
  paddingBottom: 'calc(var(--ma-hit-mobile) + var(--ma-space-6))',
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

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [dangTaiPhien, setDangTaiPhien] = useState(true)
  const [dangDangNhap, setDangDangNhap] = useState(false)
  const [nguoiDung, setNguoiDung] = useState<ThongTinNguoiDung | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [duongDanHienTai, setDuongDanHienTai] = useState(() => layDuongDanHienTai())
  const [laManHinhHep, setLaManHinhHep] = useState(() => kiemTraManHinhHep())
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
    if (typeof window === 'undefined') {
      return undefined
    }

    function dongBoKichThuoc() {
      setLaManHinhHep(kiemTraManHinhHep())
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
      dieuHuongToi('/')
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
    && nguoiDung.vaiTro === 'QUAN_LY',
  )
  const hienThiHoaDon = Boolean(
    token
    && nguoiDung
    && ['/hoa-don', '/hoa-don-cua-toi'].includes(duongDanHienTai)
    && ['QTHT', 'CHU', 'QUAN_LY', 'NGUOI_THUE'].includes(nguoiDung.vaiTro),
  )
  const tieuDeTheChinh = hienThiDanhMucToaNha
    ? 'Toà nhà'
    : hienThiDanhMucPhong
      ? 'Phòng'
      : hienThiGhiChiSo
        ? 'Ghi chỉ số'
        : hienThiHoaDon
          ? 'Hoá đơn'
          : nguoiDung && trangVaiTro ? trangVaiTro.tieuDe : 'Đăng nhập'
  const maTruyVetTheChinh = hienThiDanhMucToaNha
    ? 'FR-BLD-01'
    : hienThiDanhMucPhong
      ? 'FR-BLD-02'
      : hienThiGhiChiSo
        ? 'FR-MTR-01'
        : hienThiHoaDon
          ? 'FR-INV-02'
          : nguoiDung ? 'FR-AUT-04' : 'FR-AUT-01'

  if (!nguoiDung) {
    return (
      <main style={styleKhungKhach}>
        <section style={laManHinhHep ? styleGridKhachManHinhHep : styleGridKhach}>
          <article
            style={{
              ...styleTheNoiDung,
              display: 'grid',
              gap: 'var(--ma-space-7)',
              alignContent: 'start',
            }}
            aria-labelledby="app-title"
          >
            <div style={{ display: 'grid', gap: 'var(--ma-space-3)' }}>
              <SysLabel>QUẢN LÝ VẬN HÀNH</SysLabel>
              <h1 id="app-title" style={{ ...styleTieuDe, fontSize: 'clamp(32px, 7vw, 56px)' }}>
                MiniApart
              </h1>
              <p style={{ ...styleDoanMoTa, maxWidth: '34rem' }}>
                Một nơi rõ ràng để quản lý toà nhà, phòng và những khoản thu hằng tháng.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 'var(--ma-space-5)' }}>
              <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
                <SysLabel>{maTruyVetTheChinh}</SysLabel>
                <p style={{ ...styleDoanMoTa, color: 'var(--ma-text-primary)' }}>
                  Đăng nhập để vào đúng khu vực công việc theo vai trò, không đổi luồng phiên hiện có.
                </p>
              </div>
              <BlockedNotice
                title="Khung ứng dụng mới đã sẵn sàng"
                reason="Đăng nhập để mở menu theo vai trò, thanh đầu và vùng nội dung theo bộ kit mới."
              />
            </div>
          </article>

          <section style={{ ...styleTheNoiDung, display: 'grid', gap: 'var(--ma-space-6)' }} aria-labelledby="auth-title">
            <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
              <SysLabel>{maTruyVetTheChinh}</SysLabel>
              <h2 id="auth-title" style={{ margin: 0, font: 'var(--ma-text-block-title)', ...styleTieuDeKhoi }}>
                {tieuDeTheChinh}
              </h2>
            </div>

            {dangTaiPhien ? (
              <p style={styleDoanMoTa} aria-live="polite">
                Đang khôi phục phiên đăng nhập…
              </p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--ma-space-5)' }}>
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
                    <BlockedNotice title="Đăng nhập chưa thành công" reason={authError} />
                  </div>
                ) : (
                  <p style={styleDoanMoTa}>Nhập số điện thoại và mật khẩu để tiếp tục.</p>
                )}

                <Button
                  type="submit"
                  blocked={dangDangNhap}
                  style={{ minHeight: 'var(--ma-hit-mobile)', justifyContent: 'center', width: '100%' }}
                >
                  {dangDangNhap ? 'Đang đăng nhập…' : 'Đăng nhập'}
                </Button>
              </form>
            )}
          </section>
        </section>

        <section style={styleTheNoiDung} aria-labelledby="status-title">
          {renderTrangThaiHeThong(health, healthError)}
        </section>
      </main>
    )
  }

  const nhomDieuHuong = taoNhomDieuHuong(nguoiDung.vaiTro, duongDanHienTai)
  const thongTinTopBar = taoThongTinTopBar(nguoiDung.vaiTro)
  const canDungTopBarToanCuc = !hienThiGhiChiSo
  const duongDanPhanCap = taoDuongDanPhanCap(nguoiDung.tenVaiTro, tieuDeTheChinh)

  return (
    <main style={laManHinhHep ? styleKhungUngDungMobile : styleKhungUngDungDesktop}>
      <NavPanel
        mobile={laManHinhHep}
        aria-label="Điều hướng theo vai trò"
        groups={nhomDieuHuong}
        subtitle={nguoiDung.tenVaiTro}
        user={{
          initials: layChuCaiDau(nguoiDung.hoTen),
          name: nguoiDung.hoTen,
          role: nguoiDung.tenVaiTro,
        }}
        onClick={handleNavClick}
        style={{
          width: laManHinhHep ? '100%' : 'var(--ma-nav-width)',
          minWidth: 0,
          borderRight: laManHinhHep ? undefined : '1px solid var(--ma-border-default)',
        }}
      />

      <div style={laManHinhHep ? styleCotNoiDungMobile : styleCotNoiDung}>
        {canDungTopBarToanCuc ? (
          <>
            <TopBar
              building={thongTinTopBar.building}
              period={thongTinTopBar.period}
              periodStatus={thongTinTopBar.periodStatus}
              style={{
                padding: laManHinhHep ? '10px 16px' : undefined,
                gap: laManHinhHep ? 10 : undefined,
                flexWrap: 'wrap',
                height: 'auto',
                minHeight: 'var(--ma-topbar-height)',
              }}
            />
            <Breadcrumb items={duongDanPhanCap} style={{ padding: laManHinhHep ? '7px 16px' : undefined }} />
          </>
        ) : null}

        <section style={hienThiGhiChiSo ? styleVungNoiDungKhongDem : styleVungNoiDung}>
          {hienThiDanhMucToaNha && token ? (
            <DanhMucToaNha token={token} vaiTro={nguoiDung.vaiTro} />
          ) : hienThiDanhMucPhong && token ? (
            <DanhMucPhong token={token} />
          ) : hienThiGhiChiSo && token ? (
            <GhiChiSo token={token} />
          ) : hienThiHoaDon && token ? (
            <HoaDon token={token} {...dinhDanhHoaDon} />
          ) : nguoiDung.vaiTro === 'QTHT' && duongDanHienTai === '/tai-khoan' && token ? (
            <QuanLyTaiKhoan token={token} />
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
                  <SysLabel>{maTruyVetTheChinh}</SysLabel>
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
                </div>
              )}
            </section>
          ) : null}

          <section style={styleTheNoiDung} aria-labelledby="status-title">
            {renderTrangThaiHeThong(health, healthError)}
          </section>
        </section>
      </div>
    </main>
  )
}

export default App

function renderTrangThaiHeThong(health: HealthStatus | null, healthError: string | null) {
  return (
    <div style={{ display: 'grid', gap: 'var(--ma-space-5)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 'var(--ma-space-4)',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
          <SysLabel>BẢN KIỂM TRA KẾT NỐI</SysLabel>
          <h2 id="status-title" style={{ margin: 0, font: 'var(--ma-text-block-title)', ...styleTieuDeKhoi }}>
            Trạng thái hệ thống
          </h2>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 'var(--ma-hit-mobile)',
            padding: '0 var(--ma-space-4)',
            border: '1px solid',
            borderColor: health ? 'var(--ma-done-text)' : 'var(--ma-waiting-border)',
            background: health ? 'var(--ma-done-bg)' : 'var(--ma-bg-sunken)',
            color: health ? 'var(--ma-done-text)' : 'var(--ma-waiting)',
            fontFamily: 'var(--ma-font-mono)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 'var(--ma-tracking-syslabel)',
            textTransform: 'uppercase',
          }}
        >
          {health ? 'Đang hoạt động' : healthError ? 'Cần kiểm tra' : 'Đang kiểm tra'}
        </span>
      </div>

      {healthError ? (
        <div role="alert">
          <BlockedNotice title="Không thể lấy trạng thái từ máy chủ" reason={healthError} />
        </div>
      ) : health ? (
        <dl style={styleThongTinNguoiDung}>
          <div style={styleHangThongTin}>
            <dt>
              <SysLabel>Ứng dụng</SysLabel>
            </dt>
            <dd style={{ margin: 0, font: 'var(--ma-text-body)', color: 'var(--ma-done-text)' }}>{health.status}</dd>
          </div>
          <div style={styleHangThongTin}>
            <dt>
              <SysLabel>Cơ sở dữ liệu</SysLabel>
            </dt>
            <dd style={{ margin: 0, font: 'var(--ma-text-body)', color: 'var(--ma-done-text)' }}>{health.database}</dd>
          </div>
        </dl>
      ) : (
        <Toast>Đang lấy trạng thái từ máy chủ…</Toast>
      )}
    </div>
  )
}

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
  if (toaNhaId === undefined || kyId === undefined || hoaDonId === undefined) {
    return {}
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

function taoThongTinTopBar(vaiTro: string) {
  switch (vaiTro) {
    case 'QTHT':
      return {
        building: 'Toàn hệ thống',
        period: 'Kỳ 09/2026',
      }
    case 'CHU':
      return {
        building: 'Cụm toà sở hữu',
        period: 'Kỳ 09/2026',
      }
    case 'QUAN_LY':
      return {
        building: 'Toà đang quản lý',
        period: 'Kỳ 09/2026',
        periodStatus: 'Đang mở',
      }
    case 'THO':
      return {
        building: 'Toà được phân công',
        period: 'Ca hiện tại',
      }
    case 'NGUOI_THUE':
      return {
        building: 'Toà đang ở',
        period: 'Kỳ 09/2026',
      }
    default:
      return {
        building: 'MiniApart',
        period: 'Kỳ hiện tại',
      }
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

const GLYPH_THEO_DUONG_DAN: Record<string, GlyphName> = {
  '/tai-khoan': 'gap',
  '/toa-nha': 'toa-nha',
  '/nhat-ky-thao-tac': 'lich-su-ky',
  '/tong-quan': 'bang-gia',
  '/hoa-don': 'hoa-don',
  '/cong-no': 'con-no',
  '/bao-cao': 'bang-gia',
  '/su-co': 'cho-tho',
  '/an-toan': 'bi-chan',
  '/nhac-viec': 'nhac-viec',
  '/ghi-chi-so': 'cong-to',
  '/thu-tien': 'goi-dien',
  '/phong': 'so-do-phong',
  '/hop-dong': 'hop-dong',
  '/thong-bao': 'thong-bao',
  '/viec-cua-toi': 'cho-tho',
  '/hoa-don-cua-toi': 'hoa-don',
  '/lich-su': 'lich-su-ky',
  '/bao-hong': 'cho-tho',
}

const NHOM_DIEU_HUONG_THEO_VAI_TRO: Record<string, Array<{ label: string, duongDan: string[] }>> = {
  QTHT: [
    { label: 'Quản trị', duongDan: ['/tai-khoan', '/toa-nha'] },
    { label: 'Theo dõi', duongDan: ['/nhat-ky-thao-tac'] },
  ],
  CHU: [
    { label: 'Tổng quan', duongDan: ['/tong-quan', '/toa-nha'] },
    { label: 'Tiền', duongDan: ['/hoa-don', '/cong-no', '/bao-cao'] },
    { label: 'Vận hành', duongDan: ['/su-co', '/an-toan'] },
  ],
  QUAN_LY: [
    { label: 'Hàng ngày', duongDan: ['/nhac-viec', '/ghi-chi-so'] },
    { label: 'Tiền', duongDan: ['/hoa-don', '/thu-tien'] },
    { label: 'Toà nhà', duongDan: ['/phong', '/hop-dong', '/su-co', '/thong-bao'] },
  ],
  THO: [
    { label: 'Công việc', duongDan: ['/viec-cua-toi'] },
  ],
  NGUOI_THUE: [
    { label: 'Cá nhân', duongDan: ['/hoa-don-cua-toi', '/lich-su', '/hop-dong', '/bao-hong'] },
  ],
}
