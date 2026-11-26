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

PAGE, CARD, SUNK = '#F4F5F7', '#FFFFFF', '#F4F5F7'
INK, PHU, MO, LINK, DO, DO_NHAT = '#14181D', '#47505A', '#5C6670', '#1B56B0', '#B3261E', '#FDECEA'
# (tên, chữ/hình, nền, ngưỡng) — V3 "Sổ cái". 4.5 chữ thường, 3.0 chữ lớn / thành phần UI / đồ hoạ
PAIRS = [
    ('mực trên trắng', INK, CARD, 4.5), ('mực trên nền', INK, PAGE, 4.5),
    ('phụ trên trắng', PHU, CARD, 4.5), ('phụ trên nền', PHU, PAGE, 4.5),
    ('mờ trên nền', MO, PAGE, 4.5), ('mờ trên trắng', MO, CARD, 4.5),
    ('link trên trắng', LINK, CARD, 4.5), ('link trên nền', LINK, PAGE, 4.5),
    ('chữ trắng trên nút mực', '#FFFFFF', INK, 4.5), ('chữ trắng trên hover mực', '#FFFFFF', '#2A313A', 4.5),
    ('đỏ trên đỏ nhạt', DO, DO_NHAT, 4.5), ('đỏ trên trắng (tiền nợ)', DO, CARD, 4.5),
    ('vàng chữ trên vàng nhạt', '#8A4B00', '#FFF3D6', 4.5), ('vàng chữ trên trắng', '#8A4B00', CARD, 4.5),
    ('xanh ok trên ok nhạt', '#1F6B43', '#E2F3E9', 4.5), ('xanh ok trên trắng', '#1F6B43', CARD, 4.5),
    ('phụ trên chọn (nav)', PHU, '#E4E7EB', 4.5), ('mực trên chọn (nav)', INK, '#E4E7EB', 4.5),
    ('link toast trên mực', '#A9C7FF', INK, 4.5), ('chữ trắng trên toast', '#FFFFFF', INK, 4.5),
    ('viền ô nhập trên nền (UI 3:1)', '#868F99', PAGE, 3.0), ('viền ô nhập trên trắng', '#868F99', CARD, 3.0),
    ('viền nút danger trên trắng (UI 3:1)', DO, CARD, 3.0), ('focus ring mực trên trắng', INK, CARD, 3.0),
]
if __name__ == '__main__':
    bad = 0
    print('| Cặp | Chữ/hình | Nền | Tỷ lệ đo | Ngưỡng | Kết quả |\n|---|---|---|---|---|---|')
    for n, f, bg, t in PAIRS:
        r = ratio(f, bg); ok = r >= t; bad += not ok
        print(f'| {n} | `{f}` | `{bg}` | {r:.2f}:1 | {t}:1 | {"Đạt" if ok else "TRƯỢT"} |')
    print(f'\nTổng {len(PAIRS)} cặp, trượt {bad}.')
