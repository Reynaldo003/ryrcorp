// src/lib/apiPedidosPiezas.js
import { buildQuery, http } from "./apiClient";

export const apiPedidosPiezas = {
  listPedidos: (params = {}) =>
    http(`/api/pedidos-piezas/pedidos/${buildQuery(params)}`),

  getPedido: (id) => http(`/api/pedidos-piezas/pedidos/${id}/`),

  createPedido: (payload) =>
    http("/api/pedidos-piezas/pedidos/", {
      method: "POST",
      body: payload,
    }),

  updatePedido: (id, payload) =>
    http(`/api/pedidos-piezas/pedidos/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patchPedido: (id, payload) =>
    http(`/api/pedidos-piezas/pedidos/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  deletePedido: (id) =>
    http(`/api/pedidos-piezas/pedidos/${id}/`, {
      method: "DELETE",
    }),

  listPiezas: (q = "") =>
    http(`/api/pedidos-piezas/piezas/${buildQuery({ q })}`),

  createPieza: (payload) =>
    http("/api/pedidos-piezas/piezas/", {
      method: "POST",
      body: payload,
    }),

  updatePieza: (id, payload) =>
    http(`/api/pedidos-piezas/piezas/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  deletePieza: (id) =>
    http(`/api/pedidos-piezas/piezas/${id}/`, {
      method: "DELETE",
    }),
};
