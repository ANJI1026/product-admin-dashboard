import api from "@/lib/axios";
import {
  Product,
  ProductListResponse,
} from "@/types/product";

export interface GetProductsParams {
  limit: number;
  skip: number;
}

export const getProducts = async ({
  limit,
  skip,
}: GetProductsParams): Promise<ProductListResponse> => {
  const response = await api.get<ProductListResponse>(
    "/products",
    {
      params: {
        limit,
        skip,
      },
    }
  );

  return response.data;
};

export const searchProducts = async ({
  query,
  limit,
  skip,
  signal,
}: {
  query: string;
  limit: number;
  skip: number;
  signal?: AbortSignal;
}): Promise<ProductListResponse> => {
  const response = await api.get<ProductListResponse>(
    "/products/search",
    {
      params: {
        q: query,
        limit,
        skip,
      },
      signal,
    }
  );

  return response.data;
};

export interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

export const getCategories =
  async (): Promise<ProductCategory[]> => {
    const response = await api.get<ProductCategory[]>(
      "/products/categories"
    );

    return response.data;
  };

export const getProductsByCategory = async ({
  category,
  limit,
  skip,
}: {
  category: string;
  limit: number;
  skip: number;
}): Promise<ProductListResponse> => {
  const response = await api.get<ProductListResponse>(
    `/products/category/${encodeURIComponent(category)}`,
    {
      params: {
        limit,
        skip,
      },
    }
  );

  return response.data;
};

export const getProductById = async (
  id: number
): Promise<Product> => {
  const response = await api.get<Product>(
    `/products/${id}`
  );

  return response.data;
};

export interface CreateProductInput {
  title: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

export const createProduct = async (
  data: CreateProductInput
): Promise<Product> => {
  const response = await api.post<Product>(
    "/products/add",
    data
  );

  return response.data;
};

export interface UpdateProductInput {
  title: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

export const updateProduct = async (
  id: number,
  data: UpdateProductInput
): Promise<Product> => {
  const response = await api.put<Product>(
    `/products/${id}`,
    data
  );

  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await api.delete(
    `/products/${id}`
  );

  return response.data;
};