import { useState, type CSSProperties, type ReactNode } from 'react'
import './CanTra.css'
import type { ThongTinHoaDonChiTiet, ThongTinHoaDonLichSu } from './api'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { NhanMinhHoa } from './design/feedback/NhanMinhHoa'
import { nhanThang } from './tienTheoNguoi'
import { EmptyState } from './design/feedback/EmptyState'

type Props = { mobile?: boolean; hoaDon: ThongTinHoaDonChiTiet; lichSu: ThongTinHoaDonLichSu[]; tra: string | null }

/** Tiêu đề trang: điện thoại đã có h1 ở thanh trên của khung nên chỉ h2; máy tính không có thanh đó nên là h1. */
export function Tieu({ mobile, children, ...rest }: { mobile?: boolean; children: ReactNode; className?: string; id?: string; style?: CSSProperties }) {
  const H = mobile ? 'h2' : 'h1'
  return <H {...rest}>{children}</H>
}

const NGAY_MS = 86_400_000
/** "7/2026"; hoá đơn quyết toán (không có tháng) → "Quyết toán". */
const kyCua = (h: ThongTinHoaDonLichSu) => (h.thang != null && h.nam != null ? `${h.thang}/${h.nam}` : 'Quyết toán')
const tongTien = (ds: ThongTinHoaDonLichSu[]) => (ds.reduce((a, h) => a + Math.round(Number(h.conLai) * 100), 0) / 100).toFixed(2)
const soNgayTre = (han: string) => Math.max(0, Math.floor((Date.now() - Date.parse(`${han}T00:00:00`)) / NGAY_MS))
const boDuoi0 = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s)

/** Phạm vi trả: "4 tháng, từ 7/2026 đến 10/2026"; một tháng: "Tháng 10/2026". */
function nhanPhamVi(ds: ThongTinHoaDonLichSu[]) {
  if (ds.length === 1) return ds[0].thang != null ? `Tháng ${kyCua(ds[0])}` : 'Quyết toán hợp đồng'
  const coKy = ds.filter((h) => h.thang != null && h.nam != null).sort((a, b) => a.nam! * 12 + a.thang! - (b.nam! * 12 + b.thang!))
  if (coKy.length === 0) return `${ds.length} tháng`
  return `${ds.length} tháng, từ ${kyCua(coKy[0])} đến ${kyCua(coKy[coKy.length - 1])}`
}

export default function CanTra({ mobile = false, hoaDon, lichSu, tra }: Props) {
  const chuaTra = lichSu.filter((h) => Number(h.conLai) > 0 && !h.trangThai.includes('HUY'))
  const dangTra = tra === 'tat-ca' ? chuaTra : chuaTra.filter((h) => String(h.hoaDonId) === tra)
  const moi = lichSu[0]
  const dangTraTien = Boolean(tra) && dangTra.length > 0
  const toa = moi ? moi.tenToaNha || `Toà ${moi.maToa}` : ''

  return (
    <div className={`invoice-screen invoice-screen--mobile nt${mobile ? '' : ' can-tra-rong'}${dangTraTien ? ' can-tra-tra' : ''}`} data-testid="invoice-detail" data-layout-variant="mobile" data-can-tra role="region" aria-labelledby="can-tra-tieu-de">
      <header className="nt-dau">
        {dangTraTien ? <a className="btn btn-ghost nt-quay" href="/hoa-don-cua-toi">← Quay lại</a> : null}
        <Tieu mobile={mobile} id="can-tra-tieu-de" className="nt-h1">{dangTraTien ? 'Trả tiền' : `Phòng ${hoaDon.soPhong}`}</Tieu>
        <div className="nt-phu">{dangTraTien ? (dangTra.length > 1 ? `${dangTra.length} tháng còn nợ` : nhanPhamVi(dangTra)) : toa}</div>
      </header>
      <div className="nt-than">
        {dangTraTien ? <TraTien ds={dangTra} /> : <TongQuan hoaDon={hoaDon} chuaTra={chuaTra} moi={moi} />}
      </div>
    </div>
  )
}

