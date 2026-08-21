# İlk yönetici hesabını oluşturma

Bu proje güvenlik nedeniyle "ilk kullanıcı otomatik admin olsun" gibi bir kısayol
içermez. Yönetici hesabı açmak için:

1. Siteye normal şekilde bir kullanıcı olarak kayıt ol (`/login` sayfasından "Kayıt Ol").
2. Aşağıdaki komutla o kullanıcının `role` alanını `admin` yap (kullanıcı adını değiştir):

```bash
npx wrangler d1 execute video-app-db --remote --command "UPDATE users SET role = 'admin' WHERE username = 'KULLANICI_ADIN';"
```

Yerelde test ediyorsan `--remote` bayrağını kaldır.

Artık bu hesapla giriş yaptığında sağ üstte "Yönetim Paneli" bağlantısı görünecek
ve `/admin` altındaki sayfalara erişebileceksin.
