#!/usr/bin/env python3
"""Chèn khối chung (_chung.py) vào giữa <!-- CHUNG --> … <!-- /CHUNG --> của mọi briefs/05-y*.md.
Chạy lại sau mỗi lần sửa _chung.py:  python3 docs/design/ui-redesign/v3/plans/briefs/gen-briefs.py
Thay N/port theo số lô trong tên file (05-y3-*.md → y3, cổng 5330). y0 có câu bối cảnh riêng."""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _chung import CHUNG  # noqa: E402

MO, DONG = '<!-- CHUNG -->', '<!-- /CHUNG -->'
Y0 = ('Lô nền y0 đã gộp vào `feat/v3` các phần sau: token, font, mật độ, component chung, `tienTheoNguoi.ts`. Lô này chỉ dùng lại, **không** sửa các phần đó.',
      'Lô này (y0) chạy trước mọi lô và tạo ra các phần đó. Nhánh gốc là `feat/v3` tại commit `09cbddb` (617 test).')


def khoi(n: int, ten: str) -> str:
    t = CHUNG.replace('yN-<ten>', f'y{n}-{ten}').replace('yN', f'y{n}').replace('53N0', f'53{n}0')
    if n == 0:
        assert Y0[0] in t
        t = t.replace(Y0[0], Y0[1])
    return t.strip('\n')


def main() -> int:
    so = 0
    for f in sorted(HERE.glob('05-y*.md')):
        m = re.match(r'05-y(\d+)-(.+)\.md$', f.name)
        text = f.read_text(encoding='utf-8')
        if not m or MO not in text:
            continue
        n = int(m.group(1))
        dau, _, duoi = text.partition(MO)
        _, _, sau = duoi.partition(DONG)
        f.write_text(f'{dau}{MO}\n{khoi(n, m.group(2))}\n{DONG}{sau}', encoding='utf-8')
        so += 1
    print(f'đã chèn khối chung vào {so} brief')
    return 0


if __name__ == '__main__':
    sys.exit(main())
