import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { fetchChiTietSuaChua, fetchLienKetAnh, fetchPhong, type ThongTinPhong, type ThongTinYeuCauSuaChua } from './api'
import { managementRequest, type Worker } from './managementApi'
import { Feedback, BuildingSelect, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Field } from './design/forms/Field'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { QuanLyBaoGiaVaThanhToan } from './QuanLyBaoGiaVaThanhToan'
import type { BaoGiaSuaChua, ThanhToanTho } from './workerDashboardApi'
import './SuCo.css'

type YeuCau = ThongTinYeuCauSuaChua
type Chip = 'mo' | 'can' | 'dang' | 'xong'

const KET_THUC = ['DA_DONG', 'DA_HUY']
const NHOM: Record<Chip, [string, string[] | null]> = {
  mo: ['Đang mở', null],
  can: ['Cần phân công', ['MOI_TIEP_NHAN', 'DA_TIEP_NHAN']],
  dang: ['Đang sửa', ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_XAC_NHAN']],
  xong: ['Đã đóng', KET_THUC],
}
const thuocNhom = (k: Chip, r: YeuCau) => (NHOM[k][1] ? NHOM[k][1]!.includes(r.trangThai) : !KET_THUC.includes(r.trangThai))
const BUOC = ['Tiếp nhận', 'Phân công thợ', 'Khảo sát & báo giá', 'Duyệt báo giá', 'Sửa xong · chờ nghiệm thu', 'Thanh toán thợ']
const TRANG_THAI_BUOC = ['Chưa có người tiếp nhận', 'Chưa có thợ', 'Thợ đang khảo sát, chưa gửi báo giá', 'Chờ duyệt chi phí', 'Chờ nghiệm thu', 'Chờ thanh toán']
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const ma = (r: YeuCau) => r.maYeuCau ?? `#${r.id}`
const toneMucDo = (m: string) => (m === 'KHAN_CAP' ? 'urgent' : m === 'GAP' ? 'waiting' : 'neutral') as 'urgent' | 'waiting' | 'neutral'
const laChip = (v: string | null): v is Chip => v !== null && v in NHOM

export function dieuHuongMacDinh(href: string) {
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Bước đang làm (0..5; 6 = xong hết) từ trạng thái yêu cầu + báo giá + thanh toán. */
export function buocHienTai(r: YeuCau, baoGia: BaoGiaSuaChua[], thanhToan: ThanhToanTho[]): number {
  const hieuLuc = baoGia.find((b) => b.trangThai === 'DA_DUYET')
  const conNo = hieuLuc ? Number(hieuLuc.tongTien) - thanhToan.reduce((a, t) => a + Number(t.soTien), 0) > 0 : false
  switch (r.trangThai) {
    case 'MOI_TIEP_NHAN': return 0
    case 'DA_TIEP_NHAN': return 1
    case 'DA_PHAN_CONG': case 'DANG_XU_LY': return hieuLuc ? 4 : baoGia.some((b) => b.trangThai === 'CHO_DUYET') ? 3 : 2
    case 'CHO_XAC_NHAN': return 4
    case 'DA_DONG': return conNo ? 5 : 6
    default: return 6
  }
}

function ngayTruoc(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? 'hôm nay' : `${d} ngày`
}

/** /su-co của quản lý: một danh sách + ngăn chi tiết (chọn bằng `?id=` hoặc `?yeuCauId=`, lọc bằng `?loc=`, báo mới bằng `?baoMoi=1&phongId=`). */
export default function SuCoQuanLy({ token, dieuHuong = dieuHuongMacDinh }: { token: string; dieuHuong?: (href: string) => void }) {
  const building = useBuildings(token)
  const [, veLai] = useState(0)
  const [rooms, setRooms] = useState<Array<Pick<ThongTinPhong, 'id' | 'soPhong'>>>([])
  const [rows, setRows] = useState<YeuCau[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ngoai, setNgoai] = useState<YeuCau | null>(null)
  const [tim, setTim] = useState('')
  const [dangHuy, setDangHuy] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const [workerIds, setWorkerIds] = useState<Record<number, string>>({})
  const [costs, setCosts] = useState<Record<number, { chiPhi: string; benChiuChiPhi: string }>>({})
  const [lyDoHuy, setLyDoHuy] = useState('')
  const [bg, setBg] = useState<{ id: number; baoGia: BaoGiaSuaChua[]; thanhToan: ThanhToanTho[] } | null>(null)
  const [form, setForm] = useState({ phongId: '', hangMuc: '', moTa: '', mucDo: 'THUONG' })
  const action = useAction()
  const khoiBaoGia = useRef<HTMLDivElement>(null)
  const ngan = useRef<HTMLElement>(null)
  const toaNhaId = building.buildingId

  // Đường dẫn là nguồn sự thật: App (và dieuHuongMacDinh) bắn popstate sau mỗi lần điều hướng.
  useEffect(() => {
    const f = () => veLai((n) => n + 1)
    window.addEventListener('popstate', f)
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 1180px)') : null
    mq?.addEventListener?.('change', f)
    return () => { window.removeEventListener('popstate', f); mq?.removeEventListener?.('change', f) }
  }, [])
  const q = new URLSearchParams(window.location.search)
  const idChon = Number(q.get('id') ?? q.get('yeuCauId')) || null
  const baoMoi = q.get('baoMoi') === '1'
  const phongUrl = q.get('phongId') ?? ''
  const hep = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1180px)').matches

  const danhSachToa = building.buildings
  const idsToa = toaNhaId ? [toaNhaId] : danhSachToa.map((b) => b.id)
  const khoaToa = idsToa.join(',')
  async function load() {
    const moi = await Promise.all(idsToa.map((id) => managementRequest<YeuCau[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${id}`)))
    setRows(moi.flat())
  }
  useEffect(() => { setDangTai(true); void action.run(load, '').finally(() => setDangTai(false)) }, [khoaToa, token])
  useEffect(() => {
    if (!baoMoi || !toaNhaId) { setRooms([]); return undefined }
    let active = true
    fetchPhong(token, toaNhaId).then((r) => { if (active) setRooms(r) }).catch((e: Error) => { if (active) action.setError(e.message) })
    return () => { active = false }
  }, [token, toaNhaId, baoMoi])
  useEffect(() => { if (baoMoi && phongUrl) setForm((f) => ({ ...f, phongId: phongUrl })) }, [baoMoi, phongUrl])

  const trongDs = rows.find((r) => r.id === idChon) ?? null
  // Yêu cầu mở từ link ngoài (thông báo, hồ sơ) mà không nằm trong toà đang chọn → tải riêng.
  useEffect(() => {
    setNgoai(null)
    if (!idChon || dangTai || trongDs) return undefined
    let active = true
    fetchChiTietSuaChua(token, idChon).then((r) => { if (active) setNgoai(r) }).catch((e: Error) => { if (active) action.setError(e.message) })
    return () => { active = false }
  }, [idChon, dangTai, trongDs === null, token])

  const mo = trongDs ?? ngoai
  const loc: Chip = laChip(q.get('loc')) ? (q.get('loc') as Chip) : mo && KET_THUC.includes(mo.trangThai) ? 'xong' : 'mo'
  const dem = (k: Chip) => rows.filter((r) => thuocNhom(k, r)).length
  const tuKhoa = boDau(tim).trim()
  const ds = rows
    .filter((r) => thuocNhom(loc, r) && (!tuKhoa || boDau(`${ma(r)} ${r.soPhong} ${r.hangMuc}`).includes(tuKhoa)))
    .sort((a, b) => Number(b.mucDo === 'KHAN_CAP') - Number(a.mucDo === 'KHAN_CAP') || b.taoLuc.localeCompare(a.taoLuc))
  const chon = baoMoi ? null : mo ?? (hep ? null : ds[0] ?? null)
  const tuongTac = baoMoi || mo !== null // người dùng đã chủ động mở ngăn (≤ 1180px mới hiện)
  const href = (id: number | null, k: Chip) => `/su-co?${id ? `id=${id}&` : ''}loc=${k}`
  const di = (to: string) => (e: MouseEvent) => { if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); dieuHuong(to) }
  const dongNgan = () => dieuHuong(href(null, loc))
  useDialogTrap({ open: hep && tuongTac, dialogRef: ngan, onClose: dongNgan })

  const idChonThuc = chon?.id ?? null
  const idToaChon = chon ? danhSachToa.find((b) => b.ten === chon.toaNha)?.id ?? toaNhaId : null
  const chonKetThuc = chon ? KET_THUC.includes(chon.trangThai) : false
  useEffect(() => {
    setDangHuy(false); setLyDoHuy('')
    if (!idChonThuc || !idToaChon || chonKetThuc) { setWorkers([]); return undefined }
    let active = true
    managementRequest<Worker[]>(token, `/api/yeu-cau-sua-chua/tho?toaNhaId=${idToaChon}`).then((w) => { if (active) setWorkers(w) }).catch((e: Error) => { if (active) action.setError(e.message) })
    return () => { active = false }
  }, [idChonThuc, idToaChon, chonKetThuc, token])

  async function create(e: FormEvent) {
    e.preventDefault()
    if (photos.length > 5) { action.setError('Chọn tối đa 5 ảnh.'); return }
    await action.run(async () => {
      const data = new FormData()
      for (const [k, v] of Object.entries(form)) data.set(k, v)
      photos.forEach((p) => data.append('anh', p))
      await managementRequest(token, '/api/yeu-cau-sua-chua', 'POST', data)
      setForm({ ...form, hangMuc: '', moTa: '' }); setPhotos([])
      dieuHuong(href(null, loc))
      await load()
    }, 'Đã gửi yêu cầu sửa chữa.')
  }
  async function command(id: number, path: string, body?: unknown, method = 'POST') {
    await action.run(async () => { await managementRequest(token, `/api/yeu-cau-sua-chua/${id}/${path}`, method, body); await load() })
  }
  const bgChon = bg && chon && bg.id === chon.id ? bg : null
  const buoc = chon ? buocHienTai(chon, bgChon?.baoGia ?? [], bgChon?.thanhToan ?? []) : 0
  const huy = chon?.trangThai === 'DA_HUY'
  const docChiDoc = chonKetThuc && buoc === 6
  const chonThoId = chon ? workerIds[chon.id] : ''
  // Nút chính theo bước: gọi đúng lệnh cũ; bước do thợ làm (khảo sát, sửa) không có nút.
  function nutChinh(): { nhan: string; chay: () => void; chan?: string } | null {
    if (!chon) return null
    // Duyệt báo giá / trả thợ nằm trong khối báo giá & thanh toán cũ: bấm nút thật của khối đó.
    const bam = (nhan: string) => () => { const b = Array.from(khoiBaoGia.current?.querySelectorAll('button') ?? []).find((x) => x.textContent?.includes(nhan)); if (b) b.click(); else khoiBaoGia.current?.scrollIntoView?.({ block: 'start' }) }
    if (chon.trangThai === 'MOI_TIEP_NHAN') return { nhan: 'Tiếp nhận yêu cầu', chay: () => void command(chon.id, 'tiep-nhan') }
    if (chon.trangThai === 'DA_TIEP_NHAN') return { nhan: 'Phân công thợ', chay: () => void command(chon.id, 'phan-cong', { thoId: Number(chonThoId) }), chan: chonThoId ? undefined : 'Chọn thợ trước khi phân công.' }
    if (buoc === 3) return { nhan: 'Duyệt báo giá', chay: bam('Phê duyệt báo giá') }
    if (chon.trangThai === 'CHO_XAC_NHAN') return { nhan: 'Nghiệm thu', chay: () => void command(chon.id, 'xac-nhan-dong') }
    if (buoc === 5) return { nhan: 'Xác nhận thanh toán thợ', chay: bam('Ghi nhận trả thợ') }
    return null
  }
  const chinh = nutChinh()
  const ghiChu = buoc === 2 ? 'Đang chờ thợ gửi báo giá.' : buoc === 4 && chon?.trangThai !== 'CHO_XAC_NHAN' ? 'Thợ đang sửa, chờ thợ báo xong.' : null
  const tieuDeToa = toaNhaId ? danhSachToa.find((b) => b.id === toaNhaId)?.ten ?? '' : `Tất cả ${danhSachToa.length} toà`
  const doiThoSan = !chonKetThuc && chon?.trangThai !== 'CHO_XAC_NHAN'

  const bieuMauTao = (
    <form className="drawer-form" onSubmit={create} aria-label="Báo sự cố mới">
      <div className="drawer-b">
        {!toaNhaId && <><BuildingSelect buildings={danhSachToa} value={toaNhaId} onChange={building.setBuildingId} /><p className="t-sm t-2">Chọn một toà để chọn phòng báo sự cố.</p></>}
        <Field label="Phòng"><select className="select" required value={form.phongId} onChange={(e) => setForm({ ...form, phongId: e.target.value })}><option value="">Chọn phòng</option>{rooms.map((r) => <option key={r.id} value={r.id ?? ''}>Phòng {r.soPhong}</option>)}</select></Field>
        <Field label="Hạng mục"><input className="input" required value={form.hangMuc} onChange={(e) => setForm({ ...form, hangMuc: e.target.value })} /></Field>
        <Field label="Mức độ"><select className="select" value={form.mucDo} onChange={(e) => setForm({ ...form, mucDo: e.target.value })}><option value="THUONG">Bình thường</option><option value="GAP">Cao</option><option value="KHAN_CAP">Khẩn cấp</option></select></Field>
        <Field label="Mô tả sự cố"><textarea className="input" style={{ height: 'auto', minHeight: 88 }} required value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} /></Field>
        <Field label="Ảnh sự cố (tối đa 5 ảnh)"><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} /></Field>
      </div>
      <div className="drawer-f"><Button type="submit" variant="primary" blocked={action.busy} blockedReason={action.busy ? 'Đang gửi, vui lòng chờ.' : undefined}>Gửi yêu cầu sửa chữa</Button></div>
    </form>
  )

  const chiTiet = chon && (
    <>
      <div className="drawer-b">
        <p>{chon.moTa}</p>
        {huy ? <p className="t-sm" style={{ color: 'var(--ma-urgent)' }}>Đã huỷ{chon.lyDoHuy ? `: ${chon.lyDoHuy}` : '.'}</p> : (
          <div>
            <div className="blk-h"><h2>Tiến độ</h2><span className="t-meta">{Math.min(buoc, 6)}/6 bước</span></div>
            <div className="vsteps" style={{ marginTop: 8 }}>
              {BUOC.map((t, i) => (
                <div key={t} className={`vstep ${i < buoc ? 'done' : i === buoc ? 'cur' : 'todo'}`} aria-current={i === buoc ? 'step' : undefined}>
                  <span className="n">{i < buoc ? <Icon name="check" size="sm" /> : i + 1}</span>
                  <div><div className="tt">{t}</div>{i === buoc && <div className="st">{TRANG_THAI_BUOC[i]}</div>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <dl className="kv">
          <dt>Báo lúc</dt><dd>{dinhDangNgayIso(chon.taoLuc)}</dd>
          <dt>Liên hệ</dt><dd>{chon.soDienThoaiLienHe ? <a href={`tel:${chon.soDienThoaiLienHe}`} style={{ color: 'var(--ma-text-link)' }}>{chon.soDienThoaiLienHe}</a> : 'Chưa có'}</dd>
          <dt>Thợ</dt><dd>{chon.nguoiXuLyId ? (workers.find((w) => w.id === chon.nguoiXuLyId)?.hoTen ?? `Thợ #${chon.nguoiXuLyId}`) : 'Chưa phân công'}</dd>
          <dt>Chi phí</dt><dd>{chon.chiPhi == null ? 'Chưa có báo giá' : `${dinhDangTien(chon.chiPhi)} ₫`}</dd>
          <dt>Ảnh</dt>
          <dd>{chon.anh?.length ? (
            <span className="row-wrap">{chon.anh.map((p) => photoUrls[p.id]
              ? <img key={p.id} src={photoUrls[p.id]} alt={`Ảnh sự cố ${chon.id}`} style={{ maxWidth: 200, maxHeight: 160, objectFit: 'contain', borderRadius: 'var(--ma-radius-md)' }} />
              : <Button key={p.id} variant="secondary" size="sm" onClick={() => void action.run(async () => setPhotoUrls({ ...photoUrls, [p.id]: await fetchLienKetAnh(token, p.id) }), 'Đã mở ảnh sự cố.')}><Icon name="camera" />Xem ảnh #{p.id}</Button>)}</span>
          ) : 'Chưa có ảnh'}</dd>
        </dl>

        {chonKetThuc && (
          <div>
            <div className="blk-h"><h2>Lịch sử</h2></div>
            <ul className="tl">
              {[['Báo sự cố', chon.taoLuc], ['Tiếp nhận', chon.tiepNhanLuc], ['Phân công thợ', chon.phanCongLuc], ['Chờ nghiệm thu', chon.choXacNhanLuc]].filter(([, t]) => t).map(([n, t]) => (
                <li key={n}><span className="dot ok" /><span>{n}</span><span className="when">{dinhDangNgayIso(t as string)}</span></li>
              ))}
            </ul>
          </div>
        )}

        {doiThoSan && (
          <Field label="Thợ sửa chữa"><select className="select" value={chonThoId ?? ''} onChange={(e) => setWorkerIds({ ...workerIds, [chon.id]: e.target.value })}><option value="">Chọn thợ</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.hoTen} · {w.soDienThoai}</option>)}</select></Field>
        )}
        {doiThoSan && chinh?.nhan !== 'Phân công thợ' && (
          <div><Button variant="secondary" blocked={action.busy || !chonThoId} blockedReason="Chọn thợ trước khi phân công." onClick={() => void command(chon.id, 'phan-cong', { thoId: Number(chonThoId) })}>Phân công thợ</Button></div>
        )}
        {!chonKetThuc && (
          <form className="row-wrap" style={{ alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); void command(chon.id, 'chi-phi', costs[chon.id] ?? { chiPhi: String(chon.chiPhi ?? 0), benChiuChiPhi: chon.benChiuChiPhi ?? 'CHU_NHA' }, 'PUT') }}>
            <Field label="Chi phí sửa chữa (đồng)"><input className="input" type="number" min="0" step="0.01" required value={costs[chon.id]?.chiPhi ?? chon.chiPhi ?? ''} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: e.target.value, benChiuChiPhi: costs[chon.id]?.benChiuChiPhi ?? chon.benChiuChiPhi ?? 'CHU_NHA' } })} /></Field>
            <Field label="Bên chịu chi phí"><select className="select" value={costs[chon.id]?.benChiuChiPhi ?? chon.benChiuChiPhi ?? 'CHU_NHA'} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: costs[chon.id]?.chiPhi ?? String(chon.chiPhi ?? ''), benChiuChiPhi: e.target.value } })}><option value="CHU_NHA">Chủ nhà</option><option value="NGUOI_THUE">Người thuê</option></select></Field>
            <Button type="submit" variant="secondary" blocked={action.busy}>Lưu chi phí</Button>
          </form>
        )}
        {dangHuy && !chonKetThuc && (
          <form className="row-wrap" style={{ alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); void command(chon.id, 'huy', { lyDo: lyDoHuy }) }}>
            <Field label="Lý do huỷ yêu cầu"><input className="input" required value={lyDoHuy} onChange={(e) => setLyDoHuy(e.target.value)} /></Field>
            <Button type="submit" variant="secondary" blocked={action.busy}>Xác nhận huỷ</Button>
          </form>
        )}
        {/* Báo giá/thanh toán luôn gắn để biết bước; chỉ hiện từ bước khảo sát trở đi. */}
        <div ref={khoiBaoGia} hidden={buoc < 2 && !chonKetThuc}>
          <QuanLyBaoGiaVaThanhToan key={chon.id} token={token} yeuCauId={chon.id} onDuLieu={(b, t) => setBg({ id: chon.id, baoGia: b, thanhToan: t })} />
        </div>
      </div>
      {!docChiDoc && !huy && (
        <div className="drawer-f">
          {chinh ? <Button variant="primary" blocked={action.busy || Boolean(chinh.chan)} blockedReason={chinh.chan} onClick={chinh.chay}>{chinh.nhan}</Button> : ghiChu && <p className="t-sm t-2" style={{ flex: 1, alignSelf: 'center' }}>{ghiChu}</p>}
          {!chonKetThuc && <Button variant="secondary" onClick={() => setDangHuy(true)}>Huỷ yêu cầu</Button>}
        </div>
      )}
    </>
  )

  return (
    <section data-testid="su-co-quan-ly" aria-labelledby="su-co-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <div className="ph">
        <div className="grow"><h1 className="h1" id="su-co-title">Sự cố</h1><p className="sub">{tieuDeToa} · bấm một dòng để xem chi tiết bên phải</p></div>
        <div className="ph-acts"><Button variant="secondary" onClick={() => dieuHuong(`/su-co?baoMoi=1&loc=${loc}`)}><Icon name="plus" />Báo sự cố</Button></div>
      </div>

      <Feedback error={action.error ?? building.error} success={action.success} />

      {dangTai ? <EmptyState kind="loading" title="Đang tải yêu cầu sửa chữa" />
        : idsToa.length === 0 ? <EmptyState title="Chưa có toà nào để xem sự cố." />
          : (
            <div className="split sc-split">
              <section className="card flush" aria-label="Danh sách sự cố">
                <div className="toolbar">
                  {(Object.keys(NHOM) as Chip[]).map((k) => (
                    <a key={k} className="chip" href={href(null, k)} aria-pressed={loc === k} onClick={di(href(null, k))}>{NHOM[k][0]} <span className="n">{dem(k)}</span></a>
                  ))}
                  <span className="push" />
                  <label className="input-wrap" style={{ width: 220 }}><span className="sr-only">Tìm sự cố</span><Icon name="search" /><input className="input" type="search" placeholder="Tìm phòng, hạng mục" value={tim} onChange={(e) => setTim(e.target.value)} /></label>
                </div>
                {ds.length === 0 ? <div style={{ padding: '0 24px 16px' }}><EmptyState title={rows.length === 0 ? 'Chưa có yêu cầu sửa chữa.' : 'Không có sự cố ở nhóm này.'} body={rows.length === 0 ? 'Khi người thuê báo hỏng, yêu cầu sẽ hiện ở đây.' : 'Đổi nhóm hoặc xoá ô tìm để xem thêm.'} /></div> : (
                  <div style={{ paddingBottom: 8 }}>
                    {ds.map((r) => (
                      <a key={r.id} className={`irow${r.id === chon?.id ? ' sel' : ''}`} href={href(r.id, loc)} aria-current={r.id === chon?.id ? 'true' : undefined} data-repair-row={r.id} onClick={di(href(r.id, loc))}>
                        <span className={`tile ${r.mucDo === 'KHAN_CAP' ? 'red' : r.mucDo === 'GAP' ? 'warm' : ''}`}><Icon name={r.mucDo === 'THUONG' ? 'wrench' : 'alert'} /></span>
                        <div className="body"><div className="t">{r.hangMuc}</div><div className="s">{r.toaNha} · Phòng {r.soPhong} · {ma(r)}</div></div>
                        {r.mucDo !== 'THUONG' && <StatusTag tone={toneMucDo(r.mucDo)}>{r.tenMucDo}</StatusTag>}
                        <span className="t-meta" style={{ width: 64, textAlign: 'right' }}>{ngayTruoc(r.taoLuc)}</span>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {(baoMoi || chon) && (
                <aside ref={ngan} className={`drawer${tuongTac ? '' : ' sc-chua-mo'}`} data-repair-detail-panel={chon?.id} role={hep && tuongTac ? 'dialog' : undefined} aria-modal={hep && tuongTac ? true : undefined} aria-labelledby="su-co-ngan">
                  <div className="drawer-h">
                    <div className="row-wrap" style={{ gap: 8 }}>
                      {chon ? <>
                        <StatusTag tone={toneMucDo(chon.mucDo)}>{chon.tenMucDo}</StatusTag>
                        <StatusTag tone={chon.trangThai === 'DA_DONG' ? 'done' : chon.trangThai === 'DA_HUY' ? 'closed' : 'strong'}>{chon.tenTrangThai}</StatusTag>
                        <span className="t-meta" style={{ marginLeft: 'auto' }}>{ma(chon)}</span>
                      </> : <span className="t-meta">Yêu cầu mới</span>}
                      <button type="button" className="icon-btn sc-dong" aria-label="Đóng chi tiết" onClick={dongNgan}><Icon name="x" /></button>
                    </div>
                    <h2 className="h2" id="su-co-ngan" style={{ marginTop: 10 }}>{chon ? chon.hangMuc : 'Báo sự cố mới'}</h2>
                    {chon && <p className="t-sm t-2" style={{ marginTop: 2 }}>{chon.toaNha} · Phòng {chon.soPhong} · tầng {chon.tang}</p>}
                  </div>
                  {chon ? chiTiet : bieuMauTao}
                </aside>
              )}
            </div>
          )}
    </section>
  )
}
