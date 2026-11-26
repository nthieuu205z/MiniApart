// Hôm nay (Chủ + Quản lý) V3: Chủ trả lời "còn ai nợ, hôm nay phải quyết gì"; Quản lý trả lời "tháng này kẹt ở bước nào".
// Mỗi khối tự tải, tự lỗi, tự "Tải lại" — một API hỏng không làm trắng trang.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  capNhatTrangThaiLichHen, fetchBangViecVanHanh, fetchCongNoBaoCao, fetchDashboardChu, fetchDashboardQuanLy, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan,
  fetchPhong, fetchPhongChuaGhiChiSo, fetchPublicLichHen,
  type LichHenXemPhong, type ThongTinBangViecVanHanh, type ThongTinCongNoBaoCao, type ThongTinDashboardChu, type ThongTinDashboardQuanLy, type ThongTinHoaDonQuanLy,
  type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinPhong, type ThongTinToaNha, type ThongTinYeuCauSuaChua,
} from './api'
import { DongViec } from './design/building/DongViec'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { ThanhBuoc } from './design/core/ThanhBuoc'
import { EmptyState } from './design/feedback/EmptyState'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo, type OSo } from './design/layout/KhoiSo'
import { DongNguoiNo } from './design/money/DongNguoiNo'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import type { TrangProps } from './dinhTuyen'
import { managementRequest } from './managementApi'
import { nhomNo, tuCongNo, tuHoaDonQuanLy } from './nhomNoTheoNguoi'
import { dinhDangSdt, nhanThang } from './tienTheoNguoi'
import { tinhBuoc } from './tinhBuocChuKy'
import { tenToaDangChon, useToaDangChon } from './toaDangChon'
import './HomNay.css'

type Nguon<T> = { du: T | null; loi: string | null; dangTai: boolean; thuLai: () => void }

/** `khoa === null` = chưa đủ điều kiện tải (đang chờ danh sách toà). Đổi khoa hoặc bấm "Tải lại" thì tải lại; lỗi thì giữ số cũ. */
function useNguon<T>(khoa: string | null, tai: () => Promise<T>): Nguon<T> {
  const [lan, setLan] = useState(0)
  const [s, setS] = useState<{ du: T | null; loi: string | null; dangTai: boolean }>({ du: null, loi: null, dangTai: true })
  const taiRef = useRef(tai)
  taiRef.current = tai
  useEffect(() => {
    setS((p) => ({ du: p.du, loi: null, dangTai: true }))
    if (khoa === null) return undefined
    let con = true
    taiRef.current().then(
      (du) => { if (con) setS({ du, loi: null, dangTai: false }) },
      (e: unknown) => { if (con) setS((p) => ({ du: p.du, loi: e instanceof Error ? e.message : 'Không tải được.', dangTai: false })) },
    )
    return () => { con = false }
  }, [khoa, lan])
  return { ...s, thuLai: () => setLan((n) => n + 1) }
}

const TUAN = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
/** Ngày hôm nay theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ máy. */
function homNayVn(): { iso: string; thu: string } {
  const d = new Date(Date.now() + 7 * 3600e3)
  return { iso: d.toISOString().slice(0, 10), thu: TUAN[d.getUTCDay()] }
}
const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / 864e5)
const tien = (v: string | number) => `${dinhDangTien(v)} ₫`
const ngayNgan = (iso: string) => dinhDangNgayIso(iso.slice(0, 10)).slice(0, 5)
const num = (v: string | number | null | undefined) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const hai = (n: number) => String(n).padStart(2, '0')
/** "11/2026" của tháng hôm nay và tháng trước. */
function haiThang(iso: string) {
  const y = Number(iso.slice(0, 4)); const m = Number(iso.slice(5, 7))
  return { nay: `${m}/${y}`, truoc: m === 1 ? `12/${y - 1}` : `${m - 1}/${y}` }
}
const soThang = (nt: string) => nt.split('/')[0]

