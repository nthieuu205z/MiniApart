import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import { DataTable, type DataTableColumn } from './design/table/DataTable'

const empty = { hoTen: '', ngaySinh: '', soDienThoai: '', soGiayTo: '', queQuan: '' }
const CSS_NGUOI_THUE = `${CSS_BANG_QUAN_TRI}
.nt-luoi { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.nt-canh-bao { display: flex; flex-wrap: wrap; gap: 6px; }`

export default function HoSoNguoiThue({ token }: { token: string }) {
  const [rows, setRows] = useState<Tenant[]>([])
  const [query, setQuery] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [form, setForm] = useState(empty)
  const [id, setId] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const initialFormRef = useRef(empty)
  const chiTietRef = useRef<HTMLDivElement>(null)
  const action = useAction()

  async function load() {
    setDangTai(true)
    try {
      const data = await managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`)
      setRows(data)
    } catch (e) {
      action.setError(e instanceof Error ? e.message : 'Không thể tải danh sách người thuê.')
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    let active = true
    setDangTai(true)
    managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`)
      .then((data) => {
        if (active) setRows(data)
      })
      .catch((e: Error) => {
        if (active) action.setError(e.message)
      })
      .finally(() => {
        if (active) setDangTai(false)
      })
    return () => {
      active = false
    }
  }, [query, token])

  useEffect(() => { if (isFormOpen) chiTietRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }) }, [isFormOpen, id])

  async function edit(tenantId: number) {
    await action.run(async () => {
      const row = await managementRequest<Tenant>(token, `/api/nguoi-thue/${tenantId}`)
      setId(row.id)
      const loadedForm = {
        hoTen: row.hoTen,
        ngaySinh: row.ngaySinh,
        soDienThoai: row.soDienThoai,
        soGiayTo: row.soGiayTo ?? '',
        queQuan: row.queQuan,
      }
      setForm(loadedForm)
      initialFormRef.current = loadedForm
      setPhotoUrl(null)
      setIsFormOpen(true)
    }, 'Đã mở hồ sơ để chỉnh sửa.')
  }

  function handleOpenCreate() {
    if (isFormOpen && isDirty()) {
      if (!window.confirm('Bạn có thay đổi chưa lưu trong form. Bạn có muốn bỏ qua để tạo hồ sơ mới?')) {
        return
      }
    }
    setId(null)
    setForm(empty)
    initialFormRef.current = empty
    setPhotoUrl(null)
    setIsFormOpen(true)
  }

  function handleCloseForm() {
    if (isDirty()) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng form?')) {
        return
      }
    }
    setIsFormOpen(false)
    setId(null)
    setForm(empty)
    initialFormRef.current = empty
    setPhotoUrl(null)
  }

  function isDirty(): boolean {
    if (!id) {
      return Object.values(form).some((v) => v !== '')
    }
    return JSON.stringify(form) !== JSON.stringify(initialFormRef.current)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    await action.run(async () => {
      const row = await managementRequest<Tenant>(token, `/api/nguoi-thue${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', form)
      setId(row.id)
      initialFormRef.current = form
      await load()
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

  const selectedTenant = rows.find((r) => r.id === id)
  const cot: DataTableColumn<Tenant>[] = [
    { key: 'nguoi', label: 'Người thuê', sortable: true, sortValue: (r) => r.hoTen, render: (r) => <NguoiCoAvatar id={r.id} ten={r.hoTen} phu={`#${r.id}`} /> },
    { key: 'sdt', label: 'Số điện thoại', render: (r) => nhomSoDienThoai(r.soDienThoai) },
    { key: 'giayTo', label: 'CCCD / Hộ chiếu', render: (r) => r.soGiayToChe || <span style={{ color: 'var(--ma-text-muted)' }}>Chưa cập nhật</span> },
    { key: 'queQuan', label: 'Quê quán', sortable: true, sortValue: (r) => r.queQuan, render: (r) => r.queQuan || <span style={{ color: 'var(--ma-text-muted)' }}>Chưa cập nhật</span> },
    { key: 'canhBao', label: 'Cảnh báo', render: (r) => r.canhBao && r.canhBao.length > 0 ? <div className="nt-canh-bao">{r.canhBao.map((s) => <StatusTag key={s} tone="waiting">{s}</StatusTag>)}</div> : <span style={{ color: 'var(--ma-text-muted)' }}>—</span> },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (r) => <div className="td-acts"><Button variant="text" size="sm" blocked={action.busy} aria-pressed={r.id === id && isFormOpen} onClick={() => void edit(r.id)}>{r.id === id && isFormOpen ? 'Đang xem và sửa hồ sơ' : 'Xem và sửa hồ sơ'}<span className="sr-only"> {r.hoTen}</span></Button></div>,
    },
  ]

  return (
    <section style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <style>{CSS_NGUOI_THUE}</style>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1">Hồ sơ người thuê</h1>
          <p className="sub">Quản lý thông tin định danh, CCCD/Hộ chiếu và giấy tờ tùy thân của khách thuê.</p>
        </div>
        <div className="topbar-actions"><Button variant={isFormOpen ? 'secondary' : 'primary'} onClick={handleOpenCreate}><Icon name="plus" />Thêm hồ sơ mới</Button></div>
      </header>

      <Feedback error={action.error} success={action.success} />

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
          />
        ) : (
          <DataTable
            rows={rows}
            columns={cot}
            getRowId={(r) => r.id}
            noun="hồ sơ"
            pageSize={10}
            rowProps={(r) => ({ 'data-tenant-row': String(r.id), className: r.id === id && isFormOpen ? 'bq-chon' : '' })}
          />
        )}
      </Card>

      {isFormOpen && (
        <div ref={chiTietRef} style={{ display: 'grid', gap: 16 }}>
          <form onSubmit={save} className="card" style={{ display: 'grid', gap: 16 }}>
            <div>
              <h2 className="h2">{id ? `Chỉnh sửa hồ sơ: ${selectedTenant?.hoTen ?? `#${id}`}` : 'Thêm hồ sơ người thuê mới'}</h2>
              <p className="t-sm">Thông tin phải khớp với CCCD/Hộ chiếu để phục vụ ký hợp đồng và đăng ký tạm trú.</p>
            </div>
            <div className="nt-luoi">
              {Object.entries({
                hoTen: 'Họ và tên',
                ngaySinh: 'Ngày sinh',
                soDienThoai: 'Số điện thoại',
                soGiayTo: 'Số CCCD / Hộ chiếu',
                queQuan: 'Quê quán',
              }).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    className="input"
                    required
                    type={key === 'ngaySinh' ? 'date' : key === 'soDienThoai' ? 'tel' : 'text'}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <div className="row-wrap">
              <Button type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined}>Lưu hồ sơ</Button>
              <Button variant="secondary" onClick={handleCloseForm}>Đóng form</Button>
            </div>
          </form>

          {id ? (
            <section className="card" style={{ display: 'grid', gap: 14 }}>
              <div>
                <h2 className="h2">Ảnh giấy tờ của hồ sơ #{id}</h2>
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
      )}
    </section>
  )
}
