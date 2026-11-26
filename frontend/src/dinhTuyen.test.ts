import { describe, expect, it } from 'vitest'
import { NHOM_TAB, TRANG_DAU, nhomTabCua, tabDangChon, timTuyen, type VaiTro } from './dinhTuyen'

// 42 mục menu cũ (roleNavigation.ts trước UX v2) — mỗi mục phải còn mở được: thành màn hoặc tự chuyển.
const MENU_CU: Record<VaiTro, string[]> = {
  QTHT: ['/tai-khoan', '/toa-nha', '/nhat-ky-thao-tac'],
  CHU: ['/tong-quan', '/toa-nha', '/nguoi-thue', '/hop-dong', '/dich-vu', '/ghi-chi-so', '/thu-tien', '/cu-tru', '/lich-hen', '/hoa-don', '/cong-no', '/bao-cao', '/bao-cao/tieu-thu', '/bao-cao/chi-phi-bao-tri', '/su-co', '/an-toan', '/nhat-ky-thao-tac'],
  QUAN_LY: ['/nhac-viec', '/ghi-chi-so', '/hoa-don', '/thu-tien', '/phong', '/hop-dong', '/nguoi-thue', '/dich-vu', '/cu-tru', '/an-toan', '/lich-hen', '/su-co', '/thong-bao'],
  THO: ['/tho/tong-quan', '/viec-cua-toi', '/tho/chi-phi', '/thong-bao'],
  NGUOI_THUE: ['/hoa-don-cua-toi', '/lich-su', '/tieu-thu', '/hop-dong', '/bao-hong'],
}

describe('dinhTuyen — không mất mục nào', () => {
  it('đủ 42 mục menu cũ (+2 màn công khai = 44)', () => {
    expect(Object.values(MENU_CU).flat()).toHaveLength(42)
  })

  for (const [vaiTro, ds] of Object.entries(MENU_CU) as Array<[VaiTro, string[]]>) {
    for (const p of ds) {
      it(`${vaiTro} ${p} còn mở được`, () => {
        const r = timTuyen(vaiTro, p)
        expect(r.loai).not.toBe('khong-co-quyen')
        if (r.loai === 'chuyen') {
          // Đích chuyển phải là màn thật của đúng vai trò đó (không chuyển vòng).
          const dich = new URL(r.toi, 'http://x')
          expect(timTuyen(vaiTro, dich.pathname, dich.search).loai).toBe('trang')
        }
      })
    }
  }

  it('đường dẫn gộp hẳn thì tự chuyển và giữ query', () => {
    expect(timTuyen('QUAN_LY', '/nhac-viec', '?toaNhaId=3')).toEqual({ loai: 'chuyen', toi: '/hom-nay?toaNhaId=3' })
    expect(timTuyen('CHU', '/cong-no', 'toaNhaId=2')).toEqual({ loai: 'chuyen', toi: '/thu-tien?toaNhaId=2' })
    expect(timTuyen('QUAN_LY', '/ghi-chi-so/', '?toaNhaId=3&kyId=5')).toEqual({ loai: 'chuyen', toi: '/chu-ky?toaNhaId=3&kyId=5' })
    expect(timTuyen('THO', '/tho/tong-quan')).toEqual({ loai: 'chuyen', toi: '/viec-cua-toi' })
  })

  it('/hoa-don giữ là màn thật (chi tiết hoá đơn qua ?hoaDonId= vẫn chạy như cũ)', () => {
    expect(timTuyen('CHU', '/hoa-don', '?hoaDonId=9')).toEqual({ loai: 'trang', khoa: 'hoa-don', thamSo: {} })
    expect(timTuyen('QUAN_LY', '/hoa-don', '?toaNhaId=3&kyId=4&hoaDonId=9').loai).toBe('trang')
  })

  it('trang gốc và trang công khai khi đã đăng nhập → trang đầu của vai trò', () => {
    for (const v of Object.keys(TRANG_DAU) as VaiTro[]) expect(timTuyen(v, '/')).toEqual({ loai: 'chuyen', toi: TRANG_DAU[v] })
    expect(timTuyen('CHU', '/dang-nhap')).toEqual({ loai: 'chuyen', toi: '/hom-nay' })
    expect(timTuyen('NGUOI_THUE', '/', '?hoaDonId=31')).toEqual({ loai: 'chuyen', toi: '/hoa-don-cua-toi?hoaDonId=31' })
  })
})

