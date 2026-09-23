import { Product } from "@/types/product";

const STORAGE_KEY = "adminProducts";
const DELETED_KEY = "deletedProductIds";

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as Product[];
  } catch {
    return [];
  }
}

export function saveStoredProduct(product: Product): void {
  if (typeof window === "undefined") {
    return;
  }

  const products = getStoredProducts();

  const existingIndex = products.findIndex(
    (item) => item.id === product.id
  );

  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.unshift(product);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function removeStoredProduct(productId: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const products = getStoredProducts().filter(
    (product) => product.id !== productId
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

  const deletedIds = getDeletedProductIds();

  if (!deletedIds.includes(productId)) {
    deletedIds.push(productId);
  }

  localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
}

export function getDeletedProductIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(DELETED_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as number[];
  } catch {
    return [];
  }
}