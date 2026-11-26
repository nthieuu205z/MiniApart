import { useEffect, useState, type FormEvent } from 'react'
import { fetchHopDongCuaNguoiThue, fetchLienKetAnh, type ThongTinYeuCauSuaChua } from './api'
import { managementRequest } from './managementApi'
import { Feedback, useAction } from './ManagementShared'
import { Tieu } from './CanTra'
import { Button } from './design/core/Button'
import { Icon, type IconName } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { ChanDinh } from './design/layout/ChanDinh'
import './CanTra.css'

const HANG_MUC: Array<[string, IconName]> = [['Điện', 'bolt'], ['Nước', 'droplet'], ['Điều hoà', 'settings'], ['Khoá cửa', 'lock'], ['Internet', 'send'], ['Khác', 'more-h']]
const TONE: Record<string, { tone: 'waiting' | 'neutral' | 'done' | 'closed'; icon?: IconName }> = {
  MOI_TIEP_NHAN: { tone: 'waiting' }, DA_TIEP_NHAN: { tone: 'neutral' }, DA_PHAN_CONG: { tone: 'neutral', icon: 'user' },
  DANG_XU_LY: { tone: 'neutral', icon: 'wrench' }, CHO_XAC_NHAN: { tone: 'waiting' }, DA_DONG: { tone: 'done' }, DA_HUY: { tone: 'closed' },
}
const ngayNgan = (iso: string) => (iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '')
const KET_THUC = ['DA_DONG', 'DA_HUY']

