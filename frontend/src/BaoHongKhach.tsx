import { useEffect, useState, type FormEvent } from 'react'
import { fetchHopDongCuaNguoiThue, fetchLienKetAnh, type ThongTinYeuCauSuaChua } from './api'
import { managementRequest } from './managementApi'
import { Feedback, useAction } from './ManagementShared'
import { Button } from './design/core/Button'
import { Icon, type IconName } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { FilterChip } from './design/forms/FilterChip'

const HANG_MUC_GOI_Y = ['Điện', 'Nước', 'Điều hoà', 'Khoá cửa', 'Internet', 'Khác']
const TRANG_THAI: Array<[string, string]> = [['MOI_TIEP_NHAN', 'Mới'], ['DA_TIEP_NHAN', 'Đã tiếp nhận'], ['DA_PHAN_CONG', 'Đã phân công'], ['DANG_XU_LY', 'Đang xử lý'], ['CHO_XAC_NHAN', 'Chờ xác nhận'], ['DA_DONG', 'Đã đóng'], ['DA_HUY', 'Đã huỷ']]
const TONE: Record<string, { tone: 'waiting' | 'neutral' | 'done' | 'closed'; icon?: IconName }> = {
  MOI_TIEP_NHAN: { tone: 'waiting' }, DA_TIEP_NHAN: { tone: 'neutral' }, DA_PHAN_CONG: { tone: 'neutral', icon: 'user' },
  DANG_XU_LY: { tone: 'neutral', icon: 'wrench' }, CHO_XAC_NHAN: { tone: 'waiting' }, DA_DONG: { tone: 'done' }, DA_HUY: { tone: 'closed' },
}
const ngayNgan = (iso: string) => (iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '')
const KET_THUC = ['DA_DONG', 'DA_HUY']

