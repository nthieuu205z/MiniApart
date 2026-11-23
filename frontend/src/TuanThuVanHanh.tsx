import { useEffect, useState } from 'react'
import { downloadManagementFile, managementRequest } from './managementApi'
import { Feedback, today, useAction, useBuildings } from './ManagementShared'
import { CSS_BANG_QUAN_TRI, NguoiCoAvatar } from './bangQuanTriChung'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import type { ThongTinToaNha } from './api'

type Equipment = { id: number; ten: string; viTri: string; hanKiemDinh: string }
type InspectionItem = { ten: string; dat: boolean; ghiChu: string }
type Document = { id: number; phanLoai: string; ten: string; tenTep: string; taoLuc: string }
type Inspection = { id: number; ngayKiemTra: string; hangMuc: InspectionItem[]; dat: boolean }
type Safety = { chuKyThang: number; ngayKiemTraTiep: string; soViecDenHan: number; hoSo: Document[]; thietBi: Equipment[]; kiemTra: Inspection[] }

const CSS_TUAN_THU = `${CSS_BANG_QUAN_TRI}
.tt-luoi { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; align-items: end; }
.tt-form { display: grid; gap: 12px; margin-top: 16px; }
.tt-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; max-width: 40ch; }
.tt-doi { display: grid; gap: 4px; min-width: 22ch; }
.tt-luoi-loc { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; align-items: end; }
.tt-hang-muc { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.tt-hang-muc li { display: flex; gap: 8px; align-items: flex-start; }
.tt-hang-muc .ic-sm { flex: none; margin-top: 3px; }
.tt-ok { color: var(--ma-done-text); } .tt-loi { color: var(--ma-urgent); }`

/** Chọn toà ở đầu trang (dùng chung An toàn + Cư trú). */
function ChonToa({ buildings, value, onChange }: { buildings: ThongTinToaNha[]; value: number | null; onChange: (id: number | null) => void }) {
  return <>
    <label className="sr-only" htmlFor="tt-chon-toa">Toà nhà</label>
    <select id="tt-chon-toa" className="select" style={{ width: 220 }} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Chọn toà nhà</option>
      {buildings.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}
    </select>
  </>
}

