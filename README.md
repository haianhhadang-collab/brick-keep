# Brick Keep – Word Defenders (Giữ thành bằng từ tiếng Anh)

Game thủ thành theo làn (cùng thể loại Plants vs Zombies) cho trẻ học từ vựng tiếng Anh. Muốn làm gì cũng phải tìm được từ tiếng Anh ẩn trên bảng chữ: mỗi từ tìm được cho thêm gạch, gạch dùng để đặt quân.

Nhân vật là tượng khối gạch tự vẽ bằng canvas: người đầu trụ có núm, tay chữ C. Cảnh 2,5D nhiều lớp, mượn không khí cổ tích của Trine 4 (thông xoắn, nắng xiên, rừng nấm phát sáng). Không dùng tên hay logo LEGO, không chép nhân vật hay quái của game gốc.

## Chơi ngay

- Bản web: https://haianhhadang-collab.github.io/brick-keep/
- Tải APK Android: https://github.com/haianhhadang-collab/brick-keep/releases/latest

## Chạy thử

```
node brick-keep/serve.js      → http://localhost:5200
```

Hoặc mở `www/index.html` (chơi 1 người chạy được khi mở tệp trực tiếp; chơi 2 máy cần mạng Internet).

## Cách chơi

- **Bảng chữ** (bên phải): kéo ngón tay qua các chữ theo đường thẳng (ngang, dọc, chéo) để chọn từ. Cũng có thể chạm chữ đầu rồi chạm chữ cuối. Gợi ý cho mỗi từ gồm hình, nghĩa tiếng Việt và số chữ cái.
- Bảng to dần và khó dần theo màn (`D.BOARD_TIERS` trong `data.js`):

  | Màn | Bảng | Số từ ẩn | Độ dài từ |
  |---|---|---|---|
  | 1–2 | 6×6 | 5 | 3–4 chữ |
  | 3–5 | 6×6 | 6 | 3–5 |
  | 6–8 | 7×7 | 6 | 3–5 |
  | 9–10 | 7×7 | 7 | 4–6 |
  | 11–13 | 8×8 | 7 | 4–6 |
  | 14–15 | 8×8 | 8 | 4–7 |
  | 16–18 | 9×9 | 8 | 4–8 |
  | 19–20 | 9×9 | 9 | 5–9 |

  Màn hình hẹp (điện thoại xoay ngang) thì bảng tự thu nhỏ để mỗi ô còn khoảng 30 px, tối thiểu 6×6. Chủ đề thiếu từ đúng độ dài thì nới độ dài, vẫn thiếu mới mượn từ chủ đề khác. Đối kháng dùng bảng của màn 6.
- Mỗi chữ cái có điểm ở góc. Gạch nhận được = 30 + 5 × tổng điểm chữ + 5 cho mỗi chữ quá 4 chữ (ví dụ `dog` = 55, `chicken` = 115). Tìm đúng thì game đọc to từ đó.
- Mỗi bảng có một **từ phép thuật** ✦. Phe Hiệp sĩ tìm được thì có Mưa sao băng (mọi quái mất 160 máu); phe Bóng đêm thì gọi thêm 3 quỷ con.
- Tìm hết từ thì bảng tự đổi. Nút 💡 soi sáng chữ đầu của một từ (hồi 12 giây); nút ↻ đổi bảng mới (hồi 20 giây).
- **Sân 5 làn × 9 ô**: chọn thẻ quân, rồi chạm vào ô cỏ để đặt. 🔨 dùng để gỡ quân. Phím 1–8 chọn thẻ, Esc bỏ chọn.
- Quái đi từ bên phải sang. Cuối mỗi làn có một đá bùa: lần đầu quái chạm tới, đá bùa quét sạch làn đó. Đá bùa đã dùng mà quái vẫn lọt vào thì thua.

## Chế độ

| Chế độ | Mô tả |
|---|---|
| Phiêu lưu | 1 người đấu các đợt quái cố định. 4 thế giới × 5 màn = 20 màn; màn cuối mỗi thế giới có trùm Vua Bóng Đêm. Qua màn thì mở thêm quân mới. |
| Cùng phe | 2 người, mỗi người một máy, cùng giữ một lâu đài trước đợt quái của máy (quái nhiều hơn 1,6 lần). Mỗi người có bảng chữ và túi gạch riêng; tấm đế dưới chân quân có màu của người đặt. |
| Đối kháng | 2 người, 2 máy: một bên Hiệp sĩ đặt quân, một bên Bóng đêm thả quái vào làn tùy chọn. Cả hai phải tìm từ để có gạch. Hiệp sĩ giữ được 3 phút là thắng; quái lọt vào lâu đài là Bóng đêm thắng. |

