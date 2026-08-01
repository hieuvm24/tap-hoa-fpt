# Hướng dẫn deploy chi tiết — Tạp Hóa FPT

Làm **theo thứ tự** từ Bước 1 → Bước 6.  
Ước lượng: 30–60 phút (nếu đã có GitHub).

---

## Tổng quan

| | Máy bạn (local) | Internet (Vercel) |
|--|-----------------|-------------------|
| Database | SQLite file `prisma/dev.db` | **Neon** (Postgres) |
| Ảnh upload | thư mục `public/uploads` | **Cloudinary** |
| Hosting web | `npm run dev` | **Vercel** |

Bạn cần tạo **3 tài khoản miễn phí**: Neon, Cloudinary, Vercel (+ GitHub nếu chưa có).

---

## Bước 0 — Kiểm tra local vẫn chạy

Mở terminal trong thư mục project:

```bash
npm run db:sqlite
npm run dev
```

Vào http://localhost:3000 — thấy trang chủ là OK.  
Tắt `Ctrl+C` khi xong.

---

## Bước 1 — Tạo database Neon (Postgres)

1. Mở trình duyệt: https://neon.tech  
2. **Sign up** bằng GitHub (hoặc email).  
3. Bấm **Create a project**:
   - Project name: `taphoa-fpt` (tuỳ tên)
   - Region: chọn gần (Singapore / gần nhất)
4. Vào project → mục **Connection details** / **Dashboard**  
5. Copy **Connection string** dạng:

```text
postgresql://neondb_owner:xxxxx@ep-xxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> Chọn loại **URI** / connection string.  
> Nên dùng chuỗi có `sslmode=require`.

6. **Dán tạm vào Notepad** — sẽ dùng ở Bước 4 và Bước 5.

---

## Bước 2 — Tạo Cloudinary (lưu ảnh)

1. Mở: https://cloudinary.com → **Sign up** (miễn phí).  
2. Sau khi vào **Dashboard**, ghi lại 3 giá trị:
   - **Cloud name**
   - **API Key**
   - **API Secret** (bấm mắt/view để hiện)

3. Dán tạm vào Notepad (cùng chỗ với Neon).

---

## Bước 3 — Đưa code lên GitHub

### 3.1. Nếu chưa có GitHub
- Đăng ký: https://github.com/signup  
- Cài Git (nếu chưa): https://git-scm.com/download/win  

### 3.2. Tạo repository trống
1. GitHub → **New repository**  
2. Name: `taphoa-fpt` (tuỳ)  
3. **Public**  
4. **Không** tích README / .gitignore (repo trống)  
5. Create repository → copy URL dạng `https://github.com/TEN-BAN/taphoa-fpt.git`

### 3.3. Đẩy code từ máy

Mở terminal trong thư mục `ĐATN`:

```bash
git init
git add .
git commit -m "Deploy ready: Tạp Hóa FPT"
git branch -M main
git remote add origin https://github.com/TEN-BAN/taphoa-fpt.git
git push -u origin main
```

> Đổi `TEN-BAN/taphoa-fpt` đúng repo của bạn.  
> Nếu GitHub hỏi đăng nhập: dùng Personal Access Token (Settings → Developer settings → Tokens).

**Quan trọng:** file `.env` **không** được đẩy lên GitHub (đã có trong `.gitignore`).

Kiểm tra trên GitHub: thấy code, **không** thấy `.env`.

---

## Bước 4 — Deploy trên Vercel

1. Mở: https://vercel.com → **Sign up** bằng **GitHub**.  
2. **Add New…** → **Project** → chọn repo `taphoa-fpt` → **Import**.  
3. Trước khi Deploy, mở **Environment Variables** và thêm từng dòng:

