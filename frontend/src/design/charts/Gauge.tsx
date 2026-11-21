import type * as React from 'react'
import { cungGauge } from './bieuDo'

/** Gauge bán nguyệt cho tỷ lệ 0–100; số và chú thích nằm trong HTML nên đọc màn hình đọc được. */
export function Gauge({ tyLe, chuThich, nhan }: { tyLe: number; chuThich: React.ReactNode; nhan: string }): React.ReactElement {
  const cung = cungGauge(tyLe)
  return (
    <div className="gauge" role="img" aria-label={nhan}>
      <svg viewBox="0 0 240 132" aria-hidden="true">
        <title>{nhan}</title>
        <path d={cung.nen} fill="none" stroke="var(--ma-chart-track)" strokeWidth="18" strokeLinecap="round" />
        {cung.giaTri ? <path d={cung.giaTri} fill="none" stroke="var(--ma-chart-1)" strokeWidth="18" strokeLinecap="round" /> : null}
      </svg>
      <div className="gauge-value">
        {Math.round(tyLe)}%<small>{chuThich}</small>
      </div>
    </div>
  )
}
