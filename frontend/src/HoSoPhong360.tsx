import { useState } from 'react'
import { fetchChiSoDichVu, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, fetchPhong, type ThongTinGhiChiSo, type ThongTinKyThanhToan, type ThongTinPhong, type ThongTinToaNha, type ThongTinYeuCauSuaChua } from './api'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo } from './design/layout/KhoiSo'
import { ChanDinh } from './design/layout/ChanDinh'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { dinhDangNgayIso, dinhDangSo } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import type { TrangProps } from './dinhTuyen'
import { BangHoaDon, KhoiSuCo, TrangThaiTai, kyNhanCua, tien, useTai, type HoaDonHoSo, type HopDongToa } from './HoSoNguoiThue360'
import { managementRequest } from './managementApi'
import { useBuildings } from './ManagementShared'
import QuanLyTaiSanPhong from './QuanLyTaiSanPhong'
import './HoSoNguoiPhong.css'

type DuLieu = {
  phong: ThongTinPhong
  toa: ThongTinToaNha
  hopDong: HopDongToa[]
  hoaDon: HoaDonHoSo[]
  suCo: ThongTinYeuCauSuaChua[]
  ky: ThongTinKyThanhToan | null
  chiSo: ThongTinGhiChiSo['phong'][number]['dichVu'] | null
  noTheoTen: Map<string, number> // nợ còn lại theo họ tên người thuê (mọi tháng, trước khi cắt 4 dòng hiển thị)
  khongTai: string[]
}

