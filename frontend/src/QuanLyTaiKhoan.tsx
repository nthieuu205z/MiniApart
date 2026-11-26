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
import { ChanDinh } from './design/layout/ChanDinh'
import { DauTrang } from './design/layout/DauTrang'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'
import { Card } from './design/layout/Card'
import { ActionRow, CheckboxField, CheckboxGroup, FormField, FormPanel, ScreenNotice } from './design/layout/Screen'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
import { CSS_BANG_QUAN_TRI } from './bangQuanTriChung'
import { dinhDangSdt } from './tienTheoNguoi'

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
  const [lanTai, setLanTai] = useState(0)
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
  }, [token, lanTai])

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

  const dem = (code: string) => danhSach.filter((item) => item.vaiTro === code).length
  const tenToa = (ids: number[]) => ids.map((id) => toaNha.find((building) => building.id === id)?.ten ?? `Toà #${id}`)
  const chips = [
    { key: 'NHAN_SU', label: 'Nhân sự', match: (item: ThongTinQuanLyNguoiDung) => item.vaiTro !== 'NGUOI_THUE' },
    { key: 'NGUOI_THUE', label: 'Người thuê', match: (item: ThongTinQuanLyNguoiDung) => item.vaiTro === 'NGUOI_THUE' },
  ]
  const themNut = <Button onClick={batDauTao}><Icon name="plus" />Thêm tài khoản</Button>
  const cot: DataTableColumn<ThongTinQuanLyNguoiDung>[] = [
    { key: 'hoTen', label: 'Họ tên', sortable: true, sortValue: (item) => item.hoTen, render: (item) => <span className="bq-cat" title={item.hoTen} style={{ fontWeight: 600 }}>{item.hoTen}{item.id === idCuaToi ? ' · bạn' : ''}</span> },
    { key: 'dienThoai', label: 'Điện thoại', render: (item) => dinhDangSdt(item.soDienThoai) },
    { key: 'vaiTro', label: 'Vai trò', sortable: true, sortValue: (item) => nhanVaiTro(item), render: (item) => nhanVaiTro(item) },
    { key: 'soToa', label: 'Số toà', align: 'num', render: (item) => <span title={tenToa(item.toaNhaIds).join(', ')}>{item.toaNhaIds.length || '—'}</span> },
    { key: 'trangThai', label: 'Tình trạng', sortable: true, sortValue: (item) => item.trangThai, render: (item) => <StatusTag tone={item.trangThai === 'HOAT_DONG' ? 'done' : 'closed'}>{item.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Đã khoá'}</StatusTag> },
    { key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong', render: (item) => <Button variant="secondary" size="sm" onClick={() => batDauSua(item)}>Sửa<span className="sr-only"> {item.hoTen}</span></Button> },
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
      <style>{'.bq-the-loc .table-toolbar { padding-right: 0; } .bq-the-loc .table-toolbar .input-wrap { width: 320px; margin-left: auto; order: 9; } @media (max-width: 767px) { .bq-the-loc .table-toolbar .input-wrap { width: 100%; } }'}</style>
      <DauTrang
        tieuDe={<span id="account-management-title">Tài khoản</span>}
        phu={`${danhSach.length} tài khoản · ${dem('CHU')} chủ nhà · ${dem('QUAN_LY')} quản lý · ${dem('THO')} thợ · ${dem('NGUOI_THUE')} người thuê`}
        hanhDong={mobile ? undefined : themNut}
      />

      {loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice>{danhSach.length === 0 ? <Button variant="secondary" onClick={() => setLanTai((n) => n + 1)}>Tải lại</Button> : null}</div> : null}
      {thongBao ? <Toast>{thongBao}</Toast> : null}

      {dangTai ? (
        <div role="status" aria-label="Đang tải danh sách tài khoản" style={{ display: 'grid', gap: 10 }}><div className="skel skel-line" /><div className="skel skel-line" style={{ width: '80%' }} /><div className="skel skel-line" style={{ width: '60%' }} /></div>
      ) : danhSach.length === 0 ? (
        loi ? null : <EmptyState title="Chưa có tài khoản nào." actionLabel="Thêm tài khoản" onAction={batDauTao} />
      ) : (
        <Card className="bq-the-loc" data-account-list={mobile ? 'mobile' : 'desktop'}>
          <DataTable
            rows={danhSach}
            columns={cot}
            getRowId={(item) => item.id}
            chips={chips}
            defaultChip="NHAN_SU"
            timTheo={(item) => `${item.hoTen} ${item.soDienThoai}`}
            searchLabel="Tìm tên hoặc số điện thoại"
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
            {bieuMau.id !== null && danhSach.find((item) => item.id === bieuMau.id)?.trangThai === 'HOAT_DONG' ? <Button type="button" variant="danger" onClick={() => setNguoiDungChoKhoa(danhSach.find((item) => item.id === bieuMau.id) ?? null)} blocked={dangLuu}>Khoá tài khoản…</Button> : null}
          </ActionRow>
        </FormPanel>
      ) : null}
      {mobile && !bieuMau ? <ChanDinh>{themNut}</ChanDinh> : null}
      {nguoiDungChoKhoa ? <ConfirmDialog
        title={`Khoá tài khoản ${nguoiDungChoKhoa.hoTen}?`}
        consequence={<>Người dùng sẽ <strong>không đăng nhập được nữa</strong>; lịch sử thao tác và bản ghi đã tạo vẫn giữ nguyên. Có thể mở khoá lại được.</>}
        confirmLabel="Khoá tài khoản"
        variant="danger"
        cancelLabel="Để sau"
        onCancel={() => setNguoiDungChoKhoa(null)}
        onConfirm={() => { const account = nguoiDungChoKhoa; setNguoiDungChoKhoa(null); setBieuMau(null); void khoaTaiKhoan(account) }}
      /> : null}
    </section>
  )
}

const NHAN_VAI_TRO: Record<string, string> = { CHU: 'Chủ nhà', QUAN_LY: 'Quản lý toà', THO: 'Thợ', NGUOI_THUE: 'Người thuê', QTHT: 'Quản trị hệ thống' }
const nhanVaiTro = (item: ThongTinQuanLyNguoiDung) => NHAN_VAI_TRO[item.vaiTro] ?? item.tenVaiTro

function thongBaoLoi(reason: unknown, fallback: string) {
  return reason instanceof ApiError || reason instanceof Error ? reason.message : fallback
}
