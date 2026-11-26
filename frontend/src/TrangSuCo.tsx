import SuCoQuanLy from './SuCoQuanLy'
import type { TrangProps } from './dinhTuyen'

// Danh sách 3 nhóm + chi tiết 8 bước. Chủ và Quản lý cùng màn; Chủ không có nút ghi sự cố mới.
export default function TrangSuCo({ token, vaiTro, dieuHuong }: TrangProps) {
  return <SuCoQuanLy token={token} vaiTro={vaiTro} dieuHuong={dieuHuong} />
}
