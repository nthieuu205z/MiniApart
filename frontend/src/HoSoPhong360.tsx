import { useState } from 'react'
import { fetchChiSoDichVu, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchKyThanhToan, fetchPhong, type ThongTinGhiChiSo, type ThongTinKyThanhToan, type ThongTinPhong, type ThongTinToaNha, type ThongTinYeuCauSuaChua } from './api'
import { chuCaiDau } from './bangQuanTriChung'
import { Icon } from './design/core/Icon'
import { StatusTag, type StatusTagProps } from './design/core/StatusTag'
import { dinhDangNgayIso, dinhDangSo } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { Breadcrumb } from './design/shell/Breadcrumb'
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
  khongTai: string[]
}

const SAC_THAI: Record<string, NonNullable<StatusTagProps['tone']>> = { DANG_THUE: 'done', TRONG: 'waiting', DA_COC: 'waiting', DANG_SUA: 'strong', NGUNG: 'closed' }

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
  return {
    phong, toa, ky: kyHienTai, chiSo, suCo, khongTai,
    hopDong: hd.filter((h) => h.phongId === id).map((h) => ({ ...h, toaNhaId: toa.id, tenToa: toa.ten })).sort((a, b) => b.ngayBatDau.localeCompare(a.ngayBatDau)),
    // 4 kỳ gần nhất của phòng (hoá đơn nhận diện theo số phòng trong toà).
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
  if (!du) return <section className="hs-khoi"><Breadcrumb items={[{ nhan: 'Toà & phòng', href: '/toa-nha' }, 'Đang tải…']} /><TrangThaiTai loi={loi} lai={lai} ten="hồ sơ phòng" /></section>

  const { phong, toa, hopDong, hoaDon, suCo, ky, chiSo } = du
  const hienTai = hopDong.find((h) => h.trangThai === 'HIEU_LUC')
  const trong = phong.trangThai === 'TRONG'
  const nutChinh = trong ? <a className="btn btn-primary" href={`/hop-dong/moi?phongId=${id}&toaNhaId=${toa.id}`}><Icon name="plus" />Tạo hợp đồng</a> : null

  return (
    <section className={`hs-khoi${mobile && nutChinh ? ' hs-pad-sticky' : ''}`} style={{ minWidth: 0 }}>
      <Breadcrumb items={[{ nhan: toa.ten, href: `/toa-nha/${toa.id}` }, `Phòng ${phong.soPhong}`]} />
      <div className="prof">
        <span className="avatar xl" aria-hidden="true">{phong.soPhong}</span>
        <div className="grow">
          <h1 className="h1">Phòng {phong.soPhong}</h1>
          <div className="meta">
            <span><Icon name="building" size="sm" />{toa.ten} · tầng {phong.tang}</span>
            <span><Icon name="ruler" size="sm" />{dinhDangSo(phong.dienTich)} m² · {phong.loaiPhong}</span>
            <span><Icon name="users" size="sm" />tối đa {phong.sucChua} người</span>
          </div>
          <div className="tags">
            <StatusTag tone={SAC_THAI[phong.trangThai] ?? 'neutral'}>{phong.tenTrangThai || phong.trangThai}</StatusTag>
            <StatusTag tone="neutral" icon="receipt">Giá mặc định {tien(phong.giaThueMacDinh)}</StatusTag>
          </div>
        </div>
        <div className="ph-acts">
          <a className="btn btn-secondary" href={`/su-co?baoMoi=1&phongId=${id}&toaNhaId=${toa.id}`}><Icon name="wrench" />Báo sự cố</a>
          {hienTai && !trong ? <a className="btn btn-secondary" href={`/hop-dong/${hienTai.id}`}><Icon name="contract" />Mở hợp đồng</a> : null}
          {mobile ? null : nutChinh}
        </div>
      </div>
      {du.khongTai.length ? <p className="banner banner-info" role="status"><Icon name="info" />Chưa tải được: {du.khongTai.join(', ')}. Phần còn lại vẫn đúng.</p> : null}
      <div className="cols">
        <div className="side">
          <section className="card" aria-labelledby="hs-nguoi-o">
            <div className="blk-h"><h2 id="hs-nguoi-o">Người đang ở</h2></div>
            {hienTai ? (
              <div style={{ margin: '4px -22px -8px' }}>
                <a className="irow" href={`/nguoi-thue/${hienTai.nguoiThueId}`}>
                  <span className={`avatar sm h${(hienTai.nguoiThueId % 5) + 1}`} aria-hidden="true">{chuCaiDau(hienTai.hoTenNguoiThue)}</span>
                  <div className="body"><div className="t">{hienTai.hoTenNguoiThue}</div><div className="s">Hợp đồng #{hienTai.id} · {dinhDangNgayIso(hienTai.ngayBatDau)} – {dinhDangNgayIso(hienTai.ngayKetThuc)} · {tien(hienTai.giaThue)}/tháng</div></div>
                  <Icon name="chevron-right" size="sm" />
                </a>
              </div>
            ) : <p className="t-sm t-2">Phòng trống, chưa có người ở.</p>}
          </section>
          <section className="card" aria-labelledby="hs-hoa-don">
            <div className="blk-h"><h2 id="hs-hoa-don">Hoá đơn của phòng</h2><span className="t-meta">{hoaDon.length} kỳ gần nhất</span></div>
            {hoaDon.length ? <BangHoaDon rows={hoaDon} hienNguoi /> : <p className="t-sm t-2">Chưa có hoá đơn nào.</p>}
          </section>
          <KhoiSuCo rows={suCo} tieuDe="Sự cố" />
        </div>
        <div className="side">
          <section className="card" aria-labelledby="hs-chi-so">
            <div className="blk-h"><h2 id="hs-chi-so">Điện nước kỳ {kyNhanCua(ky)}</h2></div>
            {chiSo?.length ? chiSo.map((d) => (
              <div className="sumrow" key={d.id}><span>{d.tenDichVu}</span><b>{d.chiSoCuoi ? `${dinhDangSo(d.chiSoDau)} → ${dinhDangSo(d.chiSoCuoi)} ${d.donVi} · dùng ${dinhDangSo(d.mucTieuThu)}` : 'Chưa ghi chỉ số'}</b></div>
            )) : <p className="t-sm t-2">Chưa ghi chỉ số kỳ này.</p>}
          </section>
          <section className="card" aria-labelledby="hs-ls-hd">
            <div className="blk-h"><h2 id="hs-ls-hd">Lịch sử hợp đồng</h2></div>
            {hopDong.length ? (
              <ul className="tl" style={{ listStyle: 'none', padding: 0 }}>{hopDong.map((h) => (
                <li key={h.id}><span className={`dot ${h.trangThai === 'HIEU_LUC' ? 'ok' : ''}`} /><span><a className="hs-hang-link" href={`/hop-dong/${h.id}`}>#{h.id} · {h.hoTenNguoiThue}</a><br /><span className="t-meta">{dinhDangNgayIso(h.ngayBatDau)} – {dinhDangNgayIso(h.ngayKetThuc)}</span></span><span className="when">{h.tenTrangThai}</span></li>
              ))}</ul>
            ) : <p className="t-sm t-2">Phòng chưa có hợp đồng nào.</p>}
          </section>
        </div>
      </div>
      <KhoiTaiSan token={token} phongId={id} soPhong={phong.soPhong} mobile={mobile} />
      {mobile && nutChinh ? <div className="sticky-act">{nutChinh}</div> : null}
    </section>
  )
}
