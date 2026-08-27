import { FormEvent, useEffect, useState } from 'react'
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
import QuanLyTaiKhoan from './QuanLyTaiKhoan'
import { layMenuTheoVaiTro, xacDinhTrangTheoVaiTro } from './roleNavigation'
import './styles.css'

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [dangTaiPhien, setDangTaiPhien] = useState(true)
  const [dangDangNhap, setDangDangNhap] = useState(false)
  const [nguoiDung, setNguoiDung] = useState<ThongTinNguoiDung | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [duongDanHienTai, setDuongDanHienTai] = useState(() => layDuongDanHienTai())
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
  const hienThiDanhMucToaNha = Boolean(
    token
    && nguoiDung
    && duongDanHienTai === '/toa-nha'
    && ['QTHT', 'CHU', 'QUAN_LY'].includes(nguoiDung.vaiTro),
  )
  const tieuDeTheChinh = hienThiDanhMucToaNha ? 'Toà nhà' : nguoiDung && trangVaiTro ? trangVaiTro.tieuDe : 'Đăng nhập'
  const maTruyVetTheChinh = hienThiDanhMucToaNha ? 'FR-BLD-01' : nguoiDung ? 'FR-AUT-04' : 'FR-AUT-01'

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">QUẢN LÝ VẬN HÀNH</p>
        <h1 id="app-title">MiniApart</h1>
        <p className="hero-copy">
          Một nơi rõ ràng để quản lý toà nhà, phòng và những khoản thu hằng tháng.
        </p>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="status-card__heading">
          <div>
            <p className="eyebrow">{maTruyVetTheChinh}</p>
            <h2 id="auth-title">{tieuDeTheChinh}</h2>
          </div>
          {nguoiDung ? (
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Đăng xuất
            </button>
          ) : null}
        </div>

        {dangTaiPhien ? (
          <p className="status-message" aria-live="polite">
            Đang khôi phục phiên đăng nhập…
          </p>
        ) : nguoiDung ? (
          <div className="dashboard-panel">
            <div className="welcome-panel">
              <p className="welcome-title">Xin chào, {nguoiDung.hoTen}</p>
              <p className="welcome-copy">Vai trò hiện tại: {nguoiDung.tenVaiTro}</p>
              <dl className="identity-list">
                <div>
                  <dt>Số điện thoại</dt>
                  <dd>{nguoiDung.soDienThoai}</dd>
                </div>
                <div>
                  <dt>Mã vai trò</dt>
                  <dd>{nguoiDung.vaiTro}</dd>
                </div>
              </dl>
            </div>

            <nav className="role-menu" aria-label="Điều hướng theo vai trò">
              {menuVaiTro.map((muc) => {
                const dangChon = duongDanHienTai === muc.duongDan

                return (
                  <a
                    key={muc.duongDan}
                    href={muc.duongDan}
                    className={`role-menu__link ${dangChon ? 'role-menu__link--active' : ''}`}
                    aria-current={dangChon ? 'page' : undefined}
                    onClick={(event) => {
                      event.preventDefault()
                      dieuHuongToi(muc.duongDan)
                    }}
                  >
                    {muc.nhan}
                  </a>
                )
              })}
            </nav>

            {hienThiDanhMucToaNha && token && nguoiDung ? (
              <DanhMucToaNha token={token} vaiTro={nguoiDung.vaiTro} />
            ) : nguoiDung.vaiTro === 'QTHT' && duongDanHienTai === '/tai-khoan' && token ? (
              <QuanLyTaiKhoan token={token} />
            ) : trangVaiTro ? (
              <section
                className={`route-panel route-panel--${trangVaiTro.loai}`}
                aria-labelledby="current-route-title"
              >
                <h3 id="current-route-title" className="route-panel__title">
                  {trangVaiTro.tieuDe}
                </h3>
                <p className="status-message">{trangVaiTro.thongDiep}</p>
                {trangVaiTro.loai === 'khong-co-quyen' ? (
                  <button type="button" className="ghost-button" onClick={() => dieuHuongToi('/')}>
                    Về trang chủ
                  </button>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Số điện thoại</span>
              <input
                value={form.soDienThoai}
                onChange={(event) => setForm((current) => ({ ...current, soDienThoai: event.target.value }))}
                placeholder="0900000003"
                autoComplete="username"
                required
              />
            </label>

            <label className="field">
              <span>Mật khẩu</span>
              <input
                type="password"
                value={form.matKhau}
                onChange={(event) => setForm((current) => ({ ...current, matKhau: event.target.value }))}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
              />
            </label>

            {authError ? (
              <p className="status-message status-message--error" role="alert">
                {authError}
              </p>
            ) : (
              <p className="status-message">Nhập số điện thoại và mật khẩu để tiếp tục.</p>
            )}

            <button type="submit" className="primary-button" disabled={dangDangNhap}>
              {dangDangNhap ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        )}
      </section>

      <section className="status-card" aria-labelledby="status-title">
        <div className="status-card__heading">
          <div>
            <p className="eyebrow">BẢN KIỂM TRA KẾT NỐI</p>
            <h2 id="status-title">Trạng thái hệ thống</h2>
          </div>
          <span className={`status-badge ${health ? 'status-badge--up' : 'status-badge--pending'}`}>
            {health ? 'Đang hoạt động' : healthError ? 'Cần kiểm tra' : 'Đang kiểm tra'}
          </span>
        </div>

        {healthError ? (
          <p className="status-message status-message--error" role="alert">
            {healthError}
          </p>
        ) : health ? (
          <dl className="status-list">
            <div>
              <dt>Ứng dụng</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Cơ sở dữ liệu</dt>
              <dd>{health.database}</dd>
            </div>
          </dl>
        ) : (
          <p className="status-message" aria-live="polite">
            Đang lấy trạng thái từ máy chủ…
          </p>
        )}
      </section>
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

function dieuHuongToi(duongDan: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.history.pushState({}, '', duongDan)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
