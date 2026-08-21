# Akış — Video/Foto Paylaşım Platformu

Next.js + Cloudflare (D1 veritabanı + R2 medya deposu) ile kurulmuş, video ve
fotoğraf paylaşım/kazanç platformu. Beyaz/açık tema, Türkçe arayüz.

## ⚠️ Bu paketin durumu (nerede kaldık)

Bu proje **iskelet olarak çalışır durumda** teslim edildi, ama zaman/kredi
kısıtı nedeniyle tamamı bitmedi. Devam edeceğiz dediğinde kaldığımız yerden
sürdüreceğiz. Şu an:

**Tamamlanan:**
- Veritabanı şeması + ilk migration (`drizzle/0000_*.sql`)
- Kayıt / giriş / çıkış (şifreler PBKDF2 ile hash'lenir, asla düz metin saklanmaz)
- Ana akış: üye olmadan izleme, giriş yapanlar için beğeni + yorum
- Görüntülenme sayacı, kategori filtreleme (Keşfet sayfası)
- Yeni içerik yükleme (`/upload`) — Cloudflare R2'ye kaydeder
- Profil & Kazanç sayfası: 0,20$/1000 izlenme hesaplama, Bitcoin cüzdan adresi, ödeme talebi
- Yönetici paneli: Genel Bakış + Kullanıcılar sayfası (askıya alma, **şifresiz** güvenli sıfırlama akışı)
- Şifre sıfırlama: admin tetikler → kullanıcıya e-posta ile tek kullanımlık link gider → kullanıcı kendi yeni şifresini belirler

**Henüz eksik (bir sonraki oturumda tamamlanacak):**
- `/admin/content` sayfası (içerik moderasyon tablosu — API route'u hazır: `app/api/admin/content/[id]/remove/route.ts`, sadece arayüz eksik)
- `/admin/payouts` sayfası (ödeme kuyruğu tablosu — API route'u hazır: `app/api/admin/payouts/[id]/mark-paid/route.ts`, sadece arayüz eksik)
- Gerçek e-posta gönderimi (şu an sadece konsola yazıyor, bkz. `lib/email.ts` — Resend API key eklenince otomatik gerçek gönterime geçer)
- Gerçek otomatik Bitcoin transferi (şu an sadece "ödeme talebi" kaydı oluşturuyor, admin manuel gönderip "ödendi" işaretliyor — bkz. aşağıdaki "Bitcoin ödemeleri" bölümü)

`npx tsc --noEmit` hatasız geçiyor, yani mevcut kod derleniyor.

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

## Cloudflare Pages'e deploy (GoDaddy alan adınla)

Alan adını GoDaddy'den aldığını ve Cloudflare üzerinden yayınladığını
belirttin — bu proje tam olarak bunun için kuruldu:

```bash
# Üretim veritabanına migration'ı uygula
npx wrangler d1 migrations apply video-app-db --remote

# Build + deploy
npm run build
npx wrangler pages deploy .open-next/assets --project-name video-app
```

Deploy sonrası Cloudflare Pages panelinden:
1. **Custom domains** sekmesinden GoDaddy'de aldığın alan adını ekle (Cloudflare zaten DNS'ini yönetiyorsa otomatik doğrulanır).
2. **Settings → Functions → D1/R2 bindings** kısmından `DB` ve `BUCKET` binding'lerinin bağlı olduğunu doğrula (genelde `wrangler.toml`'dan otomatik gelir).

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
