import { apiClient } from "../api/apiClient";

export const getUsers = async () => {
  const result = await apiClient("/users");
  return result.users;
};

export const getUserById = async (id) => {
  return apiClient(`/users/${id}`);
};

export const createUser = async (payload) => {
  const result = await apiClient("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result.user;
};

export const updateUser = async (id, payload) => {
  const result = await apiClient(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return result.user;
};

export const updateUserStatus = async (id, active) => {
  const result = await apiClient(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });

  return result.user;
};

export const deleteUser = async (id) => {
  const result = await apiClient(`/users/${id}`, {
    method: "DELETE",
  });

  return result.user;
};
export const getOwnProfile = () => {
  return apiClient("/users/me/profile");
};

export const updateOwnProfile = async (payload) => {
  const result = await apiClient("/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return result.user;
};