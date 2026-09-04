"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ספרייה" },
  { href: "/formats", label: "פורמטים" },
  { href: "/settings", label: "הגדרות" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg ai-gradient-bg text-sm font-bold text-white">
            AI
          </span>
          <span className="text-lg font-semibold tracking-tight">
            <span className="ai-gradient-text">Video</span> Studio
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface text-foreground"
                    : "text-zinc-400 hover:bg-surface hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/upload"
            className="flex items-center gap-1.5 rounded-full ai-gradient-bg px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-fuchsia-500/20 transition-opacity hover:opacity-90"
          >
            <span className="text-base leading-none">+</span>
            העלאה ועריכה חדשה
          </Link>
        </div>
      </div>
    </header>
  );
}
