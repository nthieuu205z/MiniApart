import { Fragment } from 'react'
import type * as React from 'react'

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  items: string[]
}

/** Đường dẫn. Luôn theo dạng Toà › Kỳ › Màn — trả lời "tôi đang ở đâu" trong một dòng. */
export function Breadcrumb({ items, style, ...rest }: BreadcrumbProps): React.ReactElement {
  return (
    <div
      style={{
        padding: "7px 30px",
        borderBottom: "1px solid var(--ma-border-subtle)",
        fontFamily: "var(--ma-font-ui)",
        fontSize: 12,
        color: "var(--ma-text-secondary)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: "var(--ma-breadcrumb-height)",
        ...(style || {}),
      }}
      {...rest}
    >
      {items.map((it, i) => (
        <Fragment key={it}>
          {i > 0 ? <span style={{ color: "var(--ma-border-dashed)" }}>›</span> : null}
          <span style={i === items.length - 1 ? { fontWeight: 700, color: "var(--ma-text-primary)" } : undefined}>{it}</span>
        </Fragment>
      ))}
    </div>
  )
}
