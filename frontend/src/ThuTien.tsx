import { useEffect, useMemo, useState } from 'react'
import './ThuTien.css'
import { fetchChiSoDichVu, fetchCongNoBaoCao, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, type ThongTinGhiChiSo, type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinToaNha } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import FinancePaymentPanel, { message } from './FinancePaymentPanel'
import { collectDeposit, financeRequest, getDeposit, localDate, validMoney, type Deposit, type Settlement } from './financeApi'
import { BuildingSelect, today, useBuildings } from './ManagementShared'
import { demBoLoc, hangTong, locNo, nhomNo, tuCongNo, tuHoaDonQuanLy, type BoLocNo, type DongNo, type NhomNo } from './nhomNoTheoNguoi'
import { ngoaiProvider, useToaDangChon } from './toaDangChon'

type Props = { token: string; mobile?: boolean; vaiTro?: string }
type Tab = 'can-thu' | 'da-thu' | 'coc'

const SO_NHOM = 10
const BO_LOC: { khoa: BoLocNo; nhan: string }[] = [{ khoa: 'tat-ca', nhan: 'Tất cả' }, { khoa: 'tre-30', nhan: 'Trễ trên 30 ngày' }, { khoa: 'mot-phan', nhan: 'Đã trả một phần' }]
const vnd = (n: number) => `${dinhDangTien(Math.round(n * 100) / 100)} ₫`
const vietTat = (ten: string) => { const t = ten.trim().split(/\s+/); return (t.length > 1 ? t[t.length - 2][0] + t[t.length - 1][0] : t[0]?.[0] ?? '?').toUpperCase() }
const mauAvatar = (khoa: string) => ['', 'h1', 'h2', 'h3', 'h4', 'h5'][[...khoa].reduce((t, c) => t + c.charCodeAt(0), 0) % 6]
// Kỳ lấy theo tháng phát hành (Quản lý không có ngày phát hành → tháng của hạn thanh toán).
const nhanKy = (d: DongNo) => { const s = (d.ngayPhatHanh ?? d.hanThanhToan).slice(0, 7); return `${s.slice(5, 7)}/${s.slice(0, 4)}` }

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) từ các nhóm nợ. */
export function taoCsv(ds: NhomNo[]): string {
  const o = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const hang = [['Họ tên', 'Toà', 'Phòng', 'Số kỳ', 'Trễ lâu nhất (ngày)', 'Còn nợ'], ...ds.map((g) => [g.hoTen, g.tenToaNha, g.soPhong, g.hoaDon.length, g.treLauNhat, g.conLai])]
  return `\uFEFF${hang.map((h) => h.map(o).join(',')).join('\r\n')}`
}

