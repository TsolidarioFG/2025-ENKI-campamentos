import { apiClient } from "../api/apiClient";

export const updateSignedUpStatus = ({
  inscriptionId,
  weekId,
  newState,
  paymentModeForNewReservation,
}) => {
  return apiClient(
    `/signedup/inscription/${inscriptionId}/week/${weekId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        newState,
        ...(paymentModeForNewReservation && {
          paymentModeForNewReservation,
        }),
      }),
    }
  );
};

export const getSignedUpsByWeek = (weekId, filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });

  const query = params.toString();

  return apiClient(`/signedup/week/${weekId}${query ? `?${query}` : ""}`);
};

export const getWeekWaitlist = (weekId) => {
  return apiClient(`/signedup/week/${weekId}/waitlist`);
};

export const cancelExpiredPendingSignedUps = () => {
  return apiClient("/signedup/cancel-expired", {
    method: "POST",
  });
};