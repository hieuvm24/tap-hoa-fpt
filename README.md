# Tạp Hóa FPT - E-commerce Website

Next.js 15 · Prisma · SQLite (local) / PostgreSQL (Vercel) · Cloudinary

## Chạy local

```bash
npm install
npm run db:sqlite
npm run dev
```

- Web: http://localhost:3000  
- Admin: http://localhost:3000/admin  

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Khách | khach@demo.com | 123456 |
| Chủ shop | chu@demo.com | 123456 |
| Nhân viên | nhanvien@demo.com | 123456 |

Voucher: `ANPHU10`

## Deploy Vercel (Postgres + Cloudinary)

Xem chi tiết: **[DEPLOY.md](./DEPLOY.md)**

Tóm tắt: tạo Neon + Cloudinary → đẩy GitHub → Import Vercel → điền env → seed Neon → xong.

## Tech stack

- Next.js 15 App Router, React 19, TypeScript, Tailwind
- Prisma ORM — **SQLite local**, **Postgres trên Vercel**
- Upload: local `public/uploads` / **Cloudinary** khi deploy
- JWT auth, gợi ý sản phẩm, chat hỗ trợ khách, VNPay

## Scripts

| Lệnh | Việc |
|------|------|
| `npm run db:sqlite` | Dùng SQLite (local) |
| `npm run db:postgres` | Dùng Postgres (Neon) |
| `npm run db:setup` | `db push` + seed |
| `npm run build` | Build kiểu Vercel (Postgres) |
