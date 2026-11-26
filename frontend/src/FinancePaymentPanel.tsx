import { useEffect, useState } from 'react'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { dinhDangTien } from './design/core/format'
import { counterPayment, downloadFinanceFile, financeRequest, getLedger, invoiceUrl, localDate, recordPayment, validMoney, type Ledger, type Payment } from './financeApi'

type Props = { token: string; hoaDonId: number; maHoaDon?: string; conLai?: string; trangThai?: string; onChanged?: () => void }

/** FR-INV-11/12/13/14 presents the immutable ledger, receipts and explicit counter entries. */
export default function FinancePaymentPanel({ token, hoaDonId, maHoaDon, conLai = '', trangThai, onChanged }: Props) {
  // A temporary local-demo choice; production continues using the building's signed invoice QR.
  const personalDemoQr = import.meta.env.DEV && import.meta.env.VITE_DEMO_PERSONAL_QR === 'true'
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
    setQr(null)
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
  const lap = { display: 'grid', gap: 12 } as const
  const canCollect = trangThai !== 'NHAP' && trangThai !== 'DA_HUY'

  return <section className="ma-no-print" aria-label="Thanh toán hoá đơn" style={{ display: 'grid', gap: 14, minWidth: 0 }}>
    <h2 className="h3">Thu tiền và sổ giao dịch</h2>
    {error ? (
      <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p>
    ) : null}
    {!ledger ? <p className="t-sm" aria-busy="true">Đang tải sổ giao dịch…</p> : <>
      {canCollect ? <form onSubmit={(event) => { event.preventDefault(); if (validMoney(amount)) void run(async () => accepted(await recordPayment(token, ledger, { soTien: amount, hinhThuc: method, ngayThu: date, xacNhanThuThem: extra }))) }} className="card-sunken" style={lap}>
        <label className="field"><span className="label">Số tiền thu (đồng)</span><input className="input" aria-label="Số tiền thu" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required pattern="[0-9]+([.][0-9]{1,2})?" style={{ fontVariantNumeric: 'tabular-nums' }} /></label>
        <label className="field"><span className="label">Ngày thu</span><input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="field"><span className="label">Hình thức</span><select className="select" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}><option value="TIEN_MAT">Tiền mặt</option><option value="CHUYEN_KHOAN">Chuyển khoản</option></select></label>
        <label className="check t-sm"><input type="checkbox" checked={extra} onChange={(event) => setExtra(event.target.checked)} /> Xác nhận thu thêm khi hoá đơn đã thanh toán đủ; phần thừa được lưu thành số dư.</label>
        <Button type="submit" blocked={busy || !validMoney(amount)} blockedReason={busy ? 'Đang ghi nhận giao dịch.' : 'Nhập số tiền lớn hơn 0, tối đa 2 chữ số thập phân.'}>Ghi nhận thu tiền</Button>
      </form> : <p className="t-sm">Gửi hoá đơn trước khi thu tiền. Hoá đơn đã huỷ chỉ có thể xem lịch sử.</p>}
      {ledger.kyId !== null && canCollect && (!personalDemoQr || validMoney(conLai)) ? <Button variant="secondary" blocked={busy} blockedReason="Đang xử lý giao dịch." onClick={() => void run(async () => {
        if (personalDemoQr) {
          setQr('/payments/viettel-money-demo-qr.png')
          return
        }
        const link = await financeRequest<{ url: string }>(token, `${invoiceUrl({ toaNhaId: ledger.toaNhaId, kyId: ledger.kyId!, hoaDonId })}/ma-qr-chuyen-khoan`)
        setQr(link.url)
      })}>{personalDemoQr ? 'Hiện QR nhận tiền demo' : 'Tạo mã QR chuyển khoản'}</Button> : null}
      {qr ? <figure className="card-sunken" style={{ margin: 0, textAlign: 'center' }}>
        <img src={qr} alt={personalDemoQr ? 'QR nhận tiền Viettel Money của Trần Ngọc Đức' : 'Mã QR chuyển khoản cho hoá đơn đang chọn'} style={{ maxWidth: '100%', width: personalDemoQr ? 340 : 280, height: 'auto', background: 'var(--ma-bg-card)', border: '1px solid var(--ma-border-default)' }} />
        <figcaption style={{ marginTop: 10, fontSize: 13, color: 'var(--ma-text-secondary)', lineHeight: 1.6 }}>
          {personalDemoQr ? <>
            <strong style={{ display: 'block', color: 'var(--ma-text-primary)' }}>QR nhận tiền tĩnh · dùng tạm cho demo</strong>
            <span style={{ display: 'block' }}>Số tiền cần nhập: {dinhDangTien(conLai)} đ</span>
            {maHoaDon ? <span style={{ display: 'block' }}>Nội dung chuyển khoản: {maHoaDon}</span> : <span style={{ display: 'block' }}>Nhập mã hóa đơn đang xem vào nội dung chuyển khoản.</span>}
            <span>Mã không tự điền số tiền hoặc nội dung hóa đơn. Chỉ ghi nhận thanh toán sau khi đối chiếu tiền đã nhận.</span>
          </> : 'Mã có hiệu lực 15 phút. Xác minh khoản tiền đã nhận trước khi ghi nhận thanh toán.'}
        </figcaption>
      </figure> : null}
      {receipt ? <div role="status" className="alert alert-success" style={{ display: 'grid', gap: 4 }}><strong><Icon name="check-circle" /> Đã ghi {receipt.maBienLai}</strong><span style={{ fontVariantNumeric: 'tabular-nums' }}>Đã thu: {dinhDangTien(receipt.daThu)} đ · Còn lại: {dinhDangTien(receipt.conLai)} đ · Số dư: {dinhDangTien(receipt.soTienThanhSoDu)} đ</span></div> : null}
      <h3 className="h3" style={{ marginTop: 8 }}>Lịch sử thanh toán</h3>
      {ledger.giaoDich.length === 0 ? <p className="t-sm">Chưa có giao dịch.</p> : ledger.giaoDich.map((entry) => <article key={entry.id} className="card-sunken" style={lap}>
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.maBienLai} · {dinhDangTien(entry.soTien)} đ</strong>
        <span className="t-sm">{entry.loai === 'DOI_UNG' ? 'Bút toán đối ứng' : entry.hinhThuc === 'TIEN_MAT' ? 'Tiền mặt' : 'Chuyển khoản'} · {entry.ngayThu ?? 'Ngày điều chỉnh'} {entry.lyDo ? `· ${entry.lyDo}` : ''}</span>
        <div className="row-wrap"><Button variant="secondary" size="sm" blocked={busy} blockedReason="Đang xử lý giao dịch." onClick={() => void run(() => downloadFinanceFile(token, `/api/thanh-toan/${entry.id}/bien-lai-pdf`, `${entry.maBienLai}.pdf`))}>Tải biên lai</Button>
          {entry.loai !== 'DOI_UNG' && trangThai !== 'DA_HUY' ? <Button variant="text" size="sm" onClick={() => { setCounter(entry.id); setCounterAmount(entry.soTien); setReason('') }}>Lập đối ứng</Button> : null}</div>
      </article>)}
      {counter !== null ? <form className="card-sunken" style={{ ...lap, background: 'var(--ma-waiting-bg)' }} onSubmit={(event) => { event.preventDefault(); if (validMoney(counterAmount) && reason.trim()) void run(async () => accepted(await counterPayment(token, counter, counterAmount, reason))) }}>
        <strong style={{ color: 'var(--ma-waiting)' }}>Điều chỉnh giao dịch #{counter}</strong>
        <label className="field"><span className="label">Số tiền đối ứng (giá trị dương)</span><input className="input" aria-label="Số tiền đối ứng" value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} inputMode="decimal" required style={{ fontVariantNumeric: 'tabular-nums' }} /></label>
        <label className="field"><span className="label">Lý do bắt buộc</span><textarea className="input" aria-label="Lý do đối ứng" value={reason} onChange={(event) => setReason(event.target.value)} required style={{ height: 'auto', minHeight: 88, padding: '10px 14px' }} /></label>
        <p className="t-sm" style={{ margin: 0 }}>Hệ thống thêm bút toán âm vào sổ giao dịch và giữ nguyên giao dịch gốc.</p>
        <div className="row-wrap"><Button type="submit" variant="secondary" blocked={busy || !validMoney(counterAmount) || !reason.trim()} blockedReason="Nhập số tiền và lý do, chờ giao dịch trước hoàn tất.">Xác nhận lập đối ứng</Button><Button type="button" variant="text" onClick={() => setCounter(null)}>Bỏ điều chỉnh</Button></div>
      </form> : null}
    </>}
  </section>
}

export function message(cause: unknown) { return cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác.' }