async function taiPhong(token: string, id: number, toaUng: ThongTinToaNha[]): Promise<DuLieu> {
  // Toà từ ?toaNhaId= thì chỉ hỏi toà đó; không có thì quét các toà của bối cảnh (vài toà, chạy song song).
  const tim = await Promise.all(toaUng.map(async (t) => ({ t, p: (await fetchPhong(token, t.id)).find((x) => x.id === id) })))
  const thay = tim.find((x) => x.p)
  if (!thay?.p) throw new Error('Không thấy phòng này trong các toà bạn quản lý.')
  const { t: toa, p: phong } = thay
  const [hd, hoaDon, ky] = await Promise.all([fetchHopDongQuanLy(token, toa.id), fetchHoaDonQuanLy(token, toa.id, ''), fetchKyThanhToan(token, toa.id)])
  const kyHienTai = ky.find((k) => k.trangThai === 'DANG_MO') ?? ky[0] ?? null
  const khongTai: string[] = []
  const phu = async <T,>(ten: string, viec: Promise<T>, macDinh: T) => { try { return await viec } catch { khongTai.push(ten); return macDinh } }
  const [suCo, chiSo] = await Promise.all([
    phu('sự cố', managementRequest<ThongTinYeuCauSuaChua[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${toa.id}`).then((rows) => rows.filter((s) => s.phongId === id)), [] as ThongTinYeuCauSuaChua[]),
    kyHienTai ? phu('chỉ số điện nước', fetchChiSoDichVu(token, toa.id, kyHienTai.id).then((c) => c.phong.find((p) => p.id === id)?.dichVu ?? null), null) : null,
  ])
  const cuaPhong = hoaDon.filter((r) => r.soPhong === phong.soPhong && r.trangThai !== 'NHAP' && r.trangThai !== 'DA_HUY')
  const noTheoTen = new Map<string, number>()
  for (const r of cuaPhong) noTheoTen.set(r.nguoiThue, (noTheoTen.get(r.nguoiThue) ?? 0) + Math.max(0, Number(r.conLai)))
  return {
    phong, toa, ky: kyHienTai, chiSo, suCo, khongTai, noTheoTen,
    hopDong: hd.filter((h) => h.phongId === id).map((h) => ({ ...h, toaNhaId: toa.id, tenToa: toa.ten })).sort((a, b) => b.ngayBatDau.localeCompare(a.ngayBatDau)),
    // 4 tháng gần nhất của phòng (hoá đơn nhận diện theo số phòng trong toà).
    hoaDon: hoaDon.filter((r) => r.soPhong === phong.soPhong && r.trangThai !== 'NHAP').sort((a, b) => b.hanThanhToan.localeCompare(a.hanThanhToan)).slice(0, 4)
      .map((r) => ({ ...r, toaNhaId: toa.id, kyNhan: kyNhanCua(ky.find((k) => k.id === r.kyId)) })),
  }
}

/** Quản lý tài sản phòng vốn nằm trong ô chi tiết dưới danh sách phòng; ô đó đã bỏ nên mang về hồ sơ. Chỉ mở khi bấm: màn này giữ đúng một nút chính. */
function KhoiTaiSan({ token, phongId, soPhong, mobile }: { token: string; phongId: number; soPhong: string; mobile: boolean }) {
  const [mo, setMo] = useState(false)
  return (
    <section className="card" aria-labelledby="hs-tai-san">
      <div className="blk-h"><h2 id="hs-tai-san">Tài sản trong phòng</h2>{mo ? null : <button type="button" className="btn btn-secondary push" onClick={() => setMo(true)}>Xem và khai báo tài sản</button>}</div>
      {mo ? <QuanLyTaiSanPhong token={token} phongId={phongId} soPhong={soPhong} mobile={mobile} /> : <p className="t-sm t-2">Thiết bị, nội thất và biên bản bàn giao của phòng.</p>}
    </section>
  )
}

export default function HoSoPhong360({ token, mobile, thamSo }: TrangProps) {
  const id = Number(thamSo.id)
  const { buildings } = useBuildings(token)
  const toaUrl = Number(new URLSearchParams(window.location.search).get('toaNhaId')) || null
  const ung = toaUrl ? buildings.filter((b) => b.id === toaUrl) : buildings
  const { du, loi, lai } = useTai(() => taiPhong(token, id, ung), `${token}|${id}|${ung.map((b) => b.id).join(',')}`, ung.length > 0)

  if (!Number.isSafeInteger(id) || id <= 0) return <EmptyState kind="error" title="Không có phòng này" body="Đường dẫn không đúng. Dữ liệu chưa bị thay đổi." />
  if (!du) return <section className="hs-khoi"><TrangThaiTai loi={loi} lai={lai} ten="hồ sơ phòng" /></section>

  const { phong, toa, hopDong, hoaDon, suCo, ky, chiSo, noTheoTen } = du
  const hienTai = hopDong.find((h) => h.trangThai === 'HIEU_LUC')
  const trong = phong.trangThai === 'TRONG'
  const tongNo = hienTai ? noTheoTen.get(hienTai.hoTenNguoiThue) ?? 0 : 0
  // Nút chính theo trạng thái: phòng trống → tạo hợp đồng; có nợ → ghi thu; còn lại không có.
  const nutChinh = trong ? <a className="btn btn-primary" href={`/hop-dong/moi?phongId=${id}&toaNhaId=${toa.id}`}>Tạo hợp đồng</a>
    : hienTai && tongNo > 0 ? <a className="btn btn-primary" href={`/thu-tien?nguoiThueId=${hienTai.nguoiThueId}`}>Ghi thu {tien(tongNo)}</a> : null

  return (
    <section className={`hs-khoi${mobile && nutChinh ? ' hs-pad-sticky' : ''}`} style={{ minWidth: 0 }}>
      <DauTrang
        vet={[{ nhan: toa.ten, href: `/toa-nha/${toa.id}` }, { nhan: `Phòng ${phong.soPhong}`, href: `/phong/${id}` }]}
        tieuDe={`Phòng ${phong.soPhong}`}
        phu={`${toa.ten} · tầng ${phong.tang} · ${dinhDangSo(phong.dienTich)} m² · ${phong.loaiPhong}`}
        hanhDong={<>
          <a className="btn btn-secondary" href={`/su-co?baoMoi=1&phongId=${id}&toaNhaId=${toa.id}`}>Báo sự cố</a>
          {hienTai && !trong ? <a className="btn btn-secondary" href={`/hop-dong/${hienTai.id}`}>Mở hợp đồng</a> : null}
          {mobile ? null : nutChinh}
        </>}
      />
      <KhoiSo so={[
        { nhan: 'Người thuê', giaTri: hienTai ? hienTai.hoTenNguoiThue : phong.tenTrangThai || '—', href: hienTai ? `/nguoi-thue/${hienTai.nguoiThueId}` : undefined, phu: hienTai ? undefined : 'Phòng chưa có người ở' },
        { nhan: 'Giá thuê', giaTri: tien(hienTai?.giaThue ?? phong.giaThueMacDinh), donVi: '/ tháng', phu: hienTai ? undefined : 'giá mặc định' },
        { nhan: 'Còn nợ', giaTri: tien(tongNo), tone: tongNo > 0 ? 'no' : 'thuong' },
        { nhan: 'Hợp đồng đến', giaTri: hienTai ? dinhDangNgayIso(hienTai.ngayKetThuc) : '—', phu: hienTai ? `còn ${hienTai.soNgayConLai} ngày` : undefined, anKhiHep: true },
      ]} />
      {du.khongTai.length ? <p className="banner banner-info" role="status"><Icon name="info" />Chưa tải được: {du.khongTai.join(', ')}. Phần còn lại vẫn đúng. <button type="button" className="nt-phu-nut" onClick={lai}>Tải lại</button></p> : null}
      <div className="cols">
        <div className="side">
          <section className="card" aria-labelledby="hs-hoa-don">
            <div className="blk-h"><h2 id="hs-hoa-don">Hoá đơn</h2><span className="t-meta">{hoaDon.length} tháng gần nhất</span></div>
            {hoaDon.length ? <BangHoaDon rows={hoaDon} /> : <p className="t-sm t-2">Phòng chưa có hoá đơn nào.</p>}
          </section>
          <KhoiSuCo rows={suCo} tieuDe="Sự cố của phòng" />
          <KhoiTaiSan token={token} phongId={id} soPhong={phong.soPhong} mobile={mobile} />
        </div>
        <div className="side">
          {chiSo?.length ? (
            <section className="card" aria-labelledby="hs-chi-so">
              <div className="blk-h"><h2 id="hs-chi-so">Công tơ tháng {ky?.thang}</h2></div>
              {chiSo.map((d) => (
                <div className="sumrow" key={d.id}><span>{d.tenDichVu}</span><b>{d.chiSoCuoi ? `${dinhDangSo(d.chiSoDau)} → ${dinhDangSo(d.chiSoCuoi)} ${d.donVi} · dùng ${dinhDangSo(d.mucTieuThu)}` : 'Chưa ghi chỉ số'}</b></div>
              ))}
            </section>
          ) : null}
          <section className="card" aria-labelledby="hs-ls-hd">
            <div className="blk-h"><h2 id="hs-ls-hd">Lịch sử hợp đồng</h2></div>
            {hopDong.length ? (
              <ul className="tl" style={{ listStyle: 'none', padding: 0 }}>{hopDong.map((h) => (
                <li key={h.id}><span className={`dot ${h.trangThai === 'HIEU_LUC' ? 'ok' : ''}`} /><span><a className="hs-hang-link" href={`/hop-dong/${h.id}`}>#{h.id} · {h.hoTenNguoiThue}</a><br /><span className="t-meta">{dinhDangNgayIso(h.ngayBatDau)} – {dinhDangNgayIso(h.ngayKetThuc)}</span></span><span className="when">{h.tenTrangThai}</span></li>
              ))}</ul>
            ) : <p className="t-sm t-2">Phòng chưa có hợp đồng nào. {trong ? <a href={`/hop-dong/moi?phongId=${id}&toaNhaId=${toa.id}`}>Tạo hợp đồng →</a> : null}</p>}
          </section>
        </div>
      </div>
      {mobile && nutChinh ? <ChanDinh>{nutChinh}</ChanDinh> : null}
    </section>
  )
}
