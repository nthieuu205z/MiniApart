/** NFR-USA-06: Render DTO ISO dates as dd/MM/yyyy without constructing a timezone-sensitive Date. */
export function dinhDangNgayIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** NFR-USA-06: Format NUMERIC strings without converting through JavaScript Number. */
export function dinhDangTien(giaTri: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(giaTri.trim())
  if (!match) return giaTri
  const dau = match[1]
  const phanNguyen = match[2].replace(/^0+(?=\d)/, '')
  const phanThapPhan = (match[3] ?? '').replace(/0+$/, '')
  const nguyenDaNhom = phanNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${dau}${nguyenDaNhom}${phanThapPhan ? `,${phanThapPhan}` : ''}`
}
