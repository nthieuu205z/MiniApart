import { useEffect, useState } from 'react'
import './App.css'

/** Shape returned by GET /api/health. */
type TinhTrang = {
  trangThai: string
  phienBanCoSoDuLieu: string
  soMigrationDaChay: number
  thoiDiem: string
}

type KetQua =
  | { loai: 'dang-tai' }
  | { loai: 'thanh-cong'; duLieu: TinhTrang }
  | { loai: 'that-bai'; loi: string }

export default function App() {
  const [ketQua, setKetQua] = useState<KetQua>({ loai: 'dang-tai' })

  useEffect(() => {
    let huy = false

    fetch('/api/health')
      .then((phanHoi) => {
        if (!phanHoi.ok) throw new Error(`Máy chủ trả về ${phanHoi.status}`)
        return phanHoi.json() as Promise<TinhTrang>
      })
      .then((duLieu) => {
        if (!huy) setKetQua({ loai: 'thanh-cong', duLieu })
      })
      .catch((loi: unknown) => {
        if (!huy) {
          setKetQua({ loai: 'that-bai', loi: loi instanceof Error ? loi.message : String(loi) })
        }
      })

    return () => {
      huy = true
    }
  }, [])

  return (
    <main className="khung">
      <header>
        <h1>MiniApart</h1>
        <p className="phu-de">Hệ thống Quản lý và Vận hành Chung cư mini</p>
      </header>

      <section className="the">
        <h2>Kết nối ba tầng</h2>
        {ketQua.loai === 'dang-tai' && <p className="cho">Đang hỏi máy chủ…</p>}

        {ketQua.loai === 'that-bai' && (
          <>
            <p className="hong">Không gọi được máy chủ</p>
            <p className="chi-tiet">{ketQua.loi}</p>
          </>
        )}

        {ketQua.loai === 'thanh-cong' && (
          <>
            <p className="khoe">Giao diện → Máy chủ → Cơ sở dữ liệu</p>
            <dl>
              <dt>Trạng thái</dt>
              <dd>{ketQua.duLieu.trangThai}</dd>
              <dt>Cơ sở dữ liệu</dt>
              <dd>{ketQua.duLieu.phienBanCoSoDuLieu}</dd>
              <dt>Migration đã chạy</dt>
              <dd>{ketQua.duLieu.soMigrationDaChay}</dd>
            </dl>
          </>
        )}
      </section>

      <footer>
        <p>Vertical Slice 0 — Nền móng · PRJ1-CCM</p>
      </footer>
    </main>
  )
}
