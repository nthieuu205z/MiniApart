import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { chotKyThanhToan, fetchChiSoDichVu, fetchHoaDonQuanLy, fetchKyThanhToan, fetchPhongChuaGhiChiSo, type ThongTinHoaDonQuanLy, type ThongTinKyThanhToan, type ThongTinPhongChuaGhiChiSo } from './api'
import { tinhBuoc } from './tinhBuocChuKy'
import GhiChiSo from './GhiChiSo'
import type { TrangProps } from './dinhTuyen'
import { bulkInvoice } from './financeApi'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { tenToaDangChon, useMotToa } from './toaDangChon'

type DuLieu = { ky: ThongTinKyThanhToan[]; thieu: ThongTinPhongChuaGhiChiSo[]; tongPhong: number; hoaDon: ThongTinHoaDonQuanLy[] }

const thuTu = (k: ThongTinKyThanhToan) => k.nam * 12 + k.thang
const nhanKy = (k: ThongTinKyThanhToan) => `${String(k.thang).padStart(2, '0')}/${k.nam}`
const loiChu = (e: unknown, macDinh: string) => (e instanceof Error && e.message ? e.message : macDinh)
const conLaiTong = (ds: ThongTinHoaDonQuanLy[]) => ds.reduce((t, h) => t + (Number(h.conLai) || 0), 0)
const daThuDu = (h: ThongTinHoaDonQuanLy) => !(Number(h.conLai) > 0)
const MO_TA_SAU = ['Khoá chỉ số, không sửa được nữa', 'Tạo nháp hoá đơn, kiểm rồi phát hành', 'Theo dõi ở Thu tiền, nhóm theo người']
const SCRIM = { position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(28,25,23,.45)', padding: 16 } as const

function ngaySau(denNgay: string): number {
  const [y, m, d] = denNgay.split('-').map(Number)
  const homNay = new Date()
  return Math.max(0, Math.round((Date.UTC(y, m - 1, d) - Date.UTC(homNay.getFullYear(), homNay.getMonth(), homNay.getDate())) / 86400000))
}

export default function ChuKyThang({ token, vaiTro, mobile, dieuHuong }: TrangProps) {
  const toa = useMotToa()
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

  // Hai bước tải: danh sách kỳ (đổi toà / sau khi ghi) rồi dữ liệu của kỳ đang xem (đổi kỳ).
  useEffect(() => {
    setDsKy(null); setDl(null); setLoi(null)
    if (toaNhaId === null) return undefined
    let active = true
    setDangTai(true)
    fetchKyThanhToan(token, toaNhaId)
      .then((k) => { if (active) setDsKy([...k].sort((a, b) => thuTu(b) - thuTu(a))) })
      .catch((e: unknown) => { if (active) { setLoi(loiChu(e, 'Không tải được danh sách kỳ.')); setDangTai(false) } })
    return () => { active = false }
  }, [token, toaNhaId, lan])

  const kyDangXem = useMemo(() => dsKy?.find((k) => k.id === kyChon) ?? dsKy?.find((k) => k.trangThai !== 'DA_CHOT') ?? dsKy?.[0], [dsKy, kyChon])
  const kyId = kyDangXem?.id ?? null

  useEffect(() => {
    if (dsKy === null || toaNhaId === null) return undefined
    if (kyId === null) { setDl({ ky: dsKy, thieu: [], tongPhong: 0, hoaDon: [] }); setDangTai(false); return undefined }
    let active = true
    setDangTai(true)
    Promise.all([fetchPhongChuaGhiChiSo(token, toaNhaId, kyId), fetchChiSoDichVu(token, toaNhaId, kyId), fetchHoaDonQuanLy(token, toaNhaId, '')])
      .then(([thieu, chiSo, hoaDon]) => { if (active) setDl({ ky: dsKy, thieu, tongPhong: chiSo.tongPhong, hoaDon }) })
      .catch((e: unknown) => { if (active) setLoi(loiChu(e, 'Không tải được dữ liệu chu kỳ.')) })
      .finally(() => { if (active) setDangTai(false) })
    return () => { active = false }
  }, [token, toaNhaId, dsKy, kyId])

  const taiLai = useCallback(() => setLan((x) => x + 1), [])
  const chonBuoc = (n: number) => { setBuocChon(n); setThongBao(null); setLoiGhi(null); dieuHuong(`/chu-ky?b=${n}`) }
  const diToi = (href: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault(); dieuHuong(href)
  }

  if (toaNhaId === null) {
    return <section aria-labelledby="chu-ky-title" style={{ display: 'grid', gap: 16 }}>
      <div className="ph"><div className="grow"><h1 className="h1" id="chu-ky-title">Chu kỳ tháng</h1><p className="sub">{tenToaDangChon(toa)}</p></div></div>
      <Card><div className="field" style={{ maxWidth: 320 }}>
        <label className="label" htmlFor="chu-ky-toa">{toa.canChonTaiCho ? 'Chọn toà để xem chu kỳ' : 'Đang tải toà…'}</label>
        <select id="chu-ky-toa" className="select" value="" onChange={(e) => toa.chon(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Chọn toà nhà</option>{toa.danhSach.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
        </select>
      </div></Card>
    </section>
  }

  const vo = (noiDung: ReactNode) => <section aria-labelledby="chu-ky-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <div className="ph"><div className="grow"><h1 className="h1" id="chu-ky-title">Chu kỳ tháng</h1></div></div>{noiDung}
  </section>
  if (loi) return vo(<EmptyState kind="error" title="Không tải được chu kỳ tháng" body="Dữ liệu chưa bị thay đổi." actionLabel="Thử lại" onAction={taiLai} />)
  if (dl && !kyDangXem) return vo(<EmptyState title="Toà này chưa có kỳ thanh toán" body="Mở kỳ đầu tiên ở Dịch vụ & đơn giá, rồi quay lại đây để ghi chỉ số." actionLabel="Mở Dịch vụ & đơn giá" onAction={() => dieuHuong('/dich-vu')} />)
  if (!dl || !kyDangXem) {
    return vo(<div aria-busy="true" style={{ display: 'grid', gap: 12 }}><span className="skel skel-line" style={{ width: '100%', height: 72 }} /><span className="skel skel-line" style={{ width: '100%', height: 220 }} /></div>)
  }

  const ky = kyDangXem
  const hoaDonKy = dl.hoaDon.filter((h) => h.kyId === ky.id)
  const nhap = hoaDonKy.filter((h) => h.trangThai === 'NHAP').length
  const dangThu = hoaDonKy.filter((h) => h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY')
  const soThieu = dl.thieu.length
  const { buocHienTai, buoc } = tinhBuoc({ ky, soCongToThieu: soThieu, tongCongTo: dl.tongPhong, hoaDon: hoaDonKy })
  const b = buocChon ?? buocHienTai
  const kyTruoc = dl.ky.find((k) => k.trangThai === 'DA_CHOT' && thuTu(k) < thuTu(ky))
  const hoaDonTruoc = kyTruoc ? dl.hoaDon.filter((h) => h.kyId === kyTruoc.id && h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY') : []
  const tenToa = toa.danhSach.find((t) => t.id === toaNhaId)?.ten ?? ''
  const nhanKyDangXem = nhanKy(ky)

  const cuonToiCongTo = () => {
    // Id do x8 đặt: cong-to-{phongId}-{dichVuId}; chỉ biết phòng nên lấy ô đầu tiên của phòng đó.
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
    return `Đã chốt kỳ ${nhanKyDangXem}.`
  })
  const bulk = (action: 'tao-hang-loat' | 'phat-hanh-hang-loat') => ghi(async () => {
    const kq = await bulkInvoice(token, toaNhaId!, ky.id, action)
    return action === 'tao-hang-loat' ? `Đã tạo ${kq.soHoaDonTaoMoi ?? 0} hoá đơn nháp.` : `Đã phát hành ${kq.soHoaDonDaPhatHanh ?? 0} hoá đơn.`
  })

  const hrefHoaDon = `/hoa-don?toaNhaId=${toaNhaId}&kyId=${ky.id}`
  const thanBuoc = () => {
    if (b === 1) return <section className="card" aria-labelledby="b1" style={{ display: 'grid', gap: 12 }}>
      <h2 className="h2" id="b1">Bước 1 · Ghi chỉ số kỳ {nhanKyDangXem}</h2>
      {soThieu > 0
        ? <div className="banner banner-warning"><Icon name="alert" /><div><b>Còn {soThieu} công tơ chưa ghi</b> ở phòng {dl.thieu.slice(0, 4).map((p) => p.soPhong).join(', ')}{soThieu > 4 ? '…' : ''}. Ghi đủ trước khi chốt kỳ.</div><Button size="sm" className="b-act" onClick={cuonToiCongTo}>Ghi {soThieu} công tơ</Button></div>
        : <div className="banner banner-success"><Icon name="check-circle" /><div>Đã ghi đủ chỉ số.</div><Button size="sm" className="b-act" onClick={() => chonBuoc(2)}>Sang bước chốt kỳ</Button></div>}
      <GhiChiSo token={token} mobile={mobile} vaiTro={vaiTro} anNutChot />
    </section>
    if (b === 2) return <Card title={`Bước 2 · Chốt kỳ ${nhanKyDangXem}`}>
      <p className="t-sm">Khoá chỉ số, không sửa được nữa. Sau khi chốt mới tạo được hoá đơn cho kỳ này.</p>
      <div style={{ marginTop: 14 }}>
        <Button blocked={dangGhi || ky.trangThai === 'DA_CHOT' || soThieu > 0} blockedReason={ky.trangThai === 'DA_CHOT' ? 'Kỳ này đã chốt.' : soThieu > 0 ? `Còn ${soThieu} công tơ chưa ghi chỉ số.` : undefined} onClick={() => setXacNhan('chot')}>{dangGhi ? 'Đang chốt…' : `Chốt kỳ ${nhanKyDangXem}`}</Button>
      </div>
    </Card>
    if (b === 3) return <Card title="Bước 3 · Phát hành hoá đơn">
      <div className="sumrow"><span>Hoá đơn nháp</span><b>{nhap}</b></div>
      <div className="sumrow"><span>Đã phát hành</span><b>{hoaDonKy.length - nhap}</b></div>
      <div className="row-wrap" style={{ marginTop: 14, alignItems: 'center', gap: 12 }}>
        {nhap > 0
          ? <Button blocked={dangGhi} onClick={() => setXacNhan('phat-hanh')}>Phát hành {nhap} hoá đơn</Button>
          : <Button blocked={dangGhi || ky.trangThai !== 'DA_CHOT' || hoaDonKy.length > 0} blockedReason={ky.trangThai !== 'DA_CHOT' ? 'Chốt kỳ trước khi tạo hoá đơn.' : hoaDonKy.length > 0 ? 'Mọi hoá đơn của kỳ đã phát hành.' : undefined} onClick={() => void bulk('tao-hang-loat')}>Tạo nháp hoá đơn</Button>}
        <a className="link-more brand" href={hrefHoaDon} onClick={diToi(hrefHoaDon)}>Kiểm từng hoá đơn</a>
      </div>
    </Card>
    return <Card title="Bước 4 · Thu tiền">
      <div className="sumrow"><span>Đã phát hành</span><b>{dangThu.length}</b></div>
      <div className="sumrow"><span>Đã thu đủ</span><b>{dangThu.filter(daThuDu).length}</b></div>
      <div className="sumrow"><span>Còn phải thu</span><b className="t-danger">{dinhDangTien(conLaiTong(dangThu))} ₫</b></div>
      <div style={{ marginTop: 14 }}><Button onClick={() => dieuHuong('/thu-tien')}>Mở Thu tiền</Button></div>
    </Card>
  }

  return <section aria-labelledby="chu-ky-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <div className="ph">
      <div className="grow">
        <h1 className="h1" id="chu-ky-title">Chu kỳ tháng {nhanKyDangXem}</h1>
        <p className="sub">{tenToa} · kỳ {dinhDangNgayIso(ky.ngayBatDau)} – {dinhDangNgayIso(ky.ngayKetThuc)} · chốt sổ sau {ngaySau(ky.ngayKetThuc)} ngày</p>
      </div>
      {dl.ky.length > 1 ? <div className="ph-acts"><label className="sr-only" htmlFor="chu-ky-ky">Kỳ</label>
        <select id="chu-ky-ky" className="select" value={ky.id} onChange={(e) => { setKyChon(Number(e.target.value)); setBuocChon(null) }}>
          {dl.ky.map((k) => <option key={k.id} value={k.id}>Kỳ {nhanKy(k)}{k.trangThai === 'DA_CHOT' ? ' (đã chốt)' : ''}</option>)}
        </select></div> : null}
    </div>
    <nav className="steps" aria-label="Các bước chu kỳ tháng">
      {buoc.map((s, i) => {
        const n = i + 1
        const noiDung = <><span className="n">{n}</span><span><span className="tt" style={{ display: 'block' }}>{s.ten}</span><span className="st" style={{ display: 'block' }}>{s.tomTat}</span></span></>
        const cls = `step ${s.trangThai === 'xong' ? 'done' : s.trangThai === 'dang' ? 'cur' : 'todo'}`
        return s.trangThai === 'chua'
          ? <div key={s.ten} className={cls}>{noiDung}</div>
          : <a key={s.ten} className={cls} href={`/chu-ky?b=${n}`} aria-current={n === b ? 'step' : undefined} onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) { e.preventDefault(); chonBuoc(n) } }}>{noiDung}</a>
      })}
    </nav>
    {thongBao ? <div className="banner banner-success" role="status"><Icon name="check-circle" /><div>{thongBao}</div></div> : null}
    {loiGhi ? <div className="banner banner-danger" role="alert"><Icon name="alert" /><div>{loiGhi}</div></div> : null}
    <div className="cols" aria-busy={dangTai}>
      <div style={{ minWidth: 0 }}>{thanBuoc()}</div>
      <div className="side" style={{ display: 'grid', gap: 16 }}>
        {b < 4 ? <Card title="Sau bước này">
          <div className="vsteps" style={{ marginTop: 8 }}>
            {buoc.slice(b).map((s, j) => <div key={s.ten} className="vstep todo"><span className="n">{b + j + 1}</span><div><div className="tt">{s.ten}</div><div className="st">{MO_TA_SAU[b + j - 1]}</div></div></div>)}
          </div>
        </Card> : null}
        {kyTruoc ? <Card title={`Kỳ ${nhanKy(kyTruoc)} (đã chốt)`} action={<a className="link-more brand" href="/thu-tien" onClick={diToi('/thu-tien')}>Thu tiền</a>}>
          <div className="sumrow"><span>Hoá đơn đã phát hành</span><b>{hoaDonTruoc.length}</b></div>
          <div className="sumrow"><span>Đã thu đủ</span><b>{hoaDonTruoc.filter(daThuDu).length}</b></div>
          <div className="sumrow"><span>Còn phải thu</span><b className="t-danger">{dinhDangTien(conLaiTong(hoaDonTruoc))} ₫</b></div>
        </Card> : null}
      </div>
    </div>
    {xacNhan === 'chot' ? <div style={SCRIM}><ConfirmDialog title={`Chốt kỳ ${nhanKyDangXem} ${tenToa}?`} consequence={`Khoá chỉ số của ${dl.tongPhong} phòng, không sửa được nữa.`} confirmLabel={`Chốt kỳ ${nhanKyDangXem}`} onConfirm={() => void chotKy()} onCancel={() => setXacNhan(null)} /></div> : null}
    {xacNhan === 'phat-hanh' ? <div style={SCRIM}><ConfirmDialog title={`Phát hành ${nhap} hoá đơn kỳ ${nhanKyDangXem}?`} consequence="Người thuê sẽ thấy hoá đơn và hoá đơn không còn sửa được." confirmLabel={`Phát hành ${nhap} hoá đơn`} onConfirm={() => void bulk('phat-hanh-hang-loat')} onCancel={() => setXacNhan(null)} /></div> : null}
  </section>
}
