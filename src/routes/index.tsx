import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coffee, HeartHandshake, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-cafe.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ReviewCard } from "@/components/site/ReviewCard";
import { publicReviewsQuery } from "@/lib/public-reviews";
import { SEPETAK_CAFE_COORDS, getGoogleMapsLink } from "@/lib/location";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sepetak Voice — Your experience, our improvement" },
      { name: "description", content: "Bagikan pengalaman Anda di Sepetak Cafe Banda Aceh. Setiap ulasan dan saran membantu kami menjadi lebih baik." },
      { property: "og:title", content: "Sepetak Voice — Ulasan Sepetak Cafe" },
      { property: "og:description", content: "Bagikan pengalaman Anda di Sepetak Cafe Banda Aceh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: reviews = [] } = useQuery(publicReviewsQuery);
  const featured = reviews.slice(0, 3);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <p className="eyebrow animate-rise text-primary">Sepetak Cafe · Banda Aceh</p>
            <h1 className="animate-rise delay-1 mt-5 text-5xl font-semibold leading-[1.02] md:text-7xl">
              Sepetak Voice
            </h1>
            <p className="animate-rise delay-1 mt-3 font-display text-2xl italic text-gold md:text-3xl">
              Your experience, our improvement.
            </p>
            <p className="animate-rise delay-2 mt-6 max-w-md leading-relaxed text-muted-foreground">
              Terima kasih telah singgah di Sepetak. Ceritakan pengalaman Anda — dari secangkir kopi hingga
              keramahan kami — agar setiap kunjungan berikutnya terasa lebih istimewa.
            </p>
            <div className="animate-rise delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                to="/beri-ulasan"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-95"
              >
                Berikan Ulasan
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/testimoni"
                className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3.5 font-medium transition hover:bg-secondary"
              >
                Lihat ulasan
              </Link>
            </div>
          </div>
          <div className="animate-rise delay-2 relative">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-secondary" />
            <img
              src={heroImg}
              alt="Suasana interior Sepetak Cafe dengan secangkir kopi"
              width={1600}
              height={1104}
              className="aspect-[4/5] w-full rounded-[1.6rem] object-cover shadow-soft md:aspect-[4/4.6]"
            />
            <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card md:-left-8">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                <Coffee className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold">Suara Anda berarti</p>
                <p className="text-xs text-muted-foreground">Dibaca langsung oleh manajemen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, t: "Cepat & mudah", d: "Hanya butuh satu menit untuk berbagi pengalaman." },
            { icon: ShieldCheck, t: "Privasi terjaga", d: "Kirim secara anonim. Data pribadi tidak pernah ditampilkan." },
            { icon: HeartHandshake, t: "Ditindaklanjuti", d: "Setiap masukan dipantau hingga selesai ditangani." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border/70 bg-card p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Kata mereka</p>
            <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Ulasan pilihan</h2>
          </div>
          <Link to="/testimoni" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Semua ulasan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featured.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
            <p className="font-display text-2xl">Belum ada ulasan yang ditampilkan</p>
            <p className="mt-2 text-sm text-muted-foreground">Jadilah yang pertama berbagi pengalaman di Sepetak.</p>
          </div>
        )}
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="grid items-center gap-8 rounded-[2rem] border border-border/70 bg-card p-8 shadow-card md:grid-cols-[1.1fr_1fr] md:p-12">
          <div>
            <p className="eyebrow text-primary">Temukan kami</p>
            <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Sepetak Cafe, Banda Aceh</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Singgah, nikmati kopinya, lalu bagikan pengalaman Anda. Buka Google Maps untuk melihat titik lokasi
              kami dan mendapatkan petunjuk arah.
            </p>
            <a
              href={getGoogleMapsLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-95 sm:w-auto"
            >
              <MapPin className="h-4 w-4" /> Lihat Petunjuk Arah
            </a>
          </div>
          <div className="overflow-hidden rounded-[1.4rem] border border-border">
            <iframe
              title="Peta lokasi Sepetak Cafe"
              src={`https://www.google.com/maps?q=${SEPETAK_CAFE_COORDS.latitude},${SEPETAK_CAFE_COORDS.longitude}&z=17&output=embed`}
              className="h-64 w-full border-0 sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-forest px-8 py-14 text-primary-foreground md:px-14">
          <p className="eyebrow opacity-70">Kritik & saran</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            Ada yang kurang berkenan? Kami ingin mendengarnya.
          </h2>
          <p className="mt-4 max-w-xl opacity-80">
            Masukan yang jujur dan santun membantu kami memperbaiki rasa, kebersihan, dan pelayanan. Semua
            kritik dibaca secara rahasia oleh manajemen.
          </p>
          <Link
            to="/beri-ulasan"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3.5 font-medium text-forest-deep transition hover:opacity-90"
          >
            Sampaikan masukan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
