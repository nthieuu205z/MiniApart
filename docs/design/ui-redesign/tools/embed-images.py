"""Nhúng ảnh vào SVG trong figma/ (Figma không đọc href trỏ file ngoài khi import SVG).
Đổi webp -> JPEG q85 base64, cạnh dài tối đa 1200px. Chạy lại an toàn: chỉ thay href chưa là data:.
Chạy: python tools/embed-images.py   (từ thư mục docs/design/ui-redesign)"""
import base64, glob, io, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cache = {}

def data_uri(rel):
    if rel not in cache:
        im = Image.open(os.path.normpath(os.path.join(ROOT, 'figma', rel))).convert('RGB')
        im.thumbnail((1200, 1200))
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=85)
        cache[rel] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    return cache[rel]

for f in glob.glob(os.path.join(ROOT, 'figma', '*.svg')):
    s = open(f, encoding='utf-8').read()
    out, k = re.subn(r'href="(?!data:)([^"#][^"]*\.(?:webp|png|jpe?g))"', lambda m: f'href="{data_uri(m.group(1))}"', s)
    assert 'href="../' not in out, f  # tự kiểm: không còn tham chiếu file ngoài
    if k:
        open(f, 'w', encoding='utf-8').write(out)
    print(os.path.basename(f), 'nhúng', k, 'ảnh')
