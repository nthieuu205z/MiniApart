import { useEffect, useState } from 'react'
import { ApiError, fetchHopDongCuaNguoiThue, type ThongTinHopDong } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { Button } from './design/core/Button'
import { Icon, type IconName } from './design/core/Icon'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { DataTable } from './design/table/DataTable'
import { downloadManagementFile } from './managementApi'
import { Tieu } from './CanTra'
import './CanTra.css'

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
    <section {...khung} className={mobile ? 'nt' : undefined} aria-labelledby="tenant-contract-title" style={mobile ? undefined : { display: 'grid', gap: 12, minWidth: 0 }}>
      <div className="nt-dau">
        <Tieu mobile={mobile} id="tenant-contract-title" className={mobile ? 'sr-only' : 'nt-h1'}>{mobile ? 'Phòng tôi' : 'Hợp đồng của tôi'}</Tieu>
        <div className="nt-phu">
          {mobile
            ? hopDongs[0] ? `Phòng ${hopDongs[0].soPhong}` : null
            : 'Thông tin chỉ đọc của các hợp đồng thuộc hồ sơ người thuê này. Cảnh báo hết hạn được tính theo ngày hiện tại.'}
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
        <div data-contract-list="mobile" className="nt-than">
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
  const trangThai = xacDinhTrangThai(hopDong, true)
  const { dangTai, tai } = useTaiPdf(token)

  return (
    <div className="nt-than" data-contract-card={hopDong.id}>
      <section className="nt-khoi">
        <h2 className="nt-nhan">Hợp đồng thuê đến</h2>
        <div className="nt-so">{dinhDangNgayIso(hopDong.ngayKetThuc)}</div>
        <ThongBaoTrangThai trangThai={trangThai} mobile />
        <div className="nt-dong"><span className="nt-ten">Bắt đầu thuê</span><span className="nt-tien">{dinhDangNgayIso(hopDong.ngayBatDau)}</span></div>
        <div className="nt-dong"><span className="nt-ten">Tiền phòng</span><span className="nt-tien">{dinhDangTien(hopDong.giaThue)} ₫ / tháng</span></div>
        <div className="nt-dong"><span className="nt-ten">Tiền cọc thoả thuận</span><span className="nt-tien">{dinhDangTien(hopDong.tienCoc)} ₫</span></div>
      </section>

      <section className="nt-khoi" aria-labelledby={`dv-${hopDong.id}`}>
        <h2 className="nt-h2" id={`dv-${hopDong.id}`}>Giá dịch vụ</h2>
        <DanhSachDichVu hopDong={hopDong} />
      </section>

      <Button variant="secondary" className="btn-block" blocked={dangTai === hopDong.id} onClick={() => tai(hopDong.id)}>
        <Icon name="download" /> Tải hợp đồng (PDF)
      </Button>
    </div>
  )
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
    return <p className="nt-phu">Không có dịch vụ áp dụng riêng.</p>
  }

  return (
    <div>
      {hopDong.dichVuApDung.map((dichVu) => (
        <div key={dichVu.dichVuId} className="nt-dong">
          <span className="nt-ten">{dichVu.tenDichVu}</span>
          <span className="nt-tien">{dinhDangTien(dichVu.donGiaApDung)} ₫</span>
        </div>
      ))}
    </div>
  )
}

function ThongBaoTrangThai({ trangThai, compact = false, mobile = false }: { trangThai: TrangThaiHienThi; compact?: boolean; mobile?: boolean }) {
  const b = BANNER[trangThai.key]
  if (mobile && trangThai.key === 'far') return <p className="nt-phu" data-contract-status="far">{trangThai.thongBao}</p>
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

function xacDinhTrangThai(hopDong: ThongTinHopDong, mobile = false): TrangThaiHienThi {
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
    thongBao: mobile ? `Còn ${hopDong.soNgayConLai} ngày. Muốn trả phòng, báo trước ${hopDong.soNgayBaoTruoc} ngày.` : `Hợp đồng còn hiệu lực đến ${dinhDangNgayIso(hopDong.ngayKetThuc)}.`,
    tone: 'neutral',
  }
}
