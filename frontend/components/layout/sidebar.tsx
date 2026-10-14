"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  Bot,
  ChevronLeft,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const mainLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Incidents", href: "/incidents", icon: ShieldAlert, count: "12" },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
];

const intelLinks = [
  { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { label: "MITRE ATT&CK", href: "/mitre", icon: Network },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState({ displayName: "Maya Chen", role: "SOC Analyst" });

  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem("sentinelrag-profile");
        if (saved) setProfile(JSON.parse(saved) as typeof profile);
      } catch {
        localStorage.removeItem("sentinelrag-profile");
      }
    };
    update();
    window.addEventListener("sentinelrag:profile", update);
    return () => window.removeEventListener("sentinelrag:profile", update);
  }, []);

  function renderLinks(links: typeof mainLinks) {
    return links.map(({ label, href, icon: Icon, ...item }) => {
      const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={cn(
            "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
            active ? "bg-primary/10 font-medium text-primary" : "text-slate-400 hover:bg-elevated hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <Icon aria-hidden="true" size={18} className="shrink-0" />
          {!collapsed && <span className="flex-1">{label}</span>}
          {!collapsed && "count" in item && (
            <span className="rounded-md bg-elevated px-1.5 py-0.5 text-[11px] text-slate-300">{item.count}</span>
          )}
        </Link>
      );
    });
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onNavigate}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-[#0d1524] transition-[width,transform] duration-200 md:translate-x-0",
          collapsed ? "w-[76px]" : "w-[248px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "max-md:!w-[248px]",
        )}
      >
        <div className="flex h-[72px] items-center gap-3 border-b border-border px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield aria-hidden="true" size={20} />
          </div>
          <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
            <p className="truncate text-sm font-semibold tracking-wide text-foreground">Sentinel<span className="text-primary">RAG</span></p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">Incident assistant</p>
          </div>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggle}
            className="hidden rounded-md p-1 text-muted hover:bg-elevated hover:text-foreground md:block"
          >
            <ChevronLeft aria-hidden="true" size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          <div>
            <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500", collapsed && "md:hidden")}>Workspace</p>
            <div className="space-y-1">{renderLinks(mainLinks)}</div>
          </div>
          <div>
            <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500", collapsed && "md:hidden")}>Threat intelligence</p>
            <div className="space-y-1">{renderLinks(intelLinks)}</div>
          </div>
          <div>
            <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500", collapsed && "md:hidden")}>System</p>
            <Link
              href="/settings"
              onClick={onNavigate}
              title={collapsed ? "Settings" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition-colors hover:bg-elevated hover:text-foreground",
                pathname === "/settings" && "bg-primary/10 font-medium text-primary",
                collapsed && "justify-center px-2",
              )}
            >
              <Settings aria-hidden="true" size={18} />
              <span className={cn(collapsed && "md:hidden")}>Settings</span>
            </Link>
          </div>
        </nav>
        <div className={cn("border-t border-border p-4", collapsed && "md:px-3")}>
          <div className={cn("flex items-center gap-3 rounded-lg bg-surface p-2.5", collapsed && "md:justify-center md:bg-transparent md:p-0")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">{profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
            <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
              <p className="truncate text-xs font-medium text-foreground">{profile.displayName}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted">{profile.role}</p>
            </div>
            {!collapsed && <Activity aria-hidden="true" size={15} className="text-success" />}
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("sentinelrag-mock-session");
              localStorage.removeItem("sentinelrag-profile");
              router.replace("/login");
            }}
            className={cn(
              "mt-3 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-muted transition-colors hover:bg-elevated hover:text-foreground",
              collapsed && "md:justify-center",
            )}
          >
            <LogOut aria-hidden="true" size={15} />
            <span className={cn(collapsed && "md:hidden")}>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
