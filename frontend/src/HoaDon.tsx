import { useEffect, useState } from 'react'
import { ApiError, fetchHoaDonChiTiet, type ThongTinHoaDonChiTiet, type ThongTinDongHoaDon } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso } from './design/core/format'
import { Figure } from './design/core/Figure'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { HighlightNotice, MetaGrid, MetaItem, MeterImage, ScreenHeader, ScreenSurface, TableCell, TableFrame, TableHeadCell, TotalLine } from './design/layout/Screen'

type Props = { token: string; toaNhaId?: number; kyId?: number; hoaDonId?: number; mobile?: boolean }

export default function HoaDon({ token, toaNhaId, kyId, hoaDonId, mobile = false }: Props) {
  const [hoaDon, setHoaDon] = useState<ThongTinHoaDonChiTiet | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    if (toaNhaId === undefined || kyId === undefined || hoaDonId === undefined) {
      setDangTai(false)
      return
    }

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHoaDonChiTiet(token, toaNhaId, kyId, hoaDonId)
      .then((data) => {
        if (mounted) setHoaDon(data)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải chi tiết hoá đơn.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [hoaDonId, kyId, token, toaNhaId])

  if (dangTai) return <ScreenSurface data-layout-variant={variant}>Đang tải hoá đơn…</ScreenSurface>
  if (loi) return <ScreenSurface data-layout-variant={variant} role="alert">{loi}</ScreenSurface>
  if (!hoaDon) {
    return (
      <ScreenSurface data-testid="invoice-screen" data-layout-variant={variant}>
        <SysLabel>FR-INV-02</SysLabel>
        <h3>Hoá đơn</h3>
        <EmptyState title="Chọn một hoá đơn để xem đầy đủ từng khoản mục." />
      </ScreenSurface>
    )
  }

  const meta = (
    <>
      <MetaItem label={<SysLabel>Phòng</SysLabel>}>{hoaDon.soPhong}</MetaItem>
      <MetaItem label={<SysLabel>Người thuê</SysLabel>}>{hoaDon.nguoiThue}</MetaItem>
      <MetaItem label={<SysLabel>Kỳ thanh toán</SysLabel>}>{dinhDangNgayIso(hoaDon.ngayPhatHanh)} – {dinhDangNgayIso(hoaDon.hanThanhToan)}</MetaItem>
      <MetaItem label={<SysLabel>Trạng thái</SysLabel>}><StatusTag tone={toneHoaDon(hoaDon.trangThai)}>{hoaDon.trangThai}</StatusTag></MetaItem>
    </>
  )

  return (
    <ScreenSurface
      printable
      data-testid="invoice-detail"
      data-layout-variant={variant}
      className={`invoice-screen invoice-screen--${variant}`}
      aria-labelledby="invoice-title"
    >
      <ScreenHeader action={<Button className="ma-no-print" data-print-invoice variant="secondary" onClick={() => window.print()}>In A4</Button>}>
        <SysLabel>FR-INV-02</SysLabel>
        <h3 id="invoice-title">Hoá đơn {hoaDon.maHoaDon}</h3>
      </ScreenHeader>

      {mobile ? (
        <div data-mobile-invoice-meta style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, minWidth: 0 }}>
          {meta}
        </div>
      ) : <MetaGrid>{meta}</MetaGrid>}

      {hoaDon.soNguoiO != null ? (
        <HighlightNotice>
          Số người ở đã dùng để tính: <strong>{hoaDon.soNguoiO} người</strong>. Số hộ quy đổi: <strong>{hoaDon.soHoQuyDoi ?? '—'} hộ quy đổi</strong>.
          {hoaDon.giaiThichSoHo ? ` ${hoaDon.giaiThichSoHo}.` : ' Quy tắc: 4 người được tính là 1 hộ.'}
        </HighlightNotice>
      ) : null}

      {mobile ? (
        <MobileInvoiceLines lines={hoaDon.cacDong} total={hoaDon.tongTien} />
      ) : (
        <TableFrame>
          <thead>
            <tr>
              <TableHeadCell>Khoản mục</TableHeadCell>
              <TableHeadCell>Diễn giải kiểm tra</TableHeadCell>
              <TableHeadCell align="right">Thành tiền</TableHeadCell>
            </tr>
          </thead>
          <tbody>{hoaDon.cacDong.map((dong, index) => <DongHoaDon key={`${dong.tenKhoan}-${index}`} dong={dong} />)}</tbody>
          <tfoot>
            <tr>
              <TableHeadCell colSpan={2}>Tổng cộng</TableHeadCell>
              <TableHeadCell align="right"><Figure value={dinhDangTien(hoaDon.tongTien)} unit="₫" /></TableHeadCell>
            </tr>
          </tfoot>
        </TableFrame>
      )}

      <TotalLine>
        <span>Còn phải thu</span>
        <Figure value={dinhDangTien(hoaDon.conLai)} unit="₫" size="lg" />
      </TotalLine>
    </ScreenSurface>
  )
}

