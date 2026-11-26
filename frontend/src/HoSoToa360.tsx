import { useEffect, useState } from 'react'
import './HoSoHopDongToa.css'
import { ApiError, fetchCongNoBaoCao, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, fetchPhong, fetchToaNha, type ThongTinHoaDonQuanLy, type ThongTinHopDong, type ThongTinKyThanhToan, type ThongTinPhong, type ThongTinToaNha, type ThongTinYeuCauSuaChua } from './api'
import { chuCaiDau, CSS_BANG_QUAN_TRI } from './bangQuanTriChung'
import { FormToaNha } from './DanhMucToaNha'
import { Button } from './design/core/Button'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo } from './design/layout/KhoiSo'
import { ChanDinh } from './design/layout/ChanDinh'
import { NhanMinhHoa } from './design/feedback/NhanMinhHoa'
import { dinhDangNgayIso } from './design/core/format'
import { today } from './ManagementShared'
import { useTai } from './HoSoNguoiThue360'
import { dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import type { TrangProps } from './dinhTuyen'
import { Ngan } from './HoSoHopDong360'
import { managementRequest } from './managementApi'

type KhoanNo = { hopDongId: number; conLai: number; han: string; khoa?: string }
type DuLieu = {
  toa: ThongTinToaNha
  phong: ThongTinPhong[]
  // null = phần phụ không tải được (hiện ghi chú, không chặn cả hồ sơ)
  hopDong: ThongTinHopDong[] | null
  no: KhoanNo[] | null
  suCo: ThongTinYeuCauSuaChua[] | null
  ky: ThongTinKyThanhToan[] | null
  hoaDon: ThongTinHoaDonQuanLy[] | null
  pccc: { soViecDenHan: number; thietBi: { id: number; ten: string; hanKiemDinh: string }[] } | null
}

const thongBaoLoi = (e: unknown, mau: string) => (e instanceof ApiError || e instanceof Error ? e.message : mau)
const hoacNull = async <T,>(viec: Promise<T>): Promise<T | null> => { try { return await viec } catch { return null } }
const soNgayTre = (han: string) => Math.max(0, Math.round((new Date().setHours(0, 0, 0, 0) - new Date(`${han}T00:00:00`).getTime()) / 86_400_000))
const CLASS_PHONG: Record<string, string> = { TRONG: 'room trong', DANG_SUA: 'room sua' }
const trieu = (v: number) => `${(v / 1e6).toFixed(1).replace('.', ',').replace(',0', '')} triệu`
const tienD = (v: number) => `${dinhDangTien(v)} ₫`

async function taiHoSo(token: string, vaiTro: string, id: number): Promise<DuLieu | null> {
  const toa = (await fetchToaNha(token)).find((t) => t.id === id)
  if (!toa) return null
  // Quản trị hệ thống không có quyền đọc phòng/hợp đồng/công nợ: chỉ hiện thông tin toà.
  if (vaiTro === 'QTHT') return { toa, phong: [], hopDong: null, no: null, suCo: null, ky: null, hoaDon: null, pccc: null }
  const [phong, hopDong, no, suCo, ky, hoaDon, pccc] = await Promise.all([
    fetchPhong(token, id),
    hoacNull(fetchHopDongQuanLy(token, id)),
    // Chủ đọc báo cáo công nợ; Quản lý chỉ có danh sách hoá đơn nợ của toà.
    hoacNull<KhoanNo[]>(vaiTro === 'CHU'
      ? fetchCongNoBaoCao(token, id).then((r) => r.congNo.map((k) => ({ hopDongId: k.hopDongId, conLai: Number(k.conLai), han: k.hanThanhToan })))
      // JSON thật của /api/hoa-don không có hopDongId (xem nhomNoTheoNguoi.tuHoaDonQuanLy): ghép theo phòng + họ tên ở dưới.
      : fetchHoaDonQuanLy(token, id).then((r) => r.filter((k) => k.trangThai !== 'NHAP' && k.trangThai !== 'DA_HUY' && Number(k.conLai) > 0).map((k) => ({ hopDongId: k.hopDongId ?? 0, conLai: Number(k.conLai), han: k.hanThanhToan, khoa: `${k.soPhong}|${k.nguoiThue}` })))),
    hoacNull(managementRequest<ThongTinYeuCauSuaChua[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${id}`)),
    hoacNull(fetchKyThanhToan(token, id)),
    hoacNull(fetchHoaDonQuanLy(token, id)),
    hoacNull(managementRequest<NonNullable<DuLieu['pccc']>>(token, `/api/toa-nha/${id}/pccc`)),
  ])
  const theoPhongTen = new Map((hopDong ?? []).map((h) => [`${h.soPhong}|${h.hoTenNguoiThue}`, h.id]))
  for (const k of no ?? []) if (!k.hopDongId && k.khoa) k.hopDongId = theoPhongTen.get(k.khoa) ?? 0
  return { toa, phong, hopDong, no, suCo, ky, hoaDon, pccc }
}

/** Bảng giá đang áp dụng của toà: dịch vụ + đơn giá hiện hành (bậc thang ghi là "Bậc thang"). Tải riêng nên chậm/lỗi không chặn hồ sơ. */
function KhoiGiaDichVu({ token, toaId }: { token: string; toaId: number }) {
  const { du, loi, lai } = useTai(async () => {
    const dv = (await managementRequest<{ id: number; ten: string; cheDoGia: string; donVi: string; dangSuDung: boolean }[]>(token, `/api/toa-nha/${toaId}/dich-vu`)).filter((d) => d.dangSuDung)
    return Promise.all(dv.map(async (d) => {
      if (d.cheDoGia === 'BAC_THANG') return { ...d, gia: 'Bậc thang' }
      const g = (await managementRequest<{ donGia: string; dangApDung: boolean }[]>(token, `/api/dich-vu/${d.id}/bang-gia`)).find((x) => x.dangApDung)
      return { ...d, gia: !g ? '—' : Number(g.donGia) === 0 ? 'Miễn phí' : `${dinhDangTien(g.donGia)} ₫ / ${d.donVi || 'tháng'}` }
    }))
  }, `${token}|${toaId}`)
  return (
    <Card title="Giá dịch vụ đang áp dụng" action={<a className="link-more brand" href={`/dich-vu?toaNhaId=${toaId}`}>Sửa giá →</a>}>
      {loi ? <p className="t-sm" role="alert">Chưa tải được giá dịch vụ. <button type="button" className="nt-phu-nut" onClick={lai}>Tải lại</button></p>
        : !du ? <div aria-busy="true" role="status" aria-label="Đang tải giá dịch vụ"><div className="skel skel-line" /><div className="skel skel-line" style={{ width: '70%' }} /></div>
          : du.length === 0 ? <p className="t-sm">Toà này chưa có dịch vụ nào. <a href={`/dich-vu?toaNhaId=${toaId}`}>Thêm dịch vụ →</a></p>
            : <table className="table"><thead><tr><th scope="col">Dịch vụ</th><th scope="col" className="num">Đơn giá</th></tr></thead><tbody>{du.map((d) => <tr key={d.id}><td>{d.ten}</td><td className="num">{d.gia}</td></tr>)}</tbody></table>}
    </Card>
  )
}

export default function HoSoToa360({ token, vaiTro, mobile, thamSo, dieuHuong }: TrangProps) {
  const id = Number(thamSo.id)
  const [du, setDu] = useState<DuLieu | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [lan, setLan] = useState(0)
  const [nganSua, setNganSua] = useState(false)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const coQuyenVanHanh = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'

  useEffect(() => {
    let con = true
    setDangTai(true); setLoi(null)
    taiHoSo(token, vaiTro, id)
      .then((d) => { if (con) setDu(d) })
      .catch((e: unknown) => { if (con) setLoi(thongBaoLoi(e, 'Không thể tải hồ sơ toà nhà.')) })
      .finally(() => { if (con) setDangTai(false) })
    return () => { con = false }
  }, [token, vaiTro, id, lan])

  if (dangTai && !du) return <EmptyState kind="loading" title="Đang tải hồ sơ toà nhà…" />
  if (loi) return <EmptyState kind="error" title="Không tải được hồ sơ toà nhà" body={`${loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setLan((n) => n + 1)} />
  if (!du) return <EmptyState title="Không tìm thấy toà nhà này" body="Toà nhà không tồn tại hoặc không thuộc phạm vi bạn được xem." actionLabel="Danh sách toà" onAction={() => dieuHuong('/toa-nha')} />

  const { toa, phong, hopDong, no, suCo, ky, hoaDon, pccc } = du
  const hdTheoId = new Map((hopDong ?? []).map((h) => [h.id, h]))
  const hdHieuLuc = new Map((hopDong ?? []).filter((h) => h.trangThai === 'HIEU_LUC').map((h) => [h.phongId, h]))
  const dem = (tt: string) => phong.filter((p) => p.trangThai === tt).length
  const tang = [...new Set(phong.map((p) => p.tang))].sort((a, b) => a - b)
  const tongNo = (no ?? []).reduce((t, k) => t + k.conLai, 0)
  const suCoMo = (suCo ?? []).filter((s) => !['DA_DONG', 'DA_HUY'].includes(s.trangThai))
  // Hợp đồng cần xử lý: chờ ký, hoặc hiệu lực còn ≤ 30 ngày.
  const canXuLy = (hopDong ?? []).filter((h) => h.trangThai === 'CHO_KY' || (h.trangThai === 'HIEU_LUC' && h.soNgayConLai <= 30)).sort((a, b) => Number(b.trangThai === 'CHO_KY') - Number(a.trangThai === 'CHO_KY') || a.soNgayConLai - b.soNgayConLai)
  const khanChuaGiao = suCoMo.filter((s) => s.mucDo === 'KHAN_CAP' && !s.nguoiXuLyId)

  // Gộp nợ theo người thuê (qua hợp đồng), xếp giảm dần; nợ theo phòng cho sơ đồ.
  const theoNguoi = new Map<number, { id: number; ten: string; phong: string; tong: number; ky: number; tre: number }>()
  const noPhong = new Map<number, number>()
  for (const k of no ?? []) {
    const h = hdTheoId.get(k.hopDongId)
    if (!h) continue
    const cu = theoNguoi.get(h.nguoiThueId) ?? { id: h.nguoiThueId, ten: h.hoTenNguoiThue, phong: h.soPhong, tong: 0, ky: 0, tre: 0 }
    theoNguoi.set(h.nguoiThueId, { ...cu, tong: cu.tong + k.conLai, ky: cu.ky + 1, tre: Math.max(cu.tre, soNgayTre(k.han)) })
    noPhong.set(h.phongId, (noPhong.get(h.phongId) ?? 0) + k.conLai)
  }
  const nguoiNo = [...theoNguoi.values()].sort((a, b) => b.tong - a.tong)
  const quaHan = (no ?? []).filter((k) => soNgayTre(k.han) > 0)
  const nguoiQuaHan = new Set(quaHan.map((k) => hdTheoId.get(k.hopDongId)?.nguoiThueId ?? `hd${k.hopDongId}`))
  const q = `?toaNhaId=${toa.id}`

  // Tháng đang mở mà chưa có hoá đơn nào đã gửi; tháng trước đã thu bao nhiêu % (cộng từ hoá đơn).
  const kySapXep = [...(ky ?? [])].sort((a, b) => b.nam - a.nam || b.thang - a.thang)
  const kyMo = kySapXep.find((k) => k.trangThai === 'DANG_MO')
  const kyTruoc = kySapXep.find((k) => k.trangThai !== 'DANG_MO' && (!kyMo || k.nam * 12 + k.thang < kyMo.nam * 12 + kyMo.thang))
  const hdKy = (kyId: number) => (hoaDon ?? []).filter((h) => h.kyId === kyId && h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY')
  const chuaGui = kyMo && hoaDon && hdKy(kyMo.id).length === 0
  const thuTruoc = kyTruoc && hoaDon ? hdKy(kyTruoc.id) : []
  const tongPhaiThu = thuTruoc.reduce((t, h) => t + Number(h.tongTien), 0)
  const phanTramThu = tongPhaiThu > 0 ? Math.round((thuTruoc.reduce((t, h) => t + Number(h.daThu), 0) / tongPhaiThu) * 100) : null

  // Việc kế tiếp: đúng một việc ưu tiên cao nhất; nút chính của việc đó là nút chính duy nhất của màn.
  const viec = khanChuaGiao[0] ? { muc: 'no', td: `${khanChuaGiao[0].hangMuc} phòng ${khanChuaGiao[0].soPhong} khẩn, chưa giao thợ`, nut: 'Giao thợ', href: `/su-co?id=${khanChuaGiao[0].id}` }
    : quaHan.length ? { muc: 'no', td: `${nguoiQuaHan.size} người nợ ${tienD(quaHan.reduce((t, k) => t + k.conLai, 0))}, cũ nhất trễ ${Math.max(...quaHan.map((k) => soNgayTre(k.han)))} ngày`, nut: 'Thu nợ', href: `/thu-tien${q}` }
      : canXuLy[0] ? { muc: 'canh', td: canXuLy[0].trangThai === 'CHO_KY' ? `Hợp đồng phòng ${canXuLy[0].soPhong} chờ ký` : `Hợp đồng phòng ${canXuLy[0].soPhong} hết hạn sau ${canXuLy[0].soNgayConLai} ngày`, nut: canXuLy[0].trangThai === 'CHO_KY' ? 'Mở hợp đồng' : 'Gia hạn', href: `/hop-dong/${canXuLy[0].id}` }
        : chuaGui ? { muc: 'canh', td: `Tháng ${kyMo.thang} chưa gửi hoá đơn`, nut: 'Xem tiến độ', href: `/chu-ky${q}` }
          : null
  const nutViec = viec ? <a className="btn btn-primary" href={viec.href}>{viec.nut}</a> : null

  const soDo = (
    <Card title="Sơ đồ phòng" action={<span className="hs-chuthich"><span className="no">đang nợ</span><span className="trong">trống</span><span className="sua">đang sửa</span></span>}>
      {phong.length === 0 ? <p className="t-sm">Toà này chưa có phòng nào.{vaiTro === 'QUAN_LY' ? ' Dùng nút “Khai báo phòng” ở đầu trang.' : ''}</p> : tang.slice().reverse().map((t) => (
        <div key={t} className="hs-hang-tang">
          <div className="hs-tang">Tầng {t}</div>
          <div className="rooms hs-so-do">
            {phong.filter((p) => p.tang === t).map((p) => {
              const nguoi = hdHieuLuc.get(p.id ?? -1)?.hoTenNguoiThue
              const noP = p.id === null ? 0 : noPhong.get(p.id) ?? 0
              const phu = p.trangThai === 'TRONG' ? 'Trống' : p.trangThai === 'DANG_SUA' ? 'Đang sửa' : noP > 0 ? `nợ ${trieu(noP)}` : p.trangThai === 'DANG_THUE' && nguoi ? nguoi.split(' ').slice(-2).join(' ') : p.tenTrangThai
              const lop = noP > 0 && p.trangThai === 'DANG_THUE' ? 'room no' : CLASS_PHONG[p.trangThai] ?? 'room'
              const noi = <><b>{p.soPhong}</b><span>{phu}</span></>
              const nhan = `Phòng ${p.soPhong}, ${p.tenTrangThai}${noP > 0 ? `, nợ ${tienD(noP)}` : ''}`
              return p.id === null
                ? <div key={p.soPhong} className={lop} aria-label={nhan} role="group">{noi}</div>
                : <a key={p.id} className={lop} href={`/phong/${p.id}${q}`} aria-label={nhan}>{noi}</a>
            })}
          </div>
        </div>
      ))}
    </Card>
  )

  const canChuY = (
    <Card title="Cần chú ý">
      {!no || !hopDong ? <p className="t-sm t-2" role="status">Chưa tải được {[!no && 'công nợ', !hopDong && 'hợp đồng'].filter(Boolean).join(', ')}.</p> : null}
      <div style={{ margin: '4px -24px -8px' }}>
        {nguoiNo.slice(0, 3).map((n) => (
          <a key={n.id} className="irow" href={`/nguoi-thue/${n.id}`}>
            <span className={`avatar sm h${(n.id % 5) + 1}`} aria-hidden="true">{chuCaiDau(n.ten)}</span>
            <div className="body"><div className="t">{n.ten} · Phòng {n.phong}</div><div className="s">nợ {n.ky} tháng · trễ {n.tre} ngày</div></div>
            <div className="money t-danger">{tienD(n.tong)}</div><Icon name="chevron-right" size="sm" />
          </a>
        ))}
        {canXuLy.map((h) => (
          <a key={h.id} className="irow" href={`/hop-dong/${h.id}`}>
            <span className="tile warm" aria-hidden="true"><Icon name="contract" /></span>
            <div className="body"><div className="t">Hợp đồng phòng {h.soPhong}</div><div className="s">{h.hoTenNguoiThue}</div></div>
            <StatusTag tone={h.trangThai === 'CHO_KY' ? 'draft' : 'waiting'}>{h.trangThai === 'CHO_KY' ? 'Chờ ký' : `còn ${h.soNgayConLai} ngày`}</StatusTag><Icon name="chevron-right" size="sm" />
          </a>
        ))}
        {khanChuaGiao.map((s) => (
          <a key={s.id} className="irow" href={`/su-co?id=${s.id}`}>
            <span className="tile warm" aria-hidden="true"><Icon name="wrench" /></span>
            <div className="body"><div className="t">{s.hangMuc} · {s.soPhong}</div><div className="s">khẩn, chưa giao thợ</div></div>
            <StatusTag tone="urgent">Khẩn</StatusTag><Icon name="chevron-right" size="sm" />
          </a>
        ))}
        {nguoiNo.length === 0 && canXuLy.length === 0 && khanChuaGiao.length === 0 ? <p className="t-sm" style={{ padding: '0 24px 12px' }}>Chưa có gì cần chú ý ở toà này.</p> : null}
      </div>
    </Card>
  )

  const thietBi = [...(pccc?.thietBi ?? [])].sort((a, b) => a.hanKiemDinh.localeCompare(b.hanKiemDinh)).slice(0, 3)
  const homNay = today()
  const antoan = (
    <Card title="An toàn PCCC" action={<span className="t-meta">{pccc ? `${pccc.soViecDenHan} việc đến hạn` : 'chưa tải được'}</span>}>
      {thietBi.length ? <table className="table"><tbody>{thietBi.map((d) => <tr key={d.id}><td>{d.ten}</td><td className={`num${d.hanKiemDinh < homNay ? ' t-danger' : ''}`}>hạn {dinhDangNgayIso(d.hanKiemDinh.slice(0, 10))}</td></tr>)}</tbody></table> : <p className="t-sm">{pccc ? 'Chưa khai báo thiết bị PCCC.' : 'Chưa tải được dữ liệu PCCC.'} <a href={`/an-toan${q}`}>Mở An toàn →</a></p>}
    </Card>
  )

  return (
    <div className="hs-toa" style={{ display: 'grid', gap: 16, minWidth: 0 }} data-testid="ho-so-toa">
      <style>{CSS_BANG_QUAN_TRI}</style>
      <DauTrang
        vet={vaiTro === 'QUAN_LY' ? undefined : [{ nhan: 'Toà & phòng', href: '/toa-nha' }, { nhan: toa.ten, href: `/toa-nha/${toa.id}` }]}
        tieuDe={vaiTro === 'QUAN_LY' ? 'Phòng' : toa.ten}
        phu={`${toa.diaChi} · ${toa.soTang} tầng${coQuyenVanHanh ? ` · ${phong.length} phòng` : ''}`}
        hanhDong={coQuyenVanHanh ? (
          <>
            <a className="btn btn-secondary" href={`/dich-vu${q}`}>Giá dịch vụ</a>
            <Button variant="secondary" onClick={() => { setThongBao(null); setNganSua(true) }}>Sửa thông tin toà</Button>
            {vaiTro === 'QUAN_LY' ? <a className="btn btn-secondary" href={`/phong${q}&moi=1`}>Khai báo phòng</a> : null}
          </>
        ) : undefined}
      />
      {thongBao ? <div role="status" className="alert alert-success"><Icon name="check-circle" />{thongBao}</div> : null}

      {coQuyenVanHanh ? (
        <>
          <div className="ma-dongviec hs-viec" data-muc={viec?.muc ?? 'ok'}>
            <span className="ma-dongviec-cham" aria-hidden="true" />
            <div className="ma-dongviec-than"><span className="ma-dongviec-mt">Việc kế tiếp</span><span className="ma-dongviec-td">{viec ? viec.td : 'Không có việc gấp ở toà này.'}</span></div>
            {mobile ? null : nutViec}
          </div>
          <KhoiSo so={[
            { nhan: 'Đang thuê', giaTri: dem('DANG_THUE'), donVi: `/ ${phong.length} phòng`, href: `/nguoi-thue${q}` },
            { nhan: 'Còn nợ', giaTri: no ? tienD(tongNo) : '—', tone: tongNo > 0 ? 'no' : 'thuong', phu: no ? `${nguoiNo.length} người` : 'chưa tải được', href: `/thu-tien${q}` },
            { nhan: kyTruoc ? `Tháng ${kyTruoc.thang} đã thu` : 'Tháng trước đã thu', giaTri: phanTramThu === null ? '—' : `${phanTramThu}%`, anKhiHep: true },
            { nhan: 'Sự cố đang mở', giaTri: suCo ? suCoMo.length : '—', href: `/su-co${q}` },
          ]} />
          <div className="cols" style={{ alignItems: 'start' }}>
            <div className="side">{mobile ? canChuY : soDo}{mobile ? soDo : <KhoiGiaDichVu token={token} toaId={toa.id} />}{mobile ? <KhoiGiaDichVu token={token} toaId={toa.id} /> : null}</div>
            <div className="side">{mobile ? null : canChuY}{antoan}</div>
          </div>
          {mobile && nutViec ? <ChanDinh>{nutViec}</ChanDinh> : null}
        </>
      ) : (
        <Card title="Thông tin toà">
          <dl className="kv" style={{ marginTop: 8, gridTemplateColumns: '140px minmax(0, 1fr)' }}>
            <dt>Mã toà</dt><dd>{toa.maToa}</dd>
            <dt>Địa chỉ</dt><dd>{toa.diaChi}</dd>
            <dt>Số tầng</dt><dd>{toa.soTang}</dd>
            <dt>Chốt số</dt><dd>ngày {toa.ngayChotSo} hằng tháng</dd>
            <dt>Hạn thanh toán</dt><dd>{toa.soNgayHanTt} ngày</dd>
          </dl>
          <p className="t-sm" style={{ marginTop: 12 }}>Quản trị hệ thống chỉ xem thông tin toà; phòng, hợp đồng và công nợ do Chủ nhà và Quản lý theo dõi.</p>
        </Card>
      )}

      {nganSua ? (
        <Ngan tieuDe="Sửa thông tin toà" onDong={() => setNganSua(false)}>
          <FormToaNha token={token} toa={toa} onHuy={() => setNganSua(false)} onXong={(x) => { setDu({ ...du, toa: x }); setNganSua(false); setThongBao('Đã cập nhật thông tin toà nhà.') }} />
        </Ngan>
      ) : null}
    </div>
  )
}
