import { ChuDashboard } from './ChuDashboard'
import { QuanLyDashboard } from './QuanLyDashboard'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: lô x1 thay ruột bằng màn "Hôm nay" mới, chữ ký giữ nguyên.
export default function HomNay({ token, vaiTro, mobile }: TrangProps) {
  return vaiTro === 'CHU' ? <ChuDashboard token={token} mobile={mobile} /> : <QuanLyDashboard token={token} mobile={mobile} />
}
