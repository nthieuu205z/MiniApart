import { FormEvent, useEffect, useState } from 'react'
import {
  ApiError,
  capNhatNguoiDungQuanLy,
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
import { SysLabel } from './design/core/SysLabel'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'
import { ActionRow, CheckboxField, CheckboxGroup, FormField, FormPanel, ScreenHeader, ScreenNotice, ScreenSurface, TableActions, TableFrame } from './design/layout/Screen'

type Props = {
  token: string
}

type BieuMauTaiKhoan = YeuCauQuanLyNguoiDung & {
  id: number | null
}

export default function QuanLyTaiKhoan({ token }: Props) {
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

  return (
    <ScreenSurface data-testid="account-management" aria-labelledby="account-management-title">
      <ScreenHeader action={<Button onClick={batDauTao}>Tạo tài khoản</Button>}>
        <div>
          <SysLabel>FR-AUT-06</SysLabel>
          <h3 id="account-management-title">Quản lý tài khoản</h3>
        </div>
      </ScreenHeader>

      <ScreenNotice>
        Tạo tài khoản sẽ gửi mã kích hoạt để người dùng tự chọn mật khẩu. Tài khoản đã phát sinh dữ liệu chỉ được khoá, không xoá.
      </ScreenNotice>

      {loi ? <ScreenNotice tone="urgent">{loi}</ScreenNotice> : null}
      {thongBao ? <Toast>{thongBao}</Toast> : null}

      {dangTai ? (
        <ScreenNotice live>Đang tải danh sách tài khoản…</ScreenNotice>
      ) : (
        <TableFrame minWidth={700}>
            <caption>Danh sách tài khoản</caption>
            <thead>
              <tr>
                <th scope="col">Họ tên</th>
                <th scope="col">Số điện thoại</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Toà được giao</th>
                <th scope="col">Trạng thái</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {danhSach.length === 0 ? (
                <tr>
                  <td colSpan={6}><EmptyState title="Chưa có tài khoản nào." /></td>
                </tr>
              ) : danhSach.map((nguoiDung) => (
                <tr key={nguoiDung.id} data-account-id={nguoiDung.id}>
                  <th scope="row">{nguoiDung.hoTen}</th>
                  <td>{nguoiDung.soDienThoai}</td>
                  <td>{nguoiDung.tenVaiTro}</td>
                  <td>{danhSachToaNha(nguoiDung.toaNhaIds, toaNha)}</td>
                  <td><StatusTag tone={nguoiDung.trangThai === 'BI_KHOA' ? 'closed' : 'done'}>{nguoiDung.tenTrangThai}</StatusTag></td>
                  <td><TableActions>
                    <Button variant="secondary" onClick={() => batDauSua(nguoiDung)}>Sửa {nguoiDung.hoTen}</Button>
                    {nguoiDung.trangThai === 'HOAT_DONG' ? (
                      <Button
                        variant="secondary"
                        type="button"
                        blocked={idDangKhoa === nguoiDung.id}
                        blockedReason={idDangKhoa === nguoiDung.id ? 'Đang cập nhật trạng thái tài khoản.' : undefined}
                        onClick={() => setNguoiDungChoKhoa(nguoiDung)}
                      >
                        {idDangKhoa === nguoiDung.id ? 'Đang khoá…' : `Khoá ${nguoiDung.hoTen}`}
                      </Button>
                    ) : null}
                  </TableActions></td>
                </tr>
              ))}
            </tbody>
        </TableFrame>
      )}

      {bieuMau ? (
        <FormPanel testId="account-form" onSubmit={luuTaiKhoan}>
          <div>
            <SysLabel>FR-AUT-06</SysLabel>
            <h4>{bieuMau.id === null ? 'Tạo tài khoản' : 'Sửa tài khoản'}</h4>
          </div>

          <FormField label="Họ tên">
            <input
              name="hoTen"
              value={bieuMau.hoTen}
              onChange={(event) => setBieuMau((current) => current ? { ...current, hoTen: event.target.value } : current)}
              required
            />
          </FormField>

          <FormField label="Số điện thoại">
            <input
              name="soDienThoai"
              value={bieuMau.soDienThoai}
              onChange={(event) => setBieuMau((current) => current ? { ...current, soDienThoai: event.target.value } : current)}
              inputMode="tel"
              required
            />
          </FormField>

          <FormField label="Vai trò">
            <select
              name="vaiTro"
              value={bieuMau.vaiTro}
              required
              onChange={(event) => setBieuMau((current) => current ? { ...current, vaiTro: event.target.value } : current)}
            >
              {vaiTro.map((role) => <option key={role.vaiTro} value={role.vaiTro}>{role.tenVaiTro}</option>)}
            </select>
          </FormField>

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
    </ScreenSurface>
  )
}

function danhSachToaNha(ids: number[], toaNha: ThongTinToaNha[]) {
  if (ids.length === 0) return 'Chưa gán'
  return ids.map((id) => {
    const item = toaNha.find((building) => building.id === id)
    return item ? `${item.maToa} · ${item.ten}` : `Toà #${id}`
  }).join(', ')
}

function thongBaoLoi(reason: unknown, fallback: string) {
  return reason instanceof ApiError || reason instanceof Error ? reason.message : fallback
}
