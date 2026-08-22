import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "LeakedFap gizlilik politikası — hangi verileri topluyoruz, nasıl kullanıyoruz ve saklıyoruz.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="font-display text-2xl font-bold mb-1">Gizlilik Politikası</h1>
      <p className="text-[12px] text-[var(--text-faint)] mb-8">Son güncelleme: 22 Ağustos 2026</p>

      <div className="flex flex-col gap-6 text-[13.5px] leading-relaxed text-[var(--text)]">
        <Section title="1. Topladığımız veriler">
          Hesap oluşturduğunda kullanıcı adını, e-posta adresini ve (girersen) Bitcoin cüzdan adresini saklarız.
          Şifren asla düz metin olarak saklanmaz — yalnızca geri döndürülemez bir şekilde hash&apos;lenir. Yüklediğin
          video/fotoğraflar, başlık ve kategori bilgisi, aldığın beğeni/yorumlar ve içeriklerinin izlenme sayıları da
          sistemimizde tutulur.
        </Section>
        <Section title="2. Verileri nasıl kullanıyoruz">
          Verilerini hesabını çalıştırmak, izlenmelerini kazanca çevirmek, ödeme taleplerini işlemek ve platformu
          güvenli tutmak (kural ihlallerini tespit etmek, hesap askıya alma) için kullanırız. Verilerini üçüncü
          taraflara satmayız.
        </Section>
        <Section title="3. Çerezler">
          Oturumunu açık tutmak için gerekli (zorunlu) çerezler kullanırız. Ayrıca aynı tarayıcının kısa süre içinde
          aynı içeriği tekrar tekrar izleyerek görüntülenme sayacını suistimal etmesini önlemek için teknik bir çerez
          kullanılır. Reklam/izleme amaçlı üçüncü taraf çerezi kullanmıyoruz.
        </Section>
        <Section title="4. Medya depolama">
          Yüklediğin video ve fotoğraflar Cloudflare R2 üzerinde saklanır. İçeriğini kaldırdığında (veya admin
          reddettiğinde/kaldırdığında) dosya depodan kalıcı olarak silinir.
        </Section>
        <Section title="5. Verilerini silme">
          Hesabının kapatılmasını ve verilerinin silinmesini istersen bizimle iletişime geç. Yasal olarak saklamamız
          gereken kayıtlar (örn. ödeme geçmişi) hariç, verilerin makul bir süre içinde silinir.
        </Section>
        <Section title="6. İletişim">
          Gizlilikle ilgili sorularını hesabınla ilişkili yönetici ekibine iletebilirsin.
        </Section>
      </div>

      <div className="mt-9 text-[11.5px] text-[var(--text-faint)] leading-relaxed border-t border-[var(--border)] pt-5">
        Bu metin genel bir taslaktır; yürürlükteki mevzuata (KVKK/GDPR ve bulunduğun ülkenin yasaları) tam uyum için
        bir hukuk danışmanına gözden geçirtmen önerilir.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-display text-[15px] font-bold mb-1.5">{title}</div>
      <div className="text-[var(--text-muted)]">{children}</div>
    </div>
  );
}
