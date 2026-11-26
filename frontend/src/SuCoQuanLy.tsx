import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { fetchChiTietSuaChua, fetchLienKetAnh, fetchPhong, type ThongTinPhong, type ThongTinYeuCauSuaChua } from './api'
import { managementRequest, type Worker } from './managementApi'
import { Feedback, BuildingSelect, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { ThanhBuoc } from './design/core/ThanhBuoc'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Field } from './design/forms/Field'
import { EmptyState } from './design/feedback/EmptyState'
import { DauTrang } from './design/layout/DauTrang'
import { ChanDinh } from './design/layout/ChanDinh'
import { HangTong } from './design/table/HangTong'
import { QuanLyBaoGiaVaThanhToan } from './QuanLyBaoGiaVaThanhToan'
import { dinhDangSdt } from './tienTheoNguoi'
import { duyetBaoGia, fetchBaoGiaYeuCau, tuChoiBaoGia, type BaoGiaSuaChua } from './workerDashboardApi'
import './SuCo.css'

type YeuCau = ThongTinYeuCauSuaChua
type Nhom = 'can' | 'dang' | 'xong'
type Loc = 'tat-ca' | 'mo' | Nhom

const TT_SC: Record<string, string> = {
  MOI_TIEP_NHAN: 'Mới báo', DA_TIEP_NHAN: 'Đã nhận, chưa giao thợ', DA_PHAN_CONG: 'Đã giao thợ',
  DANG_XU_LY: 'Đang sửa', CHO_XAC_NHAN: 'Chờ nghiệm thu', DA_DONG: 'Đã xong', DA_HUY: 'Đã huỷ',
}
const BUOC = ['Báo hỏng', 'Tiếp nhận', 'Giao thợ', 'Báo giá', 'Duyệt', 'Sửa', 'Nghiệm thu', 'Trả tiền thợ']
const TEN_NHOM: Record<Nhom, string> = { can: 'Cần quyết', dang: 'Thợ đang làm', xong: 'Đã xong tháng này' }
const NHOM_CUA_LOC: Record<Loc, Nhom[]> = { 'tat-ca': ['can', 'dang', 'xong'], mo: ['can', 'dang'], can: ['can'], dang: ['dang'], xong: ['xong'] }
// Chỉ các trạng thái này mới có thể đang chờ duyệt báo giá; hỏi 40 việc đầu là đủ cho một toà.
const CO_THE_CO_BAO_GIA = ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_XAC_NHAN']
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const ma = (r: YeuCau) => r.maYeuCau ?? `#${r.id}`
const laLoc = (v: string | null): v is Loc => v !== null && v in NHOM_CUA_LOC
const tien = (v: string | number) => `${dinhDangTien(v)} ₫`
const cungThang = (iso: string) => { const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() }

