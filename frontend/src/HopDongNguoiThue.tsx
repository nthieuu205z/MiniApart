import { useEffect, useState } from 'react'
import { ApiError, fetchHopDongCuaNguoiThue, fetchHoSoHopDong, type ThongTinHopDong, type HopDongHoSoDto } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { Button } from './design/core/Button'
import { Icon, type IconName } from './design/core/Icon'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { DataTable } from './design/table/DataTable'
import { downloadManagementFile } from './managementApi'

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

const BANNER: Record<TrangThaiHienThi['key'], { cls: string; icon: IconName }> = {
  far: { cls: 'banner-success', icon: 'check-circle' },
  warning: { cls: 'banner-warning', icon: 'clock' },
  expired: { cls: 'banner-danger', icon: 'alert' },
  settled: { cls: 'banner-info', icon: 'info' },
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

  const khung = { 'data-testid': 'tenant-contract-screen', 'data-layout-variant': variant }

  if (dangTai) {
    return <div {...khung}><EmptyState kind="loading" title="Đang tải thông tin hợp đồng" /></div>
  }

  if (loi) {
    return (
      <div {...khung} role="alert">
        <Card>
          <EmptyState kind="error" title="Không thể tải thông tin hợp đồng" body={loi} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button data-retry-tenant-contract variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>
              Thử lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <section {...khung} aria-labelledby="tenant-contract-title" style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div>
        <h1 id="tenant-contract-title" className={mobile ? 'sr-only' : undefined} style={{ margin: 0, font: '600 24px/1.2 var(--ma-font-ui)', letterSpacing: '-0.01em' }}>Hợp đồng của tôi</h1>
        <div style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-muted)', marginTop: 2 }}>
          Thông tin chỉ đọc của các hợp đồng thuộc hồ sơ người thuê này. Cảnh báo hết hạn được tính theo ngày hiện tại.
        </div>
      </div>

      {hopDongs.length === 0 ? (
        <Card>
          <EmptyState
            data-contract-empty
            title="Chưa có hợp đồng nào"
            body="Hợp đồng sẽ xuất hiện tại đây sau khi hồ sơ của bạn được gắn với một hợp đồng thuê. Đây không phải lỗi kết nối."
          />
        </Card>
      ) : mobile ? (
        <div data-contract-list="mobile" style={{ display: 'grid', gap: 12 }}>
          {hopDongs.map((hopDong) => <HopDongCard key={hopDong.id} hopDong={hopDong} token={token} />)}
        </div>
      ) : (
        <Card><HopDongTable hopDongs={hopDongs} token={token} /></Card>
      )}
    </section>
  )
}

function useTaiPdf(token: string) {
  const [dangTai, setDangTai] = useState<number | null>(null)
  const tai = async (id: number) => {
    setDangTai(id)
    try {
      await downloadManagementFile(token, `/api/hop-dong/${id}/xuat-pdf`, `hop-dong-${id}.pdf`)
    } finally {
      setDangTai(null)
    }
  }
  return { dangTai, tai }
}

