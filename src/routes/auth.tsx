import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk Manajemen — Sepetak Voice" },
      { name: "description", content: "Halaman masuk khusus manajemen Sepetak Cafe." },
      { property: "og:title", content: "Masuk Manajemen — Sepetak Voice" },
      { property: "og:description", content: "Akses dashboard ulasan untuk manajemen Sepetak Cafe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(10, "Kata sandi minimal 10 karakter").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
    supabase.rpc("admin_exists").then(({ data }) => {
      setAdminExists(!!data);
      if (data === false) setMode("setup");
    });
  }, [navigate]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password: mode === "login" ? password.padEnd(10, " ") : password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (error) {
        toast.error("Email atau kata sandi salah, atau email belum dikonfirmasi.");
        return;
      }
      navigate({ to: "/admin", replace: true });
    } else {
      if (password !== confirm) {
        setLoading(false);
        toast.error("Konfirmasi kata sandi tidak cocok.");
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-cream px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <MessageSquareHeart className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-semibold">Sepetak Voice</span>
        </Link>

        <div className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-soft">
          {sent ? (
            <div className="text-center">
              <h1 className="text-3xl font-semibold">Cek email Anda</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Kami mengirim tautan konfirmasi ke <b>{email}</b>. Klik tautan tersebut, lalu kembali ke halaman ini
                untuk masuk sebagai admin.
              </p>
              <button onClick={() => { setSent(false); setMode("login"); }} className="mt-6 text-sm font-medium text-primary hover:underline">
                Ke halaman masuk
              </button>
            </div>
          ) : (
            <>
              <p className="eyebrow text-primary">{mode === "setup" ? "Penyiapan awal" : "Khusus manajemen"}</p>
              <h1 className="mt-2 text-3xl font-semibold">
                {mode === "setup" ? "Buat akun admin pertama" : "Masuk ke dashboard"}
              </h1>
              {mode === "setup" && (
                <div className="mt-4 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
                  <p className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Panduan</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    <li>Gunakan email resmi manajemen Sepetak.</li>
                    <li>Buat kata sandi kuat (min. 10 karakter, campuran huruf, angka, simbol).</li>
                    <li>Konfirmasi lewat email yang dikirim, lalu masuk.</li>
                  </ol>
                  <p className="mt-2 text-xs opacity-80">Formulir ini hanya tersedia sekali — akun pertama otomatis menjadi admin.</p>
                </div>
              )}
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="pw">Kata sandi</Label>
                  <Input id="pw" type="password" autoComplete={mode === "setup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
                </div>
                {mode === "setup" && (
                  <div>
                    <Label htmlFor="pw2">Ulangi kata sandi</Label>
                    <Input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5" />
                  </div>
                )}
                <button type="submit" disabled={loading || adminExists === null}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "setup" ? "Buat akun admin" : "Masuk"}
                </button>
              </form>
              {adminExists === false && (
                <button onClick={() => setMode(mode === "setup" ? "login" : "setup")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  {mode === "setup" ? "Sudah membuat akun? Masuk" : "Belum ada admin? Buat akun admin pertama"}
                </button>
              )}
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Halaman ini khusus untuk manajemen Sepetak Cafe.</p>
      </div>
    </div>
  );
}
