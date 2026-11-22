import { EmptyState } from './design/feedback/EmptyState'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: chưa có link nào trỏ tới trang này cho tới khi lô hồ sơ làm xong.
export default function HoSoPhong360({ dieuHuong }: TrangProps) {
  return <EmptyState kind="first" title="Hồ sơ đang làm" body="Hồ sơ phòng sẽ mở ở đây. Trong lúc chờ, bạn xem được từ danh sách." actionLabel="Danh sách phòng" onAction={() => dieuHuong('/phong')} />
}
