# Lấy dữ liệu thật từ stack demo để dựng prototype V3. Chỉ GET; đăng nhập là POST duy nhất.
# Mật khẩu lấy từ biến môi trường MA_DEMO_PASSWORD, không ghi ra file, không in.
# Chạy: MA_DEMO_PASSWORD=... python3 fetch.py   → tools/data/*.json (thư mục này không cần giữ trong repo)
import json, os, re, urllib.request, urllib.error

BASE = os.environ.get('MA_APP_URL', 'http://localhost:5190')
OUT = os.path.dirname(os.path.abspath(__file__)) + '/data'
os.makedirs(OUT, exist_ok=True)
PW = os.environ['MA_DEMO_PASSWORD']
SDT = {'QTHT': '0999000001', 'CHU': '0999000011', 'QUAN_LY': '0999000020', 'THO': '0999000031', 'NGUOI_THUE': '0999100001'}


def req(method, path, token=None, body=None):
    assert method == 'GET' or path == '/api/auth/login', 'chỉ GET'
    r = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                               headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read() or b'null')
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def login(role):
    st, d = req('POST', '/api/auth/login', body={'soDienThoai': SDT[role], 'matKhau': PW})
    assert st == 200, (role, st)
    return d['token']


def get(role, tok, path):
    st, data = req('GET', path, tok)
    name = role + '_' + re.sub(r'[^a-zA-Z0-9]+', '_', path).strip('_')
    if st == 200:
        json.dump(data, open(f'{OUT}/{name}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    n = len(data) if isinstance(data, list) else '-'
    print(st, role, path, 'n=', n)
    return data if st == 200 else None


chu = login('CHU')
get('CHU', chu, '/api/auth/me')
toa = get('CHU', chu, '/api/toa-nha') or []
for p in ['/api/dashboard/chu', '/api/hoa-don', '/api/nguoi-thue', '/api/bao-cao/cong-no', '/api/lich-hen', '/api/thong-bao',
          '/api/yeu-cau-sua-chua', '/api/yeu-cau-sua-chua/lich-su?', '/api/bao-cao/tong-quan?', '/api/bao-cao/tieu-thu',
          '/api/bao-cao/chi-phi-bao-tri?', '/api/nhat-ky-thao-tac?']:
    get('CHU', chu, p)
for t in toa:
    i = t['id']
    get('CHU', chu, f'/api/toa-nha/{i}/phong')
    get('CHU', chu, f'/api/hop-dong?toaNhaId={i}')
    get('CHU', chu, f'/api/hoa-don?toaNhaId={i}')
    get('CHU', chu, f'/api/yeu-cau-sua-chua?toaNhaId={i}')
    get('CHU', chu, f'/api/toa-nha/{i}/dich-vu')
    get('CHU', chu, f'/api/toa-nha/{i}/pccc')
    get('CHU', chu, f'/api/toa-nha/{i}/bang-viec')
    get('CHU', chu, f'/api/yeu-cau-sua-chua/tho?toaNhaId={i}')
    ky = get('CHU', chu, f'/api/toa-nha/{i}/ky-thanh-toan') or []
    for k in ky[:2]:
        get('CHU', chu, f"/api/toa-nha/{i}/ky-thanh-toan/{k['id']}/chi-so")
        get('CHU', chu, f"/api/toa-nha/{i}/ky-thanh-toan/{k['id']}/thieu-chi-so")
nt = get('CHU', chu, '/api/nguoi-thue') or []
for x in nt[:40]:
    get('CHU', chu, f"/api/nguoi-thue/{x['id']}")

ql = login('QUAN_LY')
for p in ['/api/auth/me', '/api/dashboard/quan-ly', '/api/toa-nha', '/api/thong-bao', '/api/hoa-don', '/api/yeu-cau-sua-chua', '/api/lich-hen']:
    get('QUAN_LY', ql, p)

tho = login('THO')
for p in ['/api/auth/me', '/api/tho/tong-quan?', '/api/tho/cong-viec?', '/api/tho/viec-cua-toi', '/api/thong-bao']:
    get('THO', tho, p)
for v in (json.load(open(f'{OUT}/THO_api_tho_cong_viec.json', encoding='utf-8')) if os.path.exists(f'{OUT}/THO_api_tho_cong_viec.json') else [])[:12]:
    get('THO', tho, f"/api/tho/cong-viec/{v['id']}")

kh = login('NGUOI_THUE')
for p in ['/api/auth/me', '/api/cong/hoa-don-moi-nhat', '/api/cong/hoa-don', '/api/cong/hop-dong', '/api/cong/tieu-thu?soKy=12',
          '/api/cong/yeu-cau-sua-chua', '/api/thong-bao']:
    get('NGUOI_THUE', kh, p)

qt = login('QTHT')
for p in ['/api/auth/me', '/api/nguoi-dung', '/api/toa-nha', '/api/nhat-ky-thao-tac?']:
    get('QTHT', qt, p)
