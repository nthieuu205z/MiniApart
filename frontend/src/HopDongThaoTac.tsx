import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import {
  fetchHopDongQuanLy,
  fetchPhong,
  fetchHoSoHopDong,
  luuDraftHoSo,
  chotHoSoHopDong,
  ghiNhanKyHopDong,
  moLaiDraftHoSo,
  duyetNguoiOCung,
  tuChoiNguoiOCung,
  roiPhongNguoiOCung,
  kichHoatTaiKhoanNguoiOCung,
  fetchGiaDichVuPhong,
  themGiaDichVuPhong,
  xoaGiaDichVuPhong,
  fetchPhuLucHopDong,
  taoPhuLucHopDong,
  fetchCauHinhBenA,
  fetchMauHopDong,
  fetchMauHopDongChuan,
  type ThongTinHopDong,
  type ThongTinPhong,
  type HopDongHoSoDto,
  type HopDongPhuLucDto,
  type CauHinhBenADto,
  type MauHopDongDto,
  type ThongTinGiaDichVuPhongDto,
} from './api'
import { downloadManagementFile, managementRequest, type Service, type Tenant } from './managementApi'
import { BuildingSelect, Field, Feedback, SaveButton, fieldStyle, gridStyle, panelStyle, rowStyle, today, useAction, useBuildings } from './ManagementShared'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import QuanLyTaiSanPhong from './QuanLyTaiSanPhong'

type Occupant = {
  id: number
  hoTenNguoiThue: string
  quanHe?: string
  tuNgay: string
  denNgay?: string | null
  vaiTro?: string
  trangThai?: 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | 'DA_ROI_DI'
  soDienThoai?: string
  soGiayToChe?: string
  coTaiKhoan?: boolean
  lyDoTuChoi?: string
  lyDoRoiDi?: string
}
type Settlement = { tongHoaDonCuoi: string; daThuCoc: string; congNo: string; khauTru: string; hoanCoc: string; hoaDonQuyetToanId: number | null }

