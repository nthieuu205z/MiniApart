import { useEffect, useState, type FormEvent } from 'react'
import { fetchKyThanhToan, type ThongTinKyThanhToan } from './api'
import { managementRequest, type Service } from './managementApi'
import { BuildingSelect, Field, Feedback, SaveButton, fieldStyle, gridStyle, panelStyle, rowStyle, today, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'

type Price = { id: number; donGia: string; ngayHieuLuc: string; dangApDung: boolean }
type Tier = { bac: number; tuSoLuong: string; denSoLuong: string; tyLe: string }
type TierSet = { ngayHieuLuc: string; dangApDung: boolean; cacBac: Tier[] }
const MAU_DICH_VU_GOI_Y = [
  { nhan: '⚡ Điện (kWh)', ten: 'Điện sinh hoạt', cachTinh: 'THEO_CHI_SO', cheDoGia: 'BAC_THANG', donVi: 'kWh', laDien: true },
  { nhan: '⚡ Nước (m³)', ten: 'Nước sinh hoạt', cachTinh: 'THEO_CHI_SO', cheDoGia: 'CO_DINH', donVi: 'm³', laDien: false },
  { nhan: '⚡ Internet', ten: 'Internet Wifi', cachTinh: 'CO_DINH', cheDoGia: 'CO_DINH', donVi: 'Phòng', laDien: false },
  { nhan: '⚡ Rác & Vệ sinh', ten: 'Vệ sinh & Rác', cachTinh: 'THEO_NGUOI', cheDoGia: 'CO_DINH', donVi: 'Người', laDien: false },
  { nhan: '⚡ Gửi xe máy', ten: 'Gửi xe máy', cachTinh: 'THEO_SO_LUONG', cheDoGia: 'CO_DINH', donVi: 'Chiếc', laDien: false },
] as const

const empty = { ten: '', cachTinh: 'THEO_CHI_SO', cheDoGia: 'CO_DINH', donVi: 'kWh', laDien: false }
export default function DichVuVaKy({ token }: { token: string }) {
  const building = useBuildings(token)
  const [services, setServices] = useState<Service[]>([])
  const [periods, setPeriods] = useState<ThongTinKyThanhToan[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [form, setForm] = useState(empty)
  const [prices, setPrices] = useState<Price[]>([])
  const [sets, setSets] = useState<TierSet[]>([])
  const [date, setDate] = useState(today())
  const [price, setPrice] = useState('')
  const [average, setAverage] = useState('')
  const [tiers, setTiers] = useState<Tier[]>([{ bac: 1, tuSoLuong: '0', denSoLuong: '', tyLe: '1' }])
  const [month, setMonth] = useState(today().slice(0, 7))
  const action = useAction()
  async function load() { if (!building.buildingId) return; const [a, b] = await Promise.all([managementRequest<Service[]>(token, `/api/toa-nha/${building.buildingId}/dich-vu`), fetchKyThanhToan(token, building.buildingId)]); setServices(a); setPeriods(b) }
  useEffect(() => { setSelected(null); setForm(empty); if (building.buildingId) void action.run(load, 'Đã tải dịch vụ và kỳ thanh toán.') }, [building.buildingId, token])
  useEffect(() => { if (!selected) { setPrices([]); setSets([]); return } let active = true; Promise.all([managementRequest<Price[]>(token, `/api/dich-vu/${selected}/bang-gia`), managementRequest<TierSet[]>(token, `/api/dich-vu/${selected}/bac-thang`)]).then(([a,b]) => { if (active) { setPrices(a); setSets(b) } }).catch((e: Error) => { if (active) action.setError(e.message) }); return () => { active = false } }, [selected, token])
  async function saveService(e: FormEvent) { e.preventDefault(); if (!building.buildingId) return; await action.run(async () => { const row = await managementRequest<Service>(token, `/api/toa-nha/${building.buildingId}/dich-vu${selected ? `/${selected}` : ''}`, selected ? 'PUT' : 'POST', form); await load(); setSelected(row.id) }) }
  async function savePrice(e: FormEvent) { e.preventDefault(); if (!selected) return; await action.run(async () => { if (form.cheDoGia === 'BAC_THANG') { await managementRequest(token, `/api/dich-vu/${selected}/bac-thang`, 'POST', { ngayHieuLuc: date, giaBanLeBinhQuan: average, cacBac: tiers.map((t) => ({ ...t, denSoLuong: t.denSoLuong || null })) }); setSets(await managementRequest(token, `/api/dich-vu/${selected}/bac-thang`)) } else { await managementRequest(token, `/api/dich-vu/${selected}/bang-gia`, 'POST', { ngayHieuLuc: date, donGia: price }); setPrices(await managementRequest(token, `/api/dich-vu/${selected}/bang-gia`)) } }, 'Đã thêm phiên bản giá mới; lịch sử giá được giữ nguyên.') }
  return <div style={{ display: 'grid', gap: 18 }}><h2>Dịch vụ, bảng giá và kỳ thanh toán</h2><Feedback error={action.error ?? building.error} success={action.success} /><BuildingSelect buildings={building.buildings} value={building.buildingId} onChange={building.setBuildingId} />
    <section style={panelStyle}><h3>Kỳ thanh toán</h3><div style={rowStyle}>{periods.map((p) => <span key={p.id}>{p.thang}/{p.nam} · {p.trangThai === 'DA_CHOT' ? 'Đã chốt' : 'Đang mở'}</span>)}</div><form onSubmit={(e) => { e.preventDefault(); if (building.buildingId) void action.run(async () => { const [nam, thang] = month.split('-').map(Number); await managementRequest(token, `/api/toa-nha/${building.buildingId}/ky-thanh-toan`, 'POST', { nam, thang }); await load() }, 'Đã mở kỳ thanh toán.') }} style={rowStyle}><Field title="Tháng cần mở"><input style={fieldStyle} type="month" required value={month} onChange={(e) => setMonth(e.target.value)} /></Field><SaveButton busy={action.busy || !building.buildingId}>Mở kỳ thanh toán</SaveButton></form></section>
    <div style={gridStyle}>{services.map((s) => <article style={panelStyle} key={s.id}><strong>{s.ten}</strong><span>{labelCalculation(s.cachTinh)} · {s.cheDoGia === 'BAC_THANG' ? 'Bậc thang' : 'Đơn giá cố định'} · {s.donVi}</span><span>{s.dangSuDung ? 'Đang sử dụng' : 'Ngừng sử dụng'}</span><div style={rowStyle}><Button variant="secondary" onClick={() => { setSelected(s.id); setForm({ ten: s.ten, cachTinh: s.cachTinh, cheDoGia: s.cheDoGia, donVi: s.donVi, laDien: s.laDien }) }}>Sửa dịch vụ và giá</Button><Button variant="text" blocked={action.busy} onClick={() => void action.run(async () => { await managementRequest(token, `/api/toa-nha/${building.buildingId}/dich-vu/${s.id}/trang-thai`, 'PUT', { dangSuDung: !s.dangSuDung }); await load() })}>{s.dangSuDung ? 'Ngừng sử dụng' : 'Sử dụng lại'}</Button></div></article>)}</div>
    <form onSubmit={saveService} style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0 }}>{selected ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MAU_DICH_VU_GOI_Y.map((m) => (
            <button
              key={m.nhan}
              type="button"
              style={{ padding: '4px 8px', fontSize: 11, fontFamily: 'var(--ma-font-mono)', borderRadius: 'var(--ma-radius-pill)', border: '1px solid var(--ma-brand-accent)', background: 'var(--ma-brand-accent-light)', color: 'var(--ma-brand-accent)', cursor: 'pointer' }}
              onClick={() => setForm({ ten: m.ten, cachTinh: m.cachTinh, cheDoGia: m.cheDoGia, donVi: m.donVi, laDien: m.laDien })}
            >
              {m.nhan}
            </button>
          ))}
        </div>
      </div>
      <div style={gridStyle}><Field title="Tên dịch vụ"><input style={fieldStyle} required value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} /></Field><Field title="Cách tính"><select style={fieldStyle} value={form.cachTinh} onChange={(e) => setForm({ ...form, cachTinh: e.target.value })}>{['THEO_CHI_SO','CO_DINH','THEO_NGUOI','THEO_SO_LUONG'].map((c) => <option key={c} value={c}>{labelCalculation(c)}</option>)}</select></Field><Field title="Chế độ giá"><select style={fieldStyle} value={form.cheDoGia} onChange={(e) => setForm({ ...form, cheDoGia: e.target.value })}><option value="CO_DINH">Đơn giá cố định</option><option value="BAC_THANG">Biểu giá bậc thang</option></select></Field><Field title="Đơn vị"><input style={fieldStyle} required value={form.donVi} onChange={(e) => setForm({ ...form, donVi: e.target.value })} /></Field><label><input type="checkbox" checked={form.laDien} onChange={(e) => setForm({ ...form, laDien: e.target.checked })} /> Dịch vụ điện</label></div><div style={rowStyle}><SaveButton busy={action.busy || !building.buildingId}>Lưu dịch vụ</SaveButton><Button variant="secondary" onClick={() => { setSelected(null); setForm(empty) }}>Tạo dịch vụ khác</Button></div></form>
    {selected ? <form onSubmit={savePrice} style={panelStyle}><h3>Thêm phiên bản giá theo ngày hiệu lực</h3><Field title="Ngày hiệu lực"><input type="date" style={fieldStyle} required value={date} onChange={(e) => setDate(e.target.value)} /></Field>{form.cheDoGia === 'BAC_THANG' ? <><Field title="Giá bán lẻ điện bình quân (đồng)"><input style={fieldStyle} type="number" min="0" step="0.01" required value={average} onChange={(e) => setAverage(e.target.value)} /></Field>{tiers.map((tier,i) => <div key={i} style={gridStyle}><strong>Bậc {i+1}</strong>{(['tuSoLuong','denSoLuong','tyLe'] as const).map((key) => <Field key={key} title={{ tuSoLuong:'Từ lượng', denSoLuong:'Đến lượng (để trống: không giới hạn)', tyLe:'Tỷ lệ so với giá bình quân' }[key]}><input style={fieldStyle} type="number" step="0.0001" min="0" required={key !== 'denSoLuong'} value={tier[key]} onChange={(e) => setTiers(tiers.map((t,j) => j === i ? { ...t, [key]: e.target.value } : t))} /></Field>)}</div>)}<div style={rowStyle}><Button variant="secondary" onClick={() => setTiers([...tiers, { bac: tiers.length+1, tuSoLuong: tiers.at(-1)?.denSoLuong || '0', denSoLuong:'',tyLe:'1' }])}>Thêm bậc</Button>{tiers.length > 1 ? <Button variant="text" onClick={() => setTiers(tiers.slice(0,-1))}>Bỏ bậc cuối</Button> : null}</div>{sets.map((s) => <p key={s.ngayHieuLuc}>Hiệu lực {s.ngayHieuLuc} · {s.cacBac.length} bậc{s.dangApDung ? ' · Đang áp dụng' : ''}</p>)}</> : <><Field title="Đơn giá (đồng)"><input style={fieldStyle} type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} /></Field>{prices.map((p) => <p key={p.id}>{p.ngayHieuLuc}: {p.donGia} đồng{p.dangApDung ? ' · Đang áp dụng' : ''}</p>)}</>}<SaveButton busy={action.busy}>Lưu phiên bản giá</SaveButton></form> : null}
  </div>
}
function labelCalculation(value: string) { return ({ THEO_CHI_SO:'Theo chỉ số',CO_DINH:'Cố định theo phòng',THEO_NGUOI:'Theo đầu người',THEO_SO_LUONG:'Theo số lượng' } as Record<string,string>)[value] ?? value }
