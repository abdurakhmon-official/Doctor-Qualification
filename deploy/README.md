# VPS'ga deploy qilish (bitta server, Docker)

Bitta serverda hammasi ishlaydi: Postgres, Redis, API, sayt va **Caddy**. Caddy HTTPS sertifikatni o'zi oladi va yangilaydi.
Internetga faqat 80/443 portlar ochiq, qolgan hammasi serverning ichki tarmog'ida.

## 1. Kerakli narsalar

| Nima | Tavsiya |
|---|---|
| VPS | Ubuntu 24.04, **2 vCPU, 2 GB RAM**, 20+ GB disk |
| Domen | Masalan `doctor.uz` (sayt) va `api.doctor.uz` (API) |
| Kompyuteringizda | SSH (Windows'da PowerShell'ning o'zida bor) |

## 2. DNS

Domen panelida ikkita **A record** yarating. Ikkalasi ham serverning IP manziliga qarasin:

| Host | Qiymat |
|---|---|
| `doctor.uz` (yoki `@`) | `SERVER_IP` |
| `api.doctor.uz` (yoki `api`) | `SERVER_IP` |

DNS tarqalishi 5 daqiqadan bir necha soatgacha davom etadi. Tekshirish: `ping api.doctor.uz` serveringiz IP'sini ko'rsatishi kerak.
**DNS tayyor bo'lmaguncha 6-qadamni boshlamang** — aks holda HTTPS sertifikat olinmaydi.

## 3. Serverni tayyorlash (bir marta)

```bash
ssh root@SERVER_IP

# yangilanishlar va Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh

# firewall: faqat SSH va veb
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
ufw --force enable

# 2 GB swap: build paytida xotira yetmay qolmasligi uchun
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 4. Loyihani yuklab olish

```bash
cd /opt
git clone https://github.com/abdurakhmon-official/Doctor-Qualification.git
cd Doctor-Qualification
```

Repo **private** bo'lsa, GitHub → Settings → Developer settings → **Personal access token** (faqat o'qish huquqi) yarating.
Parol so'ralganda o'sha tokenni kiriting.

## 5. `.env` sozlash

```bash
cp deploy/env.production.sample .env

# maxfiy qiymatlarni yaratish - chiqqan natijalarni .env ga qo'ying
openssl rand -hex 24   # POSTGRES_PASSWORD uchun
openssl rand -hex 48   # JWT_SECRET uchun

nano .env              # saqlash: Ctrl+O, Enter; chiqish: Ctrl+X
```

Albatta to'ldiring:
- `WEB_DOMAIN`, `API_DOMAIN`, `ACME_EMAIL`;
- `WEB_URL`, `CORS_ORIGIN`, `PUBLIC_URL`, `NEXT_PUBLIC_API_URL` — domenlarga mos, `https://` bilan;
- `POSTGRES_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

Ixtiyoriy: `ANTHROPIC_API_KEY` (AI ustoz), `MAIL_*` (xat yuborish).

> `POSTGRES_PASSWORD` ni birinchi ishga tushirishdan keyin o'zgartirmang — baza eski parolni eslab qoladi.

## 6. Ishga tushirish

```bash
sh deploy/deploy.sh
```

Birinchi build 5–10 daqiqa oladi. Server ishga tushganda:
- migratsiyalar o'zi qo'llanadi;
- admin hisobi va mutaxassisliklar yaratiladi.

Tekshirish:
- `https://api.doctor.uz/api/v1/health` → `{"success":true...}`
- `https://doctor.uz` → sayt ochiladi, `SEED_ADMIN_EMAIL` bilan kiring.

## 7. Yangi versiyani chiqarish

Kompyuteringizda o'zgarishlarni `master` ga push qiling, keyin serverda:

```bash
cd /opt/Doctor-Qualification && sh deploy/deploy.sh
```

Yangi migratsiyalar avtomatik qo'llanadi. Sayt bir-ikki daqiqa qayta ishga tushadi.

## 8. Zaxira nusxalar (backup)

- Har kuni bazaning nusxasi `backups/` papkasiga yoziladi va **14 kun** saqlanadi (`BACKUP_KEEP_DAYS`).
- **Muhim:** nusxalar shu serverda turadi. Server diski buzilsa, ular ham yo'qoladi. Vaqti-vaqti bilan o'z kompyuteringizga ko'chirib oling:

```powershell
scp root@SERVER_IP:/opt/Doctor-Qualification/backups/db-*.sql.gz D:\backups\
```

Nusxadan tiklash (bazadagi **hamma** ma'lumot almashtiriladi):

```bash
ls backups/
sh deploy/restore.sh backups/db-2026-10-20-0300.sql.gz
```

Yuklangan fayllar (avatarlar, savol rasmlari) `api_storage` Docker volume'ida turadi. Uning nusxasini olish:

```bash
docker run --rm -v doctor-qualification_api_storage:/data -v "$PWD/backups":/out alpine tar czf /out/storage-$(date +%F).tar.gz -C /data .
```

## 9. Foydali buyruqlar

```bash
C="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

$C ps                    # holat
$C logs -f api           # API loglari (Ctrl+C - chiqish)
$C logs -f caddy         # HTTPS / sertifikat muammolari
$C restart api           # API'ni qayta ishga tushirish
```

## 10. Muammo bo'lsa

| Belgi | Sabab va yechim |
|---|---|
| Brauzerda sertifikat xatosi | DNS hali serverga qaramayapti. `ping` bilan tekshiring, keyin `$C restart caddy` |
| `502 Bad Gateway` | API hali ishga tushmoqda yoki yiqilgan: `$C logs api` |
| API loglarida `[config] ERROR` | `.env` dagi biror qiymat xavfli yoki bo'sh (log qaysi biri ekanini aytadi) |
| Build "Killed" bilan to'xtadi | Xotira yetmadi: 3-qadamdagi swap qo'shilganini tekshiring |
| Sayt API'ga ulanmaydi | `NEXT_PUBLIC_API_URL` noto'g'ri. Uni tuzatgach, `sh deploy/deploy.sh` (sayt qayta build bo'ladi) |
