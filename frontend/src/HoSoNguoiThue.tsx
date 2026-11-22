import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { managementRequest, type Tenant } from './managementApi'
import { Feedback, useAction } from './ManagementShared'
import { CSS_BANG_QUAN_TRI, NguoiCoAvatar, nhomSoDienThoai } from './bangQuanTriChung'
import { Button } from './design/core/Button'
import { fetchLienKetAnh } from './api'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import './HoSoNguoiPhong.css'
import { DataTable, type DataTableColumn } from './design/table/DataTable'

const empty = { hoTen: '', ngaySinh: '', soDienThoai: '', soGiayTo: '', queQuan: '' }
const CSS_NGUOI_THUE = `${CSS_BANG_QUAN_TRI}
.nt-luoi { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.nt-canh-bao { display: flex; flex-wrap: wrap; gap: 6px; }
.nt-lien-ket { color: inherit; display: block; }
.nt-lien-ket:hover { text-decoration: none; }`

/** Cùng hai dòng với `dieuHuongToi` của App: màn chưa được App truyền `dieuHuong` thì tự đẩy lịch sử rồi báo popstate. */
export function dieuHuongMacDinh(href: string) {
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Ngăn bên phải chứa form hồ sơ + ảnh giấy tờ (form cũ giữ nguyên trường, kiểm tra, payload, tải ảnh). `id` null = tạo mới. */
export function NganFormNguoiThue({ token, id: idVao, onSaved, onClose }: { token: string; id: number | null; onSaved: () => void; onClose: () => void }) {
  const [id, setId] = useState<number | null>(idVao)
  const [ten, setTen] = useState('')
  const [form, setForm] = useState(empty)
  const [dangTai, setDangTai] = useState(idVao !== null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const initialFormRef = useRef(empty)
  const hopRef = useRef<HTMLDivElement>(null)
  const action = useAction()

  useEffect(() => {
    if (idVao === null) return undefined
    let active = true
    managementRequest<Tenant>(token, `/api/nguoi-thue/${idVao}`)
      .then((row) => {
        if (!active) return
        const loadedForm = { hoTen: row.hoTen, ngaySinh: row.ngaySinh, soDienThoai: row.soDienThoai, soGiayTo: row.soGiayTo ?? '', queQuan: row.queQuan }
        setTen(row.hoTen); setForm(loadedForm); initialFormRef.current = loadedForm
      })
      .catch((e: unknown) => { if (active) action.setError(e instanceof Error ? e.message : 'Không thể mở hồ sơ người thuê.') })
      .finally(() => { if (active) setDangTai(false) })
    return () => { active = false }
  }, [token, idVao])

  const isDirty = () => (id ? JSON.stringify(form) !== JSON.stringify(initialFormRef.current) : Object.values(form).some((v) => v !== ''))
  function dong() {
    if (isDirty() && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng form?')) return
    onClose()
  }
  useDialogTrap({ dialogRef: hopRef, onClose: dong })

  async function save(event: FormEvent) {
    event.preventDefault()
    await action.run(async () => {
      const row = await managementRequest<Tenant>(token, `/api/nguoi-thue${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', form)
      setId(row.id); setTen(form.hoTen)
      initialFormRef.current = form
      onSaved()
    }, id ? 'Đã cập nhật thông tin hồ sơ người thuê.' : 'Đã tạo hồ sơ người thuê mới thành công.')
  }

  async function upload() {
    if (!id || !photo) return
    await action.run(async () => {
      const data = new FormData()
      data.set('tep', photo)
      const result = await managementRequest<{ id: number }>(token, `/api/nguoi-thue/${id}/anh`, 'POST', data)
      setPhotoUrl(await fetchLienKetAnh(token, result.id))
      setPhoto(null)
    }, 'Đã lưu ảnh giấy tờ tùy thân.')
  }

  return (
    <div className="ngan-ben-nen" onMouseDown={(e) => { if (e.target === e.currentTarget) dong() }}>
      <div ref={hopRef} className="ngan-ben" role="dialog" aria-modal="true" aria-label={id ? 'Sửa hồ sơ người thuê' : 'Thêm người thuê'}>
        <div className="ngan-ben-h">
          <h2 className="h2">{id ? `Chỉnh sửa hồ sơ: ${ten || `#${id}`}` : 'Thêm hồ sơ người thuê mới'}</h2>
          <button type="button" className="icon-btn" aria-label="Đóng ngăn" onClick={dong}><Icon name="x" /></button>
        </div>
        <div className="ngan-ben-b">
          <Feedback error={action.error} success={action.success} />
          {dangTai ? <EmptyState kind="loading" title="Đang mở hồ sơ…" /> : (
            <form onSubmit={save} style={{ display: 'grid', gap: 16 }}>
              <p className="t-sm">Thông tin phải khớp với CCCD/Hộ chiếu để phục vụ ký hợp đồng và đăng ký tạm trú.</p>
              <div className="nt-luoi">
                {Object.entries({ hoTen: 'Họ và tên', ngaySinh: 'Ngày sinh', soDienThoai: 'Số điện thoại', soGiayTo: 'Số CCCD / Hộ chiếu', queQuan: 'Quê quán' }).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input className="input" required type={key === 'ngaySinh' ? 'date' : key === 'soDienThoai' ? 'tel' : 'text'} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </Field>
                ))}
              </div>
              <div className="row-wrap">
                <Button type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined}>Lưu hồ sơ</Button>
                <Button variant="secondary" onClick={dong}>Đóng form</Button>
              </div>
            </form>
          )}
          {id && !dangTai ? (
            <section style={{ display: 'grid', gap: 14 }}>
              <div>
                <h3 className="h3">Ảnh giấy tờ của hồ sơ #{id}</h3>
                <p className="t-sm">Tải lên ảnh 2 mặt CCCD hoặc trang thông tin hộ chiếu để lưu trữ đối chiếu.</p>
              </div>
              <Field label="Chọn ảnh giấy tờ tùy thân">
                <input className="input" style={{ padding: 8, height: 'auto' }} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
              </Field>
              <div className="row-wrap">
                <Button variant="secondary" blocked={action.busy || !photo} blockedReason={!photo ? 'Chọn ảnh để tải lên.' : undefined} onClick={() => void upload()}>
                  <Icon name="image" />Tải ảnh giấy tờ
                </Button>
              </div>
              {photoUrl ? (
                <div className="card-sunken" style={{ textAlign: 'center' }}>
                  <img src={photoUrl} alt="Ảnh giấy tờ vừa tải lên" style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 'var(--ma-radius)' }} />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Danh sách người thuê: bấm một hàng (hoặc tên) mở hồ sơ 360°; form sửa/tạo nằm trong ngăn bên phải. */
export default function HoSoNguoiThue({ token, dieuHuong = dieuHuongMacDinh }: { token: string; dieuHuong?: (href: string) => void }) {
  const [rows, setRows] = useState<Tenant[]>([])
  const [query, setQuery] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [dangThem, setDangThem] = useState(false)
  const [lanTai, setLanTai] = useState(0)
  const action = useAction()

  useEffect(() => {
    let active = true
    setDangTai(true)
    managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`)
      .then((data) => { if (active) { setRows(data); action.setError(null) } })
      .catch((e: Error) => { if (active) action.setError(e.message) })
      .finally(() => { if (active) setDangTai(false) })
    return () => { active = false }
  }, [query, token, lanTai])

  const moHoSo = (id: number) => dieuHuong(`/nguoi-thue/${id}`)
  // Bấm vào chỗ trống của hàng cũng mở hồ sơ; bấm vào liên kết/nút thì để chính nó xử lý, khỏi điều hướng hai lần.
  const bamHang = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as Element
    const hang = target.closest('tr[data-tenant-row]')
    if (hang && !target.closest('a,button,input')) moHoSo(Number(hang.getAttribute('data-tenant-row')))
  }

  const cot: DataTableColumn<Tenant>[] = [
    { key: 'nguoi', label: 'Người thuê', sortable: true, sortValue: (r) => r.hoTen, render: (r) => <a className="nt-lien-ket" href={`/nguoi-thue/${r.id}`}><NguoiCoAvatar id={r.id} ten={r.hoTen} phu={`#${r.id}`} /></a> },
    { key: 'sdt', label: 'Số điện thoại', render: (r) => nhomSoDienThoai(r.soDienThoai) },
    { key: 'giayTo', label: 'CCCD / Hộ chiếu', render: (r) => r.soGiayToChe || <span style={{ color: 'var(--ma-text-muted)' }}>Chưa cập nhật</span> },
    { key: 'queQuan', label: 'Quê quán', sortable: true, sortValue: (r) => r.queQuan, render: (r) => r.queQuan || <span style={{ color: 'var(--ma-text-muted)' }}>Chưa cập nhật</span> },
    { key: 'canhBao', label: 'Cảnh báo', render: (r) => r.canhBao && r.canhBao.length > 0 ? <div className="nt-canh-bao">{r.canhBao.map((s) => <StatusTag key={s} tone="waiting">{s}</StatusTag>)}</div> : <span style={{ color: 'var(--ma-text-muted)' }}>—</span> },
  ]

  return (
    <section style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <style>{CSS_NGUOI_THUE}</style>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1">Người thuê</h1>
          <p className="sub">Bấm một người để mở hồ sơ: tiền, hợp đồng, sự cố và giấy tờ ở cùng một chỗ.</p>
        </div>
        <div className="topbar-actions"><Button onClick={() => setDangThem(true)}><Icon name="plus" />Thêm người thuê</Button></div>
      </header>

      <Feedback error={action.error} success={null} />

      <Card>
        <div className="table-toolbar">
          <label className="input-wrap">
            <span className="sr-only">Tìm kiếm theo tên hoặc số điện thoại</span>
            <Icon name="search" />
            <input className="input" type="search" placeholder="Tìm tên hoặc số điện thoại…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {dangTai ? (
          <EmptyState kind="loading" title="Đang tìm kiếm hồ sơ người thuê…" />
        ) : rows.length === 0 ? (
          <EmptyState
            kind={query.trim() !== '' ? 'filtered' : 'first'}
            title={query.trim() !== '' ? 'Không tìm thấy hồ sơ người thuê nào phù hợp từ khoá.' : 'Chưa có hồ sơ người thuê nào trong hệ thống.'}
            actionLabel={query.trim() === '' ? 'Thêm người thuê' : undefined}
            onAction={query.trim() === '' ? () => setDangThem(true) : undefined}
          />
        ) : (
          <div onClick={bamHang}>
            <DataTable rows={rows} columns={cot} getRowId={(r) => r.id} noun="hồ sơ" pageSize={10} rowProps={(r) => ({ 'data-tenant-row': String(r.id), className: 'nt-hang' })} />
          </div>
        )}
      </Card>

      {dangThem ? <NganFormNguoiThue token={token} id={null} onSaved={() => setLanTai((n) => n + 1)} onClose={() => setDangThem(false)} /> : null}
    </section>
  )
}