describe('dinhTuyen — không mở thêm quyền', () => {
  it('Chủ không có danh sách /phong nhưng mở được hồ sơ phòng', () => {
    expect(timTuyen('CHU', '/phong')).toEqual({ loai: 'khong-co-quyen', vaiTroSoHuu: ['QUAN_LY'] })
    expect(timTuyen('CHU', '/phong/1')).toEqual({ loai: 'trang', khoa: 'ho-so-phong', thamSo: { id: '1' } })
  })
  it('Quản lý không có báo cáo, công nợ, tài khoản', () => {
    for (const p of ['/bao-cao', '/tong-quan', '/cong-no', '/tai-khoan', '/nhat-ky-thao-tac']) {
      expect(timTuyen('QUAN_LY', p).loai, p).toBe('khong-co-quyen')
    }
  })
  it('khách thuê không vào màn quản lý; /hop-dong của khách là hợp đồng của tôi', () => {
    expect(timTuyen('NGUOI_THUE', '/thu-tien').loai).toBe('khong-co-quyen')
    expect(timTuyen('NGUOI_THUE', '/hop-dong/1').loai).toBe('khong-co-quyen')
    expect(timTuyen('NGUOI_THUE', '/hop-dong')).toMatchObject({ loai: 'trang', khoa: 'hop-dong-cua-toi' })
  })
  it('QTHT chỉ 3 màn của mình (+ /hoa-don như app cũ)', () => {
    expect(timTuyen('QTHT', '/hom-nay').loai).toBe('khong-co-quyen')
    expect(timTuyen('QTHT', '/toa-nha/3')).toMatchObject({ loai: 'trang', khoa: 'ho-so-toa' })
  })
  it('thợ đi lạc thì về Việc', () => {
    expect(timTuyen('THO', '/thu-tien')).toEqual({ loai: 'chuyen', toi: '/viec-cua-toi' })
  })
  it('vai trò lạ không vào đâu cả', () => {
    expect(timTuyen('KHACH', '/hom-nay')).toEqual({ loai: 'khong-co-quyen', vaiTroSoHuu: [] })
  })
  it('mẫu cụ thể thắng mẫu tham số; tham số được giải mã', () => {
    expect(timTuyen('QUAN_LY', '/hop-dong/moi')).toMatchObject({ khoa: 'tao-hop-dong' })
    expect(timTuyen('QUAN_LY', '/hop-dong/12')).toEqual({ loai: 'trang', khoa: 'ho-so-hop-dong', thamSo: { id: '12' } })
    expect(timTuyen('CHU', '/nguoi-thue/71/')).toEqual({ loai: 'trang', khoa: 'ho-so-nguoi-thue', thamSo: { id: '71' } })
    expect(timTuyen('CHU', '/nguoi-thue/a%20b')).toMatchObject({ thamSo: { id: 'a b' } })
    expect(timTuyen('CHU', '/nguoi-thue/1/2').loai).toBe('khong-co-quyen')
  })
  it('trang không có quyền nói rõ vai trò sở hữu', () => {
    expect(timTuyen('CHU', '/viec-cua-toi')).toEqual({ loai: 'khong-co-quyen', vaiTroSoHuu: ['THO'] })
    expect(timTuyen('CHU', '/nhac-viec')).toEqual({ loai: 'khong-co-quyen', vaiTroSoHuu: ['QUAN_LY'] })
  })
})

describe('nhóm tab', () => {
  it('mọi href trong nhóm tab là màn thật của mọi vai trò dùng nhóm đó', () => {
    for (const g of Object.values(NHOM_TAB)) for (const v of g.vaiTro) for (const t of g.tab) {
      const u = new URL(t.href, 'http://x')
      expect(timTuyen(v, u.pathname, u.search).loai, `${v} ${t.href}`).toBe('trang')
    }
  })
  it('tab đang chọn theo đường dẫn + ?tab=', () => {
    expect(tabDangChon('bao-cao', '/bao-cao/tieu-thu', '')).toBe('/bao-cao/tieu-thu')
    expect(tabDangChon('bao-cao', '/bao-cao', '?tab=la')).toBe('/bao-cao')
    expect(tabDangChon('khong-co', '/thu-tien')).toBeNull()
  })
  it('nhóm tab theo vai trò', () => {
    expect(nhomTabCua('CHU', '/nhat-ky-thao-tac')).toBe('bao-cao')
    expect(nhomTabCua('QTHT', '/nhat-ky-thao-tac')).toBeNull()
    expect(nhomTabCua('NGUOI_THUE', '/hop-dong')).toBe('phong-cua-toi')
    expect(nhomTabCua('QUAN_LY', '/hop-dong')).toBeNull()
    expect(nhomTabCua('QUAN_LY', '/cu-tru')).toBe('nguoi-thue')
    expect(nhomTabCua('CHU', '/thu-tien')).toBeNull() // màn Tiền tự có tab trong thẻ
  })
})
