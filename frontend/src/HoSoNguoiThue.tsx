import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { managementRequest, type Tenant } from './managementApi'
import { Feedback, useAction } from './ManagementShared'
import { CSS_BANG_QUAN_TRI, chuCaiDau } from './bangQuanTriChung'
import { Button } from './design/core/Button'
import { fetchCongNoBaoCao, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchLienKetAnh, type ThongTinHopDong } from './api'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import './HoSoNguoiPhong.css'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import { DauTrang } from './design/layout/DauTrang'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { dinhDangSdt } from './tienTheoNguoi'
import { nhomNo, tuCongNo, tuHoaDonQuanLy, type DongNo } from './nhomNoTheoNguoi'
import { today, useBuildings } from './ManagementShared'

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

type Dong = Tenant & { phong?: string; toa?: string; hdId?: number; denNgay?: string; conNgay?: number; no: number | null }
type Nguon<T> = { du: T | null; loi: boolean }
const HAN_SAP = 30
const TIM_CHIP = { 'tat-ca': () => true, 'con-no': (r: Dong) => (r.no ?? 0) > 0, 'sap-het': (r: Dong) => r.conNgay !== undefined && r.conNgay <= HAN_SAP }
const nhomThuTu = (r: Dong) => ((r.no ?? 0) > 0 ? 0 : TIM_CHIP['sap-het'](r) ? 1 : 2)
const tongTien = (n: number) => `${dinhDangTien(n)} ₫`

