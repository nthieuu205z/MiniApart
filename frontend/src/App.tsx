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
import './styles.css'

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [dangTaiPhien, setDangTaiPhien] = useState(true)
  const [dangDangNhap, setDangDangNhap] = useState(false)
  const [nguoiDung, setNguoiDung] = useState<ThongTinNguoiDung | null>(null)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDangDangNhap(true)
    setAuthError(null)

    try {
      const response = await login(form)
      storeToken(response.token)
      setNguoiDung(response.nguoiDung)
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
    setNguoiDung(null)
    setAuthError(null)
  }

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
            <p className="eyebrow">FR-AUT-01</p>
            <h2 id="auth-title">{nguoiDung ? 'Trang chủ' : 'Đăng nhập'}</h2>
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
                placeholder="MatKhau@123"
                autoComplete="current-password"
                required
              />
            </label>

            {authError ? (
              <p className="status-message status-message--error" role="alert">
                {authError}
              </p>
            ) : (
              <p className="status-message">Đăng nhập bằng số điện thoại và mật khẩu của tài khoản mẫu.</p>
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
