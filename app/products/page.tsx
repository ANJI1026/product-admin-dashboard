"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ProductsPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold text-gray-900">
              Product Admin
            </h1>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Products
          </h2>

          <p className="mt-2 text-gray-500">
            Product dashboard coming next.
          </p>
        </section>
      </main>
    </ProtectedRoute>
  );
}