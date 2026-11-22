import { useEffect } from 'react'
import { ngoaiProvider, useToaDangChon } from './toaDangChon'

/** Màn báo cáo: bộ lọc toà đi theo toà của khung. Ngoài khung (test màn riêng lẻ) thì không làm gì, bộ lọc vẫn đọc từ URL. */
export function useToaKhung(toaNhaId: number | null, doiToa: (id: number | null) => void) {
  const chung = useToaDangChon()
  // Chờ khung tải xong danh sách toà, kẻo ghi đè toà trong URL bằng giá trị mặc định.
  const san = !ngoaiProvider(chung) && chung.danhSach.length > 0
  useEffect(() => {
    if (san && chung.toaNhaId !== toaNhaId) doiToa(chung.toaNhaId)
    // doiToa luôn là setter bộ lọc mới mỗi lần render: không đưa vào deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [san, chung.toaNhaId, toaNhaId])
}
