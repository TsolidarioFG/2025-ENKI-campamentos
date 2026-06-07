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

export const getPayments = (filters = {}) => {
  return apiClient(`/payments${buildQueryString(filters)}`);
};

export const getPaymentById = (id) => {
  return apiClient(`/payments/${id}`);
};

export const createExtraPayment = (payload) => {
  return apiClient("/payments/extra", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const registerPayment = (id, payload) => {
  return apiClient(`/payments/${id}/pay`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};