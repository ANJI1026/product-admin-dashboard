"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getProducts } from "@/services/product.service";
import { Product } from "@/types/product";

const DEFAULT_LIMIT = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ProductList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(
    1,
    Number(searchParams.get("page")) || 1
  );

  const limit = PAGE_SIZE_OPTIONS.includes(
    Number(searchParams.get("limit"))
  )
    ? Number(searchParams.get("limit"))
    : DEFAULT_LIMIT;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getProducts({
          limit,
          skip,
        });

        setProducts(data.products);
        setTotal(data.total);
      } catch (error) {
        console.error(error);
        setError("Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [limit, skip]);

  const updateUrl = (nextPage: number, nextLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(nextPage));
    params.set("limit", String(nextLimit));

    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    updateUrl(nextPage, limit);
  };

  const handleLimitChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextLimit = Number(event.target.value);

    updateUrl(1, nextLimit);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-red-600">{error}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  const firstItem = skip + 1;
  const lastItem = Math.min(skip + products.length, total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Products per page:

          <select
            value={limit}
            onChange={handleLimitChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Stock</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-12 w-12 rounded-lg object-cover"
                      />

                      <span className="font-medium text-gray-900">
                        {product.title}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.category}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.rating.toFixed(1)}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing {firstItem}–{lastItem} of {total}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}