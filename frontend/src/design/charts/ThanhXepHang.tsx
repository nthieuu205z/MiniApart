import type * as React from 'react'

export type MucXepHang = { nhan: string; giaTri: number; hienThi: string }

/** Thanh ngang xếp hạng: độ dài theo giá trị lớn nhất của nhóm; giá trị luôn hiện thành chữ. */
export function ThanhXepHang({ muc, am = false }: { muc: readonly MucXepHang[]; am?: boolean }): React.ReactElement {
  const lon = Math.max(0, ...muc.map((m) => m.giaTri))
  return (
    <div className="hbars">
      {muc.map((m) => (
        <div className="hbar" key={m.nhan}>
          <span className="hbar-label">{m.nhan}</span>
          <span className="hbar-value">{m.hienThi}</span>
          <div className="hbar-track">
            <div className={am ? 'hbar-fill warm' : 'hbar-fill'} style={{ width: `${lon > 0 ? (m.giaTri / lon) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
