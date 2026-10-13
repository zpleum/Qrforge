# QRForge

QR code แบบ dynamic: แต่งได้ทุกอย่าง ใส่โลโก้ได้ แก้ลิงก์ปลายทางได้ตลอดชีพ พร้อมสถิติการสแกนละเอียด
Next.js 16 (App Router) · Tailwind CSS 4 · Auth.js (Google) · Neon Postgres + Drizzle · Vercel · UI ภาษาไทย

## หลักการทำงาน
- QR เก็บ `https://โดเมนของคุณ/r/<slug>` ไม่ใช่ URL ปลายทางตรง ๆ
- `GET /r/<slug>` ตอบ 307 redirect แล้วบันทึกการสแกนใน `after()` (หลังตอบผู้ใช้ไปแล้ว)
- แก้ปลายทาง/ดีไซน์/หยุด-เปิดใช้งานได้ตลอด แต่ `slug` แก้ไม่ได้ (พิมพ์อยู่ใน QR แล้ว)
- ดีไซน์เก็บเป็น JSON แล้วเรนเดอร์ฝั่ง client ด้วย `qr-code-styling` (ส่งออก PNG/SVG/WebP/JPEG)

## ตั้งค่า
1. `npm install`
2. สร้างฐานข้อมูล Neon (Vercel > Storage) แล้วคัดลอก `DATABASE_URL`
3. Google Cloud Console > Credentials > OAuth client (Web) ใส่ redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://โดเมนของคุณ/api/auth/callback/google`
4. `cp .env.example .env.local` แล้วกรอกให้ครบ (`npx auth secret` สร้าง AUTH_SECRET)
5. `npm run db:push` สร้างตาราง (ทุกครั้งที่ schema เปลี่ยนให้รันซ้ำ)
6. `npm run dev`

## Deploy บน Vercel
Push ขึ้น GitHub > Import ใน Vercel > ใส่ env เดียวกัน > Deploy
- ตั้ง `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง **ก่อนพิมพ์ QR**
- ตั้ง `CRON_SECRET` ใน Vercel (cron ใน `vercel.json` ทำงานทุกวัน 03:00 เวลาไทย)
- ประเทศ/เมืองมาจาก header `x-vercel-ip-*` จึงมีเฉพาะตอนรันบน Vercel

## ความปลอดภัยที่ทำไว้แล้ว
- Google login เท่านั้น บังคับ email verified, session JWT 7 วันใน cookie httpOnly + Secure
- ตรวจ session/ความเป็นเจ้าของซ้ำทุกชั้น (proxy, page, route, server action) และทุก query ผูก `user_id`
- Zod validate ฝั่ง server ทั้งหมด, ปลายทางรับแค่ http/https ห้าม localhost/IP/วนลูป
- โลโก้รับ PNG/JPG/WebP เท่านั้น (ไม่รับ SVG), CSP + security headers, CSV กัน formula injection
- **Rate limit** ในฐานข้อมูล: บันทึก QR 30 ครั้ง/นาที/ผู้ใช้, รายงานลิงก์ 5 ครั้ง/ชม./คน (+ honeypot)
- **Web Risk**: ตรวจ URL ตอนบันทึก และตรวจซ้ำแบบสุ่ม 200 อันทุกคืน ถ้าพบฟิชชิง/มัลแวร์จะหยุด QR ให้อัตโนมัติ
- **รายงาน/takedown**: หน้า `/report` สาธารณะ, ผู้รายงานต่างกัน ≥ 3 คน (ฟิชชิง/มัลแวร์) จะหยุด QR อัตโนมัติ, ผู้ดูแลดู/ตัดสินที่ `/admin/reports` (เฉพาะอีเมลใน `ADMIN_EMAILS`)
- **Cache** slug → ปลายทาง 15 วินาทีต่อ instance (หยุด QR มีผลช้าสุดราว 15 วินาที)
- **Data retention**: cron ลบข้อมูลสแกนเกิน `RETENTION_DAYS` (ค่าเริ่มต้น 365)
- **ลบบัญชี** (สิทธิ์ตาม PDPA/GDPR) ที่หน้า `/dashboard/account` ลบ QR และสแกนทั้งหมดแบบ cascade

## ความเป็นส่วนตัวและกฎหมาย (ไม่ใช่คำแนะนำทางกฎหมาย)
- ไม่เก็บ IP และ user-agent ดิบ ใช้ hash ผสม salt ที่เปลี่ยนทุกวัน, `Sec-GPC`/`DNT` ไม่สร้าง hash
- บอทถูกแยก (`is_bot`) และไม่นับในกราฟ, ไม่ใช้คุกกี้ติดตามผู้สแกน จึงไม่ต้องมีแบนเนอร์คุกกี้สำหรับส่วนนี้
- แก้ `/privacy` (ใส่อีเมลติดต่อ/ข้อมูลผู้ควบคุมข้อมูล) แล้วให้ผู้เชี่ยวชาญตรวจก่อนเปิดใช้จริง

## ต้องทำเองบน Vercel (โค้ดทำให้ไม่ได้)
- **Rate limit ที่ `/r/*`**: Vercel Dashboard > Firewall > Rules > เพิ่ม Rate Limit (เช่น 120 request/นาที/IP) กันคนยิงถล่ม
- เปิดใช้ Web Risk API ใน Google Cloud แล้วใส่ `WEB_RISK_API_KEY` (เช็กราคา/โควตาปัจจุบันก่อน)
