import { useEffect, useMemo, useState } from 'react'
import type { PublicPhong } from '../api'
import { amenityKey, hasAllAmenities } from '../roomAmenities'
import { Anh, DonGia, Tien, laTrong, locPhong, moTaNgan, nhanTrangThai, thanhPho, useDuLieuCongKhai, type BoLoc } from './dungChung'

const TRANG = 12
type Loc = { noi: string; gia: string; loai: string; q: string; ti: string[]; tatca: boolean }

function docUrl(search: string): Loc {
  const q = new URLSearchParams(search)
  return { noi: q.get('tp') ? `tp:${q.get('tp')}` : q.get('toa') ?? '', gia: q.get('gia') ?? '', loai: q.get('loai') ?? '', q: q.get('q') ?? '', ti: (q.get('ti') ?? '').split(',').filter(Boolean), tatca: q.get('tatca') === '1' }
}
const sangBoLoc = (l: Loc, tatca = l.tatca, ti = l.ti): BoLoc => ({ tatca, ti, gia: l.gia, loai: l.loai, q: l.q, tp: l.noi.startsWith('tp:') ? l.noi.slice(3) : '', toa: l.noi.startsWith('tp:') ? '' : l.noi })

/** Tìm phòng `/tim-phong`: lọc chạy ngay khi đổi, bộ lọc ghi lên URL để gửi link vẫn đúng. */
export default function TimPhong({ search }: { search: string }) {
  const { toa, phong, dangTai, loi, taiLai } = useDuLieuCongKhai()
  const [loc, setLoc] = useState<Loc>(() => docUrl(search))
  const [soHien, setSoHien] = useState(TRANG)
  useEffect(() => { document.title = 'Tìm phòng — MiniApart' }, [])

  const dat = (p: Partial<Loc>) => { setSoHien(TRANG); setLoc((l) => ({ ...l, ...p })) }
  const b = sangBoLoc(loc)
  const ketQua = useMemo(() => locPhong(phong, b), [phong, loc]) // eslint-disable-line react-hooks/exhaustive-deps
  const tp = [...new Set(toa.map((t) => thanhPho(t.diaChi)))]
  const loai = [...new Set(phong.map((p) => p.loaiPhong).filter(Boolean))].sort()
  // Tiện ích phòng nào cũng có thì lọc không có nghĩa: chỉ đưa lên chip những tiện ích phân biệt được phòng. Gộp các cách viết của cùng một tiện ích.
  const tienIch = useMemo(() => {
    const nhan = new Map<string, string>()
    phong.forEach((p) => p.tienIch.forEach((t) => { if (!nhan.has(amenityKey(t))) nhan.set(amenityKey(t), t) }))
    return [...nhan.values()].filter((t) => phong.some((p) => !hasAllAmenities(p.tienIch, [t])))
  }, [phong])
  const coLoc = !!(loc.noi || loc.gia || loc.loai || loc.q.trim() || loc.ti.length || loc.tatca)
  const trong = laTrong
  const datLai = () => { setSoHien(TRANG); setLoc({ noi: '', gia: '', loai: '', q: '', ti: [], tatca: false }) }

  // Ghi bộ lọc lên địa chỉ (replaceState không kích hoạt định tuyến của App).
  useEffect(() => {
    const qs = new URLSearchParams(Object.entries({ tp: b.tp, toa: b.toa, gia: loc.gia, loai: loc.loai, q: loc.q, ti: loc.ti.join(','), tatca: loc.tatca ? '1' : '' }).filter(([, v]) => v) as string[][])
    window.history.replaceState(window.history.state, '', `/tim-phong${qs.toString() ? `?${qs}` : ''}`)
  }, [loc]) // eslint-disable-line react-hooks/exhaustive-deps

  const soTrong = ketQua.filter(trong).length
  const tong = phong.filter(trong)
  const reNhat = [...tong].sort((a, c) => a.giaThueMacDinh - c.giaThueMacDinh)[0]
  return (
    <section className="khung trang tp">
      <div className="tp-dau">
        <h1 className="tc2">Tìm phòng</h1>
        <p>{dangTai ? 'Đang tải…' : `${tong.length} phòng đang trống ở ${toa.length} toà${reNhat ? ', giá từ ' : ''}`}{reNhat && !dangTai ? <><Tien n={reNhat.giaThueMacDinh} /> mỗi tháng</> : null}{dangTai ? '' : '.'}</p>
      </div>
      <form className="loc" role="search" aria-label="Lọc phòng" onSubmit={(e) => e.preventDefault()}>
        <label className="o"><span>Toà nhà</span>
          <select value={loc.noi} onChange={(e) => dat({ noi: e.target.value })}>
            <option value="">Tất cả toà</option>
            {tp.map((c) => (
              <optgroup key={c} label={c}>
                <option value={`tp:${c}`}>Cả {c}</option>
                {toa.filter((t) => thanhPho(t.diaChi) === c).map((t) => <option key={t.id} value={t.id}>{t.ten} ({t.soPhongTrong} trống)</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="o"><span>Mức giá mỗi tháng</span>
          <select value={loc.gia} onChange={(e) => dat({ gia: e.target.value })}>
            <option value="">Tất cả mức giá</option>
            <option value="DUOI_3_5">Dưới 3.500.000 ₫</option>
            <option value="3_5_DEN_5">3.500.000 đến 5.000.000 ₫</option>
            <option value="TREN_5">Trên 5.000.000 ₫</option>
          </select>
        </label>
        <label className="o"><span>Loại phòng</span>
          <select value={loc.loai} onChange={(e) => dat({ loai: e.target.value })}>
            <option value="">Tất cả loại</option>
            {loai.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="o"><span>Số phòng hoặc địa chỉ</span>
          <input type="search" value={loc.q} onChange={(e) => dat({ q: e.target.value })} placeholder="Ví dụ: 401, Duy Tân" autoComplete="off" />
        </label>
        <div className="chip-hang">
          <Chip nhan="Chỉ phòng trống" bat={!loc.tatca} n={locPhong(phong, sangBoLoc(loc, false)).length} onClick={() => dat({ tatca: !loc.tatca })} />
          {tienIch.map((t) => {
            const bat = loc.ti.some((x) => amenityKey(x) === amenityKey(t))
            const n = locPhong(phong, sangBoLoc(loc, loc.tatca, bat ? loc.ti : [...loc.ti, t])).length
            return <Chip key={t} nhan={t} bat={bat} n={n} khoa={!bat && !n} onClick={() => dat({ ti: bat ? loc.ti.filter((x) => amenityKey(x) !== amenityKey(t)) : [...loc.ti, t] })} />
          })}
        </div>
      </form>

      <div className="kq-dau">
        <h2 className="tc4" aria-live="polite">
          {dangTai ? 'Đang tải phòng…' : loi ? 'Chưa tải được danh sách phòng'
            : ketQua.length ? <>{ketQua.length} phòng{loc.tatca ? `, ${soTrong} đang trống` : ' đang trống'} <span>Phòng trống trước, giá thấp đến cao</span></> : 'Không có phòng nào khớp'}
        </h2>
        {coLoc ? <button type="button" className="lk" onClick={datLai}>Đặt lại bộ lọc</button> : null}
      </div>

      {dangTai ? (
        <div className="luoi-phong" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div className="xuong" key={i}><i /><b /><b /><b /></div>)}</div>
      ) : loi ? (
        <div className="trong-kq" role="alert"><p>{loi} Bộ lọc của bạn vẫn được giữ.</p><button type="button" className="nut nut-muc" onClick={taiLai}>Tải lại</button></div>
      ) : !ketQua.length ? <KhongKhop loc={loc} phong={phong} dat={dat} datLai={datLai} /> : (
        <>
          <div className="luoi-phong">{ketQua.slice(0, soHien).map((p) => <ThePhong key={p.id} p={p} />)}</div>
          {ketQua.length > soHien ? <div className="them"><button type="button" className="nut nut-vien" onClick={() => setSoHien((n) => n + TRANG)}>Xem thêm {ketQua.length - soHien} phòng</button></div> : null}
        </>
      )}
    </section>
  )
}

function Chip({ nhan, bat, n, onClick, khoa }: { nhan: string; bat: boolean; n: number; onClick: () => void; khoa?: boolean }) {
  return <button type="button" className="loc-chip" aria-pressed={bat} disabled={khoa} onClick={onClick}>{nhan} <b>{n}</b></button>
}

function KhongKhop({ loc, phong, dat, datLai }: { loc: Loc; phong: PublicPhong[]; dat: (p: Partial<Loc>) => void; datLai: () => void }) {
  const neuTatCa = loc.tatca ? 0 : locPhong(phong, sangBoLoc(loc, true)).length
  return (
    <div className="trong-kq">
      <p>{neuTatCa ? `Có ${neuTatCa} phòng khớp điều kiện nhưng đang có người thuê. Bạn có thể xem để biết giá, hoặc nới bộ lọc.` : 'Thử bỏ bớt tiện ích hoặc chọn mức giá rộng hơn.'}</p>
      {neuTatCa ? <button type="button" className="nut nut-muc" onClick={() => dat({ tatca: true })}>Xem cả phòng đang có người thuê</button> : null}
      <button type="button" className="nut nut-vien" onClick={datLai}>Đặt lại bộ lọc</button>
    </div>
  )
}

export function ThePhong({ p }: { p: PublicPhong }) {
  const dv = p.danhSachDichVu.filter((d) => d.loaiThu === 'THEO_CHI_SO').slice(0, 2)
  return (
    <a className={`phong${laTrong(p) ? '' : ' het'}`} href={`/phong-trong/${p.id}`} data-testid={`card-phong-${p.soPhong}`}>
      <span className="phong-anh"><Anh p={p} alt={`Phòng ${p.soPhong}, ${p.tenToaNha}`} />{laTrong(p) ? null : <span className="nhan">{nhanTrangThai(p)}</span>}</span>
      <span className="phong-gia"><b><Tien n={p.giaThueMacDinh} /></b> /tháng</span>
      <span className="phong-ten">Phòng {p.soPhong} · {p.tenToaNha}</span>
      <span className="phong-phu">{thanhPho(p.diaChiToaNha)} · {moTaNgan(p)}</span>
      {dv.length ? <span className="phong-phu">{dv.map((d, i) => <span key={d.id}>{i ? ' · ' : ''}{d.tenDichVu} <DonGia dv={d} /></span>)}</span> : null}
    </a>
  )
}
