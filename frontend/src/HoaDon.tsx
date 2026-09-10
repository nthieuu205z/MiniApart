import { useEffect, useState } from 'react'
import { ApiError, fetchHoaDonChiTiet, fetchHoaDonCongNoChiTiet, fetchHoaDonCuaNguoiThue, fetchHoaDonMoiNhatCuaNguoiThue, fetchLienKetAnh, type ThongTinHoaDonChiTiet, type ThongTinDongHoaDon } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Figure } from './design/core/Figure'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { HighlightNotice, MetaGrid, MetaItem, MeterImage, ScreenHeader, ScreenSurface, TableCell, TableFrame, TableHeadCell, TotalLine } from './design/layout/Screen'

type Props = { token: string; toaNhaId?: number; kyId?: number; hoaDonId?: number; mobile?: boolean; cheDoNguoiThue?: boolean; cheDoCongNo?: boolean }

export default function HoaDon({ token, toaNhaId, kyId, hoaDonId, mobile = false, cheDoNguoiThue = false, cheDoCongNo = false }: Props) {
  const [hoaDon, setHoaDon] = useState<ThongTinHoaDonChiTiet | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBaoRong, setThongBaoRong] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'
  const maTruyVet = cheDoNguoiThue ? 'FR-POR-02' : cheDoCongNo ? 'FR-RPT-03' : 'FR-INV-02'

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)
    setHoaDon(null)
    setThongBaoRong(null)

    const request = cheDoNguoiThue && hoaDonId !== undefined
      ? fetchHoaDonCuaNguoiThue(token, hoaDonId).then((data) => {
          if (mounted) setHoaDon(data)
        })
      : cheDoNguoiThue
      ? fetchHoaDonMoiNhatCuaNguoiThue(token).then((data) => {
          if (!mounted) return
          if (data.coHoaDon && data.hoaDon) {
            setHoaDon(data.hoaDon)
            setThongBaoRong(null)
          } else {
            setHoaDon(null)
            setThongBaoRong(data.thongBao ?? 'Chưa có hoá đơn nào cho tài khoản này.')
          }
        })
      : cheDoCongNo && hoaDonId !== undefined
        ? fetchHoaDonCongNoChiTiet(token, hoaDonId).then((data) => {
            if (mounted) setHoaDon(data)
          })
      : toaNhaId !== undefined && kyId !== undefined && hoaDonId !== undefined
        ? fetchHoaDonChiTiet(token, toaNhaId, kyId, hoaDonId).then((data) => {
            if (mounted) setHoaDon(data)
          })
        : Promise.resolve()

    request
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải chi tiết hoá đơn.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [cheDoCongNo, cheDoNguoiThue, hoaDonId, kyId, soLanTaiLai, token, toaNhaId])

  if (dangTai) return <ScreenSurface data-layout-variant={variant} aria-busy="true" aria-live="polite">Đang tải hoá đơn…</ScreenSurface>
  if (loi) {
    return (
      <ScreenSurface data-layout-variant={variant} role="alert">
        <p style={{ margin: 0, lineHeight: 1.55 }}>{loi}</p>
        <Button data-retry-invoice variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>Thử lại</Button>
      </ScreenSurface>
    )
  }
  if (!hoaDon) {
    return (
      <ScreenSurface data-testid="invoice-screen" data-layout-variant={variant}>
        <SysLabel>{maTruyVet}</SysLabel>
        <h3>Hoá đơn</h3>
        <EmptyState title={thongBaoRong ?? 'Chọn một hoá đơn để xem đầy đủ từng khoản mục.'} />
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
      <ScreenHeader action={
        <div className="ma-no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cheDoNguoiThue ? <Button data-view-invoice-history variant="text" onClick={moLichSu}>Xem lịch sử</Button> : null}
          <Button data-print-invoice variant="secondary" onClick={() => window.print()}>In A4</Button>
        </div>
      }>
        <SysLabel>{maTruyVet}</SysLabel>
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
        <MobileInvoiceLines token={token} lines={hoaDon.cacDong} total={hoaDon.tongTien} />
      ) : (
        <TableFrame>
          <thead>
            <tr>
              <TableHeadCell>Khoản mục</TableHeadCell>
              <TableHeadCell>Diễn giải kiểm tra</TableHeadCell>
              <TableHeadCell align="right">Thành tiền</TableHeadCell>
            </tr>
          </thead>
          <tbody>{hoaDon.cacDong.map((dong, index) => <DongHoaDon key={`${dong.tenKhoan}-${index}`} token={token} dong={dong} />)}</tbody>
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

function MobileInvoiceLines({ token, lines, total }: { token: string; lines: ThongTinDongHoaDon[]; total: string }) {
  return (
    <div data-mobile-invoice-lines style={{ display: 'grid', gap: 10, minWidth: 0 }}>
      {lines.length === 0 ? <EmptyState title="Hoá đơn chưa có khoản mục." /> : null}
      {lines.map((dong, index) => (
        <article key={`${dong.tenKhoan}-${index}`} data-mobile-invoice-line={dong.tenKhoan} data-invoice-rounding={laDongLamTron(dong) ? true : undefined} style={{ display: 'grid', gap: 10, minWidth: 0, padding: 14, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }}>
          <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
            <strong style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{dong.tenKhoan}</strong>
            <Figure value={dinhDangTien(dong.thanhTien)} unit="₫" tone={dong.thanhTien.startsWith('-') ? 'urgent' : 'primary'} />
          </header>
          <InvoiceLineDetails dong={dong} />
          <div style={{ minWidth: 0, overflowWrap: 'anywhere', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>{dong.dienGiai}</div>
          {laDongLamTron(dong) ? <RoundingExplanation /> : null}
          {dong.anhCongToUrl ? <MeterImage imageId={dong.anhCongToId} onRefresh={dong.anhCongToId == null ? undefined : () => fetchLienKetAnh(token, dong.anhCongToId!)} src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /> : null}
          {dong.cacBac.length > 0 ? (
            <div data-mobile-invoice-tiers style={{ display: 'grid', gap: 8, paddingTop: 10, borderTop: '1px solid var(--ma-border-subtle)' }}>
              {dong.cacBac.map((bac) => (
                <div key={`${dong.tenKhoan}-${bac.bac}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, minWidth: 0, color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                  <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <strong style={{ color: 'var(--ma-text-primary)' }}>Bậc {bac.bac}</strong>
                    <div>Khoảng {bac.tuSoLuong} – {bac.denSoLuong ?? 'không giới hạn'}</div>
                    <div>Định mức sau quy đổi: {bac.dinhMucQuyDoi ?? 'không giới hạn'}</div>
                    <div>Mức tiêu thụ: {bac.soLuong}</div>
                    <div>Đơn giá: {dinhDangTien(bac.donGia)} ₫</div>
                    <div>Thành tiền: {dinhDangTien(bac.thanhTien)} ₫</div>
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

function DongHoaDon({ token, dong }: { token: string; dong: ThongTinDongHoaDon }) {
  return (
    <>
      <tr data-invoice-line={dong.tenKhoan} data-invoice-rounding={laDongLamTron(dong) ? true : undefined}>
        <TableCell header>{dong.tenKhoan}</TableCell>
        <TableCell>
          <InvoiceLineDetails dong={dong} showAmount={false} />
          <div style={{ marginTop: 10 }}>{dong.dienGiai}</div>
          {laDongLamTron(dong) ? <RoundingExplanation /> : null}
          {dong.anhCongToUrl ? <MeterImage imageId={dong.anhCongToId} onRefresh={dong.anhCongToId == null ? undefined : () => fetchLienKetAnh(token, dong.anhCongToId!)} src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /> : null}
        </TableCell>
        <TableCell align="right"><Figure value={dinhDangTien(dong.thanhTien)} unit="₫" tone={dong.thanhTien.startsWith('-') ? 'urgent' : 'primary'} /></TableCell>
      </tr>
      {dong.cacBac.map((bac) => (
        <tr key={`${dong.tenKhoan}-${bac.bac}`}>
          <TableCell muted>Bậc {bac.bac}</TableCell>
          <TableCell muted>
            <div>Khoảng {bac.tuSoLuong} – {bac.denSoLuong ?? 'không giới hạn'}</div>
            <div>Định mức sau quy đổi: {bac.dinhMucQuyDoi ?? 'không giới hạn'}</div>
            <div>Mức tiêu thụ: {bac.soLuong}</div>
            <div>Đơn giá: {dinhDangTien(bac.donGia)} ₫</div>
            <div>Thành tiền: {dinhDangTien(bac.thanhTien)} ₫</div>
          </TableCell>
          <TableCell align="right"><Figure value={dinhDangTien(bac.thanhTien)} unit="₫" size="sm" /></TableCell>
        </tr>
      ))}
    </>
  )
}

function InvoiceLineDetails({ dong, showAmount = true }: { dong: ThongTinDongHoaDon; showAmount?: boolean }) {
  const donGia = dong.donGia != null
    ? `${dinhDangTien(dong.donGia)} ₫`
    : dong.cacBac.length > 0 ? 'Theo bậc thang' : '—'

  return (
    <dl data-invoice-line-details style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px 12px', margin: 0, color: 'var(--ma-text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
      <div><dt>Chỉ số đầu:</dt><dd style={{ margin: 0, color: 'var(--ma-text-primary)', fontWeight: 700 }}>{dong.chiSoDau ?? '—'}</dd></div>
      <div><dt>Chỉ số cuối:</dt><dd style={{ margin: 0, color: 'var(--ma-text-primary)', fontWeight: 700 }}>{dong.chiSoCuoi ?? '—'}</dd></div>
      <div><dt>Mức tiêu thụ:</dt><dd style={{ margin: 0, color: 'var(--ma-text-primary)', fontWeight: 700 }}>{dong.soLuong ?? '—'}</dd></div>
      <div><dt>Đơn giá:</dt><dd style={{ margin: 0, color: 'var(--ma-text-primary)', fontWeight: 700 }}>{donGia}</dd></div>
      {showAmount ? <div><dt>Thành tiền:</dt><dd style={{ margin: 0, color: 'var(--ma-text-primary)', fontWeight: 700 }}>{dinhDangTien(dong.thanhTien)} ₫</dd></div> : null}
    </dl>
  )
}

function RoundingExplanation() {
  return <p data-invoice-rounding-explanation style={{ margin: '10px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13, lineHeight: 1.55 }}>Quy tắc: làm tròn nửa lên đến 1.000 đồng. Số âm là phần điều chỉnh giảm sau khi làm tròn.</p>
}

function laDongLamTron(dong: ThongTinDongHoaDon) {
  return dong.loaiKhoan === 'LAM_TRON'
}

function moLichSu() {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', '/lich-su')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function toneHoaDon(status: string): 'draft' | 'neutral' | 'strong' | 'urgent' | 'waiting' | 'done' | 'closed' {
  if (status.includes('HUY')) return 'closed'
  if (status.includes('QUA_HAN')) return 'urgent'
  if (status.includes('THANH_TOAN')) return 'done'
  if (status.includes('PHAT_HANH')) return 'strong'
  return 'draft'
}
