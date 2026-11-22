// Hôm nay (Chủ + Quản lý): một trang đọc, mọi dòng là link vào nơi xử lý. Mỗi khối tự tải, tự lỗi, tự "Thử lại" — một API hỏng không làm trắng trang.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  fetchBangViecVanHanh, fetchCongNoBaoCao, fetchDashboardChu, fetchDashboardQuanLy, fetchHopDongQuanLy, fetchPhong, fetchPublicLichHen,
  type LichHenXemPhong, type ThongTinBangViecVanHanh, type ThongTinCongNoBaoCao, type ThongTinDashboardChu, type ThongTinDashboardQuanLy,
  type ThongTinHopDong, type ThongTinPhong, type ThongTinYeuCauSuaChua,
} from './api'
import { Icon, type IconName } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import type { TrangProps } from './dinhTuyen'
import { managementRequest } from './managementApi'
import { nhomNo, tuCongNo } from './nhomNoTheoNguoi'
import { tenToaDangChon, useToaDangChon } from './toaDangChon'
import './HomNay.css'

type Nguon<T> = { du: T | null; loi: string | null; dangTai: boolean; thuLai: () => void }

/** `khoa === null` = chưa đủ điều kiện tải (đang chờ danh sách toà). Đổi khoa hoặc bấm "Thử lại" thì tải lại. */
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
      (e: unknown) => { if (con) setS({ du: null, loi: e instanceof Error ? e.message : 'Không tải được.', dangTai: false }) },
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
const viTat = (ten: string) => ten.trim().split(/\s+/).slice(-2).map((t) => t[0] ?? '').join('').toUpperCase()
const mauAv = (ten: string) => `h${1 + ([...ten].reduce((a, c) => a + c.charCodeAt(0), 0) % 5)}`
const TT_LICH: Record<string, string> = { CHO_XAC_NHAN: 'Chờ xác nhận', DA_XAC_NHAN: 'Đã xác nhận', HUY: 'Đã huỷ' }

function Khoi<T>({ id, tieuDe, meta, lienKet, nguon, children }: { id: string; tieuDe: string; meta?: (du: T) => string; lienKet?: ReactNode; nguon: Nguon<T>; children: (du: T) => ReactNode }) {
  return (
    <section className="sec" aria-labelledby={id}>
      <div className="sec-h">
        <h2 id={id}>{tieuDe}</h2>
        {nguon.du && meta ? <span className="meta">{meta(nguon.du)}</span> : null}
        {lienKet ? <span className="push">{lienKet}</span> : null}
      </div>
      <NoiDung nguon={nguon} ten={tieuDe.toLowerCase()}>{children}</NoiDung>
    </section>
  )
}

function NoiDung<T>({ nguon, ten, children }: { nguon: Nguon<T>; ten: string; children: (du: T) => ReactNode }) {
  if (nguon.dangTai && !nguon.du) return <div className="hn-skel" aria-busy="true"><div className="skel skel-line" /><div className="skel skel-line" /><div className="skel skel-line" /></div>
  if (nguon.loi || !nguon.du) return <EmptyState kind="error" title={`Không tải được ${ten}`} body="Dữ liệu chưa bị thay đổi." actionLabel="Thử lại" onAction={nguon.thuLai} />
  return <>{children(nguon.du)}</>
}

function Xong({ children }: { children: ReactNode }) {
  return <div className="irow done"><span className="tile ok"><Icon name="check" /></span><div className="body"><div className="t">{children}</div></div></div>
}

function Hang({ href, tile, icon, tieu, phu, cuoi }: { href: string; tile?: string; icon: IconName; tieu: string; phu: string; cuoi?: ReactNode }) {
  return (
    <a className="irow" href={href}>
      <span className={`tile${tile ? ` ${tile}` : ''}`}><Icon name={icon} /></span>
      <div className="body"><div className="t">{tieu}</div><div className="s">{phu}</div></div>
      {cuoi}
      <span className="chev"><Icon name="chevron-right" size="sm" /></span>
    </a>
  )
}

