# Sinh prototype/data.js từ JSON GET thật (tools/data, do fetch.py tạo). Không sửa tay data.js; chạy lại file này.
# Dữ liệu MINH HOẠ (không có trong demo) được gom riêng trong khoá `mau` để dễ tìm và thay.
import json, os, collections as C

H = os.path.dirname(os.path.abspath(__file__))
L = lambda f: json.load(open(f'{H}/data/{f}.json', encoding='utf-8'))
f0 = lambda x: round(float(x or 0))
sach = lambda s: (s or '').replace(' Dữ liệu tình huống mô phỏng.', '').strip()

nt = {x['id']: x for x in L('CHU_api_nguoi_thue')}
toa = []
hop_dong, hoa_don, su_co = [], [], []
for t in L('CHU_api_toa_nha'):
    i = t['id']
    ky = {k['id']: k for k in L(f'CHU_api_toa_nha_{i}_ky_thanh_toan')}
    hds = L(f'CHU_api_hop_dong_toaNhaId_{i}')
    for h in hds:
        hop_dong.append({'id': h['id'], 'toaId': i, 'toa': t['ten'], 'phongId': h['phongId'], 'phong': h['soPhong'], 'nguoiId': h['nguoiThueId'], 'nguoi': h['hoTenNguoiThue'],
                         'bd': h['ngayBatDau'], 'kt': h['ngayKetThuc'], 'gia': f0(h['giaThue']), 'coc': f0(h['tienCoc']), 'baoTruoc': h['soNgayBaoTruoc'], 'tt': h['trangThai'],
                         'sapHet': h['sapHetHan'], 'con': h['soNgayConLai'], 'dv': [{'ten': d['tenDichVu'], 'gia': f0(d['donGiaApDung'])} for d in h['dichVuApDung']]})
    for h in L(f'CHU_api_hoa_don_toaNhaId_{i}'):
        hoa_don.append({'id': h['hoaDonId'], 'ma': h['maHoaDon'], 'toaId': i, 'phong': h['soPhong'], 'nguoi': h['nguoiThue'], 'thang': ky[h['kyId']]['thang'], 'han': h['hanThanhToan'],
                        'tt': h['trangThai'], 'tong': f0(h['tongTien']), 'daThu': f0(h['daThu']), 'con': f0(h['conLai'])})
    for s in L(f'CHU_api_yeu_cau_sua_chua_toaNhaId_{i}'):
        su_co.append({'id': s['id'], 'ma': s['maYeuCau'], 'toaId': i, 'toa': t['ten'], 'phong': s['soPhong'], 'tang': s['tang'], 'hangMuc': s['hangMuc'], 'moTa': sach(s['moTa']),
                      'khan': s['mucDo'] == 'KHAN_CAP', 'tt': s['trangThai'], 'chiPhi': f0(s['chiPhi']), 'thoId': s['nguoiXuLyId'], 'sdt': s['soDienThoaiLienHe'], 'tao': s['taoLuc'][:10]})
    hl = {h['phongId']: h for h in hds if h['trangThai'] == 'HIEU_LUC'}
    phong = [{'id': p['id'], 'so': p['soPhong'], 'tang': p['tang'], 'dt': f0(p['dienTich']), 'gia': f0(p['giaThueMacDinh']), 'loai': p['loaiPhong'], 'tt': p['trangThai'],
              'nguoi': hl.get(p['id'], {}).get('hoTenNguoiThue'), 'nguoiId': hl.get(p['id'], {}).get('nguoiThueId'), 'hdId': hl.get(p['id'], {}).get('id')} for p in L(f'CHU_api_toa_nha_{i}_phong')]
    pc = L(f'CHU_api_toa_nha_{i}_pccc')
    k11 = next(k for k in ky.values() if k['thang'] == 11)
    toa.append({'id': i, 'ten': t['ten'], 'diaChi': t['diaChi'].replace('Khu nhà mẫu ', ''), 'soTang': t['soTang'], 'ngayChot': t['ngayChotSo'], 'hanTt': t['soNgayHanTt'],
                'phong': phong, 'ky11': {'id': k11['id'], 'bd': k11['ngayBatDau'], 'kt': k11['ngayKetThuc'], 'tt': k11['trangThai']},
                'dv': [{'ten': d['ten'], 'donVi': d['donVi']} for d in L(f'CHU_api_toa_nha_{i}_dich_vu') if d['dangSuDung']][:6],
                'pccc': {'kiemTra': pc['ngayKiemTraTiep'], 'denHan': pc['soViecDenHan'], 'thietBi': [{'ten': x['ten'], 'viTri': x['viTri'], 'han': x['hanKiemDinh']} for x in pc['thietBi']]},
                'tho': L(f'CHU_api_yeu_cau_sua_chua_tho_toaNhaId_{i}')})

