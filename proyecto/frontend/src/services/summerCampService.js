import { apiClient } from "../api/apiClient";

export const getSummerCamps = () => {
  return apiClient("/summercamps");
};

export const getSummerCamp = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });

  const query = params.toString();

  return apiClient(`/summercamps/search${query ? `?${query}` : ""}`);
};

export const createSummerCamp = (payload) => {
  return apiClient("/summercamps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateSummerCamp = (id, payload) => {
  return apiClient(`/summercamps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteSummerCamp = (id) => {
  return apiClient(`/summercamps/${id}`, {
    method: "DELETE",
  });
};

export const getWeeks = ({ summerCampId }) => {
  return apiClient(`/weeks?summerCampId=${summerCampId}`);
};

export const getPublicSummerCampByYear = (year) => {
  return apiClient(`/summercamps/public/${year}`);
};