Chơi 2 máy: một máy bấm **Tạo phòng** để nhận mã 4 chữ, máy kia chọn đúng chế độ rồi nhập mã. Kết nối qua PeerJS/WebRTC (cần Internet). Máy tạo phòng chạy trận và gửi trạng thái 12 lần/giây; máy kia chỉ gửi thao tác.

## Nhân vật

**Phe Hiệp sĩ** (mở dần theo màn): Cung thủ 100 · Hiền giả đèn lồng 50 (mỗi 16 giây cho +25 gạch và soi chữ gợi ý) · Hiệp sĩ khiên 50 (tường) · Thợ mìn lùn 150 (nổ ô 3×3) · Pháp sư băng 175 (làm chậm) · Nỏ đôi 200 · Phù thủy lửa 225 (nổ lan) · Pháo gạch 300 (ném qua đầu, nổ lan).

**Phe Bóng đêm**: Quỷ con · Quỷ đội nồi sắt · Kỵ sĩ chó sói (nhảy qua quân đầu tiên) · Quỷ vác cửa · Ma trơi (bay xuyên qua quân) · Quỷ khổng lồ · Vua Bóng Đêm (trùm, gọi thêm quỷ con).

**Thế giới**: Đồng cỏ nắng · Rừng nấm phát sáng · Phế tích lá vàng · Lâu đài trăng.

## Tệp

- `www/index.html`, `style.css`: màn hình và giao diện (khung xanh đêm viền vàng; ô chữ theo ảnh mẫu của người dùng).
- `www/words.js`: bộ từ chung với Word Runners (22 chủ đề, 277 từ), không sửa ở đây.
- `www/words-extra.js`: từ bổ sung riêng cho Brick Keep (khoảng 330 từ, mỗi từ có hình và nghĩa); nạp xong cả hai thì có 605 từ.
- `www/data.js`: thông số quân, quái, thế giới, bộ sinh đợt quái theo số màn, điểm chữ cái.
- `www/board.js`: sinh bảng chữ ẩn từ, kéo chọn, gợi ý.
- `www/sim.js`: mô phỏng trận (đạn, va chạm, đá bùa, kết quả), xuất trạng thái gọn để vẽ và gửi qua mạng.
- `www/art.js`: vẽ cảnh 2,5D (nền dựng sẵn một lần) và nhân vật khối gạch.
- `www/render.js`: vẽ trận, nội suy vị trí, hạt hiệu ứng (mảnh gạch, sao, khói, lửa, băng), rung màn hình.
- `www/audio.js`: âm thanh WebAudio tự tổng hợp, nhạc nền 3 bài tự sinh, đọc to (Web Speech hoặc `AndroidTTS`).
- `www/main.js`: menu, bản đồ màn, sổ tay, cài đặt, vòng lặp game, chơi 2 máy.
- `www/lib/peerjs.min.js`: thư viện PeerJS (chép từ Word Arena).

Tiến trình lưu trong `localStorage` (khóa `brickkeep-v1`).

## Android

- `android/`: vỏ WebView (package `vn.edu.brickkeep`, minSdk 26), game phục vụ qua `https://appassets.androidplatform.net/www/` để WebRTC chạy được; đọc to bằng `AndroidTTS`; nút Quay lại gọi `window.__back`.
- Build: `powershell -File brick-keep/build-apk.ps1` → `BrickKeep.apk` ở thư mục gốc dự án (dùng ổ ảo G/H/I/J vì đường dẫn có dấu).
- CSS có phần dự phòng cho WebView đời cũ (Chrome 83 trên Android 11).

## GitHub

- Repo: https://github.com/haianhhadang-collab/brick-keep (nhánh `main`).
- GitHub Actions: mỗi lần đẩy lên `main` thì tự build APK (tải ở mục Artifacts của lượt chạy) và tự cập nhật bản web trên GitHub Pages.
- APK do Actions build ký bằng khóa debug của máy chủ GitHub, khác khóa ở máy nhà, nên không cài đè được lên bản đã cài từ Releases; chỉ dùng để thử. Bản phát hành (Releases) đính APK build ở máy nhà: `gh release create vX.Y BrickKeep.apk`.
