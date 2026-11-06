import { useEffect, useState, type CSSProperties } from 'react'
import {
  capNhatTrangThaiLichHen,
  fetchPublicLichHen,
  fetchToaNha,
  type LichHenXemPhong,
  type ThongTinToaNha,
} from './api'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'

type Props = {
  token: string
  mobile?: boolean
}

const TRANG_THAI_MAPPING: Record<string, { nhan: string; tone: 'waiting' | 'done' | 'urgent' | 'neutral' }> = {
  CHO_XAC_NHAN: { nhan: 'CHỜ XÁC NHẬN', tone: 'urgent' },
  DA_XAC_NHAN: { nhan: 'ĐÃ XÁC NHẬN', tone: 'waiting' },
  DA_XEM: { nhan: 'ĐÃ XEM PHÒNG', tone: 'done' },
  HUY: { nhan: 'ĐÃ HUỶ', tone: 'neutral' },
}

function dinhDangThoiGian(isoStr: string | null | undefined): string {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function QuanLyLichHen({ token, mobile = false }: Props) {
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
      setThongBao('Đã cập nhật trạng thái lịch hẹn.')
      setDanhSachLichHen((prev) =>
        prev.map((lh) => (lh.id === id ? { ...lh, trangThai: trangThaiMoi } : lh))
      )
      setTimeout(() => setThongBao(null), 3500)
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại.')
    }
  }

  const danhSachLoc = danhSachLichHen.filter((lh) => {
    if (locTrangThai !== 'TAT_CA' && lh.trangThai !== locTrangThai) return false
    return true
  })

  const soChoXacNhan = danhSachLichHen.filter((lh) => lh.trangThai === 'CHO_XAC_NHAN').length

  return (
    <div style={styleKhungChinh}>
      {/* Tiêu đề & Thông tin dẫn nhập */}
      <div style={styleTieuDeManHinh}>
        <div>
          <SysLabel>TIẾP NHẬN KHÁCH VÃNG LAI</SysLabel>
          <h2 style={styleTieuDeH2}>Lịch Hẹn Xem Phòng Trực Tuyến</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
            Danh sách khách đặt hẹn xem phòng từ trang chủ công khai. Quản lý cần gọi xác nhận trước khi khách đến.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-3)' }}>
          <span style={styleHuyHieuCho}>
            {soChoXacNhan} lịch hẹn mới cần gọi
          </span>
          <Button variant="secondary" size="sm" onClick={() => taiDuLieu()}>
            Làm mới ↻
          </Button>
        </div>
      </div>

      {thongBao && (
        <div style={styleThongBaoThanhCong}>
          {thongBao}
        </div>
      )}

      {/* Bộ lọc */}
      <div style={styleThanhBoLoc}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-text-secondary)' }}>
            TOÀ NHÀ:
          </span>
          <select
            style={styleSelect}
            value={locToaNhaId}
            onChange={(e) => setLocToaNhaId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Tất cả toà nhà</option>
            {danhSachToaNha.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ten}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-text-secondary)' }}>
            TRẠNG THÁI:
          </span>
          {['TAT_CA', 'CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_XEM', 'HUY'].map((tt) => {
            const active = locTrangThai === tt
            const nhan =
              tt === 'TAT_CA'
                ? 'Tất cả'
                : TRANG_THAI_MAPPING[tt]?.nhan || tt
            return (
              <button
                key={tt}
                type="button"
                onClick={() => setLocTrangThai(tt)}
                style={{
                  ...styleChipButton,
                  background: active ? 'var(--ma-ink-900)' : 'var(--ma-bg-card)',
                  color: active ? '#FFFFFF' : 'var(--ma-text-primary)',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {nhan}
              </button>
            )
          })}
        </div>
      </div>

      {/* Danh sách lịch hẹn */}
      {dangTai ? (
        <div style={styleKhungThongBao}>Đang tải danh sách lịch hẹn…</div>
      ) : loi ? (
        <div style={{ ...styleKhungThongBao, color: 'var(--ma-urgent)' }}>{loi}</div>
      ) : danhSachLoc.length === 0 ? (
        <div style={styleKhungThongBao}>
          <SysLabel>KHÔNG CÓ LỊCH HẸN</SysLabel>
          <p style={{ marginTop: 8, color: 'var(--ma-text-secondary)' }}>
            Chưa có lịch hẹn xem phòng nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
          {danhSachLoc.map((lh) => {
            const tt = TRANG_THAI_MAPPING[lh.trangThai] || { nhan: lh.trangThai, tone: 'neutral' }

            return (
              <div key={lh.id} style={styleCardLichHen} data-testid={`lich-hen-item-${lh.id}`}>
                <div style={styleCardLichTop}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={styleMaHen}>#{lh.id}</span>
                      <StatusTag tone={tt.tone}>{tt.nhan}</StatusTag>
                      <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
                        Tạo lúc: {dinhDangThoiGian(lh.taoLuc)}
                      </span>
                    </div>
                    <div style={styleTenKhach}>
                      {lh.hoTen}
                    </div>
                  </div>

                  <div style={styleThoiGianHenKhoi}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-text-secondary)' }}>
                      THỜI GIAN HẸN XEM:
                    </span>
                    <span style={styleGioHen}>
                      ⏰ {dinhDangThoiGian(lh.thoiGianHen)}
                    </span>
                  </div>
                </div>

                <div style={styleChiTietLichGrid}>
                  <div>
                    <span style={styleNhanNho}>PHÒNG QUAN TÂM</span>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--ma-font-mono)', marginTop: 2 }}>
                      Phòng {lh.soPhong} · {lh.tenToaNha}
                    </div>
                  </div>

                  <div>
                    <span style={styleNhanNho}>SỐ ĐIỆN THOẠI KHÁCH</span>
                    <div style={{ marginTop: 2 }}>
                      <a href={`tel:${lh.soDienThoai}`} style={styleLinkSdt}>
                        📞 {lh.soDienThoai}
                      </a>
                    </div>
                  </div>

                  {lh.email && (
                    <div>
                      <span style={styleNhanNho}>EMAIL LIÊN HỆ</span>
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        ✉ {lh.email}
                      </div>
                    </div>
                  )}

                  {lh.ghiChu && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={styleNhanNho}>GHI CHÚ CỦA KHÁCH:</span>
                      <div style={styleGhiChuKhach}>
                        "{lh.ghiChu}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Thao tác chuyển đổi trạng thái */}
                <div style={styleThaoTacHang}>
                  <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
                    Cập nhật tiến trình tiếp khách:
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {lh.trangThai === 'CHO_XAC_NHAN' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => xuLyDoiTrangThai(lh.id, 'DA_XAC_NHAN')}
                      >
                        ✓ Đã gọi xác nhận
                      </Button>
                    )}

                    {lh.trangThai === 'DA_XAC_NHAN' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => xuLyDoiTrangThai(lh.id, 'DA_XEM')}
                      >
                        ✓ Khách đã xem phòng
                      </Button>
                    )}

                    {lh.trangThai !== 'HUY' && lh.trangThai !== 'DA_XEM' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => xuLyDoiTrangThai(lh.id, 'HUY')}
                      >
                        Huỷ lịch hẹn
                      </Button>
                    )}

                    {lh.trangThai === 'HUY' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => xuLyDoiTrangThai(lh.id, 'CHO_XAC_NHAN')}
                      >
                        Khôi phục lại
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styleKhungChinh: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ma-space-6)',
  maxWidth: '80rem',
  width: '100%',
  margin: '0 auto',
  padding: 'clamp(var(--ma-space-4), 3vw, var(--ma-space-8))',
}

