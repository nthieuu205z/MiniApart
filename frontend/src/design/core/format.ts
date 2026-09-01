/** NFR-USA-06: Render DTO ISO dates as dd/MM/yyyy without constructing a timezone-sensitive Date. */
export function dinhDangNgayIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}