function HopDongCard({ hopDong, token }: { hopDong: ThongTinHopDong; token: string }) {
  const trangThai = xacDinhTrangThai(hopDong)
  const { dangTai, tai } = useTaiPdf(token)
  const [hoSo, setHoSo] = useState<HopDongHoSoDto | null>(null)

  useEffect(() => {
    fetchHoSoHopDong(token, hopDong.id)
      .then(setHoSo)
      .catch(() => {})
  }, [hopDong.id, token])

  return (
    <Card data-contract-card={hopDong.id} style={{ gap: 14 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="h2" style={{ margin: 0 }}>Phòng {hopDong.soPhong}</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <TheTaiLieu hoSo={hoSo} />
          <StatusTag tone={trangThai.tone}>{trangThai.nhan}</StatusTag>
        </div>
      </header>

      <ThongBaoTrangThai trangThai={trangThai} />

      <div className="facts">
        <div className="fact"><div className="k">Bắt đầu</div><div className="v">{dinhDangNgayIso(hopDong.ngayBatDau)}</div></div>
        <div className="fact"><div className="k">Kết thúc</div><div className="v">{dinhDangNgayIso(hopDong.ngayKetThuc)}</div></div>
        <div className="fact"><div className="k">Giá thuê</div><div className="v">{dinhDangTien(hopDong.giaThue)} ₫</div></div>
        <div className="fact"><div className="k">Tiền cọc thoả thuận</div><div className="v">{dinhDangTien(hopDong.tienCoc)} ₫</div></div>
      </div>

      <div>
        <h3 className="h3" style={{ margin: '0 0 4px' }}>Dịch vụ áp dụng</h3>
        <DanhSachDichVu hopDong={hopDong} />
      </div>

      <Button className="btn-touch btn-block" blocked={dangTai === hopDong.id} onClick={() => tai(hopDong.id)}>
        <Icon name="download" /> Tải hợp đồng PDF
      </Button>
    </Card>
  )
}

function TheTaiLieu({ hoSo }: { hoSo: HopDongHoSoDto | null }) {
  if (!hoSo?.trangThaiTaiLieu) return <StatusTag tone="neutral">Hồ sơ lịch sử</StatusTag>
  return hoSo.trangThaiTaiLieu === 'DA_GHI_NHAN_KY'
    ? <StatusTag tone="done">Đã ký giấy</StatusTag>
    : hoSo.trangThaiTaiLieu === 'DA_CHOT'
      ? <StatusTag tone="waiting">Đã chốt</StatusTag>
      : <StatusTag tone="urgent">Bản dự thảo</StatusTag>
}

function HopDongTable({ hopDongs, token }: { hopDongs: ThongTinHopDong[]; token: string }) {
  const { dangTai, tai } = useTaiPdf(token)
  return (
    <DataTable
      rows={hopDongs}
      getRowId={(h) => h.id}
      noun="hợp đồng"
      rowProps={(h) => ({ 'data-contract-row': String(h.id) })}
      columns={[
        {
          key: 'phong',
          label: 'Phòng / thời hạn',
          render: (h) => (
            <div style={{ display: 'grid', gap: 2 }}>
              <strong>Phòng {h.soPhong}</strong>
              <span className="t-sm t-2">{dinhDangNgayIso(h.ngayBatDau)} → {dinhDangNgayIso(h.ngayKetThuc)}</span>
            </div>
          ),
        },
        { key: 'tt', label: 'Trạng thái', render: (h) => <ThongBaoTrangThai trangThai={xacDinhTrangThai(h)} compact /> },
        {
          key: 'tien',
          label: 'Giá thuê / cọc',
          render: (h) => (
            <div style={{ display: 'grid', gap: 2, whiteSpace: 'nowrap' }}>
              <span>Thuê: <b>{dinhDangTien(h.giaThue)} ₫</b></span>
              <span>Tiền cọc thoả thuận: <b>{dinhDangTien(h.tienCoc)} ₫</b></span>
            </div>
          ),
        },
        { key: 'dv', label: 'Dịch vụ áp dụng', render: (h) => <DanhSachDichVu hopDong={h} /> },
        {
          key: 'pdf',
          label: 'Thao tác',
          the: 'hanh-dong',
          render: (h) => (
            <Button variant="secondary" size="sm" blocked={dangTai === h.id} onClick={() => tai(h.id)}>
              <Icon name="download" /> Tải PDF
            </Button>
          ),
        },
      ]}
    />
  )
}

function DanhSachDichVu({ hopDong }: { hopDong: ThongTinHopDong }) {
  if (hopDong.dichVuApDung.length === 0) {
    return <p className="t-sm t-2" style={{ margin: '4px 0 0' }}>Không có dịch vụ áp dụng riêng.</p>
  }

  return (
    <div style={{ display: 'grid' }}>
      {hopDong.dichVuApDung.map((dichVu) => (
        <div key={dichVu.dichVuId} className="t-sm" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--ma-line-100)' }}>
          <span>{dichVu.tenDichVu}</span>
          <b style={{ whiteSpace: 'nowrap' }}>{dinhDangTien(dichVu.donGiaApDung)} ₫</b>
        </div>
      ))}
    </div>
  )
}

function ThongBaoTrangThai({ trangThai, compact = false }: { trangThai: TrangThaiHienThi; compact?: boolean }) {
  const b = BANNER[trangThai.key]
  return (
    <div
      data-contract-status={trangThai.key}
      role={trangThai.key === 'warning' || trangThai.key === 'expired' ? 'alert' : undefined}
      className={`banner ${b.cls}`}
      style={compact ? { padding: '8px 12px' } : undefined}
    >
      <Icon name={b.icon} size="sm" />
      <span>{trangThai.thongBao}</span>
    </div>
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