type HoaDonToa = ThongTinHoaDonQuanLy & { toaNhaId: number; ngayPhatHanh?: string | null }
const hoaDonThat = (h: ThongTinHoaDonQuanLy) => h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY'
const taiHoaDon = async (token: string, ds: ThongTinToaNha[]): Promise<HoaDonToa[]> =>
  (await Promise.all(ds.map(async (x) => (await fetchHoaDonQuanLy(token, x.id, '')).map((h) => ({ ...h, toaNhaId: x.id }) as HoaDonToa)))).flat()

type KyToa = { toa: ThongTinToaNha; ky: ThongTinKyThanhToan | null; thieu: { id: number; soPhong: string }[] }
/** Cùng cách chọn kỳ với ChuKyThang: kỳ mới nhất chưa khoá, không có thì kỳ mới nhất. */
const kyDangXem = (dsKy: ThongTinKyThanhToan[]) => {
  const xep = [...dsKy].sort((a, b) => b.nam * 100 + b.thang - (a.nam * 100 + a.thang))
  return xep.find((k) => k.trangThai !== 'DA_CHOT') ?? xep[0] ?? null
}
const taiKy = (token: string, ds: ThongTinToaNha[]): Promise<KyToa[]> => Promise.all(ds.map(async (toa) => {
  const ky = kyDangXem(await fetchKyThanhToan(token, toa.id))
  return { toa, ky, thieu: ky ? await fetchPhongChuaGhiChiSo(token, toa.id, ky.id) : [] }
}))
const TEN_BUOC = ['Ghi chỉ số', 'Khoá chỉ số', 'Gửi hoá đơn', 'Thu tiền']

type NguonChung = Pick<Nguon<unknown>, 'du' | 'loi' | 'dangTai' | 'thuLai'>
function Khoi({ id, tieuDe, meta, lienKet, nguon, children }: { id: string; tieuDe: string; meta?: string; lienKet?: ReactNode; nguon: NguonChung; children: ReactNode }) {
  return (
    <section className="card hn-khoi" aria-labelledby={id}>
      <div className="blk-h">
        <h2 id={id}>{tieuDe}</h2>
        {nguon.du && meta ? <span className="meta">{meta}</span> : null}
        {lienKet ? <span className="push">{lienKet}</span> : null}
      </div>
      {nguon.dangTai && !nguon.du ? <div className="hn-skel" aria-busy="true"><div className="skel skel-line" /><div className="skel skel-line" /><div className="skel skel-line" /></div>
        : !nguon.du ? <EmptyState kind="error" title={`Không tải được ${tieuDe.toLowerCase()}`} body="Dữ liệu chưa bị thay đổi." actionLabel="Tải lại" onAction={nguon.thuLai} />
          : <>{nguon.loi ? <p role="alert" className="hn-loi">{nguon.loi} <button type="button" className="btn btn-ghost btn-sm" onClick={nguon.thuLai}>Tải lại</button></p> : null}{children}</>}
    </section>
  )
}
const LienKet = ({ href, children }: { href: string; children: ReactNode }) => <a className="link-more" href={href}>{children}</a>

/** Gộp vài nguồn thành một khối: hiện khi mọi nguồn đã xong (có số hoặc có lỗi); lỗi thì báo + tải lại các nguồn hỏng. */
function gop(nguon: Nguon<unknown>[]): NguonChung {
  const loi = nguon.find((n) => n.loi)
  const xong = nguon.every((n) => !n.dangTai || n.du)
  return { du: xong ? true : null, loi: loi?.loi ?? null, dangTai: !xong, thuLai: () => nguon.forEach((n) => { if (n.loi) n.thuLai() }) }
}

/* ---------------------------------- Chủ ---------------------------------- */

type HopDongToa = ThongTinHopDong & { tenToa: string }

