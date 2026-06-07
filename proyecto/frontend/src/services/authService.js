import { apiClient } from "../api/apiClient";

export const loginRequest = (credentials) => {
  return apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const getMe = () => {
  return apiClient("/auth/me");
};