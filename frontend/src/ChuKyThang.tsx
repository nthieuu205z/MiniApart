import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { chotKyThanhToan, fetchChiSoDichVu, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, fetchPhongChuaGhiChiSo, type ThongTinGhiChiSo, type ThongTinHoaDonQuanLy, type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinPhongChuaGhiChiSo } from './api'
import { tinhBuoc } from './tinhBuocChuKy'
import GhiChiSo from './GhiChiSo'
import type { TrangProps } from './dinhTuyen'
import { bulkInvoice } from './financeApi'
import { nhomNo, tuHoaDonQuanLy } from './nhomNoTheoNguoi'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { ThanhBuoc, type Buoc } from './design/core/ThanhBuoc'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { NhanMinhHoa } from './design/feedback/NhanMinhHoa'
import { Card } from './design/layout/Card'
import { ChanDinh } from './design/layout/ChanDinh'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo } from './design/layout/KhoiSo'
import { NganNhacNo } from './design/money/NganNhacNo'
import { DataTable } from './design/table/DataTable'
import { StatusTag } from './design/core/StatusTag'
import { tenToaDangChon, useMotToa } from './toaDangChon'

type DuLieu = { ky: ThongTinKyThanhToan[]; thieu: ThongTinPhongChuaGhiChiSo[]; tongPhong: number; hoaDon: ThongTinHoaDonQuanLy[]; chiSo: ThongTinGhiChiSo; chiSoTruoc: ThongTinGhiChiSo | null; hopDong: ThongTinHopDong[] }

const thuTu = (k: ThongTinKyThanhToan) => k.nam * 12 + k.thang
const nhanKy = (k: ThongTinKyThanhToan) => `${k.thang}/${k.nam}`
const loiChu = (e: unknown, macDinh: string) => (e instanceof Error && e.message ? e.message : macDinh)
const tongTien = (ds: ThongTinHoaDonQuanLy[], truong: 'tongTien' | 'daThu' | 'conLai') => ds.reduce((t, h) => t + (Number(h[truong]) || 0), 0)
const daThuDu = (h: ThongTinHoaDonQuanLy) => !(Number(h.conLai) > 0)
const tien = (v: number | string) => `${dinhDangTien(v)} ₫`
const MO_TA_SAU = ['Chỉ số không sửa được nữa, hệ thống tính sẵn hoá đơn nháp', 'Xem lại hoá đơn nháp rồi gửi cho người thuê', 'Theo dõi ở Thu tiền, nhóm theo người']
const SCRIM = { position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(28,25,23,.45)', padding: 16 } as const
const khoaHd = (soPhong: string, ten: string) => `${soPhong}|${ten}`
const homNayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

/** Số ngày từ hôm nay tới hạn; âm = đã quá hạn. */
function ngayToi(denNgay: string): number {
  const [y, m, d] = denNgay.slice(0, 10).split('-').map(Number)
  const homNay = new Date()
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(homNay.getFullYear(), homNay.getMonth(), homNay.getDate())) / 86400000)
}

/** Tổng mức dùng theo tên dịch vụ; chỉ tính ô đã có mucTieuThu. */
function tongDung(cs: ThongTinGhiChiSo | null): Map<string, { tong: number; donVi: string }> {
  const m = new Map<string, { tong: number; donVi: string }>()
  cs?.phong.forEach((p) => p.dichVu.forEach((d) => {
    if (d.mucTieuThu == null) return
    const cu = m.get(d.tenDichVu) ?? { tong: 0, donVi: d.donVi }
    m.set(d.tenDichVu, { tong: cu.tong + Number(d.mucTieuThu), donVi: d.donVi })
  }))
  return m
}
const soVn = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