/** Trạng thái lọc/nhóm/trang nằm trên URL (replaceState) để Back và tải lại giữ nguyên; `popstate` đồng bộ khi khung đổi tab. */
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
  const { buildings, buildingId } = useBuildings(token)
  const { p, dat } = useQuery()
  const laChu = vaiTro === 'CHU'
  // Chủ: null = mọi toà. Quản lý chỉ có một toà (khung đã chọn sẵn); ngoài khung (test) lấy toà đầu.
  const toaId = laChu ? buildingId : buildingId ?? buildings[0]?.id ?? null
  const toa = toaId === null ? null : buildings.find((b) => b.id === toaId) ?? null
  const choToa = laChu ? (ngoaiProvider(chung) ? buildings.length === 0 : chung.dangTai) : toa === null
  const tab: Tab = p.get('tab') === 'da-thu' ? 'da-thu' : p.get('tab') === 'coc' ? 'coc' : 'can-thu'
  const loc = (['tre-30', 'mot-phan'] as const).find((k) => k === p.get('loc')) ?? 'tat-ca'
  const theo = p.get('theo') === 'phong' ? 'phong' : 'nguoi'
  const q = p.get('q') ?? ''

  const [dong, setDong] = useState<DongNo[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [mo, setMo] = useState<Set<string>>(new Set())
  const [chon, setChon] = useState<Set<string>>(new Set())
  const [ngan, setNgan] = useState<{ hoaDonId: number | null } | null>(null)
  useEffect(() => {
    if (choToa) return
    let active = true
    setLoi(null)
    const tai = laChu
      ? fetchCongNoBaoCao(token, null).then((r) => tuCongNo(r.congNo))
      : Promise.all([fetchHoaDonQuanLy(token, toa!.id, ''), fetchHopDongQuanLy(token, toa!.id)]).then(([hd, hop]) => tuHoaDonQuanLy(hd, toa!, today(), hop))
    tai.then((rows) => { if (active) setDong(rows) }).catch((cause: unknown) => { if (active) setLoi(message(cause)) })
    return () => { active = false }
  }, [token, laChu, choToa, laChu ? 0 : toa?.id, reload]) // eslint-disable-line react-hooks/exhaustive-deps

  const dongToa = useMemo(() => (dong ?? []).filter((d) => !laChu || toaId === null || d.toaNhaId === toaId), [dong, laChu, toaId])
  const nhom = useMemo(() => nhomNo(dongToa, theo), [dongToa, theo])
  const dem = useMemo(() => demBoLoc(nhom), [nhom])
  const hienThi = useMemo(() => locNo(nhom, loc, q), [nhom, loc, q])
  const tong = useMemo(() => hangTong(hienThi), [hienThi])
  const soTrang = Math.max(1, Math.ceil(hienThi.length / SO_NHOM))
  const trang = Math.min(soTrang, Math.max(1, Number(p.get('trang')) || 1))
  const trangHienTai = hienThi.slice((trang - 1) * SO_NHOM, trang * SO_NHOM)
  // Nhóm đầu (nợ nhiều nhất) mở sẵn một lần khi có dữ liệu, như prototype.
  const [daMoDau, setDaMoDau] = useState(false)
  useEffect(() => { if (!daMoDau && nhom.length > 0) { setDaMoDau(true); setMo(new Set([nhom[0].khoa])) } }, [daMoDau, nhom])

  // Chỉ tính nhóm còn hiện sau lọc: lọc/tìm lại thì phần đã chọn ngoài danh sách tự rơi ra.
  const daChon = useMemo(() => hienThi.filter((g) => chon.has(g.khoa)), [hienThi, chon])
  const tongChon = daChon.reduce((t, g) => t + g.conLai, 0)
  const tatCaTrang = trangHienTai.length > 0 && trangHienTai.every((g) => chon.has(g.khoa))
  const doiChon = (ds: NhomNo[], bat: boolean) => setChon((s) => { const n = new Set(s); ds.forEach((g) => (bat ? n.add(g.khoa) : n.delete(g.khoa))); return n })
  useEffect(() => {
    if (chon.size === 0 || ngan) return
    const thoat = (e: KeyboardEvent) => { if (e.key === 'Escape') setChon(new Set()) }
    document.addEventListener('keydown', thoat)
    return () => document.removeEventListener('keydown', thoat)
  }, [chon.size, ngan])
  const xuatCsv = () => {
    const url = URL.createObjectURL(new Blob([taoCsv(daChon)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'can-thu.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const tenToa = toa?.ten ?? `Tất cả ${buildings.length} toà`
  const phuDe = tab === 'can-thu' ? 'nhóm theo người thuê, mỗi người một hàng tổng' : tab === 'da-thu' ? 'hoá đơn đã thu đủ' : 'tiền cọc và trả phòng'
  const datLoc = (patch: Record<string, string | null>) => dat({ trang: null, ...patch })
  const boLoc = () => datLoc({ loc: null, q: null })

  return <section data-testid="collection-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="thu-tien-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <div className="ph">
      <div className="grow">
        <h1 className="h1" id="thu-tien-title">Thu tiền</h1>
        <p className="sub">{tenToa} · {phuDe}</p>
      </div>
    </div>
    {tab === 'coc' ? <TabCoc token={token} toaNhaId={toaId} buildings={buildings} chonToa={ngoaiProvider(chung) || !chung.coDinh ? chung.chon : undefined} />
      : tab === 'da-thu' ? null
        : <section className="card flush" aria-label="Cần thu">
          {daChon.length > 0 ? <div className="bulkbar" role="status">
            <Icon name="check-circle" /><span>Đã chọn <b>{daChon.length} {theo === 'nguoi' ? 'người' : 'phòng'}</b> · {vnd(tongChon)}</span><span className="push" />
            <Button size="sm" variant="secondary" blocked={daChon.length !== 1} title={daChon.length === 1 ? undefined : 'Chọn đúng một người để ghi nhận thu'} onClick={() => setNgan({ hoaDonId: daChon[0].hoaDon[0].hoaDonId })}>Ghi nhận thu</Button>
            <Button size="sm" variant="secondary" onClick={xuatCsv}>Xuất danh sách</Button>
            <button type="button" className="btn btn-secondary btn-sm" aria-disabled="true" aria-describedby="ly-do-nhac-no">Gửi nhắc nợ</button><span className="reason" id="ly-do-nhac-no">cần API nhắc nợ</span>
            <Button size="sm" variant="text" onClick={() => setChon(new Set())}>Bỏ chọn</Button>
          </div> : <div className="toolbar">
            <label className="input-wrap"><span className="sr-only">Tìm trong danh sách cần thu</span><Icon name="search" /><input className="input" type="search" placeholder="Tìm người, phòng, mã hoá đơn" value={q} onChange={(e) => datLoc({ q: e.target.value })} /></label>
            {BO_LOC.map((b) => <button key={b.khoa} type="button" className="chip" aria-pressed={loc === b.khoa} onClick={() => datLoc({ loc: b.khoa === 'tat-ca' ? null : b.khoa })}>{b.nhan}<span className="n">{dem[b.khoa]}</span></button>)}
            <span className="push t-meta">Nhóm theo</span>
            <div className="seg" role="group" aria-label="Nhóm theo">
              <button type="button" aria-pressed={theo === 'nguoi'} onClick={() => datLoc({ theo: null })}>Người thuê</button>
              <button type="button" aria-pressed={theo === 'phong'} onClick={() => datLoc({ theo: 'phong' })}>Phòng</button>
            </div>
          </div>}
          {loi ? <EmptyState kind="error" title={loi} body="Dữ liệu chưa bị thay đổi." actionLabel="Thử lại" onAction={() => setReload((v) => v + 1)} />
            : dong === null ? <div aria-busy="true" role="status" aria-label="Đang tải danh sách cần thu" style={{ padding: '8px 24px 24px', display: 'grid', gap: 14 }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel skel-line" style={{ width: '100%', height: 40 }} />)}</div>
              : nhom.length === 0 ? <EmptyState title="Không ai còn nợ." body={<>Hoá đơn kỳ mới phát hành ở <a href="/chu-ky">Chu kỳ tháng</a>.</>} />
                : hienThi.length === 0 ? <EmptyState kind="filtered" title="Không có người nào khớp bộ lọc." actionLabel="Bỏ lọc" onAction={boLoc} />
                  : <>
                    <div className="table-wrap"><table className="table gtable">
                      <thead><tr>
                        <th scope="col" style={{ width: 48 }}><label className="check"><input type="checkbox" checked={tatCaTrang} onChange={(e) => doiChon(trangHienTai, e.target.checked)} /><span className="sr-only">Chọn hết nhóm trên trang</span></label></th>
                        <th scope="col">{theo === 'nguoi' ? 'Người thuê · phòng' : 'Phòng · người thuê'}</th>
                        <th scope="col">Chưa trả đủ</th><th scope="col">Trễ lâu nhất</th>
                        <th scope="col" className="num">Đã thu</th><th scope="col" className="num">Còn nợ</th>
                        <th scope="col" style={{ width: 52 }}><span className="sr-only">Mở</span></th>
                      </tr></thead>
                      <tbody>
                        {trangHienTai.map((g) => <HangNhom key={g.khoa} g={g} theo={theo} chon={chon.has(g.khoa)} doiChon={(bat) => doiChon([g], bat)} mo={mo.has(g.khoa)} doiMo={() => setMo((s) => { const n = new Set(s); if (n.has(g.khoa)) n.delete(g.khoa); else n.add(g.khoa); return n })} />)}
                        <tr className="tot"><td /><td>Tổng {tong.soNhom} {theo === 'nguoi' ? 'người' : 'phòng'}</td><td className="c-ky">{tong.soKy} kỳ</td><td className="c-tre" /><td className="num c-thu">{vnd(tong.daThu)}</td><td className="num t-danger">{vnd(tong.conLai)}</td><td /></tr>
                      </tbody>
                    </table></div>
                    <div className="pager"><span>{(trang - 1) * SO_NHOM + 1}–{(trang - 1) * SO_NHOM + trangHienTai.length} trong {hienThi.length} {theo === 'nguoi' ? 'người' : 'phòng'}</span><span className="push" />
                      <button type="button" className="pg" aria-label="Trang trước" disabled={trang <= 1} onClick={() => dat({ trang: trang - 1 > 1 ? String(trang - 1) : null })}><Icon name="chevron-left" /></button>
                      {Array.from({ length: soTrang }, (_, i) => i + 1).map((n) => <button key={n} type="button" className="pg" aria-current={n === trang ? 'page' : undefined} onClick={() => dat({ trang: n > 1 ? String(n) : null })}>{n}</button>)}
                      <button type="button" className="pg" aria-label="Trang sau" disabled={trang >= soTrang} onClick={() => dat({ trang: String(trang + 1) })}><Icon name="chevron-right" /></button>
                    </div>
                  </>}
        </section>}
  </section>
}

function HangNhom({ g, theo, chon, doiChon, mo, doiMo }: { g: NhomNo; theo: 'nguoi' | 'phong'; chon: boolean; doiChon: (bat: boolean) => void; mo: boolean; doiMo: () => void }) {
  const ten = theo === 'nguoi' ? g.hoTen : `Phòng ${g.soPhong}`
  const phu = theo === 'nguoi' ? `${g.tenToaNha} · Phòng ${g.soPhong}` : `${g.tenToaNha} · ${g.hoTen}`
  const nguoi = <><span className={`avatar sm ${mauAvatar(g.khoa)}`} aria-hidden="true">{theo === 'nguoi' ? vietTat(g.hoTen) : g.soPhong.slice(0, 3)}</span><span><span className="td-main">{ten}</span><span className="td-sub" style={{ display: 'block' }}>{phu}</span></span></>
  const idKid = (h: DongNo) => `kid-${g.khoa}-${h.hoaDonId}`
  return <>
    <tr className={chon ? 'grp is-selected' : 'grp'}>
      <td><label className="check"><input type="checkbox" checked={chon} onChange={(e) => doiChon(e.target.checked)} /><span className="sr-only">Chọn {ten}</span></label></td>
      <td>{theo === 'nguoi' && g.nguoiThueId !== null ? <a className="td-person" href={`/nguoi-thue/${g.nguoiThueId}`} style={{ color: 'inherit' }}>{nguoi}</a> : <span className="td-person">{nguoi}</span>}</td>
      <td className="c-ky">{g.hoaDon.length} kỳ</td>
      <td className="c-tre">{g.treLauNhat > 0 ? <StatusTag tone="urgent" icon="clock">{g.treLauNhat} ngày</StatusTag> : <span className="t-meta">Chưa đến hạn</span>}</td>
      <td className="num c-thu">{vnd(g.daThu)}</td>
      <td className="num t-money">{vnd(g.conLai)}</td>
      <td><button type="button" className="icon-btn xbtn" aria-expanded={mo} aria-controls={g.hoaDon.map(idKid).join(' ')} aria-label={`${mo ? 'Thu gọn' : 'Mở'} hoá đơn của ${ten}`} onClick={doiMo}><Icon name={mo ? 'chevron-up' : 'chevron-down'} /></button></td>
    </tr>
    {mo ? g.hoaDon.map((h) => <tr key={h.hoaDonId} id={idKid(h)} className="kid">
      <td />
      <td>Kỳ {nhanKy(h)} <span className="t-meta">· {h.maHoaDon}</span></td>
      <td className="c-ky">hạn {dinhDangNgayIso(h.hanThanhToan.slice(0, 10))}</td>
      <td className="c-tre">{h.daThu > 0 ? <StatusTag tone="waiting">Trả một phần</StatusTag> : <StatusTag tone="urgent">Chưa trả</StatusTag>}</td>
      <td className="num c-thu">{vnd(h.daThu)} / {vnd(h.tongTien)}</td>
      <td className="num t-money">{vnd(h.conLai)}</td>
      <td />
    </tr>) : null}
  </>
}

function TabCoc({ token, toaNhaId, buildings, chonToa }: { token: string; toaNhaId: number | null; buildings: ThongTinToaNha[]; chonToa?: (id: number | null) => void }) {
  const [contracts, setContracts] = useState<ThongTinHopDong[]>([])
  const [periods, setPeriods] = useState<ThongTinKyThanhToan[]>([])
  const [contract, setContract] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    setContracts([]); setContract('')
    if (toaNhaId === null) return
    let active = true
    setError(null)
    Promise.all([fetchHopDongQuanLy(token, toaNhaId), fetchKyThanhToan(token, toaNhaId)])
      .then(([tenants, months]) => { if (!active) return; setContracts(tenants); setPeriods(months) })
      .catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [token, toaNhaId, reload])
  const selectedContract = contracts.find((value) => String(value.id) === contract)
  const hangHopDong = useMemo(() => [...contracts].sort((a, b) => a.soPhong.localeCompare(b.soPhong, 'vi', { numeric: true })), [contracts])
  const cotHopDong = useMemo(() => cotHopDongCoc((id) => setContract(String(id)), contract), [contract])
  return <>
    {chonToa ? <BuildingSelect buildings={buildings} value={toaNhaId} onChange={chonToa} /> : null}
    {error ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p> : null}
    {toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem tiền cọc." /> : <div className="tt-grid">
      <Card><DataTable rows={hangHopDong} columns={cotHopDong} getRowId={(h) => h.id} timTheo={(h) => `${h.soPhong} ${h.hoTenNguoiThue}`} searchLabel="Tìm phòng, người thuê" noun="hợp đồng" pageSize={10} /></Card>
      <div className="tt-panel"><Card>{selectedContract
        ? <ContractFinance key={selectedContract.id} token={token} toaNhaId={toaNhaId} contract={selectedContract} periods={periods} onChanged={() => setReload((value) => value + 1)} />
        : <EmptyState title="Chưa chọn hợp đồng" body="Bấm “Thu cọc” ở một hợp đồng để thu cọc hoặc quyết toán khi trả phòng." />}</Card></div>
    </div>}
  </>
}

function cotHopDongCoc(chon: (id: number) => void, dangChon: string): DataTableColumn<ThongTinHopDong>[] {
  return [
    { key: 'phong', label: 'Phòng', the: 'tieu-de', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <><span className="td-main">Phòng {h.soPhong}</span><div className="td-sub" title={h.hoTenNguoiThue}>{h.hoTenNguoiThue} · HĐ #{h.id}</div></> },
    { key: 'tienCoc', label: 'Tiền cọc', align: 'num', sortable: true, sortValue: (h) => Number(h.tienCoc), render: (h) => <>{dinhDangTien(h.tienCoc)} ₫</> },
    { key: 'trangThai', label: 'Trạng thái', render: (h) => <StatusTag tone={h.trangThai === 'DA_THANH_LY' ? 'closed' : 'done'}>{h.tenTrangThai}</StatusTag> },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (h) => <div className="td-acts"><button type="button" className="btn btn-secondary btn-sm" aria-pressed={dangChon === String(h.id)} aria-label={`${h.trangThai === 'DA_THANH_LY' ? 'Xem cọc' : 'Thu cọc'} hợp đồng ${h.id}`} onClick={() => chon(h.id)}>{h.trangThai === 'DA_THANH_LY' ? 'Xem cọc' : 'Thu cọc'}</button></div>,
    },
  ]
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