function Dai({ cac }: { cac: { href: string; k: string; v: string; s: string; nguon: Nguon<unknown>; nguy?: boolean }[] }) {
  return (
    <div className="strip">
      {cac.map((o) => {
        const hong = !o.nguon.du
        return (
          <a key={o.href} href={o.href}>
            <div className="k">{o.k}</div>
            {hong && o.nguon.dangTai ? <div className="skel skel-kpi" /> : <div className={`v${o.nguy && !hong ? ' t-danger' : ''}`}>{hong ? '—' : o.v}</div>}
            <div className="s">{hong ? (o.nguon.dangTai ? '\u00a0' : 'Không tải được') : o.s}</div>
          </a>
        )
      })}
    </div>
  )
}

function DauTrang({ phu }: { phu: string }) {
  return <div className="ph"><div className="grow"><h1 className="h1">Hôm nay</h1><p className="sub">{phu}</p></div></div>
}

function Hen({ ds, rong }: { ds: { id: number; gio: string; ten: string; phu: string; tt: string }[]; rong: string }) {
  if (!ds.length) return <p className="t-sm t-2">{rong}</p>
  return (
    <ul className="tl">
      {ds.map((l) => (
        <li key={l.id}>
          <span className={`dot ${l.tt === 'DA_XAC_NHAN' ? 'ok' : l.tt === 'HUY' ? '' : 'warn'}`} />
          <span><b>{l.gio}</b> · {l.ten}<br /><span className="t-meta">{l.phu}</span></span>
          <span className="when">{TT_LICH[l.tt] ?? l.tt}</span>
        </li>
      ))}
    </ul>
  )
}

function The({ id, tieuDe, lienKet, children }: { id: string; tieuDe: string; lienKet?: ReactNode; children: ReactNode }) {
  return <section className="card" aria-labelledby={id}><div className="blk-h"><h2 id={id}>{tieuDe}</h2>{lienKet ? <span className="push">{lienKet}</span> : null}</div>{children}</section>
}
const LienKet = ({ href, children }: { href: string; children: ReactNode }) => <a className="link-more brand" href={href}>{children}</a>

/* ---------------------------------- Chủ ---------------------------------- */

type HopDongToa = ThongTinHopDong & { tenToa: string }

/** Hợp đồng đang hiệu lực kết thúc trong 0–30 ngày kể từ `homNay`. */
export function sapHet<H extends ThongTinHopDong>(hd: H[], homNay: string): H[] {
  return hd.filter((h) => h.trangThai === 'HIEU_LUC' && ngayCach(homNay, h.ngayKetThuc) >= 0 && ngayCach(homNay, h.ngayKetThuc) <= 30).sort((a, b) => a.ngayKetThuc.localeCompare(b.ngayKetThuc))
}
const khanChuaCoTho = (ds: ThongTinYeuCauSuaChua[]) => ds.filter((s) => s.trangThai === 'MOI_TIEP_NHAN' && s.mucDo === 'KHAN_CAP')
const chiaPhong = (p: { toaNhaId: number; phong: ThongTinPhong[] }[]) => p.map((x) => ({
  toaNhaId: x.toaNhaId,
  trong: x.phong.filter((r) => r.trangThai === 'TRONG').map((r) => r.soPhong),
  sua: x.phong.filter((r) => r.trangThai === 'DANG_SUA').map((r) => r.soPhong),
}))

