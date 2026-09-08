import { useEffect, useState, type CSSProperties } from 'react'
import { ApiError, fetchHopDongCuaNguoiThue, type ThongTinHopDong } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Figure } from './design/core/Figure'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { Button } from './design/core/Button'
import { EmptyState } from './design/feedback/EmptyState'
import { MetaGrid, MetaItem, ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableFrame, TableHeadCell } from './design/layout/Screen'

type Props = {
  token: string
  mobile?: boolean
}

type TrangThaiHienThi = {
  key: 'far' | 'warning' | 'expired' | 'settled'
  nhan: string
  thongBao: string
  tone: 'neutral' | 'urgent' | 'closed'
}

export default function HopDongNguoiThue({ token, mobile = false }: Props) {
  const [hopDongs, setHopDongs] = useState<ThongTinHopDong[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    fetchHopDongCuaNguoiThue(token)
      .then((data) => {
        if (mounted) setHopDongs(data)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải thông tin hợp đồng.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [soLanTaiLai, token])

  if (dangTai) {
    return (
      <ScreenSurface data-testid="tenant-contract-screen" data-layout-variant={variant} aria-busy="true" aria-live="polite">
        Đang tải thông tin hợp đồng…
      </ScreenSurface>
    )
  }

  if (loi) {
    return (
      <ScreenSurface data-testid="tenant-contract-screen" data-layout-variant={variant} role="alert">
        <SysLabel>FR-POR-07</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
        <Button data-retry-tenant-contract variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>
          Thử lại
        </Button>
      </ScreenSurface>
    )
  }

  return (
    <ScreenSurface data-testid="tenant-contract-screen" data-layout-variant={variant} aria-labelledby="tenant-contract-title">
      <ScreenHeader>
        <SysLabel>FR-POR-07 · BR-14</SysLabel>
        <h3 id="tenant-contract-title" style={{ margin: '8px 0 0' }}>Hợp đồng của tôi</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>
          Thông tin chỉ đọc của các hợp đồng thuộc hồ sơ người thuê này. Cảnh báo hết hạn được tính theo ngày hiện tại.
        </p>
      </ScreenHeader>

      {hopDongs.length === 0 ? (
        <EmptyState
          data-contract-empty
          title="Chưa có hợp đồng nào"
          body="Hợp đồng sẽ xuất hiện tại đây sau khi hồ sơ của bạn được gắn với một hợp đồng thuê. Đây không phải lỗi kết nối."
        />
      ) : mobile ? (
        <div data-contract-list="mobile" style={{ display: 'grid', gap: 12 }}>
          {hopDongs.map((hopDong) => <HopDongCard key={hopDong.id} hopDong={hopDong} />)}
        </div>
      ) : (
        <HopDongTable hopDongs={hopDongs} />
      )}
    </ScreenSurface>
  )
}

function HopDongCard({ hopDong }: { hopDong: ThongTinHopDong }) {
  const trangThai = xacDinhTrangThai(hopDong)

  return (
    <article data-contract-card={hopDong.id} style={styleTheHopDong}>
      <header style={styleHangTieuDe}>
        <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <strong>Phòng {hopDong.soPhong}</strong>
          <span style={{ color: 'var(--ma-text-secondary)' }}>
            {dinhDangNgayIso(hopDong.ngayBatDau)} → {dinhDangNgayIso(hopDong.ngayKetThuc)}
          </span>
        </div>
        <StatusTag tone={trangThai.tone}>{trangThai.nhan}</StatusTag>
      </header>

      <ThongBaoTrangThai trangThai={trangThai} />
      <ThongTinHopDong hopDong={hopDong} />
    </article>
  )
}

function HopDongTable({ hopDongs }: { hopDongs: ThongTinHopDong[] }) {
  return (
    <TableFrame minWidth={820}>
      <thead>
        <tr>
          <TableHeadCell>Phòng / thời hạn</TableHeadCell>
          <TableHeadCell>Trạng thái</TableHeadCell>
          <TableHeadCell>Giá thuê / cọc</TableHeadCell>
          <TableHeadCell>Dịch vụ áp dụng</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {hopDongs.map((hopDong) => {
          const trangThai = xacDinhTrangThai(hopDong)
          return (
            <tr key={hopDong.id} data-contract-row={hopDong.id}>
              <TableCell header>
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong>Phòng {hopDong.soPhong}</strong>
                  <span style={{ color: 'var(--ma-text-secondary)', fontWeight: 400 }}>
                    {dinhDangNgayIso(hopDong.ngayBatDau)} → {dinhDangNgayIso(hopDong.ngayKetThuc)}
                  </span>
                </div>
              </TableCell>
              <TableCell><ThongBaoTrangThai trangThai={trangThai} compact /></TableCell>
              <TableCell><ThongTinTien hopDong={hopDong} /></TableCell>
              <TableCell><DanhSachDichVu hopDong={hopDong} /></TableCell>
            </tr>
          )
        })}
      </tbody>
    </TableFrame>
  )
}

function ThongTinHopDong({ hopDong }: { hopDong: ThongTinHopDong }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <MetaGrid>
        <MetaItem label="Thời gian thuê">
          {dinhDangNgayIso(hopDong.ngayBatDau)} → {dinhDangNgayIso(hopDong.ngayKetThuc)}
        </MetaItem>
        <MetaItem label="Giá thuê">
          <Figure value={dinhDangTien(hopDong.giaThue)} unit="₫" size="sm" />
        </MetaItem>
        <MetaItem label="Tiền cọc thoả thuận">
          <Figure value={dinhDangTien(hopDong.tienCoc)} unit="₫" size="sm" />
        </MetaItem>
      </MetaGrid>
      <div style={{ padding: 12, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }}>
        <strong>Dịch vụ áp dụng</strong>
        <DanhSachDichVu hopDong={hopDong} />
      </div>
    </div>
  )
}

function ThongTinTien({ hopDong }: { hopDong: ThongTinHopDong }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <span>Thuê: <Figure value={dinhDangTien(hopDong.giaThue)} unit="₫" size="xs" /></span>
      <span>Tiền cọc thoả thuận: <Figure value={dinhDangTien(hopDong.tienCoc)} unit="₫" size="xs" /></span>
    </div>
  )
}

