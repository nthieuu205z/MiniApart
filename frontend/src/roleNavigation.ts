export type VaiTroDieuHuong = 'QTHT' | 'CHU' | 'QUAN_LY' | 'THO' | 'NGUOI_THUE'

export type MucDieuHuong = {
  duongDan: string
  nhan: string
}

type TrangVaiTro =
  | {
      loai: 'trang-chu'
      tieuDe: 'Trang chủ'
      thongDiep: string
    }
  | {
      loai: 'menu'
      tieuDe: string
      thongDiep: string
    }
  | {
      loai: 'khong-co-quyen'
      tieuDe: 'Không có quyền'
      thongDiep: string
    }

const DIEU_HUONG_THEO_VAI_TRO: Record<VaiTroDieuHuong, MucDieuHuong[]> = {
  QTHT: [
    { duongDan: '/tai-khoan', nhan: 'Tài khoản' },
    { duongDan: '/toa-nha', nhan: 'Toà nhà' },
    { duongDan: '/nhat-ky-thao-tac', nhan: 'Nhật ký thao tác' },
  ],
  CHU: [
    { duongDan: '/tong-quan', nhan: 'Tổng quan' },
    { duongDan: '/toa-nha', nhan: 'Toà nhà' },
    { duongDan: '/hoa-don', nhan: 'Hoá đơn' },
    { duongDan: '/cong-no', nhan: 'Công nợ' },
    { duongDan: '/bao-cao', nhan: 'Báo cáo' },
    { duongDan: '/su-co', nhan: 'Sự cố' },
    { duongDan: '/an-toan', nhan: 'An toàn' },
  ],
  QUAN_LY: [
    { duongDan: '/nhac-viec', nhan: 'Nhắc việc' },
    { duongDan: '/ghi-chi-so', nhan: 'Ghi chỉ số' },
    { duongDan: '/hoa-don', nhan: 'Hoá đơn' },
    { duongDan: '/thu-tien', nhan: 'Thu tiền' },
    { duongDan: '/phong', nhan: 'Phòng' },
    { duongDan: '/hop-dong', nhan: 'Hợp đồng' },
    { duongDan: '/su-co', nhan: 'Sự cố' },
    { duongDan: '/thong-bao', nhan: 'Thông báo' },
  ],
  THO: [{ duongDan: '/viec-cua-toi', nhan: 'Việc của tôi' }],
  NGUOI_THUE: [
    { duongDan: '/hoa-don-cua-toi', nhan: 'Hoá đơn của tôi' },
    { duongDan: '/lich-su', nhan: 'Lịch sử' },
    { duongDan: '/hop-dong', nhan: 'Hợp đồng' },
    { duongDan: '/bao-hong', nhan: 'Báo hỏng' },
  ],
}

export function layMenuTheoVaiTro(vaiTro: string): MucDieuHuong[] {
  if (!(vaiTro in DIEU_HUONG_THEO_VAI_TRO)) {
    return []
  }

  return DIEU_HUONG_THEO_VAI_TRO[vaiTro as VaiTroDieuHuong]
}

export function xacDinhTrangTheoVaiTro(vaiTro: string, tenVaiTro: string, duongDanHienTai: string): TrangVaiTro {
  const menu = layMenuTheoVaiTro(vaiTro)
  const duongDan = chuanHoaDuongDan(duongDanHienTai)

  if (duongDan === '/') {
    return {
      loai: 'trang-chu',
      tieuDe: 'Trang chủ',
      thongDiep: `Bạn đang ở khu điều hướng dành cho ${tenVaiTro}. Chọn một mục trong menu để mở đúng công việc của mình.`,
    }
  }

  const mucPhuHop = menu.find((muc) => muc.duongDan === duongDan)
  if (mucPhuHop) {
    return {
      loai: 'menu',
      tieuDe: mucPhuHop.nhan,
      thongDiep: `Màn hình ${mucPhuHop.nhan.toLowerCase()} sẽ tiếp tục được hoàn thiện ở các ticket sau. Menu hiện tại đang đưa bạn vào đúng khu vực công việc.`,
    }
  }

  return {
    loai: 'khong-co-quyen',
    tieuDe: 'Không có quyền',
    thongDiep: 'Đường dẫn không thuộc vai trò hiện tại. Hãy chọn một mục trong menu để tiếp tục.',
  }
}

function chuanHoaDuongDan(duongDan: string) {
  if (!duongDan || duongDan === '/') {
    return '/'
  }

  return duongDan.endsWith('/') ? duongDan.slice(0, -1) : duongDan
}
