"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldAlert, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("invalid login credentials")) {
        toast.error("Invalid email or password. Please check your credentials.");
      } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please confirm your email address before logging in.");
      } else {
        toast.error(signInError.message);
      }
      setLoading(false);
      return;
    }

    toast.success("Login successful! Accessing dashboard...");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1000);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 overflow-hidden">
      {/* Background Glow Ambient Lights */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-600/10 blur-[120px]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl">
        
        {/* Header Branding */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 shadow-inner">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">RESQAI Network</span>
              <h1 className="text-2xl font-black tracking-tight text-white">Welcome Back</h1>
            </div>
          </div>
          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-400">
            Secure Portal
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Register */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          Don't have an account yet?{" "}
          <button
            onClick={() => router.push("/register")}
            className="font-semibold text-red-400 hover:text-red-300 underline underline-offset-4"
          >
            Create account
          </button>
        </p>

      </div>
    </main>
  );
}