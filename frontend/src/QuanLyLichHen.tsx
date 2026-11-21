import { useEffect, useMemo, useState } from 'react'
import {
  capNhatTrangThaiLichHen,
  fetchPublicLichHen,
  fetchToaNha,
  type LichHenXemPhong,
  type ThongTinToaNha,
} from './api'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { Feedback } from './ManagementShared'

type Props = {
  token: string
  mobile?: boolean
}

const TRANG_THAI_MAPPING: Record<string, { nhan: string; tone: 'waiting' | 'done' | 'urgent' | 'neutral' | 'closed' }> = {
  CHO_XAC_NHAN: { nhan: 'Chờ xác nhận', tone: 'urgent' },
  DA_XAC_NHAN: { nhan: 'Đã xác nhận', tone: 'waiting' },
  DA_XEM: { nhan: 'Đã xem phòng', tone: 'done' },
  HUY: { nhan: 'Đã huỷ', tone: 'closed' },
}
const LOC = ['TAT_CA', 'CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_XEM', 'HUY']
const AVATAR = ['h1', 'h2', 'h3', 'h4', 'h5']
const pad = (n: number) => String(n).padStart(2, '0')

function dinhDangThoiGian(isoStr: string | null | undefined): string {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

const gio = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? iso : `${pad(d.getHours())}:${pad(d.getMinutes())}` }
const ngayKhoa = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const khoaCuaLich = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? 'khac' : ngayKhoa(d) }
const chuCaiDau = (ten: string) => ten.trim().split(/\s+/).slice(-2).map((t) => t[0]?.toUpperCase() ?? '').join('')

function nhanNgay(khoa: string): string {
  const [y, m, d] = khoa.split('-')
  if (!d) return 'Chưa rõ ngày'
  const mai = new Date(); mai.setDate(mai.getDate() + 1)
  const ngay = `${d}/${m}/${y}`
  if (khoa === ngayKhoa(new Date())) return `Hôm nay · ${ngay}`
  if (khoa === ngayKhoa(mai)) return `Ngày mai · ${ngay}`
  return ngay
}

