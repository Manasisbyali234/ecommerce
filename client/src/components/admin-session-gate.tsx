"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, clearAccessToken, getAccessToken } from "@/lib/api";

export function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") { setReady(true); return; }
    if (!getAccessToken()) { router.replace("/admin/login"); return; }
    api<{ user: { role: string } }>("/me")
      .then(({ user }) => {
        if (user.role !== "admin" && user.role !== "support") throw new Error("Admin access is required");
        setReady(true);
      })
      .catch(() => { clearAccessToken(); router.replace("/admin/login"); });
  }, [pathname, router]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking admin session…</div>;
  return <>{children}</>;
}
