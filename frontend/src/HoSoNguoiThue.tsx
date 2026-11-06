import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { managementRequest, type Tenant } from './managementApi'
import { Field, Feedback, SaveButton, fieldStyle, gridStyle, panelStyle, rowStyle, useAction } from './ManagementShared'
import { Button } from './design/core/Button'
import { fetchLienKetAnh } from './api'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'

const empty = { hoTen: '', ngaySinh: '', soDienThoai: '', soGiayTo: '', queQuan: '' }

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

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <SysLabel>QUẢN LÝ NGƯỜI THUÊ</SysLabel>
          <h2 style={{ margin: '8px 0 4px', font: 'var(--ma-text-screen-title)', letterSpacing: 'var(--ma-tracking-title)' }}>
            Hồ sơ người thuê
          </h2>
          <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 13.5 }}>
            Quản lý thông tin định danh, CCCD/Hộ chiếu và giấy tờ tùy thân của khách thuê.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--ma-radius)',
            background: 'var(--ma-brand-accent)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + Thêm hồ sơ mới
        </button>
      </div>

      <Feedback error={action.error} success={action.success} />

      <Field title="Tìm kiếm theo tên hoặc số điện thoại">
        <input
          style={fieldStyle}
          type="search"
          placeholder="Nhập tên hoặc số điện thoại để lọc hồ sơ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: isFormOpen ? 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* KHỐI DANH SÁCH NGƯỜI THUÊ */}
        <div style={{ display: 'grid', gap: 12 }}>
          {dangTai ? (
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontStyle: 'italic' }} aria-live="polite">
              Đang tìm kiếm hồ sơ người thuê…
            </p>
          ) : rows.length === 0 ? (
            <EmptyState
              title={query.trim() !== '' ? 'Không tìm thấy hồ sơ người thuê nào phù hợp từ khoá.' : 'Chưa có hồ sơ người thuê nào trong hệ thống.'}
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {rows.map((row) => {
                const isSelected = row.id === id && isFormOpen
                return (
                  <article
                    key={row.id}
                    style={{
                      ...panelStyle,
                      display: 'grid',
                      gap: 10,
                      borderColor: isSelected ? 'var(--ma-brand-accent)' : undefined,
                      background: isSelected ? 'var(--ma-brand-accent-light)' : 'var(--ma-bg-card)',
                      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 15 }}>#{row.id} · {row.hoTen}</strong>
                      <span
                        style={{
                          fontFamily: 'var(--ma-font-mono)',
                          fontSize: 11,
                          background: isSelected ? 'var(--ma-bg-card)' : 'var(--ma-bg-sunken)',
                          padding: '2px 8px',
                          borderRadius: 'var(--ma-radius-pill)',
                          color: 'var(--ma-text-secondary)',
                          border: '1px solid var(--ma-border-default)',
                        }}
                      >
                        ID: {row.id}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)', display: 'grid', gap: 3 }}>
                      <span>SĐT: <strong style={{ color: 'var(--ma-text-primary)' }}>{row.soDienThoai}</strong></span>
                      <span>CCCD / Hộ chiếu: <code style={{ fontFamily: 'var(--ma-font-mono)' }}>{row.soGiayToChe || 'Chưa cập nhật'}</code></span>
                      <span>Quê quán: {row.queQuan || 'Chưa cập nhật'}</span>
                    </div>
                    {row.canhBao && row.canhBao.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {row.canhBao.map((s) => (
                          <span
                            key={s}
                            style={{
                              fontSize: 12,
                              color: 'var(--ma-waiting)',
                              background: 'var(--ma-waiting-bg)',
                              padding: '3px 8px',
                              borderRadius: 'var(--ma-radius-sm)',
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <Button
                        variant={isSelected ? 'primary' : 'secondary'}
                        blocked={action.busy}
                        onClick={() => void edit(row.id)}
                        style={{ width: '100%', justifyContent: 'center', minHeight: 38 }}
                      >
                        {isSelected ? '✓ Đang xem và sửa hồ sơ' : 'Xem và sửa hồ sơ'}
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* KHỐI FORM THÊM / SỬA HỒ SƠ & TẢI ẢNH */}
        {isFormOpen && (
          <div style={{ display: 'grid', gap: 20 }}>
            <form onSubmit={save} style={{ ...panelStyle, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--ma-border-subtle)', paddingBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>
                    {id ? `Chỉnh sửa hồ sơ: ${selectedTenant?.hoTen ?? `#${id}`}` : 'Thêm hồ sơ người thuê mới'}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                    Thông tin phải khớp với CCCD/Hộ chiếu để phục vụ ký hợp đồng và đăng ký tạm trú.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: 'var(--ma-text-secondary)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  ✕ Đóng
                </button>
              </div>

              <div style={gridStyle}>
                {Object.entries({
                  hoTen: 'Họ và tên',
                  ngaySinh: 'Ngày sinh',
                  soDienThoai: 'Số điện thoại',
                  soGiayTo: 'Số CCCD / Hộ chiếu',
                  queQuan: 'Quê quán',
                }).map(([key, label]) => (
                  <Field key={key} title={label}>
                    <input
                      style={fieldStyle}
                      required
                      type={key === 'ngaySinh' ? 'date' : key === 'soDienThoai' ? 'tel' : 'text'}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </Field>
                ))}
              </div>

              <div style={{ ...rowStyle, paddingTop: 8 }}>
                <SaveButton busy={action.busy}>Lưu hồ sơ</SaveButton>
                <Button
                  variant="secondary"
                  onClick={handleCloseForm}
                >
                  Đóng form
                </Button>
              </div>
            </form>

            {id ? (
              <section style={{ ...panelStyle, display: 'grid', gap: 14 }}>
                <div style={{ borderBottom: '1px solid var(--ma-border-subtle)', paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>
                    Ảnh giấy tờ của hồ sơ #{id}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                    Tải lên ảnh 2 mặt CCCD hoặc trang thông tin hộ chiếu để lưu trữ đối chiếu.
                  </p>
                </div>

                <Field title="Chọn ảnh giấy tờ tùy thân">
                  <input
                    style={{ ...fieldStyle, padding: 8 }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </Field>

                <div style={rowStyle}>
                  <Button
                    blocked={action.busy || !photo}
                    blockedReason={!photo ? 'Chọn ảnh để tải lên.' : undefined}
                    onClick={() => void upload()}
                  >
                    Tải ảnh giấy tờ
                  </Button>
                </div>

                {photoUrl ? (
                  <div style={{ marginTop: 10, textAlign: 'center', background: 'var(--ma-bg-sunken)', padding: 14, borderRadius: 'var(--ma-radius)' }}>
                    <img
                      src={photoUrl}
                      alt="Ảnh giấy tờ vừa tải lên"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 320,
                        objectFit: 'contain',
                        borderRadius: 'var(--ma-radius)',
                        border: '1px solid var(--ma-border-default)',
                      }}
                    />
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
