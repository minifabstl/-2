# LeakedFap — Video/Foto Paylaşım Platformu

Next.js + Cloudflare (D1 veritabanı + R2 medya deposu) ile kurulmuş, video ve
fotoğraf paylaşım/kazanç platformu. Beyaz/açık tema, Türkçe arayüz.

Canlı adres: **leakedfap.org**

## ⚠️ Bu paketin durumu (nerede kaldık)

Proje çalışır durumda ve yayında. Şu an:

**Tamamlanan:**
- Veritabanı şeması + ilk migration (`drizzle/0000_*.sql`)
- Kayıt / giriş / çıkış (şifreler PBKDF2 ile hash'lenir, asla düz metin saklanmaz)
- Ana akış: üye olmadan izleme, giriş yapanlar için beğeni + yorum
- Görüntülenme sayacı, kategori filtreleme (Keşfet sayfası)
- Yeni içerik yükleme (`/upload`) — Cloudflare R2'ye kaydeder, **admin onayı bekler** (aşağıya bakınız)
- Fotoğraf/video kartına tıklayınca tam ekran büyüteç (lightbox) görünümü
- Profil & Kazanç sayfası: 0,20$/1000 izlenme hesaplama, Bitcoin cüzdan adresi, ödeme talebi
- Yönetici paneli: Genel Bakış (bekleyen içerik sayısı ve uyarı bandı), Kullanıcılar (askıya alma,
  **şifresiz** güvenli sıfırlama akışı), İçerikler (moderasyon — onayla / reddet / yayından kaldır / geri yükle),
  Ödemeler (bekleyen BTC ödeme kuyruğu, "ödendi" işaretleme)
- **İçerik onay sistemi**: kullanıcı bir video/fotoğraf yüklediğinde içerik doğrudan yayına girmez,
  `pending` (onay bekliyor) durumunda kalır — herkese açık akışta (Ana Sayfa, Keşfet) görünmez.
  Admin, **İçerikler** sayfasında "Onayla" derse `live` olur ve akışta görünmeye başlar; "Reddet"
  derse `removed` olur. Kullanıcı kendi profilinde yüklediği içeriğin durumunu ("Onay Bekliyor" rozeti)
  görebilir. Admin sidebar'ında ve Genel Bakış'ta bekleyen içerik sayısı rozet olarak gösterilir.
- Şifre sıfırlama: admin tetikler → kullanıcıya e-posta ile tek kullanımlık link gider → kullanıcı kendi yeni şifresini belirler
- Marka: LeakedFap adı ve özel "Lf" logosu (sidebar, admin paneli, giriş ekranı, favicon)

**Henüz eksik (isteğe bağlı, gelecekte eklenebilir):**
- Gerçek e-posta gönderimi (şu an sadece konsola yazıyor, bkz. `lib/email.ts` — Resend API key eklenince otomatik gerçek gönterime geçer)
- Gerçek otomatik Bitcoin transferi (şu an sadece "ödeme talebi" kaydı oluşturuyor, admin manuel gönderip "ödendi" işaretliyor — bkz. aşağıdaki "Bitcoin ödemeleri" bölümü)
- Görüntülenme sayacı için hız sınırlama (bkz. Güvenlik notları)

`npx tsc --noEmit` ve `npm run build` hatasız geçiyor, yani mevcut kod derleniyor.

## Teknoloji

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Cloudflare D1** (SQLite) — veritabanı, Drizzle ORM ile
- **Cloudflare R2** — video/fotoğraf depolama
- **@opennextjs/cloudflare** — Next.js'i Cloudflare Pages/Workers'a deploy eden adaptör
- Şifreler: Web Crypto PBKDF2-SHA256 (100.000 iterasyon) — bcrypt değil, çünkü Workers ortamında native bcrypt çalışmıyor; PBKDF2 Workers'ta da Node'da da native destekli ve güvenli.

## Kurulum (yerel geliştirme)

```bash
npm install

# Cloudflare hesabına giriş yap
npx wrangler login

# D1 veritabanı ve R2 bucket oluştur
npx wrangler d1 create video-app-db
npx wrangler r2 bucket create video-app-media
```

`wrangler d1 create` komutunun çıktısındaki `database_id` değerini
`wrangler.toml` dosyasındaki `REPLACE_WITH_YOUR_D1_DATABASE_ID` yerine yapıştır.

```bash
# Migration'ı veritabanına uygula (yerel test veritabanı için)
npx wrangler d1 migrations apply video-app-db --local

# Geliştirme sunucusunu başlat
npm run dev
```

`http://localhost:3000` adresini aç.

İlk yönetici hesabını oluşturmak için `scripts/make-admin.sql.md` dosyasına bak.

## Cloudflare Workers'a deploy (leakedfap.org üzerinde canlı)

Bu proje bir Cloudflare **Workers** projesi olarak (`wrangler deploy`) yayınlanır,
Pages değil. `package.json`'daki script'ler:

```bash
# Üretim veritabanına migration'ı uygula (sadece ilk kurulumda / şema değiştiğinde)
npx wrangler d1 migrations apply video-app-db --remote

# Build (next build) + Cloudflare paketleme (opennextjs-cloudflare) + deploy
npm run deploy
```

`npm run deploy` üç adımı sırayla yapar: `next build` (script: `build`),
`opennextjs-cloudflare build` (script: `cf-build`), `wrangler deploy`.
Bunları tek tek de çalıştırabilirsin.

Alan adı zaten Cloudflare üzerinde yönetildiği için (**Workers & Pages → proje "2" → Domains**)
`leakedfap.org` custom domain olarak eklenmiş durumda; SSL otomatik yönetilir.

`DB` ve `BUCKET` binding'leri `wrangler.toml` içinde tanımlı, deploy ile otomatik bağlanır.

## Bitcoin ödemeleri hakkında önemli not

Bu MVP **gerçek bir Bitcoin transferi yapmaz**. Kullanıcı "Ödeme Al" dediğinde
sadece bir `payouts` kaydı (durum: `pending`) oluşur; admin paneli bunu listeler
ve admin, transferi kendi cüzdanından/borsasından **manuel** yaptıktan sonra
"ödendi" olarak işaretler.

Otomatik on-chain ödeme istersen (kullanıcı "Ödeme Al" dediği an gerçek BTC
gönderilsin), bir ödeme sağlayıcısı entegre etmen gerekir — örneğin:
- **BTCPay Server** (kendi sunucunda, komisyonsuz, ama teknik kurulum ister)
- **OpenNode** veya **Coinbase Commerce** (hazır API, daha kolay ama komisyonlu)

Bu, kendi başına ayrı bir güvenlik/uyumluluk (KYC, vergi, para transferi
lisansı gerekebilir — ülkene göre değişir) incelemesi gerektiren bir adım
olduğu için bilinçli olarak bu pakete dahil edilmedi. İstersen bir sonraki
adımda konuşup entegre edebiliriz.

## Güvenlik notları

- Şifreler asla düz metin saklanmaz/loglanmaz/API'den dönmez — sadece `lib/password.ts`
  üzerinden hash'lenir/karşılaştırılır.
- Admin paneli hiçbir kullanıcının şifresini göstermez; tek yaptığı e-posta ile
  süreli/tek kullanımlık sıfırlama linki göndermek (`lib/email.ts`, `app/api/admin/users/[id]/reset-password`).
- Görüntülenme sayacı (`app/api/posts/[id]/view`) şu an basit — aynı kişi sayfayı
  yenileyerek sayacı manipüle edebilir. Üretime çıkmadan önce IP/oturum bazlı
  hız sınırlama eklenmeli (kodda TODO olarak işaretli).
- `.env` / gizli anahtarları asla GitHub'a commit etme — `RESEND_API_KEY` gibi
  değerleri Cloudflare Pages'in **Environment Variables** panelinden ekle.

## Klasör yapısı

```
app/                  Next.js sayfaları ve API route'ları
  admin/               Yönetici paneli sayfaları
  api/                 Backend endpoint'leri
components/            React bileşenleri
db/                    Drizzle şeması ve bağlantısı
lib/                   Auth, şifre hash, kazanç hesabı, depolama, e-posta yardımcıları
drizzle/                Veritabanı migration dosyaları
```
