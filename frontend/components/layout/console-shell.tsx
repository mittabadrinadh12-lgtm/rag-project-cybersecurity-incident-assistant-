"use client";

import { useState } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") return;
    try {
      const session = localStorage.getItem("sentinelrag-mock-session");
      if (session) {
        setAuthenticated(true);
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  if (pathname === "/login") return <main className="min-h-screen bg-background">{children}</main>;
  if (!authenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">Checking mock analyst session…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "md:pl-[76px]" : "md:pl-[248px]"}`}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
