import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import type { GlyphName } from '../core/GlyphName'

export interface SyncBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** offline = mất mạng, đang lưu máy · syncing = đang gửi · synced = xong, tự ẩn sau 3s */
  tone?: 'offline' | 'syncing' | 'synced'
  children?: React.ReactNode
}

const TONES: Record<NonNullable<SyncBannerProps['tone']>, { background: string; color: string; border?: string; glyph: GlyphName | null }> = {
  offline: { background: 'var(--ma-waiting)', color: 'var(--ma-text-on-inverse)', glyph: 'phong-trong' },
  syncing: { background: 'var(--ma-bg-sunken)', color: 'var(--ma-text-primary)', border: '1px solid var(--ma-border-default)', glyph: null },
  synced: { background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)', glyph: null },
}

/** Dải trạng thái kết nối. Chỉ màn ghi chỉ số và thay công tơ cần cơ chế này. */
export function SyncBanner({ tone = 'offline', children, style, ...rest }: SyncBannerProps): React.ReactElement {
  const t = TONES[tone]
  return (
    <div
      role="status"
      style={{
        padding: "11px 14px",
        fontFamily: "var(--ma-font-ui)",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 0,
        ...t,
        ...(style || {}),
      }}
      {...rest}
    >
      {t.glyph ? <Glyph name={t.glyph} size={15} /> : null}
      {children}
    </div>
  )
}
