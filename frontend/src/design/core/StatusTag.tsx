import type * as React from 'react'
import { Icon, type IconName } from './Icon'

export interface StatusTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** draft=Nháp · neutral=trung tính · strong=đã phát hành · urgent=quá hạn/mới · waiting=đang xử lý · done=hoàn tất · closed=đã huỷ */
  tone?: 'draft' | 'neutral' | 'strong' | 'urgent' | 'waiting' | 'done' | 'closed'
  /** Icon thay cho icon mặc định của tone. Thẻ luôn có icon + chữ, không dùng màu đơn độc. */
  icon?: IconName
  children?: React.ReactNode
}

const TONES: Record<NonNullable<StatusTagProps['tone']>, { cls: string; icon: IconName }> = {
  draft: { cls: 'tag-neutral', icon: 'edit' },
  neutral: { cls: 'tag-neutral', icon: 'info' },
  strong: { cls: 'tag-brand', icon: 'check-circle' },
  urgent: { cls: 'tag-danger', icon: 'alert' },
  waiting: { cls: 'tag-warning', icon: 'clock' },
  done: { cls: 'tag-success', icon: 'check' },
  closed: { cls: 'tag-neutral', icon: 'x-circle' },
}

/** Nhãn trạng thái. Máy chủ trả nhãn tiếng Việt, giao diện không tự dịch mã. */
export function StatusTag({ tone = 'neutral', icon, children, className, ...rest }: StatusTagProps): React.ReactElement {
  const t = TONES[tone]
  return (
    <span className={['tag', t.cls, className].filter(Boolean).join(' ')} {...rest}>
      <Icon name={icon ?? t.icon} size="sm" />
      {children}
    </span>
  )
}
