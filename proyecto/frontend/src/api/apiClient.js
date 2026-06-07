const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Error en la petición");
    error.details = data?.errors || data?.details || [];
    error.status = response.status;
    throw error;
  }

  return data;
};