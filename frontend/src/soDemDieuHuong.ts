// Số đếm trên sidebar (Sự cố cần phân công, Lịch hẹn chờ, công tơ chưa ghi của Quản lý) — đếm từ API đang có, không cần API mới.
import { useEffect, useState } from 'react'
import { fetchDashboardQuanLy, fetchPublicLichHen } from './api'
import { managementRequest } from './managementApi'

export type SoDemDieuHuong = { suCo?: number; lichHen?: number; chuKy?: number }

async function hoacBoQua<T>(viec: Promise<T>): Promise<T | undefined> {
  try { return await viec } catch { return undefined } // lỗi → không hiện số, không chặn khung
}

/** Mỗi số tải riêng: một API lỗi chỉ làm mất đúng số đó. Chỉ Chủ/Quản lý có số. */
export async function taiSoDemDieuHuong(token: string, vaiTro: string, toaNhaId: number | null): Promise<SoDemDieuHuong> {
  if (vaiTro !== 'CHU' && vaiTro !== 'QUAN_LY') return {}
  const toa = toaNhaId ? `&toaNhaId=${toaNhaId}` : ''
  const [suCo, lichHen, dashboard] = await Promise.all([
    hoacBoQua(managementRequest<Array<{ trangThai: string }>>(token, `/api/yeu-cau-sua-chua?trangThai=MOI_TIEP_NHAN${toa}`)),
    hoacBoQua(fetchPublicLichHen(token, toaNhaId ?? undefined)),
    vaiTro === 'QUAN_LY' ? hoacBoQua(fetchDashboardQuanLy(token, toaNhaId)) : Promise.resolve(undefined),
  ])
  return {
    suCo: suCo?.filter((x) => x.trangThai === 'MOI_TIEP_NHAN').length,
    lichHen: lichHen?.filter((x) => x.trangThai === 'CHO_XAC_NHAN').length,
    chuKy: dashboard?.kpi.soCongToChuaGhi,
  }
}

/** `lamMoi` đổi (vd đường dẫn đổi) thì đếm lại, để số không cũ sau khi xử lý xong một việc. */
export function useSoDemDieuHuong(token: string | null, vaiTro: string | undefined, toaNhaId: number | null, lamMoi: string): SoDemDieuHuong {
  const [soDem, setSoDem] = useState<SoDemDieuHuong>({})
  useEffect(() => {
    if (!token || !vaiTro) { setSoDem({}); return undefined }
    let active = true
    void taiSoDemDieuHuong(token, vaiTro, toaNhaId).then((ket) => { if (active) setSoDem(ket) })
    return () => { active = false }
  }, [token, vaiTro, toaNhaId, lamMoi])
  return soDem
}
