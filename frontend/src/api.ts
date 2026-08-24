/**
 * Mọi lời gọi tới máy chủ đi qua đây.
 *
 * Đường dẫn luôn là tương đối (`/api/...`). Lúc phát triển thì Vite chuyển tiếp,
 * lúc triển khai thật thì Nginx chuyển tiếp — không chỗ nào ghi cứng địa chỉ máy chủ.
 */

const KHOA_TOKEN = 'miniapart.token'

/**
 * Token để trong localStorage. Đánh đổi có thật: nếu trang bị chèn mã lạ (XSS)
 * thì mã đó đọc được token. Đổi lại, tải lại trang không bị đá ra đăng nhập.
 *
 * Chấp nhận được vì token chỉ sống 30 phút và thu hồi được ngay lập tức
 * (xem ADR-0001). Slice 10 xem lại chỗ này khi làm phần an toàn.
 */
export const token = {
  doc: () => localStorage.getItem(KHOA_TOKEN),
  ghi: (giaTri: string) => localStorage.setItem(KHOA_TOKEN, giaTri),
  xoa: () => localStorage.removeItem(KHOA_TOKEN),
}

export type ThongTinNguoiDung = {
  id: number
  hoTen: string
  soDienThoai: string
  vaiTro: string
  tenVaiTro: string
}

export type PhanHoiDangNhap = {
  token: string
  thoiHanGiay: number
  nguoiDung: ThongTinNguoiDung
}

/** Máy chủ từ chối, kèm thông báo đọc được cho người dùng. */
export class LoiMayChu extends Error {
  readonly maTrangThai: number

  constructor(maTrangThai: number, thongBao: string) {
    super(thongBao)
    this.maTrangThai = maTrangThai
  }
}

async function goi<T>(duongDan: string, tuyChon: RequestInit = {}): Promise<T> {
  const tokenHienTai = token.doc()

  const phanHoi = await fetch(duongDan, {
    ...tuyChon,
    headers: {
      'Content-Type': 'application/json',
      ...(tokenHienTai ? { Authorization: `Bearer ${tokenHienTai}` } : {}),
      ...tuyChon.headers,
    },
  })

  if (!phanHoi.ok) {
    // Token hết hạn hoặc bị thu hồi: dọn sạch để lần sau vào thẳng màn đăng nhập,
    // không để người dùng bấm quanh với một token đã chết.
    if (phanHoi.status === 401) token.xoa()

    const than = await phanHoi.json().catch(() => null)
    throw new LoiMayChu(
      phanHoi.status,
      than?.thongBao ?? `Máy chủ trả về ${phanHoi.status}`,
    )
  }

  return phanHoi.json() as Promise<T>
}

export const api = {
  dangNhap: (soDienThoai: string, matKhau: string) =>
    goi<PhanHoiDangNhap>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ soDienThoai, matKhau }),
    }),

  toiLaAi: () => goi<ThongTinNguoiDung>('/api/auth/me'),
}
