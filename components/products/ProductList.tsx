"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/services/product.service";
import { Product } from "@/types/product";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getProducts({
          limit: 10,
          skip: 0,
        });

        setProducts(data.products);
      } catch (error) {
        console.error(error);
        setError("Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

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

  return (
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
  );
}