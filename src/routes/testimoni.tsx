import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ReviewCard } from "@/components/site/ReviewCard";
import { publicReviewsQuery } from "@/lib/public-reviews";
import { CATEGORIES } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/testimoni")({
  head: () => ({
    meta: [
      { title: "Ulasan Pelanggan — Sepetak Voice" },
      { name: "description", content: "Baca ulasan pelanggan Sepetak Cafe Banda Aceh tentang makanan, minuman, suasana, dan pelayanan." },
      { property: "og:title", content: "Ulasan Pelanggan Sepetak Cafe" },
      { property: "og:description", content: "Cerita pengalaman pelanggan di Sepetak Cafe Banda Aceh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Testimoni,
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function Testimoni() {
  const { data = [], isLoading } = useQuery(publicReviewsQuery);
  const [cat, setCat] = useState<string>("semua");
  const [rating, setRating] = useState<number>(0);

  const list = useMemo(
    () => data.filter((r) => (cat === "semua" || r.categories.includes(cat)) && (!rating || r.rating === rating)),
    [data, cat, rating],
  );

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-5 pt-14">
        <p className="eyebrow text-primary">Ulasan pelanggan</p>
        <h1 className="mt-3 text-5xl font-semibold md:text-6xl">Cerita dari meja Sepetak</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Ulasan di halaman ini telah ditinjau oleh manajemen. Identitas pelanggan selalu dilindungi.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          <Chip active={cat === "semua"} onClick={() => setCat("semua")}>Semua</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} active={cat === c.value} onClick={() => setCat(c.value)}>{c.label}</Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={rating === 0} onClick={() => setRating(0)}>Semua rating</Chip>
          <Chip active={rating === 5} onClick={() => setRating(5)}>★ 5</Chip>
          <Chip active={rating === 4} onClick={() => setRating(4)}>★ 4</Chip>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : list.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
            Belum ada ulasan untuk filter ini.
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
