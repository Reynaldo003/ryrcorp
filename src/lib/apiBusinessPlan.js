import { http, buildQuery } from "./apiClient";

const BASE = "/business-plan/api";
const OPCIONES = { auth: true, retryWithoutAuth: false };

function enviar(method, ruta, datos) {
  return http(`${BASE}${ruta}`, { ...OPCIONES, method, data: datos });
}

export const apiBusinessPlan = {
  listarTableros: (papelera = false) =>
    http(
      `${BASE}/tableros/${buildQuery({ papelera: papelera ? 1 : undefined })}`,
      OPCIONES,
    ),
  crearTablero: (nombre) => enviar("POST", "/tableros/", { nombre }),
  editarTablero: (id, nombre) =>
    enviar("PATCH", `/tableros/${id}/`, { nombre }),
  eliminarTablero: (id) => enviar("DELETE", `/tableros/${id}/`),
  restaurarTablero: (id) => enviar("POST", `/tableros/${id}/restaurar/`, {}),

  listarTemas: (tableroId) =>
    http(`${BASE}/temas/${buildQuery({ tablero: tableroId })}`, OPCIONES),
  crearTema: (tablero, nombre, subtitulo = "") =>
    enviar("POST", "/temas/", { tablero, nombre, subtitulo }),
  editarTema: (id, cambios) => enviar("PATCH", `/temas/${id}/`, cambios),
  eliminarTema: (id) => enviar("DELETE", `/temas/${id}/`),

  obtenerPeriodo: (temaId, anio) =>
    http(`${BASE}/temas/${temaId}/periodos/${anio}/`, OPCIONES),
  guardarPeriodo: (temaId, anio, { revision, filas, columnas }) =>
    enviar("PUT", `/temas/${temaId}/periodos/${anio}/`, {
      revision,
      filas,
      columnas,
    }),

  buscarUsuarios: (buscar) =>
    http(`${BASE}/usuarios/${buildQuery({ buscar })}`, OPCIONES),
  invitarTablero: (id, id_usuario, rol = "lector") =>
    enviar("POST", `/tableros/${id}/invitar/`, { id_usuario, rol }),
  invitarTema: (id, id_usuario, rol = "lector") =>
    enviar("POST", `/temas/${id}/invitar/`, { id_usuario, rol }),
  listarInvitaciones: () => http(`${BASE}/invitaciones/`, OPCIONES),
  responderInvitacion: (tipo, id, accion) =>
    enviar("POST", `/invitaciones/${tipo}/${id}/`, { accion }),
  listarColaboradoresTablero: (id) =>
    http(`${BASE}/tableros/${id}/colaboradores/`, OPCIONES),
  listarColaboradoresTema: (id) =>
    http(`${BASE}/temas/${id}/colaboradores/`, OPCIONES),
  revocarTablero: (id, usuarioId) =>
    enviar("DELETE", `/tableros/${id}/colaboradores/${usuarioId}/`),
  revocarTema: (id, usuarioId) =>
    enviar("DELETE", `/temas/${id}/colaboradores/${usuarioId}/`),
};
