import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './ThuTien.css'
import { fetchChiSoDichVu, fetchCongNoBaoCao, fetchHoaDonCongNoChiTiet, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, type ThongTinGhiChiSo, type ThongTinHoaDonQuanLy, type ThongTinHopDong, type ThongTinKyThanhToan } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { Field, Input, Select } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { ChanDinh } from './design/layout/ChanDinh'
import { DauTrang } from './design/layout/DauTrang'
import { DongNguoiNo } from './design/money/DongNguoiNo'
import { NganNhacNo } from './design/money/NganNhacNo'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import { HangTong } from './design/table/HangTong'
import FinancePaymentPanel, { message } from './FinancePaymentPanel'
import { collectDeposit, financeRequest, getDeposit, getLedger, localDate, recordPayment, validMoney, type Deposit, type Settlement } from './financeApi'
import { managementRequest } from './managementApi'
import { today, useBuildings } from './ManagementShared'
import { demBoLoc, hangTong, locNo, nhomNo, tuCongNo, tuHoaDonQuanLy, type BoLocNo, type DongNo, type NhomNo } from './nhomNoTheoNguoi'
import { chuanSdt, docSoTien, ghiThuLanLuot, nhanThang, phanBoThu } from './tienTheoNguoi'
import { ngoaiProvider, useToaDangChon } from './toaDangChon'

type Props = { token: string; mobile?: boolean; vaiTro?: string }
type Tab = 'can-thu' | 'da-thu' | 'hoa-don' | 'coc'
type HoaDonToa = ThongTinHoaDonQuanLy & { toaNhaId: number; tenToa: string; ngayPhatHanh?: string | null }
type HopDongToa = ThongTinHopDong & { toaNhaId: number; tenToa: string }
type DuLieu = { dong: DongNo[]; hd: HoaDonToa[]; hop: HopDongToa[]; loiPhu: string | null; luc: string }

const SO_NHOM = 10
const BO_LOC: { khoa: BoLocNo; nhan: string }[] = [{ khoa: 'tat-ca', nhan: 'Tất cả' }, { khoa: 'mot-phan', nhan: 'Đã trả một phần' }, { khoa: 'tre-30', nhan: 'Trễ trên 30 ngày' }]
const tien = (v: string | number) => `${dinhDangTien(typeof v === 'number' ? Math.round(v * 100) / 100 : v)} ₫`
const thangSo = (nt: string) => nt.split('/')[0]
const thangCua = (h: { ngayPhatHanh?: string | null; hanThanhToan: string }) => nhanThang(h)
const hoaDonThat = (h: ThongTinHoaDonQuanLy) => h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY'
const cong = (a: { [k: string]: unknown }[], k: string) => a.reduce((t, x) => t + (Number(x[k]) || 0), 0)
/** Tháng hôm nay và tháng trước dạng "11/2026". */
function haiThang(iso: string) {
  const y = Number(iso.slice(0, 4)); const m = Number(iso.slice(5, 7))
  return { nay: `${m}/${y}`, truoc: m === 1 ? `12/${y - 1}` : `${m - 1}/${y}` }
}
const congNgay = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10)
const gioVn = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) từ các nhóm nợ. */
export function taoCsv(ds: NhomNo[]): string {
  const o = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const hang = [['Họ tên', 'Toà', 'Phòng', 'Số kỳ', 'Trễ lâu nhất (ngày)', 'Còn nợ'], ...ds.map((g) => [g.hoTen, g.tenToaNha, g.soPhong, g.hoaDon.length, g.treLauNhat, g.conLai])]
  return `\uFEFF${hang.map((h) => h.map(o).join(',')).join('\r\n')}`
}

/** Trạng thái lọc/trang/tab nằm trên URL (replaceState) để Back và tải lại giữ nguyên; `popstate` đồng bộ khi khung đổi tab. */
function useQuery() {
  const [search, setSearch] = useState(() => window.location.search)
  useEffect(() => {
    const dongBo = () => setSearch(window.location.search)
    window.addEventListener('popstate', dongBo)
    return () => window.removeEventListener('popstate', dongBo)
  }, [])
  const p = useMemo(() => new URLSearchParams(search), [search])
  const dat = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(window.location.search)
    for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k) }
    const qs = n.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    setSearch(window.location.search)
  }
  return { p, dat }
}

