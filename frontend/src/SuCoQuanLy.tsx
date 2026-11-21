import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { fetchLienKetAnh, fetchPhong, type ThongTinPhong, type ThongTinYeuCauSuaChua } from './api'
import { managementRequest, type Worker } from './managementApi'
import { Feedback, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { dinhDangTien } from './design/core/format'
import { Field } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { EmptyState } from './design/feedback/EmptyState'
import { DataTable, type DataTableChip, type DataTableColumn } from './design/table/DataTable'
import { QuanLyBaoGiaVaThanhToan } from './QuanLyBaoGiaVaThanhToan'

type YeuCau = ThongTinYeuCauSuaChua
type Tone = 'urgent' | 'waiting' | 'done' | 'closed' | 'strong' | 'neutral'

const DANG_XU_LY = ['DA_TIEP_NHAN', 'DA_PHAN_CONG', 'DANG_XU_LY']
const KET_THUC = ['DA_DONG', 'DA_HUY']
const CHIP: DataTableChip<YeuCau>[] = [
  { key: 'MOI', label: 'Mới', match: (r) => r.trangThai === 'MOI_TIEP_NHAN' },
  { key: 'DANG_XU_LY', label: 'Đang xử lý', match: (r) => DANG_XU_LY.includes(r.trangThai) },
  { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận', match: (r) => r.trangThai === 'CHO_XAC_NHAN' },
  { key: 'KET_THUC', label: 'Đã đóng', match: (r) => KET_THUC.includes(r.trangThai) },
]
const toneTrangThai = (t: string): Tone => t === 'MOI_TIEP_NHAN' ? 'urgent' : t === 'CHO_XAC_NHAN' ? 'strong' : t === 'DA_DONG' ? 'done' : t === 'DA_HUY' ? 'closed' : 'waiting'
const toneMucDo = (m: string): Tone => m === 'KHAN_CAP' ? 'urgent' : m === 'GAP' ? 'waiting' : 'neutral'
const ma = (r: YeuCau) => r.maYeuCau ?? `#${r.id}`
const cat = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const

function cot(chon: (id: number) => void, dangChon: number | null): DataTableColumn<YeuCau>[] {
  return [
    { key: 'ma', label: 'Mã', sortable: true, sortValue: ma, render: (r) => <strong style={{ whiteSpace: 'nowrap' }}>{ma(r)}</strong> },
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (r) => r.soPhong, render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.soPhong}</span> },
    { key: 'hangMuc', label: 'Hạng mục', the: 'tieu-de', render: (r) => <div style={{ maxWidth: 'min(360px, calc(100vw - 96px))', minWidth: 0 }}><div style={cat} title={r.hangMuc}><strong>{r.hangMuc}</strong></div><div className="t-meta" style={cat} title={r.moTa}>{r.moTa}</div></div> },
    { key: 'mucDo', label: 'Mức độ', render: (r) => <StatusTag tone={toneMucDo(r.mucDo)}>{r.tenMucDo}</StatusTag> },
    { key: 'trangThai', label: 'Trạng thái', render: (r) => <StatusTag tone={toneTrangThai(r.trangThai)}>{r.tenTrangThai}</StatusTag> },
    { key: 'chiPhi', label: 'Chi phí', align: 'num', sortable: true, sortValue: (r) => (r.chiPhi == null ? null : Number(r.chiPhi)), render: (r) => (r.chiPhi == null ? '—' : `${dinhDangTien(r.chiPhi)} ₫`) },
    { key: 'xuLy', label: 'Thao tác', the: 'hanh-dong', render: (r) => <Button variant="secondary" size="sm" aria-label={`${dangChon === r.id ? 'Đang mở' : 'Mở'} ${ma(r)}`} onClick={() => chon(r.id)}>{dangChon === r.id ? 'Đang mở' : 'Mở'}</Button> },
  ]
}

