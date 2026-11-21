// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DataTable, type DataTableColumn } from './DataTable'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

type Row = { id: number; phong: string; ten: string; gia: number; ok: boolean }
const rows: Row[] = [
  { id: 1, phong: '101', ten: 'Trần Quang Huy', gia: 3200000, ok: true },
  { id: 2, phong: '402', ten: 'Đinh Nhật Quang', gia: 4000000, ok: false },
  { id: 3, phong: '303', ten: 'Ngô Hải Nam', gia: 2800000, ok: true },
]
const columns: DataTableColumn<Row>[] = [
  { key: 'phong', label: 'Phòng', render: (r) => r.phong },
  { key: 'ten', label: 'Người thuê', render: (r) => r.ten },
  { key: 'gia', label: 'Giá thuê', align: 'num', sortable: true, sortValue: (r) => r.gia, render: (r) => String(r.gia) },
]

let container: HTMLDivElement
let root: Root

const click = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
const sortBtn = () => [...container.querySelectorAll('button.th-sort')].find((b) => b.textContent === 'Giá thuê')!
const giaTh = () => sortBtn().closest('th')!

describe('DataTable', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root.render(<DataTable rows={rows} columns={columns} getRowId={(r) => r.id} timTheo={(r) => r.ten} searchLabel="Tìm người thuê" noun="hợp đồng"
      chips={[{ key: 'ok', label: 'Hiệu lực', match: (r) => r.ok }]} bulkActions={[{ label: 'In PDF', onClick: () => {} }]} />))
  })
  afterEach(() => { act(() => root.unmount()); container.remove() })

  it('render đủ cột và dòng', () => {
    expect([...container.querySelectorAll('th')].map((h) => h.textContent)).toEqual(['', 'Phòng', 'Người thuê', 'Giá thuê'])
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(container.querySelector('.pager')?.textContent).toContain('1–3 trong 3 hợp đồng')
  })

  it('chip hiện số đếm', () => {
    expect(container.querySelector('button.chip')?.textContent).toBe('Hiệu lực2')
  })

  it('bấm header đổi aria-sort', () => {
    expect(giaTh().getAttribute('aria-sort')).toBe('none')
    click(sortBtn())
    expect(giaTh().getAttribute('aria-sort')).toBe('ascending')
    click(sortBtn())
    expect(giaTh().getAttribute('aria-sort')).toBe('descending')
  })

  it('chọn hàng hiện bulkbar', () => {
    expect(container.querySelector('.bulkbar')).toBeNull()
    click(container.querySelector('input[aria-label="Chọn 1"]')!)
    expect(container.querySelector('.bulkbar')?.textContent).toContain('Đã chọn 1 hợp đồng')
  })
})
