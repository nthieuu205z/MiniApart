import { useEffect, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { DangNhapRequest } from '../api'

export type CongCuDanProps = {
  form: DangNhapRequest
  setForm: Dispatch<SetStateAction<DangNhapRequest>>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  dangDangNhap: boolean
  dangTaiPhien: boolean
  authError: string | null
  healthError: string | null
  onTroGiup: () => void
}

/** Cổng cư dân `/dang-nhap`: giữ nguyên logic đăng nhập và trợ giúp tài khoản của App, chỉ đổi khung ngoài. */
export default function CongCuDan({ form, setForm, onSubmit, dangDangNhap, dangTaiPhien, authError, healthError, onTroGiup }: CongCuDanProps) {
  useEffect(() => { document.title = 'Đăng nhập — MiniApart' }, [])
  const troGiup = (e: { preventDefault: () => void }) => { e.preventDefault(); onTroGiup() }
  return (
    <section className="dn">
      <div className="dn-trai">
        <div className="dn-hop">
          <h1 className="tc2" id="auth-title">Đăng nhập</h1>
          <p className="dn-mo">Dành cho người đang thuê, chủ nhà, quản lý và thợ. Hệ thống tự đưa bạn về đúng trang của mình.</p>
          {healthError ? <p className="tt-cong tt-no" role="alert">Mất kết nối máy chủ: {healthError}</p> : null}
          {dangTaiPhien ? <p className="dn-mo" aria-live="polite">Đang kiểm tra phiên đăng nhập…</p> : (
            <form className="dn-form" onSubmit={onSubmit} aria-labelledby="auth-title">
              <label className="o"><span>Số điện thoại</span>
                <input id="dn-sdt" type="tel" inputMode="numeric" autoComplete="username" required value={form.soDienThoai} onChange={(e) => setForm((c) => ({ ...c, soDienThoai: e.target.value }))} />
              </label>
              <label className="o"><span>Mật khẩu</span>
                <input id="dn-mk" type="password" autoComplete="current-password" required value={form.matKhau} onChange={(e) => setForm((c) => ({ ...c, matKhau: e.target.value }))}
                  aria-invalid={authError ? true : undefined} aria-describedby={authError ? 'dn-loi' : undefined} />
                {authError ? <small className="loi-o" id="dn-loi" role="alert">{authError}</small> : null}
              </label>
              <button className="nut nut-muc nut-day" type="submit" disabled={dangDangNhap}>{dangDangNhap ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
              <p className="dn-phu">
                <a href="#dat-lai-mat-khau" onClick={troGiup}>Quên mật khẩu?</a>
                <a href="#kich-hoat" onClick={troGiup}>Kích hoạt tài khoản lần đầu</a>
              </p>
            </form>
          )}
          <p className="dn-chan">Người thuê chưa có tài khoản: hỏi quản lý toà để nhận tin nhắn kích hoạt.<br />Chưa thuê phòng? <a href="/tim-phong">Tìm phòng đang trống</a></p>
        </div>
      </div>
      <div className="dn-phai">
        <img src="/rooms/binhminh_cua_so_lon.webp" alt="" width={960} height={720} />
        <div className="dn-vai">
          <h2 className="tc4">Sau khi đăng nhập</h2>
          <ul>
            <li><b>Người thuê</b><span>Hoá đơn tháng này, mã QR để trả, báo hỏng.</span></li>
            <li><b>Chủ nhà, quản lý</b><span>Hôm nay: đã thu, còn nợ, việc cần quyết.</span></li>
            <li><b>Thợ</b><span>Việc được giao và lịch sửa chữa.</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}