/** Hợp đồng đang hiệu lực kết thúc trong 0–30 ngày kể từ `homNay`. */
export function sapHet<H extends ThongTinHopDong>(hd: H[], homNay: string): H[] {
  return hd.filter((h) => h.trangThai === 'HIEU_LUC' && ngayCach(homNay, h.ngayKetThuc) >= 0 && ngayCach(homNay, h.ngayKetThuc) <= 30).sort((a, b) => a.ngayKetThuc.localeCompare(b.ngayKetThuc))
}
const khanChuaCoTho = (ds: ThongTinYeuCauSuaChua[]) => ds.filter((s) => s.trangThai === 'MOI_TIEP_NHAN' && s.mucDo === 'KHAN_CAP')
const thangCua = (h: HoaDonToa) => nhanThang({ ngayPhatHanh: h.ngayPhatHanh, hanThanhToan: h.hanThanhToan })

function HomNayChu({ token }: Pick<TrangProps, 'token'>) {
  const t = useToaDangChon()
  const { iso, thu } = homNayVn()
  const { nay, truoc } = haiThang(iso)
  const ds = t.toaNhaId === null ? t.danhSach : t.danhSach.filter((x) => x.id === t.toaNhaId)
  const tenToa = new Set(ds.map((x) => x.ten))
  const khoaToa = t.dangTai ? null : `${token}|${ds.map((x) => x.id).join(',')}`
  const khoaDon = `${token}|${t.toaNhaId}`

  const dash = useNguon<ThongTinDashboardChu>(khoaDon, () => fetchDashboardChu(token, t.toaNhaId))
  const no = useNguon<ThongTinCongNoBaoCao>(khoaDon, () => fetchCongNoBaoCao(token, t.toaNhaId))
  const hoaDon = useNguon<HoaDonToa[]>(khoaToa, () => taiHoaDon(token, ds))
  const kyToa = useNguon<KyToa[]>(khoaToa, () => taiKy(token, ds))
  const suCo = useNguon<ThongTinYeuCauSuaChua[]>(khoaToa, () => managementRequest<ThongTinYeuCauSuaChua[]>(token, '/api/yeu-cau-sua-chua'))
  const hopDong = useNguon<HopDongToa[]>(khoaToa, async () => (await Promise.all(ds.map(async (x) => (await fetchHopDongQuanLy(token, x.id)).map((h) => ({ ...h, tenToa: x.ten }))))).flat())
  const phong = useNguon<{ toaNhaId: number; phong: ThongTinPhong[] }[]>(khoaToa, () => Promise.all(ds.map(async (x) => ({ toaNhaId: x.id, phong: await fetchPhong(token, x.id) }))))
  const lich = useNguon<LichHenXemPhong[]>(khoaDon, () => fetchPublicLichHen(token, t.toaNhaId ?? undefined))
  // Không đọc được thì bỏ qua lặng lẽ: không có SĐT nghĩa là không có Gọi.
  const sdt = useNguon<Map<number, string>>(khoaDon, async () => { try { return new Map((await managementRequest<{ id: number; soDienThoai?: string | null }[]>(token, '/api/nguoi-thue')).map((n) => [n.id, n.soDienThoai ?? ''])) } catch { return new Map() } })
  const pccc = useNguon<ThongTinBangViecVanHanh[]>(khoaToa, async () => { try { return await Promise.all(ds.map((x) => fetchBangViecVanHanh(token, x.id))) } catch { return [] } })

  const dong = no.du ? tuCongNo(no.du.congNo) : []
  const nguoi = nhomNo(dong)
  const tongNo = dong.reduce((a, d) => a + d.conLai, 0)
  const treNhat = Math.max(0, ...dong.map((d) => d.soNgayQuaHan))
  const hdThat = (hoaDon.du ?? []).filter(hoaDonThat) as HoaDonToa[]
  const thangNay = hdThat.filter((h) => thangCua(h) === nay)
  const thangTruoc = hdThat.filter((h) => thangCua(h) === truoc)
  const tongDa = (a: HoaDonToa[]) => a.reduce((s, h) => s + num(h.daThu), 0)
  const tongTra = (a: HoaDonToa[]) => a.reduce((s, h) => s + num(h.tongTien), 0)
  const phanTram = (a: HoaDonToa[]) => (tongTra(a) ? Math.round((tongDa(a) / tongTra(a)) * 100) : 0)
  const k = dash.du?.kpi
  const moSuCo = (suCo.du ?? []).filter((s) => tenToa.has(s.toaNha) && s.trangThai !== 'DA_DONG' && s.trangThai !== 'DA_HUY')
  const khan = khanChuaCoTho(moSuCo)
  const choXacNhan = (lich.du ?? []).filter((l) => l.trangThai === 'CHO_XAC_NHAN').sort((a, b) => a.thoiGianHen.localeCompare(b.thoiGianHen))
  const soTrong = (phong.du ?? []).reduce((a, x) => a + x.phong.filter((r) => r.trangThai === 'TRONG').length, 0)
  const het = sapHet(hopDong.du ?? [], iso)
  const choKy = (hopDong.du ?? []).filter((h) => h.trangThai === 'CHO_KY')
  const chuaGui = (kyToa.du ?? []).flatMap(({ toa, ky, thieu }) => {
    if (!ky || ky.thang !== Number(iso.slice(5, 7)) || ky.nam !== Number(iso.slice(0, 4))) return []
    const { buocHienTai } = tinhBuoc({ ky, soCongToThieu: thieu.length, hoaDon: (hoaDon.du ?? []).filter((h) => h.kyId === ky.id) })
    return buocHienTai <= 3 ? [{ toa, buoc: TEN_BUOC[buocHienTai - 1].toLowerCase() }] : []
  })
  const coPccc = (pccc.du ?? []).filter((b) => b.nhomViec.some((g) => g.ma === 'PCCC' && g.trangThai !== 'DA_XONG' && g.trangThai !== 'CHUA_SAN_SANG'))

  const viec: ReactNode[] = []
  if (chuaGui.length) viec.push(<DongViec key="gui" muc="no" tieuDe={`Hoá đơn tháng ${Number(iso.slice(5, 7))} chưa gửi`}
    moTa={`Kỳ đóng ngày ${hai(chuaGui[0].toa.ngayChotSo)}/${iso.slice(5, 7)}. ${chuaGui.length > 1 && chuaGui.every((c) => c.buoc === chuaGui[0].buoc) ? `${chuaGui.length} toà còn ở bước ${chuaGui[0].buoc}` : chuaGui.map((c) => `${c.toa.ten} còn ở bước ${c.buoc}`).join('; ')}.`} nutNhan="Xem tiến độ" href={`/chu-ky?toaNhaId=${chuaGui[0].toa.id}`} />)
  if (khan.length) viec.push(<DongViec key="khan" muc="no" tieuDe={`${khan.length} sự cố khẩn chưa giao thợ`} moTa={khan.map((s) => `${s.hangMuc} phòng ${s.soPhong}`).join(' · ')} nutNhan="Giao thợ" href={`/su-co?id=${khan[0].id}`} />)
  if (het.length) viec.push(<DongViec key="het" muc="canh" tieuDe={`${het.length} hợp đồng hết hạn ${dinhDangNgayIso(het[0].ngayKetThuc)}`}
    moTa={`Còn ${ngayCach(iso, het[0].ngayKetThuc)} ngày · ${het.map((h) => `${h.hoTenNguoiThue} (${h.soPhong})`).join(', ')}`} nutNhan="Gia hạn" href={`/hop-dong/${het[0].id}`} />)
  if (choKy.length) viec.push(<DongViec key="ky" tieuDe={`${choKy.length} hợp đồng chờ ký`} moTa={choKy.map((h) => `${h.hoTenNguoiThue} · phòng ${h.soPhong}`).join(', ')} nutNhan="Xem" href="/hop-dong" />)
  if (choXacNhan.length) viec.push(<DongViec key="lich" tieuDe={`${choXacNhan.length} lịch xem phòng chờ xác nhận`} moTa={`Gần nhất ngày ${ngayNgan(choXacNhan[0].thoiGianHen)} · đang có ${soTrong} phòng trống`} nutNhan="Xem lịch" href="/lich-hen" />)
  if (coPccc.length) viec.push(<DongViec key="pccc" muc="canh" tieuDe="Bình chữa cháy quá hạn kiểm định" moTa={`${coPccc.length} toà`} nutNhan="Xem" href="/an-toan" />)
  const nguonViec = gop([kyToa, suCo, hopDong, lich, phong])

  const theoToa = ds.map((x) => {
    const n = nhomNo(dong.filter((d) => d.toaNhaId === x.id))
    const p = phong.du?.find((q) => q.toaNhaId === x.id)?.phong ?? []
    return { x, soNguoi: n.length, no: n.reduce((a, g) => a + g.conLai, 0), thue: p.filter((r) => r.trangThai === 'DANG_THUE').length, tong: p.length, pt: phanTram(thangTruoc.filter((h) => h.toaNhaId === x.id)), suCo: moSuCo.filter((s) => s.toaNha === x.ten).length }
  })
  const cot: DataTableColumn<(typeof theoToa)[number]>[] = [
    { key: 'toa', label: 'Toà', the: 'tieu-de', render: (r) => <><a className="td-main" href={`/toa-nha/${r.x.id}`}>{r.x.ten}</a><div className="td-sub">{r.x.diaChi}</div></> },
    { key: 'thue', label: 'Đang thuê', align: 'num', render: (r) => `${r.thue}/${r.tong}` },
    { key: 'pt', label: `Tháng ${soThang(truoc)} đã thu`, render: (r) => <span className="hn-pt">{r.pt}% <span className="hn-thanh" aria-hidden="true"><i style={{ width: `${r.pt}%` }} /></span></span> },
    { key: 'no', label: 'Còn nợ', align: 'num', render: (r) => <><span className="hn-no">{tien(r.no)}</span><div className="td-sub">{r.soNguoi} người</div></> },
    { key: 'suCo', label: 'Sự cố mở', align: 'num', render: (r) => r.suCo },
  ]

  const dauNo = dong.length > 0 && dong.every((d) => d.soNgayQuaHan > 30)
  const loiPhu = (n: NguonChung) => (n.loi && !n.du ? 'Không tải được' : ' ')
  const so: OSo[] = [
    { nhan: 'Còn phải thu', giaTri: no.du ? tien(tongNo) : '—', tone: 'no', href: '/thu-tien', phu: no.du ? `${nguoi.length} người nợ · ${dong.length} hoá đơn${dong.length ? (dauNo ? ', đều quá hạn trên 30 ngày' : `, cũ nhất trễ ${treNhat} ngày`) : ''}` : loiPhu(no) },
    { nhan: `Hoá đơn tháng ${soThang(nay)} đã thu`, giaTri: hoaDon.du ? tien(tongDa(thangNay)) : '—', href: '/thu-tien?tab=da-thu', phu: hoaDon.du ? `mới gửi ${thangNay.length} hoá đơn` : loiPhu(hoaDon) },
    { nhan: `Tháng ${soThang(truoc)} đã thu`, giaTri: hoaDon.du ? `${phanTram(thangTruoc)}%` : '—', href: '/thu-tien?tab=hoa-don', phu: hoaDon.du ? `${dinhDangTien(tongDa(thangTruoc))} / ${tien(tongTra(thangTruoc))}` : loiPhu(hoaDon) },
    { nhan: 'Phòng đang thuê', giaTri: k ? `${k.soPhongDangThue} / ${k.tongSoPhong}` : '—', anKhiHep: true, phu: k ? `${k.soPhongTrong} trống · ${k.soPhongDangSua} đang sửa` : loiPhu(dash) },
  ]

  return (
    <>
      <DauTrang tieuDe="Hôm nay" phu={`${thu}, ${dinhDangNgayIso(iso)} · ${tenToaDangChon(t) || 'chưa có toà'}${dash.du ? ` · số liệu lúc ${dash.du.thoiDiemCapNhat.slice(11, 16)}` : ''}`}
        hanhDong={<a className="btn btn-secondary hn-an-hep" href="/thong-bao">Thông báo</a>} />
      <KhoiSo so={so} />
      <div className="hn-luoi">
        <Khoi id="hn-no" tieuDe="Ai đang nợ" nguon={no} meta={`${nguoi.length} người`}>
          {nguoi.length === 0 ? <EmptyState title="Không ai còn nợ." body={<a href="/thu-tien?tab=hoa-don">Xem hoá đơn tháng {soThang(truoc)}</a>} />
            : <>
              {nguoi.slice(0, 6).map((g) => <DongNguoiNo key={g.khoa} nhom={g} rut hienToa={t.toaNhaId === null} sdt={g.nguoiThueId !== null ? sdt.du?.get(g.nguoiThueId) : null} hrefHoSo={g.nguoiThueId !== null ? `/nguoi-thue/${g.nguoiThueId}` : undefined} />)}
              <p className="hn-chan"><span>Hiện {Math.min(6, nguoi.length)} người nợ nhiều nhất trong {nguoi.length} người</span><LienKet href="/thu-tien">Xem cả {nguoi.length} người →</LienKet></p>
            </>}
        </Khoi>
        <Khoi id="hn-qd" tieuDe="Cần quyết hôm nay" nguon={nguonViec} meta={`${viec.length} việc`}>
          {viec.length ? viec : <p className="t-sm t-2">Không có việc cần quyết hôm nay.</p>}
        </Khoi>
      </div>
      {t.toaNhaId === null && ds.length > 0 ? (
        <section className="card hn-khoi hn-theo-toa" aria-labelledby="hn-tt"><div className="blk-h"><h2 id="hn-tt">Theo toà</h2></div>
          <DataTable rows={theoToa} columns={cot} getRowId={(r) => r.x.id} noun="toà" pageSize={20} /></section>
      ) : null}
    </>
  )
}

