import { BlockedNotice } from './design/building/BlockedNotice'
import { Button } from './design/core/Button'
import type { VaiTro } from './dinhTuyen'

export default function TrangKhongCoQuyen({ vaiTroSoHuu, dieuHuong }: { vaiTroSoHuu: VaiTro[]; dieuHuong: (href: string) => void }) {
  void vaiTroSoHuu
  return (
    <section aria-labelledby="khong-co-quyen">
      <h1 id="khong-co-quyen" className="h1">Không có quyền</h1>
      <BlockedNotice title="Không có quyền" reason="Đường dẫn không thuộc vai trò hiện tại. Hãy chọn một mục trong menu để tiếp tục." />
      <Button variant="secondary" onClick={() => dieuHuong('/')}>Về trang chủ</Button>
    </section>
  )
}
