"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const data = await login({
        username,
        password,
      });

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      router.push("/products");
    } catch (error) {
      console.error(error);
      setError("Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.15fr_0.85fr]">
      {/* Left visual panel */}
      <section className="relative hidden overflow-hidden bg-[#07164d] lg:flex">
        {/* Glowing background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.55),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.5),transparent_35%)]" />

        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[70px] border-blue-400/10" />

        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full border-[90px] border-indigo-400/10" />

        {/* Decorative glass shapes */}
        <div className="absolute left-[12%] top-[18%] h-24 w-24 rotate-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md" />

        <div className="absolute bottom-[18%] right-[15%] h-32 w-32 -rotate-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-blue-700 shadow-xl">
                P
              </div>

              <span className="text-lg font-bold tracking-tight">
                Product Admin
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur">
              PRODUCT MANAGEMENT
            </div>

            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Manage your
              <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                products smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-blue-100/70">
              A simple workspace to search, organize, edit and manage your
              entire product catalog from one place.
            </p>

            {/* Floating mini dashboard */}
            <div className="mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-100/60">
                  PRODUCT OVERVIEW
                </span>

                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-blue-100/60">Products</p>
                  <p className="mt-1 text-xl font-bold text-white">194</p>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-blue-100/60">Categories</p>
                  <p className="mt-1 text-xl font-bold text-white">30+</p>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-blue-100/60">Status</p>
                  <p className="mt-1 text-sm font-bold text-emerald-300">
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-blue-100/40">
            Product Management Dashboard
          </p>
        </div>
      </section>

      {/* Login panel */}
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg">
              P
            </div>

            <span className="font-bold text-slate-900">
              Product Admin
            </span>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-blue-600">
              Welcome back
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your credentials to access your product dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Secure access to your product workspace
          </p>
        </div>
      </section>
    </main>
  );
}