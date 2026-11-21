import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchChiSoDichVu, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, fetchToaNha, type ThongTinGhiChiSo, type ThongTinHoaDonQuanLy, type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinToaNha } from './api'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableChip, type DataTableColumn } from './design/table/DataTable'
import FinancePaymentPanel, { message } from './FinancePaymentPanel'
import { mapTrangThaiHoaDon } from './HoaDonQuanLy'
import { collectDeposit, financeRequest, getDeposit, localDate, validMoney, type Deposit, type Settlement } from './financeApi'

type Props = { token: string; mobile?: boolean; vaiTro?: string }

// Hai cột (bảng | form ghi nhận) từ 1100px; dưới đó form nằm dưới bảng.
const CSS_BO_CUC = '@media (min-width: 768px) { .tt-grid .table td { white-space: nowrap } } .tt-grid { display: grid; gap: 16px; min-width: 0 } @media (min-width: 1100px) { .tt-grid { grid-template-columns: minmax(0, 1.4fr) minmax(340px, 1fr); align-items: start } .tt-panel { position: sticky; top: 16px } }'

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
  const panelRef = useRef<HTMLDivElement>(null)
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
  // Hoá đơn còn nợ lên trước, hạn sớm trước.
  const hangHoaDon = useMemo(() => [...invoices].sort((a, b) => (Number(Number(b.conLai) > 0) - Number(Number(a.conLai) > 0)) || a.hanThanhToan.localeCompare(b.hanThanhToan)), [invoices])
  const hangHopDong = useMemo(() => [...contracts].sort((a, b) => a.soPhong.localeCompare(b.soPhong, 'vi', { numeric: true })), [contracts])
  const cuonToiForm = () => panelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  const cotHoaDon = useMemo(() => cotHoaDonThu((id) => { setInvoice(String(id)); cuonToiForm() }, invoice), [invoice])
  const cotHopDong = useMemo(() => cotHopDongCoc((id) => { setContract(String(id)); cuonToiForm() }, contract), [contract])
  const tongPhaiThu = invoices.reduce((t, h) => t + Number(h.conLai), 0)
  const soConNo = invoices.filter((h) => Number(h.conLai) > 0).length

  return <section data-testid="collection-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="thu-tien-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <style>{CSS_BO_CUC}</style>
    <header className="topbar">
      <div className="title-block">
        <h1 className="h1" id="thu-tien-title">Thu tiền</h1>
        <p className="sub">{soConNo} hoá đơn còn nợ · còn phải thu {dinhDangTien(tongPhaiThu)} ₫ · mọi giao dịch được lưu vào sổ và có biên lai</p>
      </div>
      <div className="topbar-actions">
        <label className="sr-only" htmlFor="thu-tien-toa">Toà nhà</label>
        <select id="thu-tien-toa" className="select" style={{ width: 220 }} value={building} onChange={(event) => { setBuilding(event.target.value); setInvoice(''); setContract(''); setInvoices([]); setContracts([]) }}>
          <option value="">Chọn toà nhà</option>{buildings.map((value) => <option key={value.id} value={value.id}>{value.ten}</option>)}
        </select>
      </div>
    </header>
    {error ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p> : null}
    <div className="tabs" role="tablist" aria-label="Loại khoản thu">
      <button type="button" role="tab" className="tab" aria-selected={tab === 'hoa-don'} onClick={() => setTab('hoa-don')}>Thu theo hoá đơn</button>
      <button type="button" role="tab" className="tab" aria-selected={tab === 'coc'} onClick={() => setTab('coc')}>Tiền cọc và trả phòng</button>
    </div>
    {!building ? <EmptyState title="Chọn một toà nhà để thu tiền." /> : <div className="tt-grid">
      <Card>
        {tab === 'hoa-don'
          ? <DataTable rows={hangHoaDon} columns={cotHoaDon} getRowId={(h) => h.hoaDonId} chips={CHIP_HOA_DON} defaultChip="CON_NO" timTheo={(h) => `${h.maHoaDon} ${h.soPhong} ${h.nguoiThue}`} searchLabel="Tìm mã hoá đơn, phòng, người thuê" noun="hoá đơn" pageSize={10} />
          : <DataTable rows={hangHopDong} columns={cotHopDong} getRowId={(h) => h.id} timTheo={(h) => `${h.soPhong} ${h.hoTenNguoiThue}`} searchLabel="Tìm phòng, người thuê" noun="hợp đồng" pageSize={10} />}
      </Card>
      <div ref={panelRef} className="tt-panel">
        {tab === 'hoa-don'
          ? <Card>{selected ? <>
            <p className="t-sm" style={{ margin: '0 0 12px' }}>Phòng {selected.soPhong} · {selected.nguoiThue} · Còn phải thu <strong>{dinhDangTien(selected.conLai)} đ</strong></p>
            <FinancePaymentPanel key={selected.hoaDonId} token={token} hoaDonId={selected.hoaDonId} maHoaDon={selected.maHoaDon} conLai={selected.conLai} trangThai={selected.trangThai} onChanged={() => setReload((value) => value + 1)} />
          </> : <EmptyState title="Chưa chọn hoá đơn" body="Bấm “Thu tiền” ở một hoá đơn để thu tiền, tạo QR hoặc xem biên lai và bút toán đối ứng." />}</Card>
          : <Card>{selectedContract
            ? <ContractFinance key={selectedContract.id} token={token} toaNhaId={Number(building)} contract={selectedContract} periods={periods} onChanged={() => setReload((value) => value + 1)} />
            : <EmptyState title="Chưa chọn hợp đồng" body="Bấm “Thu cọc” ở một hợp đồng để thu cọc hoặc quyết toán khi trả phòng." />}</Card>}
      </div>
    </div>}
  </section>
}

