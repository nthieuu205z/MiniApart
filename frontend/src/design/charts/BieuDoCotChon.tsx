import type * as React from 'react'

export type CotBieuDo = {
  khoa: string
  /** Nhãn dưới cột, ngắn (vd "10/26"). */
  nhan: string
  giaTri: number
  /** Số in trên đầu cột. */
  hienThi: string
  /** Đọc màn hình: tháng + số đầy đủ. */
  moTa: string
}

/**
 * Biểu đồ cột dọc cho điện thoại: mỗi cột là một nút ≥ 44px rộng, số luôn in trên đầu cột (không dựa vào màu).
 * Quá 6 cột thì cuộn ngang trong khung; trục X là thời gian tăng dần từ trái sang phải.
 */
export function BieuDoCotChon({ cot, chonKhoa, onChon, mau, ariaLabel, cotProps }: {
  cot: readonly CotBieuDo[]
  chonKhoa: string | null
  onChon: (khoa: string) => void
  mau: string
  ariaLabel: string
  cotProps?: (c: CotBieuDo, chon: boolean) => Record<string, string>
}): React.ReactElement {
  const lon = Math.max(0, ...cot.map((c) => c.giaTri))
  return (
    <div style={{ overflowX: 'auto', overscrollBehaviorX: 'contain' }}>
      <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 8, alignItems: 'stretch', height: 184, minWidth: cot.length * 56 }}>
        {cot.map((c) => {
          const chon = c.khoa === chonKhoa
          const cao = c.giaTri > 0 && lon > 0 ? Math.max(4, Math.round((c.giaTri / lon) * 100)) : 0
          return (
            <button
              key={c.khoa}
              type="button"
              aria-label={c.moTa}
              aria-pressed={chon}
              onClick={() => onChon(c.khoa)}
              onFocus={() => onChon(c.khoa)}
              onMouseEnter={() => onChon(c.khoa)}
              {...cotProps?.(c, chon)}
              style={{ flex: '1 1 48px', minWidth: 48, display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', gap: 6, padding: '4px 0', border: 0, borderRadius: 12, background: chon ? 'var(--ma-bg-sunken)' : 'transparent', color: 'var(--ma-text-primary)', font: 'inherit', cursor: 'pointer' }}
            >
              <span style={{ font: '600 14px/1.2 var(--ma-font-ui)' }}>{c.hienThi}</span>
              <span aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 0 }}>
                <span style={{ display: 'block', width: '56%', height: `${cao}%`, borderRadius: '6px 6px 2px 2px', background: mau, opacity: chon ? 1 : 0.45 }} />
              </span>
              <span style={{ font: `${chon ? 600 : 500} 13px/1.2 var(--ma-font-ui)`, color: chon ? 'var(--ma-text-primary)' : 'var(--ma-text-secondary)' }}>{c.nhan}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