/** /su-co của quản lý: danh sách yêu cầu → chi tiết (tiếp nhận, phân công, chi phí, báo giá, đóng/huỷ). */
export default function SuCoQuanLy({ token }: { token: string }) {
  const building = useBuildings(token)
  const [rooms, setRooms] = useState<Array<Pick<ThongTinPhong, 'id' | 'soPhong'>>>([])
  const [roomError, setRoomError] = useState<string | null>(null)
  const [rows, setRows] = useState<YeuCau[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [chonId, setChonId] = useState<number | null>(null)
  const [hienTao, setHienTao] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const [workerIds, setWorkerIds] = useState<Record<number, string>>({})
  const [costs, setCosts] = useState<Record<number, { chiPhi: string; benChiuChiPhi: string }>>({})
  const [cancelReasons, setCancelReasons] = useState<Record<number, string>>({})
  const [form, setForm] = useState({ phongId: '', hangMuc: '', moTa: '', mucDo: 'THUONG' })
  const action = useAction()
  const chiTietRef = useRef<HTMLDivElement>(null)
  const toaNhaId = building.buildingId

  async function load() {
    if (!toaNhaId) { setRows([]); return }
    setRows(await managementRequest(token, `/api/yeu-cau-sua-chua?toaNhaId=${toaNhaId}`))
    setWorkers(await managementRequest(token, `/api/yeu-cau-sua-chua/tho?toaNhaId=${toaNhaId}`))
  }
  useEffect(() => { setDangTai(true); void action.run(load, '').finally(() => setDangTai(false)) }, [toaNhaId, token])
  useEffect(() => {
    let active = true
    if (!toaNhaId) { setRooms([]); return }
    fetchPhong(token, toaNhaId).then((r) => { if (active) setRooms(r) }).catch((e: Error) => { if (active) setRoomError(e.message) })
    return () => { active = false }
  }, [token, toaNhaId])

  async function create(e: FormEvent) {
    e.preventDefault()
    if (photos.length > 5) { action.setError('Chọn tối đa 5 ảnh.'); return }
    await action.run(async () => {
      const data = new FormData()
      for (const [k, v] of Object.entries(form)) data.set(k, v)
      photos.forEach((p) => data.append('anh', p))
      await managementRequest(token, '/api/yeu-cau-sua-chua', 'POST', data)
      setForm({ ...form, hangMuc: '', moTa: '' }); setPhotos([]); setHienTao(false)
      await load()
    }, 'Đã gửi yêu cầu sửa chữa.')
  }
  async function command(id: number, path: string, body?: unknown, method = 'POST') {
    await action.run(async () => { await managementRequest(token, `/api/yeu-cau-sua-chua/${id}/${path}`, method, body); await load() })
  }

  const chon = rows.find((r) => r.id === chonId) ?? null
  useEffect(() => { if (chonId) chiTietRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }) }, [chonId])
  const cotBang = useMemo(() => cot((id) => { setChonId(id); setHienTao(false) }, chonId), [chonId])
  const dem = (f: (r: YeuCau) => boolean) => rows.filter(f).length
  const moi = dem((r) => r.trangThai === 'MOI_TIEP_NHAN')
  const mo = dem((r) => !KET_THUC.includes(r.trangThai))

  return (
    <section data-testid="su-co-quan-ly" aria-labelledby="su-co-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1" id="su-co-title">Sự cố</h1>
          <p className="sub">{mo} đang mở · {moi} mới chờ tiếp nhận · {rows.length} yêu cầu</p>
        </div>
        <div className="topbar-actions">
          <label className="sr-only" htmlFor="su-co-toa">Toà nhà</label>
          <select id="su-co-toa" className="select" style={{ width: 220 }} value={toaNhaId ?? ''} onChange={(e) => { building.setBuildingId(e.target.value ? Number(e.target.value) : null); setChonId(null) }}>
            <option value="">Chọn toà nhà</option>
            {building.buildings.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}
          </select>
          <Button variant={chon ? 'secondary' : 'primary'} onClick={() => { setHienTao(!hienTao); setChonId(null) }}><Icon name={hienTao ? 'x' : 'plus'} />{hienTao ? 'Đóng form báo sự cố' : 'Báo sự cố mới'}</Button>
        </div>
      </header>

      <Feedback error={action.error ?? building.error ?? roomError} success={action.success} />

      {hienTao && (
        <Card title="Gửi yêu cầu sửa chữa">
          <form className="stack" onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: 14 }}>
              <Field label="Phòng"><select className="select" required value={form.phongId} onChange={(e) => setForm({ ...form, phongId: e.target.value })}><option value="">Chọn phòng</option>{rooms.map((r) => <option key={r.id} value={r.id ?? ''}>Phòng {r.soPhong}</option>)}</select></Field>
              <Field label="Hạng mục"><input className="input" required value={form.hangMuc} onChange={(e) => setForm({ ...form, hangMuc: e.target.value })} /></Field>
              <Field label="Mức độ"><select className="select" value={form.mucDo} onChange={(e) => setForm({ ...form, mucDo: e.target.value })}><option value="THUONG">Bình thường</option><option value="GAP">Cao</option><option value="KHAN_CAP">Khẩn cấp</option></select></Field>
            </div>
            <Field label="Mô tả sự cố"><textarea className="input" style={{ height: 'auto', minHeight: 88 }} required value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} /></Field>
            <Field label="Ảnh sự cố (tối đa 5 ảnh)"><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} /></Field>
            <div><Button type="submit" variant="primary" blocked={action.busy} blockedReason={action.busy ? 'Đang gửi, vui lòng chờ.' : undefined}>Gửi yêu cầu sửa chữa</Button></div>
          </form>
        </Card>
      )}

      {dangTai ? <EmptyState kind="loading" title="Đang tải yêu cầu sửa chữa" />
        : !toaNhaId ? <EmptyState title="Chọn một toà nhà để xem sự cố." />
          : rows.length === 0 ? <EmptyState title="Toà này chưa có yêu cầu sửa chữa." body="Khi người thuê báo hỏng, yêu cầu sẽ hiện ở đây." />
            : (
              <Card>
                <DataTable rows={rows} columns={cotBang} getRowId={(r) => r.id} chips={CHIP} timTheo={(r) => `${ma(r)} ${r.soPhong} ${r.hangMuc} ${r.moTa}`} searchLabel="Tìm mã, phòng, hạng mục" noun="yêu cầu" pageSize={10} rowLabel={(r) => ma(r)} rowProps={(r) => ({ 'data-repair-row': String(r.id) })} />
              </Card>
            )}

      {chon && (
        <div ref={chiTietRef} style={{ scrollMarginTop: 16 }}><Card
          data-repair-detail-panel={chon.id}
          title={`${ma(chon)} · Phòng ${chon.soPhong} · ${chon.hangMuc}`}
          action={<Button variant="text" size="sm" onClick={() => setChonId(null)}><Icon name="x" />Đóng chi tiết</Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 24, alignItems: 'start' }}>
            <div className="stack">
              <div className="row-wrap">
                <StatusTag tone={toneTrangThai(chon.trangThai)}>{chon.tenTrangThai}</StatusTag>
                <StatusTag tone={toneMucDo(chon.mucDo)}>{chon.tenMucDo}</StatusTag>
                <span className="t-meta">{chon.toaNha} · tầng {chon.tang}</span>
              </div>
              <p>{chon.moTa}</p>
              {chon.soDienThoaiLienHe && <p className="t-sm"><Icon name="phone" /> Liên hệ: <a href={`tel:${chon.soDienThoaiLienHe}`} style={{ color: 'var(--ma-text-link)' }}>{chon.soDienThoaiLienHe}</a></p>}
              {chon.lyDoHuy && <p className="t-sm" style={{ color: 'var(--ma-urgent)' }}>Lý do huỷ: {chon.lyDoHuy}</p>}
              {chon.anh?.length ? (
                <div className="row-wrap">
                  {chon.anh.map((p) => photoUrls[p.id]
                    ? <img key={p.id} src={photoUrls[p.id]} alt={`Ảnh sự cố ${chon.id}`} style={{ maxWidth: 220, maxHeight: 180, objectFit: 'contain', borderRadius: 'var(--ma-radius-md)' }} />
                    : <Button key={p.id} variant="secondary" size="sm" onClick={() => void action.run(async () => setPhotoUrls({ ...photoUrls, [p.id]: await fetchLienKetAnh(token, p.id) }), 'Đã mở ảnh sự cố.')}><Icon name="camera" />Xem ảnh #{p.id}</Button>)}
                </div>
              ) : null}

              {chon.trangThai === 'MOI_TIEP_NHAN' && <div><Button variant="primary" blocked={action.busy} onClick={() => void command(chon.id, 'tiep-nhan')}>Tiếp nhận yêu cầu</Button></div>}
              {chon.trangThai === 'CHO_XAC_NHAN' && <div><Button variant="primary" blocked={action.busy} onClick={() => void command(chon.id, 'xac-nhan-dong')}>Xác nhận sửa xong và đóng yêu cầu</Button></div>}

              {!KET_THUC.includes(chon.trangThai) && (
                <div className="row-wrap" style={{ alignItems: 'flex-end' }}>
                  <Field label="Thợ sửa chữa"><select className="select" value={workerIds[chon.id] ?? ''} onChange={(e) => setWorkerIds({ ...workerIds, [chon.id]: e.target.value })}><option value="">Chọn thợ</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.hoTen} · {w.soDienThoai}</option>)}</select></Field>
                  <Button variant="secondary" blocked={action.busy || !workerIds[chon.id]} blockedReason="Chọn thợ trước khi phân công." onClick={() => void command(chon.id, 'phan-cong', { thoId: Number(workerIds[chon.id]) })}>Phân công thợ</Button>
                </div>
              )}

              <form className="row-wrap" style={{ alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); void command(chon.id, 'chi-phi', costs[chon.id] ?? { chiPhi: String(chon.chiPhi ?? 0), benChiuChiPhi: chon.benChiuChiPhi ?? 'CHU_NHA' }, 'PUT') }}>
                <Field label="Chi phí sửa chữa (đồng)"><input className="input" type="number" min="0" step="0.01" required value={costs[chon.id]?.chiPhi ?? chon.chiPhi ?? ''} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: e.target.value, benChiuChiPhi: costs[chon.id]?.benChiuChiPhi ?? chon.benChiuChiPhi ?? 'CHU_NHA' } })} /></Field>
                <Field label="Bên chịu chi phí"><select className="select" value={costs[chon.id]?.benChiuChiPhi ?? chon.benChiuChiPhi ?? 'CHU_NHA'} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: costs[chon.id]?.chiPhi ?? String(chon.chiPhi ?? ''), benChiuChiPhi: e.target.value } })}><option value="CHU_NHA">Chủ nhà</option><option value="NGUOI_THUE">Người thuê</option></select></Field>
                <Button type="submit" variant="secondary" blocked={action.busy}>Lưu chi phí</Button>
              </form>

              {!KET_THUC.includes(chon.trangThai) && (
                <form className="row-wrap" style={{ alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); void command(chon.id, 'huy', { lyDo: cancelReasons[chon.id] }) }}>
                  <Field label="Lý do huỷ yêu cầu"><input className="input" required value={cancelReasons[chon.id] ?? ''} onChange={(e) => setCancelReasons({ ...cancelReasons, [chon.id]: e.target.value })} /></Field>
                  <Button type="submit" variant="text" blocked={action.busy}>Huỷ yêu cầu</Button>
                </form>
              )}
            </div>
            <QuanLyBaoGiaVaThanhToan token={token} yeuCauId={chon.id} />
          </div>
        </Card></div>
      )}
    </section>
  )
}
