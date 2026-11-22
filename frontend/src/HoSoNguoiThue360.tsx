import HoSoNguoiThue from './HoSoNguoiThue'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: x2 thay bằng hồ sơ 360° của người `thamSo.id`. HoSoNguoiThue chưa nhận prop mở sẵn một người nên hiện danh sách.
export default function HoSoNguoiThue360({ token }: TrangProps) {
  return <HoSoNguoiThue token={token} />
}
