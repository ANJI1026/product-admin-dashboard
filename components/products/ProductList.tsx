"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import axios from "axios";

import {
  deleteProduct,
  getCategories,
  getProducts,
  getProductsByCategory,
  searchProducts,
} from "@/services/product.service";

import {
  getDeletedProductIds,
  getStoredProducts,
  removeStoredProduct,
} from "@/lib/product-storage";

import { Product } from "@/types/product";

const DEFAULT_LIMIT = 10;

type Category = {
  slug: string;
  name: string;
  url: string;
};

export default function ProductList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const limitParam = Number(searchParams.get("limit"));

  const page =
    Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

  const limit = [10, 20, 50].includes(limitParam)
    ? limitParam
    : DEFAULT_LIMIT;

  const urlSearch = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  /*
   * Sync search box with URL.
   */
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  /*
   * Debounced search.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = searchInput.trim();

      if (value !== urlSearch) {
        updateUrl({
          search: value,
          page: "1",
        });
      }
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput, urlSearch]);

  /*
   * Load categories.
   */
  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const data = await getCategories();

        if (active) {
          setCategories(data);
        }
      } catch (err) {
        console.error(
          "Failed to load categories:",
          err
        );
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Load products.
   *
   * Important:
   * DummyJSON mutations are simulated/non-persistent.
   * Therefore localStorage is treated as part of the
   * application's product dataset.
   */
  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        /*
         * ---------------------------------------------
         * LOCAL PRODUCTS
         * ---------------------------------------------
         */
        const storedProducts = getStoredProducts();
        const deletedIds = getDeletedProductIds();
        const deletedSet = new Set(deletedIds);

        let localProducts = storedProducts.filter(
          (product) => !deletedSet.has(product.id)
        );

        /*
         * ---------------------------------------------
         * API PRODUCTS
         * ---------------------------------------------
         *
         * We fetch the complete relevant API dataset
         * when filtering/searching so that we can combine
         * it correctly with locally-created products.
         */
        let apiProducts: Product[] = [];
        let apiTotal = 0;

        const normalizedSearch =
          urlSearch.trim().toLowerCase();

        const normalizedCategory =
          category.trim().toLowerCase();

        if (normalizedCategory) {
          /*
           * Fetch the category dataset.
           *
           * limit=0 tells DummyJSON to return the
           * complete category dataset.
           */
          const data = await getProductsByCategory({
            category: normalizedCategory,
            limit: 0,
            skip: 0,
          });

          apiProducts = data.products;
          apiTotal = data.total;
        } else if (normalizedSearch) {
          /*
           * Search the complete API dataset.
           */
          const data = await searchProducts({
            query: urlSearch.trim(),
            limit: 0,
            skip: 0,
            signal: controller.signal,
          });

          apiProducts = data.products;
          apiTotal = data.total;
        } else {
          /*
           * No filters.
           *
           * Use the normal API pagination endpoint.
           */
          const data = await getProducts({
            limit,
            skip: (page - 1) * limit,
          });

          apiProducts = data.products;
          apiTotal = data.total;
        }

        if (controller.signal.aborted) {
          return;
        }

        /*
         * Remove locally deleted API products.
         */
        apiProducts = apiProducts.filter(
          (product) => !deletedSet.has(product.id)
        );

        /*
         * ---------------------------------------------
         * FILTER LOCAL PRODUCTS
         * ---------------------------------------------
         */

        if (normalizedSearch) {
          localProducts = localProducts.filter(
            (product) =>
              product.title
                .toLowerCase()
                .includes(normalizedSearch) ||
              product.description
                ?.toLowerCase()
                .includes(normalizedSearch)
          );
        }

        if (normalizedCategory) {
          localProducts = localProducts.filter(
            (product) =>
              product.category
                .trim()
                .toLowerCase() ===
              normalizedCategory
          );
        }

        /*
         * ---------------------------------------------
         * FILTER API PRODUCTS
         * ---------------------------------------------
         *
         * Category + search cannot be sent to DummyJSON
         * together, so apply search locally after the
         * category request.
         */
        if (normalizedSearch) {
          apiProducts = apiProducts.filter(
            (product) =>
              product.title
                .toLowerCase()
                .includes(normalizedSearch) ||
              product.description
                ?.toLowerCase()
                .includes(normalizedSearch)
          );
        }

        if (normalizedCategory) {
          apiProducts = apiProducts.filter(
            (product) =>
              product.category
                .trim()
                .toLowerCase() ===
              normalizedCategory
          );
        }

        /*
         * ---------------------------------------------
         * MERGE
         * ---------------------------------------------
         *
         * Local version wins if the same ID exists
         * in both datasets.
         */
        const productMap = new Map<number, Product>();

        for (const product of apiProducts) {
          productMap.set(product.id, product);
        }

        for (const product of localProducts) {
          productMap.set(product.id, product);
        }

        const combinedProducts = Array.from(
          productMap.values()
        );

        /*
         * ---------------------------------------------
         * SORT
         * ---------------------------------------------
         */
        if (sort === "price-asc") {
          combinedProducts.sort(
            (a, b) => a.price - b.price
          );
        }

        if (sort === "price-desc") {
          combinedProducts.sort(
            (a, b) => b.price - a.price
          );
        }

        if (sort === "rating-desc") {
          combinedProducts.sort(
            (a, b) =>
              (b.rating ?? 0) -
              (a.rating ?? 0)
          );
        }

        if (sort === "title-asc") {
          combinedProducts.sort((a, b) =>
            a.title.localeCompare(b.title)
          );
        }

        /*
         * ---------------------------------------------
         * PAGINATION
         * ---------------------------------------------
         *
         * If filters/search/local products are involved,
         * paginate the combined dataset.
         *
         * With no filters and no local products, the API
         * has already provided the correct page.
         */
        const hasClientDataset =
          Boolean(normalizedSearch) ||
          Boolean(normalizedCategory) ||
          Boolean(sort) ||
          localProducts.length > 0;

        let visibleProducts: Product[];
        let calculatedTotal: number;

        if (hasClientDataset) {
          const start = (page - 1) * limit;

          visibleProducts = combinedProducts.slice(
            start,
            start + limit
          );

          calculatedTotal =
            combinedProducts.length;
        } else {
          visibleProducts = combinedProducts;
          calculatedTotal = apiTotal;
        }

        setProducts(visibleProducts);
        setTotal(calculatedTotal);
      } catch (err) {
        if (
          axios.isCancel(err) ||
          (err instanceof Error &&
            "code" in err &&
            (err as { code?: string }).code ===
              "ERR_CANCELED")
        ) {
          return;
        }

        console.error(
          "Product loading failed:",
          err
        );

        setError(
          "Failed to load products. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    page,
    limit,
    urlSearch,
    category,
    sort,
  ]);

  /*
   * Final display sorting.
   */
  const visibleProducts = useMemo(() => {
    const result = [...products];

    if (sort === "price-asc") {
      result.sort(
        (a, b) => a.price - b.price
      );
    }

    if (sort === "price-desc") {
      result.sort(
        (a, b) => b.price - a.price
      );
    }

    if (sort === "rating-desc") {
      result.sort(
        (a, b) =>
          (b.rating ?? 0) -
          (a.rating ?? 0)
      );
    }

    if (sort === "title-asc") {
      result.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    return result;
  }, [products, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(total / limit)
  );

  const startNumber =
    total === 0
      ? 0
      : (page - 1) * limit + 1;

  const endNumber =
    total === 0
      ? 0
      : Math.min(page * limit, total);

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    updateUrl({
      category: event.target.value,
      page: "1",
    });
  };

  const handleSortChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    updateUrl({
      sort: event.target.value,
      page: "1",
    });
  };

  const handleLimitChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    updateUrl({
      limit: event.target.value,
      page: "1",
    });
  };

  const handleDelete = async (
    product: Product
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      /*
       * Local deletion is what makes the change
       * persistent in this frontend.
       */
      removeStoredProduct(product.id);

      /*
       * Also call DummyJSON mutation.
       */
      try {
        await deleteProduct(product.id);
      } catch (err) {
        console.error(
          "API delete failed:",
          err
        );
      }

      /*
       * Immediately remove from UI.
       */
      setProducts((current) =>
        current.filter(
          (item) => item.id !== product.id
        )
      );

      setTotal((current) =>
        Math.max(current - 1, 0)
      );
    } catch (err) {
      console.error(err);

      setError(
        "Failed to delete product."
      );
    }
  };

  const goToPage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    updateUrl({
      page: String(nextPage),
    });
  };

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </label>

            <select
              value={category}
              onChange={handleCategoryChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">
                All categories
              </option>

              {categories.map((item) => (
                <option
                  key={item.slug}
                  value={item.slug}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort
            </label>

            <select
              value={sort}
              onChange={handleSortChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">
                Default
              </option>

              <option value="price-asc">
                Price: Low to High
              </option>

              <option value="price-desc">
                Price: High to Low
              </option>

              <option value="rating-desc">
                Rating: High to Low
              </option>

              <option value="title-asc">
                Title: A to Z
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Per page
            </label>

            <select
              value={limit}
              onChange={handleLimitChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="10">
                10
              </option>

              <option value="20">
                20
              </option>

              <option value="50">
                50
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading products...
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        visibleProducts.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              No products found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}

      {/* Desktop */}
      {!loading &&
        visibleProducts.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Product
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Category
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Price
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Rating
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map(
                    (product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {product.thumbnail ? (
                                <Image
                                  src={
                                    product.thumbnail
                                  }
                                  alt={
                                    product.title
                                  }
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                  No image
                                </div>
                              )}
                            </div>

                            <div>
                              <Link
                                href={`/products/${product.id}`}
                                className="font-semibold text-slate-900 hover:text-blue-600"
                              >
                                {product.title}
                              </Link>

                              <p className="mt-0.5 text-xs text-slate-400">
                                ID:{" "}
                                {product.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 capitalize text-slate-600">
                          {product.category}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          ${product.price}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          ⭐{" "}
                          {product.rating ??
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {product.stock}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-3">
                            <Link
                              href={`/products/${product.id}`}
                              className="font-medium text-blue-600 hover:text-blue-700"
                            >
                              View
                            </Link>

                            <Link
                              href={`/products/${product.id}/edit`}
                              className="font-medium text-slate-600 hover:text-slate-900"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  product
                                )
                              }
                              className="font-medium text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Mobile */}
      {!loading &&
        visibleProducts.length > 0 && (
          <div className="space-y-4 md:hidden">
            {visibleProducts.map(
              (product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {product.thumbnail ? (
                        <Image
                          src={
                            product.thumbnail
                          }
                          alt={
                            product.title
                          }
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${product.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {product.title}
                      </Link>

                      <p className="mt-1 text-sm capitalize text-slate-500">
                        {product.category}
                      </p>

                      <p className="mt-2 font-semibold text-slate-900">
                        ${product.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">
                        Rating
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        ⭐{" "}
                        {product.rating ??
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Stock
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4 border-t border-slate-100 pt-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-sm font-semibold text-blue-600"
                    >
                      View
                    </Link>

                    <Link
                      href={`/products/${product.id}/edit`}
                      className="text-sm font-semibold text-slate-600"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          product
                        )
                      }
                      className="text-sm font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {startNumber}–{endNumber}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {total}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                goToPage(page - 1)
              }
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                {
                  length: Math.min(
                    totalPages,
                    5
                  ),
                },
                (_, index) => {
                  let pageNumber =
                    index + 1;

                  if (
                    totalPages > 5 &&
                    page > 3
                  ) {
                    pageNumber =
                      page - 2 + index;
                  }

                  if (
                    pageNumber >
                    totalPages
                  ) {
                    return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() =>
                        goToPage(
                          pageNumber
                        )
                      }
                      className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium ${
                        pageNumber ===
                        page
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                goToPage(page + 1)
              }
              disabled={
                page >= totalPages
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <p className="text-sm text-slate-500">
            Page{" "}
            <span className="font-semibold text-slate-700">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {totalPages}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}