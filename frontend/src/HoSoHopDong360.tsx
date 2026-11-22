import { EmptyState } from './design/feedback/EmptyState'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: chưa có link nào trỏ tới trang này cho tới khi lô hồ sơ làm xong.
export default function HoSoHopDong360({ dieuHuong }: TrangProps) {
  return <EmptyState kind="first" title="Hồ sơ đang làm" body="Hồ sơ hợp đồng sẽ mở ở đây. Trong lúc chờ, bạn xem được từ danh sách." actionLabel="Danh sách hợp đồng" onAction={() => dieuHuong('/hop-dong')} />
}
