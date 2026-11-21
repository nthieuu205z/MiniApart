import type * as React from 'react'

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode
  /** Liên kết/nút nhỏ bên phải tiêu đề. */
  action?: React.ReactNode
}

/** Thẻ trắng bo 24, không viền. Không lồng thẻ trong thẻ — dùng `card-sunken` cho khối con. */
export function Card({ title, action, className, children, ...rest }: CardProps): React.ReactElement {
  return (
    <section className={['card', className].filter(Boolean).join(' ')} {...rest}>
      {title || action ? (
        <div className="card-head">
          {title ? <h2 className="h2">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export interface KpiCardProps extends Omit<CardProps, 'action' | 'children'> {
  value: React.ReactNode
  unit?: React.ReactNode
  /** Một dòng mô tả dưới số. */
  desc?: React.ReactNode
  /** Liên kết cuối thẻ. */
  link?: React.ReactNode
}

/** Thẻ số lớn: tiêu đề + số + đơn vị + mô tả + liên kết. */
export function KpiCard({ title, value, unit, desc, link, ...rest }: KpiCardProps): React.ReactElement {
  return (
    <Card title={title} {...rest}>
      <p className="kpi-value">
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </p>
      {desc ? <p className="kpi-desc">{desc}</p> : null}
      {link ? <div className="card-foot">{link}</div> : null}
    </Card>
  )
}
