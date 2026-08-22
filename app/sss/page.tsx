import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular",
  description: "LeakedFap hakkında sıkça sorulan sorular — kazanç sistemi, içerik onayı, ödemeler ve hesap yönetimi.",
};

const FAQS = [
  {
    q: "Yüklediğim içerik ne zaman yayına girer?",
    a: "Yüklediğin her video/fotoğraf, herkese açık akışta görünmeden önce yönetici ekibimiz tarafından incelenir. Onaylandığında akışta görünmeye ve izlenme kazanmaya başlar. Onay genelde kısa sürer, ama içerik yoğunluğuna göre değişebilir.",
  },
  {
    q: "Ne kadar kazanabilirim?",
    a: "Her 1000 izlenme için 0,20$ kazanırsın. Kazancın profilindeki Kazanç & Ödeme sekmesinde anlık olarak görünür.",
  },
  {
    q: "Kazancımı nasıl çekerim?",
    a: "Profilinden Bitcoin cüzdan adresini kaydedip \"Bitcoin ile Ödeme Al\" butonuna basarak talep oluşturursun. Talebin admin tarafından incelenip cüzdanına gönderilir; işlem \"ödendi\" olarak işaretlenince geçmişinde görünür.",
  },
  {
    q: "Şifremi unuttum, ne yapmalıyım?",
    a: "Giriş sayfasındaki \"Şifremi Unuttum\" linkine tıkla, kayıtlı e-postanı gir. E-postana gelen 6 haneli kodu girip yeni şifreni kendin belirleyebilirsin.",
  },
  {
    q: "İçeriğimi kendim kaldırabilir miyim?",
    a: "Şu an içerik kaldırma işlemini yönetici ekibi yapıyor. Bir içeriğinin kaldırılmasını istiyorsan yönetici ekibiyle iletişime geç.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <h1 className="font-display text-2xl font-bold mb-1">Sıkça Sorulan Sorular</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-8">Aklına takılan bir şey burada yoksa yönetici ekibiyle iletişime geçebilirsin.</p>

      <div className="flex flex-col gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group border border-[var(--border)] rounded-2xl bg-[var(--surface)] px-5 py-4">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-semibold text-[14px]">
              {f.q}
              <span className="text-[var(--text-faint)] transition-transform group-open:rotate-45 text-lg leading-none">+</span>
            </summary>
            <div className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-2.5">{f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
