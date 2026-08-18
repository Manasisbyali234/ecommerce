import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles.css";
import { FaviconInjector } from "@/components/favicon-injector";
import { ThemeInjector } from "@/components/theme-injector";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Metromindz Store — E-Commerce & Super Admin Dashboard",
  description:
    "Shop premium products on Metromindz Store and manage inventory, orders, and analytics on Metromindz Admin.",
  authors: [{ name: "Metromindz Store" }],
  openGraph: {
    title: "Metromindz Store — E-Commerce & Super Admin Dashboard",
    description:
      "Shop premium products on Metromindz Store and manage inventory, orders, and analytics on Metromindz Admin.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <FaviconInjector />
        <ThemeInjector />
        {children}
      </body>
    </html>
  );
}