export default function ChuKyThang({ token, vaiTro, mobile, dieuHuong }: TrangProps) {
  const toa = useMotToa({ tuChonDau: true })
  const toaNhaId = toa.toaNhaId
  const [kyChon, setKyChon] = useState<number | null>(null)
  const [buocChon, setBuocChon] = useState<number | null>(() => {
    const b = Number(new URLSearchParams(globalThis.location?.search ?? '').get('b'))
    return b >= 1 && b <= 4 ? b : null
  })
  const [lan, setLan] = useState(0)
  const [dsKy, setDsKy] = useState<ThongTinKyThanhToan[] | null>(null)
  const [dl, setDl] = useState<DuLieu | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangGhi, setDangGhi] = useState(false)
  const [loiGhi, setLoiGhi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [xacNhan, setXacNhan] = useState<'chot' | 'phat-hanh' | null>(null)
  const [nhac, setNhac] = useState<number | null>(null)
  const [slotNut, setSlotNut] = useState<HTMLElement | null>(null)

  // Hai bước tải: danh sách tháng (đổi toà / sau khi ghi) rồi dữ liệu của tháng đang xem (đổi tháng).
  useEffect(() => {
    setDsKy(null); setDl(null); setLoi(null)
    if (toaNhaId === null) return undefined
    let active = true
    setDangTai(true)
    fetchKyThanhToan(token, toaNhaId)
      .then((k) => { if (active) setDsKy([...k].sort((a, b) => thuTu(b) - thuTu(a))) })
      .catch((e: unknown) => { if (active) { setLoi(loiChu(e, 'Không tải được danh sách tháng.')); setDangTai(false) } })
    return () => { active = false }
  }, [token, toaNhaId, lan])

  const kyDangXem = useMemo(() => dsKy?.find((k) => k.id === kyChon) ?? dsKy?.find((k) => k.trangThai !== 'DA_CHOT') ?? dsKy?.[0], [dsKy, kyChon])
  const kyId = kyDangXem?.id ?? null

  useEffect(() => {
    if (dsKy === null || toaNhaId === null) return undefined
    if (kyId === null || !kyDangXem) { setDl(null); setDangTai(false); return undefined }
    const kyTruocId = dsKy.find((k) => k.trangThai === 'DA_CHOT' && thuTu(k) < thuTu(kyDangXem))?.id
    let active = true
    setDangTai(true)
    // Chỉ số tháng trước và hợp đồng chỉ để bổ sung (so sánh, nối người thuê): lỗi thì bỏ phần đó, không chặn màn.
    Promise.all([
      fetchPhongChuaGhiChiSo(token, toaNhaId, kyId), fetchChiSoDichVu(token, toaNhaId, kyId), fetchHoaDonQuanLy(token, toaNhaId, ''),
      kyTruocId ? fetchChiSoDichVu(token, toaNhaId, kyTruocId).catch(() => null) : Promise.resolve(null),
      fetchHopDongQuanLy(token, toaNhaId).catch(() => [] as ThongTinHopDong[]),
    ])
      .then(([thieu, chiSo, hoaDon, chiSoTruoc, hopDong]) => { if (active) { setLoi(null); setDl({ ky: dsKy, thieu, tongPhong: chiSo.tongPhong, hoaDon, chiSo, chiSoTruoc, hopDong }) } })
      .catch((e: unknown) => { if (active) setLoi(loiChu(e, 'Không tải được dữ liệu tháng.')) })
      .finally(() => { if (active) setDangTai(false) })
    return () => { active = false }
  }, [token, toaNhaId, dsKy, kyId, kyDangXem])

  const taiLai = useCallback(() => setLan((x) => x + 1), [])
  const chonBuoc = (n: number) => { setBuocChon(n); setThongBao(null); setLoiGhi(null); dieuHuong(`/chu-ky?b=${n}`) }
  const diToi = (href: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault(); dieuHuong(href)
  }

  const dauTrang = (tieuDe: string, phu?: ReactNode, hanhDong?: ReactNode) => <DauTrang tieuDe={tieuDe} phu={phu} hanhDong={hanhDong} />
  const vo = (noiDung: ReactNode, tieuDe = 'Tháng', phu?: ReactNode) => <section aria-labelledby="chu-ky-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    {dauTrang(tieuDe, phu)}{noiDung}
  </section>

  if (toaNhaId === null) {
    return vo(<Card><div className="field" style={{ maxWidth: 320 }}>
      <label className="label" htmlFor="chu-ky-toa">{toa.canChonTaiCho ? 'Chọn toà để xem tháng' : 'Đang tải toà…'}</label>
      <select id="chu-ky-toa" className="select" value="" onChange={(e) => toa.chon(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Chọn toà nhà</option>{toa.danhSach.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
      </select>
    </div></Card>, 'Tháng', tenToaDangChon(toa))
  }
  if (loi) return vo(<EmptyState kind="error" title="Không tải được tháng này" body="Dữ liệu chưa bị thay đổi." actionLabel="Tải lại" onAction={taiLai} />)
  if (dsKy && !kyDangXem) return vo(<EmptyState title="Toà này chưa có tháng thanh toán" body="Mở tháng đầu tiên ở Dịch vụ & đơn giá, rồi quay lại đây để ghi chỉ số." actionLabel="Mở Dịch vụ & đơn giá" onAction={() => dieuHuong('/dich-vu')} />)
  if (!dl || !kyDangXem) {
    return vo(<div aria-busy="true" style={{ display: 'grid', gap: 12 }}><span className="skel skel-line" style={{ width: '100%', height: 72 }} /><span className="skel skel-line" style={{ width: '100%', height: 220 }} /></div>)
  }

  const ky = kyDangXem
  const daChot = ky.trangThai === 'DA_CHOT'
  const hoaDonKy = dl.hoaDon.filter((h) => h.kyId === ky.id && h.trangThai !== 'DA_HUY')
  const nhapDs = hoaDonKy.filter((h) => h.trangThai === 'NHAP')
  const nhap = nhapDs.length
  const dangThu = hoaDonKy.filter((h) => h.trangThai !== 'NHAP')
  const soThieu = dl.thieu.length
  const { buocHienTai, buoc } = tinhBuoc({ ky, soCongToThieu: soThieu, tongCongTo: dl.tongPhong, hoaDon: hoaDonKy })
  const b = buocChon ?? buocHienTai
  const xemTruoc = b > buocHienTai
  const kyTruoc = dl.ky.find((k) => k.trangThai === 'DA_CHOT' && thuTu(k) < thuTu(ky))
  const hoaDonTruoc = kyTruoc ? dl.hoaDon.filter((h) => h.kyId === kyTruoc.id && h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY') : []
  const tenToa = toa.danhSach.find((t) => t.id === toaNhaId)?.ten ?? ''
  const nhanDangXem = nhanKy(ky)
  const hopDongTheo = new Map(dl.hopDong.map((h) => [khoaHd(h.soPhong, h.hoTenNguoiThue), h]))
  const hrefGhiThu = (h: ThongTinHoaDonQuanLy) => { const id = hopDongTheo.get(khoaHd(h.soPhong, h.nguoiThue))?.nguoiThueId; return id ? `/thu-tien?nguoiThueId=${id}` : '/thu-tien' }

  const cuonToiCongTo = () => {
    // Id: cong-to-{phongId}-{dichVuId}; chỉ biết phòng nên lấy ô đầu tiên của phòng đó.
    const o = dl.thieu[0] ? document.querySelector<HTMLElement>(`[id^="cong-to-${dl.thieu[0].id}-"]`) : null
    o?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); o?.focus?.()
  }
  async function ghi(viec: () => Promise<string>) {
    setXacNhan(null); setDangGhi(true); setLoiGhi(null); setThongBao(null)
    try { setThongBao(await viec()); setBuocChon(null); taiLai() } catch (e) { setLoiGhi(loiChu(e, 'Không thực hiện được.')) } finally { setDangGhi(false) }
  }
  const chotKy = () => ghi(async () => {
    const kq = await chotKyThanhToan(token, toaNhaId!, ky.id)
    if ('phongThieuChiSo' in kq) throw new Error('Còn phòng chưa ghi chỉ số.')
    return `Đã khoá chỉ số tháng ${nhanDangXem}.`
  })
  const bulk = (action: 'tao-hang-loat' | 'phat-hanh-hang-loat') => ghi(async () => {
    const kq = await bulkInvoice(token, toaNhaId!, ky.id, action)
    return action === 'tao-hang-loat' ? `Đã tạo ${kq.soHoaDonTaoMoi ?? 0} hoá đơn nháp.` : `Đã gửi ${kq.soHoaDonDaPhatHanh ?? 0} hoá đơn.`
  })

  const hrefHoaDon = (h?: ThongTinHoaDonQuanLy) => `/hoa-don?toaNhaId=${toaNhaId}&kyId=${ky.id}${h ? `&hoaDonId=${h.hoaDonId}` : ''}`
  const lyDoThieu = soThieu > 0 ? `Còn ${soThieu} phòng chưa ghi chỉ số.` : undefined

  // Nút chính của bước đang xem (bước 1: nút nằm trong GhiChiSo, vì nó giữ số đã nhập).
  const nutChinh = (): ReactNode => {
    if (b === 1) return null
    if (b === 2) return <Button blocked={dangGhi || daChot || soThieu > 0} blockedReason={daChot ? 'Chỉ số tháng này đã khoá.' : lyDoThieu} onClick={() => setXacNhan('chot')}><Icon name="lock" size="sm" />{dangGhi ? 'Đang khoá…' : `Khoá chỉ số tháng ${ky.thang}`}</Button>
    if (b === 3) {
      if (nhap > 0) return <Button blocked={dangGhi} onClick={() => setXacNhan('phat-hanh')}>{`Gửi ${nhap} hoá đơn · ${tien(tongTien(nhapDs, 'tongTien'))}`}</Button>
      const lyDo = !daChot ? (lyDoThieu ?? 'Khoá chỉ số trước khi tạo hoá đơn.') : hoaDonKy.length > 0 ? 'Mọi hoá đơn của tháng đã gửi.' : undefined
      return <Button blocked={dangGhi || !!lyDo} blockedReason={lyDo} onClick={() => void bulk('tao-hang-loat')}>Tạo hoá đơn nháp</Button>
    }
    return <Button blocked={dangThu.length === 0} blockedReason="Chưa có hoá đơn nào được gửi." onClick={() => dieuHuong('/thu-tien')}><Icon name="plus" size="sm" />Ghi thu tiền</Button>
  }

  const bangHoaDon = (rows: ThongTinHoaDonQuanLy[], cot: { key: string; label: string; align?: 'num'; render: (h: ThongTinHoaDonQuanLy) => ReactNode }[], tong?: ReactNode[]) =>
    <DataTable rows={rows} columns={cot} getRowId={(h) => h.hoaDonId} noun="hoá đơn" pageSize={50} tongHang={tong} />

  const buoc1 = () => <section aria-labelledby="b1" style={{ display: 'grid', gap: 12 }}>
    <h2 className="sr-only" id="b1">Ghi chỉ số tháng {nhanDangXem}</h2>
    {soThieu > 0 ? <p className="t-sm" style={{ margin: 0 }}>Còn {soThieu} phòng chưa ghi ({dl.thieu.slice(0, 4).map((p) => p.soPhong).join(', ')}{soThieu > 4 ? '…' : ''}). <button type="button" className="link-more brand" style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={cuonToiCongTo}>Tới ô đầu tiên chưa ghi</button></p>
      : <p className="t-sm" style={{ margin: 0 }}>Đã ghi đủ chỉ số. <a className="link-more brand" href="/chu-ky?b=2" onClick={diToi('/chu-ky?b=2')}>Sang bước khoá chỉ số</a></p>}
    <GhiChiSo token={token} mobile={mobile} vaiTro={vaiTro} anNutChot kyIdCoDinh={ky.id} nutChinhSlot={slotNut} />
  </section>

  const buoc2 = () => {
    const sanSo = tongDung(dl.chiSo)
    const truoc = tongDung(dl.chiSoTruoc)
    const dichVuCoSo = dl.chiSo.phong.flatMap((p) => p.dichVu).filter((d) => d.chiSoCuoi)
    const coLui = dl.chiSo.phong.filter((p) => p.dichVu.some((d) => d.chiSoCuoi && !d.coThayCongTo && Number(d.chiSoCuoi) < Number(d.chiSoDau)))
    const dieuKien: { ok: boolean; ten: string; phu: string }[] = [
      { ok: soThieu === 0, ten: `Đã ghi đủ ${dl.tongPhong - soThieu}/${dl.tongPhong} phòng`, phu: soThieu === 0 ? 'Không còn phòng nào thiếu chỉ số.' : `Còn thiếu phòng ${dl.thieu.map((p) => p.soPhong).join(', ')}.` },
      ...(dichVuCoSo.length ? [{ ok: coLui.length === 0, ten: 'Không có chỉ số nào nhỏ hơn tháng trước', phu: coLui.length === 0 ? 'Chỉ số mới luôn lớn hơn hoặc bằng chỉ số cũ.' : `Phòng ${coLui.map((p) => p.soPhong).join(', ')} có chỉ số mới nhỏ hơn số cũ.` }] : []),
    ]
    const dong = [...sanSo.keys()].filter((t) => truoc.has(t))
    return <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
        <Card title="Kiểm lại trước khi khoá">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{dieuKien.map((d) => <li key={d.ten} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: '1px solid var(--ma-line-200)' }}>
            <Icon name={d.ok ? 'check' : 'x-circle'} /><div><div className="t-strong">{d.ten}</div><div className="t-sm">{d.phu}</div></div>
          </li>)}</ul>
        </Card>
        {dong.length > 0 ? <Card title={`Tổng dùng tháng ${ky.thang}`}>
          <div className="table-wrap"><table className="table"><thead><tr><th scope="col">Dịch vụ</th><th scope="col" className="num">Tháng {ky.thang}</th><th scope="col" className="num">Tháng {kyTruoc!.thang}</th><th scope="col" className="num">Chênh</th></tr></thead>
            <tbody>{dong.map((t) => { const a = sanSo.get(t)!; const c = truoc.get(t)!; const chenh = a.tong - c.tong; return <tr key={t}><td>{t} ({a.donVi})</td><td className="num t-strong">{soVn(a.tong)}</td><td className="num">{soVn(c.tong)}</td><td className="num">{chenh > 0 ? '+' : ''}{soVn(chenh)}</td></tr> })}</tbody></table></div>
        </Card> : null}
    </div>
  }

  const buoc3 = () => {
    const sapHetHan = (h: ThongTinHoaDonQuanLy) => { const hd = hopDongTheo.get(khoaHd(h.soPhong, h.nguoiThue)); return hd?.sapHetHan ? dinhDangNgayIso(hd.ngayKetThuc).slice(0, 5) : null }
    return <Card title={`Hoá đơn nháp tháng ${ky.thang}`} action={hoaDonKy[0] ? <a className="btn btn-secondary btn-sm" href={hrefHoaDon(hoaDonKy[0])} onClick={diToi(hrefHoaDon(hoaDonKy[0]))}>Xem thử một hoá đơn</a> : undefined}>
      {hoaDonKy.length === 0 ? <p className="t-sm" style={{ margin: 0 }}>Chưa có hoá đơn nháp. Hoá đơn nháp được tạo sau khi khoá chỉ số.</p> : <>
        {nhap > 0 ? <p className="t-sm" style={{ margin: '0 0 8px' }}>Gửi tất cả hoá đơn nháp của tháng. Người thuê sẽ thấy hoá đơn sau khi gửi.</p> : null}
        {bangHoaDon(hoaDonKy, [
          { key: 'phong', label: 'Phòng', render: (h) => <b>{h.soPhong}</b> },
          { key: 'nguoi', label: 'Người thuê', render: (h) => h.nguoiThue },
          { key: 'tong', label: 'Tổng', align: 'num', render: (h) => tien(h.tongTien) },
          { key: 'ghiChu', label: 'Ghi chú', render: (h) => h.trangThai !== 'NHAP' ? <StatusTag tone="done">{daThuDu(h) ? 'Đã gửi, đã trả' : 'Đã gửi'}</StatusTag> : sapHetHan(h) ? <StatusTag tone="waiting">HĐ hết hạn {sapHetHan(h)}</StatusTag> : null },
        ], nhap > 0 ? ['', `Sẽ gửi ${nhap} hoá đơn`, tien(tongTien(nhapDs, 'tongTien')), ''] : undefined)}
      </>}
    </Card>
  }

  const buoc4 = () => {
    const chuaTra = dangThu.filter((h) => !daThuDu(h))
    const noCu = dl.hoaDon.filter((h) => h.kyId !== ky.id && h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY' && Number(h.conLai) > 0)
    const soNguoiNoCu = new Set(noCu.map((h) => khoaHd(h.soPhong, h.nguoiThue))).size
    const hanSom = chuaTra.map((h) => h.hanThanhToan).sort()[0]
    const nhomChuaTra = nhomNo(tuHoaDonQuanLy(chuaTra, { id: toaNhaId, ten: tenToa }, homNayIso(), dl.hopDong))
    const hanTra = (h: ThongTinHoaDonQuanLy) => { const n = ngayToi(h.hanThanhToan); return n >= 0 ? `Chưa trả, còn ${n} ngày` : `Chưa trả, quá hạn ${-n} ngày` }
    return <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <KhoiSo so={[
        { nhan: `Đã thu tháng ${ky.thang}`, giaTri: tien(tongTien(dangThu, 'daThu')), phu: `${dangThu.length - chuaTra.length}/${dangThu.length} phòng` },
        { nhan: 'Chưa trả', giaTri: tien(tongTien(chuaTra, 'conLai')), phu: `${chuaTra.length} phòng${hanSom ? ` · hạn ${dinhDangNgayIso(hanSom)}` : ''}` },
        { nhan: 'Nợ cũ các tháng trước', giaTri: tien(tongTien(noCu, 'conLai')), tone: 'no', phu: <a href="/thu-tien" onClick={diToi('/thu-tien')}>{soNguoiNoCu} người · mở danh sách nợ</a> },
      ]} />
      <Card title={`Hoá đơn tháng ${ky.thang}`}>
        {dangThu.length === 0 ? <p className="t-sm" style={{ margin: 0 }}>Chưa có hoá đơn nào được gửi trong tháng này.</p> : <>
          {bangHoaDon(dangThu, [
            { key: 'phong', label: 'Phòng', render: (h) => <b>{h.soPhong}</b> },
            { key: 'nguoi', label: 'Người thuê', render: (h) => h.nguoiThue },
            { key: 'tra', label: 'Phải trả', align: 'num', render: (h) => tien(daThuDu(h) ? h.tongTien : h.conLai) },
            { key: 'tt', label: 'Tình trạng', render: (h) => daThuDu(h) ? <StatusTag tone="done">Đã trả đủ</StatusTag> : hanTra(h) },
            { key: 'nut', label: 'Thao tác', align: 'num', render: (h) => daThuDu(h) ? null : <a className="btn btn-secondary btn-sm" href={hrefGhiThu(h)} onClick={diToi(hrefGhiThu(h))}>Ghi thu</a> },
          ])}
          {nhomChuaTra.length ? <div style={{ marginTop: 12 }}><Button variant="secondary" onClick={() => setNhac(0)}><Icon name="message" size="sm" />Nhắc {nhomChuaTra.length} người chưa trả</Button></div> : null}
        </>}
      </Card>
      {nhac !== null && nhomChuaTra[nhac] ? <NganNhacNo key={nhomChuaTra[nhac].khoa} nhom={nhomChuaTra[nhac]} sdt={null} hanTra={dinhDangNgayIso(nhomChuaTra[nhac].hoaDon[0].hanThanhToan)} onDong={() => setNhac(nhac + 1 < nhomChuaTra.length ? nhac + 1 : null)} /> : null}
    </div>
  }

  const thanBuoc = () => [buoc1, buoc2, buoc3, buoc4][b - 1]()

  const cacBuoc: Buoc[] = buoc.map((s, i) => ({
    ten: s.ten, moTa: s.tomTat,
    trangThai: i + 1 === b ? 'nay' : s.trangThai === 'xong' ? 'xong' : 'cho',
    href: s.trangThai === 'chua' ? undefined : `/chu-ky?b=${i + 1}`,
  }))
  const chonBuocTuLink = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a')
    const n = a ? Number(new URL(a.href, 'http://x').searchParams.get('b')) : 0
    if (!a || !n || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault(); chonBuoc(n)
  }
  const chonThang = <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="t-sm">Tháng</span>
    <select className="select" value={ky.id} onChange={(e) => { setKyChon(Number(e.target.value)); setBuocChon(null) }}>
      {dl.ky.map((k) => <option key={k.id} value={k.id}>{nhanKy(k)}{k.trangThai === 'DA_CHOT' ? ' (đã khoá)' : ' (đang làm)'}</option>)}
    </select></label>
  const nut = nutChinh()

  return <section aria-labelledby="chu-ky-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <DauTrang
      tieuDe={`Tháng ${nhanDangXem}`}
      phu={`${tenToa} · tháng ${dinhDangNgayIso(ky.ngayBatDau)} – ${dinhDangNgayIso(ky.ngayKetThuc)}`}
      hanhDong={<>{chonThang}{mobile ? null : <>{nut}<span ref={setSlotNut} style={{ display: 'contents' }} /></>}</>}
    />
    <div onClick={chonBuocTuLink}><ThanhBuoc buoc={cacBuoc} nhan={`Các bước tháng ${ky.thang}`} /></div>
    {xemTruoc ? <div className="banner banner-info" role="note"><Icon name="info" /><div>Bước này mở được sau khi các bước trước xong. Dữ liệu thật đang ở bước {buocHienTai}. <NhanMinhHoa /></div></div> : null}
    {thongBao ? <div className="banner banner-success" role="status"><Icon name="check-circle" /><div>{thongBao}</div></div> : null}
    {loiGhi ? <div className="banner banner-danger" role="alert"><Icon name="alert" /><div>{loiGhi}</div></div> : null}
    <div className={b === 2 ? 'cols' : undefined} aria-busy={dangTai} style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <div style={{ minWidth: 0 }}>{thanBuoc()}</div>
    <div className={b === 2 ? 'side' : undefined} style={b === 2 ? { display: 'grid', gap: 16 } : { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
      {b === 2 ? <Card title="Khoá xong thì sao">
        <p className="t-sm" style={{ margin: 0 }}>Chỉ số tháng {ky.thang} <b>không sửa được nữa</b>. Sai thì phải lập hoá đơn điều chỉnh.</p>
        <p className="t-sm" style={{ margin: '10px 0 0' }}>Sau khi khoá, hệ thống tính sẵn hoá đơn nháp để anh/chị xem lại ở bước 3.</p>
      </Card> : null}
      {b < 4 ? <Card title="Sau bước này">
        <div className="vsteps" style={{ marginTop: 8 }}>
          {buoc.slice(b).map((s, j) => <div key={s.ten} className="vstep todo"><span className="n">{b + j + 1}</span><div><div className="tt">{s.ten}</div><div className="st">{MO_TA_SAU[b + j - 1]}</div></div></div>)}
        </div>
      </Card> : null}
      {kyTruoc ? <Card title={`Tháng ${nhanKy(kyTruoc)} (đã khoá)`} action={<a className="link-more brand" href="/thu-tien" onClick={diToi('/thu-tien')}>Thu tiền</a>}>
        <div className="sumrow"><span>Hoá đơn đã gửi</span><b>{hoaDonTruoc.length}</b></div>
        <div className="sumrow"><span>Đã trả đủ</span><b>{hoaDonTruoc.filter(daThuDu).length}</b></div>
        <div className="sumrow"><span>Còn phải thu</span><b className="t-danger">{tien(tongTien(hoaDonTruoc, 'conLai'))}</b></div>
      </Card> : null}
    </div>
    </div>
    {mobile && nut ? <ChanDinh>{nut}</ChanDinh> : null}
    {xacNhan === 'chot' ? <div style={SCRIM}><ConfirmDialog title={`Khoá chỉ số tháng ${ky.thang}?`} consequence={`Sau khi khoá không sửa được chỉ số của ${dl.tongPhong} phòng.`} confirmLabel="Khoá chỉ số" cancelLabel="Chưa, xem lại" onConfirm={() => void chotKy()} onCancel={() => setXacNhan(null)} /></div> : null}
    {xacNhan === 'phat-hanh' ? <div style={SCRIM}><ConfirmDialog title={`Gửi ${nhap} hoá đơn tháng ${ky.thang}?`} consequence="Người thuê sẽ thấy hoá đơn và hoá đơn không còn sửa được." confirmLabel={`Gửi ${nhap} hoá đơn`} onConfirm={() => void bulk('phat-hanh-hang-loat')} onCancel={() => setXacNhan(null)} /></div> : null}
  </section>
}