const CHIP_HOA_DON: DataTableChip<ThongTinHoaDonQuanLy>[] = [
  { key: 'CON_NO', label: 'Còn nợ', match: (h) => Number(h.conLai) > 0 },
  { key: 'QUA_HAN', label: 'Quá hạn', match: (h) => h.trangThai === 'QUA_HAN' },
  { key: 'DA_THANH_TOAN', label: 'Đã thanh toán', match: (h) => h.trangThai === 'DA_THANH_TOAN' },
]

function cotHoaDonThu(chon: (id: number) => void, dangChon: string): DataTableColumn<ThongTinHoaDonQuanLy>[] {
  return [
    { key: 'ma', label: 'Hoá đơn', the: 'tieu-de', sortable: true, sortValue: (h) => h.maHoaDon, render: (h) => <><span className="td-main">{h.maHoaDon}</span><div className="td-sub" title={h.nguoiThue}>Phòng {h.soPhong} · {h.nguoiThue}</div></> },
    { key: 'conLai', label: 'Còn lại', align: 'num', sortable: true, sortValue: (h) => Number(h.conLai), render: (h) => <span className="t-money" style={{ color: Number(h.conLai) > 0 ? 'var(--ma-urgent)' : 'var(--ma-done-text)' }}>{dinhDangTien(h.conLai)} ₫</span> },
    { key: 'trangThai', label: 'Trạng thái', render: (h) => { const t = mapTrangThaiHoaDon(h.trangThai); return <StatusTag tone={t.tone}>{t.nhan}</StatusTag> } },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (h) => <div className="td-acts"><button type="button" className="btn btn-secondary btn-sm" aria-pressed={dangChon === String(h.hoaDonId)} aria-label={`${Number(h.conLai) > 0 ? 'Thu tiền' : 'Xem sổ'} hoá đơn ${h.maHoaDon}`} onClick={() => chon(h.hoaDonId)}>{Number(h.conLai) > 0 ? 'Thu tiền' : 'Xem sổ'}</button></div>,
    },
  ]
}

