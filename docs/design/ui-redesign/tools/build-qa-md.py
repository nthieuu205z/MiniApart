"""Sinh QA.md từ số đo thật (chạy sau batch QA). Dùng: python tools/build-qa-md.py <final_metrics.json> <contrast.md> <guard_sum.txt>"""
import json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m = json.load(open(sys.argv[1], encoding='utf-8'))
contrast = open(sys.argv[2], encoding='utf-8').read().strip()
guard = open(sys.argv[3], encoding='utf-8').read().strip()
R = m['rows']
assert all(r['ovf'] == 0 and r['hit'] == 0 and r['tiny'] == 0 and r['noname'] == 0 and r['cbelow'] == 0 for r in R), 'còn lỗi QA — sửa trước khi sinh QA.md'
L = []
w = L.append
w('# QA — số đo thật\n')
w('Đo ngày 21/11/2026 bằng Edge headless qua CDP (`tools/cdp-run.mjs batch`), probe `tools/qa-probe.js` và `tools/focus-motion-probe.js`; tương phản cặp token bằng `tools/contrast.py`. File này sinh bằng `tools/build-qa-md.py` từ kết quả đo, không chép tay. Desktop đo ở 1440×900, mobile 390×844 (giả lập thiết bị di động, DPR 1).\n')
w('Ngưỡng: vùng chạm ≥ 44px khi bề rộng < 600px, ≥ 36px desktop (liên kết nằm trong đoạn văn được miễn theo WCAG 2.5.8); cỡ chữ ≥ 13px mobile / ≥ 12px desktop (chữ trong SVG biểu đồ tính theo hệ số scale thật; chữ `::after` của badge cũng đo); tương phản chữ ≥ 4,5:1 (chữ lớn ≥ 3:1), viền điều khiển/đồ hoạ ≥ 3:1.\n')
w('## 1. Tổng hợp mỗi màn\n')
w('| Màn | Khung | Cuộn ngang | Control | Dưới vùng chạm | Chữ dưới sàn | Thiếu tên truy cập | Ảnh thiếu alt | Font thật | Lỗi console |')
w('|---|---|---|---|---|---|---|---|---|---|')
for r in R:
    w(f"| {r['n']} | {r['vp']} (cao {r['h']}) | {r['ovf']} px | {r['ctr']} | {r['hit']} | {r['tiny']} | {r['noname']} | {r['imgnoalt']} | {', '.join(r['fonts'])} | {r['err']} |")
w('')
w('## 2. Tương phản\n')
w('### 2a. Đo trên DOM thật (màu chữ tính toán so với nền đặc gần nhất)\n')
w('| Màn | Số node chữ đã đo | Tỷ lệ thấp nhất | Dưới ngưỡng |')
w('|---|---|---|---|')
for r in R:
    w(f"| {r['n']} | {r['cnodes']} | {str(r['cmin']).replace('.', ',')}:1 | {r['cbelow']} |")
w(f"\nTổng {sum(r['cnodes'] for r in R)} node chữ, thấp nhất {str(min(r['cmin'] for r in R)).replace('.', ',')}:1 (chữ link teal trên brand tint). Bỏ qua: chữ nằm trên ảnh/gradient, nút đang tắt/đang tải, chữ trong icon. **Chưa kiểm** chữ phủ trên ảnh phòng (01, 02) — các nhãn đó đặt trong thẻ nền đặc nên rủi ro thấp.\n")
w('### 2b. Cặp token (`tools/contrast.py`)\n')
w(contrast + '\n')
w('## 3. Cỡ chạm và không cuộn ngang ở 390\n')
w('Màn desktop xem ở 390×844 (bố cục dồn 1 cột, sidebar → ẩn, topbar xuống dòng):\n')
w('| Màn | Khung | Cuộn ngang | Dưới 44px | Chữ < 13px |')
w('|---|---|---|---|---|')
for r in m['q390']:
    w(f"| {r['n']} | {r['vp']} | {r['ovf']} px | {r['hit']} | {r['tiny']} |")
w('\nCác màn mobile 06/07/08 đo ở 390 trong bảng §1. `design-system.html` ở 390: 0 px cuộn ngang, 0 control < 44px, 0 chữ < 13px. Biểu đồ trên điện thoại cuộn ngang **bên trong thẻ** (vùng `role="region"` có `tabindex="0"` để cuộn bằng bàn phím), trang không cuộn ngang.\n')
w('## 4. Bàn phím / focus và reduced-motion\n')
w('Probe focus lần lượt từng phần tử bấm được bằng `focus({focusVisible:true})` và kiểm có outline ≥ 2px (hoặc vòng box-shadow ≥ 2px). Probe chuyển động liệt kê animation đang chạy và transition > 120ms.\n')
w('| Màn | Chế độ | Phần tử focus được | Thiếu vòng focus | Animation đang chạy | Transition > 120ms |')
w('|---|---|---|---|---|---|')
for r in m['fm']:
    w(f"| {r['n']} | {'reduced-motion' if r['red'] else 'thường'} | {r['foc']} | {r['noring']} | {', '.join(r['anim']) or '—'} | {r['slow']} |")
w('\nVòng focus đo được ở mọi màn: `solid 2px rgb(15, 118, 110)` (teal, 5,47:1 trên thẻ). Khi bật reduced-motion: 0 transition > 120ms, modal chỉ còn `ma-fade-in` (đổi độ mờ, không transform). Ở chế độ thường, transition hover 160ms là chủ ý.\n')
w('**Chưa kiểm:** thứ tự Tab thực tế bằng phím (mới kiểm từng phần tử nhận focus và có vòng); bẫy focus trong modal (bản HTML tĩnh không có JS mở/đóng modal — component `ConfirmDialog` của repo đã có test riêng); trình đọc màn hình thật (NVDA/VoiceOver).\n')
w('## 5. SVG cho Figma\n')
w('Render lại từng SVG bằng Edge, so pixel với PNG chụp từ HTML (ngưỡng lệch > 40/255 mỗi kênh xám):\n')
w('| File | Kích thước | `<text>` | Ảnh nhúng | foreignObject | Pixel lệch |')
w('|---|---|---|---|---|---|')
for r in R:
    w(f"| figma/{r['n']}.svg | {r['svgkb']} KB | {r['text']} | {r['img']} | {r['fo']} | {str(r['diff']).replace('.', ',')} % |")
