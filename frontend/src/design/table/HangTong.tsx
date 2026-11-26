import type * as React from 'react'

/** Hàng tổng cho bảng tự viết: đặt trong <tfoot>. Chữ 600, kẻ trên 2px mực (CSS .ma-tong). */
export function HangTong({ o, canhPhai = [] }: { o: React.ReactNode[]; canhPhai?: number[] }): React.ReactElement {
  return <tr className="ma-tong">{o.map((x, i) => <td key={i} className={canhPhai.includes(i) ? 'num' : undefined}>{x}</td>)}</tr>
}
