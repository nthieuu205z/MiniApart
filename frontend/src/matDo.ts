// Ba mật độ V3 (03 §2, §8). Một chỗ quyết định; App đặt kết quả vào data-density của .ma-app-shell.
export type MatDo = 'lam-viec' | 'chu-m' | 'thoang'

/** Người thuê, Thợ: thoáng ở mọi khung. Màn hẹp (< 768, như kiemTraManHinhHep của App): vừa. Còn lại: làm việc. */
export function matDoTheoVaiTro(vaiTro: string, manHinhHep: boolean): MatDo {
  if (vaiTro === 'THO' || vaiTro === 'NGUOI_THUE') return 'thoang'
  return manHinhHep ? 'chu-m' : 'lam-viec'
}
