import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '../core/Icon'
import { tenToaDangChon, useToaDangChon } from '../../toaDangChon'

/**
 * Ô chọn toà ở đầu sidebar. Chủ (nhiều toà): nút mở danh sách "Tất cả N toà" + từng toà.
 * Quản lý (một toà được phân công): ô tĩnh, không bấm.
 */
export function ChonToa({ collapsed = false }: { collapsed?: boolean }) {
  const toa = useToaDangChon()
  const [mo, setMo] = useState(false)
  const [chi, setChi] = useState(0)
  const nutRef = useRef<HTMLButtonElement>(null)
  const danhSachRef = useRef<HTMLUListElement>(null)

  const luaChon = [{ id: null as number | null, ten: `Tất cả ${toa.danhSach.length} toà`, phu: 'Chủ nhà' }, ...toa.danhSach.map((t) => ({ id: t.id as number | null, ten: t.ten, phu: `${t.soTang} tầng` }))]
  const viTriChon = Math.max(0, luaChon.findIndex((l) => l.id === toa.toaNhaId))

  useEffect(() => {
    if (!mo) return undefined
    danhSachRef.current?.focus()
    function dongKhiBamNgoai(event: MouseEvent) {
      if (!(event.target instanceof Node)) return
      if (!danhSachRef.current?.contains(event.target) && !nutRef.current?.contains(event.target)) setMo(false)
    }
    document.addEventListener('mousedown', dongKhiBamNgoai)
    return () => document.removeEventListener('mousedown', dongKhiBamNgoai)
  }, [mo])

  if (toa.coDinh) {
    const ten = toa.danhSach.length > 0 ? toa.danhSach[0].ten : toa.dangTai ? 'Đang tải…' : 'Chưa có toà'
    return (
      <div className="sb-toa static" title={collapsed ? ten : undefined}>
        <Icon name="building" />
        <span className="grow"><span className="t1">{ten}</span><span className="t2">được phân công</span></span>
      </div>
    )
  }

  const ten = tenToaDangChon(toa) || 'Chọn toà'
  const phu = toa.toaNhaId === null ? 'Chủ nhà' : `${toa.danhSach.find((t) => t.id === toa.toaNhaId)?.soTang ?? ''} tầng`

  function moDanhSach() {
    setChi(viTriChon)
    setMo(true)
  }
  function dong() {
    setMo(false)
    nutRef.current?.focus()
  }
  function chonMuc(i: number) {
    toa.chon(luaChon[i].id)
    dong()
  }
  function phimTrongDanhSach(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') { event.preventDefault(); dong() } else if (event.key === 'ArrowDown') { event.preventDefault(); setChi((i) => Math.min(luaChon.length - 1, i + 1)) } else if (event.key === 'ArrowUp') { event.preventDefault(); setChi((i) => Math.max(0, i - 1)) } else if (event.key === 'Home') { event.preventDefault(); setChi(0) } else if (event.key === 'End') { event.preventDefault(); setChi(luaChon.length - 1) } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chonMuc(chi) } else if (event.key === 'Tab') setMo(false)
  }

  return (
    <div className="sb-toa-wrap">
      <button
        ref={nutRef}
        type="button"
        className="sb-toa"
        aria-haspopup="listbox"
        aria-expanded={mo}
        aria-controls="ma-chon-toa"
        aria-label={`Toà đang xem: ${ten}`}
        title={collapsed ? ten : undefined}
        onClick={() => (mo ? dong() : moDanhSach())}
        onKeyDown={(event) => { if (event.key === 'ArrowDown' && !mo) { event.preventDefault(); moDanhSach() } }}
      >
        <Icon name="building" />
        <span className="grow"><span className="t1">{ten}</span><span className="t2">{phu}</span></span>
        <Icon name="chevron-down" size="sm" />
      </button>
      {mo ? (
        <ul ref={danhSachRef} id="ma-chon-toa" className="sb-toa-list" role="listbox" tabIndex={0} aria-label="Chọn toà" aria-activedescendant={`ma-toa-${luaChon[chi].id ?? 'tat-ca'}`} onKeyDown={phimTrongDanhSach}>
          {luaChon.map((l, i) => (
            <li key={l.id ?? 'tat-ca'} id={`ma-toa-${l.id ?? 'tat-ca'}`} role="option" aria-selected={l.id === toa.toaNhaId} className={i === chi ? 'on' : undefined} onMouseEnter={() => setChi(i)} onClick={() => chonMuc(i)}>
              <span className="grow">{l.ten}</span>
              {l.id === toa.toaNhaId ? <Icon name="check" size="sm" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
