"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { authApi, setAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@metromindz.local");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await authApi.adminLogin(email, password);
      if (result.user.role !== "admin" && result.user.role !== "support") throw new Error("This account does not have admin access");
      setAccessToken(result.token);
      toast.success("Signed in to Admin Console");
      router.replace("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };
  return <main className="grid min-h-screen place-items-center bg-muted/20 p-4"><Card className="w-full max-w-md"><CardHeader><ShieldCheck className="mb-2 h-8 w-8 text-primary" /><CardTitle>Admin sign in</CardTitle><CardDescription>Use an administrator or support account to manage the store.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" value={password} type="password" onChange={(e) => setPassword(e.target.value)} required /></div><Button className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button></form></CardContent></Card><Toaster /></main>;
}