| Name | Value | Ghi chú |
|------|--------|---------|
| `DATABASE_URL` | Chuỗi Neon ở Bước 1 | Dán nguyên |
| `JWT_SECRET` | ví dụ `taphoa-fpt-secret-2026-doi-chuoi-nay` | Tự đặt, dài, bí mật |
| `NEXT_PUBLIC_APP_URL` | `https://tam.vercel.app` | Tạm, sửa sau |
| `CLOUDINARY_CLOUD_NAME` | Cloud name Bước 2 | |
| `CLOUDINARY_API_KEY` | API Key Bước 2 | |
| `CLOUDINARY_API_SECRET` | API Secret Bước 2 | |
| `RESEND_API_KEY` | Key từ [resend.com](https://resend.com) | Quên MK + mã xác nhận đăng ký |
| `MAIL_FROM` | VD `Tạp Hóa FPT <onboarding@resend.dev>` | Tuỳ chọn |
| `GOOGLE_CLIENT_ID` | Google Cloud → OAuth Web Client | Đăng nhập Google |
| `GOOGLE_CLIENT_SECRET` | Cùng client | |
| `FACEBOOK_APP_ID` | Meta Developers → App ID | Đăng nhập Facebook |
| `FACEBOOK_APP_SECRET` | App Secret | |

Hoặc thay Resend bằng SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

**Redirect URI bắt buộc** (điền đúng URL Vercel):

- Google: `https://YOUR.vercel.app/api/auth/oauth/google/callback`
- Facebook: `https://YOUR.vercel.app/api/auth/oauth/facebook/callback`

Chọn môi trường: tích **Production**, **Preview**, **Development** (hoặc ít nhất Production).

4. Bấm **Deploy** → chờ 2–5 phút.  
5. Khi xong, Vercel cho URL dạng:

```text
https://taphoa-fpt-xxxx.vercel.app
```

**Copy URL này.**

6. Vercel → Project → **Settings** → **Environment Variables**  
   → sửa `NEXT_PUBLIC_APP_URL` = URL thật vừa copy  
   → **Deployments** → bản mới nhất → **Redeploy** (không cần cache cũng được).

Lúc này web đã lên, nhưng database Neon **có thể còn trống** → làm Bước 5.

---

## Bước 5 — Seed dữ liệu vào Neon (một lần)

Trên **máy bạn**, mở file `.env` (trong project), **tạm** đổi:

```env
DATABASE_URL="dán-chuỗi-neon-vào-đây"
```

(Các dòng Cloudinary cũng nên điền giống Vercel.)

Rồi chạy lần lượt:

```bash
npm run db:postgres
npx prisma db push
npm run db:seed
```

Thấy log seed thành công (demo accounts) là OK.

**Trả local về SQLite** (quan trọng):

```bash
npm run db:sqlite
```

Trong `.env`, đổi lại:

```env
DATABASE_URL="file:./dev.db"
```

Giờ:
- Local vẫn dùng data máy bạn  
- Vercel dùng data trên Neon (đã seed)

Refresh URL Vercel → thấy sản phẩm / đăng nhập được.

### Tài khoản demo trên web deploy

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Khách | `khach@demo.com` | `123456` |
| Chủ shop | `chu@demo.com` | `123456` |
| Nhân viên | `nhanvien@demo.com` | `123456` |

---

## Bước 6 — Kiểm tra sau deploy

1. Mở URL Vercel → trang chủ load được  
2. Đăng nhập `chu@demo.com` / `123456` → vào `/admin`  
3. Thêm / sửa sản phẩm → **Chọn ảnh từ máy** → lưu (ảnh lên Cloudinary)  
4. Đăng xuất → đăng ký / mua thử (tuỳ)  

Nếu lỗi:
- **Build fail:** xem log Vercel → thiếu env hoặc `DATABASE_URL` sai  
- **Trang trắng / không có SP:** chưa seed Neon (Bước 5)  
- **Upload ảnh lỗi:** thiếu / sai `CLOUDINARY_*`  
- **Login không vào admin:** seed chưa chạy hoặc JWT_SECRET khác giữa các lần (ít gặp)

---

## Checklist nhanh

- [ ] Bước 1: Neon — đã copy connection string  
- [ ] Bước 2: Cloudinary — đủ 3 key  
- [ ] Bước 3: Code đã trên GitHub  
- [ ] Bước 4: Vercel deploy OK + sửa `NEXT_PUBLIC_APP_URL`  
- [ ] Bước 5: Seed Neon + trả về `db:sqlite`  
- [ ] Bước 6: Vào web, login admin, upload ảnh thử  

---

## Lệnh hay dùng sau này

```bash
npm run db:sqlite       # về SQLite local
npm run db:postgres     # sang Postgres (khi DATABASE_URL = Neon)
npm run db:setup        # push + seed (đúng DB đang trỏ trong .env)
npm run check           # kiểm tra cấu hình local
npm run dev             # chạy local
```

---

## Không làm các việc này

- Không commit file `.env` lên GitHub  
- Không để `JWT_SECRET` quá ngắn / công khai  
- Không quên đổi `NEXT_PUBLIC_APP_URL` sau khi có domain Vercel  
- Không để `.env` local mãi là Neon nếu muốn tiếp tục dùng data SQLite cũ trên máy  

Hết Bước 6 là web đã public trên internet.
