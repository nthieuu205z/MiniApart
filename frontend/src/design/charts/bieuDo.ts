/** Hình học cho biểu đồ SVG tự dựng (vùng, gauge). Thuần, không React; component chỉ vẽ chuỗi trả về. */

/** Mốc trục tròn số đẹp (1/2/5 × 10^n) phủ được giá trị lớn nhất. Trả về [0, b, 2b, ..., max]. */
export function mocTruc(lonNhat: number, soKhoang = 3): number[] {
  if (!(lonNhat > 0)) return [0, 1]
  const tho = lonNhat / soKhoang
  const muoi = 10 ** Math.floor(Math.log10(tho))
  const buoc = [1, 2, 5, 10].map((h) => h * muoi).find((b) => b * soKhoang >= lonNhat) ?? 10 * muoi
  return Array.from({ length: soKhoang + 1 }, (_, i) => i * buoc)
}

export type KhungVe = { rong: number; cao: number; trai: number; phai: number; tren: number; duoi: number }

/** Toạ độ điểm + chuỗi path đường và vùng (đóng về trục đáy). Giá trị null = kỳ chưa có số, cắt đường tại đó. */
export function duongVaVung(giaTri: ReadonlyArray<number | null>, tranTruc: number, k: KhungVe) {
  const n = giaTri.length
  const w = k.rong - k.trai - k.phai
  const h = k.cao - k.tren - k.duoi
  const day = k.tren + h
  const x = (i: number) => k.trai + (n === 1 ? w / 2 : (i * w) / (n - 1))
  const y = (v: number) => day - (tranTruc > 0 ? (Math.min(v, tranTruc) / tranTruc) * h : 0)
  const diem = giaTri.map((v, i) => (v === null ? null : { x: x(i), y: y(v) }))
  const doan: Array<Array<{ x: number; y: number }>> = []
  for (const d of diem) {
    if (!d) { doan.push([]); continue }
    if (doan.length === 0) doan.push([])
    doan[doan.length - 1].push(d)
  }
  const r = (s: number) => Math.round(s * 10) / 10
  const cacDoan = doan.filter((d) => d.length > 0)
  const duong = cacDoan.map((d) => d.map((p, i) => `${i ? 'L' : 'M'}${r(p.x)} ${r(p.y)}`).join(' ')).join(' ')
  const vung = cacDoan.map((d) => `M${r(d[0].x)} ${r(day)} ${d.map((p) => `L${r(p.x)} ${r(p.y)}`).join(' ')} L${r(d[d.length - 1].x)} ${r(day)} Z`).join(' ')
  return { diem, duong, vung, day, xs: giaTri.map((_, i) => x(i)) }
}

/** Cung gauge bán nguyệt 180° cho tỷ lệ 0–100 (kẹp biên). Trả path nền và path giá trị. */
export function cungGauge(tyLe: number, cx = 120, cy = 120, banKinh = 100) {
  const p = Math.max(0, Math.min(100, Number.isFinite(tyLe) ? tyLe : 0)) / 100
  const goc = Math.PI * (1 - p)
  const ex = cx + banKinh * Math.cos(goc)
  const ey = cy - banKinh * Math.sin(goc)
  const r = (s: number) => Math.round(s * 100) / 100
  return {
    nen: `M${cx - banKinh} ${cy} A${banKinh} ${banKinh} 0 0 1 ${cx + banKinh} ${cy}`,
    giaTri: p === 0 ? '' : `M${cx - banKinh} ${cy} A${banKinh} ${banKinh} 0 0 1 ${r(ex)} ${r(ey)}`,
  }
}
