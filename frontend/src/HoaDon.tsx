import { useEffect, useState } from 'react'
import type React from 'react'
import { ApiError, fetchHoaDonChiTiet, type ThongTinHoaDonChiTiet, type ThongTinDongHoaDon } from './api'
import { Button } from './design/core/Button'
import { Figure } from './design/core/Figure'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'

type Props = { token: string; toaNhaId?: number; kyId?: number; hoaDonId?: number }
const SCREEN_STYLE: React.CSSProperties = { display: 'grid', gap: 16, padding: 'clamp(16px, 4vw, 32px)', border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)', maxWidth: '100%', overflow: 'hidden' }
const HEAD_STYLE: React.CSSProperties = { padding: 12, borderBottom: '1px solid var(--ma-border-default)', textAlign: 'left', color: 'var(--ma-text-secondary)' }
const CELL_STYLE: React.CSSProperties = { padding: 12, borderBottom: '1px solid var(--ma-border-default)', textAlign: 'left', verticalAlign: 'top', overflowWrap: 'anywhere' }

export default function HoaDon({ token, toaNhaId, kyId, hoaDonId }: Props) {
  const [hoaDon, setHoaDon] = useState<ThongTinHoaDonChiTiet | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  useEffect(() => {
    if (toaNhaId === undefined || kyId === undefined || hoaDonId === undefined) { setDangTai(false); return }
    let mounted = true
    setDangTai(true); setLoi(null)
    fetchHoaDonChiTiet(token, toaNhaId, kyId, hoaDonId)
      .then((data) => { if (mounted) setHoaDon(data) })
      .catch((reason: unknown) => { if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải chi tiết hoá đơn.') })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [hoaDonId, kyId, token, toaNhaId])
  if (dangTai) return <section style={SCREEN_STYLE}>Đang tải hoá đơn…</section>
  if (loi) return <section style={SCREEN_STYLE} role="alert">{loi}</section>
  if (!hoaDon) return <section data-testid="invoice-screen" style={SCREEN_STYLE}><SysLabel>FR-INV-02</SysLabel><h3>Hoá đơn</h3><EmptyState title="Chọn một hoá đơn để xem đầy đủ từng khoản mục." /></section>
  return <>
    <style>{'@media print { .invoice-no-print { display: none !important } .invoice-printable { padding: 0 !important; border: 0 !important; box-shadow: none !important } }'}</style>
    <section className="invoice-printable" data-testid="invoice-detail" aria-labelledby="invoice-title" style={SCREEN_STYLE}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div><SysLabel>FR-INV-02</SysLabel><h3 id="invoice-title" style={{ margin: '6px 0 0' }}>Hoá đơn {hoaDon.maHoaDon}</h3></div><Button className="invoice-no-print" data-print-invoice variant="secondary" onClick={() => window.print()}>In A4</Button></div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(10rem, 100%), 1fr))', gap: 12, margin: 0 }}><Meta label="Phòng">{hoaDon.soPhong}</Meta><Meta label="Người thuê">{hoaDon.nguoiThue}</Meta><Meta label="Kỳ thanh toán">{dinhDangNgay(hoaDon.ngayPhatHanh)} – {dinhDangNgay(hoaDon.hanThanhToan)}</Meta><Meta label="Trạng thái"><StatusTag tone={toneHoaDon(hoaDon.trangThai)}>{hoaDon.trangThai}</StatusTag></Meta></dl>
      {hoaDon.soNguoiO !== null && hoaDon.soNguoiO !== undefined ? <p style={{ margin: 0, padding: '12px 16px', borderLeft: '4px solid var(--ma-bg-inverse)', background: 'var(--ma-bg-sunken)', lineHeight: 1.6 }}>Số người ở đã dùng để tính: <strong>{hoaDon.soNguoiO} người</strong>. Số hộ quy đổi: <strong>{hoaDon.soHoQuyDoi ?? '—'} hộ quy đổi</strong>.{hoaDon.giaiThichSoHo ? ` ${hoaDon.giaiThichSoHo}.` : ' Quy tắc: 4 người được tính là 1 hộ.'}</p> : null}
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', tableLayout: 'fixed' }}><thead><tr><th style={HEAD_STYLE}>Khoản mục</th><th style={HEAD_STYLE}>Diễn giải kiểm tra</th><th style={{ ...HEAD_STYLE, textAlign: 'right' }}>Thành tiền</th></tr></thead><tbody>{hoaDon.cacDong.map((dong, index) => <DongHoaDon key={`${dong.tenKhoan}-${index}`} dong={dong} />)}</tbody><tfoot><tr><th colSpan={2} style={HEAD_STYLE}>Tổng cộng</th><th style={{ ...HEAD_STYLE, textAlign: 'right' }}><Figure value={dinhDangTien(hoaDon.tongTien)} unit="₫" /></th></tr></tfoot></table></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'baseline' }}><span>Còn phải thu</span><Figure value={dinhDangTien(hoaDon.conLai)} unit="₫" size="lg" /></div>
    </section>
  </>
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) { return <div style={{ padding: 12, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }}><dt><SysLabel>{label}</SysLabel></dt><dd style={{ margin: '5px 0 0' }}>{children}</dd></div> }
function DongHoaDon({ dong }: { dong: ThongTinDongHoaDon }) { return <><tr><th scope="row" style={CELL_STYLE}>{dong.tenKhoan}</th><td style={CELL_STYLE}><div>{dong.dienGiai}</div>{dong.anhCongToUrl ? <img className="invoice-no-print" style={{ display: 'block', maxWidth: 160, maxHeight: 128, marginTop: 10, objectFit: 'cover' }} src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /> : null}</td><td style={{ ...CELL_STYLE, textAlign: 'right' }}><Figure value={dinhDangTien(dong.thanhTien)} unit="₫" tone={dong.thanhTien.startsWith('-') ? 'urgent' : 'primary'} /></td></tr>{dong.cacBac.map((bac) => <tr key={`${dong.tenKhoan}-${bac.bac}`}><td style={{ ...CELL_STYLE, color: 'var(--ma-text-secondary)' }}>Bậc {bac.bac}</td><td style={{ ...CELL_STYLE, color: 'var(--ma-text-secondary)' }}><div>Khoảng {bac.tuSoLuong} – {bac.denSoLuong ?? 'không giới hạn'}</div><div>Định mức sau quy đổi: {bac.dinhMucQuyDoi ?? 'không giới hạn'}</div><div>{bac.soLuong} × {bac.donGia} = {bac.thanhTien}</div></td><td style={{ ...CELL_STYLE, textAlign: 'right' }}><Figure value={dinhDangTien(bac.thanhTien)} unit="₫" size="sm" /></td></tr>)}</> }
function toneHoaDon(status: string): 'draft' | 'neutral' | 'strong' | 'urgent' | 'waiting' | 'done' | 'closed' { if (status.includes('HUY')) return 'closed'; if (status.includes('QUA_HAN')) return 'urgent'; if (status.includes('THANH_TOAN')) return 'done'; if (status.includes('PHAT_HANH')) return 'strong'; return 'draft' }
function dinhDangNgay(value: string) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); return match ? `${match[3]}/${match[2]}/${match[1]}` : value }
export function dinhDangTien(giaTri: string) { const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(giaTri.trim()); if (!match) return giaTri; const dau = match[1]; const phanNguyen = match[2].replace(/^0+(?=\d)/, ''); const phanThapPhan = (match[3] ?? '').replace(/0+$/, ''); const nguyenDaNhom = phanNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return `${dau}${nguyenDaNhom}${phanThapPhan ? `,${phanThapPhan}` : ''}` }
