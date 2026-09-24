"use client";

import { useRouter } from "next/navigation";
import ProductList from "./ProductList";

export default function ProductsPageContent() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.replace("/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* Royal blue background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -right-40 top-20 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-black text-white shadow-lg shadow-blue-600/20">
              P
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Product Admin
              </h1>

              <p className="text-xs text-slate-500">
                Manage your product catalog
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-white hover:shadow-md active:scale-[0.98]"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Dashboard
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View, search, filter, and manage your products.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/products/new")}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Add Product
          </button>
        </div>

        {/* Product workspace */}
        <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-300/30 backdrop-blur-xl sm:p-5">
          <ProductList />
        </div>
      </section>
    </main>
  );
}