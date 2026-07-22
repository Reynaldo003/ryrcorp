// src/lib/apiInventario.js
import { http, buildQuery } from "./apiClient";

const API_BASE = "/inventario";

function num(valor, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeAgenciaItem(item) {
  return {
    agencia: item.agencia,
    agenciaNombre: item.agenciaNombre ?? item.agencia,
    total: num(item.total),
  };
}

function normalizeEstatusItem(item) {
  return {
    estatus: item.estatus,
    estatusNombre: item.estatusNombre ?? item.estatus,
    total: num(item.total),
  };
}

function normalizeMarcaItem(item) {
  return {
    marca: item.marca ?? "",
    familia: item.familia ?? "Sin familia",
    total: num(item.total),
  };
}

function normalizeNuevoUsadoItem(item) {
  return {
    agencia: item.agencia,
    agenciaNombre: item.agenciaNombre ?? item.agencia,
    condicion: item.condicion,
    total: num(item.total),
  };
}

function normalizeNacionalImportadoItem(item) {
  return {
    tipo: item.tipo,
    tipoNombre: item.tipoNombre ?? item.tipo,
    total: num(item.total),
  };
}

export const apiInventario = {
  async getFiltros() {
    const data = await http(`${API_BASE}/filtros/`);
    return {
      agencias: Array.isArray(data?.agencias) ? data.agencias : [],
      estatus: Array.isArray(data?.estatus) ? data.estatus : [],
    };
  },

  async getInventario(filtros) {
    const data = await http(`${API_BASE}/${buildQuery(filtros)}`);
    return Array.isArray(data?.data) ? data.data : [];
  },

  async getPorAgencia(filtros) {
    const data = await http(`${API_BASE}/por-agencia/${buildQuery(filtros)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(normalizeAgenciaItem);
  },

  async getPorEstatus(filtros) {
    const data = await http(`${API_BASE}/por-estatus/${buildQuery(filtros)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(normalizeEstatusItem);
  },

  async getPorMarca(filtros) {
    const data = await http(`${API_BASE}/por-marca/${buildQuery(filtros)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(normalizeMarcaItem);
  },

  async getNuevoUsado(filtros) {
    const data = await http(`${API_BASE}/nuevo-usado/${buildQuery(filtros)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(normalizeNuevoUsadoItem);
  },

  async getNacionalImportado(filtros) {
    const data = await http(`${API_BASE}/nacional-importado/${buildQuery(filtros)}`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(normalizeNacionalImportadoItem);
  },
  async getCosto(filtros) {
    const data = await http(`${API_BASE}/costo/${buildQuery(filtros)}`);
    return typeof data?.costo_total === "number" ? data.costo_total : 0;
  },

  async getAntiguedad(filtros) {
    const data = await http(`${API_BASE}/antiguedad/${buildQuery(filtros)}`);
    return Array.isArray(data?.data) ? data.data : [];
  },

};