function HomNayChu({ token }: Pick<TrangProps, 'token'>) {
  const t = useToaDangChon()
  const { iso, thu } = homNayVn()
  const ds = t.toaNhaId === null ? t.danhSach : t.danhSach.filter((x) => x.id === t.toaNhaId)
  const tenToa = new Map(ds.map((x) => [x.id, x.ten]))
  const khoaToa = t.dangTai ? null : `${token}|${ds.map((x) => x.id).join(',')}`
  const khoaDon = `${token}|${t.toaNhaId}`

  const dash = useNguon<ThongTinDashboardChu>(khoaDon, () => fetchDashboardChu(token, t.toaNhaId))
  const no = useNguon<ThongTinCongNoBaoCao>(khoaDon, () => fetchCongNoBaoCao(token, t.toaNhaId))
  const suCo = useNguon<ThongTinYeuCauSuaChua[]>(khoaToa, () => managementRequest<ThongTinYeuCauSuaChua[]>(token, '/api/yeu-cau-sua-chua'))
  const hopDong = useNguon<HopDongToa[]>(khoaToa, async () => (await Promise.all(ds.map(async (x) => (await fetchHopDongQuanLy(token, x.id)).map((h) => ({ ...h, tenToa: x.ten }))))).flat())
  const phong = useNguon<{ toaNhaId: number; phong: ThongTinPhong[] }[]>(khoaToa, () => Promise.all(ds.map(async (x) => ({ toaNhaId: x.id, phong: await fetchPhong(token, x.id) }))))
  const lich = useNguon<LichHenXemPhong[]>(khoaDon, () => fetchPublicLichHen(token, t.toaNhaId ?? undefined))

  const dong = no.du ? tuCongNo(no.du.congNo) : []
  const nguoi = nhomNo(dong)
  const tongNo = dong.reduce((a, d) => a + d.conLai, 0)
  const trongToa = new Set(tenToa.values())
  const moSuCo = (suCo.du ?? []).filter((s) => trongToa.has(s.toaNha) && s.trangThai !== 'DA_DONG' && s.trangThai !== 'DA_HUY')
  const chuaCoTho = moSuCo.filter((s) => s.trangThai === 'MOI_TIEP_NHAN' || s.trangThai === 'DA_TIEP_NHAN').length
  const khan = khanChuaCoTho(moSuCo)
  const k = dash.du?.kpi
  const lichConHieu = (lich.du ?? []).filter((l) => l.trangThai !== 'HUY')
  const chotNgay = [...new Set(ds.map((x) => x.ngayChotSo))]
  const conNgay = chotNgay.length === 1 ? chotNgay[0] - Number(iso.slice(8, 10)) : -1

  const dai = [
    { href: '/bao-cao', k: 'Thực thu 6 tháng', v: k ? tien(k.thucThu) : '', s: k ? `${(num(k.doanhThuPhatHanh) ? (num(k.thucThu) / num(k.doanhThuPhatHanh)) * 100 : 0).toFixed(1).replace('.', ',')}% trên ${tien(k.doanhThuPhatHanh)} phát hành` : '', nguon: dash },
    { href: '/thu-tien', k: 'Còn phải thu', v: tien(tongNo), s: `${dong.length} hoá đơn · ${nguoi.length} người`, nguon: no, nguy: tongNo > 0 },
    { href: '/toa-nha', k: 'Lấp đầy', v: k ? `${Math.round(num(k.tyLeLapDay))}%` : '', s: k ? `${k.soPhongDangThue}/${k.tongSoPhong} phòng · ${k.soPhongTrong} trống${k.soPhongDangSua ? `, ${k.soPhongDangSua} đang sửa` : ''}` : '', nguon: dash },
    { href: '/su-co', k: 'Sự cố đang mở', v: String(moSuCo.length), s: `${chuaCoTho} chưa phân công thợ`, nguon: suCo },
  ]

  return (
    <>
      <DauTrang phu={`${thu}, ${dinhDangNgayIso(iso)} · ${tenToaDangChon(t) || 'chưa có toà'}${k ? ` · ${k.tongSoPhong} phòng` : ''}${dash.du ? ` · cập nhật ${dash.du.thoiDiemCapNhat.slice(11, 16)}` : ''}`} />
      <Dai cac={dai} />
      <div className="cols">
        <div className="surface">
          <Khoi id="hn-no" tieuDe="Nợ quá hạn theo người" nguon={no} meta={() => `${nguoi.length} người · ${tien(tongNo)}`}
            lienKet={<LienKet href="/thu-tien">Mở Thu tiền <Icon name="arrow-right" size="sm" /></LienKet>}>
            {() => nguoi.length === 0 ? <Xong>Không ai nợ quá hạn</Xong> : nguoi.slice(0, 5).map((g) => (
              <a className="irow" key={g.khoa} href={g.nguoiThueId !== null ? `/nguoi-thue/${g.nguoiThueId}` : '/thu-tien'}>
                <span className={`avatar ${mauAv(g.hoTen)}`} aria-hidden="true">{viTat(g.hoTen)}</span>
                <div className="body"><div className="t">{g.hoTen}</div><div className="s">{g.tenToaNha} · Phòng {g.soPhong} · {g.hoaDon.length} kỳ chưa trả đủ</div></div>
                <StatusTag tone={g.treLauNhat > 0 ? 'urgent' : 'neutral'} icon="clock">{g.treLauNhat > 0 ? `Trễ ${g.treLauNhat} ngày` : 'Chưa đến hạn'}</StatusTag>
                <div className="end hn-tien"><div className="money">{tien(g.conLai)}</div></div>
                <span className="chev"><Icon name="chevron-right" size="sm" /></span>
              </a>
            ))}
          </Khoi>

          <Khoi id="hn-hd" tieuDe="Hợp đồng sắp hết hạn" nguon={hopDong} meta={(hd) => `${sapHet(hd, iso).length} sắp hết hạn · ${hd.filter((h) => h.trangThai === 'CHO_KY').length} chờ ký`}>
            {(hd) => {
              const het = sapHet(hd, iso)
              const choKy = hd.filter((h) => h.trangThai === 'CHO_KY')
              if (!het.length && !choKy.length) return <Xong>Không có hợp đồng sắp hết hạn hay chờ ký</Xong>
              return <>
                {het.map((h) => (
                  <Hang key={h.id} href={`/hop-dong/${h.id}`} tile="warm" icon="contract" tieu={`Phòng ${h.soPhong} · ${h.tenToa}`}
                    phu={`${h.hoTenNguoiThue} · ${tien(h.giaThue)}/tháng · hết ${dinhDangNgayIso(h.ngayKetThuc)}`}
                    cuoi={<StatusTag tone="waiting" icon="clock">Còn {ngayCach(iso, h.ngayKetThuc)} ngày</StatusTag>} />
                ))}
                {choKy.length ? <Hang href="/hop-dong" icon="edit" tieu={`${choKy.length} hợp đồng chờ ký`} phu={choKy.map((h) => `P.${h.soPhong} ${h.tenToa}`).join(' · ')} /> : null}
              </>
            }}
          </Khoi>

          <Khoi id="hn-sc" tieuDe="Sự cố cần quyết" nguon={suCo} meta={() => `${khan.length} khẩn cấp chưa phân công`}>
            {() => khan.length === 0 ? <Xong>Không có sự cố khẩn cấp nào chờ quyết</Xong> : khan.map((s) => (
              <Hang key={s.id} href="/su-co" tile="red" icon="wrench" tieu={`${s.hangMuc} · Phòng ${s.soPhong} ${s.toaNha}`}
                phu={`${s.tenTrangThai} ${ngayNgan(s.taoLuc)} · chưa có thợ · ${s.moTa}`} cuoi={<StatusTag tone="urgent">{s.tenMucDo}</StatusTag>} />
            ))}
          </Khoi>

          <Khoi id="hn-ph" tieuDe="Phòng chưa cho thuê" nguon={phong} meta={(p) => { const c = chiaPhong(p); return `${c.reduce((a, x) => a + x.trong.length, 0)} trống · ${c.reduce((a, x) => a + x.sua.length, 0)} đang sửa` }}>
            {(p) => {
              const c = chiaPhong(p).filter((x) => x.trong.length || x.sua.length)
              if (!c.length) return <Xong>Mọi phòng đều đã có người thuê</Xong>
              return c.map((x) => (
                <Hang key={x.toaNhaId} href={`/toa-nha/${x.toaNhaId}`} icon="door" tieu={tenToa.get(x.toaNhaId) ?? `Toà ${x.toaNhaId}`}
                  phu={[x.trong.length ? `Trống: ${x.trong.join(', ')}` : '', x.sua.length ? `Đang sửa: ${x.sua.join(', ')}` : ''].filter(Boolean).join(' · ')}
                  cuoi={lich.du ? <span className="t-meta hn-cuoi">{lichConHieu.filter((l) => l.toaNhaId === x.toaNhaId).length} lịch hẹn xem</span> : null} />
              ))
            }}
          </Khoi>
        </div>

        <div className="side">
          <The id="hn-lh" tieuDe="Lịch hẹn hôm nay" lienKet={lich.du ? <LienKet href="/lich-hen">{lichConHieu.filter((l) => l.trangThai === 'CHO_XAC_NHAN').length} chờ xác nhận</LienKet> : null}>
            <NoiDung nguon={lich} ten="lịch hẹn">{() => <Hen rong="Không có lịch hẹn hôm nay" ds={lichConHieu.filter((l) => l.thoiGianHen.slice(0, 10) === iso).sort((a, b) => a.thoiGianHen.localeCompare(b.thoiGianHen))
              .map((l) => ({ id: l.id, gio: l.thoiGianHen.slice(11, 16), ten: l.hoTen, phu: `Xem phòng ${l.soPhong} · ${l.tenToaNha}`, tt: l.trangThai }))} />}</NoiDung>
          </The>
          <The id="hn-tt" tieuDe="Còn phải thu theo toà">
            <NoiDung nguon={no} ten="công nợ theo toà">{() => {
              const theo = ds.map((x) => ({ ten: x.ten, v: dong.filter((d) => d.toaNhaId === x.id).reduce((a, d) => a + d.conLai, 0) }))
              const max = Math.max(1, ...theo.map((x) => x.v))
              return <div className="hbars">{theo.map((x) => (
                <div className="hbar" key={x.ten}><span className="hbar-label">{x.ten}</span><span className="hbar-value">{tien(x.v)}</span>
                  <div className="hbar-track"><div className="hbar-fill warm" style={{ width: `${(x.v / max) * 100}%` }} /></div></div>
              ))}</div>
            }}</NoiDung>
          </The>
          <The id="hn-ky" tieuDe={`Kỳ tháng ${Number(iso.slice(5, 7))}`} lienKet={<LienKet href="/chu-ky">Chu kỳ tháng</LienKet>}>
            <p className="t-sm t-2">Ghi chỉ số, chốt kỳ, phát hành hoá đơn và thu tiền của tháng này làm trên một trang.{conNgay > 0 ? ` Chốt sổ ngày ${chotNgay[0]}, còn ${conNgay} ngày.` : ''}</p>
          </The>
        </div>
      </div>
    </>
  )
}

