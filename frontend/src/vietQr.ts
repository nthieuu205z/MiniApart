/** Chuỗi VietQR (EMVCo, dịch vụ QRIBFTTA) dựng ở client; cùng khuôn với backend VietQrPayloadBuilder. */
const tlv = (tag: string, value: string) => `${tag}${String(new TextEncoder().encode(value).length).padStart(2, '0')}${value}`

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), 4 chữ hex hoa. */
export function crc16(s: string): string {
  let crc = 0xffff
  for (const b of new TextEncoder().encode(s)) {
    crc ^= b << 8
    for (let i = 0; i < 8; i++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Nội dung (tag 62.08) tối đa 25 ký tự theo VietQR; dài hơn thì bỏ khỏi QR (người trả vẫn nhập tay). */
export function taoChuoiVietQr(o: { maNganHang: string; soTaiKhoan: string; soTien: number; noiDung?: string }): string {
  const tk = tlv('00', 'A000000727') + tlv('01', tlv('00', o.maNganHang) + tlv('01', o.soTaiKhoan)) + tlv('02', 'QRIBFTTA')
  const nd = o.noiDung && o.noiDung.length <= 25 ? tlv('62', tlv('08', o.noiDung)) : ''
  const khongCrc = tlv('00', '01') + tlv('01', '12') + tlv('38', tk) + tlv('53', '704') + tlv('54', o.soTien.toFixed(2)) + tlv('58', 'VN') + nd + '6304'
  return khongCrc + crc16(khongCrc)
}
