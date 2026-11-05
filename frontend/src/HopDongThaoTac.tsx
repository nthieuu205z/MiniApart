import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { fetchHopDongQuanLy, fetchPhong, type ThongTinHopDong, type ThongTinPhong } from './api'
import { downloadManagementFile, managementRequest, type Service, type Tenant } from './managementApi'
import { BuildingSelect, Field, Feedback, SaveButton, fieldStyle, gridStyle, panelStyle, rowStyle, today, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import QuanLyTaiSanPhong from './QuanLyTaiSanPhong'

type Occupant = { id: number; hoTenNguoiThue: string; quanHe: string; tuNgay: string; denNgay: string | null }
type Settlement = { tongHoaDonCuoi: string; daThuCoc: string; congNo: string; khauTru: string; hoanCoc: string; hoaDonQuyetToanId: number | null }

const quickPresetButtonStyle: CSSProperties = {
  padding: '6px 12px',
  fontSize: 12,
  fontFamily: 'var(--ma-font-mono)',
  fontWeight: 600,
  borderRadius: 'var(--ma-radius-pill)',
  border: '1px solid var(--ma-brand-accent)',
  background: 'var(--ma-brand-accent-light)',
  color: 'var(--ma-brand-accent)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 10,
  borderBottom: '1px solid var(--ma-border-subtle)',
  paddingBottom: 12,
  marginBottom: 14,
}

export default function HopDongThaoTac({ token }: { token: string }) {
  const building = useBuildings(token)
  const [contracts, setContracts] = useState<ThongTinHopDong[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [rooms, setRooms] = useState<ThongTinPhong[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [occupants, setOccupants] = useState<Occupant[]>([])
  const [form, setForm] = useState({
    phongId: '',
    nguoiThueId: '',
    ngayBatDau: today(),
    ngayKetThuc: '',
    giaThue: '',
    tienCoc: '',
    soNgayBaoTruoc: '30',
  })
  const [applied, setApplied] = useState<Record<number, string>>({})
  const [occupant, setOccupant] = useState({ nguoiThueId: '', quanHe: '', tuNgay: today(), denNgay: '' })
  const [renewal, setRenewal] = useState({ ngayKetThuc: '', giaThue: '' })
  const [settle, setSettle] = useState<{ khauTruHuHong: string; lyDo: string; bienBanId?: number | null }>({ khauTruHuHong: '0', lyDo: '', bienBanId: null })
  const [bienBans, setBienBans] = useState<any[]>([])
  const [xacNhanKhauTruKhacBienBan, setXacNhanKhauTruKhacBienBan] = useState(false)
  const [finalReadings, setFinalReadings] = useState<Record<number, string>>({})
  const [confirmed, setConfirmed] = useState(false)
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const action = useAction()
  const contract = contracts.find((c) => c.id === selected)

  async function load() {
    if (!building.buildingId) return
    const [a, b, c, d] = await Promise.all([
      fetchHopDongQuanLy(token, building.buildingId),
      managementRequest<Tenant[]>(token, '/api/nguoi-thue'),
      fetchPhong(token, building.buildingId),
      managementRequest<Service[]>(token, `/api/toa-nha/${building.buildingId}/dich-vu`),
    ])
    setContracts(a)
    setTenants(b)
    setRooms(c)
    setServices(d)
  }

  useEffect(() => {
    setSelected(null)
    if (building.buildingId) void action.run(load, 'Đã tải dữ liệu hợp đồng.')
  }, [building.buildingId, token])

  useEffect(() => {
    setSettlement(null)
    setFinalReadings({})
    setConfirmed(false)
    setSettle({ khauTruHuHong: '0', lyDo: '', bienBanId: null })
    setBienBans([])
    setXacNhanKhauTruKhacBienBan(false)
    if (!selected) {
      setOccupants([])
      return
    }
    let active = true
    managementRequest<Occupant[]>(token, `/api/hop-dong/${selected}/nguoi-o-cung`)
      .then((rows) => {
        if (active) setOccupants(rows)
      })
      .catch((e: Error) => {
        if (active) action.setError(e.message)
      })
    return () => {
      active = false
    }
  }, [selected, token])

  async function create(e: FormEvent) {
    e.preventDefault()
    await action.run(async () => {
      const row = await managementRequest<ThongTinHopDong>(token, '/api/hop-dong', 'POST', {
        ...form,
        phongId: Number(form.phongId),
        nguoiThueId: Number(form.nguoiThueId),
        soNgayBaoTruoc: Number(form.soNgayBaoTruoc),
        dichVuApDung: Object.entries(applied).map(([id, price]) => ({
          dichVuId: Number(id),
          donGiaApDung: price || null,
        })),
      })
      await load()
      setSelected(row.id)
    }, 'Đã tạo hợp đồng chờ ký.')
  }

  async function command(path: string, body?: unknown) {
    if (!selected) return
    await action.run(async () => {
      await managementRequest(token, `/api/hop-dong/${selected}/${path}`, 'POST', body)
      await load()
    })
  }

  // ⚡ 1-chạm tính ngày kết thúc theo số tháng
  function chonThoiHan(thang: number) {
    const batDau = form.ngayBatDau || today()
    const d = new Date(batDau)
    d.setMonth(d.getMonth() + thang)
    const pad = (n: number) => String(n).padStart(2, '0')
    const ketThuc = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    setForm((prev) => ({ ...prev, ngayKetThuc: ketThuc }))
  }

  // ⚡ 1-chạm tính tiền cọc dựa trên giá phòng
  function chonTienCoc(heSo: number) {
    const gia = Number(form.giaThue) || 0
    if (gia > 0) {
      setForm((prev) => ({ ...prev, tienCoc: String(Math.round(gia * heSo)) }))
    } else {
      setForm((prev) => ({ ...prev, tienCoc: String(Math.round(3000000 * heSo)) }))
    }
  }

  // ⚡ 1-chạm áp dụng toàn bộ dịch vụ cơ bản
  function chonTatCaDichVu() {
    const copy: Record<number, string> = {}
    services.filter((s) => s.dangSuDung).forEach((s) => {
      copy[s.id] = ''
    })
    setApplied(copy)
  }

  function boChonTatCaDichVu() {
    setApplied({})
  }

  const phongChon = rooms.find((r) => r.id === Number(form.phongId))
  const nguoiThueChon = tenants.find((t) => t.id === Number(form.nguoiThueId))
  const giaThueSo = Number(form.giaThue) || 0
  const tienCocSo = Number(form.tienCoc) || 0
  const tongThanhToanDauKy = giaThueSo + tienCocSo

  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <div>
        <SysLabel>FR-TNT · QUẢN LÝ HỢP ĐỒNG THUÊ</SysLabel>
        <h2 style={{ margin: '4px 0 0', font: 'var(--ma-text-screen-title)' }}>Thao tác & Nghiệp vụ Hợp đồng</h2>
      </div>

      <Feedback error={action.error ?? building.error} success={action.success} />
      <BuildingSelect buildings={building.buildings} value={building.buildingId} onChange={building.setBuildingId} />

      {/* FORM TẠO HỢP ĐỒNG THUÊ VỚI TIỆN ÍCH 1-CHẠM */}
      <form onSubmit={create} style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>📝 Tạo hợp đồng thuê mới</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
              Hệ thống hỗ trợ phím tắt 1-chạm để tự động điền thời hạn, tiền cọc và biểu phí dịch vụ.
            </p>
          </div>
          <span style={{ fontSize: 12, fontFamily: 'var(--ma-font-mono)', background: 'var(--ma-brand-accent-light)', color: 'var(--ma-brand-accent)', padding: '4px 10px', borderRadius: 'var(--ma-radius-pill)', fontWeight: 600 }}>
            Tiện ích 1-chạm
          </span>
        </div>

        <div style={gridStyle}>
          <Field title="Phòng cần thuê">
            <select
              style={fieldStyle}
              required
              value={form.phongId}
              onChange={(e) => {
                const room = rooms.find((r) => r.id === Number(e.target.value))
                setForm({
                  ...form,
                  phongId: e.target.value,
                  giaThue: room?.giaThueMacDinh ?? form.giaThue,
                  tienCoc: room?.giaThueMacDinh ? room.giaThueMacDinh : form.tienCoc,
                })
              }}
            >
              <option value="">-- Chọn phòng --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id ?? ''}>
                  Phòng {r.soPhong} · Tầng {r.tang} · {r.tenTrangThai} ({dinhDangTien(r.giaThueMacDinh || '0')} đ)
                </option>
              ))}
            </select>
          </Field>

          <Field title="Người thuê đứng tên hợp đồng">
            <select
              style={fieldStyle}
              required
              value={form.nguoiThueId}
              onChange={(e) => setForm({ ...form, nguoiThueId: e.target.value })}
            >
              <option value="">-- Chọn người thuê --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.hoTen} · SĐT: {t.soDienThoai}
                </option>
              ))}
            </select>
          </Field>

          <Field title="Ngày bắt đầu">
            <input
              style={fieldStyle}
              required
              type="date"
              value={form.ngayBatDau}
              onChange={(e) => setForm({ ...form, ngayBatDau: e.target.value })}
            />
          </Field>

          <div>
            <Field title="Ngày kết thúc hợp đồng">
              <input
                style={fieldStyle}
                required
                type="date"
                min={form.ngayBatDau}
                value={form.ngayKetThuc}
                onChange={(e) => setForm({ ...form, ngayKetThuc: e.target.value })}
              />
            </Field>
            {/* Phím tắt thời hạn 1-chạm */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonThoiHan(3)}>⚡ 3 tháng</button>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonThoiHan(6)}>⚡ 6 tháng</button>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonThoiHan(12)}>⚡ 1 năm</button>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonThoiHan(24)}>⚡ 2 năm</button>
            </div>
          </div>

          <Field title="Giá thuê / tháng (đồng)">
            <input
              style={fieldStyle}
              required
              type="number"
              min="0"
              step="0.01"
              value={form.giaThue}
              onChange={(e) => setForm({ ...form, giaThue: e.target.value })}
              placeholder="VD: 4500000"
            />
          </Field>

          <div>
            <Field title="Tiền cọc cam kết (đồng)">
              <input
                style={fieldStyle}
                required
                type="number"
                min="0"
                step="0.01"
                value={form.tienCoc}
                onChange={(e) => setForm({ ...form, tienCoc: e.target.value })}
                placeholder="VD: 4500000"
              />
            </Field>
            {/* Phím tắt tiền cọc 1-chạm */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonTienCoc(1)}>⚡ Cọc 1 tháng</button>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonTienCoc(1.5)}>⚡ Cọc 1.5 tháng</button>
              <button type="button" style={quickPresetButtonStyle} onClick={() => chonTienCoc(2)}>⚡ Cọc 2 tháng</button>
            </div>
          </div>

          <Field title="Số ngày báo trước khi chuyển">
            <input
              style={fieldStyle}
              required
              type="number"
              min="1"
              step="1"
              value={form.soNgayBaoTruoc}
              onChange={(e) => setForm({ ...form, soNgayBaoTruoc: e.target.value })}
            />
          </Field>
        </div>

        {/* THẺ TÓM TẮT HỢP ĐỒNG TRỰC QUAN LIVE */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: 'var(--ma-radius-md)',
            padding: '20px 24px',
            boxShadow: 'var(--ma-shadow-md)',
            display: 'grid',
            gap: 14,
            marginTop: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Tóm tắt Hợp đồng & Chi phí kỳ đầu</span>
            </div>
            <span style={{ fontFamily: 'var(--ma-font-mono)', fontSize: 11, background: 'rgba(13, 148, 136, 0.25)', color: '#2DD4BF', padding: '3px 10px', borderRadius: 'var(--ma-radius-pill)', fontWeight: 600 }}>
              {form.ngayKetThuc ? 'ĐÃ ĐẶT HẠN' : 'CHỜ CHỌN THỜI HẠN'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--ma-font-mono)' }}>PHÒNG THUÊ</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>
                {phongChon ? `Phòng ${phongChon.soPhong} (Tầng ${phongChon.tang})` : '— Chưa chọn phòng —'}
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2 }}>
                {phongChon ? `${phongChon.dienTich} m² · ${phongChon.loaiPhong || 'Phòng tiêu chuẩn'}` : 'Vui lòng chọn phòng phía trên'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--ma-font-mono)' }}>NGƯỜI THUÊ</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>
                {nguoiThueChon ? nguoiThueChon.hoTen : '— Chưa chọn khách —'}
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2 }}>
                {nguoiThueChon ? `SĐT: ${nguoiThueChon.soDienThoai}` : 'Vui lòng chọn khách thuê'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--ma-font-mono)' }}>THỜI HẠN THUÊ</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>
                {form.ngayBatDau} → {form.ngayKetThuc || '...'}
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2 }}>
                Báo trước: {form.soNgayBaoTruoc} ngày
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--ma-font-mono)' }}>TỔNG TIỀN ĐẦU KỲ (THUÊ + CỌC)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#34D399', fontFamily: 'var(--ma-font-mono)', marginTop: 3 }}>
                {dinhDangTien(String(tongThanhToanDauKy))} đ
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                (Thuê: {dinhDangTien(String(giaThueSo))} đ + Cọc: {dinhDangTien(String(tienCocSo))} đ)
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG DỊCH VỤ ĐI KÈM */}
        <div style={{ borderTop: '1px solid var(--ma-border-default)', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <h4 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>⚡ Dịch vụ áp dụng cho hợp đồng</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={quickPresetButtonStyle} onClick={chonTatCaDichVu}>
                ✓ Chọn tất cả
              </button>
              <button type="button" style={{ ...quickPresetButtonStyle, background: 'transparent', borderColor: 'var(--ma-border-strong)', color: 'var(--ma-text-secondary)' }} onClick={boChonTatCaDichVu}>
                ✕ Bỏ chọn
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {services.filter((s) => s.dangSuDung).map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  background: s.id in applied ? 'var(--ma-brand-accent-light)' : 'var(--ma-bg-sunken)',
                  border: `1px solid ${s.id in applied ? 'var(--ma-brand-accent)' : 'var(--ma-border-default)'}`,
                  borderRadius: 'var(--ma-radius)',
                  transition: 'all 0.15s ease',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={s.id in applied}
                    onChange={(e) => {
                      const copy = { ...applied }
                      if (e.target.checked) copy[s.id] = ''
                      else delete copy[s.id]
                      setApplied(copy)
                    }}
                  />
                  <span>{s.ten}</span>
                </label>
                {s.id in applied ? (
                  <div style={{ width: 140 }}>
                    <input
                      style={{ ...fieldStyle, minHeight: 32, padding: '4px 8px', fontSize: 13 }}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Giá riêng"
                      value={applied[s.id]}
                      onChange={(e) => setApplied({ ...applied, [s.id]: e.target.value })}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
                    Bảng giá chuẩn
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
          <SaveButton busy={action.busy || !building.buildingId}>
            Tạo hợp đồng ngay
          </SaveButton>
        </div>
      </form>

      {/* KHU VỰC THAO TÁC HỢP ĐỒNG HIỆN CÓ */}
      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>🔍 Danh sách & Chi tiết Hợp đồng</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
              Chọn một hợp đồng để xuất PDF, xem người ở cùng, quản lý tài sản bàn giao hoặc thanh lý quyết toán.
            </p>
          </div>
        </div>

        <Field title="Chọn hợp đồng cần thao tác">
          <select
            style={fieldStyle}
            value={selected ?? ''}
            onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Chọn hợp đồng trong toà nhà --</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} · Phòng {c.soPhong} · {c.hoTenNguoiThue} · Trạng thái: {c.tenTrangThai} ({c.ngayBatDau} → {c.ngayKetThuc})
              </option>
            ))}
          </select>
        </Field>

        {contract ? (
          <>
            {/* THẺ CHI TIẾT HỢP ĐỒNG ĐƯỢC CHỌN */}
            <div
              style={{
                border: '1px solid var(--ma-border-default)',
                borderRadius: 'var(--ma-radius-md)',
                padding: '20px 22px',
                background: 'var(--ma-bg-sunken)',
                display: 'grid',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontFamily: 'var(--ma-font-mono)', fontSize: 12, color: 'var(--ma-brand-accent)', fontWeight: 700 }}>
                    HỢP ĐỒNG #{contract.id}
                  </span>
                  <h3 style={{ margin: '2px 0 0', font: 'var(--ma-text-task-name)' }}>
                    Phòng {contract.soPhong} · Khách thuê: {contract.hoTenNguoiThue}
                  </h3>
                </div>
                <StatusTag
                  tone={
                    contract.trangThai === 'HIEU_LUC'
                      ? 'done'
                      : contract.trangThai === 'CHO_KY'
                      ? 'urgent'
                      : contract.trangThai === 'DA_COC'
                      ? 'waiting'
                      : 'neutral'
                  }
                >
                  {contract.tenTrangThai}
                </StatusTag>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                <div style={{ background: 'var(--ma-bg-card)', padding: '10px 14px', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>THỜI HẠN HIỆU LỰC</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{contract.ngayBatDau} → {contract.ngayKetThuc}</div>
                </div>

                <div style={{ background: 'var(--ma-bg-card)', padding: '10px 14px', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>GIÁ THUÊ / THÁNG</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ma-brand-accent)', fontFamily: 'var(--ma-font-mono)', marginTop: 2 }}>
                    {dinhDangTien(contract.giaThue)} đ
                  </div>
                </div>

                <div style={{ background: 'var(--ma-bg-card)', padding: '10px 14px', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>TIỀN ĐẶT CỌC</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ma-ink-900)', fontFamily: 'var(--ma-font-mono)', marginTop: 2 }}>
                    {dinhDangTien(contract.tienCoc)} đ
                  </div>
                </div>
              </div>

              {/* CÁC THAO TÁC NHANH TRÊN HỢP ĐỒNG */}
              <div style={rowStyle}>
                <Button
                  variant="primary"
                  blocked={action.busy}
                  onClick={() =>
                    void action.run(
                      () =>
                        downloadManagementFile(
                          token,
                          `/api/hop-dong/${selected}/xuat-pdf`,
                          `hop-dong-${selected}.pdf`
                        ),
                      'Đã tải hợp đồng PDF chuẩn pháp lý.'
                    )
                  }
                >
                  📄 Tải hợp đồng PDF
                </Button>

                {contract.trangThai === 'CHO_KY' ? (
                  <Button blocked={action.busy} onClick={() => void command('nhan-coc')}>
                    ✓ Chuyển sang đã cọc
                  </Button>
                ) : null}

                {contract.trangThai === 'DA_COC' ? (
                  <Button blocked={action.busy} onClick={() => void command('kich-hoat')}>
                    ⚡ Kích hoạt hợp đồng
                  </Button>
                ) : null}

                <a
                  href="/thu-tien"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 'var(--ma-radius)',
                    background: 'var(--ma-bg-card)',
                    border: '1px solid var(--ma-border-default)',
                    color: 'var(--ma-text-primary)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  💰 Ghi nhận giao dịch cọc
                </a>
              </div>
            </div>

            {/* QUẢN LÝ TÀI SẢN BÀN GIAO & TỰ ĐỘNG KHẤU TRỪ VÀO THANH LÝ */}
            <QuanLyTaiSanPhong
              token={token}
              phongId={contract.phongId}
              soPhong={contract.soPhong}
              hopDongId={contract.id}
              onBienBanLoaded={setBienBans}
              onKhauTruThayDoi={(amount, reason) =>
                setSettle((prev) => ({
                  ...prev,
                  khauTruHuHong: String(amount),
                  lyDo: reason,
                }))
              }
            />

            {/* DANH SÁCH NGƯỜI Ở CÙNG */}
            <section style={{ ...panelStyle, background: 'var(--ma-bg-sunken)' }}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>👥 Người ở cùng phòng</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                    Khai báo tạm trú và thông tin người lưu trú cùng trong phòng.
                  </p>
                </div>
              </div>

              {occupants.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 13, fontStyle: 'italic' }}>
                  Chưa có người ở cùng nào được khai báo.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {occupants.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--ma-bg-card)',
                        borderRadius: 'var(--ma-radius)',
                        border: '1px solid var(--ma-border-default)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{o.hoTenNguoiThue} ({o.quanHe})</span>
                      <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)', fontFamily: 'var(--ma-font-mono)' }}>
                        {o.tuNgay} → {o.denNgay ?? 'Đang ở'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void action.run(async () => {
                    const result = await managementRequest<{ thongBaoCanhBao?: string }>(
                      token,
                      `/api/hop-dong/${selected}/nguoi-o-cung`,
                      'POST',
                      {
                        ...occupant,
                        nguoiThueId: Number(occupant.nguoiThueId),
                        denNgay: occupant.denNgay || null,
                      }
                    )
                    setOccupants(await managementRequest(token, `/api/hop-dong/${selected}/nguoi-o-cung`))
                    if (result.thongBaoCanhBao) action.setError(result.thongBaoCanhBao)
                  })
                }}
                style={{ display: 'grid', gap: 12, marginTop: 10 }}
              >
                <div style={gridStyle}>
                  <Field title="Người ở cùng">
                    <select
                      style={fieldStyle}
                      required
                      value={occupant.nguoiThueId}
                      onChange={(e) => setOccupant({ ...occupant, nguoiThueId: e.target.value })}
                    >
                      <option value="">Chọn hồ sơ người thuê</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.hoTen}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field title="Quan hệ với chủ hợp đồng">
                    <input
                      style={fieldStyle}
                      required
                      placeholder="VD: Bạn cùng phòng, Vợ, Em..."
                      value={occupant.quanHe}
                      onChange={(e) => setOccupant({ ...occupant, quanHe: e.target.value })}
                    />
                  </Field>
                  <Field title="Ở từ ngày">
                    <input
                      style={fieldStyle}
                      type="date"
                      required
                      value={occupant.tuNgay}
                      onChange={(e) => setOccupant({ ...occupant, tuNgay: e.target.value })}
                    />
                  </Field>
                  <Field title="Đến ngày (nếu có)">
                    <input
                      style={fieldStyle}
                      type="date"
                      value={occupant.denNgay}
                      onChange={(e) => setOccupant({ ...occupant, denNgay: e.target.value })}
                    />
                  </Field>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SaveButton busy={action.busy}>+ Thêm người ở cùng</SaveButton>
                </div>
              </form>
            </section>

            {/* GIA HẠN HỢP ĐỒNG */}
            {contract.trangThai === 'HIEU_LUC' && contract.sapHetHan ? (
              <form
                style={{ ...panelStyle, borderLeft: '4px solid var(--ma-amber-500)' }}
                onSubmit={(e) => {
                  e.preventDefault()
                  void command('gia-han', {
                    ngayKetThuc: renewal.ngayKetThuc,
                    giaThue: renewal.giaThue || null,
                  })
                }}
              >
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>⏳ Gia hạn hợp đồng sắp hết hạn</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                      Tự động tạo hợp đồng kế tiếp, kế thừa giá thuê và thông tin người thuê.
                    </p>
                  </div>
                </div>

                <div style={gridStyle}>
                  <Field title="Ngày kết thúc mới">
                    <input
                      style={fieldStyle}
                      type="date"
                      min={contract.ngayKetThuc}
                      required
                      value={renewal.ngayKetThuc}
                      onChange={(e) => setRenewal({ ...renewal, ngayKetThuc: e.target.value })}
                    />
                  </Field>
                  <Field title="Giá thuê mới (để trống: giữ nguyên)">
                    <input
                      style={fieldStyle}
                      type="number"
                      min="0"
                      step="0.01"
                      value={renewal.giaThue}
                      onChange={(e) => setRenewal({ ...renewal, giaThue: e.target.value })}
                    />
                  </Field>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SaveButton busy={action.busy}>Tạo hợp đồng gia hạn</SaveButton>
                </div>
              </form>
            ) : null}

            {/* THANH LÝ VÀ QUYẾT TOÁN */}
            {contract.trangThai !== 'DA_THANH_LY' ? (
              <form
                style={{ ...panelStyle, borderLeft: '4px solid var(--ma-urgent)' }}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!confirmed) return
                  void action.run(async () => {
                    const row = await managementRequest<ThongTinHopDong & { quyetToan: Settlement }>(
                      token,
                      `/api/hop-dong/${selected}/thanh-ly`,
                      'POST',
                      {
                        ...settle,
                        bienBanId: bienBans.find((b) => b.loaiBienBan === 'TRA_PHONG')?.id ?? settle.bienBanId ?? null,
                        chiSoCuoi: Object.entries(finalReadings)
                          .filter(([, v]) => v !== '')
                          .map(([id, value]) => ({
                            phongId: contract.phongId,
                            dichVuId: Number(id),
                            chiSoCuoi: value,
                            coThayCongTo: false,
                            xacNhanCanhBao: false,
                          })),
                      }
                    )
                    setSettlement(row.quyetToan)
                    await load()
                  }, 'Đã thanh lý hợp đồng và ghi nhận quyết toán.')
                }}
              >
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>🛑 Thanh lý hợp đồng & Quyết toán cọc</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                      Nhập chỉ số cuối, khấu trừ hư hại tài sản và tính tiền cọc hoàn lại cho khách thuê.
                    </p>
                  </div>
                </div>

                <div style={gridStyle}>
                  {services
                    .filter(
                      (s) =>
                        s.cachTinh === 'THEO_CHI_SO' &&
                        contract.dichVuApDung.some((d) => d.dichVuId === s.id)
                    )
                    .map((s) => (
                      <Field key={s.id} title={`Chỉ số cuối ${s.ten} (để trống: dùng số đã ghi)`}>
                        <input
                          style={fieldStyle}
                          type="number"
                          min="0"
                          step="0.01"
                          value={finalReadings[s.id] ?? ''}
                          onChange={(e) =>
                            setFinalReadings({ ...finalReadings, [s.id]: e.target.value })
                          }
                        />
                      </Field>
                    ))}

                  {(() => {
                    const bbTra = bienBans.find((b) => b.loaiBienBan === 'TRA_PHONG')
                    if (!bbTra) return null
                    const tienBb = String(bbTra.tongTienKhauTru || '0')
                    const lyDoBb =
                      bbTra.chiTiet
                        ?.filter((c: any) => Number(c.tienKhauTru) > 0)
                        ?.map((c: any) => `${c.tenTaiSan}: ${c.lyDoKhauTru || 'Hư hỏng'}`)
                        ?.join('; ') || bbTra.ghiChuChung || 'Khấu trừ theo biên bản trả phòng'
                    const daKhop = Number(settle.khauTruHuHong) === Number(tienBb)
                    return (
                      <>
                        <div
                          style={{
                            gridColumn: '1 / -1',
                            padding: '10px 14px',
                            background: daKhop ? 'var(--ma-brand-accent-light)' : '#FFFBEB',
                            border: `1px solid ${daKhop ? 'var(--ma-brand-accent)' : '#FDE68A'}`,
                            borderRadius: 'var(--ma-radius)',
                            fontSize: 13,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 10,
                          }}
                        >
                          <div>
                            <strong>📋 Đối chiếu biên bản trả phòng ({bbTra.ngayThucHien}):</strong> Khấu trừ{' '}
                            <span style={{ fontWeight: 700, color: 'var(--ma-urgent)' }}>{dinhDangTien(tienBb)} đ</span>
                            {daKhop ? (
                              <span style={{ marginLeft: 8, color: 'var(--ma-done-text)', fontWeight: 600 }}>
                                ✓ Đã khớp với thanh lý
                              </span>
                            ) : (
                              <span style={{ marginLeft: 8, color: '#B45309', fontWeight: 600 }}>
                                ⚠ Chưa khớp số tiền thanh lý ({dinhDangTien(settle.khauTruHuHong)} đ)
                              </span>
                            )}
                          </div>
                          {!daKhop && (
                            <button
                              type="button"
                              style={quickPresetButtonStyle}
                              onClick={() => {
                                setSettle((prev) => ({
                                  ...prev,
                                  khauTruHuHong: tienBb,
                                  lyDo: lyDoBb,
                                  bienBanId: bbTra.id,
                                }))
                                setXacNhanKhauTruKhacBienBan(false)
                              }}
                            >
                              ⚡ Áp dụng số liệu biên bản
                            </button>
                          )}
                        </div>

                        {!daKhop && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#B45309', fontWeight: 600 }}>
                              <input
                                type="checkbox"
                                checked={xacNhanKhauTruKhacBienBan}
                                onChange={(e) => setXacNhanKhauTruKhacBienBan(e.target.checked)}
                              />
                              <span>Xác nhận áp dụng số tiền quyết toán ({dinhDangTien(settle.khauTruHuHong)} đ) khác với biên bản trả phòng ({dinhDangTien(tienBb)} đ)</span>
                            </label>
                          </div>
                        )}
                      </>
                    )
                  })()}

                  <Field title="Khấu trừ hư hỏng (đồng)">
                    <input
                      style={fieldStyle}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={settle.khauTruHuHong}
                      onChange={(e) => setSettle({ ...settle, khauTruHuHong: e.target.value })}
                    />
                  </Field>

                  <Field title="Lý do khấu trừ / ghi chú thanh lý">
                    <textarea
                      style={{ ...fieldStyle, minHeight: 60 }}
                      required={Number(settle.khauTruHuHong) > 0}
                      value={settle.lyDo}
                      onChange={(e) => setSettle({ ...settle, lyDo: e.target.value })}
                    />
                  </Field>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>Đã kiểm tra chỉ số cuối, công nợ và khoản khấu trừ</span>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SaveButton busy={action.busy || !confirmed || (Boolean(bienBans.find((b) => b.loaiBienBan === 'TRA_PHONG') && Number(settle.khauTruHuHong) !== Number(bienBans.find((b) => b.loaiBienBan === 'TRA_PHONG')?.tongTienKhauTru || 0) && !xacNhanKhauTruKhacBienBan))}>
                    Thanh lý hợp đồng
                  </SaveButton>
                </div>
              </form>
            ) : null}

            {/* KẾT QUẢ QUYẾT TOÁN */}
            {settlement ? (
              <section
                style={{
                  ...panelStyle,
                  background: 'var(--ma-done-bg)',
                  border: '1px solid var(--ma-done)',
                }}
              >
                <div style={sectionHeaderStyle}>
                  <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)', color: 'var(--ma-done-text)' }}>
                    ✓ Kết quả Quyết toán Hợp đồng
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>HOÁ ĐƠN CUỐI</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{settlement.tongHoaDonCuoi} đ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>ĐÃ THU CỌC</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{settlement.daThuCoc} đ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>CÔNG NỢ CÒN LẠI</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{settlement.congNo} đ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>KHẤU TRỪ HƯ HẠI</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ma-urgent)' }}>{settlement.khauTru} đ</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: '12px 16px', background: '#FFFFFF', borderRadius: 'var(--ma-radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Tiền cọc hoàn lại cho khách:</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ma-done-text)', fontFamily: 'var(--ma-font-mono)' }}>
                    {settlement.hoanCoc} đ
                  </span>
                </div>

                {settlement.hoaDonQuyetToanId ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <a
                      href={`/thu-tien?hoaDonId=${settlement.hoaDonQuyetToanId}`}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--ma-ink-900)',
                        color: '#FFFFFF',
                        borderRadius: 'var(--ma-radius)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Thanh toán hoá đơn phần còn thiếu →
                    </a>
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </section>
  )
}