/** Báo hỏng của khách thuê: form một cột (mobile-first) + danh sách yêu cầu của chính mình. */
export default function BaoHongKhach({ token }: { token: string }) {
  const [rooms, setRooms] = useState<Array<{ id: number; soPhong: string }>>([])
  const [rows, setRows] = useState<ThongTinYeuCauSuaChua[]>([])
  const [daTai, setDaTai] = useState(false)
  const [status, setStatus] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const [cancelReasons, setCancelReasons] = useState<Record<number, string>>({})
  const [dangHuy, setDangHuy] = useState<number | null>(null)
  const [form, setForm] = useState({ phongId: '', hangMuc: '', moTa: '', mucDo: 'THUONG' })
  const [loiPhong, setLoiPhong] = useState<string | null>(null)
  const action = useAction()

  async function load() {
    const q = new URLSearchParams()
    if (status) q.set('trangThai', status)
    setRows(await managementRequest(token, `/api/cong/yeu-cau-sua-chua?${q}`))
  }
  useEffect(() => { void action.run(load, 'Đã tải yêu cầu sửa chữa.').finally(() => setDaTai(true)) }, [status, token])
  useEffect(() => {
    let active = true
    fetchHopDongCuaNguoiThue(token)
      .then((hd) => {
        if (!active) return
        const r = hd.filter((h) => h.trangThai === 'HIEU_LUC').map((h) => ({ id: h.phongId, soPhong: h.soPhong }))
        setRooms(r)
        if (r.length === 1) setForm((f) => ({ ...f, phongId: f.phongId || String(r[0].id) }))
      })
      .catch((e: Error) => { if (active) setLoiPhong(e.message) })
    return () => { active = false }
  }, [token])

  async function create(e: FormEvent) {
    e.preventDefault()
    if (photos.length > 5) { action.setError('Chọn tối đa 5 ảnh.'); return }
    await action.run(async () => {
      const data = new FormData()
      for (const [k, v] of Object.entries(form)) data.set(k, v)
      photos.forEach((p) => data.append('anh', p))
      await managementRequest(token, '/api/yeu-cau-sua-chua', 'POST', data)
      setForm({ ...form, hangMuc: '', moTa: '' })
      setPhotos([])
      await load()
    }, 'Đã gửi yêu cầu sửa chữa.')
  }
  async function command(id: number, path: string, body?: unknown) {
    await action.run(async () => { await managementRequest(token, `/api/yeu-cau-sua-chua/${id}/${path}`, 'POST', body); await load() })
  }

  return (
    <section style={{ display: 'grid', gap: 16, maxWidth: 640, width: '100%', margin: '0 auto' }}>
      <div>
        <h2 className="h1" style={{ margin: 0 }}>Báo hỏng</h2>
        <p className="t-sm" style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)' }}>Gửi yêu cầu sửa chữa cho ban quản lý và theo dõi tiến độ.</p>
      </div>
      <Feedback error={action.error ?? loiPhong} success={action.success} />

      <form className="card" style={{ gap: 16 }} onSubmit={create}>
        <h3 className="h3" style={{ margin: 0 }}>Gửi yêu cầu sửa chữa</h3>
        <Field label="Phòng">
          <select className="select" required value={form.phongId} onChange={(e) => setForm({ ...form, phongId: e.target.value })}>
            <option value="">Chọn phòng</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>Phòng {r.soPhong}</option>)}
          </select>
        </Field>
        <Field label="Hạng mục">
          <input className="input" required value={form.hangMuc} placeholder="Ví dụ: Đèn hành lang hỏng" onChange={(e) => setForm({ ...form, hangMuc: e.target.value })} />
        </Field>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="Gợi ý hạng mục">
          {HANG_MUC_GOI_Y.map((h) => <FilterChip key={h} active={form.hangMuc === h} onClick={() => setForm({ ...form, hangMuc: h })}>{h}</FilterChip>)}
        </div>
        <Field label="Mức độ">
          <select className="select" value={form.mucDo} onChange={(e) => setForm({ ...form, mucDo: e.target.value })}>
            <option value="THUONG">Bình thường</option>
            <option value="GAP">Cao</option>
            <option value="KHAN_CAP">Khẩn cấp</option>
          </select>
        </Field>
        <Field label="Mô tả sự cố">
          <textarea className="input" rows={4} required style={{ height: 'auto', paddingTop: 10 }} value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} />
        </Field>
        <div className="field">
          <span className="label">Ảnh sự cố (tối đa 5 ảnh)</span>
          <label className="btn btn-secondary" style={{ position: 'relative', minHeight: 48, justifyContent: 'center', gap: 8 }}>
            <Icon name="camera" />
            {photos.length ? `Đã chọn ${photos.length} ảnh` : 'Chụp hoặc chọn ảnh'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Ảnh sự cố (tối đa 5 ảnh)"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
          </label>
        </div>
        <Button type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang gửi, vui lòng chờ.' : undefined} style={{ minHeight: 'var(--ma-control-h-touch)', width: '100%', justifyContent: 'center' }}>
          Gửi yêu cầu
        </Button>
      </form>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 className="h3" style={{ margin: 0 }}>Yêu cầu của tôi</h3>
        <label className="field" style={{ minWidth: 180 }}>
          <span className="label">Lọc trạng thái</span>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {TRANG_THAI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      {!daTai ? <EmptyState kind="loading" title="Đang tải yêu cầu sửa chữa…" /> : !rows.length ? (
        <EmptyState kind={status ? 'filtered' : 'first'} title="Không có yêu cầu phù hợp." body={status ? undefined : 'Khi bạn gửi yêu cầu sửa chữa, tiến độ sẽ hiện ở đây.'} />
      ) : rows.map((row) => {
        const t = TONE[row.trangThai] ?? { tone: 'neutral' as const }
        return (
          <article key={row.id} className="card" style={{ gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <StatusTag tone={t.tone} icon={t.icon}>{row.tenTrangThai}</StatusTag>
              <span className="t-meta">{row.maYeuCau ?? `#${row.id}`} · {ngayNgan(row.taoLuc)}</span>
            </div>
            <strong style={{ font: 'var(--ma-text-block-title)', overflowWrap: 'anywhere' }}>{row.hangMuc}</strong>
            <div className="t-sm" style={{ color: 'var(--ma-text-secondary)' }}>Phòng {row.soPhong} · Mức độ {row.tenMucDo}</div>
            <p className="t-sm" style={{ margin: 0, overflowWrap: 'anywhere' }}>{row.moTa}</p>
            {row.anh?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {row.anh.map((p) => photoUrls[p.id]
                  ? <img key={p.id} src={photoUrls[p.id]} alt={`Ảnh sự cố ${row.id}`} style={{ maxWidth: 220, maxHeight: 180, objectFit: 'contain', borderRadius: 12 }} />
                  : <Button key={p.id} variant="secondary" size="sm" onClick={() => void action.run(async () => setPhotoUrls({ ...photoUrls, [p.id]: await fetchLienKetAnh(token, p.id) }), 'Đã mở ảnh sự cố.')}>Xem ảnh #{p.id}</Button>)}
              </div>
            ) : null}
            {row.trangThai === 'CHO_XAC_NHAN' ? <Button variant="secondary" blocked={action.busy} onClick={() => void command(row.id, 'xac-nhan-dong')}>Xác nhận sửa xong và đóng yêu cầu</Button> : null}
            {!KET_THUC.includes(row.trangThai) ? (
              dangHuy === row.id ? (
                <form style={{ display: 'grid', gap: 8 }} onSubmit={(e) => { e.preventDefault(); void command(row.id, 'huy', { lyDo: cancelReasons[row.id] }) }}>
                  <Field label="Lý do huỷ yêu cầu"><input className="input" required value={cancelReasons[row.id] ?? ''} onChange={(e) => setCancelReasons({ ...cancelReasons, [row.id]: e.target.value })} /></Field>
                  <Button type="submit" variant="secondary" blocked={action.busy}>Huỷ yêu cầu</Button>
                </form>
              ) : <Button variant="text" onClick={() => setDangHuy(row.id)}>Huỷ yêu cầu</Button>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}
