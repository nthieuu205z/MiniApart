import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchKyThanhToan, type ThongTinKyThanhToan } from './api'
import { managementRequest, type Service } from './managementApi'
import { Field, Feedback, SaveButton, fieldStyle, gridStyle, today, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { DauTrang } from './design/layout/DauTrang'
import { DataTable, type DataTableColumn } from './design/table/DataTable'

type Price = { id: number; donGia: string; ngayHieuLuc: string; dangApDung: boolean }
type Tier = { bac: number; tuSoLuong: string; denSoLuong: string; tyLe: string }
type TierSet = { ngayHieuLuc: string; dangApDung: boolean; cacBac: Tier[] }
const MAU_DICH_VU_GOI_Y = [
  { nhan: 'Điện (kWh)', ten: 'Điện sinh hoạt', cachTinh: 'THEO_CHI_SO', cheDoGia: 'BAC_THANG', donVi: 'kWh', laDien: true },
  { nhan: 'Nước (m³)', ten: 'Nước sinh hoạt', cachTinh: 'THEO_CHI_SO', cheDoGia: 'CO_DINH', donVi: 'm³', laDien: false },
  { nhan: 'Internet', ten: 'Internet Wifi', cachTinh: 'CO_DINH', cheDoGia: 'CO_DINH', donVi: 'Phòng', laDien: false },
  { nhan: 'Rác & Vệ sinh', ten: 'Vệ sinh & Rác', cachTinh: 'THEO_NGUOI', cheDoGia: 'CO_DINH', donVi: 'Người', laDien: false },
  { nhan: 'Gửi xe máy', ten: 'Gửi xe máy', cachTinh: 'THEO_SO_LUONG', cheDoGia: 'CO_DINH', donVi: 'Chiếc', laDien: false },
] as const

const empty = { ten: '', cachTinh: 'THEO_CHI_SO', cheDoGia: 'CO_DINH', donVi: 'kWh', laDien: false }
export default function DichVuVaKy({ token }: { token: string }) {
  const building = useBuildings(token, true)
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
  const formRef = useRef<HTMLDivElement>(null)
  async function load() { if (!building.buildingId) return; const [a, b] = await Promise.all([managementRequest<Service[]>(token, `/api/toa-nha/${building.buildingId}/dich-vu`), fetchKyThanhToan(token, building.buildingId)]); setServices(a); setPeriods(b) }
  useEffect(() => { setSelected(null); setForm(empty); if (building.buildingId) void action.run(load).then(() => action.setSuccess(null)) }, [building.buildingId, token])
  useEffect(() => {
    if (!selected) {
      setPrices([])
      setSets([])
      return
    }
    let active = true
    Promise.allSettled([
      managementRequest<Price[]>(token, `/api/dich-vu/${selected}/bang-gia`),
      managementRequest<TierSet[]>(token, `/api/dich-vu/${selected}/bac-thang`),
    ]).then(([resPrices, resSets]) => {
      if (!active) return
      if (resPrices.status === 'fulfilled') {
        setPrices(resPrices.value)
      } else {
        setPrices([])
        if (form.cheDoGia === 'CO_DINH') {
          action.setError(resPrices.reason instanceof Error ? resPrices.reason.message : 'Không thể tải bảng giá cố định')
        }
      }
      if (resSets.status === 'fulfilled') {
        setSets(resSets.value)
      } else {
        setSets([])
        if (form.cheDoGia === 'BAC_THANG') {
          action.setError(resSets.reason instanceof Error ? resSets.reason.message : 'Không thể tải bảng giá bậc thang')
        }
      }
    })
    return () => {
      active = false
    }
  }, [selected, token, form.cheDoGia])
  async function saveService(e: FormEvent) { e.preventDefault(); if (!building.buildingId) return; await action.run(async () => { const row = await managementRequest<Service>(token, `/api/toa-nha/${building.buildingId}/dich-vu${selected ? `/${selected}` : ''}`, selected ? 'PUT' : 'POST', form); await load(); setSelected(row.id) }) }
  async function savePrice(e: FormEvent) { e.preventDefault(); if (!selected) return; await action.run(async () => { if (form.cheDoGia === 'BAC_THANG') { await managementRequest(token, `/api/dich-vu/${selected}/bac-thang`, 'POST', { ngayHieuLuc: date, giaBanLeBinhQuan: average, cacBac: tiers.map((t) => ({ ...t, denSoLuong: t.denSoLuong || null })) }); setSets(await managementRequest(token, `/api/dich-vu/${selected}/bac-thang`)) } else { await managementRequest(token, `/api/dich-vu/${selected}/bang-gia`, 'POST', { ngayHieuLuc: date, donGia: price }); setPrices(await managementRequest(token, `/api/dich-vu/${selected}/bang-gia`)) } }, 'Đã thêm phiên bản giá mới; lịch sử giá được giữ nguyên.') }
  const dongForm = { display: 'grid', gap: 14 } as const
  const moiDichVu = () => { setSelected(null); setForm(empty); formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }) }
  const suaDichVu = (s: Service) => { setSelected(s.id); setForm({ ten: s.ten, cachTinh: s.cachTinh, cheDoGia: s.cheDoGia, donVi: s.donVi, laDien: s.laDien }); formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }) }
  const cot: DataTableColumn<Service>[] = [
    { key: 'ten', label: 'Dịch vụ', the: 'tieu-de', sortable: true, sortValue: (s) => s.ten, render: (s) => <><span className="td-main">{s.ten}</span><div className="td-sub">{labelCalculation(s.cachTinh)} · {s.cheDoGia === 'BAC_THANG' ? 'Bậc thang' : 'Đơn giá cố định'} · {s.donVi}</div></> },
    { key: 'trangThai', label: 'Trạng thái', render: (s) => <StatusTag tone={s.dangSuDung ? 'done' : 'closed'}>{s.dangSuDung ? 'Đang sử dụng' : 'Ngừng sử dụng'}</StatusTag> },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (s) => <div className="td-acts" style={{ flexWrap: 'wrap' }}>
        <Button variant="secondary" size="sm" onClick={() => suaDichVu(s)}>Sửa dịch vụ và giá</Button>
        <Button variant="text" size="sm" blocked={action.busy} onClick={() => void action.run(async () => { await managementRequest(token, `/api/toa-nha/${building.buildingId}/dich-vu/${s.id}/trang-thai`, 'PUT', { dangSuDung: !s.dangSuDung }); await load() })}>{s.dangSuDung ? 'Ngừng sử dụng' : 'Sử dụng lại'}</Button>
      </div>,
    },
  ]
  const soDangDung = services.filter((s) => s.dangSuDung).length
  const kyMo = periods.find((p) => p.trangThai !== 'DA_CHOT')
  return <section aria-label="Giá dịch vụ & cài đặt" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <style>{CSS_BO_CUC}</style>
    <DauTrang
      tieuDe="Giá dịch vụ & cài đặt"
      phu={`${building.buildings.find((b) => b.id === building.buildingId)?.ten ?? 'Chưa chọn toà'} · áp dụng cho hoá đơn từ tháng sau`}
      hanhDong={<>
        <label className="sr-only" htmlFor="dich-vu-toa">Toà nhà</label>
        <select id="dich-vu-toa" className="select" style={{ width: 220 }} value={building.buildingId ?? ''} onChange={(e) => building.setBuildingId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Chọn toà nhà</option>{building.buildings.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}
        </select>
        <Button variant="secondary" onClick={moiDichVu}><Icon name="plus" />Thêm dịch vụ</Button>
      </>}
    />
    <Feedback error={action.error ?? building.error} success={action.success} />
    <Card title="Mở tháng tính tiền mới" action={<a className="link-more brand" href="/chu-ky">Ghi chỉ số, khoá chỉ số và gửi hoá đơn nằm ở Tháng tính tiền →</a>}>
      <div className="row-wrap" style={{ alignItems: 'flex-end', gap: 12 }}>
        <span className="t-meta">{kyMo ? `Tháng đang mở: ${kyMo.thang}/${kyMo.nam}` : 'Chưa có tháng đang mở'}</span>
        <span className="push" />
        <form onSubmit={(e) => { e.preventDefault(); if (building.buildingId) void action.run(async () => { const [nam, thang] = month.split('-').map(Number); await managementRequest(token, `/api/toa-nha/${building.buildingId}/ky-thanh-toan`, 'POST', { nam, thang }); await load() }, 'Đã mở tháng tính tiền.') }} className="row-wrap" style={{ alignItems: 'flex-end', gap: 12 }}>
          <Field title="Tháng cần mở"><input style={fieldStyle} type="month" required value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
          <Button type="submit" variant="secondary" blocked={action.busy || !building.buildingId}>Mở tháng tính tiền</Button>
        </form>
      </div>
    </Card>
    <div className="dv-grid">
      <Card>
        {services.length === 0
          ? <EmptyState title="Chưa có dịch vụ nào" body="Thêm dịch vụ đầu tiên ở biểu mẫu bên cạnh, rồi thêm bảng giá theo ngày hiệu lực." />
          : <DataTable rows={services} columns={cot} getRowId={(s) => s.id} timTheo={(s) => s.ten} searchLabel="Tìm dịch vụ" noun="dịch vụ" pageSize={20} />}
      </Card>
      <div ref={formRef} style={{ display: 'grid', gap: 16, minWidth: 0 }}>
        <Card title={selected ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}>
          <form onSubmit={saveService} style={dongForm}>
            <div className="row-wrap" aria-label="Mẫu dịch vụ gợi ý">
              {MAU_DICH_VU_GOI_Y.map((m) => (
                <button key={m.nhan} type="button" className="chip" onClick={() => setForm({ ten: m.ten, cachTinh: m.cachTinh, cheDoGia: m.cheDoGia, donVi: m.donVi, laDien: m.laDien })}>{m.nhan}</button>
              ))}
            </div>
            <div style={gridStyle}><Field title="Tên dịch vụ"><input style={fieldStyle} required value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} /></Field><Field title="Cách tính"><select style={fieldStyle} value={form.cachTinh} onChange={(e) => setForm({ ...form, cachTinh: e.target.value })}>{['THEO_CHI_SO','CO_DINH','THEO_NGUOI','THEO_SO_LUONG'].map((c) => <option key={c} value={c}>{labelCalculation(c)}</option>)}</select></Field><Field title="Chế độ giá"><select style={fieldStyle} value={form.cheDoGia} onChange={(e) => setForm({ ...form, cheDoGia: e.target.value })}><option value="CO_DINH">Đơn giá cố định</option><option value="BAC_THANG">Biểu giá bậc thang</option></select></Field><Field title="Đơn vị"><input style={fieldStyle} required value={form.donVi} onChange={(e) => setForm({ ...form, donVi: e.target.value })} /></Field></div>
            <label className="check"><input type="checkbox" checked={form.laDien} onChange={(e) => setForm({ ...form, laDien: e.target.checked })} /> Dịch vụ điện</label>
            <div className="row-wrap"><SaveButton busy={action.busy || !building.buildingId}>Lưu dịch vụ</SaveButton><Button variant="secondary" onClick={() => { setSelected(null); setForm(empty) }}>Tạo dịch vụ khác</Button></div>
          </form>
        </Card>
        {selected ? <Card title="Thêm phiên bản giá theo ngày hiệu lực">
          <form onSubmit={savePrice} style={dongForm}>
            <Field title="Ngày hiệu lực"><input type="date" style={fieldStyle} required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            {form.cheDoGia === 'BAC_THANG' ? <>
              <Field title="Giá bán lẻ điện bình quân (đồng)"><input style={fieldStyle} type="number" min="0" step="0.01" required value={average} onChange={(e) => setAverage(e.target.value)} /></Field>
              {tiers.map((tier, i) => <div key={i} className="card-sunken" style={dongForm}><strong>Bậc {i + 1}</strong><div style={gridStyle}>{(['tuSoLuong', 'denSoLuong', 'tyLe'] as const).map((key) => <Field key={key} title={{ tuSoLuong: 'Từ lượng', denSoLuong: 'Đến lượng (để trống: không giới hạn)', tyLe: 'Tỷ lệ so với giá bình quân' }[key]}><input style={fieldStyle} type="number" step="0.0001" min="0" required={key !== 'denSoLuong'} value={tier[key]} onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, [key]: e.target.value } : t))} /></Field>)}</div></div>)}
              <div className="row-wrap"><Button variant="secondary" onClick={() => {
                const lastTier = tiers.at(-1)
                const prevDen = lastTier?.denSoLuong?.trim()
                if (!prevDen || isNaN(Number(prevDen))) {
                  action.setError('Cần nhập giới hạn (Đến lượng) cho bậc hiện tại trước khi thêm bậc mới.')
                  return
                }
                const nextTu = String(Number(prevDen) + 1)
                setTiers([...tiers, { bac: tiers.length + 1, tuSoLuong: nextTu, denSoLuong: '', tyLe: '1' }])
              }}>Thêm bậc</Button>{tiers.length > 1 ? <Button variant="text" onClick={() => setTiers(tiers.slice(0, -1))}>Bỏ bậc cuối</Button> : null}</div>
              {sets.map((s) => <p key={s.ngayHieuLuc} className="t-sm" style={{ margin: 0 }}>Hiệu lực {s.ngayHieuLuc} · {s.cacBac.length} bậc{s.dangApDung ? ' · Đang áp dụng' : ''}</p>)}
            </> : <>
              <Field title="Đơn giá (đồng)"><input style={fieldStyle} type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
              {prices.map((p) => <p key={p.id} className="t-sm" style={{ margin: 0 }}>{p.ngayHieuLuc}: {p.donGia} đồng{p.dangApDung ? ' · Đang áp dụng' : ''}</p>)}
            </>}
            <div><Button type="submit" variant="secondary" blocked={action.busy}>Lưu phiên bản giá</Button></div>
          </form>
        </Card> : null}
      </div>
    </div>
  </section>
}
const CSS_BO_CUC = '.dv-grid { display: grid; gap: 16px; min-width: 0 } @media (min-width: 1100px) { .dv-grid { grid-template-columns: minmax(0, 1.5fr) minmax(340px, 1fr); align-items: start } }'
function labelCalculation(value: string) { return ({ THEO_CHI_SO:'Theo chỉ số',CO_DINH:'Cố định theo phòng',THEO_NGUOI:'Theo đầu người',THEO_SO_LUONG:'Theo số lượng' } as Record<string,string>)[value] ?? value }