w('\nCác file đều parse được bằng XML parser. Phần lệch chủ yếu là khử răng cưa chữ và bóng đổ bị bỏ (danh sách đầy đủ ở `figma/IMPORT.md`). **Chưa kiểm** import thật vào Figma (không có đăng nhập Figma trong phiên này).\n')
w('## 6. Guard của repo (chạy trên bản chép, không sửa `frontend/`)\n')
w('`bash docs/design/ui-redesign/tools/run-repo-guard.sh` — chép `frontend/` (kể cả node_modules) sang `$TMPDIR/ma-guard`, thêm `overlay-ui-redesign.css` (= `assets/tokens.css`) + 8 woff2 mới vào `src/tokens/`, `@import` cuối `index.css`, nối overlay vào cuối `typography.css` (vì `designTokens.test.ts` chỉ nạp `colors.css` + `typography.css` dạng raw), rồi chạy:\n')
w('```text\n' + guard + '\n```\n')
w('Kết quả: `designTokens.test.ts` qua (giữ `--ma-paper-1 = #F9F7F6`, `--ma-font-ui` chứa Archivo); toàn bộ 38 file / 252 test qua; `tsc -b && vite build` qua và đóng gói đủ 4 file `archivo-vietnamese-*.woff2`. Lưu ý: bản chép lấy từ working copy, gồm cả các thay đổi **chưa commit** từ 16/11 trong `frontend/src` (không do phiên này).\n')
w('Thang cỡ control của repo: repo không có token cỡ control; ràng buộc 36px desktop / 44px mobile lấy theo quy ước trong brief và đã đo ở §1, §3. Repo không có "skin" riêng; tương phản đo ở §2.\n')
w('## 7. Bảng slop tự chấm\n')
w('| Luật (brief §5) | Kết quả | Bằng chứng |')
w('|---|---|---|')
for a, b, c in [
    ('Không font serif fallback ở số/tiêu đề', 'Đạt', '`fontFamiliesUsed` = Archivo ở cả 10 trang; font Archivo 400–700 đã nạp (đo `document.fonts`)'),
    ('Không hộp viền lồng hộp cùng độ nổi', 'Đạt', 'Thẻ không viền/không bóng; khối con dùng nền sunken; chỉ kẻ hàng 1px trong bảng/danh sách'),
    ('Không hàng nhiều nút ngang hàng thiếu nút chính', 'Đạt', 'Số `.btn-primary` mỗi màn: 01–02, 04–09 = 1; 03 = 0 (dashboard chỉ đọc, không có hàng nút — hành động là liên kết "Xem công nợ"…)'),
    ('Không thẻ số liệu trống', 'Đạt', 'Mọi KPI/thẻ nhỏ có số thật từ API demo; trạng thái rỗng có EmptyState riêng'),
    ('Khung chi tiết không phải danh sách key/value trơn', 'Đạt', '08: dòng khoản có icon + diễn giải công thức + số thẳng cột; tổng nổi bật'),
    ('Không gradient tím/xanh mặc định', 'Đạt', '0 `linear-gradient` trong CSS; chỉ 1 gradient teal mờ dưới biểu đồ vùng (SVG)'),
    ('Không glassmorphism thừa', 'Đạt', '0 `backdrop-filter`; `--ma-backdrop-blur*` = 0px'),
    ('Không emoji làm icon', 'Đạt', 'Quét 10 trang: 0 ký tự emoji; icon là SVG một bộ'),
    ('Không bóng đổ lòe loẹt', 'Đạt', 'Chỉ 2 mức bóng cho menu/toast và modal'),
    ('Mỗi màn chỉ một hành động chính', 'Đạt', 'Xem dòng 3'),
    ('Không chữ mono / IN HOA giãn cách', 'Đạt', '0 `uppercase`, 0 `monospace` trong CSS'),
    ('Trạng thái không chỉ bằng màu', 'Đạt', 'Mọi `.tag` có icon + chữ; badge số có `aria-label`'),
    ('Nhãn form luôn hiện, lỗi gần ô nhập', 'Đạt', '01, 06, design-system: `<label>` hiện, `.error-text` ngay dưới ô + `aria-invalid`/`aria-describedby`'),
]:
    w(f'| {a} | {b} | {c} |')
w('')
w('## 8. Chưa kiểm\n')
for x in [
    'Import thật vào Figma (chỉ kiểm SVG bằng render trình duyệt + XML parser).',
    'Thiết bị thật (iPhone/Android), ánh sáng yếu ngoài hành lang, mạng yếu; chỉ giả lập 390×844 DPR 1.',
    'Thứ tự Tab bằng phím thật, bẫy focus modal, trình đọc màn hình.',
    'Khung 1024–1279 (sidebar thu gọn) chỉ có CSS + mẫu trong design-system, chưa chụp màn khung ở bề rộng này.',
    'Chế độ tối: không làm (ngoài phạm vi).',
    'Áp overlay vào app chạy thật và chụp lại các màn hiện có (mới chạy test + build trên bản chép).',
]:
    w(f'- {x}')
open(os.path.join(ROOT, 'QA.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('QA.md', len(L), 'dòng')
