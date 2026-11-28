// Đường dẫn công khai. Chi tiết phòng là /phong-trong/:id vì /phong/:id đã là hồ sơ phòng của Chủ/Quản lý trong app (dinhTuyen.ts).
export type TuyenCongKhai = { loai: 'trang-chu' } | { loai: 'tim-phong' } | { loai: 'phong'; id: number } | { loai: 'dang-nhap' }

export function layTuyenCongKhai(duongDan: string): TuyenCongKhai | null {
  const d = duongDan.length > 1 && duongDan.endsWith('/') ? duongDan.slice(0, -1) : duongDan || '/'
  if (d === '/') return { loai: 'trang-chu' }
  if (d === '/tim-phong' || d === '/kham-pha') return { loai: 'tim-phong' }
  if (d === '/dang-nhap') return { loai: 'dang-nhap' }
  const m = d.match(/^\/phong-trong\/(\d+)$/)
  return m ? { loai: 'phong', id: Number(m[1]) } : null
}
