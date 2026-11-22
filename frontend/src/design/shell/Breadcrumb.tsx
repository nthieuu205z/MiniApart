import type * as React from 'react'
import { Icon } from '../core/Icon'

/** Một tầng: chữ thường (chỉ chữ) hoặc có `href` (bấm được). Tầng cuối là trang hiện tại. */
export type MucBreadcrumb = string | { nhan: string; href?: string }

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: MucBreadcrumb[]
}

const nhanCua = (m: MucBreadcrumb) => (typeof m === 'string' ? m : m.nhan)

/** Đường dẫn. Chỉ hiện khi từ 2 tầng trở lên (ví dụ Toà & phòng › An Nhiên Residence): trang một tầng đã có tiêu đề. */
export function Breadcrumb({ items, className, ...rest }: BreadcrumbProps): React.ReactElement | null {
  if (items.length < 2) return null
  return (
    <nav className={['crumb', className].filter(Boolean).join(' ')} aria-label="Vị trí" {...rest}>
      {items.map((it, i) => {
        const cuoi = i === items.length - 1
        const href = typeof it === 'string' ? undefined : it.href
        return (
          <span key={`${nhanCua(it)}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 ? <Icon name="chevron-right" size="sm" /> : null}
            {cuoi ? <span aria-current="page">{nhanCua(it)}</span> : href ? <a href={href}>{nhanCua(it)}</a> : <span>{nhanCua(it)}</span>}
          </span>
        )
      })}
    </nav>
  )
}
