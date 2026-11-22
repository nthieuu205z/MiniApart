import { useEffect, useState } from 'react'
import { ngoaiProvider, useToaDangChon } from './toaDangChon'
import {
  ApiError,
  fetchCongNoBaoCao,
  fetchDashboardChu,
  fetchHopDongQuanLy,
  fetchToaNha,
  fetchTieuThuBaoCao,
  type ThongTinDashboardChu as DashboardData,
  type ThongTinDongTieuThuBaoCao,
  type ThongTinHopDong,
  type ThongTinKhoanNoBaoCao,
  type ThongTinToaNha,
} from './api'
import { dinhDangNgayIso, dinhDangSo, dinhDangTien } from './design/core/format'
import { Icon, type IconName } from './design/core/Icon'
import { Card } from './design/layout/Card'
import { EmptyState } from './design/feedback/EmptyState'
import { BieuDoVung } from './design/charts/BieuDoVung'
import { Gauge } from './design/charts/Gauge'
import { ThanhXepHang } from './design/charts/ThanhXepHang'
import { chuoiDoanhThu, nhomNoQuaHanTheoNguoiThue, tieuThuTheoToaKyGanNhat } from './dashboardTongHop'

type Props = {
  token: string
  mobile?: boolean
}

type KyNhanh = '6_thang' | 'thang_nay' | 'thang_truoc' | '12_thang'
const KY_NHANH: Array<[KyNhanh, string]> = [
  ['6_thang', '6 tháng gần nhất'],
  ['thang_nay', 'Tháng này'],
  ['thang_truoc', 'Tháng trước'],
  ['12_thang', '12 tháng'],
]
const AVATAR = ['h1', 'h2', 'h3', 'h4', 'h5']
const NHAN_DOI_SOAT: Record<string, string> = {
  KHOP_DOI_SOAT: 'Khớp đối soát',
  CANH_BAO_THAT_THOAT: 'Cảnh báo thất thoát',
}
// Nhãn thẻ KPI 15px (ma-text-body) để số 44px là thứ nổi nhất; mô tả 14px muted.
const NHAN_KPI = { font: '500 15px/1.3 var(--ma-font-ui)', color: 'var(--ma-text-secondary)', margin: 0 } as const
const MO_TA_KPI = { font: '400 14px/1.5 var(--ma-font-ui)', margin: '8px 0 0' } as const
const MINI_GIA_TRI = { fontSize: 20, lineHeight: 1.2, margin: '12px 0 0', color: 'var(--ma-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const
const MINI_PHU = { margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as const
const NHOM_TUOI = [['quaHan1Den7', '1–7 ngày'], ['quaHan8Den30', '8–30 ngày'], ['quaHanTren30', 'trên 30 ngày']] as const
const tien = (v: number | string) => `${dinhDangTien(v)}\u00a0₫` // không ngắt dòng trước ₫

type HopDongTheoToa = ThongTinHopDong & { tenToa: string }

export function ChuDashboard({ token, mobile = false }: Props): React.ReactElement {
  // Trong khung: toà lấy từ ô chọn toà của khung. Ngoài khung (test màn riêng lẻ): tự tải như cũ.
  const chung = useToaDangChon()
  const rieng = ngoaiProvider(chung)
  const [toaRieng, setToaRieng] = useState<ThongTinToaNha[]>([])
  const [idRieng, setToaNhaId] = useState<number | null>(() => docToaNhaIdTuUrl())
  const toaNhaList = rieng ? toaRieng : chung.danhSach
  const toaNhaId = rieng ? idRieng : chung.toaNhaId
  const [kyNhanh, setKyNhanh] = useState<KyNhanh>('6_thang')
  const [tuNgay, setTuNgay] = useState(() => {
    const now = new Date()
    return layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() - 5, 1))
  })
  const [denNgay, setDenNgay] = useState(() => layNgayDinhDang(new Date()))
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [congNo, setCongNo] = useState<ThongTinKhoanNoBaoCao[] | null>(null)
  const [tieuThu, setTieuThu] = useState<ThongTinDongTieuThuBaoCao[] | null>(null)
  const [hopDong, setHopDong] = useState<HopDongTheoToa[] | null>(null)
  const [theoNgay, setTheoNgay] = useState(false)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const hep = useManHinhHep()
  // Dưới 1280px lưới 12 cột chật (thẻ số lớn không vừa): chuyển sang lưới 2 cột như plan.
  const cot = (rong: string) => (hep ? (rong === 'c-7' || rong === 'c-12' ? 'c-12' : 'c-6') : rong)

  useEffect(() => {
    if (!rieng) return undefined
    let mounted = true
    fetchToaNha(token)
      .then((items) => mounted && setToaRieng(items))
      .catch((err: unknown) => {
        if (mounted) setLoi(err instanceof ApiError ? err.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => {
      mounted = false
    }
  }, [token, rieng])

  const chonKyNhanh = (opt: KyNhanh) => {
    setKyNhanh(opt)
    const now = new Date()
    const ngay = (lech: number, d = 1) => layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() + lech, d))
    if (opt === 'thang_nay') {
      setTuNgay(ngay(0))
      setDenNgay(ngay(1, 0))
    } else if (opt === 'thang_truoc') {
      setTuNgay(ngay(-1))
      setDenNgay(ngay(0, 0))
    } else {
      setTuNgay(ngay(opt === '6_thang' ? -5 : -11))
      setDenNgay(layNgayDinhDang(now))
    }
  }

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)
    setDashboard(null)

    const query = new URLSearchParams(window.location.search)
    if (toaNhaId) query.set('toaNhaId', String(toaNhaId))
    else query.delete('toaNhaId')
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)

    fetchDashboardChu(token, toaNhaId, tuNgay, denNgay)
      .then((data) => mounted && setDashboard(data))
      .catch((err: unknown) => {
        if (mounted) setLoi(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu dashboard.')
      })
      .finally(() => mounted && setDangTai(false))
    return () => {
      mounted = false
    }
  }, [token, toaNhaId, tuNgay, denNgay])

  // Ba nguồn bổ trợ tải độc lập: một nguồn lỗi chỉ làm trống khối của nó (null = chưa có số), không chặn cả màn.
  useEffect(() => {
    let mounted = true
    const toa = toaNhaId ? toaNhaList.filter((t) => t.id === toaNhaId) : toaNhaList
    setCongNo(null)
    setTieuThu(null)
    setHopDong(null)
    fetchCongNoBaoCao(token, toaNhaId).then((r) => mounted && setCongNo(r.congNo), () => undefined)
    fetchTieuThuBaoCao(token, { toaNhaId, phongId: null, kyId: null }).then((r) => mounted && setTieuThu(r.cacDong), () => undefined)
    if (toa.length > 0) {
      Promise.all(toa.map((t) => fetchHopDongQuanLy(token, t.id).then((ds) => ds.map((h) => ({ ...h, tenToa: t.ten })))))
        .then((ds) => mounted && setHopDong(ds.flat()), () => undefined)
    }
    return () => {
      mounted = false
    }
  }, [token, toaNhaId, toaNhaList])

  const kpi = dashboard?.kpi
  const duongDan = (path: string) => (toaNhaId ? `${path}?toaNhaId=${toaNhaId}` : path)

  const noiDung = (d: DashboardData, k: DashboardData['kpi']) => {
    const phatHanh = Number(k.doanhThuPhatHanh)
    const daThu = phatHanh > 0 ? (Number(k.thucThu) / phatHanh) * 100 : 0
    const tuoi = d.tuoiNo
    const nhomQuaHan = NHOM_TUOI.map(([ma, nhan]) => ({ nhan, soLuong: tuoi[ma].soLuong }))
    const tongQuaHan = nhomQuaHan.reduce((s, n) => s + n.soLuong, 0)
    const nhomLon = nhomQuaHan.reduce((a, b) => (b.soLuong > a.soLuong ? b : a))
    const doLonNhom = nhomLon.soLuong === tongQuaHan ? 'tất cả' : nhomLon.soLuong * 2 > tongQuaHan ? 'phần lớn' : 'nhiều nhất'
    const noQuaHan = congNo ? nhomNoQuaHanTheoNguoiThue(congNo, theoNgay ? 'ngay' : 'tien', 5) : null
    const thang = d.taiChinhTheoThang
    const dt = chuoiDoanhThu(thang, nhanThangNay())
    // API trả so sánh mọi toà kể cả khi đã chọn một toà: lọc lại theo bộ lọc để khối không lệch với số trên đầu trang.
    const soSanh = d.soSanhToaNha.filter((t) => !toaNhaId || t.toaNhaId === toaNhaId)
    const toaDauTien = [...soSanh].sort((a, b) => Number(b.thucThu) - Number(a.thucThu))[0]
    const sapHet = (hopDong ?? []).filter((h) => h.sapHetHan).sort((a, b) => a.soNgayConLai - b.soNgayConLai)
    const dien = tieuThu ? tieuThuTheoToaKyGanNhat(tieuThu) : null
    const kyNuoc = d.tieuThuDienNuoc.nuoc.filter((n) => Number(n.tong) > 0)
    const nuoc = kyNuoc.find((n) => n.nhan === dien?.nhanKy) ?? kyNuoc.at(-1)
    const doiSoat = d.dienNuocDungChung.doiSoat
    const tongDien = dien?.toa.reduce((s, t) => s + t.tong, 0) ?? 0
    const cc = d.coCauPhong
    const coCauPhu = [`${cc.trong} trống`, cc.dangSua > 0 ? `${cc.dangSua} đang sửa` : '', cc.ngung > 0 ? `${cc.ngung} ngưng khai thác` : ''].filter((t) => !t.startsWith('0 ') && t).join(' · ')
    return (
      <div className="grid">
        <Card className={cot('c-4')}>
          <h2 className="h2" style={{ ...NHAN_KPI, marginBottom: 12 }}>Thực thu</h2>
          <p className="kpi-value" style={{ margin: 0 }}>{dinhDangTien(k.thucThu)}<span className="unit">₫</span></p>
          <p className="kpi-desc" style={MO_TA_KPI}>Đã thu <b>{dinhDangSo(Math.round(daThu * 10) / 10)}%</b> trên {tien(k.doanhThuPhatHanh)} phát hành trong kỳ.</p>
          <div className="card-foot"><a className="link-more" href={duongDan('/bao-cao')}>Báo cáo doanh thu <Icon name="arrow-right" size="sm" /></a></div>
        </Card>
        <Card className={cot('c-4')}>
          <h2 className="h2" style={{ ...NHAN_KPI, marginBottom: 12 }}>Công nợ</h2>
          <p className={`kpi-value${Number(k.congNoHienTai) > 0 ? ' t-danger' : ''}`} style={{ margin: 0 }}>{dinhDangTien(k.congNoHienTai)}<span className="unit">₫</span></p>
          <p className="kpi-desc" style={MO_TA_KPI}>
            <b>{k.soHoaDonQuaHan} hoá đơn</b> quá hạn
            {k.soHoaDonQuaHan > 0 && tongQuaHan > 0 ? ` · ${doLonNhom} trễ ${nhomLon.nhan}` : ''}.
          </p>
          <div className="card-foot"><a className="link-more" href={duongDan('/cong-no')}>Xem công nợ <Icon name="arrow-right" size="sm" /></a></div>
        </Card>
        <article className={`card ${cot('c-4')}`} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => { window.location.href = duongDan('/toa-nha') }} title="Xem danh mục toà nhà & phòng">
          <h2 className="h2" style={{ ...NHAN_KPI, marginBottom: 4 }}>Tỷ lệ lấp đầy</h2>
          <div style={{ width: '100%', maxWidth: 200 }}>
            <Gauge
              tyLe={Number(k.tyLeLapDay)}
              nhan={`Lấp đầy ${dinhDangSo(k.tyLeLapDay)}%, ${k.soPhongDangThue} trên ${k.tongSoPhong} phòng đang thuê`}
              chuThich={`${k.soPhongDangThue}/${k.tongSoPhong} phòng đang thuê`}
            />
          </div>
          <div className="card-foot" style={{ paddingTop: 8 }}>
            <a className="link-more" href={duongDan('/toa-nha')}>{coCauPhu || 'Xem toà nhà'} <Icon name="arrow-right" size="sm" /></a>
          </div>
        </article>

        <Card
          className={cot('c-5')}
          title="Nợ quá hạn nhiều nhất"
          action={
            <select
              className="select"
              style={{ width: 'auto', height: 36, borderColor: 'transparent', backgroundColor: 'transparent', fontSize: 14, color: 'var(--ma-text-secondary)' }}
              value={theoNgay ? 'ngay' : 'tien'}
              onChange={(e) => setTheoNgay(e.target.value === 'ngay')}
              aria-label="Sắp xếp nợ quá hạn"
            >
              <option value="tien">Theo số tiền</option>
              <option value="ngay">Theo số ngày</option>
            </select>
          }
        >
          {noQuaHan === null ? <p className="t-2">Chưa tải được danh sách nợ.</p> : noQuaHan.length === 0 ? <p className="t-2">Không có hoá đơn quá hạn.</p> : (
            <ul className="list" style={{ paddingLeft: 0 }}>
              {noQuaHan.map((n, i) => (
                <li className="list-row" key={n.nguoiThueId}>
                  <span className={`avatar ${AVATAR[i % AVATAR.length]}`} aria-hidden="true">{vietTat(n.hoTenNguoiThue)}</span>
                  <div className="body">
                    <div className="name">{n.hoTenNguoiThue}</div>
                    <div className="sub">{n.tenToaNha} · {n.soPhong} · {n.soHoaDon} hoá đơn</div>
                  </div>
                  <div className="end"><div className="t-money">{tien(n.conLai)}</div><div className="t-meta t-danger">trễ {n.soNgayQuaHanLonNhat} ngày</div></div>
                </li>
              ))}
            </ul>
          )}
          <div className="card-foot"><a className="link-more" href={duongDan('/cong-no')}>Tất cả {k.soHoaDonQuaHan} hoá đơn quá hạn <Icon name="arrow-right" size="sm" /></a></div>
        </Card>

        <div className={`${cot('c-7')} stack`} style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <Card
            title="Doanh thu theo tháng"
            action={<div className="legend"><span><i style={{ background: 'var(--ma-chart-1)' }} />Thực thu</span><span><i style={{ background: 'var(--ma-chart-3)' }} />Phát hành</span></div>}
          >
            {dt.dauCoSo < 0 ? <EmptyState title="Chưa có số liệu doanh thu trong kỳ này." /> : (
              <div className="chart-scroll" tabIndex={0} role="region" aria-label="Biểu đồ doanh thu, cuộn ngang trên điện thoại">
                <BieuDoVung
                  kyCuoiDangMo={dt.kyCuoiDangMo}
                  tieuDe="Biểu đồ vùng: thực thu và doanh thu phát hành theo tháng"
                  nhan={thang.map((t) => t.nhan.replace(/\/20(\d\d)$/, '/$1'))}
                  chuoi={[
                    { ten: 'Thực thu', mau: 'var(--ma-chart-1)', giaTri: dt.thucThu },
                    { ten: 'Phát hành', mau: 'var(--ma-chart-3)', giaTri: dt.phatHanh },
                  ]}
                />
              </div>
            )}
            {dt.thangChuaCoSo ? <p className="t-meta">Chưa có số kỳ {dt.thangChuaCoSo}.</p> : null}
          </Card>
          <div className="minis" style={{ gridTemplateColumns: '1.3fr 1.3fr 0.8fr' }}>
            <Card style={{ padding: 20 }}>
              <h2 className="mini-label">Toà thu nhiều nhất</h2>
              <p className="mini-value" style={MINI_GIA_TRI} title={toaDauTien?.tenToaNha}>{toaDauTien ? toaDauTien.tenToaNha : '—'}</p>
              <p className="mini-sub" style={MINI_PHU}>{toaDauTien ? `${tien(toaDauTien.thucThu)} thực thu` : 'Chưa có số liệu'}</p>
            </Card>
            <Card style={{ padding: 20 }}>
              <h2 className="mini-label">Hợp đồng sắp hết</h2>
              <p className="mini-value" style={{ ...MINI_GIA_TRI, color: sapHet[0] && sapHet[0].soNgayConLai <= 30 ? 'var(--ma-waiting)' : MINI_GIA_TRI.color }}>{hopDong === null ? '—' : sapHet[0] ? dinhDangNgayIso(sapHet[0].ngayKetThuc) : 'Không có'}</p>
              <p className="mini-sub" style={MINI_PHU}>
                {sapHet[0] ? `Phòng ${sapHet[0].soPhong} ${sapHet[0].tenToa} · còn ${sapHet[0].soNgayConLai} ngày` : hopDong === null ? 'Chưa tải được' : 'Chưa có hợp đồng sắp hết hạn'}
              </p>
            </Card>
            <Card style={{ padding: 20 }}>
              <h2 className="mini-label">Sự cố đang mở</h2>
              <p className="mini-value" style={{ ...MINI_GIA_TRI, color: k.soSuCoDangMo > 0 ? 'var(--ma-waiting)' : MINI_GIA_TRI.color }}>{k.soSuCoDangMo} việc</p>
              <p className="mini-sub" style={MINI_PHU}>Chi phí kỳ này {tien(k.chiPhiBaoTri)}</p>
            </Card>
          </div>
        </div>

        <Card className={cot('c-4')} title="Tiêu thụ điện theo toà" action={dien?.nhanKy ? <span className="t-meta">kỳ {dien.nhanKy}</span> : undefined}>
          {dien === null ? <p className="t-2">Chưa tải được số điện.</p> : dien.toa.length === 0 ? <p className="t-2">Chưa có kỳ nào có số điện.</p> : (
            <ThanhXepHang muc={dien.toa.map((t) => ({ nhan: t.tenToaNha, giaTri: t.tong, hienThi: `${dinhDangSo(t.tong)} ${dien.donVi ?? 'kWh'}` }))} />
          )}
          <p className="t-meta" style={{ margin: 'auto 0 0', paddingTop: 12 }}>
            Tổng {dinhDangSo(tongDien)} {dien?.donVi ?? 'kWh'}{nuoc ? ` · nước ${dinhDangSo(nuoc.tong)} ${nuoc.donVi === 'm3' ? 'm³' : nuoc.donVi}` : ''}
          </p>
        </Card>
        <Card className={cot('c-4')} title="Công nợ theo toà" action={<span className="t-meta">hiện tại</span>}>
          <ThanhXepHang
            am
            muc={[...soSanh].sort((a, b) => Number(b.congNo) - Number(a.congNo)).map((t) => ({ nhan: t.tenToaNha, giaTri: Number(t.congNo), hienThi: tien(t.congNo) }))}
          />
          <p className="t-meta" style={{ margin: 'auto 0 0', paddingTop: 12 }}>Tổng {tien(k.congNoHienTai)}</p>
        </Card>
        <Card className={hep ? 'c-12' : 'c-4'} title="Cần chú ý">
          <nav className="alist" aria-label="Việc cần chú ý">
            <HangChuY icon="wrench" nhan="Sự cố đang mở" so={k.soSuCoDangMo} href={duongDan('/su-co')} />
            <HangChuY icon="receipt" nhan="Hoá đơn quá hạn" so={k.soHoaDonQuaHan} href={duongDan('/cong-no')} />
            <HangChuY icon="contract" nhan="Hợp đồng sắp hết hạn" so={hopDong === null ? '—' : sapHet.length} href={duongDan('/hop-dong')} />
            {doiSoat && doiSoat.trangThai !== 'CHON_TOA_NHA' ? (
              <HangChuY icon="meter" nhan="Đối soát công tơ tổng" so={doiSoat.vuotNguong ? `Lệch ${dinhDangSo(doiSoat.chenhLech)} ${doiSoat.donVi}` : NHAN_DOI_SOAT[doiSoat.trangThai] ?? 'Chưa có'} href={duongDan('/bao-cao/tieu-thu')} />
            ) : null}
          </nav>
        </Card>
      </div>
    )
  }

  return (
    <section data-testid="owner-dashboard-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="owner-dashboard-title" className={mobile ? 'main m-app' : 'main'}>
      <header className="topbar" style={{ flexWrap: 'wrap', minHeight: 0 }}>
        <div className="title-block" style={{ flex: '1 1 320px' }}>
          <h1 className="h1" id="owner-dashboard-title">Tổng quan</h1>
          {dashboard && kpi ? (
            <p className="sub">
              {toaNhaId ? 1 : dashboard.soSanhToaNha.length || toaNhaList.length} toà · {kpi.tongSoPhong} phòng · {dinhDangNgayIso(dashboard.tuNgay)} – {dinhDangNgayIso(dashboard.denNgay)} · cập nhật {dinhDangGio(dashboard.thoiDiemCapNhat)}
            </p>
          ) : null}
        </div>
        <div className="topbar-actions" style={{ flexWrap: 'wrap' }}>
          {rieng ? <select className="select" style={{ width: 200 }} value={toaNhaId ?? ''} onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : null)} aria-label="Chọn toà nhà xem dashboard">
            <option value="">Tất cả toà</option>
            {toaNhaList.map((tn) => <option key={tn.id} value={tn.id}>{tn.ten}</option>)}
          </select> : null}
          <div className="seg" role="group" aria-label="Khoảng thời gian" style={{ flexWrap: 'wrap', maxWidth: '100%' }}>
            {KY_NHANH.map(([ma, nhan]) => (
              <button key={ma} type="button" aria-pressed={kyNhanh === ma} onClick={() => chonKyNhanh(ma)}>{nhan}</button>
            ))}
          </div>
        </div>
      </header>

      {loi ? <p role="alert" style={{ color: 'var(--ma-urgent)' }}>{loi}</p> : null}
      {dangTai && !dashboard ? <p aria-live="polite" className="t-2">Đang tổng hợp dữ liệu dashboard…</p> : null}
      {dashboard && kpi ? noiDung(dashboard, kpi) : null}
    </section>
  )
}

function nhanThangNay(): string {
  const n = new Date()
  return `${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`
}

function useManHinhHep(): boolean {
  const [hep, setHep] = useState(() => window.matchMedia?.('(max-width: 1279px)').matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 1279px)')
    if (!mq) return
    const doi = () => setHep(mq.matches)
    mq.addEventListener('change', doi)
    return () => mq.removeEventListener('change', doi)
  }, [])
  return hep
}

function HangChuY({ icon, nhan, so, href }: { icon: IconName; nhan: string; so: number | string; href: string }): React.ReactElement {
  return <a className="arow" href={href}><Icon name={icon} /><span style={{ minWidth: 0 }}>{nhan}</span><b style={{ whiteSpace: 'nowrap' }}>{so}</b><Icon name="chevron-right" size="sm" /></a>
}

function vietTat(ten: string): string {
  return ten.trim().split(/\s+/).slice(-2).map((t) => t[0]?.toUpperCase() ?? '').join('')
}

function layNgayDinhDang(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function docToaNhaIdTuUrl(): number | null {
  const val = new URLSearchParams(window.location.search).get('toaNhaId')
  return val ? Number(val) : null
}

function dinhDangGio(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

