import { Suspense } from "react";
import ProductsPageContent from "@/components/products/ProductsPageContent";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-100">
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <h1 className="text-xl font-bold text-gray-900">
                Product Admin
              </h1>
            </div>
          </header>

          <section className="mx-auto max-w-7xl px-6 py-8">
            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">
                Loading products...
              </p>
            </div>
          </section>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}