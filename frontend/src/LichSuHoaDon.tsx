import { useEffect, useState } from 'react'
import { ApiError, fetchLichSuHoaDonCuaNguoiThue, fetchTieuThuCuaNguoiThue, type ThongTinBieuDoTieuThu, type ThongTinHoaDonLichSu } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Button } from './design/core/Button'
import { Card } from './design/layout/Card'
import { DataTable } from './design/table/DataTable'
import { Tieu } from './CanTra'
import './CanTra.css'

type Props = { token: string; mobile?: boolean }

export default function LichSuHoaDon({ token, mobile = false }: Props) {
  const [lichSu, setLichSu] = useState<ThongTinHoaDonLichSu[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchLichSuHoaDonCuaNguoiThue(token)
      .then((data) => {
        if (mounted) setLichSu(data)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải lịch sử hoá đơn.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [soLanTaiLai, token])

  const khung = { 'data-testid': 'invoice-history-screen', 'data-layout-variant': mobile ? 'mobile' : 'desktop' }

  if (dangTai) {
    return <div {...khung}><EmptyState kind="loading" title="Đang tải lịch sử hoá đơn" /></div>
  }

  if (loi) {
    return (
      <div {...khung} role="alert">
        <Card>
          <EmptyState kind="error" title="Không thể tải lịch sử hoá đơn" body={loi} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button data-retry-invoice-history variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>Thử lại</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (mobile && lichSu.length > 0) {
    return (
      <section {...khung} className="nt" aria-labelledby="invoice-history-title">
        <header className="nt-dau">
          <Tieu mobile id="invoice-history-title" className="sr-only">Lịch sử</Tieu>
          <div className="nt-phu">Hoá đơn và điện nước</div>
        </header>
        <section className="nt-khoi" aria-labelledby="lich-su-hoa-don">
          <h2 className="nt-h2" id="lich-su-hoa-don">Hoá đơn</h2>
          <div data-history-list="mobile">
            {lichSu.map((hoaDon) => <DongHoaDon key={hoaDon.hoaDonId} hoaDon={hoaDon} />)}
          </div>
        </section>
        <KhoiDienNuoc token={token} />
      </section>
    )
  }

  return (
    <section {...khung} aria-labelledby="invoice-history-title" style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div>
        <Tieu mobile={mobile} id="invoice-history-title" className={mobile ? 'sr-only' : undefined} style={{ margin: 0, font: 'var(--ma-text-screen-title)' }}>Lịch sử hoá đơn</Tieu>
        {lichSu.length > 0 ? (
          <div style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-muted)', marginTop: 2 }}>
            {lichSu.length} tháng gần nhất của các phòng bạn đã từng thuê, tháng mới nhất ở trên.
          </div>
        ) : null}
      </div>

      {lichSu.length === 0 ? (
        <Card>
          <EmptyState
            data-history-empty
            title="Chưa có hoá đơn nào"
            body="Hoá đơn sẽ xuất hiện tại đây sau khi hoá đơn tháng đầu tiên được gửi. Đây không phải lỗi kết nối."
          />
        </Card>
      ) : (
        <Card><DanhSachHoaDonDesktop lichSu={lichSu} /></Card>
      )}
    </section>
  )
}

/** Một tháng trong Lịch sử (điện thoại): "đã trả đủ" hoặc "đã trả X ₫, còn Y ₫"; bấm vào mở chi tiết. */
function DongHoaDon({ hoaDon }: { hoaDon: ThongTinHoaDonLichSu }) {
  const conNo = Number(hoaDon.conLai) > 0
  const daTra = Number(hoaDon.daThu) > 0
  const phu = !conNo ? 'đã trả đủ' : daTra ? `đã trả ${dinhDangTien(hoaDon.daThu)} ₫, còn ${dinhDangTien(hoaDon.conLai)} ₫` : `chưa trả, còn ${dinhDangTien(hoaDon.conLai)} ₫`
  return (
    <button
      type="button"
      className="nt-dong nt-nut"
      data-history-invoice={hoaDon.hoaDonId}
      aria-label={`Mở hoá đơn ${nhanKy(hoaDon)} phòng ${hoaDon.soPhong}`}
      onClick={() => moHoaDon(hoaDon.hoaDonId)}
    >
      <span className="nt-dong-trai">
        <span className="nt-ten">{nhanKy(hoaDon)}</span>
        <span className={`nt-phu${conNo && hoaDon.trangThaiThanhToan === 'QUA_HAN' ? ' nt-tre' : ''}`}>{phu}{hoaDon.hopDongTrangThai === 'DA_THANH_LY' ? ' · hợp đồng đã thanh lý' : ''}</span>
      </span>
      <span className="nt-tien">{dinhDangTien(hoaDon.tongTien)} ₫</span>
      <Icon name="chevron-right" />
    </button>
  )
}

/** Điện nước đã dùng (FR-POR-05): bảng Tháng · Điện · Nước, mới nhất ở trên. Lỗi báo ngay trong khối. */
function KhoiDienNuoc({ token }: { token: string }) {
  const [duLieu, setDuLieu] = useState<ThongTinBieuDoTieuThu | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [lanTai, setLanTai] = useState(0)
  useEffect(() => {
    let mounted = true
    setLoi(null)
    fetchTieuThuCuaNguoiThue(token)
      .then((d) => { if (mounted) setDuLieu(d) })
      .catch((e: unknown) => { if (mounted) setLoi(e instanceof ApiError ? e.message : 'Không thể tải điện nước.') })
    return () => { mounted = false }
  }, [token, lanTai])
  const dien = Array.isArray(duLieu?.dien) ? duLieu!.dien : []
  const nuoc = Array.isArray(duLieu?.nuoc) ? duLieu!.nuoc : []
  const thang = new Map<number, { nam: number; thang: number; dien?: string | null; nuoc?: string | null }>()
  for (const [loai, ds] of [['dien', dien], ['nuoc', nuoc]] as const) {
    for (const p of ds) {
      const k = p.nam * 12 + p.thang
      thang.set(k, { ...(thang.get(k) ?? { nam: p.nam, thang: p.thang }), [loai]: p.mucTieuThu })
    }
  }
  const dong = [...thang.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v)
  const so = (v?: string | null) => (v == null ? '—' : String(Number(v)).replace('.', ','))
  return (
    <section className="nt-khoi" aria-labelledby="lich-su-dien-nuoc" data-dien-nuoc>
      <h2 className="nt-h2" id="lich-su-dien-nuoc">Điện nước đã dùng</h2>
      {loi ? (
        <div role="alert" className="nt-ghi">
          <p className="nt-phu nt-tre">{loi}</p>
          <Button variant="secondary" data-retry-dien-nuoc onClick={() => setLanTai((n) => n + 1)}>Tải lại</Button>
        </div>
      ) : duLieu === null ? (
        <div className="skel skel-line" aria-busy="true" />
      ) : dong.length === 0 ? (
        <p className="nt-phu">Chưa có số điện nước nào. Số sẽ hiện sau khi hoá đơn đầu tiên được gửi.</p>
      ) : (
        <table className="nt-bang">
          <thead><tr><th scope="col">Tháng</th><th scope="col" className="num">Điện ({dien[0]?.donVi ?? 'kWh'})</th><th scope="col" className="num">Nước ({nuoc[0]?.donVi ?? 'm³'})</th></tr></thead>
          <tbody>{dong.map((r) => <tr key={`${r.nam}-${r.thang}`}><th scope="row">{r.thang}/{r.nam}</th><td className="num">{so(r.dien)}</td><td className="num">{so(r.nuoc)}</td></tr>)}</tbody>
        </table>
      )}
    </section>
  )
}

function DanhSachHoaDonDesktop({ lichSu }: { lichSu: ThongTinHoaDonLichSu[] }) {
  return (
    <DataTable
      rows={lichSu}
      getRowId={(h) => h.hoaDonId}
      noun="tháng"
      rowProps={(h) => ({ 'data-history-invoice': String(h.hoaDonId) })}
      columns={[
        {
          key: 'ky',
          label: 'Tháng / phòng',
          render: (h) => (
            <div style={{ display: 'grid', gap: 2 }}>
              <strong>{nhanKy(h)}</strong>
              <span className="t-sm t-2">Phòng {h.soPhong} · {nhanToaNha(h)}</span>
              {h.hopDongTrangThai === 'DA_THANH_LY' ? <StatusTag tone="closed">Đã thanh lý</StatusTag> : null}
            </div>
          ),
        },
        { key: 'tt', label: 'Thanh toán', render: (h) => <StatusTag tone={toneThanhToan(h.trangThaiThanhToan)}>{nhanTrangThai(h.trangThaiThanhToan)}</StatusTag> },
        { key: 'tong', label: 'Tổng tiền', align: 'num', render: (h) => <b style={{ whiteSpace: 'nowrap' }}>{dinhDangTien(h.tongTien)} ₫</b> },
        { key: 'conLai', label: 'Còn lại', align: 'num', render: (h) => <span style={{ whiteSpace: 'nowrap' }}>{dinhDangTien(h.conLai)} ₫</span> },
        {
          key: 'mo',
          label: 'Thao tác',
          the: 'hanh-dong',
          render: (h) => <Button variant="secondary" size="sm" data-open-history-invoice={h.hoaDonId} aria-label={`Mở hoá đơn ${nhanKy(h)} phòng ${h.soPhong}`} onClick={() => moHoaDon(h.hoaDonId)}>Mở</Button>,
        },
      ]}
    />
  )
}

/** Khối "Tháng trước còn nợ" của màn Hoá đơn khách thuê (mobile): tối đa 3 tháng chưa trả hết, trừ hoá đơn đang xem. */
export function KyTruocConNo({ lichSu, hienTaiId }: { lichSu: ThongTinHoaDonLichSu[]; hienTaiId: number }) {
  const conNo = lichSu.filter((hoaDon) => hoaDon.hoaDonId !== hienTaiId && Number(hoaDon.conLai) > 0).slice(0, 3)
  return (
    <section className="m-card" aria-labelledby="ky-truoc-con-no" data-previous-debt>
      <div className="spread">
        <h2 className="h3" id="ky-truoc-con-no" style={{ margin: 0 }}>Tháng trước còn nợ</h2>
        <Button
          variant="text"
          data-view-invoice-history
          onClick={() => {
            window.history.pushState({}, '', '/lich-su')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
        >
          Lịch sử
        </Button>
      </div>
      {conNo.length === 0 ? (
        <p className="t-sm t-2" style={{ margin: '4px 0 0' }}>Không có tháng nào còn nợ.</p>
      ) : (
        <ul className="list" style={{ marginTop: 4, padding: 0, listStyle: 'none' }}>
          {conNo.map((hoaDon) => (
            <li key={hoaDon.hoaDonId}>
              <button
                type="button"
                className="list-row"
                data-previous-debt-invoice={hoaDon.hoaDonId}
                aria-label={`Mở hoá đơn ${nhanKy(hoaDon)} phòng ${hoaDon.soPhong}`}
                onClick={() => moHoaDon(hoaDon.hoaDonId)}
                style={{ width: '100%', minHeight: 'var(--ma-row-h)', border: 0, background: 'transparent', font: 'inherit', textAlign: 'left', color: 'inherit', cursor: 'pointer' }}
              >
                <div className="body">
                  <div className="name">{nhanKy(hoaDon)}</div>
                  <div className="sub" style={{ whiteSpace: 'normal' }}>Hạn {dinhDangNgayIso(hoaDon.hanThanhToan)} · đã trả {dinhDangTien(hoaDon.daThu)} ₫</div>
                </div>
                <div className="end">
                  <div className="t-money">{dinhDangTien(hoaDon.conLai)} ₫</div>
                  <div className={`t-meta${hoaDon.trangThaiThanhToan === 'QUA_HAN' ? ' t-danger' : ''}`}>{nhanTrangThai(hoaDon.trangThaiThanhToan).toLocaleLowerCase('vi-VN')}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function moHoaDon(hoaDonId: number) {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', `/hoa-don-cua-toi?hoaDonId=${hoaDonId}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function dinhDangKy(hoaDon: ThongTinHoaDonLichSu) {
  if (hoaDon.kyId === null || hoaDon.nam === null || hoaDon.thang === null) return 'Quyết toán hợp đồng'
  return `${hoaDon.thang}/${hoaDon.nam}`
}

function nhanKy(hoaDon: ThongTinHoaDonLichSu) {
  return hoaDon.kyId === null ? 'Quyết toán hợp đồng' : `Tháng ${dinhDangKy(hoaDon)}`
}

function nhanToaNha(hoaDon: ThongTinHoaDonLichSu) {
  return hoaDon.tenToaNha || (hoaDon.maToa ? `Toà ${hoaDon.maToa}` : 'Toà nhà không xác định')
}

function nhanTrangThai(status: string) {
  switch (status) {
    case 'DA_THANH_TOAN': return 'Đã thanh toán'
    case 'DA_THU_MOT_PHAN': return 'Đã trả một phần'
    case 'QUA_HAN': return 'Quá hạn'
    default: return 'Chưa thanh toán'
  }
}

function toneThanhToan(status: string): 'strong' | 'done' | 'urgent' | 'waiting' {
  switch (status) {
    case 'DA_THANH_TOAN': return 'done'
    case 'QUA_HAN': return 'urgent'
    case 'DA_THU_MOT_PHAN': return 'waiting'
    default: return 'strong'
  }
}