/** Danh sách người thuê: dòng đầu trang nói việc kế tiếp (nợ, hợp đồng sắp hết); bấm một hàng mở hồ sơ 360°. Nợ và hợp đồng tải riêng: nguồn nào lỗi chỉ ảnh hưởng cột của nó. */
export default function HoSoNguoiThue({ token, vaiTro = 'CHU', dieuHuong = dieuHuongMacDinh }: { token: string; vaiTro?: string; mobile?: boolean; dieuHuong?: (href: string) => void }) {
  const [rows, setRows] = useState<Tenant[]>([])
  const [query, setQuery] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [dangThem, setDangThem] = useState(false)
  const [lanTai, setLanTai] = useState(0)
  const [chipMo, setChipMo] = useState<{ khoa: string; n: number } | undefined>() // n đổi mỗi lần bấm → DataTable dựng lại với chip bật sẵn
  const [hopDong, setHopDong] = useState<Nguon<(ThongTinHopDong & { toa: string })[]>>({ du: null, loi: false })
  const [no, setNo] = useState<Nguon<DongNo[]>>({ du: null, loi: false })
  const action = useAction()
  const { buildings, buildingId } = useBuildings(token)
  const toaDung = useMemo(() => (buildingId ? buildings.filter((b) => b.id === buildingId) : buildings), [buildings, buildingId])
  const khoaToa = toaDung.map((b) => b.id).join(',')

  useEffect(() => {
    let active = true
    setDangTai(true)
    managementRequest<Tenant[]>(token, `/api/nguoi-thue?q=${encodeURIComponent(query)}`)
      .then((data) => { if (active) { setRows(data); action.setError(null) } })
      .catch((e: Error) => { if (active) action.setError(e.message) })
      .finally(() => { if (active) setDangTai(false) })
    return () => { active = false }
  }, [query, token, lanTai])

  useEffect(() => {
    if (toaDung.length === 0) return undefined
    let active = true
    const homNay = today()
    const hd = Promise.all(toaDung.map(async (t) => (await fetchHopDongQuanLy(token, t.id)).map((h) => ({ ...h, toa: t.ten }))))
    hd.then((l) => { if (active) setHopDong({ du: l.flat(), loi: false }) }).catch(() => { if (active) setHopDong({ du: null, loi: true }) })
    // Quản lý bị 403 ở /api/bao-cao/cong-no: dựng nợ từ hoá đơn của toà (cần hợp đồng để biết người thuê).
    const congNo = vaiTro === 'CHU'
      ? fetchCongNoBaoCao(token, buildingId).then((r) => tuCongNo(r.congNo))
      : Promise.all(toaDung.map(async (t) => tuHoaDonQuanLy(await fetchHoaDonQuanLy(token, t.id), t, homNay, (await hd).flat()))).then((l) => l.flat())
    congNo.then((l) => { if (active) setNo({ du: l, loi: false }) }).catch(() => { if (active) setNo({ du: null, loi: true }) })
    return () => { active = false }
  }, [token, vaiTro, buildingId, khoaToa, lanTai])

  const dong = useMemo<Dong[]>(() => {
    const noTheoNguoi = new Map(nhomNo(no.du ?? []).filter((g) => g.nguoiThueId !== null).map((g) => [g.nguoiThueId as number, g.conLai]))
    return rows.map((r) => {
      const h = (hopDong.du ?? []).filter((x) => x.nguoiThueId === r.id).sort((a, b) => Number(b.trangThai === 'HIEU_LUC') - Number(a.trangThai === 'HIEU_LUC'))[0]
      const hieuLuc = h?.trangThai === 'HIEU_LUC'
      return { ...r, phong: h?.soPhong, toa: h?.toa, hdId: h?.id, denNgay: hieuLuc ? h.ngayKetThuc : undefined, conNgay: hieuLuc ? h.soNgayConLai : undefined, no: no.du ? (noTheoNguoi.get(r.id) ?? 0) : null }
    }).sort((a, b) => nhomThuTu(a) - nhomThuTu(b) || (nhomThuTu(a) === 0 ? (b.no ?? 0) - (a.no ?? 0) : nhomThuTu(a) === 1 ? (a.conNgay ?? 0) - (b.conNgay ?? 0) : 0) || (a.phong ?? '').localeCompare(b.phong ?? '', 'vi', { numeric: true }))
  }, [rows, hopDong.du, no.du])

  const nguoiNo = dong.filter(TIM_CHIP['con-no'])
  const tongNo = nguoiNo.reduce((t, r) => t + (r.no ?? 0), 0)
  const sapHet = dong.filter(TIM_CHIP['sap-het'])
  const dangThue = hopDong.du ? dong.filter((r) => r.conNgay !== undefined).length : rows.length
  const nutChip = (khoa: string, nhan: string) => <button type="button" className="nt-phu-nut" onClick={() => setChipMo({ khoa, n: (chipMo?.n ?? 0) + 1 })}>{nhan}</button>
  const toaNhan = buildingId ? toaDung[0]?.ten : buildings.length > 1 ? 'Tất cả toà' : buildings[0]?.ten
  const phu = (
    <>
      {[toaNhan, `${dangThue} người đang thuê`].filter(Boolean).join(' · ')}
      {nguoiNo.length > 0 ? <> · {nutChip('con-no', `${nguoiNo.length} người còn nợ ${tongTien(tongNo)}`)}</> : null}
      {sapHet.length > 0 ? <> · {nutChip('sap-het', `${sapHet.length} hợp đồng hết hạn trong ${HAN_SAP} ngày`)}</> : null}
    </>
  )

  const moHoSo = (id: number) => dieuHuong(`/nguoi-thue/${id}`)
  // Bấm vào chỗ trống của hàng cũng mở hồ sơ; bấm vào liên kết/nút thì để chính nó xử lý, khỏi điều hướng hai lần.
  const bamHang = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as Element
    const hang = target.closest('tr[data-tenant-row]')
    if (hang && !target.closest('a,button,input')) moHoSo(Number(hang.getAttribute('data-tenant-row')))
  }
  const muted = (t: string) => <span style={{ color: 'var(--ma-text-secondary)' }}>{t}</span>

  const cot: DataTableColumn<Dong>[] = [
    { key: 'nguoi', label: 'Người thuê', sortable: true, sortValue: (r) => r.hoTen, render: (r) => <a className="nt-ten" href={`/nguoi-thue/${r.id}`}><span className={`avatar sm h${(r.id % 5) + 1}`} aria-hidden="true">{chuCaiDau(r.hoTen)}</span>{r.hoTen}</a> },
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (r) => r.phong, render: (r) => (hopDong.loi ? '—' : r.phong ? <>{r.phong}{buildingId === null && buildings.length > 1 && r.toa ? <span className="nt-phu">{r.toa}</span> : null}</> : muted('Chưa thuê')) },
    { key: 'sdt', label: 'Điện thoại', render: (r) => dinhDangSdt(r.soDienThoai) },
    { key: 'den', label: 'Thuê đến', sortable: true, sortValue: (r) => r.denNgay, render: (r) => (hopDong.loi ? '—' : r.denNgay ? <>{dinhDangNgayIso(r.denNgay)}{r.conNgay !== undefined && r.conNgay <= HAN_SAP ? <span className="nt-phu nt-cho">còn {r.conNgay} ngày</span> : null}</> : '—') },
    { key: 'no', label: 'Còn nợ', align: 'num', sortable: true, sortValue: (r) => r.no, render: (r) => (r.no === null ? '—' : r.no > 0 ? <b className="nt-no">{tongTien(r.no)}</b> : muted('Không nợ')) },
    { key: 'act', label: 'Việc cần làm', the: 'hanh-dong', render: (r) => ((r.no ?? 0) > 0 ? <a className="btn btn-secondary btn-sm" href={`/thu-tien?nguoiThueId=${r.id}`}>Ghi thu</a> : TIM_CHIP['sap-het'](r) && r.hdId ? <a className="btn btn-secondary btn-sm" href={`/hop-dong/${r.hdId}`}>Gia hạn</a> : null) },
  ]
  const chips = [{ key: 'tat-ca', label: 'Tất cả', match: TIM_CHIP['tat-ca'] }, { key: 'con-no', label: 'Còn nợ', match: TIM_CHIP['con-no'] }, { key: 'sap-het', label: `Sắp hết hạn (≤ ${HAN_SAP} ngày)`, match: TIM_CHIP['sap-het'] }]
  const loiNguon = [no.loi ? 'công nợ' : null, hopDong.loi ? 'hợp đồng' : null].filter(Boolean)

  return (
    <section style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <style>{CSS_NGUOI_THUE}</style>
      <DauTrang tieuDe="Người thuê" phu={phu} hanhDong={<a className="btn btn-secondary" href="/hop-dong/moi">Thêm người thuê</a>} />

      <Feedback error={action.error} success={null} />
      {loiNguon.length ? <p className="banner banner-info" role="status"><Icon name="info" />Chưa tải được {loiNguon.join(', ')}; các cột đó hiện “—”. Danh sách vẫn đúng. <button type="button" className="nt-phu-nut" onClick={() => setLanTai((n) => n + 1)}>Tải lại</button></p> : null}

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
            <DataTable key={chipMo?.n ?? 0} rows={dong} columns={cot} getRowId={(r) => r.id} chips={chips} defaultChip={chipMo?.khoa} noun="hồ sơ" pageSize={20} rowProps={(r) => ({ 'data-tenant-row': String(r.id), className: 'nt-hang' })} />
          </div>
        )}
      </Card>

      {dangThem ? <NganFormNguoiThue token={token} id={null} onSaved={() => setLanTai((n) => n + 1)} onClose={() => setDangThem(false)} /> : null}
    </section>
  )
}