const quickPresetButtonStyle: CSSProperties = {
  padding: '6px 12px',
  minHeight: 44,
  fontSize: 13,
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

const tabActiveStyle: CSSProperties = {
  padding: '8px 16px',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13.5,
  fontWeight: 600,
  border: 'none',
  borderBottom: '3px solid var(--ma-brand-accent)',
  background: 'transparent',
  color: 'var(--ma-brand-accent)',
  cursor: 'pointer',
  marginBottom: -2,
}

const tabInactiveStyle: CSSProperties = {
  padding: '8px 16px',
  fontFamily: 'var(--ma-font-ui)',
  fontSize: 13.5,
  fontWeight: 500,
  border: 'none',
  borderBottom: '3px solid transparent',
  background: 'transparent',
  color: 'var(--ma-text-secondary)',
  cursor: 'pointer',
  marginBottom: -2,
}

export type FormTaoHopDong = { phongId: string; nguoiThueId: string; ngayBatDau: string; ngayKetThuc: string; giaThue: string; tienCoc: string; soNgayBaoTruoc: string }

/** Lỗi theo ô cho từng bước tạo hợp đồng (cùng ràng buộc với thuộc tính required/min của form cũ). */
export function kiemTraFormTao(f: FormTaoHopDong, buoc: 1 | 2 | 3 | 4 | 5): Partial<Record<keyof FormTaoHopDong, string>> {
  const e: Partial<Record<keyof FormTaoHopDong, string>> = {}
  const am = (v: string) => Number(v) < 0
  if (buoc === 1 || buoc === 5) {
    if (!f.phongId) e.phongId = 'Chọn phòng cần thuê.'
    if (!f.nguoiThueId) e.nguoiThueId = 'Chọn người thuê đứng tên hợp đồng.'
  }
  if (buoc === 2 || buoc === 5) {
    if (!f.ngayBatDau) e.ngayBatDau = 'Nhập ngày bắt đầu.'
    if (!f.ngayKetThuc) e.ngayKetThuc = 'Nhập ngày kết thúc.'
    else if (f.ngayBatDau && f.ngayKetThuc < f.ngayBatDau) e.ngayKetThuc = 'Ngày kết thúc không được trước ngày bắt đầu.'
    if (f.giaThue === '' || Number.isNaN(Number(f.giaThue)) || am(f.giaThue)) e.giaThue = 'Nhập giá thuê từ 0 trở lên.'
  }
  if (buoc === 4 || buoc === 5) {
    if (f.tienCoc === '' || Number.isNaN(Number(f.tienCoc)) || am(f.tienCoc)) e.tienCoc = 'Nhập tiền cọc từ 0 trở lên.'
    if (!(Number(f.soNgayBaoTruoc) >= 1) || !Number.isInteger(Number(f.soNgayBaoTruoc))) e.soNgayBaoTruoc = 'Nhập số ngày báo trước (số nguyên từ 1).'
  }
  return e
}

/** State + hành vi của form tạo hợp đồng; dùng chung cho form cũ trong HopDongThaoTac và luồng 5 bước TaoHopDong. */
export function useFormTaoHopDong(rooms: ThongTinPhong[], tenants: Tenant[], services: Service[], macDinh?: Partial<FormTaoHopDong>) {
  const [form, setForm] = useState<FormTaoHopDong>({
    phongId: '',
    nguoiThueId: '',
    ngayBatDau: today(),
    ngayKetThuc: '',
    giaThue: '',
    tienCoc: '',
    soNgayBaoTruoc: '30',
    ...macDinh,
  })
  const [applied, setApplied] = useState<Record<number, string>>({})

  function chonPhong(phongId: string) {
    const room = rooms.find((r) => r.id === Number(phongId))
    setForm((prev) => ({
      ...prev,
      phongId,
      giaThue: room?.giaThueMacDinh ?? prev.giaThue,
      tienCoc: room?.giaThueMacDinh ? room.giaThueMacDinh : prev.tienCoc,
    }))
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

  const taoBody = () => ({
    ...form,
    phongId: Number(form.phongId),
    nguoiThueId: Number(form.nguoiThueId),
    soNgayBaoTruoc: Number(form.soNgayBaoTruoc),
    dichVuApDung: Object.entries(applied).map(([id, price]) => ({
      dichVuId: Number(id),
      donGiaApDung: price || null,
    })),
  })

  const phongChon = rooms.find((r) => r.id === Number(form.phongId))
  const nguoiThueChon = tenants.find((t) => t.id === Number(form.nguoiThueId))
  const giaThueSo = Number(form.giaThue) || 0
  const tienCocSo = Number(form.tienCoc) || 0
  const tongThanhToanDauKy = giaThueSo + tienCocSo

  return { form, setForm, applied, setApplied, chonPhong, chonThoiHan, chonTienCoc, chonTatCaDichVu, boChonTatCaDichVu, phongChon, nguoiThueChon, giaThueSo, tienCocSo, tongThanhToanDauKy, taoBody }
}

export type ThaoTacHopDong = 'GIA_HAN' | 'KY' | 'THANH_LY' | 'PHU_LUC' | 'NGUOI_O_CUNG'

export type HopDongThaoTacProps = {
  token: string
  buildingId?: number | null
  onBuildingChange?: (id: number | null) => void
  selectedHopDongId?: number | null
  onSelectHopDong?: (id: number | null) => void
  hienThiFormTao?: boolean
  onToggleFormTao?: (show: boolean) => void
  onDongChiTiet?: () => void
  embedded?: boolean
  /** Chỉ với `embedded`: hiện riêng một thao tác thay vì cả màn. */
  thaoTac?: ThaoTacHopDong
}

export default function HopDongThaoTac({
  token,
  buildingId,
  onBuildingChange,
  selectedHopDongId,
  onSelectHopDong,
  hienThiFormTao = false,
  onToggleFormTao,
  onDongChiTiet,
  embedded = false,
  thaoTac,
}: HopDongThaoTacProps) {
  const building = useBuildings(token)
  const isControlled = selectedHopDongId !== undefined
  const [internalSelected, setInternalSelected] = useState<number | null>(null)
  const selected = isControlled ? selectedHopDongId : internalSelected

  const setSelected = useCallback((id: number | null) => {
    setInternalSelected(id)
    onSelectHopDong?.(id)
  }, [onSelectHopDong])

  const activeBuildingId = buildingId !== undefined ? buildingId : building.buildingId
  const prevBuildingIdRef = useRef<number | null>(activeBuildingId)

  useEffect(() => {
    if (buildingId !== undefined && buildingId !== null && buildingId !== building.buildingId) {
      building.setBuildingId(buildingId)
    }
  }, [buildingId, building.buildingId])

  const [contracts, setContracts] = useState<ThongTinHopDong[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [rooms, setRooms] = useState<ThongTinPhong[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [tabHienTai, setTabHienTai] = useState<'HO_SO' | 'CU_TRU' | 'TAI_SAN' | 'QUYET_TOAN'>('HO_SO')
  const [moFormTao, setMoFormTao] = useState(Boolean(hienThiFormTao))

  useEffect(() => {
    if (hienThiFormTao !== undefined) {
      setMoFormTao(hienThiFormTao)
    }
  }, [hienThiFormTao])

  const cheDoTaoMoiThucTe = embedded ? Boolean(hienThiFormTao) : moFormTao
  const dossierRef = useRef<HTMLDivElement>(null)
  const lastScrolledHopDongIdRef = useRef<number | null>(null)
  const [occupants, setOccupants] = useState<Occupant[]>([])
  const { form, setForm, applied, setApplied, chonPhong, chonThoiHan, chonTienCoc, chonTatCaDichVu, boChonTatCaDichVu, phongChon, nguoiThueChon, giaThueSo, tienCocSo, tongThanhToanDauKy, taoBody } = useFormTaoHopDong(rooms, tenants, services)
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

  // Dossier state
  const [hoSo, setHoSo] = useState<HopDongHoSoDto | null>(null)
  const [phuLucList, setPhuLucList] = useState<HopDongPhuLucDto[]>([])
  const [cauHinhBenA, setCauHinhBenA] = useState<CauHinhBenADto | null>(null)
  const [mauList, setMauList] = useState<MauHopDongDto[]>([])
  const [buocDangChon, setActiveStep] = useState<number>(1)
  const tt = embedded ? thaoTac : undefined // chỉ hiện đúng một thao tác trong ngăn của hồ sơ 360
  const activeStep = tt === 'KY' || tt === 'PHU_LUC' ? 5 : buocDangChon
  const [dossierForm, setDossierForm] = useState<Partial<HopDongHoSoDto>>({})
  const [xacNhanChot, setXacNhanChot] = useState(false)
  const [signingForm, setSigningForm] = useState({ ngayKy: today(), ghiChuKy: '', fileScanDinhKem: '' })
  const [phuLucForm, setPhuLucForm] = useState({ tieuDe: '', ngayLap: today(), ngayHieuLuc: today(), noiDungThayDoi: '' })
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; confirmLabel?: string } | null>(null)
  const [promptDialog, setPromptDialog] = useState<{ title: string; message: string; placeholder?: string; defaultValue?: string; confirmLabel?: string; tone?: 'primary' | 'urgent'; onConfirm: (val: string) => void } | null>(null)
  const requestGenRef = useRef(0)
  const currentHopDongIdRef = useRef<number | null>(null)
  const selectedHopDongIdRef = useRef<number | null>(selected)
  selectedHopDongIdRef.current = selected

  useEffect(() => {
    if (selected == null || cheDoTaoMoiThucTe) {
      lastScrolledHopDongIdRef.current = null
      return
    }

    if (hoSo?.hopDongId === selected || action.error) {
      if (lastScrolledHopDongIdRef.current !== selected) {
        lastScrolledHopDongIdRef.current = selected
        dossierRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [selected, hoSo?.hopDongId, cheDoTaoMoiThucTe, action.error])

  async function loadDossier(hopDongId: number) {
    if (hopDongId !== selectedHopDongIdRef.current) {
      return
    }
    const gen = ++requestGenRef.current
    currentHopDongIdRef.current = hopDongId
    setHoSo(null)
    setPhuLucList([])
    setDossierForm({})
    try {
      const [dossier, phuLucs] = await Promise.all([
        fetchHoSoHopDong(token, hopDongId),
        fetchPhuLucHopDong(token, hopDongId).catch(() => []),
      ])
      if (
        requestGenRef.current !== gen ||
        currentHopDongIdRef.current !== hopDongId ||
        selectedHopDongIdRef.current !== hopDongId
      ) {
        return
      }
      setHoSo(dossier)
      setPhuLucList(phuLucs)
      setDossierForm({
        tieuDe: dossier.tieuDe || 'HỢP ĐỒNG THUÊ PHÒNG',
        ngayLap: dossier.ngayLap || today(),
        diaDiemLap: dossier.diaDiemLap || 'Hà Nội',
        mucDichThue: dossier.mucDichThue || 'Để ở',
        phamViSuDung: dossier.phamViSuDung || 'Sử dụng riêng diện tích phòng thuê và sử dụng chung các tiện ích công cộng của toà nhà theo nội quy.',
        ngayNhanPhong: dossier.ngayNhanPhong || '',
        phuongThucThanhToan: dossier.phuongThucThanhToan || 'CHUYEN_KHOAN',
        kyThanhToanThang: dossier.kyThanhToanThang ?? 1,
        hanThanhToanNgay: dossier.hanThanhToanNgay ?? 5,
        soNguoiToiDa: dossier.soNguoiToiDa ?? 2,
        soNgayBaoTruocGiaHan: dossier.soNgayBaoTruocGiaHan ?? (contract?.soNgayBaoTruoc || 30),
        soNgayHoanCoc: dossier.soNgayHoanCoc ?? 7,
        khungGioYenTinh: dossier.khungGioYenTinh || '22:00 - 06:00 hàng ngày',
        taiKhoanNhanTien: dossier.taiKhoanNhanTien || '',
        dieuKienDieuChinhGia: dossier.dieuKienDieuChinhGia || 'Giá thuê giữ nguyên trong suốt thời hạn hợp đồng, trừ trường hợp có thỏa thuận bằng văn bản.',
        bienBanBanGiaoId: dossier.bienBanBanGiaoId,
        benALoaiChuThe: dossier.benALoaiChuThe || 'CA_NHAN',
        benATenChuThe: dossier.benATenChuThe || '',
        benADinhDanh: dossier.benADinhDanh || '',
        benADiaChi: dossier.benADiaChi || '',
        benADienThoai: dossier.benADienThoai || '',
        benAEmail: dossier.benAEmail || '',
        benANguoiKy: dossier.benANguoiKy || '',
        benAChucVu: dossier.benAChucVu || 'Chủ sở hữu',
        benATuCachKy: dossier.benATuCachKy || 'CHU_SO_HUU',
        benACanCuUyQuyen: dossier.benACanCuUyQuyen || '',
        benADonViQuanLy: dossier.benADonViQuanLy || '',
        benBHoTen: dossier.benBHoTen || '',
        benBNgaySinh: dossier.benBNgaySinh || '',
        benBLoaiGiayTo: dossier.benBLoaiGiayTo || 'CCCD',
        benBSoGiayTo: dossier.benBSoGiayTo || '',
        benBNgayCap: dossier.benBNgayCap || '',
        benBNoiCap: dossier.benBNoiCap || '',
        benBThuongTru: dossier.benBThuongTru || '',
        benBLienHe: dossier.benBLienHe || '',
        benBDienThoai: dossier.benBDienThoai || '',
        benBEmail: dossier.benBEmail || '',
        dieuKhoanTuyBien: dossier.dieuKhoanTuyBien || '',
      })
    } catch (err: any) {
      if (
        requestGenRef.current === gen &&
        currentHopDongIdRef.current === hopDongId &&
        selectedHopDongIdRef.current === hopDongId
      ) {
        action.setError(err.message || 'Không thể tải hồ sơ hợp đồng.')
      }
    }
  }

  async function runScopedMutation(
    targetHopDongId: number,
    mutationFn: () => Promise<unknown>,
    successMessage: string
  ) {
    if (!targetHopDongId || targetHopDongId !== selectedHopDongIdRef.current) {
      return
    }
    const expectedGen = requestGenRef.current
    action.setBusy(true)
    action.setError(null)
    action.setSuccess(null)

    try {
      await mutationFn()

      if (
        selectedHopDongIdRef.current !== targetHopDongId ||
        requestGenRef.current !== expectedGen
      ) {
        return
      }

      await loadDossier(targetHopDongId)

      if (
        selectedHopDongIdRef.current === targetHopDongId &&
        currentHopDongIdRef.current === targetHopDongId
      ) {
        action.setSuccess(successMessage)
      }
    } catch (err: any) {
      if (
        selectedHopDongIdRef.current === targetHopDongId &&
        requestGenRef.current === expectedGen
      ) {
        action.setError(err.message || 'Thao tác thất bại.')
      }
    } finally {
      action.setBusy(false)
    }
  }

  function napTuCauHinhBenA() {
    if (!cauHinhBenA) return
    setDossierForm((prev) => ({
      ...prev,
      benALoaiChuThe: cauHinhBenA.loaiChuThe,
      benATenChuThe: cauHinhBenA.tenChuThe,
      benADinhDanh: cauHinhBenA.maSoDinhDanh,
      benADiaChi: cauHinhBenA.diaChiLienHe,
      benADienThoai: cauHinhBenA.soDienThoai,
      benAEmail: cauHinhBenA.email || '',
      benANguoiKy: cauHinhBenA.hoTenNguoiKy,
      benAChucVu: cauHinhBenA.chucVuNguoiKy || 'Chủ sở hữu',
      benATuCachKy: cauHinhBenA.tuCachKy,
      benACanCuUyQuyen: cauHinhBenA.canCuUyQuyen || '',
      taiKhoanNhanTien: cauHinhBenA.soTaiKhoan
        ? `${cauHinhBenA.soTaiKhoan} - ${cauHinhBenA.tenNganHang} (${cauHinhBenA.chuTaiKhoan})`
        : prev.taiKhoanNhanTien,
    }))
  }

  const loadGenRef = useRef(0)
  const currentBuildingIdRef = useRef<number | null>(null)

  async function load(targetBuildingId?: number | null) {
    const bId = targetBuildingId !== undefined ? targetBuildingId : activeBuildingId
    if (!bId) return
    const gen = ++loadGenRef.current
    currentBuildingIdRef.current = bId

    const [a, b, c, d, benA, maus] = await Promise.all([
      fetchHopDongQuanLy(token, bId),
      managementRequest<Tenant[]>(token, '/api/nguoi-thue'),
      fetchPhong(token, bId),
      managementRequest<Service[]>(token, `/api/toa-nha/${bId}/dich-vu`),
      fetchCauHinhBenA(token, bId).catch(() => null),
      fetchMauHopDong(token, bId).catch(() => []),
    ])

    if (loadGenRef.current !== gen || currentBuildingIdRef.current !== bId) {
      return
    }

    setContracts(a)
    setTenants(b)
    setRooms(c)
    setServices(d)
    setCauHinhBenA(benA)
    setMauList(maus)
  }

  useEffect(() => {
    if (prevBuildingIdRef.current !== activeBuildingId) {
      prevBuildingIdRef.current = activeBuildingId
      if (!isControlled) {
        setSelected(null)
      }
    }
    if (activeBuildingId) void action.run(() => load(activeBuildingId), 'Đã tải dữ liệu hợp đồng.')
  }, [activeBuildingId, token, isControlled])

  useEffect(() => {
    selectedHopDongIdRef.current = selected
    action.setError(null)
    action.setSuccess(null)
    setSettlement(null)
    setFinalReadings({})
    setConfirmed(false)
    setSettle({ khauTruHuHong: '0', lyDo: '', bienBanId: null })
    setBienBans([])
    setXacNhanKhauTruKhacBienBan(false)
    setHoSo(null)
    setPhuLucList([])
    setActiveStep(1)
    setXacNhanChot(false)
    if (!selected) {
      setOccupants([])
      return
    }
    let active = true
    managementRequest<Occupant[]>(token, `/api/hop-dong/${selected}/nguoi-o-cung`)
      .then((rows) => {
        if (active && selectedHopDongIdRef.current === selected) setOccupants(rows)
      })
      .catch((e: Error) => {
        if (active && selectedHopDongIdRef.current === selected) action.setError(e.message)
      })
    loadDossier(selected)
    return () => {
      active = false
    }
  }, [selected, token])

  async function create(e: FormEvent) {
    e.preventDefault()
    await action.run(async () => {
      const row = await managementRequest<ThongTinHopDong>(token, '/api/hop-dong', 'POST', taoBody())
      await load(activeBuildingId)
      setSelected(row.id)
      setMoFormTao(false)
      onToggleFormTao?.(false)
    }, 'Đã tạo hợp đồng chờ ký.')
  }

  async function command(path: string, body?: unknown) {
    if (!selected) return
    await action.run(async () => {
      await managementRequest(token, `/api/hop-dong/${selected}/${path}`, 'POST', body)
      await load(activeBuildingId)
    })
  }

  return (
    <section style={{ display: 'grid', gap: 24, minWidth: 0, maxWidth: '100%' }}>
      {!embedded && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <SysLabel>QUẢN LÝ HỢP ĐỒNG THUÊ</SysLabel>
              <h2 style={{ margin: '4px 0 0', font: 'var(--ma-text-screen-title)' }}>Thao tác & Nghiệp vụ Hợp đồng</h2>
            </div>
            <Button
              variant="secondary"
              onClick={() => setMoFormTao(!moFormTao)}
            >
              {moFormTao ? '✕ Đóng form tạo' : '+ Tạo hợp đồng mới'}
            </Button>
          </div>

          <Feedback error={action.error ?? building.error} success={action.success} />
          <BuildingSelect buildings={building.buildings} value={building.buildingId} onChange={building.setBuildingId} />
        </>
      )}

      {embedded && <Feedback error={action.error} success={action.success} />}

      {/* FORM TẠO HỢP ĐỒNG THUÊ: Chỉ xuất hiện khi người dùng chọn tạo mới */}
      {cheDoTaoMoiThucTe && (
        <form onSubmit={create} style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>📝 Tạo hợp đồng thuê mới</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
              Hệ thống hỗ trợ phím tắt 1-chạm để tự động điền thời hạn, tiền cọc và biểu phí dịch vụ.
            </p>
          </div>
          <span style={{ fontSize: 12, background: 'var(--ma-brand-accent-light)', color: 'var(--ma-brand-accent)', padding: '4px 10px', borderRadius: 'var(--ma-radius-pill)', fontWeight: 600 }}>
            Tiện ích 1-chạm
          </span>
        </div>

        <div style={gridStyle}>
          <Field title="Phòng cần thuê">
            <select
              style={fieldStyle}
              required
              value={form.phongId}
              onChange={(e) => chonPhong(e.target.value)}
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
            background: 'var(--ma-bg-card)',
            color: 'var(--ma-text-primary)',
            borderRadius: 'var(--ma-radius-md)',
            border: '1px solid var(--ma-border-default)',
            padding: '20px 24px',
            boxShadow: 'var(--ma-shadow-sm)',
            display: 'grid',
            gap: 16,
            marginTop: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ma-border-subtle)', paddingBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Tóm tắt Hợp đồng & Chi phí tháng đầu</span>
            <span style={{ fontSize: 11, background: 'var(--ma-brand-accent-light)', color: 'var(--ma-brand-accent)', padding: '3px 10px', borderRadius: 'var(--ma-radius-pill)', fontWeight: 600 }}>
              {form.ngayKetThuc ? 'ĐÃ ĐẶT HẠN' : 'CHỜ CHỌN THỜI HẠN'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16, minWidth: 0 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>PHÒNG THUÊ</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                {phongChon ? `Phòng ${phongChon.soPhong} (Tầng ${phongChon.tang})` : '— Chưa chọn phòng —'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ma-text-secondary)', marginTop: 2 }}>
                {phongChon ? `${phongChon.dienTich} m² · ${phongChon.loaiPhong || 'Phòng tiêu chuẩn'}` : 'Vui lòng chọn phòng phía trên'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>NGƯỜI THUÊ</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                {nguoiThueChon ? nguoiThueChon.hoTen : '— Chưa chọn khách —'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ma-text-secondary)', marginTop: 2 }}>
                {nguoiThueChon ? `SĐT: ${nguoiThueChon.soDienThoai}` : 'Vui lòng chọn khách thuê'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>THỜI HẠN THUÊ</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                {form.ngayBatDau} → {form.ngayKetThuc || '...'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ma-text-secondary)', marginTop: 2 }}>
                Báo trước: {form.soNgayBaoTruoc} ngày
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>TỔNG TIỀN ĐẦU KỲ (THUÊ + CỌC)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ma-done-text)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
                {dinhDangTien(String(tongThanhToanDauKy))} đ
              </div>
              <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)', marginTop: 2 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12, minWidth: 0 }}>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, cursor: 'pointer', fontWeight: 600 }}>
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
                  <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>
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
      )}

      {/* KHU VỰC THAO TÁC HỢP ĐỒNG HIỆN CÓ: Chỉ xuất hiện khi xem hồ sơ */}
      {!cheDoTaoMoiThucTe && (
      <section ref={dossierRef} style={{ ...panelStyle, minWidth: 0, maxWidth: '100%' }} data-testid="contract-dossier-panel">
        {!embedded && (
          <>
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
          </>
        )}

        {action.busy && !contract && selected ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }}>
            Đang tải thông tin hợp đồng #{selected}…
          </div>
        ) : contract ? (
          <>
            {/* THẺ CHI TIẾT HỢP ĐỒNG ĐƯỢC CHỌN */}
            {!tt && (
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
                  <span style={{ fontSize: 12, color: 'var(--ma-brand-accent)', fontWeight: 600 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 14, minWidth: 0 }}>
                <div style={{ background: 'var(--ma-bg-card)', padding: '10px 14px', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>THỜI HẠN HIỆU LỰC</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{contract.ngayBatDau} → {contract.ngayKetThuc}</div>
                </div>

                <div style={{ background: 'var(--ma-bg-card)', padding: '10px 14px', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>GIÁ THUÊ / THÁNG</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ma-brand-accent)', marginTop: 2 }}>
                    {dinhDangTien(contract.giaThue)} đ
                  </div>
                </div>

                <div style={{ background: 'var(--ma-bg-card)', padding: '10px 14px', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>TIỀN ĐẶT CỌC</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ma-ink-900)', marginTop: 2 }}>
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
            )}

            {/* KHU VỰC BỘ HỒ SƠ HỢP ĐỒNG THUÊ & CHỐT PHÁP LÝ (5 BƯỚC) */}
            {tt === 'KY' && (contract.trangThai === 'CHO_KY' || contract.trangThai === 'DA_COC') ? (
              <div style={rowStyle}>
                {contract.trangThai === 'CHO_KY' ? <Button blocked={action.busy} onClick={() => void command('nhan-coc')}>✓ Chuyển sang đã cọc</Button> : null}
                {contract.trangThai === 'DA_COC' ? <Button blocked={action.busy} onClick={() => void command('kich-hoat')}>⚡ Kích hoạt hợp đồng</Button> : null}
              </div>
            ) : null}
            {(!tt || tt === 'KY' || tt === 'PHU_LUC') && (
            <div style={{ ...panelStyle, background: 'var(--ma-bg-card)', border: '1px solid var(--ma-border-strong)', padding: '20px 22px' }}>
              <div style={sectionHeaderStyle}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Hồ sơ hợp đồng thuê & Chốt pháp lý</h3>
                    <StatusTag
                      tone={
                        hoSo?.trangThaiTaiLieu === 'DA_GHI_NHAN_KY'
                          ? 'done'
                          : hoSo?.trangThaiTaiLieu === 'DA_CHOT'
                          ? 'waiting'
                          : 'urgent'
                      }
                    >
                      {hoSo?.trangThaiTaiLieu === 'DA_GHI_NHAN_KY'
                        ? 'Đã ghi nhận ký giấy'
                        : hoSo?.trangThaiTaiLieu === 'DA_CHOT'
                        ? `Đã chốt (Rev ${hoSo.revision})`
                        : 'Bản dự thảo (DRAFT)'}
                    </StatusTag>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                    {hoSo?.daCoHoSoChot
                      ? `Hợp đồng đã chốt thời điểm ${hoSo.thoiDiemChot ? new Date(hoSo.thoiDiemChot).toLocaleString('vi-VN') : ''}. Dữ liệu được bảo toàn bất biến; mọi sửa đổi thỏa thuận cần lập qua Phụ lục.`
                      : 'Hồ sơ đang ở trạng thái dự thảo. Hãy rà soát 5 bước bên dưới và hoàn thiện thông tin trước khi chốt.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {hoSo?.trangThaiTaiLieu === 'DRAFT' ? (
                    <Button
                      variant="secondary"
                      blocked={action.busy}
                      onClick={() => {
                        if (!selected) return
                        void runScopedMutation(
                          selected,
                          () => luuDraftHoSo(token, selected, { ...dossierForm, expectedRevision: hoSo?.revision, revision: hoSo?.revision }),
                          'Đã lưu bản nháp hợp đồng thành công.'
                        )
                      }}
                    >
                      💾 Lưu bản nháp
                    </Button>
                  ) : null}

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
                        'Đã xuất PDF hợp đồng.'
                      )
                    }
                  >
                    📄 Tải PDF {hoSo?.trangThaiTaiLieu === 'DRAFT' ? 'dự thảo' : 'chính thức'}
                  </Button>
                </div>
              </div>

              {/* THANH ĐIỀU HƯỚNG 5 BƯỚC */}
              {!tt && (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  padding: 4,
                  background: 'var(--ma-bg-sunken)',
                  border: '1px solid var(--ma-border-default)',
                  borderRadius: 'var(--ma-radius)',
                  marginBottom: 18,
                }}
              >
                {[
                  { id: 1, title: '1. Phòng & Thời hạn' },
                  { id: 2, title: '2. Bên A & Bên B' },
                  { id: 3, title: '3. Giá thuê & Cọc' },
                  { id: 4, title: '4. Điều khoản & Bàn giao' },
                  { id: 5, title: '5. Chốt & Ký giấy' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStep(st.id)}
                    style={{
                      flex: '1 1 auto',
                      padding: '9px 14px',
                      borderRadius: 'var(--ma-radius-sm)',
                      border: '1px solid',
                      borderColor: activeStep === st.id ? 'var(--ma-border-default)' : 'transparent',
                      background: activeStep === st.id ? 'var(--ma-bg-card)' : 'transparent',
                      color: activeStep === st.id ? 'var(--ma-text-primary)' : 'var(--ma-text-secondary)',
                      boxShadow: activeStep === st.id ? 'var(--ma-shadow-sm)' : 'none',
                      cursor: 'pointer',
                      fontWeight: activeStep === st.id ? 700 : 500,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 'var(--ma-radius-pill)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        background: activeStep === st.id ? 'var(--ma-brand-accent)' : 'var(--ma-line-200)',
                        color: activeStep === st.id ? 'var(--ma-bg-card)' : 'var(--ma-text-secondary)',
                      }}
                    >
                      {st.id}
                    </span>
                    <span>{st.title}</span>
                  </button>
                ))}
              </div>
              )}

              {/* BƯỚC 1: PHÒNG & THỜI HẠN */}
              {activeStep === 1 ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={gridStyle}>
                    <Field title="Tiêu đề hợp đồng">
                      <input
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.tieuDe || ''}
                        onChange={(e) => setDossierForm({ ...dossierForm, tieuDe: e.target.value })}
                      />
                    </Field>

                    <Field title="Ngày lập hồ sơ">
                      <input
                        type="date"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.ngayLap || ''}
                        onChange={(e) => setDossierForm({ ...dossierForm, ngayLap: e.target.value })}
                      />
                    </Field>

                    <Field title="Địa điểm lập">
                      <input
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.diaDiemLap || ''}
                        onChange={(e) => setDossierForm({ ...dossierForm, diaDiemLap: e.target.value })}
                      />
                    </Field>

                    <Field title="Ngày nhận phòng thực tế">
                      <input
                        type="date"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.ngayNhanPhong || ''}
                        onChange={(e) => setDossierForm({ ...dossierForm, ngayNhanPhong: e.target.value })}
                      />
                    </Field>

                    <Field title="Mục đích thuê">
                      <input
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.mucDichThue || ''}
                        onChange={(e) => setDossierForm({ ...dossierForm, mucDichThue: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field title="Phạm vi sử dụng diện tích & tiện ích chung">
                    <textarea
                      rows={2}
                      style={fieldStyle}
                      disabled={hoSo?.daCoHoSoChot}
                      value={dossierForm.phamViSuDung || ''}
                      onChange={(e) => setDossierForm({ ...dossierForm, phamViSuDung: e.target.value })}
                    />
                  </Field>
                </div>
              ) : null}

              {/* BƯỚC 2: BÊN A & BÊN B */}
              {activeStep === 2 ? (
                <div style={{ display: 'grid', gap: 20 }}>
                  {/* BÊN CHO THUÊ (BÊN A) */}
                  <div style={{ padding: '14px 16px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>🏛️ THÔNG TIN BÊN CHO THUÊ (BÊN A)</strong>
                      {!hoSo?.daCoHoSoChot && cauHinhBenA ? (
                        <button type="button" style={quickPresetButtonStyle} onClick={napTuCauHinhBenA}>
                          ⚡ Nạp từ Cấu hình Bên A của Toà nhà
                        </button>
                      ) : null}
                    </div>

                    <div style={gridStyle}>
                      <Field title="Loại chủ thể">
                        <select
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benALoaiChuThe || 'CA_NHAN'}
                          onChange={(e) => setDossierForm({ ...dossierForm, benALoaiChuThe: e.target.value as any })}
                        >
                          <option value="CA_NHAN">Cá nhân chủ sở hữu</option>
                          <option value="TO_CHUC">Tổ chức / Doanh nghiệp</option>
                        </select>
                      </Field>

                      <Field title="Tên chủ thể / Đơn vị cho thuê">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          placeholder="Ví dụ: Nguyễn Văn Chủ / Công ty TNHH MiniApart"
                          value={dossierForm.benATenChuThe || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benATenChuThe: e.target.value })}
                        />
                      </Field>

                      <Field title="Số CCCD / Mã số thuế">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          placeholder="001090123456 / MST"
                          value={dossierForm.benADinhDanh || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benADinhDanh: e.target.value })}
                        />
                      </Field>

                      <Field title="Số điện thoại Bên A">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benADienThoai || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benADienThoai: e.target.value })}
                        />
                      </Field>

                      <Field title="Email Bên A (nếu có)">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benAEmail || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benAEmail: e.target.value })}
                        />
                      </Field>

                      <Field title="Người đại diện ký tên">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          placeholder="Họ tên người ký"
                          value={dossierForm.benANguoiKy || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benANguoiKy: e.target.value })}
                        />
                      </Field>

                      <Field title="Chức vụ người ký">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benAChucVu || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benAChucVu: e.target.value })}
                        />
                      </Field>

                      <Field title="Tư cách ký">
                        <select
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benATuCachKy || 'CHU_SO_HUU'}
                          onChange={(e) => setDossierForm({ ...dossierForm, benATuCachKy: e.target.value })}
                        >
                          <option value="CHU_SO_HUU">Chủ nhà</option>
                          <option value="DAI_DIEN_PHAP_LUAT">Đại diện pháp luật</option>
                          <option value="NGUOI_DUOC_UY_QUYEN">Người được ủy quyền</option>
                        </select>
                      </Field>

                      {dossierForm.benATuCachKy === 'NGUOI_DUOC_UY_QUYEN' ? (
                        <Field title="Căn cứ ủy quyền">
                          <input
                            style={fieldStyle}
                            disabled={hoSo?.daCoHoSoChot}
                            placeholder="Giấy ủy quyền số... ngày..."
                            value={dossierForm.benACanCuUyQuyen || ''}
                            onChange={(e) => setDossierForm({ ...dossierForm, benACanCuUyQuyen: e.target.value })}
                          />
                        </Field>
                      ) : null}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Field title="Địa chỉ liên hệ Bên A">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benADiaChi || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benADiaChi: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Field title="Tài khoản nhận tiền thuê & cọc">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          placeholder="Số TK - Ngân hàng (Tên chủ TK)"
                          value={dossierForm.taiKhoanNhanTien || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, taiKhoanNhanTien: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* BÊN THUÊ (BÊN B) */}
                  <div style={{ padding: '14px 16px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize: 14 }}>👤 THÔNG TIN BÊN THUÊ (BÊN B)</strong>
                      <p style={{ margin: '2px 0 0', color: 'var(--ma-text-secondary)', fontSize: 12 }}>
                        Yêu cầu đầy đủ CCCD/Hộ chiếu và Địa chỉ thường trú theo đúng giấy tờ pháp lý.
                      </p>
                    </div>

                    <div style={gridStyle}>
                      <Field title="Họ và tên khách thuê (đứng tên HĐ)">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBHoTen || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBHoTen: e.target.value })}
                        />
                      </Field>

                      <Field title="Ngày sinh">
                        <input
                          type="date"
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBNgaySinh || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBNgaySinh: e.target.value })}
                        />
                      </Field>

                      <Field title="Loại giấy tờ">
                        <select
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBLoaiGiayTo || 'CCCD'}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBLoaiGiayTo: e.target.value })}
                        >
                          <option value="CCCD">Căn cước công dân (CCCD)</option>
                          <option value="HO_CHIEU">Hộ chiếu</option>
                        </select>
                      </Field>

                      <Field title="Số CCCD / Hộ chiếu">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBSoGiayTo || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBSoGiayTo: e.target.value })}
                        />
                      </Field>

                      <Field title="Ngày cấp">
                        <input
                          type="date"
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBNgayCap || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBNgayCap: e.target.value })}
                        />
                      </Field>

                      <Field title="Nơi cấp">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          placeholder="Cục CSQLHC về TTXH"
                          value={dossierForm.benBNoiCap || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBNoiCap: e.target.value })}
                        />
                      </Field>

                      <Field title="Số điện thoại">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBDienThoai || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBDienThoai: e.target.value })}
                        />
                      </Field>

                      <Field title="Email (nếu có)">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBEmail || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBEmail: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Field title="Địa chỉ thường trú (theo CCCD/Hộ chiếu) *">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          placeholder="Số nhà, đường/thôn, phường/xã, quận/huyện, tỉnh/TP"
                          value={dossierForm.benBThuongTru || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBThuongTru: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Field title="Địa chỉ liên hệ / Nơi ở hiện tại">
                        <input
                          style={fieldStyle}
                          disabled={hoSo?.daCoHoSoChot}
                          value={dossierForm.benBLienHe || ''}
                          onChange={(e) => setDossierForm({ ...dossierForm, benBLienHe: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* BƯỚC 3: GIÁ THUÊ & CỌC */}
              {activeStep === 3 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, minWidth: 0 }}>
                    <div style={{ padding: '12px 14px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>GIÁ THUÊ HỢP ĐỒNG</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ma-brand-accent)', marginTop: 2 }}>
                        {dinhDangTien(contract.giaThue)} đ/tháng
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>TIỀN CỌC THỎA THUẬN</div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                        {dinhDangTien(contract.tienCoc)} đ
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>TIỀN CỌC THỰC THU (SỔ CÁI)</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: Number(hoSo?.tienCocThucThu || '0') >= Number(contract.tienCoc) ? 'var(--ma-status-done)' : 'var(--ma-status-urgent)', marginTop: 2 }}>
                        {dinhDangTien(hoSo?.tienCocThucThu || '0')} đ
                      </div>
                    </div>
                  </div>

                  {Number(hoSo?.tienCocThucThu || '0') < Number(contract.tienCoc) ? (
                    <div style={{ padding: '10px 14px', background: 'var(--ma-status-urgent-light)', border: '1px solid var(--ma-status-urgent)', borderRadius: 'var(--ma-radius)', color: 'var(--ma-status-urgent)', fontSize: 13 }}>
                      ⚠️ Tiền cọc thực thu trên sổ cái ({dinhDangTien(hoSo?.tienCocThucThu || '0')} đ) chưa đủ mức thỏa thuận ({dinhDangTien(contract.tienCoc)} đ). Cần nộp cọc trước khi kích hoạt và bàn giao phòng.
                    </div>
                  ) : (
                    <div style={{ padding: '10px 14px', background: 'var(--ma-status-done-light)', border: '1px solid var(--ma-status-done)', borderRadius: 'var(--ma-radius)', color: 'var(--ma-status-done)', fontSize: 13 }}>
                      ✓ Đã thu đủ 100% tiền đặt cọc theo thỏa thuận hợp đồng.
                    </div>
                  )}

                  <div style={gridStyle}>
                    <Field title="Phương thức thanh toán">
                      <select
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.phuongThucThanhToan || 'CHUYEN_KHOAN'}
                        onChange={(e) => setDossierForm({ ...dossierForm, phuongThucThanhToan: e.target.value })}
                      >
                        <option value="CHUYEN_KHOAN">Chuyển khoản ngân hàng</option>
                        <option value="TIEN_MAT">Tiền mặt</option>
                      </select>
                    </Field>

                    <Field title="Số tháng mỗi lần thanh toán">
                      <input
                        type="number"
                        min="1"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.kyThanhToanThang ?? 1}
                        onChange={(e) => setDossierForm({ ...dossierForm, kyThanhToanThang: Number(e.target.value) })}
                      />
                    </Field>

                    <Field title="Hạn thanh toán (ngày trong tháng)">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.hanThanhToanNgay ?? 5}
                        onChange={(e) => setDossierForm({ ...dossierForm, hanThanhToanNgay: Number(e.target.value) })}
                      />
                    </Field>

                    <Field title="Số người cư trú tối đa">
                      <input
                        type="number"
                        min="1"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.soNguoiToiDa ?? 2}
                        onChange={(e) => setDossierForm({ ...dossierForm, soNguoiToiDa: Number(e.target.value) })}
                      />
                    </Field>

                    <Field title="Báo trước gia hạn / kết thúc (ngày)">
                      <input
                        type="number"
                        min="1"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.soNgayBaoTruocGiaHan ?? 30}
                        onChange={(e) => setDossierForm({ ...dossierForm, soNgayBaoTruocGiaHan: Number(e.target.value) })}
                      />
                    </Field>

                    <Field title="Thời hạn hoàn cọc (ngày)">
                      <input
                        type="number"
                        min="1"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.soNgayHoanCoc ?? 7}
                        onChange={(e) => setDossierForm({ ...dossierForm, soNgayHoanCoc: Number(e.target.value) })}
                      />
                    </Field>

                    <Field title="Khung giờ yên tĩnh">
                      <input
                        type="text"
                        style={fieldStyle}
                        disabled={hoSo?.daCoHoSoChot}
                        value={dossierForm.khungGioYenTinh || '22:00 - 06:00 hàng ngày'}
                        onChange={(e) => setDossierForm({ ...dossierForm, khungGioYenTinh: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field title="Chính sách / Điều kiện điều chỉnh giá thuê">
                    <input
                      style={fieldStyle}
                      disabled={hoSo?.daCoHoSoChot}
                      value={dossierForm.dieuKienDieuChinhGia || ''}
                      onChange={(e) => setDossierForm({ ...dossierForm, dieuKienDieuChinhGia: e.target.value })}
                    />
                  </Field>
                </div>
              ) : null}

              {/* BƯỚC 4: ĐIỀU KHOẢN & BÀN GIAO */}
              {activeStep === 4 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {!hoSo?.daCoHoSoChot ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {mauList.length > 0 ? (
                        <>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Áp dụng mẫu toà nhà:</span>
                          <select
                            style={{ ...fieldStyle, width: 'auto', minWidth: 260 }}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              const m = mauList.find((item) => item.id === val)
                              if (m) {
                                if (dossierForm.dieuKhoanTuyBien) {
                                  setConfirmDialog({
                                    title: 'Áp dụng mẫu hợp đồng toà nhà',
                                    message: `Hành động này sẽ thay thế nội dung điều khoản hiện tại bằng mẫu toà nhà "${m.tenMau}". Bạn có chắc muốn tiếp tục?`,
                                    confirmLabel: 'Áp dụng mẫu',
                                    onConfirm: () => {
                                      setDossierForm((prev) => ({
                                        ...prev,
                                        mauHopDongId: m.id,
                                        tieuDe: m.tieuDe,
                                        dieuKhoanTuyBien: m.noiDungDieuKhoan,
                                      }))
                                      setConfirmDialog(null)
                                    },
                                  })
                                  return
                                }
                                setDossierForm((prev) => ({
                                  ...prev,
                                  mauHopDongId: m.id,
                                  tieuDe: m.tieuDe,
                                  dieuKhoanTuyBien: m.noiDungDieuKhoan,
                                }))
                              }
                            }}
                          >
                            <option value="">-- Chọn mẫu hợp đồng --</option>
                            {mauList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.tenMau} (Phiên bản {m.phienBan}) - {m.trangThai}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : null}

                      <button
                        type="button"
                        style={quickPresetButtonStyle}
                        onClick={async () => {
                          if (!building?.buildingId) return
                          const currentBuildingId = building.buildingId
                          const currentGen = requestGenRef.current

                          const napMau = async () => {
                            try {
                              const chuan = await fetchMauHopDongChuan(token, currentBuildingId)
                              if (chuan && requestGenRef.current === currentGen && building?.buildingId === currentBuildingId) {
                                setDossierForm((prev) => ({
                                  ...prev,
                                  tieuDe: chuan.tieuDe,
                                  dieuKhoanTuyBien: chuan.noiDungDieuKhoan,
                                }))
                              }
                            } catch {
                              // ignore
                            }
                          }

                          if (dossierForm.dieuKhoanTuyBien) {
                            setConfirmDialog({
                              title: 'Nạp điều khoản mẫu chuẩn MiniApart',
                              message: 'Hành động này sẽ thay thế nội dung điều khoản hiện tại bằng mẫu chuẩn MiniApart (12 điều khoản). Bạn có chắc muốn nạp lại?',
                              confirmLabel: 'Nạp mẫu chuẩn',
                              onConfirm: () => {
                                void napMau()
                                setConfirmDialog(null)
                              },
                            })
                            return
                          }
                          void napMau()
                        }}
                      >
                        ⚡ Nạp điều khoản mẫu chuẩn MiniApart (12 điều khoản)
                      </button>
                    </div>
                  ) : null}

                  <Field title="Nội dung điều khoản hợp đồng (12 điều khoản chuẩn mực vận hành)">
                    <textarea
                      rows={12}
                      style={{ ...fieldStyle, fontSize: 12, lineHeight: 1.6 }}
                      disabled={hoSo?.daCoHoSoChot}
                      value={dossierForm.dieuKhoanTuyBien || ''}
                      onChange={(e) => setDossierForm({ ...dossierForm, dieuKhoanTuyBien: e.target.value })}
                    />
                  </Field>

                  <div style={{ padding: '14px 16px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)' }}>
                    <strong style={{ fontSize: 13 }}>📋 LIÊN KẾT BIÊN BẢN BÀN GIAO NHẬN PHÒNG</strong>
                    <p style={{ margin: '4px 0 10px', color: 'var(--ma-text-secondary)', fontSize: 12 }}>
                      Biên bản nhận phòng là căn cứ pháp lý để xác nhận danh mục và tình trạng tài sản khi giao phòng.
                    </p>
                    <select
                      style={fieldStyle}
                      disabled={hoSo?.daCoHoSoChot}
                      value={dossierForm.bienBanBanGiaoId ?? ''}
                      onChange={(e) => setDossierForm({ ...dossierForm, bienBanBanGiaoId: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">-- Chưa gắn biên bản nhận phòng --</option>
                      {bienBans
                        .filter((b: any) => b.loaiBienBan === 'NHAN_PHONG')
                        .map((b: any) => (
                          <option key={b.id} value={b.id}>
                            Biên bản #{b.id} · Nhận phòng ngày {b.ngayThucHien} · Người lập: {b.tenNguoiLap}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {/* BƯỚC 5: CHỐT & KÝ GIẤY */}
              {activeStep === 5 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {/* CẢNH BÁO THIẾU DỮ LIỆU */}
                  {tt !== 'PHU_LUC' && (
                  hoSo?.canhBaoThieuThongTin && hoSo.canhBaoThieuThongTin.length > 0 ? (
                    <div style={{ padding: '12px 16px', background: 'var(--ma-status-urgent-light)', border: '1px solid var(--ma-status-urgent)', borderRadius: 'var(--ma-radius)', color: 'var(--ma-status-urgent)' }}>
                      <strong>⚠️ Cảnh báo thiếu thông tin trước khi chốt:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                        {hoSo.canhBaoThieuThongTin.map((cb, idx) => (
                          <li key={idx} style={{ marginTop: 2 }}>{cb}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', background: 'var(--ma-status-done-light)', border: '1px solid var(--ma-status-done)', borderRadius: 'var(--ma-radius)', color: 'var(--ma-status-done)' }}>
                      ✓ Toàn bộ thông tin pháp lý bắt buộc của Bên A, Bên B và điều khoản đã được hoàn thiện đầy đủ.
                    </div>
                  )
                  )}

                  {/* THAO TÁC CHỐT HỢP ĐỒNG NẾU ĐANG LÀ DRAFT */}
                  {hoSo?.trangThaiTaiLieu === 'DRAFT' ? (tt === 'PHU_LUC' ? <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)' }}>Hồ sơ còn là bản nháp: hãy chốt hồ sơ (thao tác Ký hợp đồng) trước khi lập phụ lục.</p> : (
                    <div style={{ padding: '16px 18px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)', display: 'grid', gap: 12 }}>
                      <h4 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>🔒 Chốt hồ sơ hợp đồng</h4>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                        Khi chốt hợp đồng, hệ thống sẽ lưu snapshot bất biến toàn bộ Bên A, Bên B, thông tin phòng, bảng giá dịch vụ và danh mục tài sản bàn giao.
                      </p>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={xacNhanChot}
                          onChange={(e) => setXacNhanChot(e.target.checked)}
                        />
                        <span>Tôi xác nhận các thông tin trên là chính xác và muốn chốt hồ sơ hợp đồng này.</span>
                      </label>

                      <div>
                        <Button
                          variant="primary"
                          blocked={action.busy || !xacNhanChot}
                          onClick={() => {
                            if (!selected) return
                            void runScopedMutation(
                              selected,
                              async () => {
                                await chotHoSoHopDong(token, selected, {
                                  expectedRevision: hoSo?.revision,
                                  revision: hoSo?.revision || 1,
                                  duLieuHoSo: { ...dossierForm, expectedRevision: hoSo?.revision, revision: hoSo?.revision },
                                })
                                setXacNhanChot(false)
                              },
                              'Đã chốt hồ sơ hợp đồng và tạo snapshot bất biến thành công!'
                            )
                          }}
                        >
                          🔒 Chốt hồ sơ hợp đồng ngay
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {/* KHỐI GHI NHẬN KÝ GIẤY */}
                      {tt !== 'PHU_LUC' && (
                      <div style={{ padding: '14px 16px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                        <h4 style={{ margin: '0 0 8px', font: 'var(--ma-text-task-name)' }}>✍️ Ghi nhận ký kết hợp đồng giấy</h4>
                        {hoSo?.trangThaiTaiLieu === 'DA_GHI_NHAN_KY' ? (
                          <div style={{ color: 'var(--ma-status-done)', fontWeight: 600, fontSize: 13 }}>
                            ✓ Hợp đồng đã được ký giấy ngày {hoSo.thoiDiemGhiNhanKy ? new Date(hoSo.thoiDiemGhiNhanKy).toLocaleDateString('vi-VN') : ''}
                            {hoSo.ghiChuKy ? ` (Ghi chú: ${hoSo.ghiChuKy})` : ''}
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 10 }}>
                            <div style={gridStyle}>
                              <Field title="Ngày ký giấy">
                                <input
                                  type="date"
                                  style={fieldStyle}
                                  value={signingForm.ngayKy}
                                  onChange={(e) => setSigningForm({ ...signingForm, ngayKy: e.target.value })}
                                />
                              </Field>

                              <Field title="Ghi chú ký kết">
                                <input
                                  style={fieldStyle}
                                  placeholder="Đã ký 2 bản gốc, mỗi bên giữ 1 bản"
                                  value={signingForm.ghiChuKy}
                                  onChange={(e) => setSigningForm({ ...signingForm, ghiChuKy: e.target.value })}
                                />
                              </Field>

                              <Field title="Tên / đường dẫn file scan (nếu có)">
                                <input
                                  style={fieldStyle}
                                  placeholder="hop_dong_da_ky.pdf"
                                  value={signingForm.fileScanDinhKem}
                                  onChange={(e) => setSigningForm({ ...signingForm, fileScanDinhKem: e.target.value })}
                                />
                              </Field>
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              <Button
                                variant="primary"
                                blocked={action.busy}
                                onClick={() => {
                                  if (!selected) return
                                  void runScopedMutation(
                                    selected,
                                    () => ghiNhanKyHopDong(token, selected, { ...signingForm, expectedRevision: hoSo?.revision }),
                                    'Đã ghi nhận ký kết hợp đồng giấy thành công!'
                                  )
                                }}
                              >
                                ✍️ Xác nhận đã ký giấy
                              </Button>

                              <Button
                                variant="secondary"
                                blocked={action.busy}
                                onClick={() => {
                                  if (!selected) return
                                  setPromptDialog({
                                    title: 'Mở lại hồ sơ bản nháp',
                                    message: 'Nhập lý do mở lại hồ sơ để chuyển về trạng thái dự thảo (DRAFT) chỉnh sửa:',
                                    placeholder: 'Ví dụ: Cập nhật điều khoản thỏa thuận hoặc giấy tờ...',
                                    confirmLabel: 'Mở lại bản nháp',
                                    onConfirm: (lyDo) => {
                                      setPromptDialog(null)
                                      void runScopedMutation(
                                        selected,
                                        () => moLaiDraftHoSo(token, selected, { expectedRevision: hoSo?.revision, lyDo }),
                                        'Đã mở lại hồ sơ thành bản nháp thành công!'
                                      )
                                    },
                                  })
                                }}
                              >
                                🔄 Mở lại bản nháp để chỉnh sửa
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      )}

                      {/* KHỐI QUẢN LÝ PHỤ LỤC HỢP ĐỒNG */}
                      {tt !== 'KY' && (
                      <div style={{ padding: '14px 16px', background: 'var(--ma-bg-sunken)', borderRadius: 'var(--ma-radius)', border: '1px solid var(--ma-border-default)' }}>
                        <h4 style={{ margin: '0 0 8px', font: 'var(--ma-text-task-name)' }}>📑 Phụ lục hợp đồng đã lập</h4>
                        {phuLucList.length === 0 ? (
                          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ma-text-secondary)', fontStyle: 'italic' }}>
                            Chưa có phụ lục sửa đổi/bổ sung nào.
                          </p>
                        ) : (
                          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                            {phuLucList.map((pl) => (
                              <div
                                key={pl.id}
                                style={{
                                  padding: '10px 14px',
                                  background: 'var(--ma-bg-card)',
                                  borderRadius: 'var(--ma-radius)',
                                  border: '1px solid var(--ma-border-default)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong>Phụ lục số {pl.soPhuLuc}: {pl.tieuDe}</strong>
                                  <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>
                                    Hiệu lực: {pl.ngayHieuLuc}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--ma-text-secondary)' }}>
                                  {pl.noiDungThayDoi}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid var(--ma-border-subtle)', paddingTop: 12 }}>
                          <strong style={{ fontSize: 13 }}>➕ Lập phụ lục hợp đồng mới</strong>
                          <div style={{ ...gridStyle, marginTop: 8 }}>
                            <Field title="Tiêu đề phụ lục">
                              <input
                                style={fieldStyle}
                                placeholder="Phụ lục điều chỉnh giá / gia hạn..."
                                value={phuLucForm.tieuDe}
                                onChange={(e) => setPhuLucForm({ ...phuLucForm, tieuDe: e.target.value })}
                              />
                            </Field>

                            <Field title="Ngày hiệu lực">
                              <input
                                type="date"
                                style={fieldStyle}
                                value={phuLucForm.ngayHieuLuc}
                                onChange={(e) => setPhuLucForm({ ...phuLucForm, ngayHieuLuc: e.target.value })}
                              />
                            </Field>
                          </div>

                          <div style={{ marginTop: 8 }}>
                            <Field title="Nội dung điều chỉnh / thỏa thuận bổ sung">
                              <textarea
                                rows={3}
                                style={fieldStyle}
                                placeholder="Ghi rõ nội dung thay đổi so với hợp đồng gốc..."
                                value={phuLucForm.noiDungThayDoi}
                                onChange={(e) => setPhuLucForm({ ...phuLucForm, noiDungThayDoi: e.target.value })}
                              />
                            </Field>
                          </div>

                          <div style={{ marginTop: 10 }}>
                            <Button
                              variant="secondary"
                              blocked={action.busy || !phuLucForm.tieuDe || !phuLucForm.noiDungThayDoi}
                              onClick={() => {
                                if (!selected) return
                                void runScopedMutation(
                                  selected,
                                  async () => {
                                    await taoPhuLucHopDong(token, selected, phuLucForm)
                                    setPhuLucForm({ tieuDe: '', ngayLap: today(), ngayHieuLuc: today(), noiDungThayDoi: '' })
                                  },
                                  'Đã lập phụ lục hợp đồng thành công!'
                                )
                              }}
                            >
                              ➕ Tạo phụ lục
                            </Button>
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            )}

            {/* QUẢN LÝ TÀI SẢN BÀN GIAO & TỰ ĐỘNG KHẤU TRỪ VÀO THANH LÝ */}
            {(!tt || tt === 'THANH_LY') && (
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
            )}

            {/* DANH SÁCH NGƯỜI Ở CÙNG */}
            {(!tt || tt === 'NGUOI_O_CUNG') && (
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
                <div style={{ display: 'grid', gap: 10 }}>
                  {occupants.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--ma-bg-card)',
                        borderRadius: 'var(--ma-radius)',
                        border: '1px solid var(--ma-border-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{o.hoTenNguoiThue}</span>
                          {o.quanHe ? <span style={{ color: 'var(--ma-text-secondary)', fontSize: 13 }}> ({o.quanHe})</span> : null}
                          {o.vaiTro && o.vaiTro !== 'NGUOI_O' ? (
                            <span style={{ marginLeft: 8, fontSize: 13, background: 'var(--ma-bg-sunken)', padding: '2px 6px', borderRadius: 4 }}>
                              {o.vaiTro}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {o.trangThai === 'CHO_DUYET' ? (
                            <StatusTag tone="waiting">Chờ duyệt</StatusTag>
                          ) : o.trangThai === 'TU_CHOI' ? (
                            <StatusTag tone="urgent">Đã từ chối</StatusTag>
                          ) : o.trangThai === 'DA_ROI_DI' ? (
                            <StatusTag tone="neutral">Đã rời phòng</StatusTag>
                          ) : (
                            <StatusTag tone="done">Đã duyệt cư trú</StatusTag>
                          )}
                          {o.coTaiKhoan ? (
                            <span style={{ fontSize: 13, background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                              ✓ Đã có tài khoản
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                        <div>
                          {o.soDienThoai ? <span>SĐT: {o.soDienThoai} | </span> : null}
                          {o.soGiayToChe ? <span>CCCD: {o.soGiayToChe} | </span> : null}
                          <span>Thời gian: {o.tuNgay} → {o.denNgay ?? 'Đang ở'}</span>
                          {o.lyDoTuChoi ? <span style={{ color: 'var(--ma-status-error)', display: 'block' }}>Lý do từ chối: {o.lyDoTuChoi}</span> : null}
                          {o.lyDoRoiDi ? <span style={{ display: 'block' }}>Lý do rời: {o.lyDoRoiDi}</span> : null}
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {o.trangThai === 'CHO_DUYET' ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  if (!selected) return
                                  try {
                                    await duyetNguoiOCung(token, selected, o.id)
                                    setOccupants(await managementRequest(token, `/api/hop-dong/${selected}/nguoi-o-cung`))
                                    action.setSuccess('Đã phê duyệt người ở cùng thành công!')
                                  } catch (err: any) {
                                    action.setError(err.message || 'Lỗi phê duyệt.')
                                  }
                                }}
                              >
                                ✓ Duyệt cư trú
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  if (!selected) return
                                  setPromptDialog({
                                    title: 'Từ chối người ở cùng',
                                    message: 'Nhập lý do từ chối yêu cầu đăng ký cư trú:',
                                    placeholder: 'Ví dụ: Thiếu giấy tờ tùy thân hợp lệ...',
                                    confirmLabel: 'Từ chối cư trú',
                                    tone: 'urgent',
                                    onConfirm: async (lyDo) => {
                                      if (!lyDo.trim()) return
                                      setPromptDialog(null)
                                      try {
                                        await tuChoiNguoiOCung(token, selected, o.id, lyDo)
                                        setOccupants(await managementRequest(token, `/api/hop-dong/${selected}/nguoi-o-cung`))
                                        action.setSuccess('Đã từ chối người ở cùng.')
                                      } catch (err: any) {
                                        action.setError(err.message || 'Lỗi từ chối.')
                                      }
                                    },
                                  })
                                }}
                              >
                                ✕ Từ chối
                              </Button>
                            </>
                          ) : null}

                          {o.trangThai === 'DA_DUYET' ? (
                            <>
                              {!o.coTaiKhoan ? (
                                <button
                                  type="button"
                                  style={quickPresetButtonStyle}
                                  onClick={async () => {
                                    if (!selected) return
                                    try {
                                      await kichHoatTaiKhoanNguoiOCung(token, selected, o.id)
                                      setOccupants(await managementRequest(token, `/api/hop-dong/${selected}/nguoi-o-cung`))
                                      action.setSuccess('Đã kích hoạt tài khoản người dùng thành công!')
                                    } catch (err: any) {
                                      action.setError(err.message || 'Lỗi kích hoạt tài khoản.')
                                    }
                                  }}
                                >
                                  🔑 Kích hoạt tài khoản
                                </button>
                              ) : null}

                              <button
                                type="button"
                                style={quickPresetButtonStyle}
                                onClick={() => {
                                  if (!selected) return
                                  setPromptDialog({
                                    title: 'Ghi nhận người ở cùng rời phòng',
                                    message: 'Nhập lý do rời phòng (tùy chọn) trước khi xác nhận:',
                                    placeholder: 'Ví dụ: Hết hạn tạm trú / Chuyển nơi công tác...',
                                    confirmLabel: 'Xác nhận rời phòng',
                                    onConfirm: async (lyDo) => {
                                      setPromptDialog(null)
                                      try {
                                        await roiPhongNguoiOCung(token, selected, o.id, { ngayRoiDi: today(), lyDo: lyDo || '' })
                                        setOccupants(await managementRequest(token, `/api/hop-dong/${selected}/nguoi-o-cung`))
                                        action.setSuccess('Đã ghi nhận người ở cùng rời phòng.')
                                      } catch (err: any) {
                                        action.setError(err.message || 'Lỗi ghi nhận rời phòng.')
                                      }
                                    },
                                  })
                                }}
                              >
                                🚪 Rời phòng
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
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
            )}

            {/* GIA HẠN HỢP ĐỒNG */}
            {(!tt || tt === 'GIA_HAN') && contract.trangThai === 'HIEU_LUC' && contract.sapHetHan ? (
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
            {(!tt || tt === 'THANH_LY') && contract.trangThai !== 'DA_THANH_LY' ? (
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
                        xacNhanChenhLech: xacNhanKhauTruKhacBienBan,
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
                            background: daKhop ? 'var(--ma-brand-accent-light)' : 'var(--ma-waiting-bg)',
                            border: `1px solid ${daKhop ? 'var(--ma-brand-accent)' : 'var(--ma-waiting-border)'}`,
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
                            <span style={{ fontWeight: 600, color: 'var(--ma-urgent)' }}>{dinhDangTien(tienBb)} đ</span>
                            {daKhop ? (
                              <span style={{ marginLeft: 8, color: 'var(--ma-done-text)', fontWeight: 600 }}>
                                ✓ Đã khớp với thanh lý
                              </span>
                            ) : (
                              <span style={{ marginLeft: 8, color: 'var(--ma-waiting)', fontWeight: 600 }}>
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, cursor: 'pointer', fontSize: 13, color: 'var(--ma-waiting)', fontWeight: 600 }}>
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

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>Đã kiểm tra chỉ số cuối, công nợ và khoản khấu trừ</span>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="danger" blocked={action.busy || !confirmed || (Boolean(bienBans.find((b) => b.loaiBienBan === 'TRA_PHONG') && Number(settle.khauTruHuHong) !== Number(bienBans.find((b) => b.loaiBienBan === 'TRA_PHONG')?.tongTienKhauTru || 0) && !xacNhanKhauTruKhacBienBan))}>
                    Thanh lý hợp đồng
                  </Button>
                </div>
              </form>
            ) : null}

            {/* KẾT QUẢ QUYẾT TOÁN */}
            {settlement && (!tt || tt === 'THANH_LY') ? (
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 14, minWidth: 0 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>HOÁ ĐƠN CUỐI</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{settlement.tongHoaDonCuoi} đ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>ĐÃ THU CỌC</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{settlement.daThuCoc} đ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>CÔNG NỢ CÒN LẠI</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{settlement.congNo} đ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ma-text-secondary)' }}>KHẤU TRỪ HƯ HẠI</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ma-urgent)' }}>{settlement.khauTru} đ</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--ma-bg-card)', borderRadius: 'var(--ma-radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Tiền cọc hoàn lại cho khách:</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ma-done-text)' }}>
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
                        color: 'var(--ma-bg-card)',
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
      )}

      {confirmDialog ? (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      ) : null}

      {promptDialog ? (
        <PromptModal
          title={promptDialog.title}
          message={promptDialog.message}
          placeholder={promptDialog.placeholder}
          defaultValue={promptDialog.defaultValue}
          confirmLabel={promptDialog.confirmLabel}
          tone={promptDialog.tone}
          onConfirm={promptDialog.onConfirm}
          onCancel={() => setPromptDialog(null)}
        />
      ) : null}
    </section>
  )
}

function useModalTrap(dialogRef: React.RefObject<HTMLDivElement | null>, onCancel: () => void) {
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const activeDialog = dialog

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const newlyInertElements: HTMLElement[] = []
    let branch: HTMLElement = activeDialog

    while (branch.parentElement) {
      const parent = branch.parentElement
      for (const sibling of parent.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || sibling.hasAttribute('inert')) continue
        sibling.setAttribute('inert', '')
        newlyInertElements.push(sibling)
      }
      if (parent === document.body) break
      branch = parent
    }

    const focusableElements = () =>
      [
        ...activeDialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => {
        if (element.tabIndex < 0 || (element instanceof HTMLInputElement && element.type === 'hidden')) return false
        for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
          if (ancestor.hidden || ancestor.hasAttribute('inert') || ancestor.getAttribute('aria-hidden') === 'true')
            return false
          const computedStyle = window.getComputedStyle(ancestor)
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return false
        }
        return true
      })

    function focusElement(element?: HTMLElement) {
      element?.focus()
      if (document.activeElement !== element) activeDialog.focus()
    }

    function focusFirstElement() {
      focusElement(focusableElements()[0])
    }

    function focusLastElement() {
      const focusable = focusableElements()
      focusElement(focusable[focusable.length - 1])
    }

    focusFirstElement()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancelRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = focusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        focusFirstElement()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !activeDialog.contains(document.activeElement))) {
        event.preventDefault()
        focusLastElement()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        focusFirstElement()
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!activeDialog.contains(event.target as Node)) focusFirstElement()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      for (const element of newlyInertElements) element.removeAttribute('inert')
      if (opener?.isConnected) opener.focus()
    }
  }, [])
}

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [submitting, setSubmitting] = useState(false)
  useDialogTrap({ open: true, dialogRef, onClose: onCancel })

  const handleConfirm = () => {
    if (submitting) return
    setSubmitting(true)
    onConfirm()
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          background: 'var(--ma-bg-card)',
          borderRadius: 'var(--ma-radius-md)',
          border: '1px solid var(--ma-border-default)',
          boxShadow: 'var(--ma-shadow-lg)',
          padding: '24px 28px',
          maxWidth: 480,
          width: '100%',
          display: 'grid',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h4 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ma-text-primary)' }}>{title}</h4>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} style={{ minHeight: 40 }} blocked={submitting}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={handleConfirm} style={{ minHeight: 40 }} blocked={submitting}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PromptModal({
  title,
  message,
  placeholder,
  defaultValue = '',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  tone = 'primary',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'urgent'
  onConfirm: (val: string) => void
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [val, setVal] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useDialogTrap({ open: true, dialogRef, onClose: onCancel })

  const handleSubmit = () => {
    const trimmed = val.trim()
    if (!trimmed) {
      setError('Lý do không được để trống.')
      inputRef.current?.focus()
      return
    }
    if (submitting) return
    setSubmitting(true)
    onConfirm(trimmed)
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          background: 'var(--ma-bg-card)',
          borderRadius: 'var(--ma-radius-md)',
          border: '1px solid var(--ma-border-default)',
          boxShadow: 'var(--ma-shadow-lg)',
          padding: '24px 28px',
          maxWidth: 480,
          width: '100%',
          display: 'grid',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h4 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ma-text-primary)' }}>{title}</h4>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>{message}</p>
        </div>
        <div>
          <label htmlFor="prompt-modal-input" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: 'var(--ma-text-secondary)' }}>
            Nội dung lý do
          </label>
          <input
            id="prompt-modal-input"
            ref={inputRef}
            style={{
              ...fieldStyle,
              borderColor: error ? 'var(--ma-urgent)' : undefined,
            }}
            placeholder={placeholder}
            value={val}
            onChange={(e) => {
              setVal(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          {error ? (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ma-urgent)' }}>{error}</p>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} style={{ minHeight: 40 }} blocked={submitting}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'urgent' ? 'danger' : 'primary'}
            onClick={handleSubmit}
            style={{ minHeight: 40 }}
            blocked={submitting}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Từng thao tác của hợp đồng, dùng trong ngăn của hồ sơ 360: cùng state/API/điều kiện với màn thao tác, chỉ hiện đúng một phần. */
export type ThaoTacConProps = { token: string; buildingId: number; hopDong: Pick<ThongTinHopDong, 'id'>; onXong: () => void }
const thaoTacCon = (thaoTac: ThaoTacHopDong) => ({ token, buildingId, hopDong, onXong }: ThaoTacConProps) => (
  <HopDongThaoTac token={token} buildingId={buildingId} selectedHopDongId={hopDong.id} onDongChiTiet={onXong} embedded thaoTac={thaoTac} />
)
export const GiaHanHopDong = thaoTacCon('GIA_HAN')
export const KyHopDong = thaoTacCon('KY')
export const ThanhLyHopDong = thaoTacCon('THANH_LY')
export const PhuLucHopDong = thaoTacCon('PHU_LUC')
export const NguoiOCungHopDong = thaoTacCon('NGUOI_O_CUNG')