/* ------------------------------- Quản lý --------------------------------- */
// Quản lý không gọi /api/dashboard/chu và /api/bao-cao/cong-no (403): số liệu lấy từ dashboard quản lý + bảng việc của đúng toà được phân công.

const VIEC: Record<string, { icon: IconName; nhan: string; href: string }> = {
  NO_QUA_HAN: { icon: 'receipt', nhan: 'Mở danh sách', href: '/thu-tien' },
  THIEU_CHI_SO: { icon: 'meter', nhan: 'Ghi chỉ số', href: '/chu-ky' },
  HOP_DONG_SAP_HET_HAN: { icon: 'contract', nhan: 'Gia hạn', href: '/hop-dong' },
  SU_CO_TON_DONG: { icon: 'wrench', nhan: 'Mở sự cố', href: '/su-co' },
  PCCC: { icon: 'shield', nhan: 'Mở An toàn', href: '/an-toan' },
}

function HomNayQuanLy({ token }: Pick<TrangProps, 'token'>) {
  const t = useToaDangChon()
  const { iso, thu } = homNayVn()
  const toa = t.toaNhaId ?? t.danhSach[0]?.id ?? null
  const khoa = t.dangTai ? null : `${token}|${toa}`
  const dash = useNguon<ThongTinDashboardQuanLy>(khoa, () => fetchDashboardQuanLy(token, toa))
  const viec = useNguon<ThongTinBangViecVanHanh>(khoa, async () => {
    if (toa === null) throw new Error('Chưa có toà nhà được phân quyền.')
    return fetchBangViecVanHanh(token, toa)
  })
  const k = dash.du?.kpi
  const ct = dash.du?.congToChuaGhi
  const ky = /\d+\/\d+/.exec(ct?.tenKyHienTai ?? '')?.[0] ?? `${iso.slice(5, 7)}/${iso.slice(0, 4)}`
  const thieu = ct?.soCongToChuaGhi ?? 0
  const canLam = (viec.du?.nhomViec ?? []).filter((g) => g.trangThai !== 'DA_XONG' && g.trangThai !== 'CHUA_SAN_SANG').length
  const hen = (dash.du?.lichHenSapToi ?? []).filter((l) => l.thoiGian.slice(0, 10) >= iso).slice(0, 5)

  const dai = [
    { href: '/thu-tien', k: 'Còn phải thu', v: k ? tien(k.khoanConPhaiThu) : '', s: k ? `${k.soHoaDonQuaHan} hoá đơn quá hạn` : '', nguon: dash, nguy: !!k && num(k.khoanConPhaiThu) > 0 },
    { href: '/chu-ky', k: `Công tơ kỳ ${ky}`, v: ct ? `${ct.soCongToDaGhi}/${ct.tongSoCongTo}` : '', s: ct ? `còn ${ct.soCongToChuaGhi} công tơ` : '', nguon: dash },
    { href: '/su-co', k: 'Sự cố cần xử lý', v: k ? String(k.soSuCoCanXuLy) : '', s: 'đang mở trong toà', nguon: dash },
    { href: '/phong', k: 'Lấp đầy', v: k ? `${Math.round(num(k.tyLeLapDay))}%` : '', s: k ? `${k.soPhongDangThue}/${k.tongSoPhong} phòng · ${k.soPhongTrong} trống` : '', nguon: dash },
  ]

  return (
    <>
      <DauTrang phu={`${thu}, ${dinhDangNgayIso(iso)} · ${tenToaDangChon(t) || 'chưa có toà'} · kỳ ${ky} đang mở`} />
      <Dai cac={dai} />
      <div className="cols">
        <div className="surface">
          <Khoi id="hn-ck" tieuDe={`Chu kỳ tháng ${ky}`} nguon={dash} meta={() => `bước ${thieu ? 1 : 2}/4${t.danhSach[0] ? ` · chốt sổ ngày ${t.danhSach[0].ngayChotSo}` : ''}`}
            lienKet={<LienKet href="/chu-ky">Mở chu kỳ <Icon name="arrow-right" size="sm" /></LienKet>}>
            {(d) => <>
              {/* shortcut: chỉ biết bước 1 (ghi chỉ số) từ API; bước 3–4 chưa có nguồn, để chấm xám. Nâng cấp khi có API trạng thái kỳ. */}
              <div className="hn-dots"><div className="dots">{['Ghi chỉ số', 'Chốt kỳ', 'Phát hành', 'Thu tiền'].map((b, i) => <span key={b} className="hn-dot"><i className={i === 0 || (i === 1 && !thieu) ? 'on' : ''} />{i + 1}. {b}</span>)}</div></div>
              <div className="irow">
                <span className={`tile ${thieu ? 'warm' : 'ok'}`}><Icon name={thieu ? 'meter' : 'check'} /></span>
                <div className="body">
                  <div className="t">{thieu ? `Ghi ${thieu} công tơ còn thiếu` : 'Đã ghi đủ công tơ kỳ này'}</div>
                  <div className="s">{thieu ? d.congToChuaGhi.danhSachChuaGhi.map((c) => `${c.tenViTri} · ${c.tenDichVu}`).join(' · ') : 'Chốt kỳ khi đến ngày chốt sổ.'}</div>
                </div>
                <a className="btn btn-primary btn-sm" href="/chu-ky">{thieu ? 'Ghi chỉ số' : 'Mở chu kỳ'}</a>
              </div>
            </>}
          </Khoi>

          <Khoi id="hn-vc" tieuDe="Việc cần làm" nguon={viec} meta={(v) => `${canLam} việc · ${v.nhomViec.filter((g) => g.trangThai === 'DA_XONG').length} đã xong`}>
            {(v) => [...v.nhomViec].sort((x, y) => Number(x.trangThai === 'DA_XONG') - Number(y.trangThai === 'DA_XONG')).map((g) => {
              const m = VIEC[g.ma] ?? { icon: 'shield' as IconName, nhan: 'Mở danh sách', href: '/hom-nay' }
              if (g.trangThai === 'DA_XONG') return <Xong key={g.ma}>{g.tieuDe}: không còn</Xong>
              if (g.trangThai === 'CHUA_SAN_SANG') return <div className="irow done" key={g.ma}><span className="tile"><Icon name={m.icon} /></span><div className="body"><div className="t">{g.tieuDe}</div><div className="s">{g.tenTrangThai}</div></div></div>
              return (
                <a className="irow" key={g.ma} href={m.href}>
                  <span className={`tile ${g.khanCap ? 'red' : 'warm'}`}><Icon name={m.icon} /></span>
                  <div className="body"><div className="t">{g.tieuDe}</div><div className="s">{g.khanCap ? 'Khẩn · ' : ''}{g.tenTrangThai}</div></div>
                  <span className="bignum hn-so">{g.soLuong ?? '—'}</span>
                  <span className="btn btn-secondary btn-sm">{m.nhan}</span>
                </a>
              )
            })}
          </Khoi>
        </div>

        <div className="side">
          <The id="hn-lq" tieuDe="Lịch hẹn xem phòng" lienKet={<LienKet href="/lich-hen">Tất cả</LienKet>}>
            <NoiDung nguon={dash} ten="lịch hẹn">{() => <Hen rong="Chưa có lịch hẹn sắp tới" ds={hen.map((l) => ({ id: l.id, gio: `${ngayNgan(l.thoiGian)} ${l.thoiGian.slice(11, 16)}`, ten: l.hoTen, phu: `Phòng ${l.soPhong.replace(/ \(.*\)$/, '')} · ${l.soDienThoai}`, tt: l.trangThai }))} />}</NoiDung>
          </The>
          <The id="hn-cb" tieuDe="Cảnh báo điện nước">
            <NoiDung nguon={dash} ten="cảnh báo điện nước">{(d) => d.canhBaoDienNuoc.length === 0
              ? <p className="t-sm t-2">Không có cảnh báo tiêu thụ bất thường trong kỳ này.</p>
              : <ul className="tl">{d.canhBaoDienNuoc.slice(0, 3).map((c) => <li key={c.id}><span className="dot red" /><span><b>{c.soPhong ? `Phòng ${c.soPhong}` : c.tenDiemDo}</b><br /><span className="t-meta">{c.lyDo}</span></span><span /></li>)}</ul>}
            </NoiDung>
          </The>
        </div>
      </div>
    </>
  )
}

export default function HomNay({ token, vaiTro }: TrangProps) {
  return vaiTro === 'CHU' ? <div className="hom-nay"><HomNayChu token={token} /></div> : <div className="hom-nay hom-nay-ql"><HomNayQuanLy token={token} /></div>
}
