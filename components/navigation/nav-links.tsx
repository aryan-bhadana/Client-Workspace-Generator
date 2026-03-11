"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  PlugZap,
  Settings,
} from "lucide-react";

import type { NavigationItem } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const icons = {
  Dashboard: LayoutDashboard,
  Templates: FolderKanban,
  Integrations: PlugZap,
  Billing: CreditCard,
  Settings,
} as const;

interface NavLinksProps {
  items: readonly NavigationItem[];
  mobile?: boolean;
}

export function NavLinks({ items, mobile = false }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(mobile ? "grid grid-cols-2 gap-2" : "space-y-2")}>
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = icons[item.label];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              mobile
                ? "rounded-xl border px-3 py-2 text-center text-sm font-medium"
                : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? mobile
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-white text-slate-950 shadow-sm"
                : mobile
                  ? "border-border bg-white/70 text-foreground"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {!mobile ? <Icon className="size-4" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
