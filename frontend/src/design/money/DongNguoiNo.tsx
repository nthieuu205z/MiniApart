import type * as React from 'react'
import { dinhDangNgayIso, dinhDangTien } from '../core/format'
import { chuanSdt, nhanThang } from '../../tienTheoNguoi'
import type { NhomNo } from '../../nhomNoTheoNguoi'

export type DongNguoiNoProps = {
  nhom: NhomNo; sdt?: string | null; hienToa?: boolean
  rut?: boolean
  mo?: boolean; onMo?: () => void
  hrefHoSo?: string
  onNhac?: () => void
  onGhiThu?: () => void
}

/** Một người nợ (gom mọi tháng). Gọi = <a tel:> chỉ khi số hợp lệ. Mọi nút là nút thường. */
export function DongNguoiNo({ nhom, sdt, hienToa, rut, mo, onMo, hrefHoSo, onNhac, onGhiThu }: DongNguoiNoProps): React.ReactElement {
  const dt = chuanSdt(sdt)
  const soThang = nhom.hoaDon.length
  const phong = `phòng ${nhom.soPhong}${hienToa ? ` · ${nhom.tenToaNha}` : ''}`
  const ten = hrefHoSo ? <a href={hrefHoSo}>{nhom.hoTen}</a> : nhom.hoTen
  const goi = dt ? <a className="btn btn-secondary btn-sm" href={`tel:${dt}`}>Gọi</a> : null
  const dau = nhom.hoaDon[0]
  return (
    <div className="ma-nguoino">
      <div className="ma-nguoino-hang">
        <div className="ma-nguoino-ten">
          <span>{ten}</span>
          <span className="ma-nguoino-phu">{rut ? `${phong} · ${soThang} tháng` : `${phong} · từ tháng ${nhanThang(dau)}`}</span>
        </div>
        {!rut && nhom.daThu > 0 ? <span className="ma-nguoino-phu">Đã trả {dinhDangTien(nhom.daThu)} ₫</span> : null}
        <span className="ma-nguoino-so">{rut ? '' : 'Còn nợ '}{dinhDangTien(nhom.conLai)} ₫</span>
        {rut ? goi : (
          <>
            {onMo ? <button type="button" className="btn btn-ghost btn-sm" aria-expanded={!!mo} onClick={onMo}>{mo ? 'Thu gọn' : `${soThang} tháng`}</button> : null}
            {goi}
            {onNhac ? <button type="button" className="btn btn-secondary btn-sm" onClick={onNhac}>Nhắc</button> : null}
            {onGhiThu ? <button type="button" className="btn btn-secondary btn-sm" onClick={onGhiThu}>Ghi thu</button> : null}
          </>
        )}
      </div>
      {mo && !rut ? (
        <div className="ma-nguoino-con">
          {nhom.hoaDon.map((h) => (
            <span key={h.hoaDonId}>Tháng {nhanThang(h)} · hạn {dinhDangNgayIso(h.hanThanhToan.slice(0, 10))}{h.soNgayQuaHan > 0 ? ` · trễ ${h.soNgayQuaHan} ngày` : ''} · còn {dinhDangTien(h.conLai)} ₫</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
