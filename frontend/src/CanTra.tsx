import { useState, type CSSProperties, type ReactNode } from 'react'
import './CanTra.css'
import type { ThongTinHoaDonChiTiet, ThongTinHoaDonLichSu } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'

type Props = { mobile?: boolean; hoaDon: ThongTinHoaDonChiTiet; lichSu: ThongTinHoaDonLichSu[]; tra: string | null }

/** Tiêu đề trang: điện thoại đã có h1 ở thanh trên của khung nên chỉ h2; máy tính không có thanh đó nên là h1. */
export function Tieu({ mobile, children, ...rest }: { mobile?: boolean; children: ReactNode; className?: string; id?: string; style?: CSSProperties }) {
  const H = mobile ? 'h2' : 'h1'
  return <H {...rest}>{children}</H>
}

const NGAY_MS = 86_400_000
const kyCua = (h: ThongTinHoaDonLichSu) => (h.thang != null && h.nam != null ? `${String(h.thang).padStart(2, '0')}/${h.nam}` : 'Quyết toán')
const tongTien = (ds: ThongTinHoaDonLichSu[]) => (ds.reduce((a, h) => a + Math.round(Number(h.conLai) * 100), 0) / 100).toFixed(2)
const soNgayTre = (han: string) => Math.max(0, Math.floor((Date.now() - Date.parse(`${han}T00:00:00`)) / NGAY_MS))
const boDuoi0 = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s)

/** Phạm vi trả: "4 kỳ 07–10/2026" (cùng năm), "Kỳ 10/2026" (một kỳ). */
function nhanPhamVi(ds: ThongTinHoaDonLichSu[]) {
  if (ds.length === 1) return ds[0].thang != null ? `Kỳ ${kyCua(ds[0])}` : 'Quyết toán hợp đồng'
  const coKy = ds.filter((h) => h.thang != null && h.nam != null).sort((a, b) => a.nam! * 12 + a.thang! - (b.nam! * 12 + b.thang!))
  if (coKy.length === 0) return `${ds.length} kỳ`
  const dau = coKy[0], cuoi = coKy[coKy.length - 1]
  const p = (n: number) => String(n).padStart(2, '0')
  return `${ds.length} kỳ ${dau.nam === cuoi.nam ? `${p(dau.thang!)}–${p(cuoi.thang!)}/${cuoi.nam}` : `${kyCua(dau)}–${kyCua(cuoi)}`}`
}