g = {}
for r in L('CHU_api_bao_cao_cong_no')['congNo']:
    k = r['nguoiThueId']
    x = g.setdefault(k, {'id': k, 'ten': r['hoTenNguoiThue'], 'sdt': nt.get(k, {}).get('soDienThoai'), 'toaId': r['toaNhaId'], 'toa': r['tenToaNha'], 'phong': r['soPhong'], 'hdId': r['hopDongId'], 'hd': []})
    x['hd'].append({'id': r['hoaDonId'], 'thang': int(r['maHoaDon'][-2:]), 'han': r['hanThanhToan'], 'tong': f0(r['tongTien']), 'daThu': f0(r['daThu']), 'con': f0(r['conLai']), 'tre': r['soNgayQuaHan']})
no = sorted(g.values(), key=lambda x: -sum(h['con'] for h in x['hd']))
for x in no:
    x['hd'].sort(key=lambda h: h['thang'])
    x['tong'] = sum(h['con'] for h in x['hd']); x['daThu'] = sum(h['daThu'] for h in x['hd']); x['tre'] = max(h['tre'] for h in x['hd'])

dchu = L('CHU_api_dashboard_chu'); bc = L('CHU_api_bao_cao_tong_quan'); ql = L('QUAN_LY_api_dashboard_quan_ly')
tho_viec = []
for v in L('THO_api_tho_cong_viec'):
    d = L(f"THO_api_tho_cong_viec_{v['id']}")
    tho_viec.append({'id': v['id'], 'ma': v['maYeuCau'], 'hangMuc': v['hangMuc'], 'moTa': sach(v['moTa']), 'toa': v['toaNha'], 'diaChi': v['diaChiToaNha'].replace('Khu nhà mẫu ', ''), 'phong': v['soPhong'], 'tang': v['tang'],
                     'lienHe': v['nguoiLienHeHoTen'], 'sdt': v['soDienThoaiLienHe'], 'khan': v['mucDo'] == 'KHAN_CAP', 'tt': v['trangThaiHieuLuc'], 'ql': d['quanLyPhuTrachHoTen'], 'qlSdt': d['quanLyPhuTrachSoDienThoai'],
                     'lichSu': [{'luc': s['thoiDiem'][:16].replace('T', ' '), 'ten': s['tenHanhDong'], 'ai': s['nguoiThucHien']} for s in d['lichSuTrangThai']]})
kh_hd = L('NGUOI_THUE_api_cong_hoa_don_moi_nhat')['hoaDon']
# API trả tên khoản không dấu ("Tien phong", "Lam tron"): lỗi dữ liệu backend, ở đây hiển thị đúng dấu như thiết kế mong muốn.
ten_khoan = lambda s: s.replace('Tien phong', 'Tiền phòng').replace('ngay)', 'ngày)').replace('Lam tron', 'Làm tròn')
users = L('QTHT_api_nguoi_dung')
nk = L('CHU_api_nhat_ky_thao_tac')

assert sum(x['tong'] for x in no) == f0(dchu['kpi']['congNoHienTai']), 'tổng nợ theo người phải khớp KPI'
assert sum(len(t['phong']) for t in toa) == dchu['kpi']['tongSoPhong']