function TongQuan({ hoaDon, chuaTra, moi }: { hoaDon: ThongTinHoaDonChiTiet; chuaTra: ThongTinHoaDonLichSu[]; moi?: ThongTinHoaDonLichSu }) {
  const tong = tongTien(chuaTra)
  const cuNhat = chuaTra[chuaTra.length - 1]
  const quaHan = cuNhat ? soNgayTre(cuNhat.hanThanhToan) > 0 : false
  const kyMoi = moi ? kyCua(moi) : nhanThang(hoaDon)
  const soThangMoi = kyMoi.split('/')[0]
  return (
    <>
      <section className="nt-khoi nt-hero" aria-labelledby="can-tra-hero" data-can-tra-hero>
        <h2 className="nt-nhan" id="can-tra-hero">Bạn cần trả</h2>
        {chuaTra.length > 0 ? (
          <>
            <div className="nt-so nt-no" data-can-tra-tong>{dinhDangTien(tong)} ₫</div>
            <p className="nt-phu">
              {chuaTra.length} tháng chưa trả đủ. Tháng cũ nhất {quaHan ? 'quá hạn từ' : 'hạn'} <b>{dinhDangNgayIso(cuNhat.hanThanhToan)}</b>.
            </p>
            <a className="btn btn-primary btn-touch btn-block" data-tra-tat-ca href="/hoa-don-cua-toi?tra=tat-ca">Trả {dinhDangTien(tong)} ₫</a>
            {chuaTra.length > 1 ? (
              <a className="btn btn-ghost btn-block" data-tra-mot-ky href={`/hoa-don-cua-toi?tra=${cuNhat.hoaDonId}`}>Chỉ trả tháng {cuNhat.thang ?? kyCua(cuNhat)} trước · {dinhDangTien(cuNhat.conLai)} ₫</a>
            ) : null}
          </>
        ) : (
          <>
            <div className="nt-so" data-can-tra-tong>0 ₫</div>
            <p className="nt-phu">Bạn đã trả đủ mọi hoá đơn.</p>
            <a className="btn btn-secondary btn-block" data-xem-lich-su href="/lich-su">Xem lịch sử</a>
          </>
        )}
      </section>

      <div className="can-tra-ds">
        {chuaTra.length > 0 ? (
          <section className="nt-khoi" aria-labelledby="can-tra-cac-thang">
            <h2 className="nt-h2" id="can-tra-cac-thang">Gồm các tháng</h2>
            <div data-ky-chua-tra>
              {chuaTra.map((h) => {
                const tre = soNgayTre(h.hanThanhToan)
                return (
                  <a key={h.hoaDonId} className="nt-dong" data-ky-hoa-don={h.hoaDonId} href={`/hoa-don-cua-toi?hoaDonId=${h.hoaDonId}`}>
                    <span className="nt-dong-trai">
                      <span className="nt-ten">{h.thang != null ? `Tháng ${kyCua(h)}` : 'Quyết toán'}</span>
                      {tre > 0 ? <span className="nt-phu nt-tre">trễ {tre} ngày</span> : null}
                    </span>
                    <span className="nt-tien">{dinhDangTien(h.conLai)} ₫</span>
                    <Icon name="chevron-right" />
                  </a>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="nt-khoi" aria-labelledby="can-tra-tinh-the-nao">
          <h2 className="nt-h2" id="can-tra-tinh-the-nao">Tháng {soThangMoi} tính thế nào</h2>
          <div data-ky-moi-gom>
            {hoaDon.cacDong.length === 0 ? <EmptyState title="Hoá đơn chưa có khoản mục." /> : null}
            {hoaDon.cacDong.map((d, i) => (
              <div key={`${d.tenKhoan}-${i}`} className="nt-dong">
                <span className="nt-dong-trai">
                  <span className="nt-ten">{d.tenKhoan}</span>
                  {d.soLuong != null ? <span className="nt-phu">{d.chiSoDau != null && d.chiSoCuoi != null ? `${boDuoi0(d.chiSoDau)} → ${boDuoi0(d.chiSoCuoi)} · ` : ''}{boDuoi0(d.soLuong)}{d.donGia != null ? ` × ${dinhDangTien(d.donGia)} ₫` : ''}</span> : null}
                </span>
                <span className={`nt-tien${d.thanhTien.startsWith('-') ? ' nt-no' : ''}`}>{dinhDangTien(d.thanhTien)} ₫</span>
              </div>
            ))}
            <div className="nt-dong nt-cong">
              <span className="nt-ten">Cộng tháng {soThangMoi}</span>
              <span className="nt-tien" data-cong-thang>{dinhDangTien(hoaDon.tongTien)} ₫</span>
            </div>
          </div>
        </section>
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
      <section className="nt-khoi nt-hero" data-tra-tien>
        <div className="nt-nhan">Số tiền</div>
        <div className="nt-so nt-no" data-tra-so-tien>{dinhDangTien(tongTien(ds))} ₫</div>
        <p className="nt-phu">{nhanPhamVi(ds)}</p>
        <div className="nt-nhan">Nội dung chuyển khoản</div>
        <div className="nt-noidung" data-noi-dung-ck>{ds.map((h, i) => <span key={h.hoaDonId} className="nt-ma">{i > 0 ? ' ' : ''}{h.maHoaDon}</span>)}</div>
        <Button variant="secondary" className="btn-block" data-chep-noi-dung onClick={chep}>Chép</Button>
        <p className="nt-phu" role="status" data-da-chep>{daChep}</p>
      </section>
      <section className="nt-khoi" data-tra-can-backend>
        <NhanMinhHoa>cần backend</NhanMinhHoa>
        <p className="nt-phu">Chưa hiện được số tài khoản trong app. Hỏi quản lý số tài khoản của toà.</p>
        <p className="nt-phu">Chuyển xong, gọi hoặc nhắn quản lý để xác nhận. Khoản nợ sẽ tự trừ khi quản lý ghi thu.</p>
      </section>
    </>
  )
}
