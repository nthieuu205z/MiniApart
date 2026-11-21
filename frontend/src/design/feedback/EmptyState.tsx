import type * as React from 'react'
import { Button } from '../core/Button'
import { Icon } from '../core/Icon'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  kind?: 'first' | 'filtered' | 'error' | 'loading'
  title: string
  body?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  /** Cỡ vùng bấm của hành động khôi phục; mặc định sm cho các danh sách bàn giấy. */
  actionSize?: 'sm' | 'md'
  /** Các <FilterChip> đang bật — chỉ dùng với kind="filtered". */
  filters?: React.ReactNode
  /** Mã tra cứu ngắn cho người hỗ trợ, ví dụ "8F3C". Không bao giờ hiện stack trace. */
  errorCode?: string
}

/** Trạng thái rỗng. Rỗng-lần-đầu, rỗng-do-lọc, lỗi và đang tải là các màn khác nhau — không gộp. */
export function EmptyState({ kind = 'first', title, body, actionLabel, actionSize = 'sm', onAction, filters, errorCode, className, ...rest }: EmptyStateProps): React.ReactElement {
  const cls = ['empty', className].filter(Boolean).join(' ')
  if (kind === 'loading') {
    return (
      <div className={cls} aria-busy="true" role="status" aria-label={title} {...rest}>
        <div className="skel skel-kpi" />
        <div className="skel skel-line" style={{ width: '100%' }} />
        <div className="skel skel-line" style={{ width: '80%' }} />
      </div>
    )
  }
  return (
    <div className={cls} {...rest}>
      {kind === 'error' ? (
        <div className="ill" style={{ background: 'var(--ma-urgent-bg)', color: 'var(--ma-urgent)' }}>
          <Icon name="alert" />
        </div>
      ) : null}
      {kind === 'filtered' && filters ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>{filters}</div> : null}
      <h3 className="h3">{title}</h3>
      {body ? <p className="t-sm">{body}</p> : null}
      {actionLabel ? (
        <Button variant={kind === 'filtered' ? 'secondary' : 'primary'} size={actionSize} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {kind === 'error' && errorCode ? <span className="t-meta">MÃ TRA CỨU {errorCode}</span> : null}
    </div>
  )
}
