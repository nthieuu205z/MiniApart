# Chỉ GET (đăng nhập là POST duy nhất). Mật khẩu đọc từ dòng "Tài khoản" của compose lúc chạy, không ghi ra file.
import json, re, sys, urllib.request, urllib.error, os
BASE = 'http://localhost:5190'
OUT = os.path.dirname(os.path.abspath(__file__)) + '/data'
os.makedirs(OUT, exist_ok=True)
line = next(l for l in open('C:/Users/nthieuu05/Documents/PRJ/MiniApart-ui/docker-compose.demo.yml', encoding='utf-8') if 'Tài khoản' in l)
PW = re.search(r'mật khẩu\s*([^)\s]+)\)', line).group(1)
SDT = {'QTHT': '0999000001', 'CHU': '0999000011', 'QUAN_LY': '0999000020', 'THO': '0999000031', 'NGUOI_THUE': '0999100001'}

def req(method, path, token=None, body=None):
    r = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                               headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read() or b'null')
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return 0, str(e)

role = sys.argv[1]
paths = sys.argv[2:]
st, login = req('POST', '/api/auth/login', body={'soDienThoai': SDT[role], 'matKhau': PW})
assert st == 200, st
tok = login['token']
for p in paths:
    st, data = req('GET', p, tok)
    name = role + '_' + re.sub(r'[^a-zA-Z0-9]+', '_', p).strip('_')
    if st == 200:
        json.dump(data, open(f'{OUT}/{name}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    n = len(data) if isinstance(data, list) else (len(data.get('content', [])) if isinstance(data, dict) and 'content' in data else '-')
    print(st, p, 'n=', n)
