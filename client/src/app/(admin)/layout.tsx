"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { AdminSessionGate } from "@/components/admin-session-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <AdminSessionGate>{children}<Toaster /></AdminSessionGate>;
  }
  return (
    <AdminSessionGate>
    <SidebarProvider>
      <div
        className="flex min-h-screen w-full bg-background text-foreground"
        suppressHydrationWarning
      >
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>Metromindz</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Admin Console
                </span>
              </div>
            </div>

            {/* Quick Button to Customer Storefront */}
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
              <Link href="/">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span>View Website</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            </Button>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
    </AdminSessionGate>
  );
}