export default function QuanLyLichHen({ token }: Props) {
  const [danhSachLichHen, setDanhSachLichHen] = useState<LichHenXemPhong[]>([])
  const [danhSachToaNha, setDanhSachToaNha] = useState<ThongTinToaNha[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)

  const [locToaNhaId, setLocToaNhaId] = useState<number | ''>('')
  const [locTrangThai, setLocTrangThai] = useState<string>('TAT_CA')

  async function taiDuLieu() {
    setDangTai(true)
    setLoi(null)
    try {
      const [dsLich, dsToa] = await Promise.all([
        fetchPublicLichHen(token, locToaNhaId === '' ? undefined : locToaNhaId),
        fetchToaNha(token).catch(() => []),
      ])
      setDanhSachLichHen(dsLich)
      setDanhSachToaNha(dsToa)
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Không thể tải danh sách lịch hẹn xem phòng.')
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    taiDuLieu()
  }, [locToaNhaId])

  async function xuLyDoiTrangThai(id: number, trangThaiMoi: string) {
    try {
      await capNhatTrangThaiLichHen(token, id, trangThaiMoi)
      setLoi(null)
      setThongBao('Đã cập nhật trạng thái lịch hẹn.')
      setDanhSachLichHen((prev) =>
        prev.map((lh) => (lh.id === id ? { ...lh, trangThai: trangThaiMoi } : lh))
      )
      setTimeout(() => setThongBao(null), 3500)
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại.')
    }
  }

  const soChoXacNhan = danhSachLichHen.filter((lh) => lh.trangThai === 'CHO_XAC_NHAN').length
  const dem = (tt: string) => (tt === 'TAT_CA' ? danhSachLichHen.length : danhSachLichHen.filter((lh) => lh.trangThai === tt).length)

  // Hôm nay + sắp tới xếp tăng dần (việc cần làm trước); ngày đã qua xếp giảm dần phía sau.
  const nhomTheoNgay = useMemo(() => {
    const homNay = ngayKhoa(new Date())
    const map = new Map<string, LichHenXemPhong[]>()
    for (const lh of danhSachLichHen.filter((x) => locTrangThai === 'TAT_CA' || x.trangThai === locTrangThai)) {
      const k = khoaCuaLich(lh.thoiGianHen)
      map.set(k, [...(map.get(k) ?? []), lh])
    }
    const khoa = [...map.keys()]
    const sapToi = khoa.filter((k) => k >= homNay).sort()
    const daQua = khoa.filter((k) => k < homNay).sort().reverse()
    return [...sapToi, ...daQua].map((k) => ({ khoa: k, ds: map.get(k)!.sort((a, b) => a.thoiGianHen.localeCompare(b.thoiGianHen)) }))
  }, [danhSachLichHen, locTrangThai])

  return (
    <section style={{ display: 'grid', gap: 16, minWidth: 0 }} aria-labelledby="lich-hen-title">
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1" id="lich-hen-title">Lịch hẹn</h1>
          <p className="sub">{soChoXacNhan} lịch hẹn mới cần gọi xác nhận · {danhSachLichHen.length} lịch hẹn xem phòng từ trang khám phá</p>
        </div>
        <div className="topbar-actions">
          <label className="sr-only" htmlFor="lich-hen-toa">Toà nhà</label>
          <select id="lich-hen-toa" className="select" style={{ width: 220 }} value={locToaNhaId} onChange={(e) => setLocToaNhaId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Tất cả toà nhà</option>
            {danhSachToaNha.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
          </select>
          <Button variant="secondary" onClick={() => taiDuLieu()}><Icon name="history" />Làm mới</Button>
        </div>
      </header>

      <Feedback error={!dangTai && danhSachLichHen.length ? loi : null} success={thongBao} />

      {dangTai ? <EmptyState kind="loading" title="Đang tải danh sách lịch hẹn" />
        : loi && !danhSachLichHen.length ? <EmptyState kind="error" title={loi} actionLabel="Tải lại" onAction={() => taiDuLieu()} />
          : (
            <Card>
              <div className="table-toolbar" role="group" aria-label="Lọc theo trạng thái">
                {LOC.map((tt) => (
                  <button key={tt} type="button" className="chip" aria-pressed={locTrangThai === tt} onClick={() => setLocTrangThai(tt)}>
                    {tt === 'TAT_CA' ? 'Tất cả' : TRANG_THAI_MAPPING[tt].nhan}<span className="n">{dem(tt)}</span>
                  </button>
                ))}
              </div>

              {nhomTheoNgay.length === 0 ? (
                <EmptyState
                  kind={danhSachLichHen.length ? 'filtered' : 'first'}
                  title={danhSachLichHen.length ? 'Không có lịch hẹn ở trạng thái này.' : 'Chưa có lịch hẹn xem phòng nào.'}
                  body={danhSachLichHen.length ? undefined : 'Khi khách đặt lịch xem phòng ở trang Khám phá, lịch hẹn sẽ hiện ở đây.'}
                  actionLabel={danhSachLichHen.length ? 'Xem tất cả lịch hẹn' : undefined}
                  onAction={() => setLocTrangThai('TAT_CA')}
                />
              ) : nhomTheoNgay.map(({ khoa, ds }) => (
                <div key={khoa} className="stack" style={{ gap: 4, marginTop: 8 }}>
                  <h2 className="h3" style={{ padding: '8px 12px 0' }}>{nhanNgay(khoa)} <span className="t-meta">· {ds.length} lịch</span></h2>
                  {ds.map((lh) => {
                    const tt = TRANG_THAI_MAPPING[lh.trangThai] || { nhan: lh.trangThai, tone: 'neutral' as const }
                    return (
                      <article key={lh.id} data-testid={`lich-hen-item-${lh.id}`} className="list-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start', borderBottom: '1px solid var(--ma-line-100)', borderRadius: 0 }}>
                        <span className={`avatar ${AVATAR[lh.id % AVATAR.length]}`} aria-hidden="true">{chuCaiDau(lh.hoTen)}</span>
                        <div className="body" style={{ flex: '1 1 220px', display: 'grid', gap: 4 }}>
                          <div className="row-wrap">
                            <strong>{lh.hoTen}</strong>
                            <StatusTag tone={tt.tone}>{tt.nhan}</StatusTag>
                          </div>
                          <div className="t-sm" style={{ color: 'var(--ma-text-secondary)' }}>
                            Xem Phòng {lh.soPhong} · {lh.tenToaNha} · <strong style={{ color: 'var(--ma-text-primary)' }}>{gio(lh.thoiGianHen)}</strong> <span className="t-meta">(đặt lúc {dinhDangThoiGian(lh.taoLuc)})</span>
                          </div>
                          <div className="row-wrap t-sm">
                            <a href={`tel:${lh.soDienThoai}`} style={{ color: 'var(--ma-text-link)', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44 }}><Icon name="phone" />{lh.soDienThoai}</a>
                            {lh.email && <span style={{ color: 'var(--ma-text-secondary)' }}>{lh.email}</span>}
                          </div>
                          {lh.ghiChu && <p className="t-sm card-sunken" style={{ padding: '8px 12px' }}>Ghi chú của khách: “{lh.ghiChu}”</p>}
                        </div>
                        <div className="row-wrap" style={{ flex: 'none' }}>
                          {lh.trangThai === 'CHO_XAC_NHAN' && <Button variant="secondary" size="sm" onClick={() => xuLyDoiTrangThai(lh.id, 'DA_XAC_NHAN')}><Icon name="phone" />Đã gọi xác nhận</Button>}
                          {lh.trangThai === 'DA_XAC_NHAN' && <Button variant="secondary" size="sm" onClick={() => xuLyDoiTrangThai(lh.id, 'DA_XEM')}><Icon name="check" />Khách đã xem phòng</Button>}
                          {lh.trangThai !== 'HUY' && lh.trangThai !== 'DA_XEM' && <Button variant="text" size="sm" onClick={() => xuLyDoiTrangThai(lh.id, 'HUY')}>Huỷ lịch hẹn</Button>}
                          {lh.trangThai === 'HUY' && <Button variant="secondary" size="sm" onClick={() => xuLyDoiTrangThai(lh.id, 'CHO_XAC_NHAN')}>Khôi phục lại</Button>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ))}
            </Card>
          )}
    </section>
  )
}
