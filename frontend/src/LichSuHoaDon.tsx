import { useEffect, useState } from 'react'
import { ApiError, fetchLichSuHoaDonCuaNguoiThue, type ThongTinHoaDonLichSu } from './api'
import { dinhDangTien } from './design/core/format'
import { Figure } from './design/core/Figure'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { Button } from './design/core/Button'
import { ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableFrame, TableHeadCell } from './design/layout/Screen'

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

  if (dangTai) {
    return <ScreenSurface data-testid="invoice-history-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-busy="true" aria-live="polite">Đang tải lịch sử hoá đơn…</ScreenSurface>
  }

  if (loi) {
    return (
      <ScreenSurface data-testid="invoice-history-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} role="alert">
        <SysLabel>FR-POR-03</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
        <Button data-retry-invoice-history variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>Thử lại</Button>
      </ScreenSurface>
    )
  }

  return (
    <ScreenSurface data-testid="invoice-history-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="invoice-history-title">
      <ScreenHeader>
        <SysLabel>FR-POR-03</SysLabel>
        <h3 id="invoice-history-title" style={{ margin: '8px 0 0' }}>Lịch sử hoá đơn</h3>
      </ScreenHeader>

      {lichSu.length === 0 ? (
        <EmptyState
          data-history-empty
          title="Chưa có kỳ hoá đơn nào"
          body="Hoá đơn sẽ xuất hiện tại đây sau khi kỳ thanh toán đầu tiên được phát hành. Đây không phải lỗi kết nối."
        />
      ) : (
        <>
          <p style={{ margin: 0, color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>
            {lichSu.length} kỳ gần nhất của các phòng bạn đã từng thuê, kỳ mới nhất ở trên.
          </p>
          {mobile ? <DanhSachHoaDonMobile lichSu={lichSu} /> : <DanhSachHoaDonDesktop lichSu={lichSu} />}
        </>
      )}
    </ScreenSurface>
  )
}

function DanhSachHoaDonMobile({ lichSu }: { lichSu: ThongTinHoaDonLichSu[] }) {
  return (
    <div data-history-list="mobile" style={{ display: 'grid', gap: 10 }}>
      {lichSu.map((hoaDon) => <HoaDonHistoryCard key={hoaDon.hoaDonId} hoaDon={hoaDon} />)}
    </div>
  )
}

function HoaDonHistoryCard({ hoaDon }: { hoaDon: ThongTinHoaDonLichSu }) {
  return (
    <button
      type="button"
      data-history-invoice={hoaDon.hoaDonId}
      aria-label={`Mở hoá đơn ${nhanKy(hoaDon)} phòng ${hoaDon.soPhong}`}
      onClick={() => moHoaDon(hoaDon.hoaDonId)}
      style={{ display: 'grid', gap: 12, width: '100%', padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <strong>{nhanKy(hoaDon)}</strong>
          <span style={{ color: 'var(--ma-text-secondary)' }}>Phòng {hoaDon.soPhong} · {nhanToaNha(hoaDon)}</span>
        </div>
        <Figure value={dinhDangTien(hoaDon.tongTien)} unit="₫" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <StatusTag tone={toneThanhToan(hoaDon.trangThaiThanhToan)}>{nhanTrangThai(hoaDon.trangThaiThanhToan)}</StatusTag>
        {hoaDon.hopDongTrangThai === 'DA_THANH_LY' ? <StatusTag tone="closed">Đã thanh lý</StatusTag> : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--ma-text-secondary)', fontSize: 13 }}>
        <span>Đã thu {dinhDangTien(hoaDon.daThu)} ₫</span>
        <span>Còn lại {dinhDangTien(hoaDon.conLai)} ₫</span>
      </div>
    </button>
  )
}

function DanhSachHoaDonDesktop({ lichSu }: { lichSu: ThongTinHoaDonLichSu[] }) {
  return (
    <TableFrame minWidth={760}>
      <thead>
        <tr>
          <TableHeadCell>Kỳ / phòng</TableHeadCell>
          <TableHeadCell>Thanh toán</TableHeadCell>
          <TableHeadCell align="right">Tổng tiền</TableHeadCell>
          <TableHeadCell align="right">Còn lại</TableHeadCell>
          <TableHeadCell><span className="ma-visually-hidden">Mở</span></TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {lichSu.map((hoaDon) => (
          <tr key={hoaDon.hoaDonId} data-history-invoice={hoaDon.hoaDonId}>
            <TableCell header>
              <div style={{ display: 'grid', gap: 4 }}>
                <span>{nhanKy(hoaDon)}</span>
                <span style={{ color: 'var(--ma-text-secondary)', fontWeight: 400 }}>Phòng {hoaDon.soPhong} · {nhanToaNha(hoaDon)}</span>
                {hoaDon.hopDongTrangThai === 'DA_THANH_LY' ? <StatusTag tone="closed">Đã thanh lý</StatusTag> : null}
              </div>
            </TableCell>
            <TableCell><StatusTag tone={toneThanhToan(hoaDon.trangThaiThanhToan)}>{nhanTrangThai(hoaDon.trangThaiThanhToan)}</StatusTag></TableCell>
            <TableCell align="right"><Figure value={dinhDangTien(hoaDon.tongTien)} unit="₫" /></TableCell>
            <TableCell align="right">{dinhDangTien(hoaDon.conLai)} ₫</TableCell>
            <TableCell align="right"><button type="button" data-open-history-invoice={hoaDon.hoaDonId} aria-label={`Mở hoá đơn ${nhanKy(hoaDon)} phòng ${hoaDon.soPhong}`} onClick={() => moHoaDon(hoaDon.hoaDonId)} style={{ minHeight: 44, padding: '8px 12px', border: '1px solid var(--ma-border-strong)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>Mở</button></TableCell>
          </tr>
        ))}
      </tbody>
    </TableFrame>
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
