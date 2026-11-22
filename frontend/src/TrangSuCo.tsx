import { LichSuSuaChua } from './LichSuSuaChua'
import QuanLySuaChua from './QuanLySuaChua'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: giữ nguyên hai khối cũ (danh sách xử lý + lịch sử); lô sự cố thay ruột.
export default function TrangSuCo({ token, mobile }: TrangProps) {
  return <><QuanLySuaChua token={token} /><LichSuSuaChua token={token} mobile={mobile} /></>
}
