import axios from "axios";

const api = axios.create({
  baseURL: "https://dummyjson.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("accessToken");

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    /*
     * AbortController cancellations are intentional.
     * Do not treat them as real API errors.
     */
    if (
      axios.isCancel(error) ||
      error.code === "ERR_CANCELED"
    ) {
      return Promise.reject(error);
    }

    if (error.response) {
      console.error(
        `API Error: ${error.response.status}`,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "Network error: No response received."
      );
    } else {
      console.error(
        "Request error:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;