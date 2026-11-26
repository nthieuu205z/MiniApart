import type * as React from 'react'

export type Buoc = { ten: string; moTa?: string; trangThai: 'xong' | 'nay' | 'cho'; href?: string }

/** Thanh bước (Tháng, vòng đời hợp đồng, sự cố). Bước 'nay' có aria-current="step". < 768 (ngang): chỉ "Bước 2/4: Khoá chỉ số". */
export function ThanhBuoc(p: { buoc: Buoc[]; nhan: string; doc?: boolean }): React.ReactElement {
  const i = p.buoc.findIndex((b) => b.trangThai === 'nay')
  return (
    <>
      {!p.doc && i >= 0 ? <p className="ma-buoc-gon">Bước {i + 1}/{p.buoc.length}: {p.buoc[i].ten}</p> : null}
      <ol className={p.doc ? 'ma-buoc doc' : 'ma-buoc'} aria-label={p.nhan}>
        {p.buoc.map((b) => {
          const ten = b.href ? <a href={b.href}>{b.ten}</a> : b.ten
          return (
            <li key={b.ten} data-tt={b.trangThai} aria-current={b.trangThai === 'nay' ? 'step' : undefined}>
              <span>{b.trangThai === 'xong' ? '✓ ' : ''}{ten}</span>
              {b.moTa ? <span className="ma-dongviec-mt">{b.moTa}</span> : null}
            </li>
          )
        })}
      </ol>
    </>
  )
}
