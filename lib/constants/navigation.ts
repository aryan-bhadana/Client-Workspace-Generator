export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/templates",
    label: "Templates",
  },
  {
    href: "/integrations",
    label: "Integrations",
  },
  {
    href: "/billing",
    label: "Billing",
  },
  {
    href: "/settings",
    label: "Settings",
  },
] as const;

export type NavigationItem = (typeof navigationItems)[number];
