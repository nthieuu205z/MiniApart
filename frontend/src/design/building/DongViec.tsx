import type * as React from 'react'
import { Button } from '../core/Button'

/** Một dòng "Cần quyết hôm nay"/"Việc cần làm": chấm màu + tiêu đề + mô tả; nút THƯỜNG bên phải (không nutNhan → không nút). */
export function DongViec(p: { muc?: 'no' | 'canh' | 'thuong'; tieuDe: React.ReactNode; moTa?: React.ReactNode; nutNhan?: string; href?: string; onBam?: () => void }): React.ReactElement {
  const nut = p.nutNhan ? (p.href ? <a className="btn btn-secondary btn-sm" href={p.href}>{p.nutNhan}</a> : <Button variant="secondary" size="sm" onClick={p.onBam}>{p.nutNhan}</Button>) : null
  return (
    <div className={`ma-dongviec ${p.muc ?? 'thuong'}`}>
      <span className="ma-dongviec-cham" aria-hidden="true" />
      <div className="ma-dongviec-than">
        <span className="ma-dongviec-td">{p.tieuDe}</span>
        {p.moTa ? <span className="ma-dongviec-mt">{p.moTa}</span> : null}
      </div>
      {nut}
    </div>
  )
}
