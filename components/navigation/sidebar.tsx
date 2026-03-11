import { LogOut } from "lucide-react";

import { navigationItems } from "@/lib/constants/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/navigation/nav-links";

export async function Sidebar() {
  const user = await getCurrentUser();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/60 bg-slate-950 px-5 py-6 text-slate-100 md:block">
      <div className="mb-10 space-y-2">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          Micro SaaS MVP
        </div>
        <div>
          <h2 className="text-xl font-semibold">Client Workspace Generator</h2>
          <p className="mt-2 text-sm text-slate-400">
            Provision Google Drive folders and Notion workspaces from one dashboard.
          </p>
        </div>
      </div>

      <NavLinks items={navigationItems} />

      <div className="mt-auto pt-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm font-medium text-white">
            {user?.email ?? "Authenticated user"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Signed in with Supabase Auth</p>
          <form action="/auth/logout" method="post" className="mt-4">
            <Button className="w-full justify-center" variant="secondary">
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
