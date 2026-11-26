import type * as React from 'react'

/** Đầu trang V3: đúng một <h1>. `phu` = dòng bối cảnh / việc kế tiếp; `hanhDong` = nút (tối đa 1 primary); `vet` = breadcrumb. Ở 390 hành động xuống dòng dưới tiêu đề. */
export function DauTrang(p: { tieuDe: React.ReactNode; phu?: React.ReactNode; hanhDong?: React.ReactNode; vet?: { nhan: string; href: string }[] }): React.ReactElement {
  return (
    <header className="ma-dautrang">
      {p.vet?.length ? (
        <nav className="ma-vet" aria-label="Vị trí">
          {p.vet.map((v, i) => <span key={v.href}>{i > 0 ? '› ' : ''}<a href={v.href}>{v.nhan}</a></span>)}
        </nav>
      ) : null}
      <div className="ma-dautrang-hang">
        <h1>{p.tieuDe}</h1>
        {p.hanhDong ? <div className="ma-dautrang-act">{p.hanhDong}</div> : null}
      </div>
      {p.phu ? <p className="ma-dautrang-phu">{p.phu}</p> : null}
    </header>
  )
}
