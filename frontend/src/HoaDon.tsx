import { useEffect, useState } from 'react'
import { ApiError, fetchHoaDonChiTiet, type ThongTinHoaDonChiTiet, type ThongTinDongHoaDon } from './api'

type Props = {
  token: string
  toaNhaId?: number
  kyId?: number
  hoaDonId?: number
}

export default function HoaDon({ token, toaNhaId, kyId, hoaDonId }: Props) {
  const [hoaDon, setHoaDon] = useState<ThongTinHoaDonChiTiet | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

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
        if (!mounted) return
        setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải chi tiết hoá đơn.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [hoaDonId, kyId, token, toaNhaId])

  if (dangTai) return <section className="invoice-screen">Đang tải hoá đơn…</section>
  if (loi) return <section className="invoice-screen status-message--error" role="alert">{loi}</section>
  if (!hoaDon) {
    return (
      <section className="invoice-screen" data-testid="invoice-screen">
        <p className="eyebrow">FR-INV-02</p>
        <h3>Hoá đơn</h3>
        <p className="status-message">Chọn một hoá đơn để xem đầy đủ từng khoản mục.</p>
      </section>
    )
  }

  return (
    <section className="invoice-screen invoice-printable" data-testid="invoice-detail" aria-labelledby="invoice-title">
      <div className="invoice-toolbar">
        <div>
          <p className="eyebrow">FR-INV-02</p>
          <h3 id="invoice-title">Hoá đơn {hoaDon.maHoaDon}</h3>
        </div>
        <button type="button" className="ghost-button invoice-no-print" data-print-invoice onClick={() => window.print()}>
          In A4
        </button>
      </div>

      <dl className="invoice-meta">
        <div><dt>Phòng</dt><dd>{hoaDon.soPhong}</dd></div>
        <div><dt>Người thuê</dt><dd>{hoaDon.nguoiThue}</dd></div>
        <div><dt>Kỳ thanh toán</dt><dd>{hoaDon.ngayPhatHanh} – {hoaDon.hanThanhToan}</dd></div>
        <div><dt>Trạng thái</dt><dd>{hoaDon.trangThai}</dd></div>
      </dl>

      {hoaDon.soNguoiO !== null && hoaDon.soNguoiO !== undefined ? (
        <p className="invoice-residents">
          Số người ở đã dùng để tính: <strong>{hoaDon.soNguoiO} người</strong>. Số hộ quy đổi: <strong>{hoaDon.soHoQuyDoi ?? '—'} hộ quy đổi</strong>.
          {hoaDon.giaiThichSoHo ? ` ${hoaDon.giaiThichSoHo}.` : ' Quy tắc: 4 người được tính là 1 hộ.'}
        </p>
      ) : null}

      <div className="invoice-table-wrap">
        <table className="invoice-table">
          <thead><tr><th>Khoản mục</th><th>Diễn giải kiểm tra</th><th>Thành tiền</th></tr></thead>
          <tbody>
            {hoaDon.cacDong.map((dong, index) => <DongHoaDon key={`${dong.tenKhoan}-${index}`} dong={dong} />)}
          </tbody>
          <tfoot><tr><th colSpan={2}>Tổng cộng</th><th>{dinhDangTien(hoaDon.tongTien)} ₫</th></tr></tfoot>
        </table>
      </div>

      <div className="invoice-total">
        <span>Còn phải thu</span>
        <strong>{dinhDangTien(hoaDon.conLai)} ₫</strong>
      </div>
    </section>
  )
}

function DongHoaDon({ dong }: { dong: ThongTinDongHoaDon }) {
  return (
    <>
      <tr>
        <th scope="row">{dong.tenKhoan}</th>
        <td>
          <div>{dong.dienGiai}</div>
          {dong.anhCongToUrl ? <img className="meter-photo invoice-no-print" src={dong.anhCongToUrl} alt={`Ảnh công tơ ${dong.tenKhoan}`} /> : null}
        </td>
        <td className={dong.thanhTien.startsWith('-') ? 'invoice-negative' : ''}>{dinhDangTien(dong.thanhTien)} ₫</td>
      </tr>
      {dong.cacBac.map((bac) => (
        <tr className="invoice-tier" key={`${dong.tenKhoan}-${bac.bac}`}>
          <td>Bậc {bac.bac}</td>
          <td>
            <div>Khoảng {bac.tuSoLuong} – {bac.denSoLuong ?? 'không giới hạn'}</div>
            <div>Định mức sau quy đổi: {bac.dinhMucQuyDoi ?? 'không giới hạn'}</div>
            <div>{bac.soLuong} × {bac.donGia} = {bac.thanhTien}</div>
          </td>
          <td>{dinhDangTien(bac.thanhTien)} ₫</td>
        </tr>
      ))}
    </>
  )
}

export function dinhDangTien(giaTri: string) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(giaTri.trim())
  if (!match) {
    return giaTri
  }

  const dau = match[1]
  const phanNguyen = match[2].replace(/^0+(?=\d)/, '')
  const phanThapPhan = (match[3] ?? '').replace(/0+$/, '')
  const nguyenDaNhom = phanNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${dau}${nguyenDaNhom}${phanThapPhan ? `,${phanThapPhan}` : ''}`
}
