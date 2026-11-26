// V3 "gom tiền theo người": nhãn tháng, chia một lần thu vào nhiều hoá đơn (tháng cũ trước),
// ghi lần lượt bằng API thu tiền đang có, và tin nhắc nợ soạn sẵn mở bằng Zalo. Không cần API mới.
import { dinhDangTien } from './design/core/format'
import type { DongNo } from './nhomNoTheoNguoi'

type HoaDonCanThu = Pick<DongNo, 'hoaDonId' | 'hanThanhToan' | 'conLai'> & { ngayPhatHanh?: string | null }

/** "7/2026" — tháng của hoá đơn lấy theo ngày gửi; thiếu ngày gửi (Quản lý) thì theo hạn trả, như ThuTien cũ. */
export function nhanThang(h: { ngayPhatHanh?: string | null; hanThanhToan: string }): string {
  const s = (h.ngayPhatHanh ?? h.hanThanhToan).slice(0, 7)
  return `${Number(s.slice(5, 7))}/${s.slice(0, 4)}`
}

/** "7.580.000" / "7580000" / "7 580 000" → 7580000. Không phải số nguyên đồng dương → null. */
export function docSoTien(chu: string): number | null {
  const s = chu.replace(/[.\s₫]/g, '')
  if (!/^[1-9]\d*$/.test(s)) return null
  const n = Number(s)
  return Number.isSafeInteger(n) ? n : null
}

export type PhanBo = { hoaDonId: number; soTien: number }

/** Chia `soTien` vào các hoá đơn còn nợ theo hạn trả, cũ trước. Thu dư hoặc ≤ 0 → lỗi, không chia (V3 màn Trạng thái: "Thu dư thì ghi vào tháng sau"). */
export function phanBoThu(hoaDon: HoaDonCanThu[], soTien: number): { phanBo: PhanBo[]; loi: string | null } {
  const conNo = hoaDon.filter((h) => h.conLai > 0).sort((a, b) => a.hanThanhToan.localeCompare(b.hanThanhToan) || a.hoaDonId - b.hoaDonId)
  const tong = conNo.reduce((s, h) => s + h.conLai, 0)
  if (!Number.isSafeInteger(soTien) || soTien <= 0) return { phanBo: [], loi: 'Nhập số tiền lớn hơn 0.' }
  if (soTien > tong) return { phanBo: [], loi: `Lớn hơn số còn nợ (${dinhDangTien(tong)} ₫). Thu dư thì ghi vào tháng sau.` }
  const phanBo: PhanBo[] = []
  let con = soTien
  for (const h of conNo) {
    if (con === 0) break
    const tra = Math.min(con, h.conLai)
    phanBo.push({ hoaDonId: h.hoaDonId, soTien: tra })
    con -= tra
  }
  return { phanBo, loi: null }
}

export type KetQuaGhiThu = { daGhi: PhanBo[]; loi: { hoaDonId: number; thongBao: string } | null }

/**
 * Ghi lần lượt từng phần (tháng cũ trước) bằng `ghiMot` (bên gọi bọc getLedger + recordPayment của financeApi).
 * Dừng ở lỗi đầu tiên: phần đã ghi giữ nguyên trên máy chủ, bên gọi báo "Đã ghi n/m tháng" để người dùng biết còn thiếu gì.
 */
export async function ghiThuLanLuot(phanBo: PhanBo[], ghiMot: (p: PhanBo) => Promise<unknown>): Promise<KetQuaGhiThu> {
  const daGhi: PhanBo[] = []
  for (const p of phanBo) {
    try {
      await ghiMot(p)
      daGhi.push(p)
    } catch (e) {
      return { daGhi, loi: { hoaDonId: p.hoaDonId, thongBao: e instanceof Error ? e.message : 'Không ghi được.' } }
    }
  }
  return { daGhi, loi: null }
}

/** Chỉ giữ chữ số; số Việt Nam bắt đầu 0, 9–11 số. Sai dạng → null (ẩn nút Gọi/Zalo, không tạo link chết). */
export function chuanSdt(sdt: string | null | undefined): string | null {
  const s = (sdt ?? '').replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0')
  return /^0\d{8,10}$/.test(s) ? s : null
}

/** "0999 100 001" (V3 §7). Sai dạng thì trả nguyên chuỗi vào. */
export function dinhDangSdt(sdt: string): string {
  const s = chuanSdt(sdt)
  return s && s.length === 10 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : sdt
}

/** Zalo cá nhân mở được cuộc trò chuyện theo số điện thoại (V3 câu 3: chưa cần Zalo OA). */
export const linkZalo = (sdt: string | null | undefined) => {
  const s = chuanSdt(sdt)
  return s ? `https://zalo.me/${s}` : null
}

export type NguoiNo = { hoTen: string; soPhong: string; tenToaNha: string; conLai: number; hoaDon: { ngayPhatHanh?: string | null; hanThanhToan: string }[] }

/** Tin nhắc soạn sẵn (V3 lớp nổi "nhac"). `hanTra` dạng "30/11/2026" do bên gọi đặt; người dùng vẫn sửa được trong ô. */
export function tinNhacNo(n: NguoiNo, hanTra: string): string {
  const ten = n.hoTen.trim().split(/\s+/).pop() ?? n.hoTen
  const thang = n.hoaDon.map(nhanThang)
  const [dau, cuoi] = [thang[0], thang[thang.length - 1]]
  // Cùng năm thì gọn "7–10/2026"; khác năm giữ đủ "12/2025–1/2026".
  const khoang = !dau ? '' : dau === cuoi ? ` tháng ${dau}` : ` tháng ${dau.split('/')[1] === cuoi.split('/')[1] ? dau.split('/')[0] : dau}–${cuoi}`
  return `Chào anh/chị ${ten}, phòng ${n.soPhong} ${n.tenToaNha} còn nợ ${dinhDangTien(n.conLai)} ₫ tiền nhà${khoang}. Anh/chị vui lòng thanh toán trước ngày ${hanTra}. Cảm ơn anh/chị.`
}
