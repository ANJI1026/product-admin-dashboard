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
  const response = await api.get<ProductListResponse>("/products", {
    params: {
      limit,
      skip,
    },
  });

  return response.data;
};

export const getProductById = async (
  id: number
): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);

  return response.data;
};