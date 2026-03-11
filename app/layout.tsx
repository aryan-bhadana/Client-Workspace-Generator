import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "@/app/globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Client Workspace Generator",
  description: "Provision client workspaces across Drive and Notion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
