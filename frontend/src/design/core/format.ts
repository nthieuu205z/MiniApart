/** NFR-USA-06: Render DTO ISO dates as dd/MM/yyyy without constructing a timezone-sensitive Date. */
export function dinhDangNgayIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** NFR-USA-06: Format NUMERIC strings without converting through JavaScript Number. */
export function dinhDangTien(giaTri: string | number | null | undefined): string {
  if (giaTri === null || giaTri === undefined || giaTri === '') return '0'
  const str = String(giaTri).trim()
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(str)
  if (!match) return str
  const dau = match[1]
  const phanNguyen = match[2].replace(/^0+(?=\d)/, '')
  const phanThapPhan = (match[3] ?? '').replace(/0+$/, '')
  const nguyenDaNhom = phanNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${dau}${nguyenDaNhom}${phanThapPhan ? `,${phanThapPhan}` : ''}`
}

/** Format standard numbers or percentages with locale separators. */
export function dinhDangSo(giaTri: string | number | null | undefined): string {
  if (giaTri === null || giaTri === undefined || giaTri === '') return '0'
  const str = String(giaTri).trim()
  const num = Number(str)
  if (isNaN(num)) return str
  return num.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
}

