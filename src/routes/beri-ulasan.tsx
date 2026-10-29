import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StarRating } from "@/components/site/StarRating";
import { CATEGORIES, reviewSchema, type CategoryValue } from "@/lib/reviews";
import { submitReview, type SubmitReviewResult } from "@/lib/reviews.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getGoogleMapsLink, validateCustomerLocation } from "@/lib/location";

export const Route = createFileRoute("/beri-ulasan")({
  head: () => ({
    meta: [
      { title: "Berikan Ulasan — Sepetak Voice" },
      { name: "description", content: "Beri rating dan saran untuk Sepetak Cafe Banda Aceh. Bisa dikirim secara anonim." },
      { property: "og:title", content: "Berikan Ulasan untuk Sepetak Cafe" },
      { property: "og:description", content: "Bagikan pengalaman Anda dalam satu menit." },
    ],
  }),
  component: BeriUlasan,
});

const RATING_TEXT = ["", "Sangat kurang", "Kurang", "Cukup", "Baik", "Luar biasa"];
type LocationStatus = "idle" | "checking" | "ok" | "denied" | "blocked" | "unavailable";

function BeriUlasan() {
  const submitReviewFn = useServerFn(submitReview);
  const coordsRef = useRef<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [rating, setRating] = useState(0);
  const [categories, setCategories] = useState<CategoryValue[]>([]);
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState(
    "Untuk mengirim ulasan, beri izin lokasi agar kami dapat memastikan Anda berada di area Sepetak Cafe.",
  );
  const [locationDistance, setLocationDistance] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const toggleCat = (v: CategoryValue) =>
    setCategories((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));

  async function requestLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      const message = "Browser tidak mendukung geolocation. Aktifkan lokasi di perangkat dan coba lagi.";
      setLocationStatus("unavailable");
      setLocationMessage(message);
      toast.error(message);
      return false;
    }

    setLocationStatus("checking");
    setLocationMessage("Meminta izin lokasi...");

    return await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = validateCustomerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });

          if (result.ok) {
            coordsRef.current = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy ?? null,
            };
            setLocationStatus("ok");
            setLocationDistance(result.distance);
            setLocationAccuracy(position.coords.accuracy ?? null);
            setLocationMessage(`Lokasi valid. Jarak Anda ke Sepetak Cafe: ${Math.round(result.distance)} meter.`);
            resolve(true);
            return;
          }

          setLocationStatus("blocked");
          setLocationDistance(result.distance ?? null);
          setLocationAccuracy(position.coords.accuracy ?? null);
          setLocationMessage(result.message);
          toast.error(result.message);
          resolve(false);
        },
        (error) => {
          const message =
            error.code === error.PERMISSION_DENIED
              ? "Izin lokasi ditolak. Aktifkan lokasi perangkat dan coba lagi."
              : "Lokasi tidak tersedia. Aktifkan lokasi perangkat dan coba lagi.";

          setLocationStatus("denied");
          setLocationMessage(message);
          toast.error(message);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const locationAllowed = await requestLocation();
    if (!locationAllowed) {
      return;
    }

    const parsed = reviewSchema.safeParse({
      rating,
      categories,
      comment,
      suggestion,
      isAnonymous,
      customerName,
      staffFeedback: staffOpen ? staffFeedback : "",
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[String(i.path[0])] ??= i.message;
      });
      setErrors(errs);
      toast.error("Mohon lengkapi formulir terlebih dahulu.");
      return;
    }

    setErrors({});
    const coords = coordsRef.current;
    if (!coords) {
      toast.error("Lokasi belum valid. Aktifkan lokasi dan coba lagi.");
      return;
    }

    setLoading(true);
    const d = parsed.data;
    let result: SubmitReviewResult;
    try {
      result = await submitReviewFn({ data: { ...d, ...coords } });
    } catch {
      result = { ok: false, message: "Ulasan gagal dikirim. Silakan coba lagi." };
    }
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message ?? "Ulasan gagal dikirim. Silakan coba lagi.");
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-xl px-5 py-24 text-center animate-rise">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </span>
          <h1 className="mt-6 text-4xl font-semibold md:text-5xl">Terima kasih!</h1>
          <p className="mt-4 text-muted-foreground">
            Ulasan Anda telah kami terima dan akan dibaca oleh manajemen Sepetak Cafe. Masukan Anda membantu
            kami meningkatkan kualitas pelayanan.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/" className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">Ke beranda</Link>
            <Link to="/testimoni" className="rounded-full border border-border bg-card px-6 py-3 font-medium">Lihat ulasan</Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  const err = (k: string) => errors[k] && <p className="mt-2 text-sm text-destructive">{errors[k]}</p>;
  const block = "rounded-2xl border border-border/70 bg-card p-6 shadow-card md:p-8";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-5 pt-14">
        <p className="eyebrow text-primary">Formulir ulasan</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Bagaimana kunjungan Anda?</h1>
        <p className="mt-4 flex items-start gap-2 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          Setiap masukan digunakan untuk meningkatkan kualitas pelayanan kami, dan diperlakukan secara rahasia.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
          <div className={block}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Label className="text-base font-semibold">Lokasi Anda</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ulasan hanya dapat dikirim saat Anda berada di area Sepetak Cafe.
                </p>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-sm font-medium transition hover:bg-secondary sm:w-auto sm:px-3 sm:py-2"
              >
                <MapPin className="h-4 w-4" />
                Aktifkan lokasi
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-muted/60 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {locationStatus === "ok" ? "Lokasi valid" : locationStatus === "checking" ? "Memeriksa lokasi..." : "Lokasi belum tersedia"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{locationMessage}</p>
                  {locationDistance !== null && (
                    <p className="mt-2 text-xs text-muted-foreground">Jarak terukur: {Math.round(locationDistance)} meter</p>
                  )}
                  {locationAccuracy !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">Akurasi: ±{Math.round(locationAccuracy)} meter</p>
                  )}
                </div>
              </div>
            </div>
            <a
              href={getGoogleMapsLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <MapPin className="h-4 w-4" /> Lihat Petunjuk Arah
            </a>
          </div>

          <div className={block}>
            <Label className="text-base font-semibold">Rating keseluruhan *</Label>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <StarRating value={rating} onChange={setRating} size={34} />
              <span className="font-display text-xl italic text-muted-foreground">{RATING_TEXT[rating]}</span>
            </div>
            {err("rating")}
          </div>

          <div className={block}>
            <Label className="text-base font-semibold">Kategori pengalaman *</Label>
            <p className="mt-1 text-sm text-muted-foreground">Boleh pilih lebih dari satu.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = categories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCat(c.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {err("categories")}
          </div>

          <div className={block}>
            <Label htmlFor="comment" className="text-base font-semibold">Ceritakan pengalaman Anda *</Label>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={5}
              placeholder="Apa yang Anda sukai atau kurang berkenan?" className="mt-3 bg-background" />
            {err("comment")}
            <Label htmlFor="suggestion" className="mt-6 block text-base font-semibold">Kritik & saran</Label>
            <Textarea id="suggestion" value={suggestion} onChange={(e) => setSuggestion(e.target.value)} maxLength={2000} rows={3}
              placeholder="Apa yang bisa kami tingkatkan? (opsional)" className="mt-3 bg-background" />
            {err("suggestion")}
          </div>

          <div className={block}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="anon" className="text-base font-semibold">Kirim sebagai anonim</Label>
                <p className="text-sm text-muted-foreground">Nama Anda tidak akan disimpan.</p>
              </div>
              <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            {!isAnonymous && (
              <div className="mt-5">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={80}
                  placeholder="Nama Anda" className="mt-2 bg-background" />
                <p className="mt-1.5 text-xs text-muted-foreground">Jika ditampilkan publik, hanya nama depan yang terlihat.</p>
                {err("customerName")}
              </div>
            )}
          </div>

          <div className={block}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="staff" className="flex items-center gap-2 text-base font-semibold">
                  <Lock className="h-4 w-4 text-primary" /> Masukan tentang pelayanan karyawan
                </Label>
                <p className="text-sm text-muted-foreground">Rahasia — hanya dibaca manajemen, tidak pernah dipublikasikan.</p>
              </div>
              <Switch id="staff" checked={staffOpen} onCheckedChange={setStaffOpen} />
            </div>
            {staffOpen && (
              <div className="mt-5">
                <Textarea value={staffFeedback} onChange={(e) => setStaffFeedback(e.target.value)} maxLength={2000} rows={4}
                  placeholder="Sampaikan secara profesional, misalnya keramahan, kecepatan, atau ketelitian." className="bg-background" />
                <p className="mt-1.5 text-xs text-muted-foreground">Masukan ini digunakan untuk pembinaan dan perbaikan, bukan untuk menyalahkan.</p>
                {err("staffFeedback")}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium text-primary-foreground shadow-soft transition hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kirim ulasan
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}
