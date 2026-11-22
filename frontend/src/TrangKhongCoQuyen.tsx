import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { TRANG_DAU, type VaiTro } from './dinhTuyen'
import { layMenuTheoVaiTro, timMucTheoDuongDan } from './roleNavigation'

const TEN_VAI_TRO: Record<VaiTro, string> = {
  QTHT: 'Quản trị hệ thống',
  CHU: 'Chủ sở hữu',
  QUAN_LY: 'Quản lý toà nhà',
  THO: 'Thợ sửa chữa',
  NGUOI_THUE: 'Người thuê',
}

type Props = { vaiTro: VaiTro; vaiTroSoHuu: VaiTro[]; duongDan: string; dieuHuong: (href: string) => void }

/** Gọn trong khung: nói rõ trang thuộc vai trò nào và đưa người dùng đi tiếp, không có nút Đăng xuất. */
export default function TrangKhongCoQuyen({ vaiTro, vaiTroSoHuu, duongDan, dieuHuong }: Props) {
  const soHuu = vaiTroSoHuu.map((v) => TEN_VAI_TRO[v]).join(' hoặc ')
  const trangDau = TRANG_DAU[vaiTro]
  const nhanTrangDau = layMenuTheoVaiTro(vaiTro).find((muc) => muc.duongDan === trangDau)?.nhan ?? 'trang đầu'
  const gan = timMucTheoDuongDan(vaiTro, duongDan)
  return (
    <section className="card" aria-labelledby="khong-co-quyen">
      <div className="state">
        <span className="ill"><Icon name="lock" /></span>
        <span className="tag tag-neutral">Không có quyền</span>
        <h1 id="khong-co-quyen" className="h2">{soHuu ? `Trang này dành cho ${soHuu}` : 'Trang này không dành cho tài khoản của bạn'}</h1>
        <p>
          {soHuu ? <>Đường dẫn <b>{duongDan}</b> thuộc vai trò {soHuu}. </> : <>Đường dẫn <b>{duongDan}</b> không có trong hệ thống. </>}
          Bạn đang đăng nhập với vai trò {TEN_VAI_TRO[vaiTro]}.
        </p>
        <div className="row">
          <Button variant="primary" onClick={() => dieuHuong(trangDau)}>Về {nhanTrangDau}</Button>
          {gan && gan.duongDan !== trangDau ? <Button variant="text" onClick={() => dieuHuong(gan.duongDan)}>Mở {gan.nhan}</Button> : null}
        </div>
      </div>
    </section>
  )
}
