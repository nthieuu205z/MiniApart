# Sinh ux-v2/prototype/data.js từ JSON GET thật (cache/scratch/uxv2/data). Chạy lại sau mỗi lần lấy dữ liệu.
import json, collections as C, os, datetime as dt
D = os.path.dirname(os.path.abspath(__file__)) + '/data/'
OUT = 'C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui/docs/design/ui-redesign/ux-v2/prototype/data.js'
L = lambda f: json.load(open(D + f + '.json', encoding='utf-8'))
f0 = lambda x: round(float(x or 0))

toa = [{'id': t['id'], 'ten': t['ten'], 'diaChi': t['diaChi'], 'soTang': t['soTang'], 'ngayChotSo': t['ngayChotSo']} for t in L('CHU_api_toa_nha')]
phong = {t['id']: L(f"CHU_api_toa_nha_{t['id']}_phong") for t in toa}
hd = sum((L(f'CHU_api_hop_dong_toaNhaId_{t["id"]}') for t in toa), [])
for t in toa:
    ps = phong[t['id']]; t['soPhong'] = len(ps)
    t['dangThue'] = sum(p['trangThai'] == 'DANG_THUE' for p in ps)
    t['trong'] = [p['soPhong'] for p in ps if p['trangThai'] == 'TRONG']
    t['dangSua'] = [p['soPhong'] for p in ps if p['trangThai'] == 'DANG_SUA']
    t['ky'] = L(f"CHU_api_toa_nha_{t['id']}_ky_thanh_toan")[0]

cn = L('CHU_api_bao_cao_cong_no')['congNo']
g = {}
for r in cn:
    k = r['nguoiThueId']
    x = g.setdefault(k, {'id': k, 'ten': r['hoTenNguoiThue'], 'toa': r['tenToaNha'], 'toaId': r['toaNhaId'], 'phong': r['soPhong'], 'hopDongId': r['hopDongId'], 'hd': []})
    x['hd'].append({'id': r['hoaDonId'], 'ma': r['maHoaDon'], 'ky': r['ngayPhatHanh'][5:7] + '/' + r['ngayPhatHanh'][:4], 'han': r['hanThanhToan'], 'tong': f0(r['tongTien']), 'daThu': f0(r['daThu']), 'conLai': f0(r['conLai']), 'tre': r['soNgayQuaHan']})
debtors = sorted(g.values(), key=lambda x: -sum(h['conLai'] for h in x['hd']))
for x in debtors:
    x['tong'] = sum(h['conLai'] for h in x['hd']); x['tre'] = max(h['tre'] for h in x['hd']); x['hd'].sort(key=lambda h: h['han'])

hoaDon = []
for t in toa:
    for h in L(f'CHU_api_hoa_don_toaNhaId_{t["id"]}'):
        hoaDon.append({'id': h['hoaDonId'], 'ma': h['maHoaDon'], 'toa': t['ten'], 'phong': h['soPhong'], 'nguoi': h['nguoiThue'], 'kyId': h['kyId'], 'han': h['hanThanhToan'], 'phatHanh': h['ngayPhatHanh'], 'tt': h['trangThai'], 'tong': f0(h['tongTien']), 'daThu': f0(h['daThu']), 'conLai': f0(h['conLai'])})

suCo = [{'id': s['id'], 'ma': s['maYeuCau'], 'toa': s['toaNha'], 'phong': s['soPhong'], 'tang': s['tang'], 'hangMuc': s['hangMuc'], 'moTa': s['moTa'].replace(' Dữ liệu tình huống mô phỏng.', ''), 'mucDo': s['mucDo'], 'tenMucDo': s['tenMucDo'], 'tt': s['trangThai'], 'tenTt': s['tenTrangThai'], 'tao': s['taoLuc'][:10], 'tho': s['nguoiXuLyId'], 'sdt': s['soDienThoaiLienHe'], 'chiPhi': s['chiPhi']} for s in L('CHU_api_yeu_cau_sua_chua')]
hopDong = [{'id': h['id'], 'phongId': h['phongId'], 'phong': h['soPhong'], 'nguoiId': h['nguoiThueId'], 'nguoi': h['hoTenNguoiThue'], 'bd': h['ngayBatDau'], 'kt': h['ngayKetThuc'], 'gia': f0(h['giaThue']), 'coc': f0(h['tienCoc']), 'baoTruoc': h['soNgayBaoTruoc'], 'tt': h['trangThai'], 'tenTt': h['tenTrangThai'], 'sapHet': h['sapHetHan'], 'conLai': h['soNgayConLai'], 'dv': [(d['tenDichVu'], f0(d['donGiaApDung'])) for d in h['dichVuApDung']]} for h in hd]
toaOfPhong = {p['id']: t['ten'] for t in toa for p in phong[t['id']]}
for h in hopDong: h['toa'] = toaOfPhong.get(h['phongId'])
lichHen = [{'ten': x['hoTen'], 'sdt': x['soDienThoai'], 'phong': x['soPhong'], 'toa': x['tenToaNha'], 'gio': x['thoiGianHen'], 'tt': x['trangThai']} for x in L('CHU_api_lich_hen')]

