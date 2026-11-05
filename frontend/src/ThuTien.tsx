import { useEffect, useState } from 'react'
import { fetchChiSoDichVu, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, fetchToaNha, type ThongTinGhiChiSo, type ThongTinHoaDonQuanLy, type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinToaNha } from './api'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { ScreenHeader, ScreenSurface } from './design/layout/Screen'
import FinancePaymentPanel, { actions, box, field, input, message } from './FinancePaymentPanel'
import { collectDeposit, financeRequest, getDeposit, localDate, validMoney, type Deposit, type Settlement } from './financeApi'

type Props = { token: string; mobile?: boolean; vaiTro?: string }

/** FR-INV-11/14 and FR-TNT-08/09 connect collection, deposits and settlement to the accounting services. */
export default function ThuTien({ token, mobile = false }: Props) {
  const [buildings, setBuildings] = useState<ThongTinToaNha[]>([])
  const [building, setBuilding] = useState('')
  const [invoices, setInvoices] = useState<ThongTinHoaDonQuanLy[]>([])
  const [contracts, setContracts] = useState<ThongTinHopDong[]>([])
  const [periods, setPeriods] = useState<ThongTinKyThanhToan[]>([])
  const [invoice, setInvoice] = useState('')
  const [contract, setContract] = useState('')
  const [tab, setTab] = useState<'hoa-don' | 'coc'>('hoa-don')
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    fetchToaNha(token).then((data) => { if (active) { setBuildings(data); setBuilding(String(data[0]?.id ?? '')) } }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token])
  useEffect(() => {
    if (!building) return
    let active = true
    setError(null)
    Promise.all([fetchHoaDonQuanLy(token, Number(building), ''), fetchHopDongQuanLy(token, Number(building)), fetchKyThanhToan(token, Number(building))])
      .then(([data, tenants, months]) => {
        if (!active) return
        setInvoices(data); setContracts(tenants); setPeriods(months)
        setInvoice((id) => data.some((value) => String(value.hoaDonId) === id) ? id : '')
        setContract((id) => tenants.some((value) => String(value.id) === id) ? id : '')
      }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, building, reload])
  const selected = invoices.find((value) => String(value.hoaDonId) === invoice)
  const selectedContract = contracts.find((value) => String(value.id) === contract)
  return <ScreenSurface data-testid="collection-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'}>
    <ScreenHeader><h3>Thu tiền, cọc và quyết toán</h3><p>Chọn đúng toà nhà và hoá đơn; mọi giao dịch được lưu vào sổ và có biên lai.</p></ScreenHeader>
    {error ? <p role="alert">{error}</p> : null}
    <label style={field}>Toà nhà<select value={building} onChange={(event) => { setBuilding(event.target.value); setInvoice(''); setContract(''); setInvoices([]); setContracts([]) }} style={input}><option value="">Chọn toà nhà</option>{buildings.map((value) => <option key={value.id} value={value.id}>{value.ten}</option>)}</select></label>
    <div style={actions}><Button variant={tab === 'hoa-don' ? 'primary' : 'secondary'} onClick={() => setTab('hoa-don')}>Thu theo hoá đơn</Button><Button variant={tab === 'coc' ? 'primary' : 'secondary'} onClick={() => setTab('coc')}>Tiền cọc và trả phòng</Button></div>
    {tab === 'hoa-don' ? <>
      <label style={field}>Hoá đơn<select aria-label="Chọn hoá đơn thu tiền" value={invoice} onChange={(event) => setInvoice(event.target.value)} style={input}><option value="">Chọn hoá đơn</option>{invoices.map((value) => <option key={value.hoaDonId} value={value.hoaDonId}>{value.maHoaDon} · Phòng {value.soPhong} · {value.nguoiThue} · {dinhDangTien(value.conLai)} đ · {value.trangThai}</option>)}</select></label>
      {selected ? <><p>Phòng {selected.soPhong} · {selected.nguoiThue} · Còn phải thu <strong>{dinhDangTien(selected.conLai)} đ</strong></p><FinancePaymentPanel key={selected.hoaDonId} token={token} hoaDonId={selected.hoaDonId} conLai={selected.conLai} trangThai={selected.trangThai} onChanged={() => setReload((value) => value + 1)} /></> : <p>Chọn hoá đơn để thu tiền, tạo QR hoặc xem biên lai và bút toán đối ứng.</p>}
    </> : <>
      <label style={field}>Hợp đồng<select aria-label="Chọn hợp đồng thu cọc" value={contract} onChange={(event) => setContract(event.target.value)} style={input}><option value="">Chọn hợp đồng</option>{contracts.map((value) => <option key={value.id} value={value.id}>#{value.id} · Phòng {value.soPhong} · {value.hoTenNguoiThue} · {value.tenTrangThai}</option>)}</select></label>
      {selectedContract ? <ContractFinance key={selectedContract.id} token={token} toaNhaId={Number(building)} contract={selectedContract} periods={periods} onChanged={() => setReload((value) => value + 1)} /> : <p>Chọn hợp đồng để thu cọc hoặc quyết toán khi trả phòng.</p>}
    </>}
  </ScreenSurface>
}

function ContractFinance({ token, toaNhaId, contract, periods, onChanged }: { token: string; toaNhaId: number; contract: ThongTinHopDong; periods: ThongTinKyThanhToan[]; onChanged: () => void }) {
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(localDate)
  const [reason, setReason] = useState('')
  const [damage, setDamage] = useState('0')
  const [settlementReason, setSettlementReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [acknowledge, setAcknowledge] = useState(false)
  const [meters, setMeters] = useState<ThongTinGhiChiSo['phong'][number]['dichVu']>([])
  const [readings, setReadings] = useState<Record<number, string>>({})
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const openPeriod = periods.find((value) => value.trangThai === 'DANG_MO')
  useEffect(() => {
    let active = true
    getDeposit(token, contract.id).then((value) => { if (active) { setDeposit(value); setAmount(value.conLaiChuaThu) } }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, contract.id, reload])
  useEffect(() => {
    if (!openPeriod || contract.trangThai === 'DA_THANH_LY') return
    let active = true
    fetchChiSoDichVu(token, toaNhaId, openPeriod.id).then((value) => {
      if (!active) return
      const rows = value.phong.find((value) => value.id === contract.phongId)?.dichVu ?? []
      setMeters(rows); setReadings(Object.fromEntries(rows.map((value) => [value.id, value.chiSoCuoi ?? ''])))
    }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, toaNhaId, openPeriod?.id, contract.phongId, contract.trangThai])
  async function run(task: () => Promise<void>) { if (busy) return; setBusy(true); setError(null); setNotice(''); try { await task() } catch (cause) { setError(message(cause)) } finally { setBusy(false) } }
  return <section style={box} aria-label="Tiền cọc và quyết toán hợp đồng">
    {error ? <p role="alert">{error}</p> : null}{notice ? <p role="status">{notice}</p> : null}
    {deposit ? <>
      <h4 style={{ margin: 0 }}>Tiền cọc hợp đồng #{contract.id}</h4>
      <p>Thoả thuận: {dinhDangTien(deposit.tienCocThoaThuan)} đ · Đã thu: {dinhDangTien(deposit.tongDaThu)} đ · Còn thiếu: {dinhDangTien(deposit.conLaiChuaThu)} đ</p>
      {contract.trangThai !== 'DA_THANH_LY' ? <form style={box} onSubmit={(event) => { event.preventDefault(); if (validMoney(amount)) void run(async () => { await collectDeposit(token, contract.id, amount, date, reason); setNotice('Đã ghi nhận thu cọc.'); setReload((value) => value + 1); onChanged() }) }}>
        <label style={field}>Số tiền cọc thu<input aria-label="Số tiền cọc thu" value={amount} onChange={(event) => setAmount(event.target.value)} required inputMode="decimal" style={input} /></label>
        <label style={field}>Ngày thu cọc<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required style={input} /></label>
        <label style={field}>Ghi chú thu cọc<input value={reason} onChange={(event) => setReason(event.target.value)} style={input} /></label>
        <Button type="submit" blocked={busy || !validMoney(amount)} blockedReason="Nhập số tiền cọc lớn hơn 0 và chờ giao dịch trước hoàn tất.">Ghi nhận thu cọc</Button>
      </form> : null}
      {deposit.giaoDich.map((entry) => <p key={entry.id}>{entry.maBienLai} · {entry.loai} · {entry.ngay} · {dinhDangTien(entry.soTien)} đ {entry.lyDo ? `· ${entry.lyDo}` : ''}</p>)}
    </> : <p>Đang tải tiền cọc…</p>}
    {contract.trangThai !== 'DA_THANH_LY' ? <details><summary>Chốt chỉ số cuối, trả phòng và quyết toán</summary><form style={box} onSubmit={(event) => {
      event.preventDefault()
      if (!confirm || !openPeriod) return
      void run(async () => {
        const result = await financeRequest<ThongTinHopDong & { quyetToan: Settlement }>(token, `/api/hop-dong/${contract.id}/thanh-ly`, 'POST', {
          khauTruHuHong: damage, lyDo: settlementReason, chiSoCuoi: meters.map((meter) => ({ phongId: contract.phongId, dichVuId: meter.id, chiSoCuoi: readings[meter.id], coThayCongTo: meter.coThayCongTo, chiSoCuoiCongToCu: meter.chiSoCuoiCongToCu, chiSoDauCongToMoi: meter.chiSoDauCongToMoi, xacNhanCanhBao: acknowledge })),
        })
        setSettlement(result.quyetToan); setNotice('Đã thanh lý hợp đồng và ghi giao dịch quyết toán.'); setReload((value) => value + 1); onChanged()
      })
    }}>
      <p>Kỳ đang mở: {openPeriod ? `${openPeriod.thang}/${openPeriod.nam}` : 'Chưa có kỳ đang mở'}. <a href={`/ghi-chi-so?toaNhaId=${toaNhaId}`}>Mở màn ghi chỉ số để bổ sung ảnh công tơ nếu có yêu cầu.</a></p>
      {meters.map((meter) => <label key={meter.id} style={field}>{meter.tenDichVu} — chỉ số cuối (đầu kỳ {meter.chiSoDau})<input aria-label={`Chỉ số cuối ${meter.tenDichVu}`} value={readings[meter.id] ?? ''} onChange={(event) => setReadings((current) => ({ ...current, [meter.id]: event.target.value }))} inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" required style={input} /></label>)}
      <label><input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} /> Đã kiểm tra và xác nhận các mức tiêu thụ bất thường (nếu có).</label>
      <label style={field}>Khấu trừ hư hỏng (đồng)<input aria-label="Khấu trừ hư hỏng" value={damage} onChange={(event) => setDamage(event.target.value)} required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" style={input} /></label>
      <label style={field}>Lý do khấu trừ / ghi chú quyết toán<textarea value={settlementReason} onChange={(event) => setSettlementReason(event.target.value)} required={damage !== '0'} style={input} /></label>
      <label><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} /> Tôi xác nhận chỉ số cuối, tiền cọc và công nợ để kết thúc hợp đồng.</label>
      <Button type="submit" blocked={busy || !confirm || !openPeriod} blockedReason="Cần kỳ đang mở và xác nhận dữ liệu trước khi quyết toán.">Xác nhận trả phòng và quyết toán</Button>
    </form></details> : <p>Hợp đồng đã thanh lý.</p>}
    {settlement ? <div style={box} role="status"><h4>Kết quả quyết toán</h4><span>Đã thu cọc: {dinhDangTien(settlement.daThuCoc)} đ</span><span>Công nợ: {dinhDangTien(settlement.congNo)} đ · Khấu trừ: {dinhDangTien(settlement.khauTru)} đ</span><strong>Hoàn cọc: {dinhDangTien(settlement.hoanCoc)} đ</strong>
      {settlement.hoaDonQuyetToanId !== null ? <FinancePaymentPanel token={token} hoaDonId={settlement.hoaDonQuyetToanId} trangThai="DA_PHAT_HANH" /> : null}
    </div> : null}
  </section>
}
