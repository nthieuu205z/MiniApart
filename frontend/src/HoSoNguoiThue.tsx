import { useEffect, useState, type FormEvent } from 'react'
import { managementRequest, type Tenant } from './managementApi'
import { Field, Feedback, SaveButton, fieldStyle, gridStyle, panelStyle, rowStyle, useAction } from './ManagementShared'
import { Button } from './design/core/Button'
import { fetchLienKetAnh } from './api'
import { SysLabel } from './design/core/SysLabel'

const empty = { hoTen: '', ngaySinh: '', soDienThoai: '', soGiayTo: '', queQuan: '' }

export default function HoSoNguoiThue({ token }: { token: string }) {
  const [rows, setRows] = useState<Tenant[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(empty)
  const [id, setId] = useState<number | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const action = useAction()

  async function load() {
    setRows(await managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`))
  }

  useEffect(() => {
    let active = true
    managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`)
      .then((data) => { if (active) setRows(data) })
      .catch((e: Error) => { if (active) action.setError(e.message) })
    return () => { active = false }
  }, [query, token])

  async function edit(tenantId: number) {
    await action.run(async () => {
      const row = await managementRequest<Tenant>(token, `/api/nguoi-thue/${tenantId}`)
      setId(row.id)
      setForm({
        hoTen: row.hoTen,
        ngaySinh: row.ngaySinh,
        soDienThoai: row.soDienThoai,
        soGiayTo: row.soGiayTo ?? '',
        queQuan: row.queQuan,
      })
      setPhotoUrl(null)
    }, 'Đã mở hồ sơ để chỉnh sửa.')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    await action.run(async () => {
      const row = await managementRequest<Tenant>(token, `/api/nguoi-thue${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', form)
      setId(row.id)
      await load()
    })
  }

  async function upload() {
    if (!id || !photo) return
    await action.run(async () => {
      const data = new FormData()
      data.set('tep', photo)
      const result = await managementRequest<{ id: number }>(token, `/api/nguoi-thue/${id}/anh`, 'POST', data)
      setPhotoUrl(await fetchLienKetAnh(token, result.id))
      setPhoto(null)
    }, 'Đã lưu ảnh giấy tờ.')
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <SysLabel>FR-TEN-01</SysLabel>
        <h2 style={{ margin: '8px 0 4px', font: 'var(--ma-text-screen-title)', letterSpacing: 'var(--ma-tracking-title)' }}>
          Hồ sơ người thuê
        </h2>
        <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 13.5 }}>
          Quản lý thông tin định danh, CCCD/Hộ chiếu và giấy tờ tùy thân của khách thuê.
        </p>
      </div>

      <Feedback error={action.error} success={action.success} />

      <Field title="Tìm kiếm theo tên hoặc số điện thoại">
        <input
          style={fieldStyle}
          type="search"
          placeholder="Nhập tên hoặc số điện thoại..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>

      <div style={gridStyle}>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--ma-text-secondary)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
            Không tìm thấy hồ sơ người thuê nào phù hợp.
          </p>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              style={{
                ...panelStyle,
                display: 'grid',
                gap: 10,
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>#{row.id} · {row.hoTen}</strong>
                <span
                  style={{
                    fontFamily: 'var(--ma-font-mono)',
                    fontSize: 11,
                    background: 'var(--ma-bg-sunken)',
                    padding: '2px 8px',
                    borderRadius: 'var(--ma-radius-pill)',
                    color: 'var(--ma-text-secondary)',
                  }}
                >
                  ID: {row.id}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)', display: 'grid', gap: 3 }}>
                <span>SĐT: <strong style={{ color: 'var(--ma-text-primary)' }}>{row.soDienThoai}</strong></span>
                <span>CCCD: <code style={{ fontFamily: 'var(--ma-font-mono)' }}>{row.soGiayToChe || 'Chưa cập nhật'}</code></span>
                <span>Quê quán: {row.queQuan || 'Chưa cập nhật'}</span>
              </div>
              {row.canhBao?.map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 12,
                    color: 'var(--ma-waiting)',
                    background: 'var(--ma-waiting-bg)',
                    padding: '4px 8px',
                    borderRadius: 'var(--ma-radius-sm)',
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
              <div style={{ marginTop: 4 }}>
                <Button
                  variant="secondary"
                  blocked={action.busy}
                  onClick={() => void edit(row.id)}
                  style={{ width: '100%', justifyContent: 'center', minHeight: 38 }}
                >
                  Xem và sửa hồ sơ
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <form onSubmit={save} style={{ ...panelStyle, display: 'grid', gap: 16 }}>
        <div style={{ borderBottom: '1px solid var(--ma-border-subtle)', paddingBottom: 10 }}>
          <h3 style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>
            {id ? `Chỉnh sửa hồ sơ #${id}` : 'Thêm hồ sơ người thuê mới'}
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
            Thông tin phải khớp với CCCD/Hộ chiếu để phục vụ ký hợp đồng và đăng ký tạm trú.
          </p>
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
            onClick={() => {
              setId(null)
              setForm(empty)
              setPhotoUrl(null)
            }}
          >
            Tạo hồ sơ khác
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
  )
}
