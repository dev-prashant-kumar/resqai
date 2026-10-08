"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function redirectByRole(role: string) {
    router.refresh();

    switch (role) {
      case "RESPONDER":
        console.log("7. REDIRECTING TO RESPONDER");
        router.replace("/responder");
        break;
      case "OPERATOR":
        console.log("7. REDIRECTING TO OPERATOR");
        router.replace("/operator");
        break;
      case "ADMIN":
        console.log("7. REDIRECTING TO ADMIN");
        router.replace("/admin");
        break;
      case "CITIZEN":
        console.log("7. REDIRECTING TO CITIZEN");
        router.replace("/dashboard");
        break;
      default:
        console.error("UNKNOWN ROLE:", role);
        setError(`Unknown role: ${role}`);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      console.log("1. Starting login...");

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error("LOGIN ERROR:", loginError);
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setError("No authenticated user was returned.");
        return;
      }

      console.log("2. Authenticated user:", data.user.id);
      console.log("3. Email:", data.user.email);

      // Use .maybeSingle() instead of .single() to avoid PGRST116 throwing an error
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        setError(`Profile could not be loaded: ${profileError.message}`);
        return;
      }

      // Handle the case where no profile record exists in public.profiles
      if (!profile) {
        console.warn("No profile record found in 'profiles' for user ID:", data.user.id);

        const metadataRole = data.user.user_metadata?.role;
        if (metadataRole) {
          redirectByRole(String(metadataRole).toUpperCase());
          return;
        }

        setError(
          "Your profile record does not exist in the database. Ensure RLS policies allow reading your profile, or verify the user row in the profiles table."
        );
        return;
      }

      console.log("4. PROFILE:", profile);
      console.log("5. ROLE FROM DATABASE:", profile.role);

      const role = String(profile.role).toUpperCase();
      console.log("6. NORMALIZED ROLE:", role);

      redirectByRole(role);
    } catch (err) {
      console.error("UNEXPECTED LOGIN ERROR:", err);
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090d] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <span className="text-2xl">🚨</span>
          </div>

          <p className="text-sm font-semibold tracking-[0.25em] text-red-400">
            RESQAI
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Sign in to your emergency response account.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-gray-300"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none placeholder:text-gray-600 focus:border-red-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-gray-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none placeholder:text-gray-600 focus:border-red-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 px-4 py-3.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}