function cotHopDongCoc(chon: (id: number) => void, dangChon: string): DataTableColumn<ThongTinHopDong>[] {
  return [
    { key: 'phong', label: 'Phòng', the: 'tieu-de', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <><span className="td-main">Phòng {h.soPhong}</span><div className="td-sub" title={h.hoTenNguoiThue}>{h.hoTenNguoiThue} · HĐ #{h.id}</div></> },
    { key: 'tienCoc', label: 'Tiền cọc', align: 'num', sortable: true, sortValue: (h) => Number(h.tienCoc), render: (h) => <>{dinhDangTien(h.tienCoc)} ₫</> },
    { key: 'trangThai', label: 'Trạng thái', render: (h) => <StatusTag tone={h.trangThai === 'DA_THANH_LY' ? 'closed' : 'done'}>{h.tenTrangThai}</StatusTag> },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (h) => <div className="td-acts"><button type="button" className="btn btn-secondary btn-sm" aria-pressed={dangChon === String(h.id)} aria-label={`${h.trangThai === 'DA_THANH_LY' ? 'Xem cọc' : 'Thu cọc'} hợp đồng ${h.id}`} onClick={() => chon(h.id)}>{h.trangThai === 'DA_THANH_LY' ? 'Xem cọc' : 'Thu cọc'}</button></div>,
    },
  ]
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
  const lap = { display: 'grid', gap: 12 } as const
  return <section style={lap} aria-label="Tiền cọc và quyết toán hợp đồng">
    {error ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p> : null}{notice ? <p role="status" className="alert alert-success"><Icon name="check-circle" />{notice}</p> : null}
    {deposit ? <>
      <h2 className="h3">Tiền cọc hợp đồng #{contract.id}</h2>
      <div className="facts" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}><div className="fact"><div className="k">Thoả thuận</div><div className="v">{dinhDangTien(deposit.tienCocThoaThuan)} đ</div></div><div className="fact"><div className="k">Đã thu</div><div className="v">{dinhDangTien(deposit.tongDaThu)} đ</div></div><div className="fact"><div className="k">Còn thiếu</div><div className="v">{dinhDangTien(deposit.conLaiChuaThu)} đ</div></div></div>
      {contract.trangThai !== 'DA_THANH_LY' ? <form className="card-sunken" style={lap} onSubmit={(event) => { event.preventDefault(); if (validMoney(amount)) void run(async () => { await collectDeposit(token, contract.id, amount, date, reason); setNotice('Đã ghi nhận thu cọc.'); setReload((value) => value + 1); onChanged() }) }}>
        <label className="field"><span className="label">Số tiền cọc thu</span><input className="input" aria-label="Số tiền cọc thu" value={amount} onChange={(event) => setAmount(event.target.value)} required inputMode="decimal" /></label>
        <label className="field"><span className="label">Ngày thu cọc</span><input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="field"><span className="label">Ghi chú thu cọc</span><input className="input" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <Button type="submit" blocked={busy || !validMoney(amount)} blockedReason="Nhập số tiền cọc lớn hơn 0 và chờ giao dịch trước hoàn tất.">Ghi nhận thu cọc</Button>
      </form> : null}
      {deposit.giaoDich.map((entry) => <p key={entry.id} className="t-sm" style={{ margin: 0 }}>{entry.maBienLai} · {entry.loai} · {entry.ngay} · {dinhDangTien(entry.soTien)} đ {entry.lyDo ? `· ${entry.lyDo}` : ''}</p>)}
    </> : <EmptyState kind="loading" title="Đang tải tiền cọc…" />}
    {contract.trangThai !== 'DA_THANH_LY' ? <details><summary className="t-strong" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>Chốt chỉ số cuối, trả phòng và quyết toán</summary><form className="card-sunken" style={lap} onSubmit={(event) => {
      event.preventDefault()
      if (!confirm || !openPeriod) return
      void run(async () => {
        const result = await financeRequest<ThongTinHopDong & { quyetToan: Settlement }>(token, `/api/hop-dong/${contract.id}/thanh-ly`, 'POST', {
          khauTruHuHong: damage, lyDo: settlementReason, chiSoCuoi: meters.map((meter) => ({ phongId: contract.phongId, dichVuId: meter.id, chiSoCuoi: readings[meter.id], coThayCongTo: meter.coThayCongTo, chiSoCuoiCongToCu: meter.chiSoCuoiCongToCu, chiSoDauCongToMoi: meter.chiSoDauCongToMoi, xacNhanCanhBao: acknowledge })),
        })
        setSettlement(result.quyetToan); setNotice('Đã thanh lý hợp đồng và ghi giao dịch quyết toán.'); setReload((value) => value + 1); onChanged()
      })
    }}>
      <p className="t-sm" style={{ margin: 0 }}>Kỳ đang mở: {openPeriod ? `${openPeriod.thang}/${openPeriod.nam}` : 'Chưa có kỳ đang mở'}. <a href={`/ghi-chi-so?toaNhaId=${toaNhaId}`}>Mở màn ghi chỉ số để bổ sung ảnh công tơ nếu có yêu cầu.</a></p>
      {meters.map((meter) => <label key={meter.id} className="field"><span className="label">{meter.tenDichVu} — chỉ số cuối (đầu kỳ {meter.chiSoDau})</span><input className="input" aria-label={`Chỉ số cuối ${meter.tenDichVu}`} value={readings[meter.id] ?? ''} onChange={(event) => setReadings((current) => ({ ...current, [meter.id]: event.target.value }))} inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" required /></label>)}
      <label className="check"><input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} /> Đã kiểm tra và xác nhận các mức tiêu thụ bất thường (nếu có).</label>
      <label className="field"><span className="label">Khấu trừ hư hỏng (đồng)</span><input className="input" aria-label="Khấu trừ hư hỏng" value={damage} onChange={(event) => setDamage(event.target.value)} required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" /></label>
      <label className="field"><span className="label">Lý do khấu trừ / ghi chú quyết toán</span><textarea className="input" style={{ height: 'auto', minHeight: 88, padding: '10px 14px' }} value={settlementReason} onChange={(event) => setSettlementReason(event.target.value)} required={damage !== '0'} /></label>
      <label className="check"><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} /> Tôi xác nhận chỉ số cuối, tiền cọc và công nợ để kết thúc hợp đồng.</label>
      <Button type="submit" variant="secondary" blocked={busy || !confirm || !openPeriod} blockedReason="Cần kỳ đang mở và xác nhận dữ liệu trước khi quyết toán.">Xác nhận trả phòng và quyết toán</Button>
    </form></details> : <p className="t-sm" style={{ margin: 0 }}>Hợp đồng đã thanh lý.</p>}
    {settlement ? <div className="card-sunken" style={lap} role="status"><h3 className="h3">Kết quả quyết toán</h3><span>Đã thu cọc: {dinhDangTien(settlement.daThuCoc)} đ</span><span>Công nợ: {dinhDangTien(settlement.congNo)} đ · Khấu trừ: {dinhDangTien(settlement.khauTru)} đ</span><strong>Hoàn cọc: {dinhDangTien(settlement.hoanCoc)} đ</strong>
      {settlement.hoaDonQuyetToanId !== null ? <FinancePaymentPanel token={token} hoaDonId={settlement.hoaDonQuyetToanId} trangThai="DA_PHAT_HANH" /> : null}
    </div> : null}
  </section>
}
