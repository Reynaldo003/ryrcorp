// src/lib/apiQR.js
import { http } from "./apiClient";

function construirFormData(payload = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, value);
  });

  return formData;
}

export const apiQR = {
  info: () => http("/api/qr/info/"),

  generarPermanente: (payload) =>
    http("/api/qr/generar-permanente/", {
      method: "POST",
      body: construirFormData(payload),
    }),
};
