"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/services/product.service";
import { saveStoredProduct } from "@/lib/product-storage";

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    stock: "",
  });

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setError("");

    if (!form.title.trim()) {
      setError("Product title is required.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0 ||
      !Number.isInteger(Number(form.stock))
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    try {
      setIsSaving(true);

      const createdProduct = await createProduct({
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category.trim(),
        stock: Number(form.stock),
      });
      
      saveStoredProduct(createdProduct);
      
      router.push("/products");
    } catch (error) {
      console.error(error);
      setError("Failed to create product. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mb-6 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Products
        </button>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Add Product
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Product title"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Price
                </label>

                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Stock
                </label>

                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>

              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Category"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={isSaving}
                rows={5}
                className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Product description"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Create Product"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}