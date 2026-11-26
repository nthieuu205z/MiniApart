import type * as React from 'react'

export type OSo = { nhan: string; giaTri: React.ReactNode; donVi?: string; phu?: React.ReactNode; tone?: 'no' | 'thuong'; anKhiHep?: boolean; href?: string }

/** Dải số đầu trang. Ô đầu là số lớn. tone 'no' → đỏ, nhưng số 0 không bao giờ đỏ. anKhiHep → ẩn khi < 768. */
export function KhoiSo({ so }: { so: OSo[] }): React.ReactElement {
  return (
    <div className="ma-khoiso">
      {so.map((o) => {
        const khong = o.giaTri === 0 || o.giaTri === '0'
        const cls = ['ma-oso', o.tone === 'no' && !khong ? 'no' : '', o.anKhiHep ? 'an-hep' : ''].filter(Boolean).join(' ')
        const noiDung = (
          <>
            <span className="ma-oso-nhan">{o.nhan}</span>
            <span className="ma-oso-so">{o.giaTri}{o.donVi ? <span className="ma-oso-dv">{o.donVi}</span> : null}</span>
            {o.phu ? <span className="ma-oso-phu">{o.phu}</span> : null}
          </>
        )
        return o.href ? <a key={o.nhan} className={cls} href={o.href}>{noiDung}</a> : <div key={o.nhan} className={cls}>{noiDung}</div>
      })}
    </div>
  )
}
