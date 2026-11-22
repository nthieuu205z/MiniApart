import HopDongQuanLy from './HopDongQuanLy'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: dùng form hợp đồng cũ cho tới khi lô hợp đồng dựng bước tạo mới.
export default function TaoHopDong({ token, mobile }: TrangProps) {
  return <HopDongQuanLy token={token} mobile={mobile} />
}