function DanhSachDichVu({ hopDong }: { hopDong: ThongTinHopDong }) {
  if (hopDong.dichVuApDung.length === 0) {
    return <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)' }}>Không có dịch vụ áp dụng riêng.</p>
  }

  return (
    <ul style={{ display: 'grid', gap: 4, margin: '8px 0 0', paddingLeft: 18 }}>
      {hopDong.dichVuApDung.map((dichVu) => (
        <li key={dichVu.dichVuId}>
          {dichVu.tenDichVu} · {dinhDangTien(dichVu.donGiaApDung)} ₫
        </li>
      ))}
    </ul>
  )
}

function ThongBaoTrangThai({ trangThai, compact = false }: { trangThai: TrangThaiHienThi; compact?: boolean }) {
  return (
    <p
      data-contract-status={trangThai.key}
      role={trangThai.key === 'warning' || trangThai.key === 'expired' ? 'alert' : undefined}
      style={{
        ...styleThongBao,
        ...(compact ? { margin: 0, padding: '8px 10px' } : {}),
        ...(trangThai.key === 'warning' || trangThai.key === 'expired' ? styleThongBaoCanhBao : {}),
      }}
    >
      {trangThai.thongBao}
    </p>
  )
}

function xacDinhTrangThai(hopDong: ThongTinHopDong): TrangThaiHienThi {
  if (hopDong.trangThai === 'DA_THANH_LY') {
    return {
      key: 'settled',
      nhan: 'Đã thanh lý',
      thongBao: 'Đã thanh lý — chỉ xem lại thông tin hợp đồng.',
      tone: 'closed',
    }
  }

  if (hopDong.soNgayConLai < 0) {
    return {
      key: 'expired',
      nhan: 'Đã hết hạn',
      thongBao: `Hợp đồng đã hết hạn ngày ${dinhDangNgayIso(hopDong.ngayKetThuc)}.`,
      tone: 'urgent',
    }
  }

  if (hopDong.sapHetHan) {
    return {
      key: 'warning',
      nhan: 'Sắp hết hạn',
      thongBao: `Hợp đồng còn ${hopDong.soNgayConLai} ngày (hết hạn ${dinhDangNgayIso(hopDong.ngayKetThuc)}).`,
      tone: 'urgent',
    }
  }

  return {
    key: 'far',
    nhan: 'Còn hiệu lực',
    thongBao: `Hợp đồng còn hiệu lực đến ${dinhDangNgayIso(hopDong.ngayKetThuc)}.`,
    tone: 'neutral',
  }
}

const styleTheHopDong: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 16,
  border: '1px solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
  minWidth: 0,
}

const styleHangTieuDe: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const styleThongBao: CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderLeft: '3px solid var(--ma-border-strong)',
  background: 'var(--ma-bg-sunken)',
  lineHeight: 1.55,
}

const styleThongBaoCanhBao: CSSProperties = {
  borderLeftColor: 'var(--ma-urgent)',
  color: 'var(--ma-urgent)',
  background: 'var(--ma-urgent-bg)',
}
