import { Link } from "@tanstack/react-router";
import { MessageSquareHeart } from "lucide-react";
import type { ReactNode } from "react";

export function SiteHeader() {
  const link = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <MessageSquareHeart className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold">Sepetak Voice</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/testimoni" className={link} activeProps={{ className: "text-foreground" }}>
            Ulasan
          </Link>
          <Link
            to="/beri-ulasan"
            className="hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:inline-flex"
          >
            Berikan Ulasan
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-gradient-forest text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl">Sepetak Voice</p>
          <p className="mt-1 text-sm opacity-75">Your experience, our improvement.</p>
          <p className="mt-4 text-xs opacity-60">Sepetak Cafe · Banda Aceh</p>
        </div>
        <div className="flex gap-5 text-sm opacity-80">
          <Link to="/beri-ulasan" className="hover:opacity-100">Berikan Ulasan</Link>
          <Link to="/testimoni" className="hover:opacity-100">Ulasan Pelanggan</Link>
          <Link to="/auth" className="hover:opacity-100">Manajemen</Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
