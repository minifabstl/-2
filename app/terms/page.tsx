import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "LeakedFap kullanım şartları — içerik yükleme kuralları, kazanç sistemi ve hesap sorumlulukları.",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="font-display text-2xl font-bold mb-1">Kullanım Şartları</h1>
      <p className="text-[12px] text-[var(--text-faint)] mb-8">Son güncelleme: 22 Ağustos 2026</p>

      <div className="flex flex-col gap-6 text-[13.5px] leading-relaxed text-[var(--text)]">
        <Section title="1. Yaş sınırı">
          LeakedFap&apos;i kullanmak ve içerik yüklemek için 18 yaşından büyük olmalısın. Yüklediğin içerikte görünen
          herkesin 18 yaşından büyük olduğunu ve paylaşıma onay verdiğini beyan etmiş sayılırsın.
        </Section>
        <Section title="2. İçerik sorumluluğu">
          Yüklediğin video/fotoğrafların haklarına sahip olmalı ya da paylaşma yetkin olmalı. Telif hakkı ihlali,
          rıza dışı paylaşım (izinsiz &quot;leak&quot; içerik), nefret söylemi veya yasa dışı içerik kesinlikle yasaktır ve
          tespit edildiğinde hesabın askıya alınabilir.
        </Section>
        <Section title="3. Onay süreci">
          Yüklediğin her içerik, herkese açık akışta görünmeden önce yönetici ekibimiz tarafından incelenir. Kurallara
          uymayan içerikler reddedilir ve bulut depodan kalıcı olarak silinir.
        </Section>
        <Section title="4. Kazanç ve ödemeler">
          Onaylanan içeriklerin izlenmeleri kazanca dönüşür (her 1000 izlenme için 0,20$). Kazancını Bitcoin cüzdan
          adresine ödeme talebiyle çekebilirsin. Ödeme, admin tarafından manuel olarak gönderilir ve işlem
          süresi değişebilir. Sahte/otomatik izlenme oluşturma (bot, refresh suistimali vb.) tespit edilirse ilgili
          kazanç iptal edilebilir ve hesap askıya alınabilir.
        </Section>
        <Section title="5. Hesap askıya alma">
          Kuralları ihlal eden hesapları önceden bildirimde bulunmaksızın askıya alma hakkımız saklıdır.
        </Section>
        <Section title="6. Değişiklikler">
          Bu şartları zaman zaman güncelleyebiliriz. Önemli değişikliklerde seni bilgilendirmeye çalışırız.
        </Section>
      </div>

      <div className="mt-9 text-[11.5px] text-[var(--text-faint)] leading-relaxed border-t border-[var(--border)] pt-5">
        Bu metin genel bir taslaktır; platformunun faaliyet gösterdiği ülke(ler)deki yasal gerekliliklere tam uyum
        için bir hukuk danışmanına gözden geçirtmen önerilir.
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
