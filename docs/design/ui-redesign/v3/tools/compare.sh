#!/bin/bash
# Ghép ảnh app hiện tại (evidence-app) cạnh ảnh V3 (screens/png), cùng màn hình đầu. Chạy từ thư mục v3. Cần ImageMagick.
set -e; mkdir -p compare; F="/System/Library/Fonts/Supplemental/Arial Bold.ttf"; T=$(mktemp -d)
lab(){ magick -size $1x44 xc:"$2" -font "$F" -pointsize 20 -fill white -gravity west -annotate +16+0 "$3" $T/lab-$4.png; }
d(){ lab 1440 '#8a1f17' "HIỆN TẠI · $4" a; lab 1440 '#14181d' "V3 · $5" b; magick screens/png/$3.png -crop 1440x900+0+0 +repage $T/n.png; magick $T/lab-a.png evidence-app/$2.png $T/lab-b.png $T/n.png -append compare/$1.png; }
m(){ lab 390 '#8a1f17' "HIỆN TẠI" a; lab 390 '#14181d' "V3" b; magick screens/png/$3.png -crop 780x1688+0+0 +repage -resize 390x844 $T/n.png; magick $T/lab-a.png evidence-app/$2.png -append $T/l.png; magick $T/lab-b.png $T/n.png -append $T/r.png; magick $T/l.png \( -size 24x888 xc:'#9aa3ad' \) $T/r.png +append compare/$1.png; }
d 01-chu-hom-nay-1440 chu-hom-nay-1440 01-chu-hom-nay-1440 "Chủ nhà mở app" "Chủ nhà mở app"
d 02-chu-thu-tien-1440 chu-thu-tien-1440 02-chu-tien-1440 "Thu tiền" "Tiền"
d 03-chu-ho-so-nguoi-thue-1440 chu-nguoi-thue-1-1440 03-chu-nguoi-1-1440 "Hồ sơ người thuê" "Hồ sơ người thuê"
d 04-ql-chu-ky-thang-1440 ql-chu-ky-1440 14-ql-thang-1-1440 "Chu kỳ tháng" "Tháng 11, bước 1"
d 05-chu-su-co-1440 chu-su-co-1440 09-chu-su-co-4-1440 "Sự cố" "Sự cố, duyệt báo giá"
d 06-ql-tao-hop-dong-1440 ql-tao-hop-dong-1440 20-ql-hop-dong-moi-1440 "Tạo hợp đồng" "Tạo hợp đồng"
m 07-kh-can-tra-390 kh-can-tra-390 21-kh-can-tra-390
m 08-kh-tra-tien-390 kh-tra-tien-390 22-kh-tra-tien-390
m 09-tho-viec-390 tho-viec-390 26-tho-viec-390
m 10-chu-hom-nay-390 chu-hom-nay-390 01-chu-hom-nay-390
rm -rf $T; ls compare | wc -l