export function dieuHuongMacDinh(href: string) {
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Bước hiện tại trong 8 bước (1..8); 0 = đã huỷ. Có báo giá chờ duyệt thì luôn là bước 5. */
export function buocHienTai(r: YeuCau, coBaoGiaCho = false): number {
  if (coBaoGiaCho) return 5
  return ({ MOI_TIEP_NHAN: 1, DA_TIEP_NHAN: 2, DA_PHAN_CONG: 3, DANG_XU_LY: 6, CHO_XAC_NHAN: 7, DA_DONG: 8 } as Record<string, number>)[r.trangThai] ?? 0
}

/** /su-co: danh sách 3 nhóm + chi tiết bên phải (chọn bằng `?id=` hoặc `?yeuCauId=`, lọc bằng `?loc=`, báo mới bằng `?baoMoi=1&phongId=`). Quản lý có thêm nút ghi sự cố mới. */
export default function SuCoQuanLy({ token, vaiTro = 'QUAN_LY', dieuHuong = dieuHuongMacDinh }: { token: string; vaiTro?: string; dieuHuong?: (href: string) => void }) {
  const building = useBuildings(token)
  const [, veLai] = useState(0)
  const [rooms, setRooms] = useState<Array<Pick<ThongTinPhong, 'id' | 'soPhong'>>>([])
  const [rows, setRows] = useState<YeuCau[]>([])
  const [cho, setCho] = useState<Record<number, BaoGiaSuaChua>>({})
  const [dangTai, setDangTai] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ngoai, setNgoai] = useState<YeuCau | null>(null)
  const [tim, setTim] = useState('')
  const [dangHuy, setDangHuy] = useState(false)
  const [tuChoi, setTuChoi] = useState(false)
  const [lyDo, setLyDo] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const [workerIds, setWorkerIds] = useState<Record<number, string>>({})
  const [costs, setCosts] = useState<Record<number, { chiPhi: string; benChiuChiPhi: string }>>({})
  const [lanTai, setLanTai] = useState(0)
  const [form, setForm] = useState({ phongId: '', hangMuc: '', moTa: '', mucDo: 'THUONG' })
  const action = useAction()
  const toaNhaId = building.buildingId

  // Đường dẫn là nguồn sự thật: App (và dieuHuongMacDinh) bắn popstate sau mỗi lần điều hướng.
  useEffect(() => {
    const f = () => veLai((n) => n + 1)
    window.addEventListener('popstate', f)
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 767px)') : null
    mq?.addEventListener?.('change', f)
    return () => { window.removeEventListener('popstate', f); mq?.removeEventListener?.('change', f) }
  }, [])
  const q = new URLSearchParams(window.location.search)
  const idChon = Number(q.get('id') ?? q.get('yeuCauId')) || null
  const baoMoi = q.get('baoMoi') === '1'
  const phongUrl = q.get('phongId') ?? ''
  const hep = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches
  const laQuanLy = vaiTro === 'QUAN_LY'

  const danhSachToa = building.buildings
  const idsToa = toaNhaId ? [toaNhaId] : danhSachToa.map((b) => b.id)
  const khoaToa = idsToa.join(',')
  async function load() {
    const moi = (await Promise.all(idsToa.map((id) => managementRequest<YeuCau[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${id}`)))).flat()
    setRows(moi)
    // Không có API gộp: hỏi báo giá của các việc thợ đang làm. Lỗi một việc thì coi như chưa có báo giá chờ.
    const kq = await Promise.all(moi.filter((r) => CO_THE_CO_BAO_GIA.includes(r.trangThai)).slice(0, 40)
      .map((r) => fetchBaoGiaYeuCau(token, r.id).then((b) => [r.id, b.find((x) => x.trangThai === 'CHO_DUYET')] as const).catch(() => [r.id, undefined] as const)))
    setCho(Object.fromEntries(kq.filter((e): e is readonly [number, BaoGiaSuaChua] => e[1] !== undefined)))
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
  // Sự cố mở từ link ngoài (thông báo, hồ sơ) mà không nằm trong toà đang chọn → tải riêng.
  useEffect(() => {
    setNgoai(null)
    if (!idChon || dangTai || trongDs) return undefined
    let active = true
    fetchChiTietSuaChua(token, idChon).then((r) => { if (active) setNgoai(r) }).catch((e: Error) => { if (active) action.setError(e.message) })
    return () => { active = false }
  }, [idChon, dangTai, trongDs === null, token])

  const mo = trongDs ?? ngoai
  const loc: Loc = laLoc(q.get('loc')) ? (q.get('loc') as Loc) : 'tat-ca'
  const nhomCua = (r: YeuCau): Nhom | null => (
    r.id in cho || r.trangThai === 'MOI_TIEP_NHAN' || r.trangThai === 'DA_TIEP_NHAN' ? 'can'
      : CO_THE_CO_BAO_GIA.includes(r.trangThai) ? 'dang'
        : r.trangThai === 'DA_DONG' && cungThang(r.choXacNhanLuc ?? r.tiepNhanLuc ?? r.taoLuc) ? 'xong' : null)
  const dem = (k: Loc) => rows.filter((r) => { const n = nhomCua(r); return n !== null && NHOM_CUA_LOC[k].includes(n) }).length
  const tuKhoa = boDau(tim).trim()
  const sapXep = (a: YeuCau, b: YeuCau) => Number(b.mucDo === 'KHAN_CAP') - Number(a.mucDo === 'KHAN_CAP') || b.taoLuc.localeCompare(a.taoLuc)
  const nhomHienThi = NHOM_CUA_LOC[loc].map((k) => [k, rows.filter((r) => nhomCua(r) === k && (!tuKhoa || boDau(`${ma(r)} ${r.soPhong} ${r.hangMuc}`).includes(tuKhoa))).sort(sapXep)] as const)
  const dsPhang = nhomHienThi.flatMap(([, a]) => a)
  const chon = baoMoi ? null : mo ?? (hep ? null : dsPhang[0] ?? null)
  const href = (id: number | null, k: Loc) => `/su-co?${id ? `id=${id}&` : ''}${k === 'tat-ca' ? '' : `loc=${k}`}`.replace(/[?&]$/, '')
  const di = (to: string) => (e: MouseEvent) => { if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); dieuHuong(to) }

  const baoGiaCho = chon ? cho[chon.id] : undefined
  const idChonThuc = chon?.id ?? null
  const idToaChon = chon ? danhSachToa.find((b) => b.ten === chon.toaNha)?.id ?? toaNhaId : null
  const chonKetThuc = chon ? ['DA_DONG', 'DA_HUY'].includes(chon.trangThai) : false
  useEffect(() => {
    setDangHuy(false); setTuChoi(false); setLyDo('')
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
  const sauKhiGhi = async () => { await load(); setLanTai((n) => n + 1) }
  const chonThoId = chon ? workerIds[chon.id] : ''
  const choGiaoTho = chon?.trangThai === 'MOI_TIEP_NHAN' || chon?.trangThai === 'DA_TIEP_NHAN'
  const benChiu = chon ? costs[chon.id]?.benChiuChiPhi ?? chon.benChiuChiPhi ?? 'CHU_NHA' : 'CHU_NHA'
  // Thứ tự gọi như cũ: tiếp nhận (nếu mới báo) rồi phân công.
  const giaoTho = () => chon && action.run(async () => {
    if (chon.trangThai === 'MOI_TIEP_NHAN') await managementRequest(token, `/api/yeu-cau-sua-chua/${chon.id}/tiep-nhan`, 'POST')
    await managementRequest(token, `/api/yeu-cau-sua-chua/${chon.id}/phan-cong`, 'POST', { thoId: Number(chonThoId) })
    await sauKhiGhi()
  }, 'Đã giao thợ.')
  const duyet = (b: BaoGiaSuaChua) => chon && action.run(async () => {
    if (benChiu !== (chon.benChiuChiPhi ?? 'CHU_NHA')) await managementRequest(token, `/api/yeu-cau-sua-chua/${chon.id}/chi-phi`, 'PUT', { chiPhi: String(b.tongTien), benChiuChiPhi: benChiu })
    await duyetBaoGia(token, chon.id, b.id)
    await sauKhiGhi()
  }, 'Đã duyệt báo giá.')
  const tuChoiBg = (e: FormEvent, b: BaoGiaSuaChua) => { e.preventDefault(); if (chon) void action.run(async () => { await tuChoiBaoGia(token, chon.id, b.id, lyDo.trim()); setTuChoi(false); setLyDo(''); await sauKhiGhi() }, 'Đã từ chối báo giá, thợ sẽ chỉnh lại.') }
  const tho = chon?.nguoiXuLyId ? workers.find((w) => w.id === chon.nguoiXuLyId) : undefined

  const bieuMauTao = (
    <form className="sc-form" onSubmit={create} aria-label="Báo sự cố mới">
      {!toaNhaId && <><BuildingSelect buildings={danhSachToa} value={toaNhaId} onChange={building.setBuildingId} /><p className="sc-phu">Chọn một toà để chọn phòng báo sự cố.</p></>}
      <Field label="Phòng"><select className="select" required value={form.phongId} onChange={(e) => setForm({ ...form, phongId: e.target.value })}><option value="">Chọn phòng</option>{rooms.map((r) => <option key={r.id} value={r.id ?? ''}>Phòng {r.soPhong}</option>)}</select></Field>
      <Field label="Hạng mục"><input className="input" required value={form.hangMuc} onChange={(e) => setForm({ ...form, hangMuc: e.target.value })} /></Field>
      <Field label="Mức độ"><select className="select" value={form.mucDo} onChange={(e) => setForm({ ...form, mucDo: e.target.value })}><option value="THUONG">Bình thường</option><option value="GAP">Cao</option><option value="KHAN_CAP">Khẩn cấp</option></select></Field>
      <Field label="Mô tả sự cố"><textarea className="input" style={{ height: 'auto', minHeight: 88 }} required value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} /></Field>
      <Field label="Ảnh sự cố (tối đa 5 ảnh)"><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} /></Field>
      <ChanDinh><Button type="submit" variant="primary" blocked={action.busy} blockedReason={action.busy ? 'Đang gửi, vui lòng chờ.' : undefined}>Gửi yêu cầu sửa chữa</Button></ChanDinh>
    </form>
  )

  const buocNay = chon ? buocHienTai(chon, Boolean(baoGiaCho)) : 0
  const chiTiet = chon && (
    <section className="card sc-ct" aria-labelledby="su-co-ngan" data-repair-detail={chon.id}>
      <div className="sc-ct-dau">
        <div style={{ minWidth: 0 }}>
          <h2 id="su-co-ngan">{chon.hangMuc} · phòng {chon.soPhong}</h2>
          <p className="sc-phu">{chon.toaNha} · tầng {chon.tang} · báo ngày {dinhDangNgayIso(chon.taoLuc.slice(0, 10))} · {ma(chon)}</p>
        </div>
        <div className="sc-nhan">
          {chon.mucDo === 'KHAN_CAP' && !chonKetThuc && <StatusTag tone="urgent">Khẩn</StatusTag>}
          {baoGiaCho ? <StatusTag tone="waiting">Báo giá chờ duyệt</StatusTag> : <StatusTag tone={chon.trangThai === 'DA_DONG' ? 'done' : chon.trangThai === 'DA_HUY' ? 'closed' : 'neutral'}>{TT_SC[chon.trangThai] ?? chon.tenTrangThai}</StatusTag>}
        </div>
      </div>
      <p>{chon.moTa}</p>
      {chon.trangThai === 'DA_HUY'
        ? <p style={{ color: 'var(--ma-urgent)' }}>Đã huỷ{chon.lyDoHuy ? `: ${chon.lyDoHuy}` : '.'}</p>
        : <ThanhBuoc nhan="Tiến độ" buoc={BUOC.map((ten, i) => ({ ten, trangThai: i + 1 < buocNay ? 'xong' : i + 1 === buocNay ? 'nay' : 'cho' }))} />}

      {baoGiaCho && (
        <div className="sc-khoi">
          <h3>Báo giá của thợ {tho?.hoTen ?? (chon.nguoiXuLyId ? `#${chon.nguoiXuLyId}` : '')}</h3>
          {baoGiaCho.moTa && <p className="sc-phu">{baoGiaCho.moTa}</p>}
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Hạng mục</th><th className="num">SL</th><th className="num">Đơn giá</th><th className="num">Thành tiền</th></tr></thead>
            <tbody>{baoGiaCho.dongBaoGia.map((d, i) => <tr key={i}><td>{d.tenHangMuc}</td><td className="num">{d.soLuong}</td><td className="num">{tien(d.donGia)}</td><td className="num">{tien(d.thanhTien)}</td></tr>)}</tbody>
            <tfoot><HangTong o={['Tổng báo giá', '', '', tien(baoGiaCho.tongTien)]} canhPhai={[3]} /></tfoot>
          </table></div>
          <Field label="Ai chịu chi phí"><select className="select" value={benChiu} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: costs[chon.id]?.chiPhi ?? String(chon.chiPhi ?? ''), benChiuChiPhi: e.target.value } })}><option value="CHU_NHA">Chủ nhà (hao mòn tự nhiên)</option><option value="NGUOI_THUE">Người thuê (làm hỏng)</option></select></Field>
          {tuChoi && (
            <form className="sc-hang" onSubmit={(e) => tuChoiBg(e, baoGiaCho)}>
              <Field label="Lý do từ chối (thợ thấy lý do này để chỉnh báo giá)"><input className="input" required value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Field>
              <Button type="submit" variant="danger" blocked={action.busy || !lyDo.trim()}>Xác nhận từ chối</Button>
              <Button variant="text" onClick={() => setTuChoi(false)}>Không từ chối</Button>
            </form>
          )}
        </div>
      )}

      {choGiaoTho && !baoGiaCho && (
        <div className="sc-khoi">
          <Field label="Giao cho thợ"><select className="select" value={chonThoId ?? ''} onChange={(e) => setWorkerIds({ ...workerIds, [chon.id]: e.target.value })}><option value="">Chọn thợ</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.hoTen} · {dinhDangSdt(w.soDienThoai)}</option>)}</select></Field>
          <p className="sc-phu">Thợ nhận tin ngay trên điện thoại.</p>
        </div>
      )}

      <dl className="kv">
        <dt>Người thuê liên hệ</dt><dd>{chon.soDienThoaiLienHe ? <a href={`tel:${chon.soDienThoaiLienHe}`}>{dinhDangSdt(chon.soDienThoaiLienHe)}</a> : 'Chưa có'}</dd>
        <dt>Thợ</dt><dd>{chon.nguoiXuLyId ? <>{tho?.hoTen ?? `Thợ #${chon.nguoiXuLyId}`}{tho?.soDienThoai && <> · <a href={`tel:${tho.soDienThoai}`}>{dinhDangSdt(tho.soDienThoai)}</a></>}</> : 'Chưa giao'}</dd>
        <dt>Chi phí</dt><dd>{chon.chiPhi != null ? tien(chon.chiPhi) : baoGiaCho ? `${tien(baoGiaCho.tongTien)} (chờ duyệt)` : 'Chưa có báo giá'}</dd>
        {!!chon.anh?.length && <><dt>Ảnh</dt><dd><span className="sc-hang">{chon.anh.map((p) => photoUrls[p.id]
          ? <img key={p.id} src={photoUrls[p.id]} alt={`Ảnh sự cố ${chon.id}`} style={{ maxWidth: 200, maxHeight: 160, objectFit: 'contain', borderRadius: 'var(--ma-radius-md)' }} />
          : <Button key={p.id} variant="secondary" size="sm" onClick={() => void action.run(async () => setPhotoUrls({ ...photoUrls, [p.id]: await fetchLienKetAnh(token, p.id) }), 'Đã mở ảnh sự cố.')}><Icon name="camera" />Xem ảnh #{p.id}</Button>)}</span></dd></>}
      </dl>

      {chonKetThuc && (
        <div className="sc-khoi">
          <h3>Lịch sử</h3>
          <ul className="sc-ls">
            {[['Báo sự cố', chon.taoLuc], ['Tiếp nhận', chon.tiepNhanLuc], ['Giao thợ', chon.phanCongLuc], ['Chờ nghiệm thu', chon.choXacNhanLuc]].filter(([, t]) => t).map(([n, t]) => (
              <li key={n}><span>{n}</span><span>{dinhDangNgayIso((t as string).slice(0, 10))}</span></li>
            ))}
          </ul>
        </div>
      )}

      {!chonKetThuc && !baoGiaCho && (
        <form className="sc-hang" onSubmit={(e) => { e.preventDefault(); void command(chon.id, 'chi-phi', costs[chon.id] ?? { chiPhi: String(chon.chiPhi ?? 0), benChiuChiPhi: chon.benChiuChiPhi ?? 'CHU_NHA' }, 'PUT') }}>
          <Field label="Chi phí sửa chữa (đồng)"><input className="input" type="number" min="0" step="0.01" required value={costs[chon.id]?.chiPhi ?? chon.chiPhi ?? ''} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: e.target.value, benChiuChiPhi: benChiu } })} /></Field>
          <Field label="Bên chịu chi phí"><select className="select" value={benChiu} onChange={(e) => setCosts({ ...costs, [chon.id]: { chiPhi: costs[chon.id]?.chiPhi ?? String(chon.chiPhi ?? ''), benChiuChiPhi: e.target.value } })}><option value="CHU_NHA">Chủ nhà</option><option value="NGUOI_THUE">Người thuê</option></select></Field>
          <Button type="submit" variant="secondary" blocked={action.busy}>Lưu chi phí</Button>
        </form>
      )}
      {dangHuy && !chonKetThuc && (
        <form className="sc-hang" onSubmit={(e) => { e.preventDefault(); void command(chon.id, 'huy', { lyDo }) }}>
          <Field label="Lý do huỷ yêu cầu"><input className="input" required value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Field>
          <Button type="submit" variant="danger" blocked={action.busy}>Xác nhận huỷ</Button>
        </form>
      )}

      {/* Báo giá đã duyệt/bị thay + thanh toán thợ; phần chờ duyệt nằm ở trên để nút Duyệt ở chân thẻ. */}
      {(CO_THE_CO_BAO_GIA.includes(chon.trangThai) || chonKetThuc) && (
        <QuanLyBaoGiaVaThanhToan key={`${chon.id}-${lanTai}`} token={token} yeuCauId={chon.id} anChoDuyet />
      )}

      {!chonKetThuc && (
        <ChanDinh>
          {!dangHuy && <Button variant="secondary" onClick={() => { setDangHuy(true); setTuChoi(false); setLyDo('') }}>Huỷ yêu cầu…</Button>}
          {baoGiaCho && <Button variant="danger" onClick={() => { setTuChoi(true); setDangHuy(false); setLyDo('') }}>Từ chối…</Button>}
          {baoGiaCho && <Button variant="primary" blocked={action.busy} onClick={() => void duyet(baoGiaCho)}>Duyệt {tien(baoGiaCho.tongTien)}</Button>}
          {choGiaoTho && !baoGiaCho && <Button variant="primary" blocked={action.busy || !chonThoId} blockedReason={chonThoId ? undefined : 'Chọn thợ trước khi giao.'} onClick={() => void giaoTho()}>Giao thợ</Button>}
          {chon.trangThai === 'CHO_XAC_NHAN' && !baoGiaCho && <Button variant="primary" blocked={action.busy} onClick={() => void command(chon.id, 'xac-nhan-dong')}>Nghiệm thu</Button>}
        </ChanDinh>
      )}
    </section>
  )

  const moChiTiet = hep && (baoMoi || idChon !== null)
  const danhSach = (
    <section className="card flush sc-ds" aria-label="Danh sách sự cố">
      <div className="toolbar">
        {([['tat-ca', 'Tất cả'], ['mo', 'Đang mở'], ['xong', 'Đã xong']] as const).map(([k, ten]) => (
          <a key={k} className="chip" href={href(null, k)} aria-pressed={loc === k} onClick={di(href(null, k))}>{ten} <span className="n">{dem(k)}</span></a>
        ))}
        <span className="push" />
        <label className="input-wrap"><span className="sr-only">Tìm sự cố</span><Icon name="search" /><input className="input" type="search" placeholder="Tìm phòng, hạng mục" value={tim} onChange={(e) => setTim(e.target.value)} /></label>
      </div>
      {dsPhang.length === 0 ? <div style={{ padding: '0 24px 16px' }}><EmptyState title={rows.length === 0 ? 'Chưa có sự cố nào.' : 'Không có sự cố ở nhóm này.'} body={rows.length === 0 ? 'Khi người thuê báo hỏng, sự cố sẽ hiện ở đây.' : 'Đổi nhóm hoặc xoá ô tìm để xem thêm.'} /></div> : (
        <div>
          {nhomHienThi.map(([k, a]) => a.length > 0 && (
            <div key={k} data-nhom={k}>
              <div className="sc-nhom"><span>{TEN_NHOM[k]}</span><span>{a.length}</span></div>
              {a.map((r) => (
                <a key={r.id} className={`irow${r.id === chon?.id ? ' sel' : ''}`} href={href(r.id, loc)} aria-current={r.id === chon?.id ? 'true' : undefined} data-repair-row={r.id} onClick={di(href(r.id, loc))}>
                  <div className="body"><div className="t">{r.hangMuc} · phòng {r.soPhong}</div><div className="s">{toaNhaId ? '' : `${r.toaNha} · `}{cho[r.id] ? `báo giá ${tien(cho[r.id].tongTien)} chờ duyệt` : (TT_SC[r.trangThai] ?? r.tenTrangThai).toLowerCase()}</div></div>
                  {r.mucDo === 'KHAN_CAP' && k !== 'xong' ? <StatusTag tone="urgent">Khẩn</StatusTag> : cho[r.id] ? <StatusTag tone="waiting">Chờ duyệt</StatusTag> : null}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <section data-testid="su-co-quan-ly" className="sc-trang">
      <DauTrang
        tieuDe="Sự cố"
        phu={`${toaNhaId ? danhSachToa.find((b) => b.id === toaNhaId)?.ten ?? '' : `Tất cả ${danhSachToa.length} toà`} · ${dem('can')} việc cần quyết · ${dem('dang')} thợ đang làm`}
        hanhDong={laQuanLy ? <Button variant="secondary" onClick={() => dieuHuong('/su-co?baoMoi=1')}><Icon name="plus" />Ghi sự cố mới</Button> : undefined}
      />
      <Feedback error={action.error ?? building.error} success={action.success} />

      {dangTai ? <EmptyState kind="loading" title="Đang tải sự cố" />
        : idsToa.length === 0 ? <EmptyState title="Chưa có toà nào để xem sự cố." />
          : (
            <div className="sc-luoi">
              {!moChiTiet && danhSach}
              {(baoMoi || chon) && (!hep || moChiTiet) && (
                <div className="sc-phai">
                  {hep && <a className="sc-lui" href={href(null, loc)} onClick={di(href(null, loc))}>← Tất cả sự cố</a>}
                  {chon ? chiTiet : (
                    <section className="card sc-ct" aria-labelledby="su-co-ngan">
                      <div className="sc-ct-dau"><h2 id="su-co-ngan">Ghi sự cố mới</h2></div>
                      {bieuMauTao}
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
    </section>
  )
}
