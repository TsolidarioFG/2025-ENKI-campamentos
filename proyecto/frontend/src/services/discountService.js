import { apiClient } from "../api/apiClient";

export const getDiscounts = () => {
  return apiClient("/discounts");
};

export const createDiscount = (payload) => {
  return apiClient("/discounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateDiscount = (discountId, payload) => {
  return apiClient(`/discounts/${discountId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteDiscount = (discountId) => {
  return apiClient(`/discounts/${discountId}`, {
    method: "DELETE",
  });
};