# Đo tương phản WCAG 2.x thật cho cặp màu token. Chạy: python tools/contrast.py
# Không phụ thuộc thư viện. Kết quả dán vào QA.md.
def lum(h):
    h = h.lstrip('#'); r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

assert abs(ratio('#000000', '#FFFFFF') - 21) < 0.01  # tự kiểm công thức
assert abs(ratio('#777777', '#FFFFFF') - 4.48) < 0.01

PAGE, CARD, SUNK = '#F4F2EE', '#FFFFFF', '#F7F5F2'
# (tên, chữ/hình, nền, ngưỡng) — ngưỡng 4.5 chữ thường, 3.0 chữ lớn / thành phần UI / đồ hoạ
PAIRS = [
    ('ink trên card', '#1C1B19', CARD, 4.5), ('ink trên nền trang', '#1C1B19', PAGE, 4.5),
    ('ink-2 trên card', '#57534E', CARD, 4.5), ('ink-2 trên nền trang', '#57534E', PAGE, 4.5),
    ('ink-3 (meta, placeholder) trên card', '#6B655F', CARD, 4.5), ('ink-3 trên nền trang', '#6B655F', PAGE, 4.5),
    ('ink-3 trên sunken', '#6B655F', SUNK, 4.5),
    ('chữ trắng trên brand (nút chính)', '#FFFFFF', '#0F766E', 4.5), ('chữ trắng trên brand-hover', '#FFFFFF', '#115E59', 4.5),
    ('brand-text (link) trên card', '#0F766E', CARD, 4.5), ('brand-text trên nền trang', '#0F766E', PAGE, 4.5),
    ('brand-text trên brand-tint', '#0F766E', '#E6F2F0', 4.5), ('brand-ink trên brand-tint (nav chọn)', '#115E59', '#E6F2F0', 4.5),
    ('success-text trên success-tint', '#166534', '#E7F5EC', 4.5), ('warning-text trên warning-tint', '#92400E', '#FDF1DC', 4.5),
    ('danger-text trên danger-tint', '#B42318', '#FDECEA', 4.5), ('info-text trên info-tint', '#1E4FC2', '#EAF0FC', 4.5),
    ('neutral-text trên neutral-tint', '#57534E', '#EFECE7', 4.5),
    ('danger-text trên card (lỗi form)', '#B42318', CARD, 4.5), ('amber-text trên card', '#92400E', CARD, 4.5),
    ('amber-text trên amber-tint', '#92400E', '#FDF1DC', 4.5),
    ('chữ trắng trên danger (nút xoá)', '#FFFFFF', '#B42318', 4.5),
    ('viền ô nhập trên card (UI 3:1)', '#8E8880', CARD, 3.0), ('viền ô nhập trên sunken', '#8E8880', SUNK, 3.0),
    ('focus ring trên card', '#0F766E', CARD, 3.0), ('focus ring trên nền trang', '#0F766E', PAGE, 3.0),
    ('đồ hoạ teal chart trên card', '#0D9488', CARD, 3.0), ('đồ hoạ amber chart trên card', '#D97706', CARD, 3.0),
    ('đồ hoạ stone chart trên card', '#8E8880', CARD, 3.0),
    ('đồ hoạ stone chart trên sunken', '#8E8880', SUNK, 3.0),
    ('chữ trắng trên toast (inverse)', '#FFFFFF', '#1C1B19', 4.5),
    ('nút hành động toast trên inverse', '#8FD3C8', '#1C1B19', 4.5),
    ('chữ trắng trên badge đỏ', '#FFFFFF', '#B42318', 4.5),
    ('ink-2 trên neutral tint (chip, tag)', '#57534E', '#EFECE7', 4.5),
    ('switch tắt (track) trên card', '#8E8880', CARD, 3.0),
]
if __name__ == '__main__':
    bad = 0
    print('| Cặp | Chữ/hình | Nền | Tỷ lệ đo | Ngưỡng | Kết quả |\n|---|---|---|---|---|---|')
    for n, f, bg, t in PAIRS:
        r = ratio(f, bg); ok = r >= t; bad += not ok
        print(f'| {n} | `{f}` | `{bg}` | {r:.2f}:1 | {t}:1 | {"Đạt" if ok else "TRƯỢT"} |')
    print(f'\nTổng {len(PAIRS)} cặp, trượt {bad}.')