data = {
    'ngay': '2026-11-26', 'capNhat': dchu['thoiDiemCapNhat'][11:16],
    'me': {r: L(f'{r}_api_auth_me') for r in ('CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE', 'QTHT')},
    'toa': toa, 'no': no, 'hoaDon': hoa_don, 'hopDong': hop_dong, 'suCo': su_co,
    'nguoi': {k: {'sdt': v['soDienThoai'], 'sinh': v['ngaySinh'], 'que': v['queQuan'], 'giayTo': v['soGiayToChe'], 'email': v['email']} for k, v in nt.items()},
    'lichHen': [{'ten': x['hoTen'], 'sdt': x['soDienThoai'], 'phong': x['soPhong'], 'toaId': x['toaNhaId'], 'toa': x['tenToaNha'], 'gio': x['thoiGianHen'][:16], 'tt': x['trangThai']} for x in L('CHU_api_lich_hen')],
    'thang': [{'nhan': m['nhan'], 'phatHanh': f0(m['doanhThuPhatHanh']), 'thu': f0(m['thucThu']), 'no': f0(m['congNo'])} for m in dchu['taiChinhTheoThang']],
    'thuThang11': f0(bc['kpi']['daThu']), 'chiPhiSua': f0(dchu['kpi']['chiPhiBaoTri']),
    'theoToa': [{'id': s['toaNhaId'], 'phatHanh': f0(s['doanhThuPhatHanh']), 'thu': f0(s['thucThu']), 'no': f0(s['congNo']), 'chiPhi': f0(s['chiPhiBaoTri'])} for s in dchu['soSanhToaNha']],
    'ql': {'toaId': L('QUAN_LY_api_toa_nha')[0]['id'], 'congTo': {'tong': ql['congToChuaGhi']['tongSoCongTo'], 'daGhi': ql['congToChuaGhi']['soCongToDaGhi'],
                                                                 'thieu': [{'phong': x['tenViTri'], 'dv': x['tenDichVu'], 'donVi': x['donVi']} for x in ql['congToChuaGhi']['danhSachChuaGhi']]},
           'chiSo': [{'phong': p['soPhong'], 'dien': [f0(p['dichVu'][0]['chiSoDau']), f0(p['dichVu'][0]['chiSoCuoi'])], 'nuoc': [f0(p['dichVu'][1]['chiSoDau']), f0(p['dichVu'][1]['chiSoCuoi'])],
                      'tbDien': f0(p['dichVu'][0]['thongTinCanhBaoTieuThu']['trungBinhBaKyTruoc'])} for p in L('CHU_api_toa_nha_3_ky_thanh_toan_5_chi_so')['phong']],
           'lichHen': [{'ten': x['hoTen'], 'sdt': x['soDienThoai'], 'phong': x['soPhong'].split(' (')[0], 'gio': x['thoiGian'][:16], 'tt': x['trangThai']} for x in ql['lichHenSapToi']],
           'thongBao': [{'tieuDe': x['tieuDe'], 'noiDung': sach(x['noiDung']), 'luc': x['taoLuc'][:16].replace('T', ' ')} for x in L('QUAN_LY_api_thong_bao')['thongBao']]},
    'tho': {'viec': tho_viec},
    'kh': {'hoaDon': {'thang': 10, 'han': kh_hd['hanThanhToan'], 'tong': f0(kh_hd['tongTien']), 'dong': [{'ten': ten_khoan(d['tenKhoan']), 'sl': f0(d.get('soLuong')), 'gia': f0(d.get('donGia')), 'tien': f0(d['thanhTien']),
                                                                                                       'dau': f0(d['chiSoDau']) if d.get('chiSoDau') else None, 'cuoi': f0(d['chiSoCuoi']) if d.get('chiSoCuoi') else None, 'loai': d['loaiKhoan']} for d in kh_hd['cacDong']]},
           'ds': [{'thang': h['thang'], 'han': h['hanThanhToan'], 'tt': h['trangThaiThanhToan'], 'tong': f0(h['tongTien']), 'daThu': f0(h['daThu']), 'con': f0(h['conLai'])} for h in L('NGUOI_THUE_api_cong_hoa_don')],
           'tieuThu': {k: [{'thang': x['thang'], 'dau': f0(x['chiSoDau']), 'cuoi': f0(x['chiSoCuoi']), 'dung': f0(x['mucTieuThu'])} for x in v] for k, v in L('NGUOI_THUE_api_cong_tieu_thu_soKy_12').items()},
           'thongBao': [{'tieuDe': x['tieuDe'], 'noiDung': sach(x['noiDung'])} for x in L('NGUOI_THUE_api_thong_bao')['thongBao']]},
    'users': {'dem': C.Counter(u['vaiTro'] for u in users), 'ds': [{'ten': u['hoTen'], 'sdt': u['soDienThoai'], 'vai': u['tenVaiTro'], 'tt': u['tenTrangThai'], 'soToa': len(u['toaNhaIds'])} for u in users if u['vaiTro'] != 'NGUOI_THUE'][:14]},
    'nhatKy': [{'ai': x['hoTen'], 'viec': x['hanhDong'], 'doiTuong': x['doiTuong'], 'luc': x['thoiDiem'][:16].replace('T', ' ')} for x in nk['items'][:8]],
    # Minh hoạ: demo chưa có báo giá nào và người thuê chưa đọc được tài khoản ngân hàng của toà (403). Thay bằng dữ liệu thật khi backend có.
    'mau': {'baoGia': {'suCoId': 4, 'tho': 'Lê Quốc Huy', 'gui': '2026-11-26 15:10', 'dong': [{'ten': 'Bóng LED âm trần 9W', 'sl': 2, 'gia': 85000}, {'ten': 'Tăng phô / nguồn LED', 'sl': 1, 'gia': 130000}, {'ten': 'Công thay và kiểm tra nguồn', 'sl': 1, 'gia': 150000}]},
            'nganHang': {'ten': 'MB Bank', 'chuTk': 'NGUYEN HOANG PHUC', 'soTk': '0000 0000 0000 000'}},
}
out = f'{H}/../prototype/data.js'
open(out, 'w', encoding='utf-8').write('/* Dữ liệu THẬT lấy bằng GET từ stack demo http://localhost:5190 ngày ' + data['ngay'] + ' (sinh bằng tools/gen-data.py, không sửa tay). Riêng D.mau là minh hoạ. */\nwindow.D = '
                                       + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
print('ok', os.path.getsize(out), 'bytes;', len(no), 'người nợ;', len(hoa_don), 'hoá đơn;', len(hop_dong), 'hợp đồng;', len(su_co), 'sự cố')
