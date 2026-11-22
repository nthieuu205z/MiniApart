"""Ảnh so trước/sau + đo độ lệch SVG. Chạy từ docs/design/ui-redesign/ux-v2:
  python tools/compare.py            → compare/*.png (trước: ../evidence/dot-03, sau: screens/png)
  python tools/compare.py --svg DIR  → in % pixel lệch (>40/255) giữa SVG render (DIR) và PNG gốc, ghi tools/svg-diff.json"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = os.path.join(ROOT, '..', 'evidence', 'dot-03')
PAIRS = [  # (tên, ảnh trước, ảnh sau, câu tả)
    ('01-chu-tong-quan-vs-hom-nay', 'chu-tq-1440.png', '01-chu-hom-nay-1440.png', 'Chủ: báo cáo số → danh sách việc cần làm hôm nay'),
    ('02-hoa-don-vs-thu-tien', 'chu-hoadon-1440.png', '04-chu-thu-tien-1440.png', 'Hoá đơn lặp theo tháng → Thu tiền nhóm theo người, có hàng tổng'),
    ('03-nguoi-thue-vs-ho-so-360', 'chu-nt-1440.png', '06-chu-nguoi-thue-360-1440.png', 'Bảng + form mở bên dưới → hồ sơ 360° nối tiền, hợp đồng, sự cố'),
    ('04-su-co-vs-ngan-chi-tiet', 'ql-suco-1440.png', '13-ql-su-co-1440.png', '2 bảng chồng (3.168px) → 1 danh sách + ngăn chi tiết có bước'),
    ('05-nhac-viec-vs-hom-nay-ql', 'ql-nv-1440.png', '10-ql-hom-nay-1440.png', 'Nhắc việc → Hôm nay có chu kỳ tháng ở đầu'),
    ('06-hop-dong-vs-ho-so-hop-dong', 'chu-hd-1440.png', '08-chu-hop-dong-360-1440.png', 'Bảng hợp đồng → hồ sơ hợp đồng có mốc và liên kết'),
    ('07-khong-co-quyen', 'chu-phong-1440.png', '15-chu-khong-co-quyen-1440.png', 'Màn lỗi quyền gọn trong khung, có đường đi tiếp'),
    ('08-ghi-chi-so-mobile', 'ql-ghi-390.png', '23-ql-ghi-chi-so-390.png', 'Ghi chỉ số nằm trong chu kỳ tháng, công tơ còn thiếu lên đầu'),
    ('09-tho-mobile', 'tho-390.png', '20-tho-viec-390.png', 'Thợ: mỗi việc ghi rõ bước và 1 hành động kế tiếp'),
    ('10-khach-thue-mobile', 'nt-hd-390.png', '21-khach-can-tra-390.png', 'Khách thuê: “Cần trả” tổng các kỳ + nút trả ngay'),
]
FONT = 'C:/Windows/Fonts/segoeui.ttf'

def font(sz):
    try: return ImageFont.truetype(FONT, sz)
    except OSError: return ImageFont.load_default()

def compare():
    os.makedirs(os.path.join(ROOT, 'compare'), exist_ok=True)
    for name, before, after, cap in PAIRS:
        a = Image.open(os.path.join(EV, before)).convert('RGB'); b = Image.open(os.path.join(ROOT, 'screens', 'png', after)).convert('RGB')
        mobile = a.width < 600
        H = max(a.height, b.height) if mobile else min(max(a.height, b.height), 1800)
        a, b = a.crop((0, 0, a.width, min(a.height, H))), b.crop((0, 0, b.width, min(b.height, H)))
        gap, top = 40, (112 if mobile else 72)
        c = Image.new('RGB', (a.width + b.width + gap * 3, H + top + gap), (232, 229, 224))
        d = ImageDraw.Draw(c)
        d.text((gap, 18), 'Trước (app thật, dot-03)', fill=(87, 83, 78), font=font(26))
        if mobile:  # khung hẹp: câu tả xuống dòng riêng, không bị cắt
            d.text((gap * 2 + a.width, 18), 'Sau (UX v2)', fill=(17, 94, 89), font=font(26))
            d.text((gap, 60), cap, fill=(28, 27, 25), font=font(20))
        else:
            d.text((gap * 2 + a.width, 18), 'Sau (UX v2)  ·  ' + cap, fill=(17, 94, 89), font=font(26))
        c.paste(a, (gap, top)); c.paste(b, (gap * 2 + a.width, top))
        c.save(os.path.join(ROOT, 'compare', name + '.png'), optimize=True)
        print(name, c.size)

def svgdiff(d):
    out = []
    for f in sorted(os.listdir(d)):
        a = Image.open(os.path.join(d, f)).convert('L'); b = Image.open(os.path.join(ROOT, 'screens', 'png', f)).convert('L')
        h = min(a.height, b.height); w = min(a.width, b.width)
        diff = ImageChops.difference(a.crop((0, 0, w, h)), b.crop((0, 0, w, h))).point(lambda v: 255 if v > 40 else 0)
        pct = round(sum(diff.histogram()[255:]) / (w * h) * 100, 2)
        out.append({'n': f[:-4], 'w': b.width, 'h': b.height, 'svgH': a.height, 'diffPct': pct}); print(f, pct, '%')
    json.dump(out, open(os.path.join(ROOT, 'tools', 'svg-diff.json'), 'w'), indent=1)

if __name__ == '__main__':
    svgdiff(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == '--svg' else compare()
