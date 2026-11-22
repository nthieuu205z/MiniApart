import GhiChiSo from './GhiChiSo'
import type { TrangProps } from './dinhTuyen'

// Vỏ mỏng: giữ nút chốt kỳ cũ cho tới x5 (x5 truyền anNutChot khi đã có bước chốt riêng).
export default function ChuKyThang({ token, vaiTro, mobile }: TrangProps) {
  return <GhiChiSo token={token} mobile={mobile} vaiTro={vaiTro} />
}
