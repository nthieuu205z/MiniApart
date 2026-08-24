import { useEffect, useState } from 'react'
import './App.css'
import DangNhap from './DangNhap'
import TrangChu from './TrangChu'
import { api, token, type ThongTinNguoiDung } from './api'

type TrangThai =
  | { loai: 'dang-kiem-tra' }
  | { loai: 'chua-dang-nhap' }
  | { loai: 'da-dang-nhap'; nguoiDung: ThongTinNguoiDung }

export default function App() {
  const [trangThai, setTrangThai] = useState<TrangThai>({ loai: 'dang-kiem-tra' })

  // Tải lại trang thì hỏi lại máy chủ xem token còn dùng được không. Không tự suy
  // ra từ việc localStorage có token: token có thể đã hết hạn hoặc đã bị thu hồi,
  // và chỉ máy chủ mới biết điều đó (ADR-0001).
  useEffect(() => {
    if (!token.doc()) {
      setTrangThai({ loai: 'chua-dang-nhap' })
      return
    }

    let huy = false
    api
      .toiLaAi()
      .then((nguoiDung) => {
        if (!huy) setTrangThai({ loai: 'da-dang-nhap', nguoiDung })
      })
      .catch(() => {
        if (!huy) {
          token.xoa()
          setTrangThai({ loai: 'chua-dang-nhap' })
        }
      })

    return () => {
      huy = true
    }
  }, [])

  if (trangThai.loai === 'dang-kiem-tra') {
    return (
      <main className="khung">
        <p className="cho">Đang kiểm tra phiên đăng nhập…</p>
      </main>
    )
  }

  if (trangThai.loai === 'chua-dang-nhap') {
    return (
      <DangNhap
        onDangNhapXong={(nguoiDung) => setTrangThai({ loai: 'da-dang-nhap', nguoiDung })}
      />
    )
  }

  return (
    <TrangChu
      nguoiDung={trangThai.nguoiDung}
      onDangXuat={() => {
        token.xoa()
        setTrangThai({ loai: 'chua-dang-nhap' })
      }}
    />
  )
}
