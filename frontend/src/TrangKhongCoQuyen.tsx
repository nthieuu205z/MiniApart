import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { TRANG_DAU, type VaiTro } from './dinhTuyen'
import { layMenuTheoVaiTro, timMucTheoDuongDan } from './roleNavigation'

const TEN_VAI_TRO: Record<VaiTro, string> = {
  QTHT: 'Quản trị hệ thống',
  CHU: 'Chủ nhà',
  QUAN_LY: 'Quản lý toà',
  THO: 'Thợ',
  NGUOI_THUE: 'Người thuê',
}

const GOI_Y: Record<VaiTro, string> = {
  QTHT: 'Cần thêm hay khoá tài khoản, nhắn Quản trị hệ thống.',
  CHU: 'Việc này do Chủ nhà làm. Nhờ Chủ nhà mở giúp.',
  QUAN_LY: 'Việc này do Quản lý toà làm. Nhờ Quản lý toà mở giúp.',
  THO: 'Thợ nhận và báo xong việc ở màn Việc.',
  NGUOI_THUE: 'Người thuê xem tiền nhà và báo hỏng ở tài khoản của mình.',
}

type Props = { vaiTro: VaiTro; vaiTroSoHuu: VaiTro[]; duongDan: string; dieuHuong: (href: string) => void }

/** Gọn trong khung: nói rõ trang thuộc vai trò nào và đưa người dùng đi tiếp, không có nút Đăng xuất. */
export default function TrangKhongCoQuyen({ vaiTro, vaiTroSoHuu, duongDan, dieuHuong }: Props) {
  const soHuu = vaiTroSoHuu.map((v) => TEN_VAI_TRO[v]).join(' hoặc ')
  const trangDau = TRANG_DAU[vaiTro]
  const nhanTrangDau = layMenuTheoVaiTro(vaiTro).find((muc) => muc.duongDan === trangDau)?.nhan ?? 'trang đầu'
  const gan = timMucTheoDuongDan(vaiTro, duongDan)
  return (
    <section aria-labelledby="khong-co-quyen" style={{ display: 'grid', justifyItems: 'center', gap: 'var(--ma-space-3)', textAlign: 'center', padding: 'var(--ma-space-8) var(--ma-space-4)' }}>
      <span style={{ color: 'var(--ma-text-secondary)' }} aria-hidden="true"><Icon name="lock" /></span>
      <h1 id="khong-co-quyen" style={{ margin: 0 }}>{soHuu ? `Trang này dành cho ${soHuu}` : 'Trang này không dành cho tài khoản của bạn'}</h1>
      <p style={{ margin: 0, maxWidth: 480, color: 'var(--ma-text-secondary)' }}>
        {soHuu ? `Tài khoản ${TEN_VAI_TRO[vaiTro]} không mở được trang này. ${GOI_Y[vaiTroSoHuu[0]]}` : `Đường dẫn ${duongDan} không có trong hệ thống.`}
      </p>
      <div style={{ display: 'flex', gap: 'var(--ma-space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => dieuHuong(trangDau)}>Về {nhanTrangDau}</Button>
        {gan && gan.duongDan !== trangDau ? <Button variant="text" onClick={() => dieuHuong(gan.duongDan)}>Mở {gan.nhan}</Button> : null}
      </div>
    </section>
  )
}