function MobileInvoiceLines({ lines, total }: { lines: ThongTinDongHoaDon[]; total: string }) {
  return (
    <div data-mobile-invoice-lines style={{ display: 'grid', gap: 10, minWidth: 0 }}>
      {lines.length === 0 ? <EmptyState title="Hoá đơn chưa có khoản mục." /> : null}
      {lines.map((dong, index) => (
        <article key={`${dong.tenKhoan}-${index}`} data-mobile-invoice-line style={{ display: 'grid', gap: 10, minWidth: 0, padding: 14, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }}>
          <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
            <strong style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{dong.tenKhoan}</strong>
            <Figure value={dinhDangTien(dong.thanhTien)} unit="₫" tone={dong.thanhTien.startsWith('-') ? 'urgent' : 'primary'} />
          </header>
          <div style={{ minWidth: 0, overflowWrap: 'anywhere', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>{dong.dienGiai}</div>
          {dong.anhCongToUrl ? <MeterImage src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /> : null}
          {dong.cacBac.length > 0 ? (
            <div data-mobile-invoice-tiers style={{ display: 'grid', gap: 8, paddingTop: 10, borderTop: '1px solid var(--ma-border-subtle)' }}>
              {dong.cacBac.map((bac) => (
                <div key={`${dong.tenKhoan}-${bac.bac}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, minWidth: 0, color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                  <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <strong style={{ color: 'var(--ma-text-primary)' }}>Bậc {bac.bac}</strong>
                    <div>Khoảng {bac.tuSoLuong} – {bac.denSoLuong ?? 'không giới hạn'}</div>
                    <div>Định mức sau quy đổi: {bac.dinhMucQuyDoi ?? 'không giới hạn'}</div>
                    <div>{bac.soLuong} × {bac.donGia} = {bac.thanhTien}</div>
                  </div>
                  <Figure value={dinhDangTien(bac.thanhTien)} unit="₫" size="sm" />
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', paddingTop: 12, borderTop: '2px solid var(--ma-ink-900)' }}>
        <strong>Tổng cộng</strong>
        <Figure value={dinhDangTien(total)} unit="₫" />
      </div>
    </div>
  )
}

function DongHoaDon({ dong }: { dong: ThongTinDongHoaDon }) {
  return (
    <>
      <tr>
        <TableCell header>{dong.tenKhoan}</TableCell>
        <TableCell>
          <div>{dong.dienGiai}</div>
          {dong.anhCongToUrl ? <MeterImage src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /> : null}
        </TableCell>
        <TableCell align="right"><Figure value={dinhDangTien(dong.thanhTien)} unit="₫" tone={dong.thanhTien.startsWith('-') ? 'urgent' : 'primary'} /></TableCell>
      </tr>
      {dong.cacBac.map((bac) => (
        <tr key={`${dong.tenKhoan}-${bac.bac}`}>
          <TableCell muted>Bậc {bac.bac}</TableCell>
          <TableCell muted>
            <div>Khoảng {bac.tuSoLuong} – {bac.denSoLuong ?? 'không giới hạn'}</div>
            <div>Định mức sau quy đổi: {bac.dinhMucQuyDoi ?? 'không giới hạn'}</div>
            <div>{bac.soLuong} × {bac.donGia} = {bac.thanhTien}</div>
          </TableCell>
          <TableCell align="right"><Figure value={dinhDangTien(bac.thanhTien)} unit="₫" size="sm" /></TableCell>
        </tr>
      ))}
    </>
  )
}

function toneHoaDon(status: string): 'draft' | 'neutral' | 'strong' | 'urgent' | 'waiting' | 'done' | 'closed' {
  if (status.includes('HUY')) return 'closed'
  if (status.includes('QUA_HAN')) return 'urgent'
  if (status.includes('THANH_TOAN')) return 'done'
  if (status.includes('PHAT_HANH')) return 'strong'
  return 'draft'
}

export function dinhDangTien(giaTri: string) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(giaTri.trim())
  if (!match) return giaTri
  const dau = match[1]
  const phanNguyen = match[2].replace(/^0+(?=\d)/, '')
  const phanThapPhan = (match[3] ?? '').replace(/0+$/, '')
  const nguyenDaNhom = phanNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${dau}${nguyenDaNhom}${phanThapPhan ? `,${phanThapPhan}` : ''}`
}
