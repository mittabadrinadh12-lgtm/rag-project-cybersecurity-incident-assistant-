"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted hover:bg-elevated hover:text-foreground md:hidden"
        >
          <Menu aria-hidden="true" size={19} />
        </button>
        <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
          <span>Security Operations</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-200">Overview</span>
        </div>
        <div className="sm:hidden">
          <p className="text-sm font-semibold text-foreground">Security Operations</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <label className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-muted lg:flex">
          <Search aria-hidden="true" size={15} />
          <input
            type="search"
            placeholder="Search incidents..."
            aria-label="Search incidents"
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-slate-500"
          />
          <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">⌘ K</kbd>
        </label>
        <button type="button" aria-label="Notifications, 3 unread" className="relative rounded-lg p-2 text-slate-400 hover:bg-elevated hover:text-foreground">
          <Bell aria-hidden="true" size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-critical" />
        </button>
        <span className="hidden h-7 w-px bg-border sm:block" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-200 md:hidden">{profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
          <div className="hidden text-right md:block">
            <p className="text-xs font-medium text-slate-200">{profile.displayName}</p>
            <p className="mt-0.5 text-[10px] text-muted">{profile.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
