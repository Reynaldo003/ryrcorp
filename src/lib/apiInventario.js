// src/lib/apiInventario.js
import { http, buildQuery } from "./apiClient";

const API_BASE = "/inventario";

function numero(valor) {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function lista(valor) {
  return Array.isArray(valor) ? valor : [];
}

function normalizarAgencia(item) {
  return {
    agencia: item.agencia,
    agenciaNombre: item.agenciaNombre ?? item.agencia,
    total: numero(item.total),
  };
}

function normalizarEstatus(item) {
  return {
    estatus: item.estatus,
    estatusNombre: item.estatusNombre ?? item.estatus,
    total: numero(item.total),
  };
}

function normalizarMarca(item) {
  return {
    marca: item.marca ?? "",
    familia: item.familia ?? "Sin familia",
    total: numero(item.total),
  };
}

function normalizarCondicion(item) {
  return {
    agencia: item.agencia,
    agenciaNombre: item.agenciaNombre ?? item.agencia,
    condicion: item.condicion,
    total: numero(item.total),
  };
}

function normalizarOrigen(item) {
  return {
    tipo: item.tipo,
    tipoNombre: item.tipoNombre ?? item.tipo,
    total: numero(item.total),
  };
}

export const apiInventario = {
  async getFiltros() {
    const data = await http(`${API_BASE}/filtros/`);
    return { agencias: lista(data?.agencias), estatus: lista(data?.estatus) };
  },

  // Una petición reemplaza las ocho llamadas anteriores de inventario.
  async getDashboard(filtros = {}) {
    const data = await http(`${API_BASE}/dashboard/${buildQuery(filtros)}`);
    return {
      vehiculos: lista(data?.data),
      porAgencia: lista(data?.porAgencia).map(normalizarAgencia),
      porEstatus: lista(data?.porEstatus).map(normalizarEstatus),
      porMarca: lista(data?.porMarca).map(normalizarMarca),
      nuevoUsado: lista(data?.nuevoUsado).map(normalizarCondicion),
      nacionalImportado: lista(data?.nacionalImportado).map(normalizarOrigen),
      costoTotal: numero(data?.costoTotal),
      antiguedad: lista(data?.antiguedad),
    };
  },

  // Se mantienen los métodos históricos para no romper otras pantallas.
  async getInventario(filtros = {}) {
    const data = await http(`${API_BASE}/${buildQuery(filtros)}`);
    return lista(data?.data);
  },
  async getPorAgencia(filtros = {}) {
    const data = await http(`${API_BASE}/por-agencia/${buildQuery(filtros)}`);
    return lista(data?.data).map(normalizarAgencia);
  },
  async getPorEstatus(filtros = {}) {
    const data = await http(`${API_BASE}/por-estatus/${buildQuery(filtros)}`);
    return lista(data?.data).map(normalizarEstatus);
  },
  async getPorMarca(filtros = {}) {
    const data = await http(`${API_BASE}/por-marca/${buildQuery(filtros)}`);
    return lista(data?.data).map(normalizarMarca);
  },
  async getNuevoUsado(filtros = {}) {
    const data = await http(`${API_BASE}/nuevo-usado/${buildQuery(filtros)}`);
    return lista(data?.data).map(normalizarCondicion);
  },
  async getNacionalImportado(filtros = {}) {
    const data = await http(
      `${API_BASE}/nacional-importado/${buildQuery(filtros)}`,
    );
    return lista(data?.data).map(normalizarOrigen);
  },
  async getCosto(filtros = {}) {
    const data = await http(`${API_BASE}/costo/${buildQuery(filtros)}`);
    return numero(data?.costo_total);
  },
  async getAntiguedad(filtros = {}) {
    const data = await http(`${API_BASE}/antiguedad/${buildQuery(filtros)}`);
    return lista(data?.data);
  },
};
