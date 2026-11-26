// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { capNhatTrangThaiLichHen, fetchPublicLichHen, fetchPublicPhong } from './api'
import GhiChiSo from './GhiChiSo'
import TaiKhoanTruyCap from './TaiKhoanTruyCap'
import QuanLySuaChua from './QuanLySuaChua'
import DichVuVaKy from './DichVuVaKy'
import { AnToanVanHanh, NhatKyVanHanh } from './TuanThuVanHanh'
import QuanLyLichHen from './QuanLyLichHen'

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
function setValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) { const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value')?.set?.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})) }

describe('public portal and account access', () => {
  it('maps the actual public DTO and explicitly fetches every room state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([{id:1,giaThue:4200000,bangGiaDichVu:[{id:2,ten:'Nước',cachTinh:'THEO_CHI_SO',donVi:'m³',donGia:15000}]}]))
    vi.stubGlobal('fetch',fetchMock)
    const rooms = await fetchPublicPhong(undefined,5000000)
    const query = new URL(String(fetchMock.mock.calls[0][0]),'http://localhost').searchParams
    expect(query.get('chiPhongTrong')).toBe('false')
    expect(query.get('giaDen')).toBe('5000000')
    expect(rooms[0].giaThueMacDinh).toBe(4200000)
    expect(rooms[0].danhSachDichVu[0]).toMatchObject({tenDichVu:'Nước',loaiThu:'THEO_CHI_SO',donViTinh:'m³',donGia:15000})
  })
  it('sends authentication to the protected appointment endpoints', async () => {
    const fetchMock=vi.fn().mockResolvedValueOnce(json([])).mockResolvedValueOnce(new Response(null,{status:204}))
    vi.stubGlobal('fetch',fetchMock)
    await fetchPublicLichHen('manager-token',3)
    await capNhatTrangThaiLichHen('manager-token',7,'DA_XEM')
    expect(fetchMock).toHaveBeenNthCalledWith(1,'/api/lich-hen?toaNhaId=3',expect.objectContaining({headers:{Authorization:'Bearer manager-token'}}))
    expect(fetchMock).toHaveBeenNthCalledWith(2,'/api/lich-hen/7/trang-thai',expect.objectContaining({method:'PATCH',headers:expect.objectContaining({Authorization:'Bearer manager-token'})}))
  })
  it('requests a reset code then submits that code and the new password', async () => {
    const fetchMock=vi.fn().mockResolvedValueOnce(json({thongBao:'Đã tiếp nhận'})).mockResolvedValueOnce(new Response(null,{status:204}))
    vi.stubGlobal('fetch',fetchMock)
    root=createRoot(container)
    await act(async()=>root!.render(<TaiKhoanTruyCap onLogin={()=>{}}/>))
    await act(async()=>{Array.from(container.querySelectorAll('button')).find((b)=>b.textContent==='Quên mật khẩu')!.click()})
    await act(async()=>{setValue(container.querySelector('input[type="tel"]')!,'0901234567')})
    await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
    expect(fetchMock).toHaveBeenNthCalledWith(1,'/api/auth/quen-mat-khau',expect.objectContaining({method:'POST',body:JSON.stringify({soDienThoai:'0901234567'})}))
    await act(async()=>{setValue(container.querySelector('input[autocomplete="one-time-code"]')!,'123456');setValue(container.querySelector('input[type="password"]')!,'new-password')})
    await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
    expect(fetchMock).toHaveBeenNthCalledWith(2,'/api/auth/dat-lai-mat-khau',expect.objectContaining({body:JSON.stringify({soDienThoai:'0901234567',maXacThuc:'123456',matKhau:'new-password'})}))
    expect(container.textContent).toContain('Đã đặt mật khẩu')
  })
})

describe('owner closed-period correction', () => {
  it('requires a reason and uses PUT while preserving closed-period status', async () => {
    const fetchMock=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=String(input)
      if(url==='/api/toa-nha')return json([{id:1,ten:'Toà A'}])
      if(url.endsWith('/ky-thanh-toan'))return json([{id:8,nam:2026,thang:8,trangThai:'DA_CHOT'}])
      if(url.endsWith('/thieu-chi-so'))return json([])
      if(init?.method==='PUT')return json({phongId:11,dichVuId:21,chiSoDau:'100.00',chiSoCuoi:'120.00',mucTieuThu:'20.00',coThayCongTo:false})
      return json({tongPhong:1,daGhi:1,phong:[{id:11,soPhong:'101',tang:1,dichVu:[{id:21,tenDichVu:'Điện',donVi:'kWh',chiSoDau:'100.00',chiSoCuoi:'110.00',coThayCongTo:false}]}]})
    })
    vi.stubGlobal('fetch',fetchMock)
    root=createRoot(container)
    await act(async()=>root!.render(<GhiChiSo token="owner-token" vaiTro="CHU"/>))
    const sua=await vi.waitFor(()=>{const element=container.querySelector<HTMLButtonElement>('button[aria-label^="Ảnh và thay công tơ"]');expect(element).not.toBeNull();return element!})
    await act(async()=>sua.click())
    const save=await vi.waitFor(()=>{const element=container.querySelector<HTMLButtonElement>('[data-save-key="11-21"]');expect(element).not.toBeNull();return element!})
    expect(save.getAttribute('aria-disabled')).toBe('true')
    await act(async()=>{setValue(container.querySelector('textarea')!,'Đối chiếu lại ảnh công tơ');setValue(container.querySelector('input[name="chiSoCuoi-11-21"]')!,'120.00')})
    await act(async()=>save.click())
    const call=fetchMock.mock.calls.find(([,init])=>init?.method==='PUT')
    expect(call?.[0]).toBe('/api/toa-nha/1/ky-thanh-toan/8/chi-so')
    expect(JSON.parse(call?.[1]?.body as string)).toMatchObject({phongId:11,dichVuId:21,chiSoCuoi:'120.00',lyDo:'Đối chiếu lại ảnh công tơ'})
    expect(container.querySelector('[data-close-period]')?.getAttribute('aria-disabled')).toBe('true')
  })
})

