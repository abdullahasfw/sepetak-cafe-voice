import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Eye, EyeOff, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/site/StarRating";
import { CATEGORIES, STATUS_LABEL, canBePublic, categoryLabel } from "@/lib/reviews";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Manajemen — Sepetak Voice" },
      { name: "description", content: "Dashboard ulasan untuk manajemen Sepetak Cafe." },
      { property: "og:title", content: "Dashboard Manajemen — Sepetak Voice" },
      { property: "og:description", content: "Kelola ulasan pelanggan Sepetak Cafe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Status = keyof typeof STATUS_LABEL;

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("semua");
  const [status, setStatus] = useState("semua");

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "").eq("role", "admin");
      return (data ?? []).length > 0;
    },
  });
  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const all = reviews.data ?? [];
  const list = useMemo(
    () =>
      all.filter(
        (r) =>
          (cat === "semua" || r.categories.includes(cat)) &&
          (status === "semua" || r.status === status) &&
          (!q || `${r.comment} ${r.suggestion ?? ""} ${r.staff_feedback ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [all, cat, status, q],
  );

  const stats = useMemo(() => {
    const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
    const counts: Record<string, number> = {};
    all.forEach((r) => r.categories.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      return { label: d.toLocaleDateString("id-ID", { weekday: "short" }), n: all.filter((r) => new Date(r.created_at).toDateString() === key).length };
    });
    return { avg, top: top ? categoryLabel(top[0]) : "-", days };
  }, [all]);

  async function update(id: string, patch: { is_public?: boolean; status?: Status }) {
    const { error } = await supabase.from("reviews").update(patch).eq("id", id);
    if (error) {
      toast.error("Gagal menyimpan perubahan.");
      return;
    }
    toast.success("Perubahan disimpan.");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["public-reviews"] });
  }

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Tanggal", "Rating", "Kategori", "Komentar", "Saran", "Nama", "Masukan karyawan", "Publik", "Status"]];
    list.forEach((r) => rows.push([new Date(r.created_at).toLocaleString("id-ID"), String(r.rating), r.categories.join("; "), r.comment, r.suggestion ?? "", r.is_anonymous ? "Anonim" : r.customer_name ?? "", r.staff_feedback ?? "", r.is_public ? "Ya" : "Tidak", STATUS_LABEL[r.status]]));
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ulasan-sepetak.csv";
    a.click();
  }

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (role.isLoading) return <div className="p-10 text-center text-muted-foreground">Memuat…</div>;
  if (!role.data)
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <h1 className="text-3xl font-semibold">Akses ditolak</h1>
          <p className="mt-2 text-muted-foreground">Akun ini tidak memiliki izin admin.</p>
          <button onClick={logout} className="mt-6 rounded-full bg-primary px-5 py-2 text-primary-foreground">Keluar</button>
        </div>
      </div>
    );

  const max = Math.max(1, ...stats.days.map((d) => d.n));
  const sel = "rounded-lg border border-input bg-card px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-forest text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div>
            <p className="font-display text-2xl">Sepetak Voice</p>
            <p className="text-xs opacity-70">Dashboard manajemen</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-sm hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total ulasan", String(all.length)],
            ["Rata-rata rating", stats.avg.toFixed(1)],
            ["Kategori terbanyak", stats.top],
            ["Belum ditangani", String(all.filter((r) => r.status === "baru").length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-semibold">Tren ulasan 7 hari terakhir</p>
          <div className="mt-4 flex h-28 items-end gap-3">
            {stats.days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{d.n}</span>
                <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d.n / max) * 80 + 2}px` }} />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Input placeholder="Cari komentar…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
          <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="semua">Semua kategori</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="semua">Semua status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={exportCsv} className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
            <Download className="h-4 w-4" /> Ekspor CSV
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {reviews.isLoading && <p className="text-muted-foreground">Memuat ulasan…</p>}
          {!reviews.isLoading && list.length === 0 && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Belum ada ulasan.</p>}
          {list.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={r.rating} size={16} />
                <span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString("id-ID")}</span>
                <span className="text-sm text-muted-foreground">· {r.is_anonymous ? "Anonim" : r.customer_name}</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <select className={sel} value={r.status} onChange={(e) => update(r.id, { status: e.target.value as Status })}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button
                    disabled={!canBePublic(r.rating)}
                    title={canBePublic(r.rating) ? "" : "Hanya ulasan rating 4–5 yang dapat ditampilkan"}
                    onClick={() => update(r.id, { is_public: !r.is_public })}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-40"
                  >
                    {r.is_public ? <><EyeOff className="h-4 w-4" /> Sembunyikan</> : <><Eye className="h-4 w-4" /> Setujui publik</>}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.categories.map((c) => <span key={c} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{categoryLabel(c)}</span>)}
                {r.is_public && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">Tampil publik</span>}
              </div>
              <p className="mt-3">{r.comment}</p>
              {r.suggestion && <p className="mt-2 text-sm"><b>Saran:</b> {r.suggestion}</p>}
              {r.staff_feedback && (
                <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold"><Lock className="h-3.5 w-3.5" /> Masukan karyawan (rahasia)</span>
                  {r.staff_feedback}
                </p>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
