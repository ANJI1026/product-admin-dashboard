"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { deleteProduct, getProductById } from "@/services/product.service";
import { Product } from "@/types/product";
import {
  getDeletedProductIds,
  getStoredProducts,
  removeStoredProduct,
} from "@/lib/product-storage";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);
  const numericId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!Number.isInteger(numericId) || numericId <= 0) {
          setError("Product not found.");
          return;
        }

        // 1. Check deleted products first
        const deletedIds = getDeletedProductIds();

        if (deletedIds.includes(numericId)) {
          setError("Product not found.");
          return;
        }

        // 2. Check localStorage
        const storedProduct = getStoredProducts().find(
          (item) => item.id === numericId
        );

        if (storedProduct) {
          setProduct(storedProduct);
          setSelectedImage(
            storedProduct.images?.[0] || storedProduct.thumbnail || ""
          );
          return;
        }

        // 3. If not local, fetch from DummyJSON
        const data = await getProductById(numericId);

        setProduct(data);
        setSelectedImage(data.images?.[0] || data.thumbnail || "");
      } catch (error) {
        console.error(error);
        setError("Product not found.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [numericId]);

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed || !product) {
      return;
    }

    try {
      setIsDeleting(true);

      const storedProduct = getStoredProducts().find(
        (item) => item.id === product.id
      );

      // Locally created products don't exist on DummyJSON,
      // so don't call the API for them.
      if (!storedProduct) {
        await deleteProduct(product.id);
      }

      removeStoredProduct(product.id);

      router.push("/products");
    } catch (error) {
      console.error(error);
      setError("Failed to delete product.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-600">Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h1 className="text-2xl font-semibold text-gray-900">
              Product does not exist
            </h1>

            <p className="mt-2 text-gray-500">
              The product could not be found.
            </p>

            <button
              onClick={() => router.push("/products")}
              className="mt-6 rounded-md bg-black px-5 py-2 text-white"
            >
              Back to Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/products")}
          className="mb-6 text-sm text-gray-600 hover:text-black"
        >
          ← Back to Products
        </button>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Images */}
            <div>
              <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={product.title}
                    width={500}
                    height={500}
                    className="max-h-80 w-auto object-contain"
                  />
                ) : (
                  <span className="text-gray-400">No image available</span>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImage(image)}
                      className={`rounded-md border p-1 ${
                        selectedImage === image
                          ? "border-black"
                          : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        width={80}
                        height={80}
                        className="h-16 w-16 object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product information */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {product.title}
              </h1>

              <p className="mt-3 text-gray-500">{product.description}</p>

              <div className="mt-6 space-y-3">
                <p>
                  <span className="font-semibold">Category:</span>{" "}
                  {product.category}
                </p>

                <p>
                  <span className="font-semibold">Price:</span> $
                  {product.price}
                </p>

                <p>
                  <span className="font-semibold">Rating:</span>{" "}
                  {product.rating}
                </p>

                <p>
                  <span className="font-semibold">Stock:</span>{" "}
                  {product.stock}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => router.push(`/products/${product.id}/edit`)}
                  disabled={isDeleting}
                  className="rounded-md bg-black px-5 py-2 text-white disabled:opacity-50"
                >
                  Edit
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-md bg-red-600 px-5 py-2 text-white disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-10 border-t pt-8">
              <h2 className="text-xl font-semibold">Reviews</h2>

              <div className="mt-4 space-y-4">
                {product.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-200 p-4"
                  >
                    <p className="font-medium">
                      {review.reviewerName}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Rating: {review.rating}/5
                    </p>

                    <p className="mt-2 text-gray-700">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}