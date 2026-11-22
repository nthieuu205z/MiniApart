import SuCoQuanLy from './SuCoQuanLy'
import type { TrangProps } from './dinhTuyen'

// Một danh sách + ngăn chi tiết; LichSuSuaChua không còn nằm dưới trang (file + test giữ nguyên).
export default function TrangSuCo({ token, dieuHuong }: TrangProps) {
  return <SuCoQuanLy token={token} dieuHuong={dieuHuong} />
}
