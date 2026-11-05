import { useEffect, useState, type FormEvent } from 'react'
import { managementRequest, type Tenant } from './managementApi'
import { Field, Feedback, SaveButton, fieldStyle, gridStyle, panelStyle, rowStyle, useAction } from './ManagementShared'
import { Button } from './design/core/Button'
import { fetchLienKetAnh } from './api'

const empty = { hoTen: '', ngaySinh: '', soDienThoai: '', soGiayTo: '', queQuan: '' }
export default function HoSoNguoiThue({ token }: { token: string }) {
  const [rows, setRows] = useState<Tenant[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(empty)
  const [id, setId] = useState<number | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const action = useAction()
  async function load() { setRows(await managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`)) }
  useEffect(() => { let active = true; managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`).then((data) => { if (active) setRows(data) }).catch((e: Error) => { if (active) action.setError(e.message) }); return () => { active = false } }, [query, token])
  async function edit(tenantId: number) { await action.run(async () => { const row = await managementRequest<Tenant>(token, `/api/nguoi-thue/${tenantId}`); setId(row.id); setForm({ hoTen: row.hoTen, ngaySinh: row.ngaySinh, soDienThoai: row.soDienThoai, soGiayTo: row.soGiayTo ?? '', queQuan: row.queQuan }); setPhotoUrl(null) }, 'Đã mở hồ sơ để chỉnh sửa.') }
  async function save(event: FormEvent) { event.preventDefault(); await action.run(async () => { const row = await managementRequest<Tenant>(token, `/api/nguoi-thue${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', form); setId(row.id); await load() }) }
  async function upload() { if (!id || !photo) return; await action.run(async () => { const data = new FormData(); data.set('tep', photo); const result = await managementRequest<{ id: number }>(token, `/api/nguoi-thue/${id}/anh`, 'POST', data); setPhotoUrl(await fetchLienKetAnh(token, result.id)); setPhoto(null) }, 'Đã lưu ảnh giấy tờ.') }
  return <div style={{ display: 'grid', gap: 18 }}><h2>Hồ sơ người thuê</h2><Feedback error={action.error} success={action.success} />
    <Field title="Tìm theo tên hoặc số điện thoại"><input style={fieldStyle} type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
    <div style={gridStyle}>{rows.map((row) => <article key={row.id} style={panelStyle}><strong>#{row.id} · {row.hoTen}</strong><span>{row.soDienThoai} · {row.soGiayToChe}</span><span>{row.queQuan}</span>{row.canhBao?.map((s) => <span key={s}>{s}</span>)}<Button variant="secondary" blocked={action.busy} onClick={() => void edit(row.id)}>Xem và sửa hồ sơ</Button></article>)}</div>
    <form onSubmit={save} style={panelStyle}><h3>{id ? `Chỉnh sửa hồ sơ #${id}` : 'Thêm người thuê'}</h3><div style={gridStyle}>{Object.entries({ hoTen: 'Họ tên', ngaySinh: 'Ngày sinh', soDienThoai: 'Số điện thoại', soGiayTo: 'Số giấy tờ', queQuan: 'Quê quán' }).map(([key, label]) => <Field key={key} title={label}><input style={fieldStyle} required type={key === 'ngaySinh' ? 'date' : key === 'soDienThoai' ? 'tel' : 'text'} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></Field>)}</div><div style={rowStyle}><SaveButton busy={action.busy}>Lưu hồ sơ</SaveButton><Button variant="secondary" onClick={() => { setId(null); setForm(empty); setPhotoUrl(null) }}>Tạo hồ sơ khác</Button></div></form>
    {id ? <section style={panelStyle}><h3>Ảnh giấy tờ của hồ sơ #{id}</h3><Field title="Chọn ảnh giấy tờ"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></Field><Button blocked={action.busy || !photo} blockedReason={!photo ? 'Chọn ảnh để tải lên.' : undefined} onClick={() => void upload()}>Tải ảnh giấy tờ</Button>{photoUrl ? <img src={photoUrl} alt="Ảnh giấy tờ vừa tải lên" style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }} /> : null}</section> : null}
  </div>
}
