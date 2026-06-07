import { apiClient } from "../api/apiClient";

export const getAppSettings = () => {
  return apiClient("/settings");
};

export const updateAppSettings = async (payload) => {
  const result = await apiClient("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return result.settings;
};