dchu = L('CHU_api_dashboard_chu')
ql = L('QUAN_LY_api_dashboard_quan_ly'); bv = L('QUAN_LY_api_toa_nha_3_bang_viec')
chiSo = L('CHU_api_toa_nha_3_ky_thanh_toan_5_chi_so')
tbQL = L('QUAN_LY_api_thong_bao')
tho = L('THO_api_tho_tong_quan'); thoViec = L('THO_api_tho_cong_viec')
nt1 = L('CHU_api_nguoi_thue_1'); nt = L('CHU_api_nguoi_thue')
ntHd = L('NGUOI_THUE_api_cong_hoa_don_moi_nhat')['hoaDon']; ntTt = L('NGUOI_THUE_api_cong_tieu_thu')
pay31 = L('CHU_api_hoa_don_31_thanh_toan')['giaoDich']
users = C.Counter(x['vaiTro'] for x in L('QTHT_api_nguoi_dung'))

data = {
    'capNhat': dchu['thoiDiemCapNhat'][:16].replace('T', ' '),
    'me': {r: L(f'{r}_api_auth_me') for r in ('CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE', 'QTHT')},
    'toa': toa, 'kpiChu': dchu['kpi'], 'thang': dchu['taiChinhTheoThang'],
    'debtors': debtors, 'hoaDon': hoaDon, 'suCo': suCo, 'hopDong': hopDong, 'lichHen': lichHen,
    'phong3': phong[3], 'nguoiThue': [{'id': x['id'], 'ten': x['hoTen'], 'sdt': x['soDienThoai'], 'que': x['queQuan']} for x in nt],
    'nt1': nt1, 'pay31': pay31, 'ntTieuThu': ntTt, 'ntHoaDon': ntHd,
    'ql': {'kpi': ql['kpi'], 'congTo': ql['congToChuaGhi'], 'lichHen': ql['lichHenSapToi'], 'tuoiNo': ql['tuoiNo'], 'coCau': ql['coCauPhong']},
    'bangViec': bv['nhomViec'], 'chiSo': chiSo, 'thongBaoQL': {'n': tbQL['soChuaDoc'], 'ds': tbQL['thongBao'][:8]},
    'tbCount': {'CHU': L('CHU_api_thong_bao')['soChuaDoc'], 'QUAN_LY': tbQL['soChuaDoc'], 'THO': L('THO_api_thong_bao')['soChuaDoc'], 'NGUOI_THUE': L('NGUOI_THUE_api_thong_bao')['soChuaDoc']},
    'tho': {'kpi': tho['kpi'], 'viec': [v for v in thoViec if v['trangThaiHieuLuc'] not in ('DA_DONG', 'DA_HUY')], 'xong': sum(v['trangThaiHieuLuc'] == 'DA_DONG' for v in thoViec)},
    'users': users,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write('/* Dữ liệu THẬT lấy bằng GET từ stack demo http://localhost:5190 lúc ' + data['capNhat'] + ' (sinh bằng gen-data.py, không sửa tay). */\nwindow.D = ' + json.dumps(data, ensure_ascii=False) + ';\n')
assert sum(x['tong'] for x in debtors) == 173450000, 'tổng công nợ lệch dashboard'
print('ok', len(debtors), len(hoaDon), len(suCo), len(hopDong), os.path.getsize(OUT))
