import { useState } from 'react'
import type { ThongTinHoaDonChiTiet } from './api'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { Input, Select } from './design/forms/Field'
import { message } from './FinancePaymentPanel'
import { downloadFinanceFile, financeRequest, invoiceAction, invoiceUrl, validMoney, type InvoiceScope } from './financeApi'

type Props = { token: string; scope: InvoiceScope; hoaDon: ThongTinHoaDonChiTiet; vaiTro?: string; onChanged: () => void }

/** FR-INV-05/06/08/09 exposes explicit invoice lifecycle commands and preserves cancellation history. */
const AREA = { height: 'auto', minHeight: 88, padding: '10px 14px' } as const
export default function InvoiceActions({ token, scope, hoaDon, vaiTro = 'QUAN_LY', onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState<'PHAT_SINH' | 'GIAM_TRU'>('PHAT_SINH')
  const [reason, setReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [replacement, setReplacement] = useState<number | null>(null)
  const draft = hoaDon.trangThai === 'NHAP'
  const canceled = hoaDon.trangThai === 'DA_HUY'
  const mayCancel = draft || (vaiTro === 'CHU' && !canceled && hoaDon.trangThai !== 'DA_THANH_TOAN')
  async function run(task: () => Promise<unknown>, success: string) {
    if (busy) return
    setBusy(true); setError(null); setNotice(null)
    try { await task(); setNotice(success); onChanged() } catch (cause) { setError(message(cause)) } finally { setBusy(false) }
  }
  return <section aria-label="Thao tác hoá đơn" className="ma-no-print card" style={{ display: 'grid', gap: 12 }}>
    {error ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p> : null}
    {notice ? <p role="status" className="alert alert-success"><Icon name="check-circle" />{notice}</p> : null}
    <div className="row-wrap">
      {draft ? <Button blocked={busy} blockedReason="Đang cập nhật hoá đơn." onClick={() => void run(() => invoiceAction(token, scope, 'phat-hanh'), 'Đã phát hành hoá đơn và gửi thông báo trong ứng dụng.')}>Phát hành hoá đơn</Button> : null}
      {!draft ? <Button variant="secondary" blocked={busy} blockedReason="Đang cập nhật hoá đơn." onClick={() => void run(() => downloadFinanceFile(token, `${invoiceUrl(scope)}/xuat-pdf`, `${hoaDon.maHoaDon}.pdf`), 'Đã tải PDF hoá đơn.')}>Tải PDF hoá đơn</Button> : null}
    </div>
    {draft ? <details><summary className="t-strong" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>Thêm khoản phát sinh hoặc giảm trừ vào bản nháp</summary>
      <form className="card-sunken" style={{ display: 'grid', gap: 12, marginTop: 10 }} onSubmit={(event) => { event.preventDefault(); if (validMoney(amount) && name.trim() && reason.trim()) void run(async () => {
        await invoiceAction(token, scope, 'noi-dung', { tenKhoan: name, soTien: amount, loai: kind, lyDo: reason }); setName(''); setAmount(''); setReason('')
      }, 'Đã cập nhật khoản mục bản nháp.') }}>
        <label className="field"><span className="label">Tên khoản</span><Input aria-label="Tên khoản" value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label className="field"><span className="label">Loại khoản</span><Select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="PHAT_SINH">Phát sinh tăng</option><option value="GIAM_TRU">Giảm trừ</option></Select></label>
        <label className="field"><span className="label">Số tiền (đồng, nhập giá trị dương)</span><Input aria-label="Số tiền khoản mục" value={amount} onChange={(event) => setAmount(event.target.value)} required inputMode="decimal" /></label>
        <label className="field"><span className="label">Lý do</span><textarea className="input" aria-label="Lý do khoản mục" value={reason} onChange={(event) => setReason(event.target.value)} required style={AREA} /></label>
        <Button type="submit" blocked={busy || !name.trim() || !reason.trim() || !validMoney(amount)} blockedReason="Nhập đầy đủ tên khoản, số tiền và lý do.">Lưu khoản mục</Button>
      </form>
    </details> : null}
    {mayCancel ? <details><summary className="t-strong" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>Huỷ hoặc thay thế hoá đơn</summary><div className="card-sunken" style={{ display: 'grid', gap: 12, marginTop: 10 }}>
      <label className="field"><span className="label">Lý do huỷ / thay thế</span><textarea className="input" aria-label="Lý do huỷ hoá đơn" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required style={AREA} /></label>
      <label className="check"><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} /> Tôi đã kiểm tra hoá đơn và xác nhận thao tác. Lịch sử hoá đơn được giữ lại.</label>
      <div className="row-wrap"><Button variant="secondary" blocked={busy || !confirm || !cancelReason.trim()} blockedReason="Nhập lý do và đánh dấu xác nhận." onClick={() => void run(() => invoiceAction(token, scope, 'huy', { lyDo: cancelReason }), 'Đã huỷ hoá đơn.')}>Xác nhận huỷ hoá đơn</Button>
        {vaiTro === 'CHU' ? <Button variant="secondary" blocked={busy || !confirm || !cancelReason.trim()} blockedReason="Nhập lý do và đánh dấu xác nhận." onClick={() => void run(async () => {
          const data = await financeRequest<{ hoaDonMoiId: number }>(token, `${invoiceUrl(scope)}/thay-the`, 'POST', { lyDo: cancelReason }); setReplacement(data.hoaDonMoiId)
        }, 'Đã huỷ hoá đơn cũ và tạo bản nháp thay thế.')}>Tạo hoá đơn thay thế</Button> : null}</div>
      <p className="t-sm">Thay thế chỉ thực hiện khi đã đối ứng các khoản tiền thu về 0. Nếu tính lại thất bại, hoá đơn cũ được giữ nguyên.</p>
    </div></details> : null}
    {replacement !== null ? <a className="btn btn-secondary" href={`/hoa-don?toaNhaId=${scope.toaNhaId}&kyId=${scope.kyId}&hoaDonId=${replacement}`}>Mở hoá đơn thay thế #{replacement}</a> : null}
  </section>
}
