import type { ThongTinNguoiDung } from './api'

type Props = {
  nguoiDung: ThongTinNguoiDung
  onDangXuat: () => void
}

/**
 * Trang sau khi đăng nhập.
 *
 * Slice 0 chỉ chứng minh phiên đăng nhập hoạt động. Menu theo vai trò là việc của
 * ticket 05; các phân hệ nghiệp vụ là việc của các slice sau.
 */
export default function TrangChu({ nguoiDung, onDangXuat }: Props) {
  return (
    <main className="khung">
      <header className="dau-trang">
        <div>
          <h1>MiniApart</h1>
          <p className="phu-de">Xin chào, {nguoiDung.hoTen}</p>
        </div>
        <button type="button" className="phu" onClick={onDangXuat}>
          Đăng xuất
        </button>
      </header>

      <section className="the">
        <h2>Tài khoản đang dùng</h2>
        <dl>
          <dt>Họ tên</dt>
          <dd>{nguoiDung.hoTen}</dd>
          <dt>Số điện thoại</dt>
          <dd>{nguoiDung.soDienThoai}</dd>
          <dt>Vai trò</dt>
          <dd>{nguoiDung.tenVaiTro}</dd>
        </dl>
      </section>

      <footer>
        <p>Vertical Slice 0 — Nền móng · PRJ1-CCM</p>
      </footer>
    </main>
  )
}