/* ------------------------------- Quản lý --------------------------------- */
// Quản lý không gọi /api/dashboard/chu và /api/bao-cao/cong-no (403): nợ dựng từ /api/hoa-don của toà; công tơ thiếu lấy cùng nguồn với màn Tháng.

function HomNayQuanLy({ token }: Pick<TrangProps, 'token'>) {
  const t = useToaDangChon()
  const { iso, thu } = homNayVn()
  const toaObj = t.toaNhaId !== null ? t.danhSach.find((x) => x.id === t.toaNhaId) : t.danhSach[0]
  const toa = toaObj?.id ?? null
  const khoa = t.dangTai ? null : `${token}|${toa}`
  const dash = useNguon<ThongTinDashboardQuanLy>(khoa, () => fetchDashboardQuanLy(token, toa))
  const kyN = useNguon<KyToa[]>(khoa, () => taiKy(token, toaObj ? [toaObj] : []))
  const hoaDon = useNguon<HoaDonToa[]>(khoa, () => taiHoaDon(token, toaObj ? [toaObj] : []))
  const hopDong = useNguon<ThongTinHopDong[]>(khoa, () => (toa === null ? Promise.resolve([]) : fetchHopDongQuanLy(token, toa)))
  const suCo = useNguon<ThongTinYeuCauSuaChua[]>(khoa, () => managementRequest<ThongTinYeuCauSuaChua[]>(token, '/api/yeu-cau-sua-chua'))
  const viecVh = useNguon<ThongTinBangViecVanHanh | null>(khoa, async () => { try { return toa === null ? null : await fetchBangViecVanHanh(token, toa) } catch { return null } })
  const [loiLich, setLoiLich] = useState<string | null>(null)

  const kt = kyN.du?.[0]
  const thieu = kt?.thieu.length ?? 0
  const buoc = kt?.ky ? tinhBuoc({ ky: kt.ky, soCongToThieu: thieu, hoaDon: (hoaDon.du ?? []).filter((h) => h.kyId === kt.ky!.id) }) : null
  const thangKy = kt?.ky ? `${kt.ky.thang}/${kt.ky.nam}` : `${Number(iso.slice(5, 7))}/${iso.slice(0, 4)}`
  const treHan = thieu > 0 && !!toaObj && Number(iso.slice(8, 10)) > toaObj.ngayChotSo
  const dong = toaObj && hoaDon.du ? tuHoaDonQuanLy(hoaDon.du, toaObj, iso, hopDong.du ?? []).filter((d) => d.soNgayQuaHan > 0) : []
  const nguoi = nhomNo(dong)
  const tongNo = dong.reduce((a, d) => a + d.conLai, 0)
  const sc = (suCo.du ?? []).filter((s) => s.toaNha === toaObj?.ten && (s.trangThai === 'MOI_TIEP_NHAN' || s.trangThai === 'DA_TIEP_NHAN'))
  const het = sapHet(hopDong.du ?? [], iso)
  const choKy = (hopDong.du ?? []).filter((h) => h.trangThai === 'CHO_KY')
  const pccc = viecVh.du?.nhomViec.find((g) => g.ma === 'PCCC' && g.trangThai !== 'DA_XONG' && g.trangThai !== 'CHUA_SAN_SANG')
  const hen = (dash.du?.lichHenSapToi ?? []).filter((l) => l.thoiGian.slice(0, 10) >= iso && l.trangThai !== 'HUY').slice(0, 5)

  const nutChinh = thieu > 0 ? `Ghi ${thieu} công tơ còn thiếu` : buoc ? ['Ghi chỉ số', 'Khoá chỉ số', 'Gửi hoá đơn', 'Ghi thu tiền'][buoc.buocHienTai - 1] : 'Mở tháng này'
  const viec: ReactNode[] = []
  if (nguoi.length) viec.push(<DongViec key="no" muc="no" tieuDe={`${nguoi.length} người nợ quá hạn, ${tien(tongNo)}`} moTa={`Nhiều nhất: ${nguoi[0].hoTen}, phòng ${nguoi[0].soPhong}, ${tien(nguoi[0].conLai)}`} nutNhan="Thu tiền" href="/thu-tien" />)
  sc.slice(0, 6).forEach((s) => { const khanCap = s.mucDo === 'KHAN_CAP'; viec.push(<DongViec key={`sc${s.id}`} muc={khanCap ? 'no' : 'canh'} tieuDe={`${s.hangMuc} phòng ${s.soPhong}${khanCap ? ' (khẩn)' : ''}`} moTa={s.tenTrangThai} nutNhan="Giao thợ" href={`/su-co?id=${s.id}`} />) })
  het.forEach((h) => viec.push(<DongViec key={`hd${h.id}`} muc="canh" tieuDe={`Hợp đồng phòng ${h.soPhong} hết hạn ${dinhDangNgayIso(h.ngayKetThuc)}`} moTa={`Còn ${ngayCach(iso, h.ngayKetThuc)} ngày · ${h.hoTenNguoiThue}`} nutNhan="Gia hạn" href={`/hop-dong/${h.id}`} />))
  if (choKy.length) viec.push(<DongViec key="ky" tieuDe={`${choKy.length} hợp đồng chờ ký`} moTa={choKy.map((h) => `${h.hoTenNguoiThue} · phòng ${h.soPhong}`).join(', ')} nutNhan="Mở" href="/hop-dong" />)
  if (pccc) viec.push(<DongViec key="pccc" muc="canh" tieuDe="Bình chữa cháy quá hạn kiểm định" moTa={pccc.tenTrangThai} nutNhan="Xem" href="/an-toan" />)
  const nguonViec = gop([hoaDon, suCo, hopDong])

  const xacNhan = async (id: number) => { setLoiLich(null); try { await capNhatTrangThaiLichHen(token, id, 'DA_XAC_NHAN'); dash.thuLai() } catch (e) { setLoiLich(e instanceof Error ? e.message : 'Không xác nhận được.') } }

  return (
    <>
      <DauTrang tieuDe="Hôm nay" phu={`${thu}, ${dinhDangNgayIso(iso)} · ${tenToaDangChon(t) || 'chưa có toà'}`}
        hanhDong={<><a className="btn btn-secondary hn-an-hep" href="/thong-bao">Thông báo</a><a className="btn btn-primary" href="/chu-ky">{nutChinh}</a></>} />
      {treHan && kt?.ky && toaObj ? <div className="hn-bang" role="alert"><b>Tháng {kt.ky.thang} đang trễ:</b> kỳ đóng ngày {hai(toaObj.ngayChotSo)}/{hai(kt.ky.thang)}/{kt.ky.nam} nhưng còn {thieu} công tơ chưa ghi (phòng {kt.thieu.slice(0, 3).map((p) => p.soPhong).join(', ')}{thieu > 3 ? '…' : ''}), nên chưa gửi được hoá đơn.</div> : null}
      <section className="card hn-khoi" aria-labelledby="hn-buoc">
        <div className="blk-h"><h2 id="hn-buoc">Tiến độ tháng {thangKy}</h2><span className="meta">theo bảng chỉ số</span></div>
        {kyN.dangTai && !kyN.du ? <div className="hn-skel" aria-busy="true"><div className="skel skel-line" /></div>
          : buoc ? <ThanhBuoc nhan={`Tiến độ tháng ${thangKy}`} buoc={buoc.buoc.map((b, i) => ({ ten: TEN_BUOC[i], moTa: b.tomTat, trangThai: b.trangThai === 'dang' ? 'nay' : b.trangThai === 'xong' ? 'xong' : 'cho', href: `/chu-ky?b=${i + 1}` }))} />
            : <EmptyState kind={kyN.loi ? 'error' : 'first'} title={kyN.loi ? 'Không tải được tiến độ tháng' : 'Chưa có tháng nào đang mở.'} actionLabel={kyN.loi ? 'Tải lại' : undefined} onAction={kyN.thuLai} />}
      </section>
      <div className="hn-luoi hn-luoi-ql">
        <Khoi id="hn-vc" tieuDe="Việc cần làm" nguon={nguonViec} meta={`${viec.length} việc`}>
          {viec.length ? viec : <p className="t-sm t-2">Không có việc cần làm hôm nay.</p>}
        </Khoi>
        <Khoi id="hn-lq" tieuDe="Lịch xem phòng" nguon={dash} lienKet={<LienKet href="/lich-hen">Tất cả</LienKet>}>
          {loiLich ? <p role="alert" className="hn-loi">{loiLich}</p> : null}
          {hen.length === 0 ? <p className="t-sm t-2">Chưa có lịch xem phòng sắp tới.</p> : hen.map((l) => (
            <div className="ma-dongviec thuong" key={l.id}>
              <div className="ma-dongviec-than">
                <span className="ma-dongviec-td">{ngayNgan(l.thoiGian)} · {l.thoiGian.slice(11, 16)} · phòng {l.soPhong.replace(/ \(.*\)$/, '')}</span>
                <span className="ma-dongviec-mt">{l.hoTen} · {dinhDangSdt(l.soDienThoai)}</span>
              </div>
              {l.trangThai === 'CHO_XAC_NHAN' ? <Button variant="secondary" size="sm" onClick={() => void xacNhan(l.id)}>Xác nhận</Button>
                : l.trangThai === 'DA_XAC_NHAN' ? <span className="hn-hen"><span className="dot ok" aria-hidden="true" /> Đã hẹn</span> : null}
            </div>
          ))}
        </Khoi>
      </div>
    </>
  )
}

export default function HomNay({ token, vaiTro }: TrangProps) {
  return vaiTro === 'CHU' ? <div className="hom-nay"><HomNayChu token={token} /></div> : <div className="hom-nay hom-nay-ql"><HomNayQuanLy token={token} /></div>
}
