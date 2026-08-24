import { useState, type FormEvent } from 'react'
import { api, LoiMayChu, token, type ThongTinNguoiDung } from './api'

type Props = {
  onDangNhapXong: (nguoiDung: ThongTinNguoiDung) => void
}

/** FR-AUT-01 — màn hình đăng nhập bằng số điện thoại và mật khẩu. */
export default function DangNhap({ onDangNhapXong }: Props) {
  const [soDienThoai, setSoDienThoai] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const [dangGui, setDangGui] = useState(false)

  async function guiForm(su: FormEvent) {
    su.preventDefault()
    setLoi(null)
    setDangGui(true)

    try {
      const ketQua = await api.dangNhap(soDienThoai.trim(), matKhau)
      token.ghi(ketQua.token)
      onDangNhapXong(ketQua.nguoiDung)
    } catch (e) {
      setLoi(e instanceof LoiMayChu ? e.message : 'Không gọi được máy chủ')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <main className="khung khung-hep">
      <header>
        <h1>MiniApart</h1>
        <p className="phu-de">Hệ thống Quản lý và Vận hành Chung cư mini</p>
      </header>

      <form className="the" onSubmit={guiForm}>
        <h2>Đăng nhập</h2>

        <label htmlFor="sdt">Số điện thoại</label>
        <input
          id="sdt"
          name="soDienThoai"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          autoFocus
          required
          value={soDienThoai}
          onChange={(e) => setSoDienThoai(e.target.value)}
        />

        <label htmlFor="mk">Mật khẩu</label>
        <input
          id="mk"
          name="matKhau"
          type="password"
          autoComplete="current-password"
          required
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
        />

        {/* Thông báo lỗi dùng aria-live để trình đọc màn hình đọc lên khi nó xuất hiện. */}
        <p className="hong loi" role="alert" aria-live="polite">
          {loi ?? ''}
        </p>

        <button type="submit" disabled={dangGui}>
          {dangGui ? 'Đang kiểm tra…' : 'Đăng nhập'}
        </button>
      </form>

      <footer>
        <p>Vertical Slice 0 — Nền móng · PRJ1-CCM</p>
      </footer>
    </main>
  )
}
