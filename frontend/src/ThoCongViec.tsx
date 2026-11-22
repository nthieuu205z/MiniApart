import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  fetchThoCongViec,
  fetchThoChiTietCongViec,
  capNhatKhaoSat,
  taoBaoGia,
  guiDuyetBaoGia,
  baoXongViecTho,
  fetchThoChungTu,
  fetchThoTongQuan,
  type KpiTho,
  type ThongTinViecThoRow,
  type ChiTietViecTho,
  type ChungTuThanhToanTho,
} from './workerDashboardApi'
import { fetchCurrentUser, fetchLienKetAnh } from './api'
import { dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'

export type ThoCongViecProps = {
  token: string
  mobile?: boolean
  initialTicketId?: number | null
}

export function ThoCongViec({ token, mobile = false, initialTicketId }: ThoCongViecProps): React.ReactElement {
  const [danhSach, setDanhSach] = useState<ThongTinViecThoRow[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState<string | null>(null)

  // Filters
  const [nhomTab, setNhomTab] = useState<'DANG_LAM' | 'CHO_XAC_NHAN' | 'LICH_SU' | 'TAT_CA'>('DANG_LAM')
  const [toaNhaId, setToaNhaId] = useState<number | undefined>(undefined)
  const [mucDo, setMucDo] = useState<string>('')
  const [tuKhoa, setTuKhoa] = useState<string>('')

  // Detail Drawer State
  const [chiTietId, setChiTietId] = useState<number | null>(() => {
    if (initialTicketId) return initialTicketId
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('yeuCauId')
      return p ? Number(p) : null
    }
    return null
  })

  const [chiTietData, setChiTietData] = useState<ChiTietViecTho | null>(null)
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false)
  const [loiChiTiet, setLoiChiTiet] = useState<string | null>(null)

  // Photo URLs cache
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})

  // Form states inside drawer
  const [ghiChuKhaoSatForm, setGhiChuKhaoSatForm] = useState('')
  const [ketQuaSuaChuaForm, setKetQuaSuaChuaForm] = useState('')
  const [hienFormBaoGia, setHienFormBaoGia] = useState(false)
  const [moTaBaoGia, setMoTaBaoGia] = useState('')
  const [dongBaoGiaForm, setDongBaoGiaForm] = useState<Array<{ tenHangMuc: string; soLuong: number; donVi: string; donGia: number }>>([
    { tenHangMuc: '', soLuong: 1, donVi: 'gói', donGia: 0 },
  ])
  const [dangXuLyHanhDong, setDangXuLyHanhDong] = useState(false)
  const [thongBaoThanhCong, setThongBaoThanhCong] = useState<string | null>(null)

  // Mobile: tóm tắt (KPI, tên thợ, số toà) lấy một lần; lỗi thì bỏ qua, danh sách vẫn dùng được.
  const [tomTat, setTomTat] = useState<{ kpi?: KpiTho; hoTen?: string; soToa?: number }>({})
  const [hienTim, setHienTim] = useState(false)
  const [loc, setLoc] = useState<LocViec | null>(docLoc)
  const moFormBaoGiaRef = useRef(false)

  // Voucher modal state
  const [voucherData, setVoucherData] = useState<ChungTuThanhToanTho | null>(null)

  const drawerRef = useRef<HTMLDivElement | null>(null)
  const voucherRef = useRef<HTMLDivElement | null>(null)

  useDialogTrap({
    open: Boolean(chiTietId),
    dialogRef: drawerRef,
    onClose: () => dongChiTiet(),
  })

  useDialogTrap({
    open: Boolean(voucherData),
    dialogRef: voucherRef,
    onClose: () => setVoucherData(null),
  })

  // Deep link sync on popstate
  useEffect(() => {
    function handlePopState() {
      setLoc(docLoc())
      const p = new URLSearchParams(window.location.search).get('yeuCauId')
      setChiTietId(p ? Number(p) : null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!mobile) return
    let active = true
    Promise.allSettled([fetchThoTongQuan(token), fetchCurrentUser(token)]).then(([tq, nd]) => {
      if (!active) return
      setTomTat({
        kpi: tq.status === 'fulfilled' ? tq.value.kpi : undefined,
        soToa: tq.status === 'fulfilled' ? tq.value.danhSachToa.length : undefined,
        hoTen: nd.status === 'fulfilled' ? nd.value.hoTen : undefined,
      })
    })
    return () => {
      active = false
    }
  }, [mobile, token])

  // Mobile tải đủ mọi nhóm một lần để đếm số trên tab; desktop vẫn để máy chủ lọc theo tab.
  const nhomTai = mobile ? 'TAT_CA' : nhomTab
  const taiDanhSach = useCallback(async () => {
    setDangTai(true)
    setLoiTai(null)
    try {
      const rows = await fetchThoCongViec(token, {
        toaNhaId,
        nhom: nhomTai,
        mucDo: mucDo || undefined,
        tuKhoa: tuKhoa || undefined,
      })
      setDanhSach(rows)
    } catch (err: unknown) {
      setLoiTai(err instanceof Error ? err.message : 'Không thể tải danh sách công việc')
    } finally {
      setDangTai(false)
    }
  }, [token, toaNhaId, nhomTai, mucDo, tuKhoa])

  useEffect(() => {
    void taiDanhSach()
  }, [taiDanhSach])

  // Load ticket details when chiTietId changes
  useEffect(() => {
    if (!chiTietId) {
      setChiTietData(null)
      return
    }

    let active = true
    setDangTaiChiTiet(true)
    setLoiChiTiet(null)
    setHienFormBaoGia(false)
    setThongBaoThanhCong(null)

    fetchThoChiTietCongViec(token, chiTietId)
      .then((detail) => {
        if (active) {
          setChiTietData(detail)
          setGhiChuKhaoSatForm(detail.ghiChuKhaoSat ?? '')
          setKetQuaSuaChuaForm(detail.ketQuaSuaChua ?? '')
          setDangTaiChiTiet(false)
          if (moFormBaoGiaRef.current) {
            moFormBaoGiaRef.current = false
            setHienFormBaoGia(true)
          }

          // Fetch photo urls
          const allPhotoIds = [...detail.anhTruocIds, ...detail.anhSauIds]
          allPhotoIds.forEach((pid) => {
            if (!photoUrls[pid]) {
              fetchLienKetAnh(token, pid)
                .then((url) => {
                  if (active) setPhotoUrls((prev) => ({ ...prev, [pid]: url }))
                })
                .catch(() => {})
            }
          })
        }
      })
      .catch((err: Error) => {
        if (active) {
          setLoiChiTiet(err.message)
          setDangTaiChiTiet(false)
        }
      })

    return () => {
      active = false
    }
  }, [token, chiTietId])

  function moChiTiet(id: number) {
    setChiTietId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('yeuCauId', String(id))
    window.history.pushState({}, '', url.toString())
  }

  async function handleNutChinh(row: ThongTinViecThoRow, hanhDong: HanhDongChinh) {
    if (hanhDong === 'LAP_BAO_GIA') moFormBaoGiaRef.current = true
    if (hanhDong === 'NHAN_VIEC') {
      try {
        await capNhatKhaoSat(token, row.id, '')
        void taiDanhSach()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Lỗi khi nhận việc')
        return
      }
    }
    moChiTiet(row.id)
  }

  function chonLoc(e: React.MouseEvent, key: LocViec) {
    e.preventDefault()
    setLoc(key)
    const url = new URL(window.location.href)
    url.searchParams.set('loc', key)
    window.history.replaceState({}, '', url.toString())
  }

  function dongChiTiet() {
    setChiTietId(null)
    setChiTietData(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('yeuCauId')
    window.history.pushState({}, '', url.toString())
  }

  async function handleLuuKhaoSat() {
    if (!chiTietId) return
    setDangXuLyHanhDong(true)
    try {
      await capNhatKhaoSat(token, chiTietId, ghiChuKhaoSatForm)
      setThongBaoThanhCong('Đã lưu ghi chú khảo sát.')
      const updated = await fetchThoChiTietCongViec(token, chiTietId)
      setChiTietData(updated)
      void taiDanhSach()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu khảo sát')
    } finally {
      setDangXuLyHanhDong(false)
    }
  }

  async function handleBaoXong() {
    if (!chiTietId) return
    if (!ketQuaSuaChuaForm.trim()) {
      alert('Vui lòng nhập kết quả sửa chữa trước khi báo xong.')
      return
    }
    setDangXuLyHanhDong(true)
    try {
      await baoXongViecTho(token, chiTietId, ketQuaSuaChuaForm.trim())
      setThongBaoThanhCong('Đã báo hoàn thành sửa chữa. Yêu cầu chuyển sang Chờ xác nhận.')
      const updated = await fetchThoChiTietCongViec(token, chiTietId)
      setChiTietData(updated)
      void taiDanhSach()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi báo xong')
    } finally {
      setDangXuLyHanhDong(false)
    }
  }

  async function handleTaoBaoGia(guiDuyet: boolean) {
    if (!chiTietId) return
    const validLines = dongBaoGiaForm.filter((l) => l.tenHangMuc.trim() && l.soLuong > 0 && l.donGia >= 0)
    if (validLines.length === 0) {
      alert('Cần ít nhất một dòng vật tư / công việc hợp lệ.')
      return
    }
    setDangXuLyHanhDong(true)
    try {
      await taoBaoGia(token, chiTietId, {
        moTa: moTaBaoGia,
        dongBaoGia: validLines,
        guiDuyetNgay: guiDuyet,
      })
      setThongBaoThanhCong(guiDuyet ? 'Đã gửi báo giá tới ban quản lý để duyệt.' : 'Đã lưu bản nháp báo giá.')
      setHienFormBaoGia(false)
      const updated = await fetchThoChiTietCongViec(token, chiTietId)
      setChiTietData(updated)
      void taiDanhSach()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi tạo báo giá')
    } finally {
      setDangXuLyHanhDong(false)
    }
  }

  async function handleGuiDuyetBaoGia(baoGiaId: number) {
    if (!chiTietId) return
    setDangXuLyHanhDong(true)
    try {
      await guiDuyetBaoGia(token, chiTietId, baoGiaId)
      setThongBaoThanhCong('Đã gửi duyệt báo giá thành công.')
      const updated = await fetchThoChiTietCongViec(token, chiTietId)
      setChiTietData(updated)
      void taiDanhSach()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi gửi duyệt')
    } finally {
      setDangXuLyHanhDong(false)
    }
  }

  async function handleXemChungTu(yeuCauId: number) {
    try {
      const doc = await fetchThoChungTu(token, yeuCauId)
      setVoucherData(doc)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tải chứng từ')
    }
  }

  const toaNhaList = useMemo(() => {
    const map = new Map<number, string>()
    danhSach.forEach((r) => map.set(r.toaNhaId, r.toaNha))
    return Array.from(map.entries()).map(([id, ten]) => ({ id, ten }))
  }, [danhSach])

  const dangMo = danhSach.filter((r) => r.trangThaiHieuLuc !== 'DA_DONG' && r.trangThaiHieuLuc !== 'DA_HUY')
  const dsGap = dangMo.filter((r) => r.mucDo !== 'THUONG')
  const dsDangLam = dangMo
  const dsXong = danhSach.filter((r) => r.trangThaiHieuLuc === 'DA_DONG' || r.trangThaiHieuLuc === 'DA_HUY')
  const soChuaBaoGia = dangMo.filter((r) => r.giaTriBaoGia == null).length
  const locHieuLuc: LocViec = loc ?? (dsGap.length > 0 ? 'gap' : 'dang-lam')
  const dsMobile = locHieuLuc === 'gap' ? dsGap : locHieuLuc === 'xong' ? dsXong : dsDangLam
  const viTriNutChinh = dsMobile.findIndex((r) => nutChinhCuaViec(r).hanhDong !== 'KHONG')

  return (
    <div style={{ maxWidth: 1240, display: 'grid', gap: 20 }} data-testid="worker-jobs-screen">
      {mobile ? (
        <>
          <div className="spread" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 className="h1" style={{ margin: 0 }}>Việc của tôi</h2>
              <div className="t-meta">
                {[tomTat.hoTen, new Date().toLocaleDateString('vi-VN')].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button type="button" className="icon-btn touch" aria-label="Tìm việc" aria-expanded={hienTim} onClick={() => setHienTim((v) => !v)}>
              <Icon name="search" />
            </button>
          </div>
          <div className="m-sum" aria-label="Tóm tắt">
            <div>
              <div className="v">{tomTat.kpi?.dangXuLy ?? '–'}</div>
              <div className="k">đang làm</div>
            </div>
            <div>
              <div className="v">{soChuaBaoGia}</div>
              <div className="k">chưa báo giá</div>
            </div>
            <div>
              <div className="v">{tomTat.kpi ? `${(tomTat.kpi.conPhaiTra / 1e6).toFixed(2).replace('.', ',')} tr` : '–'}</div>
              <div className="k">còn được trả</div>
            </div>
          </div>
          <nav className="seg seg-links" aria-label="Lọc việc">
            {([
              ['gap', `Gấp (${dsGap.length})`],
              ['dang-lam', `Đang làm (${dsDangLam.length})`],
              ['xong', `Xong (${dsXong.length})`],
            ] as const).map(([key, label]) => (
              <a key={key} href={`?loc=${key}`} aria-current={locHieuLuc === key ? 'true' : undefined} onClick={(e) => chonLoc(e, key)}>
                {label}
              </a>
            ))}
          </nav>
        </>
      ) : (
      <div style={{ display: 'grid', gap: 14, borderBottom: '1px solid var(--ma-border-default)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 className="h1" style={{ margin: '0 0 4px' }}>
              Danh sách công việc
            </h1>
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 13.5 }}>
              Quản lý các sự cố được giao, khảo sát hiện trường, lập báo giá và báo hoàn thành.
            </p>
          </div>
        </div>

        {/* Status Group Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} role="tablist">
          {[
            { key: 'DANG_LAM', label: 'Đang làm / Cần xử lý' },
            { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
            { key: 'LICH_SU', label: 'Lịch sử (Đã đóng / Hủy)' },
            { key: 'TAT_CA', label: 'Tất cả' },
          ].map((tab) => {
            const active = nhomTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setNhomTab(tab.key as typeof nhomTab)}
                style={{
                  padding: '8px 16px',
                  minHeight: 36,
                  borderRadius: 8,
                  border: active ? '2px solid var(--ma-brand-primary, #2563EB)' : '1px solid var(--ma-border-default)',
                  background: active ? 'rgba(37, 99, 235, 0.08)' : 'var(--ma-bg-card)',
                  color: active ? 'var(--ma-brand-primary, #2563EB)' : 'var(--ma-text-primary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      )}

      {/* Filter and Search Bar */}
      {!mobile || hienTim ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Tìm phòng, mã đơn, hạng mục..."
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          aria-label="Tìm kiếm công việc"
          style={{
            flex: '1 1 200px',
            minWidth: 180,
            height: 38,
            padding: '0 12px',
            borderRadius: 6,
            border: '1px solid var(--ma-border-strong, #cbd5e1)',
            background: 'var(--ma-bg-card)',
            color: 'var(--ma-text-primary)',
            fontSize: 13.5,
          }}
        />

        {toaNhaList.length > 0 ? (
          <select
            value={toaNhaId ?? ''}
            onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : undefined)}
            aria-label="Lọc theo toà nhà"
            style={styleSelect}
          >
            <option value="">Tất cả toà ({toaNhaList.length})</option>
            {toaNhaList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ten}
              </option>
            ))}
          </select>
        ) : null}

        <select
          value={mucDo}
          onChange={(e) => setMucDo(e.target.value)}
          aria-label="Lọc theo mức độ"
          style={styleSelect}
        >
          <option value="">Tất cả mức độ</option>
          <option value="THUONG">Bình thường</option>
          <option value="GAP">Gấp</option>
          <option value="KHAN_CAP">Khẩn cấp</option>
        </select>
      </div>
      ) : null}

      {/* Main List / Table */}
      {dangTai ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ma-text-secondary)' }}>
          Đang tải danh sách công việc...
        </div>
      ) : loiTai ? (
        <div style={{ padding: 24, textAlign: 'center', background: 'var(--ma-urgent-bg)', color: 'var(--ma-urgent)' }}>
          {loiTai}
        </div>
      ) : (mobile ? dsMobile : danhSach).length === 0 ? (
        <EmptyState
          title="Không tìm thấy công việc nào"
          body="Không có việc sửa chữa nào phù hợp với bộ lọc hiện tại của bạn."
        />
      ) : mobile ? (
        /* Mobile Card Layout */
        <div style={{ display: 'grid', gap: 12 }}>
          {dsMobile.map((row, i) => {
            const nutChinh = nutChinhCuaViec(row)
            const buoc = buocViecTho(row)
            const phong = row.soPhong.replace(/^P\.?\s*/i, '')
            return (
              <article
                key={row.id}
                className="job"
                onClick={() => moChiTiet(row.id)}
                style={{ cursor: 'pointer' }}
                aria-labelledby={`viec-${row.id}`}
                data-testid={`worker-task-row-${row.id}`}
              >
                <div className="row" style={{ gap: 8 }}>
                  {row.mucDo !== 'THUONG' ? (
                    <span className={`tag ${row.mucDo === 'KHAN_CAP' ? 'tag-danger' : 'tag-warning'}`}>
                      <Icon name="alert" size="sm" />
                      {row.tenMucDo}
                    </span>
                  ) : null}
                  <span className="tag tag-info">{row.tenTrangThaiHieuLuc}</span>
                  <span className="push t-meta">{ngayNganGon(row.taoLuc)}</span>
                </div>
                <div>
                  <h2 className="t" id={`viec-${row.id}`} style={{ margin: 0 }}>
                    <button type="button" className="hit" style={styleNutTieuDe} onClick={(e) => { e.stopPropagation(); moChiTiet(row.id) }}>
                      {row.hangMuc}
                    </button>
                  </h2>
                  <div className="s">{row.toaNha} · Phòng {phong} · Tầng {row.tang}</div>
                  <div className="s">{row.nguoiLienHeHoTen} · {row.soDienThoaiLienHe}</div>
                </div>
                <div className="dots" aria-label={buoc.nhan}>
                  {[0, 1, 2, 3].map((k) => <i key={k} className={k < buoc.so ? 'on' : ''} />)}
                  <span>{buoc.nhan}</span>
                </div>
                <div className="acts">
                  <a className="icon-btn touch boxed" href={`tel:${row.soDienThoaiLienHe}`} aria-label={`Gọi ${row.nguoiLienHeHoTen}`} onClick={(e) => e.stopPropagation()}>
                    <Icon name="phone" />
                  </a>
                  {nutChinh.hanhDong === 'KHONG' ? (
                    <span className="t-sm t-2" style={{ flex: 1, alignSelf: 'center' }}>{nutChinh.nhan}</span>
                  ) : (
                    <Button
                      variant={i === viTriNutChinh ? 'primary' : 'secondary'}
                      className="btn-touch"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleNutChinh(row, nutChinh.hanhDong)
                      }}
                    >
                      {nutChinh.nhan}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        /* Desktop Wide Table Layout */
        <div style={{ background: 'var(--ma-bg-card)', border: '1px solid var(--ma-border-default)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: 'var(--ma-bg-sunken)', borderBottom: '1px solid var(--ma-border-default)', color: 'var(--ma-text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mã & Hạng mục</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tòa & Phòng</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Người liên hệ</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mức độ</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Báo giá & Thanh toán</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: '1px solid var(--ma-border-default)', transition: 'background 0.15s ease' }}
                  data-testid={`worker-task-row-${row.id}`}
                >
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{row.maYeuCau}</div>
                    <div style={{ color: 'var(--ma-text-primary)', marginTop: 2 }}>{row.hangMuc}</div>
                    <div style={{ color: 'var(--ma-text-secondary)', fontSize: 13, marginTop: 4, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.moTa}
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600 }}>P.{row.soPhong}</div>
                    <div style={{ color: 'var(--ma-text-secondary)', fontSize: 13 }}>{row.toaNha}</div>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div>{row.nguoiLienHeHoTen}</div>
                    <a href={`tel:${row.soDienThoaiLienHe}`} style={{ color: 'var(--ma-brand-primary, #2563EB)', textDecoration: 'none', fontSize: 13 }}>
                      {row.soDienThoaiLienHe}
                    </a>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <StatusTag tone={row.mucDo === 'KHAN_CAP' ? 'urgent' : row.mucDo === 'GAP' ? 'waiting' : 'neutral'}>
                      {row.tenMucDo}
                    </StatusTag>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <StatusTag tone={row.trangThaiHieuLuc === 'DA_DONG' ? 'done' : row.trangThaiHieuLuc === 'CHO_XAC_NHAN' ? 'waiting' : 'neutral'}>
                      {row.tenTrangThaiHieuLuc}
                    </StatusTag>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div>
                      {row.giaTriBaoGia != null ? (
                        <strong>{dinhDangTien(row.giaTriBaoGia)} đ</strong>
                      ) : (
                        <span style={{ color: 'var(--ma-text-secondary)' }}>Chưa có báo giá</span>
                      )}
                    </div>
                    {row.daThanhToan > 0 ? (
                      <div style={{ fontSize: 13, color: '#059669', marginTop: 2 }}>
                        Đã nhận: {dinhDangTien(row.daThanhToan)} đ
                      </div>
                    ) : null}
                    {row.conPhaiTra > 0 ? (
                      <div style={{ fontSize: 13, color: '#DC2626', marginTop: 2 }}>
                        Còn: {dinhDangTien(row.conPhaiTra)} đ
                      </div>
                    ) : null}
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                    <Button variant="secondary" onClick={() => moChiTiet(row.id)}>
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {chiTietId ? (
        <div style={styleDrawerOverlay} role="dialog" aria-modal="true" aria-labelledby="drawer-title" data-testid="task-detail-drawer">
          <div ref={drawerRef} style={styleDrawerContent(mobile)} tabIndex={-1}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }}>
              <div>
                <h2 id="drawer-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Chi tiết sự cố: {chiTietData?.maYeuCau ?? `SC-${chiTietId}`}
                </h2>
                <div style={{ color: 'var(--ma-text-secondary)', fontSize: 13, marginTop: 2 }}>
                  {chiTietData?.toaNha} · Phòng {chiTietData?.soPhong}
                </div>
              </div>
              <Button variant="text" onClick={dongChiTiet} aria-label="Đóng chi tiết">
                ✕ Đóng (ESC)
              </Button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gap: 20 }}>
              {dangTaiChiTiet ? (
                <div style={{ padding: 40, textAlign: 'center' }}>Đang tải chi tiết sự cố...</div>
              ) : loiChiTiet ? (
                <div style={{ padding: 20, background: 'var(--ma-urgent-bg)', color: 'var(--ma-urgent)' }}>{loiChiTiet}</div>
              ) : chiTietData ? (
                <>
                  {thongBaoThanhCong ? (
                    <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', color: '#059669', borderRadius: 8, fontSize: 13.5 }}>
                      ✓ {thongBaoThanhCong}
                    </div>
                  ) : null}

                  {/* Badges bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <StatusTag tone={chiTietData.mucDo === 'KHAN_CAP' ? 'urgent' : chiTietData.mucDo === 'GAP' ? 'waiting' : 'neutral'}>
                      Mức độ: {chiTietData.tenMucDo}
                    </StatusTag>
                    <StatusTag tone={chiTietData.trangThaiHieuLuc === 'DA_DONG' ? 'done' : chiTietData.trangThaiHieuLuc === 'CHO_XAC_NHAN' ? 'waiting' : 'neutral'}>
                      Trạng thái: {chiTietData.tenTrangThaiHieuLuc}
                    </StatusTag>
                    <StatusTag tone={chiTietData.trangThaiThanhToan === 'DA_THANH_TOAN_DU' ? 'done' : chiTietData.trangThaiThanhToan === 'KHONG_PHAT_SINH_TIEN' ? 'neutral' : 'waiting'}>
                      Thanh toán: {dichTrangThaiThanhToan(chiTietData.trangThaiThanhToan)}
                    </StatusTag>
                  </div>

                  {/* Section 1: Location & Copy address */}
                  <div style={styleDetailSection}>
                    <SysLabel>Địa điểm & Phòng</SysLabel>
                    <div style={{ display: 'grid', gap: 6, fontSize: 13.5 }}>
                      <div>
                        <strong>Toà nhà:</strong> {chiTietData.toaNha} (Tầng {chiTietData.tang}, Phòng {chiTietData.soPhong})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <span>
                          <strong>Địa chỉ:</strong> {chiTietData.diaChiToaNha}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(chiTietData.diaChiToaNha)
                            alert('Đã sao chép địa chỉ toà nhà!')
                          }}
                          style={styleSmallActionBtn}
                        >
                          📋 Sao chép địa chỉ
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chiTietData.diaChiToaNha)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styleSmallActionBtn}
                        >
                          📍 Mở Google Maps ↗
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact Persons */}
                  <div style={styleDetailSection}>
                    <SysLabel>Thông tin liên hệ</SysLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13.5 }}>
                      <div style={{ background: 'var(--ma-bg-sunken)', padding: 10, borderRadius: 6 }}>
                        <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Người báo hỏng</div>
                        <strong>{chiTietData.nguoiBaoHoTen}</strong>
                        <div>
                          <a href={`tel:${chiTietData.nguoiBaoSoDienThoai}`} style={{ color: 'var(--ma-brand-primary, #2563EB)' }}>
                            📞 {chiTietData.nguoiBaoSoDienThoai}
                          </a>
                        </div>
                      </div>

                      <div style={{ background: 'var(--ma-bg-sunken)', padding: 10, borderRadius: 6 }}>
                        <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                          Người liên hệ thực tế {chiTietData.laNguoiDungTenHopDong ? '(Đứng tên HĐ)' : ''}
                        </div>
                        <strong>{chiTietData.nguoiLienHeHoTen}</strong>
                        <div>
                          <a href={`tel:${chiTietData.soDienThoaiLienHe}`} style={{ color: 'var(--ma-brand-primary, #2563EB)' }}>
                            📞 {chiTietData.soDienThoaiLienHe}
                          </a>
                        </div>
                      </div>

                      {chiTietData.quanLyPhuTrachHoTen ? (
                        <div style={{ background: 'var(--ma-bg-sunken)', padding: 10, borderRadius: 6 }}>
                          <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Quản lý phụ trách</div>
                          <strong>{chiTietData.quanLyPhuTrachHoTen}</strong>
                          <div>
                            <a href={`tel:${chiTietData.quanLyPhuTrachSoDienThoai}`} style={{ color: 'var(--ma-brand-primary, #2563EB)' }}>
                              📞 {chiTietData.quanLyPhuTrachSoDienThoai}
                            </a>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Section 3: Description & Photos */}
                  <div style={styleDetailSection}>
                    <SysLabel>Mô tả sự cố & Ảnh hiện trường</SysLabel>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ma-text-primary)', marginBottom: 6 }}>
                      {chiTietData.hangMuc}
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ma-text-primary)' }}>
                      {chiTietData.moTa}
                    </p>

                    {chiTietData.anhTruocIds.length > 0 ? (
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)', marginBottom: 6 }}>Ảnh hiện trường sự cố:</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {chiTietData.anhTruocIds.map((pid) => (
                            <div key={pid} style={stylePhotoBox}>
                              {photoUrls[pid] ? (
                                <img src={photoUrls[pid]} alt="Ảnh sự cố" style={stylePhotoImg} />
                              ) : (
                                <span style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Đang tải ảnh...</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)', fontStyle: 'italic' }}>Không có ảnh đính kèm ban đầu.</div>
                    )}
                  </div>

                  {/* Section 4: Survey & Repair Action Form */}
                  <div style={styleDetailSection}>
                    <SysLabel>Khảo sát & Tiến độ sửa chữa</SysLabel>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          Ghi chú khảo sát kỹ thuật
                        </label>
                        <textarea
                          rows={2}
                          value={ghiChuKhaoSatForm}
                          onChange={(e) => setGhiChuKhaoSatForm(e.target.value)}
                          placeholder="Mô tả nguyên nhân, hiện trạng khảo sát, linh kiện cần chuẩn bị..."
                          style={styleTextarea}
                        />
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            onClick={handleLuuKhaoSat}
                            blocked={dangXuLyHanhDong}
                            style={{ fontSize: 13, height: 32 }}
                          >
                            Lưu khảo sát
                          </Button>
                        </div>
                      </div>

                      {chiTietData.trangThaiHieuLuc !== 'DA_DONG' && chiTietData.trangThaiHieuLuc !== 'DA_HUY' ? (
                        <div style={{ borderTop: '1px dashed var(--ma-border-default)', paddingTop: 12 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Kết quả sửa chữa (khi hoàn thành)
                          </label>
                          <textarea
                            rows={2}
                            value={ketQuaSuaChuaForm}
                            onChange={(e) => setKetQuaSuaChuaForm(e.target.value)}
                            placeholder="Mô tả kết quả sau khi đã sửa xong, các việc đã thực hiện..."
                            style={styleTextarea}
                          />
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                              Báo xong sẽ chuyển trạng thái sang Chờ xác nhận để người thuê và quản lý nghiệm thu.
                            </span>
                            <Button
                              onClick={handleBaoXong}
                              blocked={dangXuLyHanhDong || !ketQuaSuaChuaForm.trim()}
                              style={{ fontSize: 13, height: 36 }}
                            >
                              ✓ Báo đã sửa xong
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Section 5: Quotes & Pricing */}
                  <div style={styleDetailSection}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <SysLabel>Báo giá & Chi phí sửa chữa</SysLabel>
                      {!hienFormBaoGia ? (
                        <Button
                          variant="secondary"
                          onClick={() => setHienFormBaoGia(true)}
                          style={{ fontSize: 13, height: 30 }}
                        >
                          + Tạo báo giá mới
                        </Button>
                      ) : null}
                    </div>

                    {/* Interactive Form for New Quote */}
                    {hienFormBaoGia ? (
                      <div style={{ background: 'var(--ma-bg-sunken)', padding: 14, borderRadius: 8, marginBottom: 14, display: 'grid', gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>Lập báo giá mới</div>
                        <input
                          type="text"
                          placeholder="Mô tả tóm tắt phương án xử lý..."
                          value={moTaBaoGia}
                          onChange={(e) => setMoTaBaoGia(e.target.value)}
                          style={styleInput}
                        />

                        <div style={{ display: 'grid', gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>Các dòng vật tư / công thợ:</div>
                          {dongBaoGiaForm.map((line, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Tên vật tư / công việc"
                                value={line.tenHangMuc}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setDongBaoGiaForm((curr) => curr.map((c, i) => (i === idx ? { ...c, tenHangMuc: val } : c)))
                                }}
                                style={{ ...styleInput, flex: 2 }}
                              />
                              <input
                                type="number"
                                placeholder="SL"
                                min={0.1}
                                step={0.1}
                                value={line.soLuong}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  setDongBaoGiaForm((curr) => curr.map((c, i) => (i === idx ? { ...c, soLuong: val } : c)))
                                }}
                                style={{ ...styleInput, width: 60 }}
                              />
                              <input
                                type="text"
                                placeholder="Đơn vị"
                                value={line.donVi}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setDongBaoGiaForm((curr) => curr.map((c, i) => (i === idx ? { ...c, donVi: val } : c)))
                                }}
                                style={{ ...styleInput, width: 70 }}
                              />
                              <input
                                type="number"
                                placeholder="Đơn giá"
                                min={0}
                                step={1000}
                                value={line.donGia}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  setDongBaoGiaForm((curr) => curr.map((c, i) => (i === idx ? { ...c, donGia: val } : c)))
                                }}
                                style={{ ...styleInput, width: 110 }}
                              />
                              {dongBaoGiaForm.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setDongBaoGiaForm((curr) => curr.filter((_, i) => i !== idx))}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0 4px' }}
                                >
                                  ✕
                                </button>
                              ) : null}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => setDongBaoGiaForm((curr) => [...curr, { tenHangMuc: '', soLuong: 1, donVi: 'gói', donGia: 0 }])}
                            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--ma-brand-primary, #2563EB)', cursor: 'pointer', fontSize: 13 }}
                          >
                            + Thêm dòng vật tư
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                          <Button variant="secondary" onClick={() => setHienFormBaoGia(false)}>
                            Hủy
                          </Button>
                          <Button variant="secondary" onClick={() => handleTaoBaoGia(false)} blocked={dangXuLyHanhDong}>
                            Lưu bản nháp
                          </Button>
                          <Button onClick={() => handleTaoBaoGia(true)} blocked={dangXuLyHanhDong}>
                            Gửi duyệt ngay
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {/* Existing Quotes list */}
                    {chiTietData.danhSachBaoGia.length === 0 ? (
                      <p style={{ color: 'var(--ma-text-secondary)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                        Chưa có báo giá nào được tạo cho sự cố này.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: 12 }}>
                        {chiTietData.danhSachBaoGia.map((bg) => (
                          <div
                            key={bg.id}
                            style={{
                              border: bg.trangThai === 'DA_DUYET' ? '2px solid #10B981' : '1px solid var(--ma-border-default)',
                              borderRadius: 8,
                              padding: '12px 14px',
                              background: bg.trangThai === 'DA_DUYET' ? 'rgba(16, 185, 129, 0.04)' : 'var(--ma-bg-card)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div>
                                <strong>{bg.maBaoGia}</strong> (Phiên bản {bg.phienBan})
                                {bg.moTa ? <span style={{ color: 'var(--ma-text-secondary)', marginLeft: 8 }}>· {bg.moTa}</span> : null}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <StatusTag tone={bg.trangThai === 'DA_DUYET' ? 'done' : bg.trangThai === 'TU_CHOI' ? 'urgent' : 'waiting'}>
                                  {dichTrangThaiBaoGia(bg.trangThai)}
                                </StatusTag>
                                {bg.trangThai === 'NHAP' ? (
                                  <Button variant="secondary" onClick={() => handleGuiDuyetBaoGia(bg.id)} blocked={dangXuLyHanhDong} style={{ fontSize: 13, height: 28, padding: '0 8px' }}>
                                    Gửi duyệt
                                  </Button>
                                ) : null}
                              </div>
                            </div>

                            {/* Line items table */}
                            {bg.dongBaoGia.length > 0 ? (
                              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 8 }}>
                                <thead>
                                  <tr style={{ color: 'var(--ma-text-secondary)', borderBottom: '1px solid var(--ma-border-default)' }}>
                                    <th style={{ textAlign: 'left', padding: '4px 0' }}>Hạng mục</th>
                                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>SL</th>
                                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Đơn giá</th>
                                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bg.dongBaoGia.map((d, di) => (
                                    <tr key={di} style={{ borderBottom: '1px dashed var(--ma-border-default)' }}>
                                      <td style={{ padding: '4px 0' }}>{d.tenHangMuc}</td>
                                      <td style={{ textAlign: 'center', padding: '4px 8px' }}>
                                        {d.soLuong} {d.donVi}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>{dinhDangTien(d.donGia)} đ</td>
                                      <td style={{ textAlign: 'right', padding: '4px 0' }}>{dinhDangTien(d.thanhTien)} đ</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : null}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                              <span style={{ color: 'var(--ma-text-secondary)' }}>Tổng giá trị:</span>
                              <strong style={{ fontSize: 15, color: bg.trangThai === 'DA_DUYET' ? '#059669' : 'var(--ma-text-primary)' }}>
                                {dinhDangTien(bg.tongTien)} đ
                              </strong>
                            </div>

                            {bg.lyDoTuChoi ? (
                              <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 6, fontSize: 13, color: 'var(--ma-urgent)' }}>
                                <strong>Lý do từ chối:</strong> {bg.lyDoTuChoi}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 6: Payment history & Voucher */}
                  <div style={styleDetailSection}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <SysLabel>Thanh toán & Chứng từ</SysLabel>
                      {chiTietData.baoGiaHieuLuc ? (
                        <Button
                          variant="secondary"
                          onClick={() => handleXemChungTu(chiTietData.id)}
                          style={{ fontSize: 13, height: 30 }}
                        >
                          📄 Xem & In chứng từ
                        </Button>
                      ) : null}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'var(--ma-bg-sunken)', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Được duyệt</div>
                        <strong style={{ fontSize: 14 }}>{dinhDangTien(chiTietData.tongTienBaoGia)} đ</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Đã nhận</div>
                        <strong style={{ fontSize: 14, color: '#059669' }}>{dinhDangTien(chiTietData.tongDaNhan)} đ</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>Còn lại</div>
                        <strong style={{ fontSize: 14, color: chiTietData.tongConLai > 0 ? '#DC2626' : 'var(--ma-text-primary)' }}>
                          {dinhDangTien(chiTietData.tongConLai)} đ
                        </strong>
                      </div>
                    </div>

                    {chiTietData.danhSachThanhToan.length === 0 ? (
                      <p style={{ color: 'var(--ma-text-secondary)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                        Chưa có giao dịch thanh toán nào được ghi nhận.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {chiTietData.danhSachThanhToan.map((tt) => (
                          <div key={tt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ma-bg-card)', border: '1px solid var(--ma-border-default)', borderRadius: 6, fontSize: 13 }}>
                            <div>
                              <strong>{tt.maThanhToan}</strong> · {dichPhuongThuc(tt.phuongThuc)}
                              {tt.maThamChieu ? <span style={{ color: 'var(--ma-text-secondary)', marginLeft: 6 }}>Ref: {tt.maThamChieu}</span> : null}
                            </div>
                            <strong style={{ color: '#059669' }}>{dinhDangTien(tt.soTien)} đ</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 7: Audit Timeline */}
                  <div style={styleDetailSection}>
                    <SysLabel>Lịch sử thay đổi trạng thái</SysLabel>
                    <div style={{ display: 'grid', gap: 10, position: 'relative', paddingLeft: 16 }}>
                      <div style={{ position: 'absolute', top: 6, bottom: 6, left: 6, width: 2, background: 'var(--ma-border-default)' }} />
                      {chiTietData.lichSuTrangThai.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'grid', gap: 2, fontSize: 13 }}>
                          <span style={{ position: 'absolute', left: -14, top: 4, width: 8, height: 8, borderRadius: '50%', background: item.laTuDong ? '#F59E0B' : 'var(--ma-brand-primary, #2563EB)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>{item.tenHanhDong}</strong>
                            <span style={{ color: 'var(--ma-text-secondary)', fontSize: 13 }}>
                              {new Date(item.thoiDiem).toLocaleString('vi-VN')}
                            </span>
                            {item.laTuDong ? <StatusTag tone="waiting">Tự động</StatusTag> : null}
                          </div>
                          <div style={{ color: 'var(--ma-text-secondary)' }}>Thực hiện bởi: {item.nguoiThucHien}</div>
                          {item.chiTiet ? <div style={{ color: 'var(--ma-text-primary)', fontStyle: 'italic' }}>{item.chiTiet}</div> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* VOUCHER PRINTABLE MODAL */}
      {voucherData ? (
        <div style={styleDrawerOverlay} role="dialog" aria-modal="true" aria-labelledby="voucher-title">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-voucher-congviec, #printable-voucher-congviec * { visibility: visible !important; }
              #printable-voucher-congviec {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 20px !important;
                margin: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
              }
              .ma-no-print { display: none !important; }
            }
          `}</style>
          <div id="printable-voucher-congviec" ref={voucherRef} style={{ background: '#ffffff', color: '#0f172a', width: 'min(92%, 760px)', maxHeight: '90vh', overflowY: 'auto', borderRadius: 12, padding: 32, boxShadow: 'var(--ma-shadow-lg)' }} tabIndex={-1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h2 id="voucher-title" style={{ margin: '0 0 4px', fontSize: 22 }}>
                  Phiếu chi phí & Thanh toán sửa chữa
                </h2>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  Số chứng từ: <strong>{voucherData.maChungTu}</strong> · Ngày lập: {voucherData.ngayLap}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }} className="ma-no-print">
                <Button onClick={() => window.print()} style={{ fontSize: 13 }}>
                  🖨 In chứng từ
                </Button>
                <Button variant="secondary" onClick={() => setVoucherData(null)} style={{ fontSize: 13 }}>
                  Đóng
                </Button>
              </div>
            </div>

            {/* Voucher Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, marginBottom: 20 }}>
              <div>
                <div><strong>Toà nhà:</strong> {voucherData.toaNha}</div>
                <div><strong>Địa chỉ:</strong> {voucherData.diaChiToaNha}</div>
                <div><strong>Phòng:</strong> {voucherData.soPhong} (Tầng {voucherData.tang})</div>
                <div><strong>Mã yêu cầu:</strong> {voucherData.maYeuCau}</div>
                <div><strong>Hạng mục:</strong> {voucherData.hangMuc}</div>
              </div>
              <div>
                <div><strong>Thợ sửa chữa:</strong> {voucherData.tenTho} ({voucherData.sdtTho})</div>
                <div><strong>Quản lý xác nhận:</strong> {voucherData.tenQuanLy} ({voucherData.sdtQuanLy})</div>
                <div><strong>Người báo / liên hệ:</strong> {voucherData.tenNguoiBao} ({voucherData.sdtNguoiBao})</div>
                <div><strong>Trạng thái sửa chữa:</strong> {voucherData.trangThaiYeuCau}</div>
              </div>
            </div>

            {/* Line items table */}
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Chi tiết chi phí (Phiên bản {voucherData.baoGiaPhienBan})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>STT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hạng mục vật tư / công sửa</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Số lượng</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá (đ)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                {voucherData.dongBaoGia.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px' }}>{item.tenHangMuc}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.soLuong} {item.donVi}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{dinhDangTien(item.donGia)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{dinhDangTien(item.thanhTien)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                  <td colSpan={4} style={{ padding: '10px', textAlign: 'right' }}>Tổng chi phí được duyệt:</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{dinhDangTien(voucherData.tongTienBaoGia)} đ</td>
                </tr>
              </tbody>
            </table>

            {/* Payment history */}
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Lịch sử giao dịch thanh toán</h4>
            {voucherData.lichSuThanhToan.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 24 }}>Chưa ghi nhận giao dịch thanh toán.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Mã GD</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Thời điểm</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Phương thức</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Tham chiếu</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Số tiền (đ)</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherData.lichSuThanhToan.map((tt) => (
                    <tr key={tt.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px' }}>{tt.maThanhToan}</td>
                      <td style={{ padding: '6px 10px' }}>{new Date(tt.xacNhanLuc).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '6px 10px' }}>{dichPhuongThuc(tt.phuongThuc)}</td>
                      <td style={{ padding: '6px 10px' }}>{tt.maThamChieu ?? '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{dinhDangTien(tt.soTien)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                    <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right' }}>Đã thanh toán / Còn lại:</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {dinhDangTien(voucherData.tongDaTra)} đ / {dinhDangTien(voucherData.conLai)} đ
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              <div>
                <strong>Người báo / Cư dân</strong>
                <div style={{ height: 60 }} />
                <div>{voucherData.tenNguoiBao}</div>
              </div>
              <div>
                <strong>Thợ sửa chữa</strong>
                <div style={{ height: 60 }} />
                <div>{voucherData.tenTho}</div>
              </div>
              <div>
                <strong>Đại diện Ban quản trị</strong>
                <div style={{ height: 60 }} />
                <div>{voucherData.tenQuanLy}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type LocViec = 'gap' | 'dang-lam' | 'xong'
type HanhDongChinh = 'NHAN_VIEC' | 'LAP_BAO_GIA' | 'BAO_XONG' | 'XEM' | 'KHONG'

function docLoc(): LocViec | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('loc')
  return v === 'gap' || v === 'dang-lam' || v === 'xong' ? v : null
}

const TEN_BUOC = ['Khảo sát', 'Báo giá', 'Sửa', 'Nhận tiền']

/** Bước 1..4 của việc: nhận việc → báo giá → sửa (báo giá đã duyệt) → nhận tiền (chờ xác nhận/đã đóng). */
export function buocViecTho(r: Pick<ThongTinViecThoRow, 'trangThaiHieuLuc' | 'trangThaiBaoGia'>): { so: number; nhan: string } {
  const so =
    r.trangThaiHieuLuc === 'DA_PHAN_CONG' ? 1
    : r.trangThaiHieuLuc === 'DANG_XU_LY' ? (r.trangThaiBaoGia === 'DA_DUYET' ? 3 : 2)
    : 4
  return { so, nhan: `Bước ${so}/4 · ${TEN_BUOC[so - 1]}` }
}

/** Đúng một nút kế tiếp trên thẻ theo bước; bước nhận tiền không có nút. */
function nutChinhCuaViec(r: ThongTinViecThoRow): { hanhDong: HanhDongChinh; nhan: string } {
  if (r.trangThaiHieuLuc === 'DA_PHAN_CONG') return { hanhDong: 'NHAN_VIEC', nhan: 'Bắt đầu khảo sát' }
  if (r.trangThaiHieuLuc === 'DANG_XU_LY') {
    if (r.trangThaiBaoGia === 'DA_DUYET') return { hanhDong: 'BAO_XONG', nhan: 'Báo đã sửa xong' }
    if (r.trangThaiBaoGia === 'NHAP' || r.trangThaiBaoGia === 'CHO_DUYET') return { hanhDong: 'XEM', nhan: 'Xem báo giá' }
    return { hanhDong: 'LAP_BAO_GIA', nhan: 'Gửi báo giá' }
  }
  return { hanhDong: 'KHONG', nhan: 'Chờ quản lý thanh toán' }
}

function ngayNganGon(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dichTrangThaiBaoGia(tt: string): string {
  switch (tt) {
    case 'NHAP': return 'Bản nháp'
    case 'CHO_DUYET': return 'Chờ duyệt'
    case 'DA_DUYET': return 'Đã duyệt'
    case 'TU_CHOI': return 'Bị từ chối'
    case 'BI_THAY_THE': return 'Bị thay thế'
    default: return tt
  }
}

function dichPhuongThuc(pt: string): string {
  switch (pt) {
    case 'CHUYEN_KHOAN': return 'Chuyển khoản'
    case 'TIEN_MAT': return 'Tiền mặt'
    case 'KHONG_THU_PHI': return 'Bảo hành (0 đ)'
    default: return pt
  }
}

function dichTrangThaiThanhToan(tt: string): string {
  switch (tt) {
    case 'CHUA_CO_BAO_GIA': return 'Chưa có báo giá'
    case 'KHONG_PHAT_SINH_TIEN': return 'Đã đối soát (0 đ)'
    case 'CHUA_THANH_TOAN': return 'Chưa thanh toán'
    case 'THANH_TOAN_MOT_PHAN': return 'Trả một phần'
    case 'DA_THANH_TOAN_DU': return 'Đã trả đủ'
    default: return tt
  }
}

const styleNutTieuDe: CSSProperties = { background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'block' }

const styleSelect: CSSProperties = {
  height: 38,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--ma-border-strong, #cbd5e1)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontSize: 13.5,
}





const styleDrawerOverlay: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  justifyContent: 'flex-end',
  zIndex: 1000,
}

function styleDrawerContent(mobile: boolean): CSSProperties {
  return {
    width: mobile ? '100%' : 'min(90vw, 680px)',
    height: '100%',
    background: 'var(--ma-bg-page)',
    color: 'var(--ma-text-primary)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--ma-shadow-xl, -4px 0 24px rgba(0,0,0,0.2))',
  }
}

const styleDetailSection: CSSProperties = {
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 10,
  padding: '14px 16px',
}

const styleSmallActionBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 4,
  border: '1px solid var(--ma-border-strong, #cbd5e1)',
  background: 'var(--ma-bg-sunken)',
  color: 'var(--ma-text-primary)',
  fontSize: 13,
  cursor: 'pointer',
  textDecoration: 'none',
}

const stylePhotoBox: CSSProperties = {
  width: 90,
  height: 90,
  borderRadius: 6,
  overflow: 'hidden',
  background: 'var(--ma-bg-sunken)',
  border: '1px solid var(--ma-border-default)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const stylePhotoImg: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const styleTextarea: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--ma-border-strong, #cbd5e1)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const styleInput: CSSProperties = {
  height: 34,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--ma-border-strong, #cbd5e1)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontSize: 13,
  boxSizing: 'border-box',
}