function soNgayTu(ngay: string): number {
  return Math.round((new Date(`${ngay}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
}

export function AnToanVanHanh({ token, vaiTro }: { token: string; vaiTro: string }) {
  const building = useBuildings(token, true), action = useAction()
  const [data, setData] = useState<Safety | null>(null)
  const [document, setDocument] = useState({ phanLoai: 'THONG_TIN_CO_SO', ten: '' })
  const [file, setFile] = useState<File | null>(null)
  const [equipment, setEquipment] = useState({ ten: '', viTri: '', hanKiemDinh: '' })
  const [equipmentId, setEquipmentId] = useState<number | null>(null)
  const [schedule, setSchedule] = useState({ chuKyThang: '6', ngayKiemTraTiep: '' })
  const [date, setDate] = useState(today())
  const [items, setItems] = useState<InspectionItem[]>([{ ten: 'Lối thoát nạn thông thoáng', dat: true, ghiChu: '' }, { ten: 'Bình chữa cháy còn hạn và sẵn sàng', dat: true, ghiChu: '' }])
  const editable = vaiTro === 'CHU'
  const base = `/api/toa-nha/${building.buildingId}/pccc`
  async function load() {
    if (!building.buildingId) return
    const result = await managementRequest<Safety>(token, base)
    setData(result)
    setSchedule({ chuKyThang: String(result.chuKyThang), ngayKiemTraTiep: result.ngayKiemTraTiep ?? '' })
  }
  useEffect(() => { setData(null); if (building.buildingId) void action.run(load, 'Đã tải hồ sơ an toàn.') }, [building.buildingId, token])

  const cotHoSo: DataTableColumn<Document>[] = [
    { key: 'ten', label: 'Hồ sơ', render: (d) => <span className="td-main">{d.ten}</span> },
    { key: 'loai', label: 'Phân loại', render: (d) => <span className="bq-tag-vai">{documentCategory(d.phanLoai)}</span> },
    { key: 'tep', label: 'Tệp', align: 'num', the: 'hanh-dong', render: (d) => <div className="td-acts"><Button variant="text" size="sm" onClick={() => void action.run(() => downloadManagementFile(token, `${base}/ho-so/${d.id}/tep`, d.tenTep), 'Đã tải hồ sơ.')}><Icon name="download" />Tải {d.tenTep}</Button></div> },
  ]
  const cotThietBi: DataTableColumn<Equipment>[] = [
    { key: 'ten', label: 'Thiết bị', sortable: true, sortValue: (d) => d.ten, render: (d) => <span className="td-main">{d.ten}</span> },
    { key: 'viTri', label: 'Vị trí', render: (d) => d.viTri },
    {
      key: 'han', label: 'Hạn kiểm định', sortable: true, sortValue: (d) => d.hanKiemDinh,
      render: (d) => {
        const con = soNgayTu(d.hanKiemDinh)
        return <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{d.hanKiemDinh}{con < 0 ? <StatusTag tone="urgent">Quá hạn kiểm định</StatusTag> : con <= 30 ? <StatusTag tone="waiting">Còn {con} ngày</StatusTag> : null}</span>
      },
    },
    ...(editable ? [{ key: 'sua', label: 'Thao tác', align: 'num' as const, the: 'hanh-dong' as const, render: (d: Equipment) => <div className="td-acts"><Button variant="text" size="sm" onClick={() => { setEquipmentId(d.id); setEquipment({ ten: d.ten, viTri: d.viTri, hanKiemDinh: d.hanKiemDinh }) }}>Sửa thiết bị</Button></div> }] : []),
  ]
  const cotKiemTra: DataTableColumn<Inspection>[] = [
    { key: 'ngay', label: 'Ngày kiểm tra', sortable: true, sortValue: (r) => r.ngayKiemTra, render: (r) => <span className="td-main">{r.ngayKiemTra}</span> },
    { key: 'kq', label: 'Kết quả', render: (r) => r.dat ? <StatusTag tone="done">Đạt</StatusTag> : <StatusTag tone="urgent">Có hạng mục chưa đạt</StatusTag> },
    {
      key: 'hm', label: 'Hạng mục',
      render: (r) => <ul className="tt-hang-muc">{r.hangMuc.map((i, index) => <li key={index} className={i.dat ? 'tt-ok' : 'tt-loi'}><Icon name={i.dat ? 'check' : 'alert'} size="sm" /><span style={{ color: 'var(--ma-text-primary)' }}>{i.ten}{i.ghiChu ? ` · ${i.ghiChu}` : ''}</span></li>)}</ul>,
    },
  ]

  return <section style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <style>{CSS_TUAN_THU}</style>
    <header className="topbar">
      <div className="title-block">
        <h1 className="h1">An toàn và phòng cháy chữa cháy</h1>
        <p className="sub" role="status">{data ? `${data.soViecDenHan} việc đến hạn · Kỳ kiểm tra tiếp: ${data.ngayKiemTraTiep ?? 'Chưa đặt lịch'}` : 'Chọn toà nhà để xem hồ sơ an toàn.'}</p>
      </div>
      <div className="topbar-actions"><ChonToa buildings={building.buildings} value={building.buildingId} onChange={building.setBuildingId} /></div>
    </header>
    <Feedback error={action.error ?? building.error} success={action.success} />
    {data ? <>
      <Card title="Hồ sơ PCCC">
        {data.hoSo.length === 0 ? <EmptyState title="Chưa có hồ sơ PCCC." /> : <DataTable rows={data.hoSo} columns={cotHoSo} getRowId={(d) => d.id} noun="hồ sơ" />}
        {editable ? <form className="tt-form" onSubmit={(e) => { e.preventDefault(); if (!file) return; void action.run(async () => { const body = new FormData(); body.set('phanLoai', document.phanLoai); body.set('ten', document.ten); body.set('tep', file); await managementRequest(token, `${base}/ho-so`, 'POST', body); setFile(null); setDocument({ ...document, ten: '' }); await load() }) }}>
          <div className="tt-luoi">
            <Field label="Phân loại hồ sơ"><select className="select" value={document.phanLoai} onChange={(e) => setDocument({ ...document, phanLoai: e.target.value })}>{['THONG_TIN_CO_SO', 'PHUONG_AN_THOAT_NAN', 'BIEN_BAN_KIEM_TRA', 'THIET_BI', 'BAO_HIEM'].map((v) => <option key={v} value={v}>{documentCategory(v)}</option>)}</select></Field>
            <Field label="Tên hồ sơ"><input className="input" required value={document.ten} onChange={(e) => setDocument({ ...document, ten: e.target.value })} /></Field>
            <Field label="Tệp hồ sơ"><input className="input" type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
          </div>
          <div><Button variant="secondary" type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined}>Lưu hồ sơ PCCC</Button></div>
        </form> : null}
      </Card>

      <Card title="Thiết bị và hạn kiểm định">
        {data.thietBi.length === 0 ? <EmptyState title="Chưa có thiết bị nào." /> : <DataTable rows={data.thietBi} columns={cotThietBi} getRowId={(d) => d.id} noun="thiết bị" />}
        {editable ? <form className="tt-form" onSubmit={(e) => { e.preventDefault(); void action.run(async () => { await managementRequest(token, `${base}/thiet-bi${equipmentId ? `/${equipmentId}` : ''}`, equipmentId ? 'PUT' : 'POST', equipment); setEquipmentId(null); setEquipment({ ten: '', viTri: '', hanKiemDinh: '' }); await load() }) }}>
          <div className="tt-luoi">
            {(['ten', 'viTri', 'hanKiemDinh'] as const).map((k) => <Field key={k} label={{ ten: 'Tên thiết bị', viTri: 'Vị trí', hanKiemDinh: 'Hạn kiểm định' }[k]}><input className="input" required type={k === 'hanKiemDinh' ? 'date' : 'text'} value={equipment[k]} onChange={(e) => setEquipment({ ...equipment, [k]: e.target.value })} /></Field>)}
          </div>
          <div><Button variant="secondary" type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined}>{equipmentId ? 'Cập nhật thiết bị' : 'Thêm thiết bị'}</Button></div>
        </form> : null}
      </Card>

      <Card title="Kiểm tra an toàn định kỳ">
        {data.kiemTra.length === 0 ? <EmptyState title="Chưa có lần kiểm tra nào." /> : <DataTable rows={data.kiemTra} columns={cotKiemTra} getRowId={(r) => r.id} noun="lần kiểm tra" />}
        {editable ? <>
          <form className="tt-form" onSubmit={(e) => { e.preventDefault(); void action.run(async () => { await managementRequest(token, `${base}/lich-kiem-tra`, 'PUT', { chuKyThang: Number(schedule.chuKyThang), ngayKiemTraTiep: schedule.ngayKiemTraTiep }); await load() }, 'Đã cập nhật lịch kiểm tra.') }}>
            <div className="tt-luoi">
              <Field label="Chu kỳ kiểm tra (tháng)"><input className="input" required type="number" min="1" max="60" value={schedule.chuKyThang} onChange={(e) => setSchedule({ ...schedule, chuKyThang: e.target.value })} /></Field>
              <Field label="Ngày kiểm tra tiếp"><input className="input" required type="date" value={schedule.ngayKiemTraTiep} onChange={(e) => setSchedule({ ...schedule, ngayKiemTraTiep: e.target.value })} /></Field>
            </div>
            <div><Button variant="secondary" type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined}>Lưu lịch kiểm tra</Button></div>
          </form>
          <form className="tt-form card-sunken" onSubmit={(e) => { e.preventDefault(); void action.run(async () => { await managementRequest(token, `${base}/kiem-tra`, 'POST', { ngayKiemTra: date, hangMuc: items }); await load() }, 'Đã ghi nhận kết quả kiểm tra.') }}>
            <h3 className="h3">Ghi nhận lần kiểm tra mới</h3>
            <div className="tt-luoi"><Field label="Ngày kiểm tra"><input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
            {items.map((i, index) => <div key={index} className="tt-luoi">
              <Field label="Hạng mục"><input className="input" required value={i.ten} onChange={(e) => setItems(items.map((r, j) => j === index ? { ...r, ten: e.target.value } : r))} /></Field>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={i.dat} onChange={(e) => setItems(items.map((r, j) => j === index ? { ...r, dat: e.target.checked } : r))} /> Đạt yêu cầu</label>
              <Field label="Ghi chú"><input className="input" value={i.ghiChu} onChange={(e) => setItems(items.map((r, j) => j === index ? { ...r, ghiChu: e.target.value } : r))} /></Field>
            </div>)}
            <div className="row-wrap">
              <Button variant="secondary" onClick={() => setItems([...items, { ten: '', dat: true, ghiChu: '' }])}><Icon name="plus" />Thêm hạng mục</Button>
              <Button type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined}>Ghi kết quả kiểm tra</Button>
            </div>
          </form>
        </> : null}
      </Card>
    </> : null}
  </section>
}
function documentCategory(v: string) { return ({ THONG_TIN_CO_SO: 'Thông tin cơ sở', PHUONG_AN_THOAT_NAN: 'Phương án thoát nạn', BIEN_BAN_KIEM_TRA: 'Biên bản kiểm tra', THIET_BI: 'Thiết bị', BAO_HIEM: 'Bảo hiểm' } as Record<string, string>)[v] ?? v }

type Residency = { nguoiThueId: number; phongId: number; soPhong: string; hoTen: string; ngaySinh: string; soDienThoai: string; soGiayToChe: string; trangThaiLuuTru: string; ngayKhaiBao: string | null; ngayVaoO: string; canhBaoQuaHan: boolean }
export function CuTruVanHanh({ token }: { token: string }) {
  const building = useBuildings(token, true), action = useAction()
  const [rows, setRows] = useState<Residency[]>([])
  const [dangTai, setDangTai] = useState(false)
  const [changes, setChanges] = useState<Record<number, { trangThaiLuuTru: string; ngayKhaiBao: string }>>({})
  const base = `/api/toa-nha/${building.buildingId}/cu-tru`
  async function load() { if (building.buildingId) setRows(await managementRequest(token, base)) }
  useEffect(() => { setRows([]); setChanges({}); if (building.buildingId) { setDangTai(true); void action.run(load, 'Đã tải danh sách cư trú.').finally(() => setDangTai(false)) } }, [building.buildingId, token])
  const giaTri = (r: Residency) => changes[r.nguoiThueId] ?? { trangThaiLuuTru: r.trangThaiLuuTru, ngayKhaiBao: r.ngayKhaiBao ?? '' }
  const capNhat = (r: Residency) => {
    const value = giaTri(r)
    const daKhaiBao = value.trangThaiLuuTru !== 'CHUA_KHAI_BAO'
    if (daKhaiBao && !value.ngayKhaiBao) { action.setError('Nhập ngày khai báo cho người đã khai báo lưu trú.'); return }
    void action.run(async () => { await managementRequest(token, `${base}/${r.nguoiThueId}`, 'PUT', { ...value, ngayKhaiBao: daKhaiBao ? value.ngayKhaiBao : null }); await load() })
  }
  const cot: DataTableColumn<Residency>[] = [
    { key: 'nguoi', label: 'Người cư trú', sortable: true, sortValue: (r) => r.hoTen, render: (r) => <NguoiCoAvatar id={r.nguoiThueId} ten={r.hoTen} phu={`${r.soDienThoai} · ${r.soGiayToChe}`} /> },
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (r) => r.soPhong, render: (r) => <span className="td-main">{r.soPhong}</span> },
    { key: 'vao', label: 'Vào ở', sortable: true, sortValue: (r) => r.ngayVaoO, render: (r) => r.ngayVaoO },
    {
      key: 'tt', label: 'Trạng thái khai báo',
      render: (r) => {
        const v = giaTri(r)
        return <div style={{ display: 'grid', gap: 6 }}>
          <select className="select" aria-label={`Trạng thái khai báo của ${r.hoTen}`} style={{ minWidth: 190 }} value={v.trangThaiLuuTru} onChange={(e) => setChanges({ ...changes, [r.nguoiThueId]: { ...v, trangThaiLuuTru: e.target.value } })}>
            <option value="CHUA_KHAI_BAO">Chưa khai báo</option><option value="DA_THONG_BAO_LUU_TRU">Đã thông báo lưu trú</option><option value="DA_DANG_KY_TAM_TRU">Đã đăng ký tạm trú</option>
          </select>
          {r.canhBaoQuaHan ? <span role="status"><StatusTag tone="urgent">Đã quá hạn khai báo lưu trú</StatusTag></span> : null}
        </div>
      },
    },
    {
      key: 'ngay', label: 'Ngày khai báo',
      render: (r) => { const v = giaTri(r); return v.trangThaiLuuTru !== 'CHUA_KHAI_BAO' ? <input className="input" type="date" required aria-label={`Ngày khai báo của ${r.hoTen}`} max={today()} value={v.ngayKhaiBao} onChange={(e) => setChanges({ ...changes, [r.nguoiThueId]: { ...v, ngayKhaiBao: e.target.value } })} /> : <span style={{ color: 'var(--ma-text-muted)' }}>—</span> },
    },
    { key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong', render: (r) => <div className="td-acts"><Button variant="secondary" size="sm" blocked={action.busy} blockedReason={action.busy ? 'Đang lưu, vui lòng chờ.' : undefined} onClick={() => capNhat(r)}>Cập nhật lưu trú<span className="sr-only"> {r.hoTen}</span></Button></div> },
  ]
  const quaHan = rows.filter((r) => r.canhBaoQuaHan).length
  return <section style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <style>{CSS_TUAN_THU}</style>
    <header className="topbar">
      <div className="title-block">
        <h1 className="h1">Khai báo cư trú</h1>
        <p className="sub">{building.buildingId ? `${rows.length} người đang cư trú · ${quaHan} người quá hạn khai báo` : 'Chọn toà nhà để xem danh sách cư trú.'}</p>
      </div>
      <div className="topbar-actions">
        <ChonToa buildings={building.buildings} value={building.buildingId} onChange={building.setBuildingId} />
        <Button variant="secondary" blocked={!building.buildingId || action.busy} blockedReason={!building.buildingId ? 'Chọn toà nhà trước.' : 'Đang xử lý, vui lòng chờ.'} onClick={() => void action.run(() => downloadManagementFile(token, `${base}/xuat-danh-sach`, 'danh-sach-cu-tru.xlsx'), 'Đã tải danh sách cư trú.')}><Icon name="download" />Xuất danh sách cư trú</Button>
      </div>
    </header>
    <Feedback error={action.error ?? building.error} success={action.success} />
    {dangTai ? <EmptyState kind="loading" title="Đang tải danh sách cư trú…" />
      : !rows.length ? <EmptyState title="Không có người đang cư trú trong toà đã chọn." />
        : <Card>
          <DataTable
            rows={rows}
            columns={cot}
            getRowId={(r) => `${r.nguoiThueId}-${r.phongId}`}
            chips={[
              { key: 'TAT_CA', label: 'Tất cả', match: () => true },
              { key: 'QUA_HAN', label: 'Quá hạn khai báo', match: (r) => r.canhBaoQuaHan },
              { key: 'CHUA', label: 'Chưa khai báo', match: (r) => r.trangThaiLuuTru === 'CHUA_KHAI_BAO' },
              { key: 'DA', label: 'Đã khai báo', match: (r) => r.trangThaiLuuTru !== 'CHUA_KHAI_BAO' },
            ]}
            defaultChip="TAT_CA"
            timTheo={(r) => `${r.hoTen} ${r.soPhong} ${r.soDienThoai}`}
            searchLabel="Tìm tên, phòng"
            noun="người"
            pageSize={15}
            rowProps={(r) => ({ 'data-residency-row': String(r.nguoiThueId) })}
          />
        </Card>}
  </section>
}

type AuditEntry = { id: number; nguoiDungId: number; hoTen: string; hanhDong: string; doiTuong: string; giaTriTruoc: string | null; giaTriSau: string | null; lyDo: string | null; thoiDiem: string }
type AuditPage = { items: AuditEntry[]; total: number; page: number; size: number }
export function NhatKyVanHanh({ token }: { token: string }) {
  const action = useAction()
  const [filter, setFilter] = useState({ nguoiDungId: '', hanhDong: '', tuNgay: '', denNgay: '', doiTuong: '' })
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<AuditPage | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => { let active = true; const q = new URLSearchParams({ page: String(page), size: '20' }); Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v) }); managementRequest<AuditPage>(token, `/api/nhat-ky-thao-tac?${q}`).then((r) => { if (active) setResult(r) }).catch((e: Error) => { if (active) action.setError(e.message) }); return () => { active = false } }, [page, version, token])
  const cot: DataTableColumn<AuditEntry>[] = [
    { key: 'luc', label: 'Thời điểm', sortable: true, sortValue: (r) => r.thoiDiem, render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(r.thoiDiem).toLocaleString('vi-VN')}</span> },
    { key: 'nguoi', label: 'Người thực hiện', sortable: true, sortValue: (r) => r.hoTen, render: (r) => r.hoTen ? <NguoiCoAvatar id={r.nguoiDungId} ten={r.hoTen} /> : <span style={{ color: 'var(--ma-text-secondary)' }}>Người dùng #{r.nguoiDungId}</span> },
    { key: 'viec', label: 'Thao tác', sortable: true, sortValue: (r) => r.hanhDong, render: (r) => <div><div className="td-main">{r.hanhDong}</div><div className="td-sub">{r.doiTuong}</div></div> },
    { key: 'doi', label: 'Thay đổi', render: (r) => <div className="tt-doi"><div className="tt-clamp" title={r.giaTriTruoc ?? undefined}><span className="td-sub">Giá trị trước: </span>{r.giaTriTruoc ?? '—'}</div><div className="tt-clamp" title={r.giaTriSau ?? undefined}><span className="td-sub">Giá trị sau: </span>{r.giaTriSau ?? '—'}</div></div> },
    { key: 'lyDo', label: 'Lý do', render: (r) => <span className="tt-clamp" title={r.lyDo ?? undefined}>{r.lyDo ?? '—'}</span> },
  ]
  const nhan: Record<string, string> = { nguoiDungId: 'Mã người dùng', hanhDong: 'Loại thao tác', doiTuong: 'Đối tượng', tuNgay: 'Từ ngày', denNgay: 'Đến ngày' }
  return <section style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <style>{CSS_TUAN_THU}</style>
    <header className="topbar">
      <div className="title-block">
        <h1 className="h1">Nhật ký thao tác</h1>
        <p className="sub">{result?.total ?? 0} thao tác phù hợp</p>
      </div>
    </header>
    <Feedback error={action.error} />
    <Card>
      <form className="tt-form" style={{ marginTop: 0 }} onSubmit={(e) => { e.preventDefault(); setPage(0); setVersion(version + 1) }}>
        <div className="tt-luoi-loc">
          {Object.entries(nhan).map(([k, l]) => <Field label={l} key={k}><input className="input" type={k.endsWith('Ngay') ? 'date' : k === 'nguoiDungId' ? 'number' : 'text'} min={k === 'nguoiDungId' ? '1' : undefined} value={filter[k as keyof typeof filter]} onChange={(e) => setFilter({ ...filter, [k]: e.target.value })} /></Field>)}
          <div><Button type="submit" blocked={action.busy} blockedReason={action.busy ? 'Đang tra cứu, vui lòng chờ.' : undefined}><Icon name="search" />Tra cứu nhật ký</Button></div>
        </div>
      </form>
    </Card>
    <Card>
      {!result ? <EmptyState kind="loading" title="Đang tải nhật ký…" />
        : result.items.length === 0 ? <EmptyState title="Không có thao tác nào khớp bộ lọc." />
          : <DataTable rows={result.items} columns={cot} getRowId={(r) => r.id} timTheo={(r) => `${r.hoTen} ${r.hanhDong} ${r.doiTuong} ${r.lyDo ?? ''}`} searchLabel="Tìm trong trang này" noun="thao tác trên trang này" pageSize={20} rowProps={(r) => ({ 'data-audit-row': String(r.id) })} />}
      <div className="row-wrap" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
        <Button variant="secondary" blocked={page === 0} blockedReason="Đang ở trang đầu." onClick={() => setPage(page - 1)}>Trang trước</Button>
        <span>Trang {page + 1}</span>
        <Button variant="secondary" blocked={!result || (page + 1) * result.size >= result.total} blockedReason="Đang ở trang cuối." onClick={() => setPage(page + 1)}>Trang sau</Button>
      </div>
    </Card>
  </section>
}
