import { useEffect, useState } from 'react'
import {
  ApiError,
  fetchBaoCaoTongQuan,
  fetchHoaDonQuanLy,
  fetchPhong,
  fetchToaNha,
  type BoLocTongQuanBaoCao,
  type ThongTinHoaDonQuanLy,
  type ThongTinPhong,
  type ThongTinToaNha,
  type ThongTinTongQuanBaoCao,
  type ThongTinYeuCauSuaChua,
} from './api'
import { managementRequest } from './managementApi'
import { today } from './ManagementShared'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo } from './design/layout/KhoiSo'
import { Card } from './design/layout/Card'
import { DataTable } from './design/table/DataTable'
import { EmptyState } from './design/feedback/EmptyState'
import { useToaKhung } from './useToaKhung'
import { BaoCaoDangTai, BaoCaoLoi, gioTinh } from './baoCaoChung'
import { soNgayTre } from './nhomNoTheoNguoi'
import ExcelExportButton from './ExcelExportButton'
import './SuCo.css'

type Props = { token: string; mobile?: boolean }
type HoaDon = ThongTinHoaDonQuanLy & { toaNhaId: number; ngayPhatHanh?: string }
type ChiTiet = { toa: ThongTinToaNha[]; hoaDon: HoaDon[]; phong: ThongTinPhong[]; suaChua: ThongTinYeuCauSuaChua[] }
type Tong = { daGui: number; daThu: number; conNo: number }

const so = (v: string | number | null | undefined) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0 }
const tien = (v: number) => `${dinhDangTien(Math.round(v))} ₫`
const phanTram = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)
const ngayGui = (h: HoaDon) => (h.ngayPhatHanh ?? h.hanThanhToan).slice(0, 10)
const thangCua = (iso: string) => iso.slice(0, 7)

/** Cộng từ hoá đơn đã gửi (bỏ nháp, đã huỷ): đã gửi = đã thu + còn nợ, không dùng sổ giao dịch `thucThu`. */
function cong(ds: readonly HoaDon[]): Tong {
  const t = ds.reduce<Tong>((a, h) => ({ daGui: a.daGui + so(h.tongTien), daThu: a.daThu + so(h.daThu), conNo: a.conNo + so(h.conLai) }), { daGui: 0, daThu: 0, conNo: 0 })
  console.assert(Math.round(t.daGui) === Math.round(t.daThu + t.conNo), 'Đã gửi phải bằng đã thu + còn nợ', t)
  return t
}

/** Danh sách tháng "yyyy-mm" từ tháng của `tu` đến tháng của `den`. */
function cacThang(tu: string, den: string): string[] {
  const kq: string[] = []
  for (let t = Number(tu.slice(0, 4)) * 12 + Number(tu.slice(5, 7)) - 1, c = Number(den.slice(0, 4)) * 12 + Number(den.slice(5, 7)) - 1; t <= c; t++) kq.push(`${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`)
  return kq
}
const dauThang = (iso: string, lui: number) => {
  const t = Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1 - lui
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-01`
}

async function taiChiTiet(token: string, toaNhaId: number | null): Promise<ChiTiet> {
  const dsToa = await fetchToaNha(token)
  const toa = toaNhaId === null ? dsToa : dsToa.filter((t) => t.id === toaNhaId)
  const theoToa = await Promise.all(toa.map(async (t) => {
    const [hd, ph, sc] = await Promise.all([
      fetchHoaDonQuanLy(token, t.id, ''),
      fetchPhong(token, t.id),
      managementRequest<ThongTinYeuCauSuaChua[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${t.id}`),
    ])
    return { hd: hd.map((h) => ({ ...h, toaNhaId: t.id }) as HoaDon), ph, sc }
  }))
  return { toa, hoaDon: theoToa.flatMap((x) => x.hd), phong: theoToa.flatMap((x) => x.ph), suaChua: theoToa.flatMap((x) => x.sc) }
}

