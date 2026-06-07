import { apiClient } from "../api/apiClient";

export const getWeeks = ({ summerCampId }) => {
  return apiClient(`/weeks?summerCampId=${summerCampId}`);
};

export const updateWeek = ({ summerCampId, number, payload }) => {
  return apiClient(`/weeks/${summerCampId}/${number}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const createWeek = (payload) => {
  return apiClient("/weeks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const deleteWeek = ({ summerCampId, number }) => {
  return apiClient(`/weeks/${summerCampId}/${number}`, {
    method: "DELETE",
  });
};