import { describe, expect, it } from 'vitest'
import { crc16, taoChuoiVietQr } from './vietQr'

describe('vietQr', () => {
  it('CRC-16/CCITT-FALSE đúng vector chuẩn "123456789" = 29B1', () => expect(crc16('123456789')).toBe('29B1'))

  it('ra đúng chuỗi vàng của backend (VietQrPayloadBuilderTest), cùng CRC 8514', () => {
    const chuoi = taoChuoiVietQr({ maNganHang: '970422', soTaiKhoan: '000000000202', soTien: 888000, noiDung: 'TN-B-201-202608' })
    expect(chuoi).toBe('00020101021238560010A000000727012600069704220112000000000202' + '0208QRIBFTTA53037045409888000.005802VN62190815TN-B-201-20260863048514')
  })

  it('CRC cuối khớp phần đứng trước; nội dung dài hơn 25 ký tự bị bỏ khỏi QR', () => {
    const chuoi = taoChuoiVietQr({ maNganHang: '970405', soTaiKhoan: '000000000101', soTien: 7580000, noiDung: 'HD-2026-07 HD-2026-08 HD-2026-09' })
    expect(chuoi.slice(-8, -4)).toBe('6304')
    expect(crc16(chuoi.slice(0, -4))).toBe(chuoi.slice(-4))
    expect(chuoi).not.toContain('0815')
    expect(chuoi).toContain('54107580000.00')
  })
})
