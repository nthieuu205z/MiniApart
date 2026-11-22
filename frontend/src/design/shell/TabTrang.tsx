import type * as React from 'react'
import { NHOM_TAB, nhomTabCua, tabDangChon } from '../../dinhTuyen'

/** Tab của các nhóm trang gộp (Thu tiền, Người thuê, Báo cáo…). Là điều hướng trang nên dùng <a href>, không dùng role="tab". */
export function TabTrang({ vaiTro, duongDan, search, className }: { vaiTro: string; duongDan: string; search: string; className?: string }): React.ReactElement | null {
  const nhom = nhomTabCua(vaiTro, duongDan)
  if (!nhom) return null
  const dangChon = tabDangChon(nhom, duongDan, search)
  return (
    <nav className={['tabs', 'tabs-trang', className].filter(Boolean).join(' ')} aria-label="Các mục của trang">
      {NHOM_TAB[nhom].tab.map((t) => (
        <a key={t.href} className="tab" href={t.href} aria-current={t.href === dangChon ? 'page' : undefined}>{t.nhan}</a>
      ))}
    </nav>
  )
}
