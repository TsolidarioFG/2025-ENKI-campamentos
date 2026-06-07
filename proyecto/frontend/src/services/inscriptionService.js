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

export const createInscription = (payload) => {
  return apiClient("/inscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getInscriptions = (filters = {}) => {
  return apiClient(`/inscriptions${buildQueryString(filters)}`);
};

export const getInscriptionById = (id) => {
  return apiClient(`/inscriptions/${id}`);
};
export const updateInscriptionDetails = (id, payload) => {
  return apiClient(`/inscriptions/${id}/details`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};