const styleTieuDeManHinh: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-4)',
  paddingBottom: 'var(--ma-space-5)',
  borderBottom: 'var(--ma-border-width-rule) solid var(--ma-ink-900)',
}

const styleTieuDeH2: CSSProperties = {
  margin: 'var(--ma-space-2) 0 0',
  fontSize: 'clamp(22px, 4vw, 32px)',
  letterSpacing: 'var(--ma-tracking-title)',
  fontWeight: 700,
}

const styleHuyHieuCho: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 12,
  fontWeight: 700,
  padding: '4px 12px',
  background: 'var(--ma-urgent-bg)',
  color: 'var(--ma-urgent)',
  border: '1px solid var(--ma-urgent)',
  borderRadius: 'var(--ma-radius-pill)',
}

const styleThongBaoThanhCong: CSSProperties = {
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  background: 'var(--ma-done-bg)',
  color: 'var(--ma-done-text)',
  border: '1px solid var(--ma-done)',
  borderRadius: 'var(--ma-radius)',
  fontSize: 13,
  fontFamily: 'var(--ma-font-mono)',
}

const styleThanhBoLoc: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--ma-space-4)',
  padding: 'var(--ma-space-4)',
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-sm)',
}

const styleSelect: CSSProperties = {
  minHeight: 36,
  padding: '4px 10px',
  border: '1px solid var(--ma-border-strong)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13,
  borderRadius: 'var(--ma-radius)',
}

const styleChipButton: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 11,
  padding: '4px 10px',
  border: '1px solid var(--ma-border-dashed)',
  cursor: 'pointer',
  borderRadius: 'var(--ma-radius-pill)',
  transition: 'all 0.15s ease',
}

const styleKhungThongBao: CSSProperties = {
  border: '1px dashed var(--ma-border-dashed)',
  background: 'var(--ma-bg-card)',
  borderRadius: 'var(--ma-radius-md)',
  padding: 'var(--ma-space-8)',
  textAlign: 'center',
}

const styleCardLichHen: CSSProperties = {
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-sm)',
  background: 'var(--ma-bg-card)',
  padding: 'var(--ma-space-5)',
  display: 'grid',
  gap: 'var(--ma-space-4)',
  transition: 'box-shadow 0.2s ease',
}

const styleCardLichTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-3)',
  borderBottom: '1px solid var(--ma-border-subtle)',
  paddingBottom: 'var(--ma-space-3)',
}

const styleMaHen: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--ma-ink-900)',
}

const styleTenKhach: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
}

const styleThoiGianHenKhoi: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 2,
}

const styleGioHen: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--ma-ink-900)',
}

const styleChiTietLichGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'var(--ma-space-4)',
}

const styleNhanNho: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 10,
  letterSpacing: '0.06em',
  color: 'var(--ma-text-secondary)',
}

const styleLinkSdt: CSSProperties = {
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--ma-ink-900)',
  textDecoration: 'none',
}

const styleGhiChuKhach: CSSProperties = {
  padding: 'var(--ma-space-3)',
  background: 'var(--ma-bg-sunken)',
  borderLeft: '3px solid var(--ma-ink-900)',
  borderRadius: '0 var(--ma-radius) var(--ma-radius) 0',
  fontSize: 13,
  fontStyle: 'italic',
  marginTop: 4,
}

const styleThaoTacHang: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-3)',
  paddingTop: 'var(--ma-space-3)',
  borderTop: '1px dashed var(--ma-border-dashed)',
}

