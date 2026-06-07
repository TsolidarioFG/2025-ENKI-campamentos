import { apiClient } from "../api/apiClient";

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const getPrices = (filters = {}) => {
  return apiClient(`/prices${buildQueryString(filters)}`);
};

export const createPrice = (payload) => {
  return apiClient("/prices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updatePrice = (payload) => {
  return apiClient("/prices", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};