export default function CanTra({ mobile = false, hoaDon, lichSu, tra }: Props) {
  const chuaTra = lichSu.filter((h) => Number(h.conLai) > 0 && !h.trangThai.includes('HUY'))
  const dangTra = tra === 'tat-ca' ? chuaTra : chuaTra.filter((h) => String(h.hoaDonId) === tra)
  const moi = lichSu[0]
  const dau = moi ? `${moi.tenToaNha || `Toà ${moi.maToa}`} · ${hoaDon.nguoiThue}` : hoaDon.nguoiThue
  const tieuDe = tra && dangTra.length > 0 ? 'Trả tiền' : `Phòng ${hoaDon.soPhong}`
  const phu = tra && dangTra.length > 0 ? `Phòng ${hoaDon.soPhong} · ${moi?.tenToaNha || hoaDon.nguoiThue}` : dau

  return (
    <div className={`invoice-screen invoice-screen--mobile${mobile ? '' : ' can-tra-rong'}${tra && dangTra.length > 0 ? ' can-tra-tra' : ''}`} data-testid="invoice-detail" data-layout-variant="mobile" data-can-tra role="region" aria-labelledby="can-tra-tieu-de">
      <header>
        <Tieu mobile={mobile} id="can-tra-tieu-de" className="h3" style={{ margin: 0, font: '600 20px/1.2 var(--ma-font-ui)' }}>{tieuDe}</Tieu>
        <div className="t-sm t-2">{phu}</div>
      </header>
      <div className="m-body" style={{ padding: 0, marginTop: 12, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {tra && dangTra.length > 0 ? <TraTien ds={dangTra} /> : <TongQuan hoaDon={hoaDon} chuaTra={chuaTra} moi={moi} />}
      </div>
    </div>
  )
}

function TongQuan({ hoaDon, chuaTra, moi }: { hoaDon: ThongTinHoaDonChiTiet; chuaTra: ThongTinHoaDonLichSu[]; moi?: ThongTinHoaDonLichSu }) {
  const tong = tongTien(chuaTra)
  const quaHan = chuaTra.filter((h) => h.trangThaiThanhToan === 'QUA_HAN').length
  const cuNhat = chuaTra[chuaTra.length - 1]
  const kyMoi = moi ? kyCua(moi) : hoaDon.ngayPhatHanh.slice(5, 7) + '/' + hoaDon.ngayPhatHanh.slice(0, 4)
  return (
    <>
      <section className="payhero" aria-labelledby="can-tra-hero" data-can-tra-hero>
        {chuaTra.length > 0 ? (
          <>
            <div><StatusTag tone={quaHan > 0 ? 'urgent' : 'strong'}>{quaHan > 0 ? `${quaHan} kỳ quá hạn` : `${chuaTra.length} kỳ chưa trả`}</StatusTag></div>
            <h2 className="t-sm t-2" id="can-tra-hero" style={{ margin: 0 }}>Cần trả</h2>
            <div className="amt t-danger" data-can-tra-tong>{dinhDangTien(tong)} ₫</div>
            <p className="t-sm t-2" style={{ margin: 0 }}>
              Tổng còn lại của {chuaTra.length} kỳ chưa trả đủ. Kỳ cũ nhất hạn {dinhDangNgayIso(cuNhat.hanThanhToan)}.
            </p>
            <a className="btn btn-primary btn-touch btn-block" data-tra-tat-ca href="/hoa-don-cua-toi?tra=tat-ca">Trả {dinhDangTien(tong)} ₫</a>
            {chuaTra.length > 1 ? (
              <a className="btn btn-ghost btn-block" data-tra-mot-ky href={`/hoa-don-cua-toi?tra=${chuaTra[0].hoaDonId}`} style={{ height: 44 }}>Chỉ trả kỳ {kyCua(chuaTra[0])}</a>
            ) : null}
          </>
        ) : (
          <>
            <div><StatusTag tone="done">Đã trả</StatusTag></div>
            <h2 className="t-sm t-2" id="can-tra-hero" style={{ margin: 0 }}>Cần trả</h2>
            <div className="amt" data-can-tra-tong>0 ₫</div>
            <p className="t-sm t-2" style={{ margin: 0 }}>Không còn khoản nào cần trả. Kỳ {kyMoi} đã thu đủ.</p>
          </>
        )}
      </section>

      <div className="can-tra-ds">
      {chuaTra.length > 0 ? (
        <>
          <h2 className="m-h">Các kỳ chưa trả đủ</h2>
          <div className="m-list" data-ky-chua-tra>
            {chuaTra.map((h) => {
              const tre = soNgayTre(h.hanThanhToan)
              return (
                <a key={h.hoaDonId} className="irow" data-ky-hoa-don={h.hoaDonId} href={`/hoa-don-cua-toi?hoaDonId=${h.hoaDonId}`}>
                  <div className="body">
                    <div className="t">Kỳ {kyCua(h)}</div>
                    <div className="s" style={{ whiteSpace: 'normal' }}>Hạn {dinhDangNgayIso(h.hanThanhToan)} · đã trả {dinhDangTien(h.daThu)} ₫</div>
                  </div>
                  <div className="end">
                    <div className="money">{dinhDangTien(h.conLai)} ₫</div>
                    {tre > 0 ? <div className="t-meta" style={{ color: 'var(--ma-urgent)' }}>trễ {tre} ngày</div> : null}
                  </div>
                  <Icon name="chevron-right" />
                </a>
              )
            })}
          </div>
        </>
      ) : null}

      <h2 className="m-h">Kỳ {kyMoi} gồm</h2>
      <div className="m-list" data-ky-moi-gom>
        {hoaDon.cacDong.length === 0 ? <EmptyState title="Hoá đơn chưa có khoản mục." /> : null}
        {hoaDon.cacDong.map((d, i) => (
          <div key={`${d.tenKhoan}-${i}`} className="irow">
            <div className="body">
              <div className="t">{d.tenKhoan}</div>
              {d.soLuong != null ? <div className="s">{d.chiSoDau != null && d.chiSoCuoi != null ? `${boDuoi0(d.chiSoDau)} → ${boDuoi0(d.chiSoCuoi)} · ` : ''}{boDuoi0(d.soLuong)}{d.donGia != null ? ` × ${dinhDangTien(d.donGia)} ₫` : ''}</div> : null}
            </div>
            <div className="money" style={d.thanhTien.startsWith('-') ? { color: 'var(--ma-urgent)' } : undefined}>{dinhDangTien(d.thanhTien)} ₫</div>
          </div>
        ))}
      </div>
      </div>
    </>
  )
}

function TraTien({ ds }: { ds: ThongTinHoaDonLichSu[] }) {
  const [daChep, setDaChep] = useState<string | null>(null)
  const noiDung = ds.map((h) => h.maHoaDon).join(' ')
  const chep = () => {
    const ghi = navigator.clipboard?.writeText(noiDung)
    if (!ghi) return setDaChep('Không chép được, hãy chọn nội dung rồi chép thủ công.')
    ghi.then(() => setDaChep('Đã chép nội dung chuyển khoản.'), () => setDaChep('Không chép được, hãy chọn nội dung rồi chép thủ công.'))
  }
  return (
    <>
      <div className="mstep" role="img" aria-label="Bước 2/3: Chuyển khoản"><span className="on" /><span className="on" /><span /></div>
      <p className="t-sm t-2" style={{ margin: 0 }}>Bước 2/3 · Chuyển khoản</p>
      <section className="payhero" data-tra-tien>
        <div className="t-sm t-2">Số tiền</div>
        <div className="amt" data-tra-so-tien>{dinhDangTien(tongTien(ds))} ₫</div>
        <p className="t-sm t-2" style={{ margin: 0 }}>{nhanPhamVi(ds)}</p>
        <div className="sumrow"><span>Nội dung chuyển khoản</span><b data-noi-dung-ck style={{ overflowWrap: 'anywhere' }}>{noiDung}</b></div>
        <Button variant="secondary" data-chep-noi-dung onClick={chep} style={{ minHeight: 44 }}>Sao chép nội dung</Button>
        <p className="t-sm t-2" role="status" style={{ margin: 0 }} data-da-chep>{daChep}</p>
        <div className="sumrow" data-so-tai-khoan><span>Số tài khoản</span><b>Hỏi quản lý toà để lấy số tài khoản</b></div>
        <p className="t-sm t-2" style={{ margin: 0 }} data-qr-chua-co>Mã QR chưa có (chờ API).</p>
      </section>
      <a className="btn btn-secondary btn-touch btn-block" href="/hoa-don-cua-toi">Về Cần trả</a>
      <p className="t-meta" style={{ textAlign: 'center', margin: 0 }}>Quản lý xác nhận rồi hoá đơn chuyển sang “Đã thu”.</p>
    </>
  )
}
