import { useState, type FormEvent } from 'react'
import { managementRequest } from './managementApi'
import { Field, Feedback, SaveButton, fieldStyle, panelStyle, rowStyle, useAction } from './ManagementShared'
import { Button } from './design/core/Button'

export default function TaiKhoanTruyCap({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'KICH_HOAT' | 'QUEN_MAT_KHAU' | 'DAT_LAI'>('KICH_HOAT')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const action = useAction()
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'QUEN_MAT_KHAU') {
      const ok = await action.run(() => managementRequest(null, '/api/auth/quen-mat-khau', 'POST', { soDienThoai: phone }), 'Nếu tài khoản đủ điều kiện, mã xác thực đã được gửi. Mã có hiệu lực 5 phút.')
      if (ok) setMode('DAT_LAI')
    } else {
      const body = mode === 'KICH_HOAT' ? { soDienThoai: phone, maKichHoat: code, matKhau: password } : { soDienThoai: phone, maXacThuc: code, matKhau: password }
      const ok = await action.run(() => managementRequest(null, mode === 'KICH_HOAT' ? '/api/auth/kich-hoat' : '/api/auth/dat-lai-mat-khau', 'POST', body), 'Đã đặt mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.')
      if (ok) { setPassword(''); setCode('') }
    }
  }
  return <section style={{ ...panelStyle, maxWidth: 540, margin: '24px auto' }}>
    <h1>{mode === 'KICH_HOAT' ? 'Kích hoạt tài khoản' : 'Đặt lại mật khẩu'}</h1>
    <div style={rowStyle}><Button variant="text" onClick={() => setMode('KICH_HOAT')}>Kích hoạt tài khoản</Button><Button variant="text" onClick={() => setMode('QUEN_MAT_KHAU')}>Quên mật khẩu</Button><Button variant="text" onClick={onLogin}>Về đăng nhập</Button></div>
    <Feedback error={action.error} success={action.success} />
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <Field title="Số điện thoại"><input style={fieldStyle} type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      {mode !== 'QUEN_MAT_KHAU' ? <><Field title={mode === 'KICH_HOAT' ? 'Mã kích hoạt đã nhận' : 'Mã xác thực đã nhận'}><input style={fieldStyle} autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} /></Field><Field title="Mật khẩu mới (ít nhất 8 ký tự)"><input style={fieldStyle} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></Field></> : null}
      <SaveButton busy={action.busy}>{mode === 'QUEN_MAT_KHAU' ? 'Gửi mã xác thực' : 'Lưu mật khẩu'}</SaveButton>
    </form>
  </section>
}
