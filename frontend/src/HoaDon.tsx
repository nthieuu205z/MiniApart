import { useEffect, useRef, useState } from 'react'
import { ApiError, fetchHoaDonChiTiet, fetchHoaDonCongNoChiTiet, fetchHoaDonCuaNguoiThue, fetchHoaDonMoiNhatCuaNguoiThue, fetchLichSuHoaDonCuaNguoiThue, fetchLienKetAnh, type ThongTinHoaDonChiTiet, type ThongTinHoaDonLichSu, type ThongTinDongHoaDon } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Figure } from './design/core/Figure'
import { Icon, type IconName } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { HighlightNotice, MetaGrid, MetaItem, MeterImage, ScreenHeader, ScreenSurface, TableCell, TableFrame, TableHeadCell, TotalLine } from './design/layout/Screen'
import InvoiceActions from './InvoiceActions'
import FinancePaymentPanel from './FinancePaymentPanel'
import { KyTruocConNo } from './LichSuHoaDon'
import CanTra from './CanTra'

type Props = { token: string; toaNhaId?: number; kyId?: number; hoaDonId?: number; mobile?: boolean; cheDoNguoiThue?: boolean; cheDoCongNo?: boolean; vaiTro?: string }

export default function HoaDon({ token, toaNhaId, kyId, hoaDonId, mobile = false, cheDoNguoiThue = false, cheDoCongNo = false, vaiTro }: Props) {
  const [hoaDon, setHoaDon] = useState<ThongTinHoaDonChiTiet | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBaoRong, setThongBaoRong] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)
  const [moThanhToan, setMoThanhToan] = useState(false)
  const [lichSu, setLichSu] = useState<ThongTinHoaDonLichSu[]>([])
  const [lichSuDaTai, setLichSuDaTai] = useState<boolean | null>(null) // null: đang tải, false: lỗi
  const previousRequest = useRef('')
  const variant = mobile ? 'mobile' : 'desktop'
  const maTruyVet = cheDoNguoiThue ? 'Hoá đơn của tôi' : cheDoCongNo ? 'Đối soát công nợ' : 'Quản lý hoá đơn'

  useEffect(() => {
    let mounted = true
    const key = `${token}:${cheDoNguoiThue}:${cheDoCongNo}:${toaNhaId}:${kyId}:${hoaDonId}`
    const changingInvoice = previousRequest.current !== key
    previousRequest.current = key
    setDangTai(true)
    setLoi(null)
    if (changingInvoice) { setHoaDon(null); setMoThanhToan(false) }
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

  const manHinhNguoiThueMobile = mobile && cheDoNguoiThue

  useEffect(() => {
    if (!manHinhNguoiThueMobile) return
    let mounted = true
    // Lịch sử chỉ để vẽ khối "Kỳ trước còn nợ": lỗi thì bỏ khối, không chặn hoá đơn.
    setLichSuDaTai(null)
    fetchLichSuHoaDonCuaNguoiThue(token)
      .then((data) => { if (mounted && Array.isArray(data)) { setLichSu(data); setLichSuDaTai(true) } })
      .catch(() => { if (mounted) { setLichSu([]); setLichSuDaTai(false) } })
    return () => { mounted = false }
  }, [manHinhNguoiThueMobile, token, soLanTaiLai])

  if (dangTai && !hoaDon) return <ScreenSurface data-layout-variant={variant} aria-busy="true" aria-live="polite">Đang tải hoá đơn…</ScreenSurface>
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

  if (manHinhNguoiThueMobile) {
    // Không chọn kỳ → "Cần trả" gom mọi kỳ chưa trả; lịch sử lỗi → quay về màn kỳ mới nhất như cũ.
    if (hoaDonId === undefined && lichSuDaTai === null) return <ScreenSurface data-layout-variant={variant} aria-busy="true" aria-live="polite"><div className="skel skel-line" />Đang tải hoá đơn…</ScreenSurface>
    if (hoaDonId === undefined && lichSuDaTai) return <CanTra hoaDon={hoaDon} lichSu={lichSu} tra={new URLSearchParams(window.location.search).get('tra')} />
    return <HoaDonNguoiThueMobile token={token} hoaDon={hoaDon} lichSu={lichSu} />
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
      {!cheDoNguoiThue && toaNhaId !== undefined && kyId !== undefined ? <InvoiceActions token={token} scope={{ toaNhaId, kyId, hoaDonId: hoaDon.hoaDonId }} hoaDon={hoaDon} vaiTro={vaiTro} onChanged={() => setSoLanTaiLai((count) => count + 1)} /> : null}
      {!cheDoNguoiThue ? <details className="ma-no-print" onToggle={(event) => setMoThanhToan(event.currentTarget.open)}><summary>Thu tiền, biên lai và bút toán đối ứng</summary>{moThanhToan ? <FinancePaymentPanel token={token} hoaDonId={hoaDon.hoaDonId} maHoaDon={hoaDon.maHoaDon} conLai={hoaDon.conLai} trangThai={hoaDon.trangThai} onChanged={() => setSoLanTaiLai((count) => count + 1)} /> : null}</details> : null}
    </ScreenSurface>
  )
}

const NHAN_TRANG_THAI: Record<string, [string, 'urgent' | 'done' | 'strong' | 'waiting' | 'closed']> = {
  QUA_HAN: ['Quá hạn', 'urgent'],
  DA_THANH_TOAN: ['Đã trả', 'done'],
  DA_THU_MOT_PHAN: ['Đã trả một phần', 'waiting'],
  DA_HUY: ['Đã huỷ', 'closed'],
}

function HoaDonNguoiThueMobile({ token, hoaDon, lichSu }: { token: string; hoaDon: ThongTinHoaDonChiTiet; lichSu: ThongTinHoaDonLichSu[] }) {
  const trongLichSu = lichSu.find((muc) => muc.hoaDonId === hoaDon.hoaDonId)
  const ky = trongLichSu?.thang != null && trongLichSu.nam != null
    ? `${String(trongLichSu.thang).padStart(2, '0')}/${trongLichSu.nam}`
    : hoaDon.ngayPhatHanh.slice(5, 7) + '/' + hoaDon.ngayPhatHanh.slice(0, 4)
  const daTraHet = Number(hoaDon.conLai) <= 0
  const [nhan, tone] = daTraHet ? NHAN_TRANG_THAI.DA_THANH_TOAN : NHAN_TRANG_THAI[hoaDon.trangThai] ?? ['Chưa đến hạn', 'strong']
  const tiLeDaTra = Number(hoaDon.tongTien) > 0 ? Math.min(100, Math.max(0, (Number(hoaDon.daThu) / Number(hoaDon.tongTien)) * 100)) : 0

  return (
    <div
      className="m-app invoice-screen invoice-screen--mobile"
      data-testid="invoice-detail"
      data-layout-variant="mobile"
      aria-labelledby="invoice-title"
      role="region"
    >
      <header className="m-top" style={{ padding: 0 }}>
        <div className="h-title">
          <span id="invoice-title">Hoá đơn của tôi</span>
          <div className="h-sub">Phòng {hoaDon.soPhong}{trongLichSu ? ` · ${trongLichSu.tenToaNha || `Toà ${trongLichSu.maToa}`}` : ''}</div>
        </div>
      </header>
      <div className="m-body" style={{ padding: 0, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <section className="m-card" aria-labelledby="invoice-period" data-invoice-total>
          <div className="spread">
            <h1 className="h3" id="invoice-period" style={{ margin: 0 }}>Kỳ {ky}</h1>
            <StatusTag tone={tone}>{nhan}</StatusTag>
          </div>
          <p className="t-sm t-2" style={{ margin: '12px 0 0' }}>Còn phải trả</p>
          <p style={{ margin: '8px 0 0', font: '600 40px/1.05 var(--ma-font-ui)', letterSpacing: '-0.02em' }} data-invoice-due>
            {dinhDangTien(hoaDon.conLai)}<span className="unit" style={{ fontSize: 20 }}>₫</span>
          </p>
          <div className="progress" style={{ marginTop: 14 }} role="progressbar" aria-valuenow={Math.round(tiLeDaTra)} aria-valuemin={0} aria-valuemax={100} aria-label={`Đã trả ${Math.round(tiLeDaTra)}%`}>
            <span style={{ width: `${tiLeDaTra}%` }} />
          </div>
          <p className="t-sm t-2" style={{ margin: '8px 0 0' }}>
            Đã trả {dinhDangTien(hoaDon.daThu)} ₫ trên {dinhDangTien(hoaDon.tongTien)} ₫ · hạn {dinhDangNgayIso(hoaDon.hanThanhToan)}
          </p>
        </section>

        <section className="m-card" aria-labelledby="invoice-lines-title">
          <h2 className="h3" id="invoice-lines-title" style={{ margin: 0 }}>Chi tiết khoản</h2>
          {hoaDon.soNguoiO != null ? (
            <p className="t-sm t-2" style={{ margin: '8px 0 0' }}>
              Số người ở đã dùng để tính: <strong>{hoaDon.soNguoiO} người</strong>. Số hộ quy đổi: <strong>{hoaDon.soHoQuyDoi ?? '—'} hộ quy đổi</strong>.
              {hoaDon.giaiThichSoHo ? ` ${hoaDon.giaiThichSoHo}.` : ' Quy tắc: 4 người được tính là 1 hộ.'}
            </p>
          ) : null}
          <div data-mobile-invoice-lines style={{ marginTop: 4 }}>
            {hoaDon.cacDong.length === 0 ? <EmptyState title="Hoá đơn chưa có khoản mục." /> : null}
            {hoaDon.cacDong.map((dong, index) => <DongTienMobile key={`${dong.tenKhoan}-${index}`} token={token} dong={dong} tach={index > 0} />)}
          </div>
          <div className="spread" style={{ alignItems: 'baseline', paddingTop: 14, borderTop: '1px solid var(--ma-line-200)', marginTop: 4 }}>
            <span className="t-strong">Tổng kỳ này</span>
            <span style={{ font: '600 20px/1 var(--ma-font-ui)' }}>{dinhDangTien(hoaDon.tongTien)} ₫</span>
          </div>
        </section>

        <KyTruocConNo lichSu={lichSu} hienTaiId={hoaDon.hoaDonId} />
      </div>
    </div>
  )
}

function DongTienMobile({ token, dong, tach }: { token: string; dong: ThongTinDongHoaDon; tach: boolean }) {
  const donGia = dong.donGia != null ? `${dinhDangTien(dong.donGia)} ₫` : dong.cacBac.length > 0 ? 'theo bậc thang' : null
  const congThuc = dong.chiSoDau != null && dong.chiSoCuoi != null
    ? `${boDuoi0(dong.chiSoDau)} → ${boDuoi0(dong.chiSoCuoi)} = ${boDuoi0(dong.soLuong ?? '')}${donGia ? ` × ${donGia}` : ''}`
    : dong.soLuong != null && dong.donGia != null
      ? `${boDuoi0(dong.soLuong)} × ${donGia}`
      : dong.dienGiai
  const am = dong.thanhTien.startsWith('-')
  return (
    <div
      data-mobile-invoice-line={dong.tenKhoan}
      data-invoice-rounding={laDongLamTron(dong) ? true : undefined}
      style={{ padding: '12px 0', borderTop: tach ? '1px solid var(--ma-line-100)' : undefined, minWidth: 0 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
        <span style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', color: 'var(--ma-text-secondary)' }}><Icon name={bieuTuongKhoan(dong)} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '500 15px/1.3 var(--ma-font-ui)', overflowWrap: 'anywhere' }}>{dong.tenKhoan}</div>
          {congThuc ? <div className="t-meta" style={{ marginTop: 2, overflowWrap: 'anywhere' }}>{congThuc}</div> : null}
        </div>
        <div style={{ font: '600 15px/1.3 var(--ma-font-ui)', textAlign: 'right', whiteSpace: 'nowrap', color: am ? 'var(--ma-urgent)' : undefined }}>{dinhDangTien(dong.thanhTien)} ₫</div>
      </div>
      {laDongLamTron(dong) ? <RoundingExplanation /> : null}
      {dong.anhCongToUrl ? <div style={{ marginTop: 8 }}><MeterImage imageId={dong.anhCongToId} onRefresh={dong.anhCongToId == null ? undefined : () => fetchLienKetAnh(token, dong.anhCongToId!)} src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /></div> : null}
      {dong.cacBac.length > 0 ? (
        <div data-mobile-invoice-tiers style={{ display: 'grid', gap: 6, margin: '10px 0 0 48px' }}>
          {dong.cacBac.map((bac) => (
            <div key={`${dong.tenKhoan}-${bac.bac}`} className="t-meta" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8 }}>
              <span style={{ overflowWrap: 'anywhere' }}>
                Bậc {bac.bac} · {boDuoi0(bac.soLuong)} × {dinhDangTien(bac.donGia)} ₫
                <br />Khoảng {boDuoi0(bac.tuSoLuong)} – {bac.denSoLuong ? boDuoi0(bac.denSoLuong) : 'không giới hạn'} · định mức sau quy đổi {bac.dinhMucQuyDoi ? boDuoi0(bac.dinhMucQuyDoi) : 'không giới hạn'}
              </span>
              <b style={{ color: 'var(--ma-text-primary)', whiteSpace: 'nowrap' }}>{dinhDangTien(bac.thanhTien)} ₫</b>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// "288.00" -> "288"; chỉ số công tơ không dùng dấu nhóm nghìn.
function boDuoi0(giaTri: string) {
  return giaTri.includes('.') ? giaTri.replace(/\.?0+$/, '') : giaTri
}

function bieuTuongKhoan(dong: ThongTinDongHoaDon): IconName {
  const ten = dong.tenKhoan.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd')
  if (laDongLamTron(dong) || ten.includes('lam tron')) return 'plus'
  if (ten.includes('phong')) return 'door'
  if (ten.includes('dien')) return 'bolt'
  if (ten.includes('nuoc')) return 'droplet'
  if (ten.includes('ve sinh') || ten.includes('nguoi')) return 'users'
  return 'layers'
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
