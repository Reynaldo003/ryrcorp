import { http } from "./apiClient";


function normalizarLista(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


export async function obtenerAsesores({
  activo = true,
  tipoAsesor = "",
  area = "",
  agencia = "",
} = {}) {
  const params = new URLSearchParams();

  if (activo === true || activo === false) {
    params.set(
      "activo",
      activo ? "true" : "false"
    );
  }

  if (tipoAsesor) {
    params.set(
      "tipo_asesor",
      String(tipoAsesor).trim()
    );
  }

  if (area) {
    params.set(
      "area",
      String(area).trim()
    );
  }

  if (agencia) {
    params.set(
      "agencia",
      String(agencia).trim()
    );
  }

  const query = params.toString();

  const data = await http(
    `/digitales/asesores/${query ? `?${query}` : ""}`
  );

  return normalizarLista(data);
}


export function obtenerNombreAsesor(asesor) {
  return String(
    asesor?.nombre || ""
  ).trim();
}


export function nombresUnicosAsesores(
  asesores = []
) {
  const vistos = new Set();
  const resultado = [];

  asesores.forEach((asesor) => {
    const nombre =
      typeof asesor === "string"
        ? asesor.trim()
        : obtenerNombreAsesor(asesor);

    if (!nombre) {
      return;
    }

    const llave = nombre.toLocaleLowerCase();

    if (vistos.has(llave)) {
      return;
    }

    vistos.add(llave);
    resultado.push(nombre);
  });

  return resultado;
}