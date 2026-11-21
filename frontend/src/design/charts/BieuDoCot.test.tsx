// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { BieuDoCot, rutGonTien } from './BieuDoCot'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

describe('BieuDoCot', () => {
  it('rút gọn tiền', () => {
    expect(rutGonTien(1_500_000)).toBe('1,5 tr')
    expect(rutGonTien(500_000)).toBe('500k')
  })

  it('vẽ mỗi nhãn một nhóm có data-*, null không vẽ cột nhưng bảng ẩn ghi "Chưa ghi nhận", 0 vẫn có cột', async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    await act(async () => root.render(
      <BieuDoCot
        tieuDe="Thử"
        nhan={['08/2040', '09/2040']}
        chuoi={[{ ten: 'A', mau: 'var(--ma-chart-1)', giaTri: [1_000_000, null] }, { ten: 'B', mau: 'var(--ma-chart-2)', giaTri: [0, 0] }]}
        thuocTinhNhom={(i) => ({ 'data-nhom': String(i) })}
      />,
    ))
    expect(el.querySelectorAll('[data-nhom]')).toHaveLength(2)
    expect(el.querySelectorAll('svg rect')).toHaveLength(3) // A tháng 1, B hai tháng; A tháng 2 là null
    expect(el.querySelector('.sr-only')?.textContent).toContain('Chưa ghi nhận')
    await act(async () => root.unmount())
    el.remove()
  })
})
