// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TrangKhongCoQuyen from './TrangKhongCoQuyen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
afterEach(() => { document.body.innerHTML = '' })

describe('TrangKhongCoQuyen', () => {
  it('h1 nêu vai trò sở hữu; nút "Về Hôm nay" khi là Chủ nhà', async () => {
    const dieuHuong = vi.fn()
    const el = document.createElement('div')
    document.body.appendChild(el)
    await act(async () => createRoot(el).render(<TrangKhongCoQuyen vaiTro="CHU" vaiTroSoHuu={['QTHT']} duongDan="/tai-khoan" dieuHuong={dieuHuong} />))
    expect(el.querySelectorAll('h1')).toHaveLength(1)
    expect(el.querySelector('h1')?.textContent).toBe('Trang này dành cho Quản trị hệ thống')
    expect(el.textContent).toContain('Tài khoản Chủ nhà không mở được trang này.')
    expect(el.textContent).toContain('nhắn Quản trị hệ thống')
    const nut = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Về Hôm nay')!
    expect(nut.className).toContain('btn-primary')
    await act(async () => nut.click())
    expect(dieuHuong).toHaveBeenCalledWith('/hom-nay')
  })
})
