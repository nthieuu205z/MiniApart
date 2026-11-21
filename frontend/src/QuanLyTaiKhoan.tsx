import { FormEvent, useEffect, useState } from 'react'
import {
  ApiError,
  capNhatNguoiDungQuanLy,
  fetchCurrentUser,
  fetchNguoiDungQuanLy,
  fetchToaNha,
  fetchVaiTro,
  khoaNguoiDungQuanLy,
  taoNguoiDungQuanLy,
  type ThongTinQuanLyNguoiDung,
  type ThongTinToaNha,
  type ThongTinVaiTro,
  type YeuCauQuanLyNguoiDung,
} from './api'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { Icon } from './design/core/Icon'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'
import { Card } from './design/layout/Card'
import { ActionRow, CheckboxField, CheckboxGroup, FormField, FormPanel, ScreenNotice } from './design/layout/Screen'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import { CSS_BANG_QUAN_TRI, MenuThaoTac, MucMenu, NguoiCoAvatar, nhomSoDienThoai } from './bangQuanTriChung'

type Props = {
  token: string
  mobile?: boolean
}

type BieuMauTaiKhoan = YeuCauQuanLyNguoiDung & {
  id: number | null
}

export default function QuanLyTaiKhoan({ token, mobile = false }: Props) {
  const [danhSach, setDanhSach] = useState<ThongTinQuanLyNguoiDung[]>([])
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [vaiTro, setVaiTro] = useState<ThongTinVaiTro[]>([])
  const [bieuMau, setBieuMau] = useState<BieuMauTaiKhoan | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [dangLuu, setDangLuu] = useState(false)
  const [idDangKhoa, setIdDangKhoa] = useState<number | null>(null)
  const [nguoiDungChoKhoa, setNguoiDungChoKhoa] = useState<ThongTinQuanLyNguoiDung | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [locTrangThai, setLocTrangThai] = useState<'' | 'HOAT_DONG' | 'KHOA'>('')
  const [idCuaToi, setIdCuaToi] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    Promise.all([fetchNguoiDungQuanLy(token), fetchToaNha(token), fetchVaiTro(token)])
      .then(([accounts, buildings, roles]) => {
        if (!mounted) return
        setDanhSach(accounts)
        setToaNha(buildings)
        setVaiTro(roles)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(thongBaoLoi(reason, 'Không thể tải dữ liệu quản lý tài khoản.'))
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  // "· bạn": lấy id người đang đăng nhập; lỗi thì thôi, không chặn màn hình.
  useEffect(() => { let mounted = true; fetchCurrentUser(token).then((me) => { if (mounted) setIdCuaToi(me.id) }).catch(() => undefined); return () => { mounted = false } }, [token])

  function batDauTao() {
    setThongBao(null)
    setLoi(null)
    setBieuMau({
      id: null,
      hoTen: '',
      soDienThoai: '',
      vaiTro: vaiTro[0]?.vaiTro ?? '',
      toaNhaIds: [],
    })
  }

  function batDauSua(nguoiDung: ThongTinQuanLyNguoiDung) {
    setThongBao(null)
    setLoi(null)
    setBieuMau({
      id: nguoiDung.id,
      hoTen: nguoiDung.hoTen,
      soDienThoai: nguoiDung.soDienThoai,
      vaiTro: nguoiDung.vaiTro,
      nguoiThueId: nguoiDung.nguoiThueId,
      toaNhaIds: nguoiDung.toaNhaIds,
    })
  }

  function huyBieuMau() {
    setBieuMau(null)
    setLoi(null)
  }

  async function luuTaiKhoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bieuMau) return

    setDangLuu(true)
    setLoi(null)
    setThongBao(null)
    const { id, ...payload } = bieuMau
    if (payload.vaiTro !== 'NGUOI_THUE') delete payload.nguoiThueId

    try {
      const taiKhoan = id === null
        ? await taoNguoiDungQuanLy(token, payload)
        : await capNhatNguoiDungQuanLy(token, id, payload)

      setDanhSach((current) => id === null
        ? [...current, taiKhoan]
        : current.map((item) => item.id === taiKhoan.id ? taiKhoan : item))
      setBieuMau(null)
      setThongBao(id === null ? 'Đã tạo tài khoản và gửi mã kích hoạt.' : 'Đã cập nhật tài khoản.')
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể lưu tài khoản.'))
    } finally {
      setDangLuu(false)
    }
  }

  async function khoaTaiKhoan(nguoiDung: ThongTinQuanLyNguoiDung) {
    setIdDangKhoa(nguoiDung.id)
    setLoi(null)
    setThongBao(null)

    try {
      const taiKhoan = await khoaNguoiDungQuanLy(token, nguoiDung.id)
      setDanhSach((current) => current.map((item) => item.id === taiKhoan.id ? taiKhoan : item))
      setThongBao(`Đã khoá tài khoản ${taiKhoan.hoTen}.`)
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể khoá tài khoản.'))
    } finally {
      setIdDangKhoa(null)
    }
  }

  const dangHoatDong = danhSach.filter((item) => item.trangThai === 'HOAT_DONG').length
  const tenToa = (ids: number[]) => ids.map((id) => toaNha.find((building) => building.id === id)?.ten ?? `Toà #${id}`)
  const hangHienThi = locTrangThai ? danhSach.filter((item) => (locTrangThai === 'KHOA' ? item.trangThai !== 'HOAT_DONG' : item.trangThai === 'HOAT_DONG')) : danhSach
  const chips = [{ key: 'TAT_CA', label: 'Tất cả', match: () => true }, ...vaiTroTheoThuTu(vaiTro, danhSach).map((role) => ({ key: role.vaiTro, label: NHAN_VAI_TRO[role.vaiTro] ?? role.tenVaiTro, match: (item: ThongTinQuanLyNguoiDung) => item.vaiTro === role.vaiTro }))]
  const cot: DataTableColumn<ThongTinQuanLyNguoiDung>[] = [
    { key: 'nguoiDung', label: 'Người dùng', sortable: true, sortValue: (item) => item.hoTen, render: (item) => <NguoiCoAvatar id={item.id} ten={item.hoTen} phu={<>{nhomSoDienThoai(item.soDienThoai)}{item.id === idCuaToi ? ' · bạn' : ''}</>} /> },
    { key: 'vaiTro', label: 'Vai trò', sortable: true, sortValue: (item) => item.tenVaiTro, render: (item) => <span className="bq-tag-vai">{item.tenVaiTro}</span> },
    { key: 'toa', label: 'Toà được giao', render: (item) => {
      const ten = tenToa(item.toaNhaIds)
      if (ten.length > 0) return <span className="bq-toa" title={ten.join(', ')}>{ten.join(', ')}</span>
      return <span style={{ color: 'var(--ma-text-muted)' }}>{item.vaiTro === 'QTHT' ? 'Toàn hệ thống' : item.vaiTro === 'NGUOI_THUE' ? 'Người thuê' : 'Chưa gán'}</span>
    } },
    { key: 'trangThai', label: 'Trạng thái', sortable: true, sortValue: (item) => item.tenTrangThai, render: (item) => <StatusTag tone={item.trangThai === 'BI_KHOA' ? 'closed' : 'done'}>{item.tenTrangThai}</StatusTag> },
    { key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong', render: (item) => (
      <div className="td-acts">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => batDauSua(item)}>Sửa<span className="sr-only"> {item.hoTen}</span></button>
        <MenuThaoTac nhan={`Thao tác khác cho ${item.hoTen}`}>{(dong) => <>
          <MucMenu icon="building" onClick={() => { dong(); batDauSua(item) }}>Đổi toà được giao</MucMenu>
          {item.trangThai === 'HOAT_DONG' ? <MucMenu icon="lock" nguyHiem onClick={() => { dong(); setNguoiDungChoKhoa(item) }}>Khoá tài khoản…<span className="sr-only"> {item.hoTen}</span></MucMenu> : null}
        </>}</MenuThaoTac>
      </div>
    ) },
  ]

  return (
    <section
      className={`account-management account-management--${mobile ? 'mobile' : 'desktop'}`}
      data-testid="account-management"
      data-layout-variant={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="account-management-title"
      style={{ display: 'grid', gap: 16, minWidth: 0 }}
    >
      <style>{CSS_BANG_QUAN_TRI}</style>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1" id="account-management-title">Tài khoản</h1>
          <p className="sub">{dangHoatDong} tài khoản đang hoạt động · tài khoản đã phát sinh dữ liệu chỉ khoá, không xoá</p>
        </div>
        <div className="topbar-actions"><Button onClick={batDauTao}><Icon name="plus" />Tạo tài khoản</Button></div>
      </header>

      {loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div> : null}
      {thongBao ? <Toast>{thongBao}</Toast> : null}

      {dangTai ? (
        <EmptyState title="Đang tải danh sách tài khoản…" />
      ) : danhSach.length === 0 ? (
        <EmptyState title="Chưa có tài khoản nào." />
      ) : (
        <Card className="bq-the-loc" data-account-list={mobile ? 'mobile' : 'desktop'}>
          <label className="bq-toolbar-phai bq-loc-phai">
            <span className="sr-only">Lọc theo trạng thái</span>
            <select className="select" style={{ width: 152 }} value={locTrangThai} onChange={(event) => setLocTrangThai(event.target.value as '' | 'HOAT_DONG' | 'KHOA')}>
              <option value="">Mọi trạng thái</option>
              <option value="HOAT_DONG">Hoạt động</option>
              <option value="KHOA">Đã khoá</option>
            </select>
          </label>
          <DataTable
            rows={hangHienThi}
            columns={cot}
            getRowId={(item) => item.id}
            chips={chips}
            defaultChip="TAT_CA"
            timTheo={(item) => `${item.hoTen} ${item.soDienThoai}`}
            searchLabel="Tìm tên, SĐT"
            noun="tài khoản"
            pageSize={8}
            rowLabel={(item) => item.hoTen}
            rowProps={(item) => ({ 'data-account-id': String(item.id), 'data-account-card': 'true' })}
          />
        </Card>
      )}

      {bieuMau ? (
        <FormPanel testId="account-form" onSubmit={luuTaiKhoan}>
          <div>
            <h2 className="h2">{bieuMau.id === null ? 'Tạo tài khoản' : 'Sửa tài khoản'}</h2>
          </div>

          <FormField label="Họ tên">
            <input
              className="input"
              name="hoTen"
              value={bieuMau.hoTen}
              onChange={(event) => setBieuMau((current) => current ? { ...current, hoTen: event.target.value } : current)}
              required
            />
          </FormField>

          <FormField label="Số điện thoại">
            <input
              className="input"
              name="soDienThoai"
              value={bieuMau.soDienThoai}
              onChange={(event) => setBieuMau((current) => current ? { ...current, soDienThoai: event.target.value } : current)}
              inputMode="tel"
              required
            />
          </FormField>

          <FormField label="Vai trò">
            <select
              className="select"
              name="vaiTro"
              value={bieuMau.vaiTro}
              required
              onChange={(event) => setBieuMau((current) => current ? { ...current, vaiTro: event.target.value } : current)}
            >
              {vaiTro.map((role) => <option key={role.vaiTro} value={role.vaiTro}>{role.tenVaiTro}</option>)}
            </select>
          </FormField>

          {bieuMau.vaiTro === 'NGUOI_THUE' ? <FormField label="Mã hồ sơ người thuê liên kết"><input className="input" type="number" min="1" required value={bieuMau.nguoiThueId ?? ''} onChange={(event) => setBieuMau((current) => current ? { ...current, nguoiThueId: event.target.value ? Number(event.target.value) : null } : current)} /><span>Lấy mã hồ sơ từ màn Người thuê của quản lý toà nhà.</span></FormField> : null}

          <CheckboxGroup legend="Toà nhà được giao">
            {toaNha.length === 0 ? (
              <ScreenNotice>Chưa có toà nhà để gán.</ScreenNotice>
            ) : (
              toaNha.map((item) => (
                <CheckboxField key={item.id}>
                  <input
                    type="checkbox"
                    name="toaNhaIds"
                    value={item.id}
                    checked={bieuMau.toaNhaIds.includes(item.id)}
                    onChange={(event) => setBieuMau((current) => {
                      if (!current) return current
                      const toaNhaIds = event.target.checked
                        ? [...current.toaNhaIds, item.id]
                        : current.toaNhaIds.filter((id) => id !== item.id)
                      return { ...current, toaNhaIds }
                    })}
                  />
                  <span>{item.maToa} · {item.ten}</span>
                </CheckboxField>
              ))
            )}
          </CheckboxGroup>

          <ScreenNotice>Không nhập mật khẩu hộ người dùng. Mã kích hoạt sẽ được gửi riêng để họ tự đặt mật khẩu.</ScreenNotice>
          <ActionRow>
            <Button type="submit" blocked={dangLuu} blockedReason={dangLuu ? 'Đang lưu tài khoản.' : undefined}>
              {dangLuu ? 'Đang lưu…' : bieuMau.id === null ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </Button>
            <Button type="button" variant="secondary" onClick={huyBieuMau} blocked={dangLuu}>Huỷ</Button>
          </ActionRow>
        </FormPanel>
      ) : null}
      {nguoiDungChoKhoa ? <ConfirmDialog
        title={`Khoá tài khoản ${nguoiDungChoKhoa.hoTen}?`}
        consequence={<>Người dùng sẽ <strong>không đăng nhập được nữa</strong>; lịch sử thao tác và bản ghi đã tạo vẫn giữ nguyên. Có thể mở khoá lại được.</>}
        confirmLabel="Khoá tài khoản"
        cancelLabel="Để sau"
        onCancel={() => setNguoiDungChoKhoa(null)}
        onConfirm={() => { const account = nguoiDungChoKhoa; setNguoiDungChoKhoa(null); void khoaTaiKhoan(account) }}
      /> : null}
    </section>
  )
}

const NHAN_VAI_TRO: Record<string, string> = { NGUOI_THUE: 'Người thuê', QUAN_LY: 'Quản lý', CHU: 'Chủ sở hữu', THO: 'Thợ', QTHT: 'Quản trị' }
const THU_TU_VAI_TRO = ['NGUOI_THUE', 'QUAN_LY', 'CHU', 'THO', 'QTHT']

/** Chip theo vai trò máy chủ trả về, xếp theo thứ tự thiết kế; vai trò lạ xếp cuối. */
function vaiTroTheoThuTu(vaiTro: ThongTinVaiTro[], danhSach: ThongTinQuanLyNguoiDung[]): ThongTinVaiTro[] {
  const co = new Map(vaiTro.map((role) => [role.vaiTro, role]))
  for (const item of danhSach) if (!co.has(item.vaiTro)) co.set(item.vaiTro, { vaiTro: item.vaiTro, tenVaiTro: item.tenVaiTro })
  const rank = (code: string) => { const i = THU_TU_VAI_TRO.indexOf(code); return i < 0 ? 99 : i }
  return [...co.values()].sort((a, b) => rank(a.vaiTro) - rank(b.vaiTro))
}

function thongBaoLoi(reason: unknown, fallback: string) {
  return reason instanceof ApiError || reason instanceof Error ? reason.message : fallback
}
