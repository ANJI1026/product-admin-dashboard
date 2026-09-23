"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  getProducts,
  searchProducts,
  getCategories,
  getProductsByCategory,
} from "@/services/product.service";

import { Product } from "@/types/product";

import {
  getDeletedProductIds,
  getStoredProducts,
} from "@/lib/product-storage";

const DEFAULT_LIMIT = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ProductList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
   * Read page from URL.
   */
  const requestedPage = Number(searchParams.get("page"));

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  /*
   * Read page size from URL.
   */
  const requestedLimit = Number(searchParams.get("limit"));

  const limit = PAGE_SIZE_OPTIONS.includes(requestedLimit)
    ? requestedLimit
    : DEFAULT_LIMIT;

  /*
   * Search value comes from URL.
   */
  const searchQuery = searchParams.get("search") || "";

  /*
   * Category and sort come from URL.
   */
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  /*
   * Product state.
   */
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  /*
   * Search input is local while typing.
   */
  const [searchInput, setSearchInput] = useState(searchQuery);

  /*
   * Categories.
   */
  const [categories, setCategories] = useState<
    { slug: string; name: string; url: string }[]
  >([]);

  /*
   * Pagination.
   */
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  /*
   * Load categories.
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  /*
   * Debounced search.
   */
  useEffect(() => {
    if (searchInput === searchQuery) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    }, 600);

    return () => clearTimeout(timer);
  }, [
    searchInput,
    searchQuery,
    pathname,
    router,
    searchParams,
  ]);

  /*
   * Load products.
   */
  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        let data;

        /*
         * Category search.
         */
        if (category) {
          data = await getProductsByCategory({
            category,
            limit,
            skip,
          });
        }
        /*
         * Text search.
         */
        else if (searchQuery.trim()) {
          data = await searchProducts({
            query: searchQuery.trim(),
            limit,
            skip,
            signal: controller.signal,
          });
        }
        /*
         * Normal product list.
         */
        else {
          data = await getProducts({
            limit,
            skip,
          });
        }

        if (controller.signal.aborted) {
          return;
        }

        /*
         * Products created/edited locally.
         */
        const storedProducts = getStoredProducts();

        /*
         * Products deleted locally.
         */
        const deletedProductIds = getDeletedProductIds();

        /*
         * Remove deleted products from API results.
         */
        const filteredApiProducts = data.products.filter(
          (product) => !deletedProductIds.includes(product.id)
        );

        /*
         * Remove deleted products from local storage.
         */
        const localProducts = storedProducts.filter(
          (product) => !deletedProductIds.includes(product.id)
        );

        /*
         * Match local products against search.
         */
        const query = searchQuery.trim().toLowerCase();

        const matchingLocalProducts = query
          ? localProducts.filter((product) => {
              const title = product.title.toLowerCase();
              const description =
                product.description?.toLowerCase() || "";
              const categoryName =
                product.category?.toLowerCase() || "";

              return (
                title.includes(query) ||
                description.includes(query) ||
                categoryName.includes(query)
              );
            })
          : localProducts;

        /*
         * When category filter is active,
         * only include matching local products.
         */
        const categoryFilteredLocalProducts = category
          ? matchingLocalProducts.filter(
              (product) => product.category === category
            )
          : matchingLocalProducts;

        /*
         * Merge local products with API products.
         *
         * Local version wins when the same ID exists.
         */
        const mergedProducts = [
          ...categoryFilteredLocalProducts,
          ...filteredApiProducts.filter(
            (apiProduct) =>
              !categoryFilteredLocalProducts.some(
                (localProduct) =>
                  localProduct.id === apiProduct.id
              )
          ),
        ];

        /*
         * Remove duplicate products by ID.
         */
        const uniqueProducts = Array.from(
          new Map(
            mergedProducts.map((product) => [
              product.id,
              product,
            ])
          ).values()
        );

        /*
         * Apply pagination AFTER merging API + local products.
         */
        const start = skip;
        const end = start + limit;

        const paginatedProducts = uniqueProducts.slice(
          start,
          end
        );

        /*
         * Total must represent the merged dataset.
         */
        const mergedTotal = uniqueProducts.length;

        /*
         * Update UI.
         */
        if (!controller.signal.aborted) {
          setProducts(paginatedProducts);
          setTotal(mergedTotal);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load products:", error);
          setError("Failed to load products.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    /*
     * Small delay before loading data.
     */
    const timer = setTimeout(loadProducts, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    limit,
    skip,
    searchQuery,
    category,
    retryCount,
  ]);

  /*
   * If page is larger than available pages,
   * move to the last valid page.
   */
  useEffect(() => {
    if (totalPages === 0) {
      return;
    }

    if (page > totalPages) {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      params.set("page", String(totalPages));

      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [
    page,
    totalPages,
    pathname,
    router,
    searchParams,
  ]);

  /*
   * Update pagination values in URL.
   */
  const updateUrl = (
    nextPage: number,
    nextLimit: number
  ) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("page", String(nextPage));
    params.set("limit", String(nextLimit));

    router.push(`${pathname}?${params.toString()}`);
  };

  /*
   * Search input handler.
   */
  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchInput(event.target.value);
  };

  /*
   * Category handler.
   */
  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextCategory = event.target.value;

    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (nextCategory) {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  /*
   * Page change.
   */
  const handlePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    updateUrl(nextPage, limit);
  };

  /*
   * Page size change.
   */
  const handleLimitChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextLimit = Number(event.target.value);

    updateUrl(1, nextLimit);
  };

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />

        <p className="mt-4 text-sm text-gray-600">
          Loading products...
        </p>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-red-800">
          Something went wrong
        </h3>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            setRetryCount((count) => count + 1)
          }
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  /*
   * Empty state.
   */
  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          No products found
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Try changing your search or filter.
        </p>
      </div>
    );
  }

  /*
   * Client-side sorting.
   */
  const sortedProducts = [...products].sort(
    (a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;

        case "price-desc":
          return b.price - a.price;

        case "rating-desc":
          return b.rating - a.rating;

        case "title-asc":
          return a.title.localeCompare(b.title);

        case "title-desc":
          return b.title.localeCompare(a.title);

        default:
          return 0;
      }
    }
  );

  /*
   * Showing X-Y of Z.
   */
  const firstItem = skip + 1;

  const lastItem = Math.min(
    skip + products.length,
    total
  );

  /*
   * Page numbers.
   */
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="w-full sm:max-w-md">
          <label
            htmlFor="product-search"
            className="sr-only"
          >
            Search products
          </label>

          <input
            id="product-search"
            type="search"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Category + Sort */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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

          {/* Sort */}
          <div>
            <label
              htmlFor="sort"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Sort by
            </label>

            <select
              id="sort"
              value={sort}
              onChange={(event) => {
                const nextSort = event.target.value;

                const params = new URLSearchParams(
                  searchParams.toString()
                );

                if (nextSort) {
                  params.set("sort", nextSort);
                } else {
                  params.delete("sort");
                }

                params.set("page", "1");

                router.push(
                  `${pathname}?${params.toString()}`
                );
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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

              <option value="title-desc">
                Title: Z to A
              </option>
            </select>
          </div>
        </div>

        {/* Products per page */}
        <div className="flex justify-end">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Products per page:

            <select
              value={limit}
              onChange={handleLimitChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Products */}
<div>
  {/* Desktop table */}
  <div className="hidden overflow-hidden rounded-lg bg-white shadow-sm md:block">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-gray-600">
          <tr>
            <th className="px-6 py-4 font-medium">
              Product
            </th>

            <th className="px-6 py-4 font-medium">
              Category
            </th>

            <th className="px-6 py-4 font-medium">
              Price
            </th>

            <th className="px-6 py-4 font-medium">
              Rating
            </th>

            <th className="px-6 py-4 font-medium">
              Stock
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {sortedProducts.map((product) => (
            <tr
              key={product.id}
              onClick={() =>
                router.push(`/products/${product.id}`)
              }
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {product.thumbnail ||
                  product.images?.[0] ? (
                    <Image
                      src={
                        product.thumbnail ||
                        product.images?.[0] ||
                        ""
                      }
                      alt={product.title}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      No image
                    </div>
                  )}

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
                {Number(product.rating || 0).toFixed(1)}
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

  {/* Mobile cards */}
  <div className="space-y-3 md:hidden">
    {sortedProducts.map((product) => (
      <button
        key={product.id}
        type="button"
        onClick={() =>
          router.push(`/products/${product.id}`)
        }
        className="w-full rounded-lg bg-white p-4 text-left shadow-sm transition hover:bg-gray-50"
      >
        <div className="flex gap-4">
          {/* Product image */}
          {product.thumbnail ||
          product.images?.[0] ? (
            <Image
              src={
                product.thumbnail ||
                product.images?.[0] ||
                ""
              }
              alt={product.title}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
              No image
            </div>
          )}

          {/* Product details */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-gray-900">
              {product.title}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {product.category}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500">
                  Price
                </span>

                <p className="font-medium text-gray-900">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              <div>
                <span className="text-gray-500">
                  Rating
                </span>

                <p className="font-medium text-gray-900">
                  {Number(product.rating || 0).toFixed(1)}
                </p>
              </div>

              <div>
                <span className="text-gray-500">
                  Stock
                </span>

                <p className="font-medium text-gray-900">
                  {product.stock}
                </p>
              </div>
            </div>
          </div>
        </div>
      </button>
    ))}
  </div>
</div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing {firstItem}–{lastItem} of {total}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Previous */}
          <button
            type="button"
            onClick={() =>
              handlePageChange(page - 1)
            }
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {/* Page numbers */}
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() =>
                handlePageChange(pageNumber)
              }
              className={`rounded-lg border px-3 py-2 text-sm ${
                pageNumber === page
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          {/* Next */}
          <button
            type="button"
            onClick={() =>
              handlePageChange(page + 1)
            }
            disabled={
              page === totalPages
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}