/** FR-INV-11/14 and FR-TNT-08/09 connect collection, deposits and settlement to the accounting services. */
export default function ThuTien({ token, mobile = false, vaiTro }: Props) {
  const chung = useToaDangChon()
  const { buildings, buildingId, setBuildingId } = useBuildings(token)
  const { p, dat } = useQuery()
  const laChu = vaiTro === 'CHU'
  // Chủ: null = mọi toà. Quản lý chỉ có một toà (khung đã chọn sẵn); ngoài khung (test) lấy toà đầu.
  const toaId = laChu ? buildingId : buildingId ?? buildings[0]?.id ?? null
  const toa = toaId === null ? null : buildings.find((b) => b.id === toaId) ?? null
  const choToa = laChu ? (ngoaiProvider(chung) ? buildings.length === 0 : chung.dangTai) : toa === null
  const ids = toaId === null ? buildings.map((b) => b.id) : [toaId]
  const tabP = p.get('tab')
  const tab: Tab = tabP === 'da-thu' || tabP === 'hoa-don' || tabP === 'coc' ? tabP : 'can-thu'
  const loc = BO_LOC.find((b) => b.khoa !== 'tat-ca' && b.khoa === p.get('loc'))?.khoa ?? 'tat-ca'
  const q = p.get('q') ?? ''
  const xem = p.get('xem')
  const { iso: homNay } = { iso: today() }
  const { nay, truoc } = haiThang(homNay)

  const [du, setDu] = useState<DuLieu | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [chon, setChon] = useState<Set<string>>(new Set())
  const [nganThu, setNganThu] = useState<string | null>(null) // khoá nhóm đang ghi thu
  const [hangNhac, setHangNhac] = useState<NhomNo[]>([])
  const [hoaDonRieng, setHoaDonRieng] = useState<number | null>(null)
  const [thongBao, setThongBao] = useState('')
  const [sdt, setSdt] = useState<Map<number, string>>(new Map())
  const daMoTuUrl = useRef('')
  const idsKey = ids.join(',')

  useEffect(() => {
    if (choToa) return
    let active = true
    setLoi(null)
    const ten = (id: number) => buildings.find((b) => b.id === id)?.ten ?? ''
    const phu = Promise.all([
      Promise.all(ids.map(async (id) => (await fetchHoaDonQuanLy(token, id, '')).map((d) => ({ ...d, toaNhaId: id, tenToa: ten(id) }) as HoaDonToa))),
      Promise.all(ids.map(async (id) => (await fetchHopDongQuanLy(token, id)).map((h) => ({ ...h, toaNhaId: id, tenToa: ten(id) })))),
    ]).then(([hd, hop]) => ({ hd: hd.flat(), hop: hop.flat(), loiPhu: null as string | null }))
    const tai: Promise<DuLieu> = laChu
      ? Promise.all([fetchCongNoBaoCao(token, null), phu.catch((e: unknown) => ({ hd: [] as HoaDonToa[], hop: [] as HopDongToa[], loiPhu: message(e) }))])
        .then(([r, o]) => ({ dong: tuCongNo(r.congNo), ...o, luc: gioVn() }))
      : phu.then((o) => ({ dong: tuHoaDonQuanLy(o.hd, toa!, today(), o.hop), ...o, luc: gioVn() }))
    tai.then((d) => { if (active) setDu(d) }).catch((cause: unknown) => { if (active) setLoi(message(cause)) })
    return () => { active = false }
  }, [token, laChu, choToa, idsKey, reload]) // eslint-disable-line react-hooks/exhaustive-deps
  // SĐT: vai trò không đọc được thì bỏ qua lặng lẽ (không có SĐT = không có Gọi/Zalo).
  useEffect(() => {
    let active = true
    managementRequest<{ id: number; soDienThoai?: string | null }[]>(token, '/api/nguoi-thue').then((r) => { if (active) setSdt(new Map(r.map((n) => [n.id, n.soDienThoai ?? '']))) }).catch(() => undefined)
    return () => { active = false }
  }, [token])

  const dongToa = useMemo(() => (du?.dong ?? []).filter((d) => !laChu || toaId === null || d.toaNhaId === toaId), [du, laChu, toaId])
  const nhom = useMemo(() => nhomNo(dongToa, 'nguoi'), [dongToa])
  const dem = useMemo(() => demBoLoc(nhom), [nhom])
  const hienThi = useMemo(() => locNo(nhom, loc, q), [nhom, loc, q])
  const tong = useMemo(() => hangTong(hienThi), [hienThi])
  const tongNo = nhom.reduce((a, g) => a + g.conLai, 0)
  const soTrang = Math.max(1, Math.ceil(hienThi.length / SO_NHOM))
  const trang = Math.min(soTrang, Math.max(1, Number(p.get('trang')) || 1))
  const trangHienTai = hienThi.slice((trang - 1) * SO_NHOM, trang * SO_NHOM)
  const hdToa = useMemo(() => (du?.hd ?? []).filter(hoaDonThat), [du])
  const thangNay = useMemo(() => hdToa.filter((h) => thangCua(h) === nay), [hdToa, nay])
  const thangTruoc = useMemo(() => hdToa.filter((h) => thangCua(h) === truoc), [hdToa, truoc])
  const hopCoc = useMemo(() => (du?.hop ?? []).filter((h) => h.trangThai !== 'DA_THANH_LY' && Number(h.tienCoc) > 0), [du])
  const nhomNgan = nganThu ? nhom.find((g) => g.khoa === nganThu) ?? null : null

  // Chỉ tính nhóm còn hiện sau lọc: lọc/tìm lại thì phần đã chọn ngoài danh sách tự rơi ra.
  const daChon = useMemo(() => hienThi.filter((g) => chon.has(g.khoa)), [hienThi, chon])
  const doiChon = (ds: NhomNo[], bat: boolean) => setChon((s) => { const n = new Set(s); ds.forEach((g) => (bat ? n.add(g.khoa) : n.delete(g.khoa))); return n })
  useEffect(() => {
    if (chon.size === 0 || nganThu || hangNhac.length) return
    const thoat = (e: KeyboardEvent) => { if (e.key === 'Escape') setChon(new Set()) }
    document.addEventListener('keydown', thoat)
    return () => document.removeEventListener('keydown', thoat)
  }, [chon.size, nganThu, hangNhac.length])
  const xuatCsv = () => {
    const url = URL.createObjectURL(new Blob([taoCsv(daChon.length ? daChon : hienThi)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'can-thu.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Mở từ nơi khác: ?hoaDonId= mở đúng hoá đơn bằng ngăn cũ; ?nguoiThueId= mở ngăn ghi thu của người đó (không nợ thì không mở).
  useEffect(() => {
    const hoaDonId = Number(p.get('hoaDonId')) || null
    const nguoiThueId = Number(p.get('nguoiThueId')) || null
    const khoa = `${hoaDonId ?? ''}|${nguoiThueId ?? ''}`
    if (du === null || khoa === '|' || khoa === daMoTuUrl.current) return
    daMoTuUrl.current = khoa
    if (hoaDonId) setHoaDonRieng(hoaDonId)
    else { const g = nhomNo(du.dong, 'nguoi').find((x) => x.nguoiThueId === nguoiThueId); if (g) setNganThu(g.khoa) }
  }, [du, p])
  useEffect(() => {
    if (!thongBao) return
    const hen = setTimeout(() => setThongBao(''), 4000)
    return () => clearTimeout(hen)
  }, [thongBao])
  const xoaUrl = () => { daMoTuUrl.current = ''; if (p.has('hoaDonId') || p.has('nguoiThueId')) dat({ hoaDonId: null, nguoiThueId: null }) }
  const dongNgan = () => { setNganThu(null); setHoaDonRieng(null); xoaUrl() }
  const taiLai = () => setReload((v) => v + 1)

  const tenToa = toa?.ten ?? `Tất cả ${buildings.length} toà`
  const datLoc = (patch: Record<string, string | null>) => dat({ trang: null, xem: null, ...patch })
  const boLoc = () => datLoc({ loc: null, q: null })
  const sangTab = (t: Tab) => dat({ tab: t === 'can-thu' ? null : t, trang: null, xem: null, loc: null, q: null })
  const moNganChinh = () => { if (nhom[0]) setNganThu((hienThi[0] ?? nhom[0]).khoa) }
  const hanTra = dinhDangNgayIso(congNgay(homNay, 4))
  const sdtCua = (g: NhomNo) => (g.nguoiThueId !== null ? sdt.get(g.nguoiThueId) ?? null : null)
  const nutGhiThu = <Button variant="primary" blocked={nhom.length === 0} blockedReason={nhom.length === 0 ? 'Không ai còn nợ.' : undefined} onClick={moNganChinh}>Ghi thu tiền</Button>
  const nutExcel = tab === 'can-thu' && nhom.length > 0 ? <Button variant="secondary" onClick={xuatCsv}>Xuất Excel</Button> : null
  const dsTheoToa = laChu && toaId === null && buildings.length > 1 && !mobile && du ? buildings.map((b) => {
    const n = nhomNo((du.dong).filter((d) => d.toaNhaId === b.id))
    const truocB = (du.hd).filter((h) => hoaDonThat(h) && h.toaNhaId === b.id && thangCua(h) === truoc)
    const tra = cong(truocB as never, 'tongTien')
    return { b, no: n.reduce((a, g) => a + g.conLai, 0), soNguoi: n.length, pt: tra ? Math.round((cong(truocB as never, 'daThu') / tra) * 100) : 0 }
  }) : []

  const tabs: { khoa: Tab; nhan: string; n: number | null }[] = [
    { khoa: 'can-thu', nhan: 'Còn nợ', n: du ? nhom.length : null },
    { khoa: 'da-thu', nhan: `Đã thu tháng ${thangSo(nay)}`, n: du ? thangNay.length : null },
    { khoa: 'hoa-don', nhan: `Hoá đơn tháng ${thangSo(truoc)}`, n: du ? thangTruoc.length : null },
    { khoa: 'coc', nhan: 'Tiền cọc', n: du ? hopCoc.length : null },
  ]

  return <section data-testid="collection-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="thu-tien-title" className="tt-trang">
    <DauTrang tieuDe={<span id="thu-tien-title">{laChu ? 'Tiền' : 'Thu tiền'}</span>}
      phu={<>{tenToa}{du ? <> · còn phải thu <b className="tt-do">{tien(tongNo)}</b> của {nhom.length} người · số liệu lúc {du.luc}</> : null}</>}
      hanhDong={mobile ? undefined : <>{nutExcel}{nutGhiThu}</>} />
    {dsTheoToa.length > 0 ? <div className="tt-dai" aria-label="Còn nợ theo toà">{dsTheoToa.map((x) => (
      <button key={x.b.id} type="button" className="tt-dai-o" onClick={() => setBuildingId(x.b.id)}>
        <span className="tt-dai-ten">{x.b.ten}</span>
        <span className="tt-dai-no">{tien(x.no)}</span>
        <span className="tt-dai-phu">{x.soNguoi} người nợ · tháng {thangSo(truoc)} đã thu {x.pt}%</span>
        <span className="tt-thanh" aria-hidden="true"><i style={{ width: `${x.pt}%` }} /></span>
      </button>))}</div> : null}
    <section className="card flush tt-the" aria-label="Tiền theo người">
      <div className="tabs" role="tablist" aria-label="Phân loại tiền">
        {tabs.map((t) => <button key={t.khoa} type="button" role="tab" className="tab" aria-selected={tab === t.khoa} onClick={() => sangTab(t.khoa)}>{t.nhan}{t.n !== null ? <span className="n">{t.n}</span> : null}</button>)}
      </div>
      {tab === 'coc' ? <TabCoc token={token} hop={hopCoc} dang={du === null && !loi} loi={loi} thuLai={taiLai} hienToa={toaId === null} taiLai={taiLai} />
        : tab === 'da-thu' || tab === 'hoa-don' ? <BangHoaDon rows={tab === 'da-thu' ? thangNay : thangTruoc} dang={du === null && !loi} loi={loi ?? du?.loiPhu ?? null} thuLai={taiLai} hienToa={toaId === null} nhan={tab === 'da-thu' ? `tháng ${thangSo(nay)}` : `tháng ${thangSo(truoc)}`} />
          : <>
            {mobile ? null : <div className="tt-cong-cu">
              <label className="check"><input type="checkbox" checked={hienThi.length > 0 && daChon.length === hienThi.length} onChange={(e) => doiChon(hienThi, e.target.checked)} /><span>Chọn tất cả</span></label>
              <span className="t-meta">Chọn để nhắc nhiều người</span>
              {daChon.length > 0 ? <Button size="sm" variant="secondary" onClick={() => setHangNhac(daChon)}>Nhắc người đã chọn ({daChon.length})</Button> : null}
              <span className="push" />
              <label className="input-wrap tt-tim"><span className="sr-only">Tìm trong danh sách còn nợ</span><input className="input" type="search" placeholder="Tìm người, phòng, mã hoá đơn" value={q} onChange={(e) => datLoc({ q: e.target.value })} /></label>
              {BO_LOC.map((b) => <button key={b.khoa} type="button" className="chip" aria-pressed={loc === b.khoa} onClick={() => datLoc({ loc: b.khoa === 'tat-ca' ? null : b.khoa })}>{b.nhan}<span className="n">{dem[b.khoa]}</span></button>)}
            </div>}
            {mobile ? <div className="tt-cong-cu tt-cong-cu-m">{BO_LOC.map((b) => <button key={b.khoa} type="button" className="chip" aria-pressed={loc === b.khoa} onClick={() => datLoc({ loc: b.khoa === 'tat-ca' ? null : b.khoa })}>{b.nhan}<span className="n">{dem[b.khoa]}</span></button>)}</div> : null}
            {loi ? <EmptyState kind="error" title={loi} body="Dữ liệu chưa bị thay đổi." actionLabel="Tải lại" onAction={taiLai} />
              : du === null ? <div aria-busy="true" role="status" aria-label="Đang tải danh sách còn nợ" className="tt-skel">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel skel-line" />)}</div>
                : nhom.length === 0 ? <EmptyState title="Không ai còn nợ." body={<a href="/thu-tien?tab=hoa-don" onClick={(e) => { e.preventDefault(); sangTab('hoa-don') }}>Xem hoá đơn tháng {thangSo(truoc)}</a>} />
                  : hienThi.length === 0 ? <EmptyState kind="filtered" title="Không có người nào khớp bộ lọc." actionLabel="Bỏ lọc" onAction={boLoc} />
                    : <>
                      {mobile
                        ? <div className="tt-ds-m">{trangHienTai.map((g) => <DongNguoiNo key={g.khoa} nhom={g} rut hienToa={toaId === null} sdt={sdtCua(g)} hrefHoSo={g.nguoiThueId !== null ? `/nguoi-thue/${g.nguoiThueId}` : undefined} />)}
                          <p className="tt-cong-m"><span>Cộng {tong.soNhom} người</span><b className="tt-do">{tien(tong.conLai)}</b></p></div>
                        : <div className="table-wrap"><table className="table tt-bang">
                          <thead><tr>
                            <th scope="col" style={{ width: 40 }}><span className="sr-only">Chọn</span></th>
                            <th scope="col">Người thuê</th><th scope="col">Nợ mấy tháng</th>
                            <th scope="col" className="num">Đã trả</th><th scope="col" className="num">Còn nợ</th>
                            <th scope="col"><span className="sr-only">Việc cần làm</span></th>
                          </tr></thead>
                          <tbody>
                            {trangHienTai.map((g) => <HangNguoi key={g.khoa} g={g} hienToa={toaId === null} sdt={sdtCua(g)} chon={chon.has(g.khoa)} doiChon={(bat) => doiChon([g], bat)} mo={xem === g.khoa} doiMo={() => dat({ xem: xem === g.khoa ? null : g.khoa })} nhac={() => setHangNhac([g])} ghiThu={() => setNganThu(g.khoa)} />)}
                          </tbody>
                          <tfoot><HangTong canhPhai={[3, 4]} o={['', `Cộng ${tong.soNhom} người`, `${tong.soKy} hoá đơn`, tien(tong.daThu), <span key="n" className="tt-do">{tien(tong.conLai)}</span>, '']} /></tfoot>
                        </table></div>}
                      <div className="pager"><span>{(trang - 1) * SO_NHOM + 1}–{(trang - 1) * SO_NHOM + trangHienTai.length} trong {hienThi.length} người</span><span className="push" />
                        <button type="button" className="pg" aria-label="Trang trước" disabled={trang <= 1} onClick={() => dat({ trang: trang - 1 > 1 ? String(trang - 1) : null, xem: null })}>‹</button>
                        {Array.from({ length: soTrang }, (_, i) => i + 1).map((n) => <button key={n} type="button" className="pg" aria-current={n === trang ? 'page' : undefined} onClick={() => dat({ trang: n > 1 ? String(n) : null, xem: null })}>{n}</button>)}
                        <button type="button" className="pg" aria-label="Trang sau" disabled={trang >= soTrang} onClick={() => dat({ trang: String(trang + 1), xem: null })}>›</button>
                      </div>
                    </>}
          </>}
    </section>
    {mobile && tab === 'can-thu' ? <ChanDinh>{nutGhiThu}</ChanDinh> : null}
    {nhomNgan ? <GhiThuNgan key={nhomNgan.khoa} token={token} nhom={nhomNgan} dsNguoi={nhom} doiNguoi={setNganThu} onDong={dongNgan} taiLai={taiLai}
      onXong={(tinNhan) => { dongNgan(); taiLai(); setThongBao(tinNhan) }} /> : null}
    {hoaDonRieng !== null ? <NganGhiNhan token={token} laChu={laChu} tho={du?.hd ?? []} hoaDonId={hoaDonRieng} onDong={dongNgan} onDaGhi={() => { dongNgan(); taiLai(); setThongBao('Đã ghi nhận giao dịch thu tiền.') }} /> : null}
    {hangNhac[0] ? <NganNhacNo key={hangNhac[0].khoa} nhom={hangNhac[0]} sdt={sdtCua(hangNhac[0])} hanTra={hanTra} onDong={() => setHangNhac((h) => h.slice(1))} /> : null}
    {thongBao ? <Toast style={{ position: 'fixed', zIndex: 90, left: 16, right: 16, bottom: 16, maxWidth: 420, margin: '0 auto' }}>{thongBao}</Toast> : null}
  </section>
}

function HangNguoi({ g, hienToa, sdt, chon, doiChon, mo, doiMo, nhac, ghiThu }: { g: NhomNo; hienToa: boolean; sdt: string | null; chon: boolean; doiChon: (bat: boolean) => void; mo: boolean; doiMo: () => void; nhac: () => void; ghiThu: () => void }) {
  const dt = chuanSdt(sdt)
  const idCon = `con-${g.khoa}`
  return <>
    <tr className={`tt-hang${chon ? ' is-selected' : ''}${mo ? ' is-open' : ''}`} onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button,input,label')) doiMo() }}>
      <td><label className="check"><input type="checkbox" checked={chon} onChange={(e) => doiChon(e.target.checked)} /><span className="sr-only">Chọn {g.hoTen}</span></label></td>
      <td>{g.nguoiThueId !== null ? <a className="td-main" href={`/nguoi-thue/${g.nguoiThueId}`}>{g.hoTen}</a> : <span className="td-main">{g.hoTen}</span>}
        <div className="td-sub">{hienToa ? `${g.tenToaNha} · ` : ''}phòng {g.soPhong}</div></td>
      <td><button type="button" className="tt-thang" aria-expanded={mo} aria-controls={idCon} onClick={doiMo}><b>{g.hoaDon.length} tháng</b><span className="td-sub">từ tháng {nhanThang(g.hoaDon[0])}</span></button></td>
      <td className="num">{tien(g.daThu)}</td>
      <td className="num tt-con">{tien(g.conLai)}</td>
      <td><div className="td-acts">{dt ? <a className="btn btn-secondary btn-sm" href={`tel:${dt}`} aria-label={`Gọi ${g.hoTen}`}>Gọi</a> : null}
        <button type="button" className="btn btn-secondary btn-sm" aria-label={`Nhắc ${g.hoTen}`} onClick={nhac}>Nhắc</button>
        <button type="button" className="btn btn-secondary btn-sm" aria-label={`Ghi thu ${g.hoTen}`} onClick={ghiThu}>Ghi thu</button></div></td>
    </tr>
    {mo ? g.hoaDon.map((h, i) => <tr key={h.hoaDonId} id={i === 0 ? idCon : undefined} className="tt-con-hang">
      <td />
      <td>Tháng {nhanThang(h)} · hạn {dinhDangNgayIso(h.hanThanhToan.slice(0, 10))}</td>
      <td className={h.soNgayQuaHan > 0 ? 'tt-do' : undefined}>{h.soNgayQuaHan > 0 ? `trễ ${h.soNgayQuaHan} ngày` : 'chưa đến hạn'}</td>
      <td className="num">{tien(h.daThu)}</td>
      <td className="num">{tien(h.conLai)}</td>
      <td />
    </tr>) : null}
  </>
}

/** Ngăn "Ghi thu" một lần cho một người: số tiền tự chia từ tháng cũ nhất, ghi lần lượt từng hoá đơn bằng API thu tiền sẵn có. */
function GhiThuNgan({ token, nhom, dsNguoi, doiNguoi, onDong, onXong, taiLai }: { token: string; nhom: NhomNo; dsNguoi: NhomNo[]; doiNguoi: (khoa: string) => void; onDong: () => void; onXong: (tinNhan: string) => void; taiLai: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef: ref, onClose: onDong })
  const [soTien, setSoTien] = useState(() => dinhDangTien(nhom.conLai))
  const [hinhThuc, setHinhThuc] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT')
  const [ngayThu, setNgayThu] = useState(localDate)
  const [busy, setBusy] = useState(false)
  const [loiGhi, setLoiGhi] = useState<string | null>(null)
  useEffect(() => { setSoTien(dinhDangTien(nhom.conLai)) }, [nhom.conLai])
  const n = docSoTien(soTien)
  const { phanBo, loi } = n === null ? { phanBo: [], loi: 'Nhập số tiền, ví dụ 1.895.000' } : phanBoThu(nhom.hoaDon, n)
  const thangCuaHd = (id: number) => nhanThang(nhom.hoaDon.find((h) => h.hoaDonId === id)!)
  async function ghi() {
    if (loi || busy) return
    setBusy(true); setLoiGhi(null)
    const kq = await ghiThuLanLuot(phanBo, async (p) => recordPayment(token, await getLedger(token, p.hoaDonId), { soTien: String(p.soTien), hinhThuc, ngayThu, xacNhanThuThem: false }))
    setBusy(false)
    if (!kq.loi) { onXong(`Đã ghi thu ${tien(n!)} của phòng ${nhom.soPhong}`); return }
    const xong = kq.daGhi.length ? `Đã ghi tháng ${kq.daGhi.map((p) => thangCuaHd(p.hoaDonId)).join(', ')} (${tien(kq.daGhi.reduce((a, p) => a + p.soTien, 0))}).` : 'Chưa ghi được tháng nào.'
    setLoiGhi(`${xong} Tháng ${thangCuaHd(kq.loi.hoaDonId)} lỗi: ${kq.loi.thongBao}. Đã tải lại số mới.`)
    taiLai()
  }
  return createPortal(<div className="tt-nen">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="ngan-ghi-thu-td" tabIndex={-1} className="drawer tt-ngan">
      <div className="drawer-h">
        <div className="tt-ngan-dau"><h2 className="h2" id="ngan-ghi-thu-td">Ghi thu</h2><Button size="sm" variant="secondary" onClick={onDong}>Đóng</Button></div>
        <p className="t-sm tt-ngan-phu">{nhom.hoTen} · phòng {nhom.soPhong} · Còn nợ <b className="tt-do">{tien(nhom.conLai)}</b> ({nhom.hoaDon.length} tháng)</p>
      </div>
      <div className="drawer-b">
        {dsNguoi.length > 1 ? <Field label="Người nộp"><Select value={nhom.khoa} onChange={(e) => doiNguoi(e.target.value)}>{dsNguoi.map((g) => <option key={g.khoa} value={g.khoa}>{g.hoTen} · phòng {g.soPhong} · {tien(g.conLai)}</option>)}</Select></Field> : null}
        <Field label="Số tiền thu" error={loi ?? undefined}><Input inputMode="numeric" value={soTien} onChange={(e) => setSoTien(e.target.value)} /></Field>
        <Field label="Hình thức"><Select value={hinhThuc} onChange={(e) => setHinhThuc(e.target.value as typeof hinhThuc)}><option value="TIEN_MAT">Tiền mặt</option><option value="CHUYEN_KHOAN">Chuyển khoản</option></Select></Field>
        <Field label="Ngày thu"><Input type="date" value={ngayThu} onChange={(e) => setNgayThu(e.target.value)} /></Field>
        {phanBo.length ? <div className="tt-xem-truoc"><h3 className="h3">Sẽ trừ vào</h3>{phanBo.map((p) => <p key={p.hoaDonId}>Tháng {thangCuaHd(p.hoaDonId)} — {tien(p.soTien)}</p>)}</div> : null}
        {loiGhi ? <p role="alert" className="alert alert-danger">{loiGhi}</p> : null}
      </div>
      <div className="drawer-f"><Button variant="primary" blocked={!!loi || busy} blockedReason={busy ? 'Đang ghi…' : loi ?? undefined} onClick={() => void ghi()}>{n === null ? 'Ghi thu' : `Ghi thu ${tien(n)}`}</Button></div>
    </div>
  </div>, document.body)
}

/** Ngăn cho MỘT hoá đơn (?hoaDonId=): giữ FinancePaymentPanel đúng props cũ cho y5/y6. */
function NganGhiNhan({ token, laChu, tho, hoaDonId, onDong, onDaGhi }: { token: string; laChu: boolean; tho: ThongTinHoaDonQuanLy[]; hoaDonId: number; onDong: () => void; onDaGhi: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useDialogTrap({ open: true, dialogRef: ref, onClose: onDong })
  const [hd, setHd] = useState<{ hoaDonId: number; maHoaDon: string; conLai: string; trangThai: string; soPhong: string; nguoiThue: string } | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  useEffect(() => {
    setHd(null); setLoi(null)
    let active = true
    if (laChu) {
      fetchHoaDonCongNoChiTiet(token, hoaDonId).then((d) => { if (active) setHd(d) }).catch((cause: unknown) => { if (active) setLoi(message(cause)) })
    } else {
      const d = tho.find((x) => x.hoaDonId === hoaDonId)
      if (d) setHd(d); else setLoi('Không tìm thấy hoá đơn này ở toà đang chọn.')
    }
    return () => { active = false }
  }, [token, laChu, hoaDonId, tho])
  return createPortal(<div className="tt-nen">
    <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby="ngan-thu-tien-title" tabIndex={-1} className="drawer tt-ngan">
      <div className="drawer-h">
        <div className="tt-ngan-dau"><h2 className="h2" id="ngan-thu-tien-title">Ghi thu một hoá đơn</h2><Button size="sm" variant="secondary" onClick={onDong}>Đóng</Button></div>
        {hd ? <p className="t-sm tt-ngan-phu">Phòng {hd.soPhong} · {hd.nguoiThue} · Còn phải thu <b>{dinhDangTien(hd.conLai)} ₫</b></p> : null}
      </div>
      <div className="drawer-b">
        {loi ? <EmptyState kind="error" title={loi} body="Dữ liệu chưa bị thay đổi." actionLabel="Đóng" onAction={onDong} />
          : !hd ? <EmptyState kind="loading" title="Đang tải hoá đơn…" />
            : <FinancePaymentPanel key={hd.hoaDonId} token={token} hoaDonId={hd.hoaDonId} maHoaDon={hd.maHoaDon} conLai={hd.conLai} trangThai={hd.trangThai} onChanged={onDaGhi} />}
      </div>
    </aside>
  </div>, document.body)
}

/** Đã thu tháng này / Hoá đơn tháng trước: bảng phẳng mỗi hoá đơn một dòng, kèm hàng tổng. */
function BangHoaDon({ rows, dang, loi, thuLai, hienToa, nhan }: { rows: HoaDonToa[]; dang: boolean; loi: string | null; thuLai: () => void; hienToa: boolean; nhan: string }) {
  const cot: DataTableColumn<HoaDonToa>[] = useMemo(() => [
    { key: 'phong', label: 'Phòng', the: 'tieu-de', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <><span className="td-main">{h.soPhong}</span>{hienToa ? <div className="td-sub">{h.tenToa}</div> : null}</> },
    { key: 'nguoi', label: 'Người thuê', sortable: true, sortValue: (h) => h.nguoiThue, render: (h) => h.nguoiThue },
    { key: 'han', label: 'Hạn trả', sortable: true, sortValue: (h) => h.hanThanhToan, render: (h) => dinhDangNgayIso(h.hanThanhToan.slice(0, 10)) },
    { key: 'tong', label: 'Phải trả', align: 'num', sortable: true, sortValue: (h) => Number(h.tongTien), render: (h) => tien(h.tongTien) },
    { key: 'da', label: 'Đã trả', align: 'num', render: (h) => tien(h.daThu) },
    { key: 'con', label: 'Còn nợ', align: 'num', sortable: true, sortValue: (h) => Number(h.conLai), render: (h) => <span className={Number(h.conLai) > 0 ? 'tt-do' : undefined}>{tien(h.conLai)}</span> },
    { key: 'tt', label: 'Trạng thái', render: (h) => Number(h.conLai) <= 0 ? <StatusTag tone="done">Đã trả đủ</StatusTag> : Number(h.daThu) > 0 ? <StatusTag tone="waiting">Trả một phần</StatusTag> : <StatusTag tone="urgent">Chưa trả</StatusTag> },
  ], [hienToa])
  if (loi) return <EmptyState kind="error" title={loi} body="Dữ liệu chưa bị thay đổi." actionLabel="Tải lại" onAction={thuLai} />
  if (dang) return <EmptyState kind="loading" title="Đang tải hoá đơn…" />
  if (rows.length === 0) return <EmptyState title={`Chưa có hoá đơn ${nhan}.`} body="Hoá đơn xuất hiện ở đây khi được gửi đi." />
  return <div className="tt-hd"><DataTable rows={rows} columns={cot} getRowId={(h) => h.hoaDonId} timTheo={(h) => `${h.maHoaDon} ${h.soPhong} ${h.nguoiThue} ${h.tenToa}`} searchLabel="Tìm người thuê, phòng, mã hoá đơn" noun="hoá đơn" pageSize={10}
    tongHang={[`Cộng ${rows.length} hoá đơn`, '', '', tien(cong(rows as never, 'tongTien')), tien(cong(rows as never, 'daThu')), <span key="c" className="tt-do">{tien(cong(rows as never, 'conLai'))}</span>, '']} /></div>
}

/** Tiền cọc: bảng hợp đồng + "Thu cọc / quyết toán" (ContractFinance giữ nguyên) mở ngay dưới bảng. */
function TabCoc({ token, hop, dang, loi, thuLai, hienToa, taiLai }: { token: string; hop: HopDongToa[]; dang: boolean; loi: string | null; thuLai: () => void; hienToa: boolean; taiLai: () => void }) {
  const [chonHd, setChonHd] = useState<number | null>(null)
  const [periods, setPeriods] = useState<ThongTinKyThanhToan[]>([])
  const [loiKy, setLoiKy] = useState<string | null>(null)
  const dangChon = hop.find((h) => h.id === chonHd) ?? null
  useEffect(() => {
    setPeriods([]); setLoiKy(null)
    if (!dangChon) return
    let active = true
    fetchKyThanhToan(token, dangChon.toaNhaId).then((k) => { if (active) setPeriods(k) }).catch((cause: unknown) => { if (active) setLoiKy(message(cause)) })
    return () => { active = false }
  }, [token, dangChon?.toaNhaId]) // eslint-disable-line react-hooks/exhaustive-deps
  const hang = useMemo(() => [...hop].sort((a, b) => a.soPhong.localeCompare(b.soPhong, 'vi', { numeric: true })), [hop])
  const cot: DataTableColumn<HopDongToa>[] = useMemo(() => [
    { key: 'phong', label: 'Phòng', the: 'tieu-de', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <><a className="td-main" href={`/hop-dong/${h.id}`}>Phòng {h.soPhong}</a>{hienToa ? <div className="td-sub">{h.tenToa}</div> : null}</> },
    { key: 'nguoi', label: 'Người thuê', sortable: true, sortValue: (h) => h.hoTenNguoiThue, render: (h) => h.hoTenNguoiThue },
    { key: 'den', label: 'Hợp đồng đến', sortable: true, sortValue: (h) => h.ngayKetThuc, render: (h) => dinhDangNgayIso(h.ngayKetThuc) },
    { key: 'coc', label: 'Cọc đang giữ', align: 'num', sortable: true, sortValue: (h) => Number(h.tienCoc), render: (h) => tien(h.tienCoc) },
    { key: 'thaoTac', label: 'Thu cọc', align: 'num', the: 'hanh-dong', render: (h) => <div className="td-acts"><button type="button" className="btn btn-secondary btn-sm" aria-pressed={chonHd === h.id} aria-label={`Thu cọc hợp đồng ${h.id}`} onClick={() => setChonHd(h.id)}>Thu cọc</button></div> },
  ], [hienToa, chonHd])
  if (loi) return <EmptyState kind="error" title={loi} body="Dữ liệu chưa bị thay đổi." actionLabel="Tải lại" onAction={thuLai} />
  if (dang) return <EmptyState kind="loading" title="Đang tải tiền cọc…" />
  if (hop.length === 0) return <EmptyState title="Chưa có tiền cọc nào đang giữ." />
  return <div className="tt-hd">
    <DataTable rows={hang} columns={cot} getRowId={(h) => h.id} timTheo={(h) => `${h.soPhong} ${h.hoTenNguoiThue}`} searchLabel="Tìm phòng, người thuê" noun="hợp đồng" pageSize={10}
      tongHang={[`Cộng ${hop.length} hợp đồng`, '', '', tien(cong(hop as never, 'tienCoc')), '']} />
    {loiKy ? <p role="alert" className="alert alert-danger">{loiKy}</p> : null}
    {dangChon ? <Card><ContractFinance key={dangChon.id} token={token} toaNhaId={dangChon.toaNhaId} contract={dangChon} periods={periods} onChanged={taiLai} /></Card> : null}
  </div>
}

function ContractFinance({ token, toaNhaId, contract, periods, onChanged }: { token: string; toaNhaId: number; contract: ThongTinHopDong; periods: ThongTinKyThanhToan[]; onChanged: () => void }) {
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(localDate)
  const [reason, setReason] = useState('')
  const [damage, setDamage] = useState('0')
  const [settlementReason, setSettlementReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [acknowledge, setAcknowledge] = useState(false)
  const [meters, setMeters] = useState<ThongTinGhiChiSo['phong'][number]['dichVu']>([])
  const [readings, setReadings] = useState<Record<number, string>>({})
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const openPeriod = periods.find((value) => value.trangThai === 'DANG_MO')
  useEffect(() => {
    let active = true
    getDeposit(token, contract.id).then((value) => { if (active) { setDeposit(value); setAmount(value.conLaiChuaThu) } }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, contract.id, reload])
  useEffect(() => {
    if (!openPeriod || contract.trangThai === 'DA_THANH_LY') return
    let active = true
    fetchChiSoDichVu(token, toaNhaId, openPeriod.id).then((value) => {
      if (!active) return
      const rows = value.phong.find((value) => value.id === contract.phongId)?.dichVu ?? []
      setMeters(rows); setReadings(Object.fromEntries(rows.map((value) => [value.id, value.chiSoCuoi ?? ''])))
    }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, toaNhaId, openPeriod?.id, contract.phongId, contract.trangThai])
  async function run(task: () => Promise<void>) { if (busy) return; setBusy(true); setError(null); setNotice(''); try { await task() } catch (cause) { setError(message(cause)) } finally { setBusy(false) } }
  const lap = { display: 'grid', gap: 12 } as const
  return <section style={lap} aria-label="Tiền cọc và quyết toán hợp đồng">
    {error ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p> : null}{notice ? <p role="status" className="alert alert-success"><Icon name="check-circle" />{notice}</p> : null}
    {deposit ? <>
      <h2 className="h3">Tiền cọc hợp đồng #{contract.id}</h2>
      <div className="facts" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}><div className="fact"><div className="k">Thoả thuận</div><div className="v">{dinhDangTien(deposit.tienCocThoaThuan)} đ</div></div><div className="fact"><div className="k">Đã thu</div><div className="v">{dinhDangTien(deposit.tongDaThu)} đ</div></div><div className="fact"><div className="k">Còn thiếu</div><div className="v">{dinhDangTien(deposit.conLaiChuaThu)} đ</div></div></div>
      {contract.trangThai !== 'DA_THANH_LY' ? <form className="card-sunken" style={lap} onSubmit={(event) => { event.preventDefault(); if (validMoney(amount)) void run(async () => { await collectDeposit(token, contract.id, amount, date, reason); setNotice('Đã ghi nhận thu cọc.'); setReload((value) => value + 1); onChanged() }) }}>
        <label className="field"><span className="label">Số tiền cọc thu</span><input className="input" aria-label="Số tiền cọc thu" value={amount} onChange={(event) => setAmount(event.target.value)} required inputMode="decimal" /></label>
        <label className="field"><span className="label">Ngày thu cọc</span><input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="field"><span className="label">Ghi chú thu cọc</span><input className="input" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <Button type="submit" blocked={busy || !validMoney(amount)} blockedReason="Nhập số tiền cọc lớn hơn 0 và chờ giao dịch trước hoàn tất.">Ghi nhận thu cọc</Button>
      </form> : null}
      {deposit.giaoDich.map((entry) => <p key={entry.id} className="t-sm" style={{ margin: 0 }}>{entry.maBienLai} · {entry.loai} · {entry.ngay} · {dinhDangTien(entry.soTien)} đ {entry.lyDo ? `· ${entry.lyDo}` : ''}</p>)}
    </> : <EmptyState kind="loading" title="Đang tải tiền cọc…" />}
    {contract.trangThai !== 'DA_THANH_LY' ? <details><summary className="t-strong" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>Chốt chỉ số cuối, trả phòng và quyết toán</summary><form className="card-sunken" style={lap} onSubmit={(event) => {
      event.preventDefault()
      if (!confirm || !openPeriod) return
      void run(async () => {
        const result = await financeRequest<ThongTinHopDong & { quyetToan: Settlement }>(token, `/api/hop-dong/${contract.id}/thanh-ly`, 'POST', {
          khauTruHuHong: damage, lyDo: settlementReason, chiSoCuoi: meters.map((meter) => ({ phongId: contract.phongId, dichVuId: meter.id, chiSoCuoi: readings[meter.id], coThayCongTo: meter.coThayCongTo, chiSoCuoiCongToCu: meter.chiSoCuoiCongToCu, chiSoDauCongToMoi: meter.chiSoDauCongToMoi, xacNhanCanhBao: acknowledge })),
        })
        setSettlement(result.quyetToan); setNotice('Đã thanh lý hợp đồng và ghi giao dịch quyết toán.'); setReload((value) => value + 1); onChanged()
      })
    }}>
      <p className="t-sm" style={{ margin: 0 }}>Kỳ đang mở: {openPeriod ? `${openPeriod.thang}/${openPeriod.nam}` : 'Chưa có kỳ đang mở'}. <a href={`/ghi-chi-so?toaNhaId=${toaNhaId}`}>Mở màn ghi chỉ số để bổ sung ảnh công tơ nếu có yêu cầu.</a></p>
      {meters.map((meter) => <label key={meter.id} className="field"><span className="label">{meter.tenDichVu} — chỉ số cuối (đầu kỳ {meter.chiSoDau})</span><input className="input" aria-label={`Chỉ số cuối ${meter.tenDichVu}`} value={readings[meter.id] ?? ''} onChange={(event) => setReadings((current) => ({ ...current, [meter.id]: event.target.value }))} inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" required /></label>)}
      <label className="check"><input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} /> Đã kiểm tra và xác nhận các mức tiêu thụ bất thường (nếu có).</label>
      <label className="field"><span className="label">Khấu trừ hư hỏng (đồng)</span><input className="input" aria-label="Khấu trừ hư hỏng" value={damage} onChange={(event) => setDamage(event.target.value)} required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" /></label>
      <label className="field"><span className="label">Lý do khấu trừ / ghi chú quyết toán</span><textarea className="input" style={{ height: 'auto', minHeight: 88, padding: '10px 14px' }} value={settlementReason} onChange={(event) => setSettlementReason(event.target.value)} required={damage !== '0'} /></label>
      <label className="check"><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} /> Tôi xác nhận chỉ số cuối, tiền cọc và công nợ để kết thúc hợp đồng.</label>
      <Button type="submit" variant="secondary" blocked={busy || !confirm || !openPeriod} blockedReason="Cần kỳ đang mở và xác nhận dữ liệu trước khi quyết toán.">Xác nhận trả phòng và quyết toán</Button>
    </form></details> : <p className="t-sm" style={{ margin: 0 }}>Hợp đồng đã thanh lý.</p>}
    {settlement ? <div className="card-sunken" style={lap} role="status"><h3 className="h3">Kết quả quyết toán</h3><span>Đã thu cọc: {dinhDangTien(settlement.daThuCoc)} đ</span><span>Công nợ: {dinhDangTien(settlement.congNo)} đ · Khấu trừ: {dinhDangTien(settlement.khauTru)} đ</span><strong>Hoàn cọc: {dinhDangTien(settlement.hoanCoc)} đ</strong>
      {settlement.hoaDonQuyetToanId !== null ? <FinancePaymentPanel token={token} hoaDonId={settlement.hoaDonQuyetToanId} trangThai="DA_PHAT_HANH" /> : null}
    </div> : null}
  </section>
}
