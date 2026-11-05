import { useEffect, useState, type CSSProperties } from 'react'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { counterPayment, downloadFinanceFile, financeRequest, getLedger, invoiceUrl, localDate, recordPayment, validMoney, type Ledger, type Payment } from './financeApi'

type Props = { token: string; hoaDonId: number; conLai?: string; trangThai?: string; onChanged?: () => void }

/** FR-INV-11/12/13/14 presents the immutable ledger, receipts and explicit counter entries. */
export default function FinancePaymentPanel({ token, hoaDonId, conLai = '', trangThai, onChanged }: Props) {
  const [ledger, setLedger] = useState<Ledger | null>(null)
  const [amount, setAmount] = useState(conLai)
  const [date, setDate] = useState(localDate)
  const [method, setMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT')
  const [extra, setExtra] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const [counter, setCounter] = useState<number | null>(null)
  const [counterAmount, setCounterAmount] = useState('')
  const [reason, setReason] = useState('')
  const [qr, setQr] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLedger(null)
    getLedger(token, hoaDonId).then((value) => { if (active) setLedger(value) }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, hoaDonId, reload])

  async function run(action: () => Promise<unknown>) {
    if (busy) return
    setBusy(true); setError(null)
    try { await action() } catch (cause) { setError(message(cause)) } finally { setBusy(false) }
  }
  function accepted(payment: Payment) {
    setReceipt(payment); setAmount(payment.conLai); setQr(null); setCounter(null); setReason(''); setExtra(false)
    setReload((value) => value + 1); onChanged?.()
  }
  const canCollect = trangThai !== 'NHAP' && trangThai !== 'DA_HUY'

  return <section className="ma-no-print" aria-label="Thanh toán hoá đơn" style={box}>
    <h4 style={{ margin: 0 }}>Thu tiền và sổ giao dịch</h4>
    {error ? <p role="alert">{error}</p> : null}
    {!ledger ? <p>Đang tải sổ giao dịch…</p> : <>
      {canCollect ? <form onSubmit={(event) => { event.preventDefault(); if (validMoney(amount)) void run(async () => accepted(await recordPayment(token, ledger, { soTien: amount, hinhThuc: method, ngayThu: date, xacNhanThuThem: extra }))) }} style={box}>
        <label style={field}>Số tiền thu (đồng)<input aria-label="Số tiền thu" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required pattern="[0-9]+([.][0-9]{1,2})?" style={input} /></label>
        <label style={field}>Ngày thu<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required style={input} /></label>
        <label style={field}>Hình thức<select value={method} onChange={(event) => setMethod(event.target.value as typeof method)} style={input}><option value="TIEN_MAT">Tiền mặt</option><option value="CHUYEN_KHOAN">Chuyển khoản</option></select></label>
        <label><input type="checkbox" checked={extra} onChange={(event) => setExtra(event.target.checked)} /> Xác nhận thu thêm khi hoá đơn đã thanh toán đủ; phần thừa được lưu thành số dư.</label>
        <Button type="submit" blocked={busy || !validMoney(amount)} blockedReason={busy ? 'Đang ghi nhận giao dịch.' : 'Nhập số tiền lớn hơn 0, tối đa 2 chữ số thập phân.'}>Ghi nhận thu tiền</Button>
      </form> : <p>Phát hành hoá đơn trước khi thu tiền. Hoá đơn đã huỷ chỉ có thể xem lịch sử.</p>}
      {ledger.kyId !== null && canCollect ? <Button variant="secondary" blocked={busy} blockedReason="Đang xử lý giao dịch." onClick={() => void run(async () => {
        const link = await financeRequest<{ url: string }>(token, `${invoiceUrl({ toaNhaId: ledger.toaNhaId, kyId: ledger.kyId!, hoaDonId })}/ma-qr-chuyen-khoan`)
        setQr(link.url)
      })}>Tạo mã QR chuyển khoản</Button> : null}
      {qr ? <figure style={{ margin: 0 }}><img src={qr} alt="Mã QR chuyển khoản cho hoá đơn đang chọn" style={{ maxWidth: '100%', width: 300 }} /><figcaption>Mã có hiệu lực 15 phút. Xác minh khoản tiền đã nhận trước khi ghi nhận thanh toán.</figcaption></figure> : null}
      {receipt ? <div role="status" style={box}><strong>Đã ghi {receipt.maBienLai}</strong><span>Đã thu: {dinhDangTien(receipt.daThu)} đ · Còn lại: {dinhDangTien(receipt.conLai)} đ · Số dư: {dinhDangTien(receipt.soTienThanhSoDu)} đ</span></div> : null}
      <h5 style={{ margin: 0 }}>Lịch sử thanh toán</h5>
      {ledger.giaoDich.length === 0 ? <p>Chưa có giao dịch.</p> : ledger.giaoDich.map((entry) => <article key={entry.id} style={box}>
        <strong>{entry.maBienLai} · {dinhDangTien(entry.soTien)} đ</strong>
        <span>{entry.loai === 'DOI_UNG' ? 'Bút toán đối ứng' : entry.hinhThuc === 'TIEN_MAT' ? 'Tiền mặt' : 'Chuyển khoản'} · {entry.ngayThu ?? 'Ngày điều chỉnh'} {entry.lyDo ? `· ${entry.lyDo}` : ''}</span>
        <div style={actions}><Button variant="secondary" blocked={busy} blockedReason="Đang xử lý giao dịch." onClick={() => void run(() => downloadFinanceFile(token, `/api/thanh-toan/${entry.id}/bien-lai-pdf`, `${entry.maBienLai}.pdf`))}>Tải biên lai</Button>
          {entry.loai !== 'DOI_UNG' && trangThai !== 'DA_HUY' ? <Button variant="text" onClick={() => { setCounter(entry.id); setCounterAmount(entry.soTien); setReason('') }}>Lập đối ứng</Button> : null}</div>
      </article>)}
      {counter !== null ? <form style={box} onSubmit={(event) => { event.preventDefault(); if (validMoney(counterAmount) && reason.trim()) void run(async () => accepted(await counterPayment(token, counter, counterAmount, reason))) }}>
        <strong>Điều chỉnh giao dịch #{counter}</strong>
        <label style={field}>Số tiền đối ứng (giá trị dương)<input aria-label="Số tiền đối ứng" value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} inputMode="decimal" required style={input} /></label>
        <label style={field}>Lý do bắt buộc<textarea aria-label="Lý do đối ứng" value={reason} onChange={(event) => setReason(event.target.value)} required style={input} /></label>
        <p>Hệ thống thêm bút toán âm vào sổ giao dịch và giữ nguyên giao dịch gốc.</p>
        <div style={actions}><Button type="submit" blocked={busy || !validMoney(counterAmount) || !reason.trim()} blockedReason="Nhập số tiền và lý do, chờ giao dịch trước hoàn tất.">Xác nhận lập đối ứng</Button><Button type="button" variant="text" onClick={() => setCounter(null)}>Bỏ điều chỉnh</Button></div>
      </form> : null}
    </>}
  </section>
}

export function message(cause: unknown) { return cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác.' }
export const box: CSSProperties = { display: 'grid', gap: 12, padding: 16, border: '1px solid var(--ma-border-default)', minWidth: 0 }
export const field: CSSProperties = { display: 'grid', gap: 6 }
export const input: CSSProperties = { minHeight: 44, padding: '8px 10px', font: 'inherit', width: '100%', boxSizing: 'border-box', color: 'var(--ma-text-primary)', background: 'var(--ma-bg-card)', border: '1px solid var(--ma-border-strong)' }
export const actions: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }
