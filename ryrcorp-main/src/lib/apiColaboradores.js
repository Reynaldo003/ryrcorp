import { buildQuery, http } from "./apiClient";

const ENDPOINT = "/api/rrhh/colaboradores/";

export async function obtenerColaboradores({ agencia, buscar } = {}) {
  return await http(
    `${ENDPOINT}${buildQuery({
      agencia,
      buscar,
    })}`
  );
}

export async function obtenerColaborador(idColaborador) {
  return await http(`${ENDPOINT}${idColaborador}/`);
}

export async function crearColaborador(datos) {
  return await http(ENDPOINT, {
    method: "POST",
    body: datos,
  });
}

export async function actualizarColaborador(idColaborador, datos) {
  return await http(`${ENDPOINT}${idColaborador}/`, {
    method: "PATCH",
    body: datos,
  });
}

export async function eliminarColaborador(idColaborador) {
  await http(`${ENDPOINT}${idColaborador}/`, {
    method: "DELETE",
  });

  return { ok: true };
}

// ↓↓↓ NUEVO — agrégalo aquí, al final del archivo ↓↓↓

export async function darDeBajaColaborador(idColaborador, datos) {
  return await http(`${ENDPOINT}${idColaborador}/dar_baja/`, {
    method: "POST",
    body: datos,
  });
}