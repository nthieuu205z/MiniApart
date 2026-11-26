import { useState, type CSSProperties, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { DangNhapRequest } from './api'
import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { matDoTheoVaiTro } from './matDo'

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

const styleDoanMoTa: CSSProperties = {
  margin: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-body)',
  lineHeight: 1.6,
}

export type ManDangNhapProps = {
  form: DangNhapRequest
  setForm: Dispatch<SetStateAction<DangNhapRequest>>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  dangDangNhap: boolean
  dangTaiPhien: boolean
  authError: string | null
  healthError: string | null
  laManHinhHep: boolean
  onKhamPha: () => void
  onTroGiup: () => void
}

/** Màn đăng nhập của khách. Tách nguyên khối từ App.tsx; y8 sẽ làm lại giao diện. */
export default function ManDangNhap({ form, setForm, onSubmit, dangDangNhap, dangTaiPhien, authError, healthError, laManHinhHep, onKhamPha, onTroGiup }: ManDangNhapProps) {
  const [hienMatKhau, setHienMatKhau] = useState(false)
  return (
    <main style={styleKhungKhach} data-density={matDoTheoVaiTro('', laManHinhHep)}>
      <section style={laManHinhHep ? styleGridKhachManHinhHep : styleGridKhachDesktop}>
        <div style={{ ...styleDangNhapThe, padding: laManHinhHep ? '24px 20px' : '32px 48px' }} aria-labelledby="auth-title">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="logo" aria-hidden="true">M</div>
              <span style={{ font: 'var(--ma-text-body)', fontWeight: 700 }}>MiniApart</span>
            </div>
            <Button variant="text" onClick={() => onKhamPha()}>
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
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: 20, marginTop: 32 }}>
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
                <Button type="button" variant="text" size="sm" style={{ justifySelf: 'center' }} onClick={() => onTroGiup()}>Quên mật khẩu?</Button>
              </form>
            )}
          </div>

          <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
            <p className="t-meta" style={{ margin: 0 }}>Chưa có tài khoản? Ban quản lý toà nhà sẽ gửi mã kích hoạt qua số điện thoại của bạn.</p>
            <Button variant="text" size="sm" style={{ marginLeft: -12 }} onClick={() => onTroGiup()}>Kích hoạt tài khoản</Button>
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
