import { useEffect, useState } from 'react'
import { ApiError, fetchLichSuHoaDonCuaNguoiThue, type ThongTinHoaDonLichSu } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Button } from './design/core/Button'
import { Card } from './design/layout/Card'
import { DataTable } from './design/table/DataTable'
import { Tieu } from './CanTra'

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

  return (
    <section {...khung} aria-labelledby="invoice-history-title" style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div>
        <Tieu mobile={mobile} id="invoice-history-title" className={mobile ? 'sr-only' : undefined} style={{ margin: 0, font: '600 24px/1.2 var(--ma-font-ui)', letterSpacing: '-0.01em' }}>Lịch sử hoá đơn</Tieu>
        {lichSu.length > 0 ? (
          <div style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-muted)', marginTop: 2 }}>
            {lichSu.length} kỳ gần nhất của các phòng bạn đã từng thuê, kỳ mới nhất ở trên.
          </div>
        ) : null}
      </div>

      {lichSu.length === 0 ? (
        <Card>
          <EmptyState
            data-history-empty
            title="Chưa có kỳ hoá đơn nào"
            body="Hoá đơn sẽ xuất hiện tại đây sau khi kỳ thanh toán đầu tiên được phát hành. Đây không phải lỗi kết nối."
          />
        </Card>
      ) : mobile ? (
        <DanhSachHoaDonMobile lichSu={lichSu} />
      ) : (
        <Card><DanhSachHoaDonDesktop lichSu={lichSu} /></Card>
      )}
    </section>
  )
}

function DanhSachHoaDonMobile({ lichSu }: { lichSu: ThongTinHoaDonLichSu[] }) {
  return (
    <div data-history-list="mobile" style={{ display: 'grid', gap: 12 }}>
      {lichSu.map((hoaDon) => <HoaDonHistoryCard key={hoaDon.hoaDonId} hoaDon={hoaDon} />)}
    </div>
  )
}

function HoaDonHistoryCard({ hoaDon }: { hoaDon: ThongTinHoaDonLichSu }) {
  const tong = Number(hoaDon.tongTien)
  const phanTram = tong > 0 ? Math.min(100, Math.max(0, (Number(hoaDon.daThu) / tong) * 100)) : 0
  return (
    <button
      type="button"
      className="m-card"
      data-history-invoice={hoaDon.hoaDonId}
      aria-label={`Mở hoá đơn ${nhanKy(hoaDon)} phòng ${hoaDon.soPhong}`}
      onClick={() => moHoaDon(hoaDon.hoaDonId)}
      style={{ display: 'grid', gap: 12, width: '100%', border: 0, color: 'var(--ma-text-primary)', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
          <strong style={{ font: '600 18px/1.3 var(--ma-font-ui)' }}>{nhanKy(hoaDon)}</strong>
          <span className="t-sm t-2">Phòng {hoaDon.soPhong} · {nhanToaNha(hoaDon)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ma-text-muted)' }}>
          <StatusTag tone={toneThanhToan(hoaDon.trangThaiThanhToan)}>{nhanTrangThai(hoaDon.trangThaiThanhToan)}</StatusTag>
          <Icon name="chevron-right" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span className="t-sm t-2">Tổng kỳ này</span>
        <b style={{ font: '600 22px/1.2 var(--ma-font-ui)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{dinhDangTien(hoaDon.tongTien)} ₫</b>
      </div>
      <div className="progress" role="img" aria-label={`Đã thu ${Math.round(phanTram)}%`}><span style={{ width: `${phanTram}%` }} /></div>
      <div className="t-sm t-2" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>Đã thu {dinhDangTien(hoaDon.daThu)} ₫</span>
        <span>Còn lại {dinhDangTien(hoaDon.conLai)} ₫</span>
      </div>
      {hoaDon.hopDongTrangThai === 'DA_THANH_LY' ? <div><StatusTag tone="closed">Đã thanh lý</StatusTag></div> : null}
    </button>
  )
}

function DanhSachHoaDonDesktop({ lichSu }: { lichSu: ThongTinHoaDonLichSu[] }) {
  return (
    <DataTable
      rows={lichSu}
      getRowId={(h) => h.hoaDonId}
      noun="kỳ"
      rowProps={(h) => ({ 'data-history-invoice': String(h.hoaDonId) })}
      columns={[
        {
          key: 'ky',
          label: 'Kỳ / phòng',
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

/** Khối "Kỳ trước còn nợ" của màn Hoá đơn khách thuê (mobile): tối đa 3 kỳ chưa trả hết, trừ hoá đơn đang xem. */
export function KyTruocConNo({ lichSu, hienTaiId }: { lichSu: ThongTinHoaDonLichSu[]; hienTaiId: number }) {
  const conNo = lichSu.filter((hoaDon) => hoaDon.hoaDonId !== hienTaiId && Number(hoaDon.conLai) > 0).slice(0, 3)
  return (
    <section className="m-card" aria-labelledby="ky-truoc-con-no" data-previous-debt>
      <div className="spread">
        <h2 className="h3" id="ky-truoc-con-no" style={{ margin: 0 }}>Kỳ trước còn nợ</h2>
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
        <p className="t-sm t-2" style={{ margin: '4px 0 0' }}>Không có kỳ nào còn nợ.</p>
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
                style={{ width: '100%', minHeight: 56, border: 0, background: 'transparent', font: 'inherit', textAlign: 'left', color: 'inherit', cursor: 'pointer' }}
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
  return `${String(hoaDon.thang).padStart(2, '0')}/${hoaDon.nam}`
}

function nhanKy(hoaDon: ThongTinHoaDonLichSu) {
  return hoaDon.kyId === null ? 'Quyết toán hợp đồng' : `Kỳ ${dinhDangKy(hoaDon)}`
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