/** Báo hỏng của khách thuê: form một cột (mobile-first) + danh sách yêu cầu của chính mình. */
export default function BaoHongKhach({ token, mobile: mobileProp }: { token: string; mobile?: boolean }) {
  // App chưa truyền mobile cho trang này: tự đo theo ngưỡng của khung (≤767px = điện thoại, thanh trên đã có h1).
  const [hepDo, setHepDo] = useState(() => window.matchMedia?.('(max-width: 767px)').matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 767px)')
    const doi = () => setHepDo(mq.matches)
    mq?.addEventListener?.('change', doi)
    return () => mq?.removeEventListener?.('change', doi)
  }, [])
  const mobile = mobileProp ?? hepDo
  const [rooms, setRooms] = useState<Array<{ id: number; soPhong: string }>>([])
  const [rows, setRows] = useState<ThongTinYeuCauSuaChua[]>([])
  const [daTai, setDaTai] = useState(false)
    const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const [cancelReasons, setCancelReasons] = useState<Record<number, string>>({})
  const [dangHuy, setDangHuy] = useState<number | null>(null)
  const [form, setForm] = useState({ phongId: '', hangMuc: '', moTa: '', mucDo: 'THUONG' })
  const [loiPhong, setLoiPhong] = useState<string | null>(null)
  const action = useAction()

  async function load() {
    setRows(await managementRequest(token, '/api/cong/yeu-cau-sua-chua?'))
  }
  useEffect(() => { void action.run(load, 'Đã tải yêu cầu sửa chữa.').finally(() => setDaTai(true)) }, [token])
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
    if (!form.hangMuc) { action.setError('Chọn hỏng cái gì trước khi gửi.'); return }
    if (photos.length > 5) { action.setError('Chọn tối đa 5 ảnh.'); return }
    await action.run(async () => {
      const data = new FormData()
      for (const [k, v] of Object.entries(form)) data.set(k, v)
      photos.forEach((p) => data.append('anh', p))
      await managementRequest(token, '/api/yeu-cau-sua-chua', 'POST', data)
      setForm({ ...form, hangMuc: '', moTa: '' })
      setPhotos([])
      await load()
    }, 'Đã gửi báo hỏng.')
  }
  async function command(id: number, path: string, body?: unknown) {
    await action.run(async () => { await managementRequest(token, `/api/yeu-cau-sua-chua/${id}/${path}`, 'POST', body); await load() })
  }

  const phongDangChon = rooms.find((r) => String(r.id) === form.phongId) ?? rooms[0]

  return (
    <section className="nt">
      <header className="nt-dau">
        <Tieu mobile={mobile} className="nt-h1">Báo hỏng</Tieu>
        {phongDangChon ? <div className="nt-phu">Phòng {phongDangChon.soPhong}</div> : null}
      </header>
      <Feedback error={action.error ?? loiPhong} success={action.success} />

      <form id="bao-hong-form" className="nt-than" onSubmit={create}>
        <section className="nt-khoi" aria-labelledby="bao-hong-cai-gi">
          <h2 className="nt-h2" id="bao-hong-cai-gi">Hỏng cái gì?</h2>
          {rooms.length > 1 ? (
            <Field label="Phòng">
              <select className="select" required value={form.phongId} onChange={(e) => setForm({ ...form, phongId: e.target.value })}>
                <option value="">Chọn phòng</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>Phòng {r.soPhong}</option>)}
              </select>
            </Field>
          ) : null}
          <div className="nt-luoi" role="group" aria-label="Hạng mục">
            {HANG_MUC.map(([ten, icon]) => (
              <button key={ten} type="button" className="nt-o" aria-pressed={form.hangMuc === ten} onClick={() => setForm((f) => ({ ...f, hangMuc: ten }))}>
                <Icon name={icon} />{ten}
              </button>
            ))}
          </div>
          <Field label="Mô tả ngắn">
            <textarea className="input" rows={3} required placeholder="Ví dụ: đèn nhà tắm chập chờn từ tối qua" style={{ height: 'auto', paddingTop: 10 }} value={form.moTa} onChange={(e) => { const moTa = e.target.value; setForm((f) => ({ ...f, moTa })) }} />
          </Field>
          <label className="btn btn-secondary btn-block" style={{ position: 'relative', gap: 8 }}>
            <Icon name="camera" />
            {photos.length ? `Đã chọn ${photos.length} ảnh` : 'Chụp ảnh chỗ hỏng'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Chụp ảnh chỗ hỏng (tối đa 5 ảnh)"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
          </label>
          <label className="nt-khan">
            <input type="checkbox" checked={form.mucDo === 'KHAN_CAP'} onChange={(e) => { const mucDo = e.target.checked ? 'KHAN_CAP' : 'THUONG'; setForm((f) => ({ ...f, mucDo })) }} />
            <span>Khẩn cấp <span className="nt-phu">(mất điện, rò nước, không an toàn)</span></span>
          </label>
        </section>

      </form>

      <section className="nt-khoi" aria-labelledby="bao-hong-da-bao">
        <h2 className="nt-h2" id="bao-hong-da-bao">Đã báo</h2>
        {!daTai ? <EmptyState kind="loading" title="Đang tải yêu cầu sửa chữa…" /> : !rows.length ? (
          <p className="nt-phu">Bạn chưa báo hỏng lần nào. Khi gửi, bạn sẽ thấy thợ nào nhận và bao giờ đến.</p>
        ) : rows.map((row) => {
          const t = TONE[row.trangThai] ?? { tone: 'neutral' as const }
          return (
            <article key={row.id} className="nt-dong nt-su-co">
              <div className="nt-spread">
                <StatusTag tone={t.tone} icon={t.icon}>{row.tenTrangThai}</StatusTag>
                <span className="nt-phu">{row.maYeuCau ?? `#${row.id}`} · {ngayNgan(row.taoLuc)}</span>
              </div>
              <strong className="nt-ten">{row.hangMuc}</strong>
              <div className="nt-phu">Phòng {row.soPhong} · {row.nguoiXuLyId != null ? 'đã có thợ nhận' : 'chưa giao thợ'}{row.mucDo === 'KHAN_CAP' ? ' · khẩn cấp' : ''}</div>
              <p className="nt-phu" style={{ overflowWrap: 'anywhere' }}>{row.moTa}</p>
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
                    <Button type="submit" variant="secondary" blocked={action.busy}>Huỷ yêu cầu…</Button>
                  </form>
                ) : <Button variant="text" onClick={() => setDangHuy(row.id)}>Huỷ yêu cầu…</Button>
              ) : null}
            </article>
          )
        })}
      </section>

      <ChanDinh>
        <Button type="submit" form="bao-hong-form" blocked={action.busy} blockedReason={action.busy ? 'Đang gửi, vui lòng chờ.' : undefined}>Gửi báo hỏng</Button>
      </ChanDinh>
    </section>
  )
}
