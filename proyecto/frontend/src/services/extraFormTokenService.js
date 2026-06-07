import { apiClient } from "../api/apiClient";

export const createExtraFormToken = (participantId) => {
  return apiClient(`/extraform-tokens/participant/${participantId}`, {
    method: "POST",
  });
};

export const getExtraFormByToken = (token) => {
  return apiClient(`/extraform-tokens/public/${token}`);
};

export const updateExtraFormByToken = (token, payload) => {
  return apiClient(`/extraform-tokens/public/${token}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};