/** FR-RPT-01: báo cáo một trang của Chủ, chỉ đọc. Tiền cộng từ hoá đơn đã gửi; phòng và sự cố là trạng thái hiện tại. */
export default function BaoCaoTongQuan({ token, mobile = false }: Props): React.ReactElement {
  const [boLoc, setBoLoc] = useState<BoLocTongQuanBaoCao>(() => docBoLocTuUrl())
  const [baoCao, setBaoCao] = useState<ThongTinTongQuanBaoCao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [ct, setCt] = useState<ChiTiet | null>(null)
  const [loiCt, setLoiCt] = useState<string | null>(null)
  const [lanTai, setLanTai] = useState(0)
  useToaKhung(boLoc.toaNhaId, (toaNhaId) => setBoLoc((b) => ({ ...b, toaNhaId })))

  useEffect(() => {
    const query = new URLSearchParams()
    query.set('tuNgay', boLoc.tuNgay)
    query.set('denNgay', boLoc.denNgay)
    if (boLoc.toaNhaId !== null) query.set('toaNhaId', String(boLoc.toaNhaId))
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchBaoCaoTongQuan(token, boLoc)
      .then((data) => {
        if (mounted) setBaoCao(data)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setBaoCao(null)
          setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải báo cáo tổng quan.')
        }
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })
    return () => { mounted = false }
  }, [boLoc, token])

  // Hoá đơn, phòng, sửa chữa của từng toà: không đổi theo khoảng ngày, chỉ theo toà. Lỗi thì giữ số cũ.
  useEffect(() => {
    let mounted = true
    setLoiCt(null)
    taiChiTiet(token, boLoc.toaNhaId)
      .then((d) => { if (mounted) setCt(d) })
      .catch((r: unknown) => { if (mounted) setLoiCt(r instanceof Error ? r.message : 'Không thể tải hoá đơn.') })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token, lanTai])

  useEffect(() => {
    function docLaiBoLocTuLichSu() {
      setBoLoc(docBoLocTuUrl())
    }

    window.addEventListener('popstate', docLaiBoLocTuLichSu)
    return () => window.removeEventListener('popstate', docLaiBoLocTuLichSu)
  }, [])

  const variant = mobile ? 'mobile' : 'desktop'
  if (dangTai && !baoCao) return <BaoCaoDangTai testid="report-overview-screen" variant={variant} nhan="Đang tải báo cáo tổng quan…" />
  if (loi && !baoCao) return <BaoCaoLoi testid="report-overview-screen" variant={variant} loi={loi} />
  if (!baoCao) {
    return <div data-testid="report-overview-screen" data-layout-variant={variant}><EmptyState title="Chưa có báo cáo để hiển thị." /></div>
  }

  const { kpi } = baoCao
  const homNay = today()
  const chip = [['Tháng này', dauThang(boLoc.denNgay, 0)], ['5 tháng', dauThang(boLoc.denNgay, 4)], ['Cả năm', `${boLoc.denNgay.slice(0, 4)}-01-01`]] as const
  const thang = cacThang(boLoc.tuNgay, boLoc.denNgay)

  const hoaDon = ct ? ct.hoaDon.filter((h) => h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY' && ngayGui(h) >= boLoc.tuNgay && ngayGui(h) <= boLoc.denNgay) : []
  const tong = cong(hoaDon)
  const theoThang = thang.map((m) => { const ds = hoaDon.filter((h) => thangCua(ngayGui(h)) === m); return { m, n: ds.length, ...cong(ds) } })
  const nhanThang = (m: string) => `Tháng ${Number(m.slice(5, 7))}${thang[0].slice(0, 4) === thang[thang.length - 1].slice(0, 4) ? '' : `/${m.slice(2, 4)}`}`
  // Tháng đang mở thấp: chỉ giải thích "chưa gửi hoá đơn" khi đúng là số hoá đơn đã gửi ít hơn nửa các tháng trước.
  const cuoi = theoThang[theoThang.length - 1]
  const truoc = theoThang.slice(0, -1).filter((t) => t.n > 0)
  const thapVi = cuoi && truoc.length > 0 && cuoi.m === thangCua(homNay) && cuoi.n < (truoc.reduce((a, t) => a + t.n, 0) / truoc.length) / 2

  const no = hoaDon.filter((h) => so(h.conLai) > 0).map((h) => ({ h, tre: soNgayTre(h.hanThanhToan, homNay) }))
  const tuoiNo = [
    ['Chưa đến hạn', (t: number) => t === 0],
    ['Quá hạn 1–7 ngày', (t: number) => t >= 1 && t <= 7],
    ['Quá hạn 8–30 ngày', (t: number) => t >= 8 && t <= 30],
    ['Quá hạn trên 30 ngày', (t: number) => t > 30],
  ] as const
  const treLauNhat = Math.max(0, ...no.map((x) => x.tre))
  const nguoiNo = new Set(no.map(({ h }) => `${h.toaNhaId}|${h.soPhong}|${h.nguoiThue}`)).size
  const phuNo = no.length === 0 ? 'Không có hoá đơn nào còn nợ'
    : no.every((x) => x.tre > 30) ? 'đều quá hạn trên 30 ngày'
      : treLauNhat === 0 ? `${no.length} hoá đơn, chưa quá hạn` : `${no.length} hoá đơn, trễ lâu nhất ${treLauNhat} ngày`

  const suaTrongKhoang = (ct?.suaChua ?? []).filter((s) => s.trangThai === 'DA_DONG' && so(s.chiPhi) > 0 && s.taoLuc.slice(0, 10) >= boLoc.tuNgay && s.taoLuc.slice(0, 10) <= boLoc.denNgay)
  const chiSua = suaTrongKhoang.reduce((a, s) => a + so(s.chiPhi), 0)
  const demThue = (ph: readonly ThongTinPhong[]) => ph.filter((p) => p.trangThai === 'DANG_THUE').length
  const dongToa = (ct?.toa ?? []).map((t) => {
    const h = cong(hoaDon.filter((x) => x.toaNhaId === t.id))
    const ph = (ct?.phong ?? []).filter((p) => p.toaNhaId === t.id)
    const sc = suaTrongKhoang.filter((s) => s.toaNha === t.ten)
    return { id: t.id, ten: t.ten, ...h, thue: demThue(ph), soPhong: ph.length, chiSua: sc.reduce((a, s) => a + so(s.chiPhi), 0) }
  })
  const lonNhat = Math.max(1, ...theoThang.map((t) => t.daGui))

  return (
    <div data-testid="report-overview-screen" data-layout-variant={variant} className="bc-trang">
      <DauTrang
        tieuDe="Báo cáo"
        phu={`${baoCao.tenToaNha} · từ tháng ${Number(boLoc.tuNgay.slice(5, 7))}${boLoc.tuNgay.slice(0, 4) === boLoc.denNgay.slice(0, 4) ? '' : `/${boLoc.tuNgay.slice(0, 4)}`} đến hết ${dinhDangNgayIso(boLoc.denNgay)} · tính trên hoá đơn đã gửi`}
        hanhDong={<>
          <span className="bc-chip" role="group" aria-label="Khoảng thời gian">
            {chip.map(([ten, tu]) => <button key={ten} type="button" className="chip" aria-pressed={boLoc.tuNgay === tu} onClick={() => setBoLoc((b) => ({ ...b, tuNgay: tu }))}>{ten}</button>)}
          </span>
          <ExcelExportButton token={token} report="tong-quan" filters={boLoc} loading={dangTai} />
        </>}
      />

      {dangTai ? <p className="t-2" role="status" aria-live="polite">Đang cập nhật báo cáo…</p> : null}
      {loi ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loi}</p> : null}

      {loiCt && !ct ? <EmptyState kind="error" title="Không tải được hoá đơn để tính tiền." body={loiCt} actionLabel="Tải lại" onAction={() => setLanTai((n) => n + 1)} />
        : !ct ? <EmptyState kind="loading" title="Đang tải hoá đơn…" /> : (
          <>
            {loiCt ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loiCt} Đang hiện số cũ. <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLanTai((n) => n + 1)}>Tải lại</button></p> : null}
            <KhoiSo so={[
              { nhan: 'Đã thu', giaTri: dinhDangTien(Math.round(tong.daThu)), donVi: '₫', phu: `${phanTram(tong.daThu, tong.daGui)}% của ${tien(tong.daGui)} đã gửi hoá đơn` },
              { nhan: 'Còn nợ', giaTri: dinhDangTien(Math.round(tong.conNo)), donVi: '₫', tone: 'no', phu: phuNo },
              { nhan: 'Phòng đang thuê', giaTri: `${Math.round(Number(kpi.tyLeLapDay))}%`, phu: `${kpi.soPhongDangThue}/${kpi.tongSoPhong} phòng` },
              { nhan: 'Chi sửa chữa', giaTri: dinhDangTien(Math.round(chiSua)), donVi: '₫', phu: `${suaTrongKhoang.length} việc đã xong`, anKhiHep: true },
            ]} />

            {hoaDon.length === 0 ? (
              <div data-report-empty className="card">
                <EmptyState title="Chưa có dữ liệu tài chính trong khoảng ngày đã chọn." body="Chọn khoảng dài hơn, hoặc gửi hoá đơn ở trang Tháng." />
              </div>
            ) : null}

            <div className="bc-luoi">
              <Card aria-labelledby="report-chart-title" title={<span id="report-chart-title">Gửi hoá đơn và đã thu theo tháng</span>}
                action={<span className="bc-chuthich"><span><i className="gui" />đã gửi hoá đơn</span><span><i className="thu" />đã thu</span></span>}>
                <div data-report-chart>
                  <div className="bc-cot" role="img" aria-label={`Cột đã gửi hoá đơn và đã thu theo tháng: ${theoThang.map((t) => `${nhanThang(t.m)} thu ${tien(t.daThu)} trên ${tien(t.daGui)}`).join('; ')}`}>
                    {theoThang.map((t) => (
                      <div key={t.m} data-report-chart-month={t.m} title={`${nhanThang(t.m)}: đã gửi ${tien(t.daGui)}, đã thu ${tien(t.daThu)}`}>
                        <i className="gui" style={{ height: `${phanTram(t.daGui, lonNhat)}%` }} />
                        <i className="thu" style={{ height: `${phanTram(t.daThu, lonNhat)}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="bc-nhan" style={{ gridTemplateColumns: `repeat(${theoThang.length}, minmax(0, 1fr))` }}>
                    {theoThang.map((t) => <div key={t.m}><b>{nhanThang(t.m)}</b><span>{Math.round(t.daThu / 1e6)} / {Math.round(t.daGui / 1e6)} tr</span></div>)}
                  </div>
                  {thapVi ? <p className="t-2" style={{ margin: '12px 0 0' }}>{nhanThang(cuoi.m)} thấp vì hoá đơn {nhanThang(cuoi.m).toLowerCase()} chưa gửi (mới có {cuoi.n} hoá đơn).</p> : null}
                </div>
              </Card>

              <Card aria-labelledby="report-no-title" title={<span id="report-no-title">Nợ theo thời gian quá hạn</span>}>
                <dl className="kv bc-kv">
                  {tuoiNo.map(([ten, khop], i) => {
                    const v = no.filter((x) => khop(x.tre)).reduce((a, x) => a + so(x.h.conLai), 0)
                    return <div key={ten}><dt>{ten}</dt><dd style={i === 3 && v > 0 ? { color: 'var(--ma-urgent)' } : undefined}>{tien(v)}</dd></div>
                  })}
                </dl>
                <p className="t-2" style={{ margin: '12px 0 0' }}>{no.length} hoá đơn của {nguoiNo} người. <a href="/thu-tien">Mở danh sách nợ</a></p>
              </Card>
            </div>

            <Card aria-labelledby="report-table-title" title={<span id="report-table-title">Theo toà</span>}>
              <div data-report-monthly-table>
                <DataTable
                  rows={dongToa}
                  getRowId={(t) => t.id}
                  noun="toà"
                  pageSize={24}
                  rowProps={(t) => ({ 'data-report-toa': String(t.id) })}
                  columns={[
                    { key: 'toa', label: 'Toà', render: (t) => <a href={`/toa-nha/${t.id}`}>{t.ten}</a> },
                    { key: 'gui', label: 'Đã gửi hoá đơn', align: 'num', render: (t) => tien(t.daGui) },
                    { key: 'thu', label: 'Đã thu', align: 'num', render: (t) => tien(t.daThu) },
                    { key: 'tyle', label: 'Tỷ lệ thu', align: 'num', render: (t) => `${phanTram(t.daThu, t.daGui)}%` },
                    { key: 'no', label: 'Còn nợ', align: 'num', render: (t) => <span style={t.conNo > 0 ? { color: 'var(--ma-urgent)' } : undefined}>{tien(t.conNo)}</span> },
                    { key: 'thue', label: 'Đang thuê', align: 'num', render: (t) => `${t.thue}/${t.soPhong}` },
                    { key: 'sua', label: 'Chi sửa chữa', align: 'num', render: (t) => tien(t.chiSua) },
                  ]}
                  tongHang={dongToa.length > 1 ? ['Cộng', tien(tong.daGui), tien(tong.daThu), `${phanTram(tong.daThu, tong.daGui)}%`, tien(tong.conNo), `${dongToa.reduce((a, t) => a + t.thue, 0)}/${dongToa.reduce((a, t) => a + t.soPhong, 0)}`, tien(chiSua)] : undefined}
                />
              </div>
            </Card>
          </>
        )}

      <p className="t-meta" style={{ margin: 0 }}>Tính lúc {gioTinh(baoCao.tinhLuc)}. Tiền cộng từ hoá đơn gửi trong khoảng đã chọn; phòng và sự cố là trạng thái hiện tại.</p>
    </div>
  )
}

function docBoLocTuUrl(): BoLocTongQuanBaoCao {
  const denNgay = ngayKinhDoanhHienTai()
  const tuNgay = dauThang(denNgay, 4) // V3: mặc định "5 tháng"
  const query = new URLSearchParams(window.location.search)
  const toaNha = query.get('toaNhaId')
  return {
    toaNhaId: toaNha && /^\d+$/.test(toaNha) ? Number(toaNha) : null,
    tuNgay: query.get('tuNgay') || tuNgay,
    denNgay: query.get('denNgay') || denNgay,
  }
}

function ngayKinhDoanhHienTai(): string {
  const phanNgay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const lay = (type: string) => phanNgay.find((part) => part.type === type)?.value ?? ''
  return `${lay('year')}-${lay('month')}-${lay('day')}`
}
