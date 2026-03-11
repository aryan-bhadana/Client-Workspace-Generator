import { getCurrentUser } from "@/lib/auth";
import { NavLinks } from "@/components/navigation/nav-links";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/lib/constants/navigation";

export async function MobileNav() {
  const user = await getCurrentUser();

  return (
    <div className="sticky top-0 z-20 border-b border-white/60 bg-background/90 px-4 py-4 backdrop-blur md:hidden">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Client Workspace Generator</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {user?.email ?? "Authenticated user"}
        </p>
      </div>
      <NavLinks items={navigationItems} mobile />
      <form action="/auth/logout" method="post" className="mt-3">
        <Button className="w-full" type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </div>
  );
}
