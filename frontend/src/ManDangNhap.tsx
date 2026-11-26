import { type CSSProperties, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { DangNhapRequest } from './api'
import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import { Field, Input } from './design/forms/Field'
import { matDoTheoVaiTro } from './matDo'

const styleTrang: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--ma-paper-2)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  display: 'grid',
  placeContent: 'center',
  justifyItems: 'center',
  gap: 'var(--ma-space-5)',
  padding: 'var(--ma-space-5) 16px',
}

const styleThe: CSSProperties = {
  width: 'min(400px, 100%)',
  boxSizing: 'border-box',
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-line-200)',
  borderRadius: 'var(--ma-radius-lg)',
  padding: 'var(--ma-space-6)',
  display: 'grid',
  gap: 'var(--ma-space-4)',
}

const styleChu: CSSProperties = { margin: 0, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }

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

/** Màn đăng nhập của khách: một thẻ giữa màn, một nút chính. */
export default function ManDangNhap({ form, setForm, onSubmit, dangDangNhap, dangTaiPhien, authError, healthError, laManHinhHep, onKhamPha, onTroGiup }: ManDangNhapProps) {
  return (
    <main style={styleTrang} data-density={matDoTheoVaiTro('', laManHinhHep)}>
      <div style={styleThe} aria-labelledby="auth-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo" aria-hidden="true">M</div>
          <span style={{ font: 'var(--ma-text-body)', fontWeight: 600 }}>MiniApart</span>
        </div>
        <h1 id="auth-title" className="h1" style={{ margin: 0 }}>Đăng nhập</h1>

        {healthError && (
          <div role="alert">
            <BlockedNotice title="Mất kết nối máy chủ" reason={healthError} />
          </div>
        )}

        {dangTaiPhien ? (
          <p style={styleChu} aria-live="polite">Đang kiểm tra phiên đăng nhập…</p>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
            <Field label="Số điện thoại">
              <Input
                id="dn-sdt"
                inputMode="tel"
                value={form.soDienThoai}
                onChange={(event) => setForm((current) => ({ ...current, soDienThoai: event.target.value }))}
                autoComplete="username"
                required
              />
            </Field>
            <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
              <Field label="Mật khẩu" error={authError}>
                <Input
                  id="dn-mk"
                  type="password"
                  value={form.matKhau}
                  onChange={(event) => setForm((current) => ({ ...current, matKhau: event.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <p className="t-meta" style={{ margin: 0 }}>
                Quên mật khẩu? <a href="#dat-lai-mat-khau" style={{ color: 'var(--ma-text-link)' }} onClick={(e) => { e.preventDefault(); onTroGiup() }}>Đặt lại mật khẩu</a>
              </p>
            </div>
            <Button type="submit" blocked={dangDangNhap} blockedReason={dangDangNhap ? 'Đang gửi đăng nhập.' : undefined} style={{ justifyContent: 'center', width: '100%' }}>
              {dangDangNhap ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>
        )}
      </div>
      <div style={{ display: 'grid', gap: 'var(--ma-space-2)', justifyItems: 'center', width: 'min(400px, 100%)', textAlign: 'center' }}>
        <p className="t-meta" style={{ margin: 0 }}>Người thuê chưa có tài khoản: hỏi quản lý toà để nhận tin nhắn kích hoạt.</p>
        <Button variant="text" size="sm" onClick={() => onKhamPha()}>Xem phòng còn trống</Button>
      </div>
    </main>
  )
}