describe('new operational screens', () => {
  it('lists tenant repairs through the own-data endpoint without fetching the building catalogue', async () => {
    const fetchMock=vi.fn(async(input:RequestInfo|URL)=>{
      const url=String(input)
      if(url==='/api/cong/hop-dong')return json([{id:4,phongId:11,soPhong:'101',trangThai:'HIEU_LUC'}])
      if(url.startsWith('/api/cong/yeu-cau-sua-chua'))return json([{id:7,maYeuCau:'SC-7',soPhong:'101',hangMuc:'Điện',moTa:'Đèn hành lang hỏng',trangThai:'DA_DONG',tenTrangThai:'Đã đóng',anh:[]}])
      throw new Error(`Unexpected request ${url}`)
    })
    vi.stubGlobal('fetch',fetchMock)
    root=createRoot(container)
    await act(async()=>root!.render(<QuanLySuaChua token="tenant-token" tenant/>))
    await vi.waitFor(()=>expect(container.textContent).toContain('SC-7'))
    expect(fetchMock.mock.calls.some(([url])=>String(url)==='/api/toa-nha')).toBe(false)
    expect(container.textContent).not.toContain('Phân công thợ')
    expect(container.querySelector('option[value="11"]')?.textContent).toBe('Phòng 101')
  })
  it('opens a payment period with numeric month/year and authenticated building scope', async () => {
    const fetchMock=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=String(input)
      if(url==='/api/toa-nha')return json([{id:3,ten:'Toà C'}])
      if(url.endsWith('/dich-vu'))return json([])
      if(init?.method==='POST')return json({id:9,nam:2026,thang:11,trangThai:'DANG_MO'})
      return json([])
    })
    vi.stubGlobal('fetch',fetchMock)
    root=createRoot(container)
    await act(async()=>root!.render(<DichVuVaKy token="manager-token"/>))
    await vi.waitFor(()=>expect(container.querySelector('option[value="3"]')).not.toBeNull())
    await act(async()=>setValue(container.querySelector('input[type="month"]')!,'2026-11'))
    await act(async()=>container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/3/ky-thanh-toan',expect.objectContaining({method:'POST',headers:expect.objectContaining({Authorization:'Bearer manager-token'}),body:JSON.stringify({nam:2026,thang:11})}))
  })
  it('keeps manager safety records read-only while showing real due work', async () => {
    vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>String(input)==='/api/toa-nha'?json([{id:3,ten:'Toà C'}]):json({chuKyThang:6,ngayKiemTraTiep:'2026-11-10',soViecDenHan:2,hoSo:[],thietBi:[],kiemTra:[]})))
    root=createRoot(container)
    await act(async()=>root!.render(<AnToanVanHanh token="manager-token" vaiTro="QUAN_LY"/>))
    await vi.waitFor(()=>expect(container.textContent).toContain('2 việc đến hạn'))
    expect(container.querySelector('form')).toBeNull()
    expect(container.textContent).not.toContain('Lưu hồ sơ PCCC')
  })
  it('các màn giữ (dịch vụ, lịch xem phòng, PCCC, nhật ký) có đúng 1 h1 và ≤ 1 nút chính', async () => {
    vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>{
      const url=String(input)
      if(url==='/api/toa-nha')return json([{id:3,ten:'Toà C'}])
      if(url.startsWith('/api/lich-hen')||url.endsWith('/dich-vu')||url.endsWith('/ky-thanh-toan'))return json([])
      return json({chuKyThang:6,ngayKiemTraTiep:null,soViecDenHan:0,hoSo:[],thietBi:[],kiemTra:[],content:[],items:[],total:0})
    }))
    const man:Array<[string,React.ReactElement]>=[
      ['Giá dịch vụ & cài đặt',<DichVuVaKy token="t"/>],['Lịch xem phòng',<QuanLyLichHen token="t"/>],
      ['An toàn PCCC',<AnToanVanHanh token="t" vaiTro="QUAN_LY"/>],['Nhật ký',<NhatKyVanHanh token="t"/>],
    ]
    for(const [h1,el] of man){
      root=createRoot(container)
      await act(async()=>root!.render(el))
      await vi.waitFor(()=>expect(container.querySelector('h1')).not.toBeNull())
      expect(container.querySelectorAll('h1'),h1).toHaveLength(1)
      expect(container.querySelector('h1')?.textContent).toBe(h1)
      expect(container.querySelectorAll('.btn-primary').length,h1).toBeLessThanOrEqual(1)
      await act(async()=>root!.unmount()); root=undefined; container.replaceChildren()
    }
  })
})
