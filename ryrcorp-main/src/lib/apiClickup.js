// src/lib/apiClickup.js
import { http } from "./apiClient";

const API_BASE = "/api/clickup";

function texto(valor) {
  return String(valor ?? "").trim();
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function normalizeTeam(team) {
  return {
    id: Number(team.id),
    name: team.nombre ?? "",
    nombre: team.nombre ?? "",
    description: team.descripcion ?? "",
    descripcion: team.descripcion ?? "",
    owner: team.propietario ?? null,
    created_at: team.creado_en ?? null,
  };
}

function normalizeMember(item) {
  const u = item.usuario || {};

  return {
    id: Number(item.id),
    team: Number(item.equipo),
    role: item.rol,
    active: Boolean(item.activo),
    joined_at: item.unido_en,
    user: u,
    user_id: Number(u.id_usuario),
    name:
      u.nombre_completo ||
      [u.nombre, u.apellidos].filter(Boolean).join(" ").trim() ||
      u.correo ||
      "Miembro",
    email: u.correo || "",
  };
}

function normalizeInvite(item) {
  const u = item.usuario_invitado || {};

  return {
    id: Number(item.id),
    team: Number(item.equipo),
    email: item.correo || u.correo || "",
    role: item.rol,
    status: item.estado,
    created_at: item.creado_en,
    expires_at: item.expira_en,
    accepted_at: item.aceptado_en || null,
    invited_user: item.usuario_invitado
      ? {
          id: Number(u.id_usuario),
          name:
            u.nombre_completo ||
            [u.nombre, u.apellidos].filter(Boolean).join(" ").trim() ||
            u.correo ||
            "Usuario",
          email: u.correo || "",
          username: u.usuario || "",
        }
      : null,
  };
}

function normalizeProject(project) {
  return {
    id: Number(project.id),
    team: Number(project.equipo),
    name: project.nombre ?? "",
    nombre: project.nombre ?? "",
    description: project.descripcion ?? "",
    descripcion: project.descripcion ?? "",
    color: project.color ?? "#64748b",
    created_at: project.creado_en ?? null,
  };
}

function normalizeList(list) {
  return {
    id: Number(list.id),
    project: Number(list.proyecto),
    name: list.nombre ?? "",
    nombre: list.nombre ?? "",
    order: Number(list.orden ?? 0),
  };
}

function normalizeEvidence(item) {
  return {
    id: Number(item.id),
    type: item.tipo,
    tipo: item.tipo,
    comment: item.comentario || "",
    comentario: item.comentario || "",
    file_url: item.archivo_url || "",
    archivo_url: item.archivo_url || "",
    created_at: item.creado_en,
    uploaded_by: item.subido_por
      ? {
          id: Number(item.subido_por.id_usuario),
          name:
            item.subido_por.nombre_completo ||
            [item.subido_por.nombre, item.subido_por.apellidos]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            item.subido_por.correo ||
            "Usuario",
          email: item.subido_por.correo || "",
        }
      : null,
  };
}

function normalizeTask(task, listsMap = {}) {
  const listId = Number(task.lista);

  return {
    id: Number(task.id),
    list: listId,
    list_id: listId,
    list_name: listsMap[listId]?.name || task.lista_nombre || "",
    title: task.titulo ?? "",
    titulo: task.titulo ?? "",
    description: task.descripcion ?? "",
    descripcion: task.descripcion ?? "",
    priority: task.prioridad ?? "MEDIUM",
    prioridad: task.prioridad ?? "MEDIUM",
    estado: task.estado ?? "",
    created_at: task.creada ?? null,
    start_date: task.start_date ?? task.inicio ?? null,
    due_date: task.due_date ?? task.vence ?? null,
    inicio: task.inicio ?? null,
    vence: task.vence ?? null,
    order: Number(task.orden ?? 0),
    created_by: task.creado_por ?? null,
    bug_evidencias_count: Number(task.bug_evidencias_count ?? 0),
    resolution_evidencias_count: Number(task.resolution_evidencias_count ?? 0),

    descripcion_problema: task.descripcion_problema ?? "",
    causa: task.causa ?? "",
    raiz: task.raiz ?? "",
    desarrollo_estrategia: task.desarrollo_estrategia ?? "",
    resultados: task.resultados ?? "",

    subtareas: Array.isArray(task.subtareas)
      ? task.subtareas.map((s) => {
          const titulo = s.title ?? s.titulo ?? "";
          return {
            id: s.id,
            title: titulo,
            titulo,
            done: Boolean(s.done ?? s.completada ?? false),
            completada: Boolean(s.done ?? s.completada ?? false),
            start_date: s.start_date ?? null,
            due_date: s.due_date ?? null,
          };
        })
      : [],
      evidencias: Array.isArray(task.evidencias)
    ? task.evidencias.map((e) => ({
        id: Number(e.id),
        tipo: e.tipo,
        comentario: e.comentario || "",
        archivo_url: e.archivo_url || "",
        creado_en: e.creado_en,
        subido_por: e.subido_por || null,
    }))
    : [],

    report: task.reporte
      ? {
          id: Number(task.reporte.id),
          type: task.reporte.tipo,
          title: task.reporte.titulo,
          description: task.reporte.descripcion,
          status: task.reporte.estado,
          created_at: task.reporte.creado_en,
          updated_at: task.reporte.actualizado_en,
          resolved_at: task.reporte.resuelto_en,
        }
      : null,

    assigned: Array.isArray(task.asignados)
      ? task.asignados.map((a) => ({
          id: Number(a.id),
          user_id: Number(a.usuario?.id_usuario),
          name:
            a.usuario?.nombre_completo ||
            [a.usuario?.nombre, a.usuario?.apellidos]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            a.usuario?.correo ||
            "Usuario",
          email: a.usuario?.correo || "",
          username: a.usuario?.usuario || "",
        }))
      : [],
  };
}

function normalizeUser(user) {
  return {
    id: Number(user.id_usuario),
    name:
      user.nombre_completo ||
      [user.nombre, user.apellidos].filter(Boolean).join(" ").trim() ||
      user.correo ||
      "Usuario",
    email: user.correo || "",
    username: user.usuario || "",
    agencia: user.agencia || "",
  };
}

function normalizeNotification(item) {
  return {
    id: Number(item.id),
    type: item.tipo,
    title: item.titulo || "",
    message: item.mensaje || "",
    status: item.estado,
    created_at: item.creado_en,
    read_at: item.leido_en,
    team_id: item.equipo ? Number(item.equipo) : null,
    team_name: item.equipo_nombre || "",
    project_id: item.proyecto ? Number(item.proyecto) : null,
    project_name: item.proyecto_nombre || "",
    task_id: item.tarea ? Number(item.tarea) : null,
    task_title: item.tarea_titulo || "",
    invitation_id: item.invitacion ? Number(item.invitacion) : null,
  };
}

export const apiClickup = {
  async listTeams() {
    const data = await http(`${API_BASE}/equipos/`);
    return Array.isArray(data) ? data.map(normalizeTeam) : [];
  },

  async createTeam(payload) {
    const body = {
      nombre: texto(payload?.name || payload?.nombre),
      descripcion: texto(payload?.description || payload?.descripcion),
    };

    const data = await http(`${API_BASE}/equipos/`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return normalizeTeam(data);
  },

  async deleteTeam(teamId) {
    return await http(`${API_BASE}/equipos/${Number(teamId)}/`, {
      method: "DELETE",
    });
  },

  async listMembers(teamId) {
    const data = await http(`${API_BASE}/equipos/${Number(teamId)}/miembros/`);
    return Array.isArray(data) ? data.map(normalizeMember) : [];
  },

  async listInvites(teamId) {
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/invitaciones/`,
    );
    return Array.isArray(data) ? data.map(normalizeInvite) : [];
  },

  async invite(teamId, payload) {
    const body = {
      usuario_id: Number(payload?.usuario_id),
      rol: texto(payload?.rol || "MEMBER").toUpperCase(),
    };

    return await http(`${API_BASE}/equipos/${Number(teamId)}/invitar/`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async acceptInvite(teamId, invitationId) {
  // teamId se ignora, solo se necesita invitacion_id
  return await http(`${API_BASE}/equipos/aceptar/`, {
    method: "POST",
    body: JSON.stringify({ invitacion_id: Number(invitationId) }),
  });
},

  async rejectInvite(invitationId) {
    return await http(`${API_BASE}/equipos/rechazar/`, {
      method: "POST",
      body: JSON.stringify({ invitacion_id: Number(invitationId) }),
    });
  },

  async listProjects(teamId) {
    const data = await http(`${API_BASE}/equipos/${Number(teamId)}/proyectos/`);
    return Array.isArray(data) ? data.map(normalizeProject) : [];
  },

  async createProject(teamId, payload) {
    const body = {
      nombre: texto(payload?.name || payload?.nombre),
      descripcion: texto(payload?.description || payload?.descripcion),
      color: payload?.color || null,
    };

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    return normalizeProject(data);
  },

  async updateProject(teamId, projectId, payload) {
    const body = {
      nombre: texto(payload?.name || payload?.nombre),
      descripcion: texto(payload?.description || payload?.descripcion),
    };

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/${Number(projectId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );

    return normalizeProject(data);
  },

  async deleteProject(teamId, projectId) {
    return await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/${Number(projectId)}/`,
      { method: "DELETE" },
    );
  },

  async bootstrapProject(teamId, projectId) {
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/${Number(projectId)}/bootstrap/`,
      { method: "POST" },
    );

    return Array.isArray(data) ? data.map(normalizeList) : [];
  },

  async getBoard(teamId, projectId) {
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/?proyecto_id=${Number(projectId)}`,
    );

    const lists = Array.isArray(data?.listas)
      ? data.listas.map(normalizeList)
      : [];

    const listsMap = Object.fromEntries(lists.map((l) => [l.id, l]));
    const rawTasksByList = data?.tareas_por_lista || {};
    const tasks_by_list = {};

    for (const [listId, tasks] of Object.entries(rawTasksByList)) {
      tasks_by_list[Number(listId)] = Array.isArray(tasks)
        ? tasks.map((task) => normalizeTask(task, listsMap))
        : [];
    }

    return {
      project: data?.proyecto ? normalizeProject(data.proyecto) : null,
      lists,
      tasks_by_list,
    };
  },

  async moveTask(teamId, payload) {
    const body = {
      tarea_id: Number(payload.task_id),
      lista_destino_id: Number(payload.to_list_id),
      orden_destino: Number(payload.to_order ?? 0),
    };

    return await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/mover-tarea/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  async createTask(teamId, payload) {
    const body = {
      lista: Number(payload.lista),
      titulo: texto(payload.titulo),
      descripcion: texto(payload.descripcion),
      prioridad: texto(payload.prioridad || "MEDIUM").toUpperCase(),
      inicio: payload.inicio || null,
      vence: payload.vence || null,
      asignados_ids: Array.isArray(payload.asignados_ids)
        ? payload.asignados_ids.map(Number).filter(Number.isFinite)
        : [],
      descripcion_problema: payload.descripcion_problema || "",
      causa: payload.causa || "",
      raiz: payload.raiz || "",
      desarrollo_estrategia: payload.desarrollo_estrategia || "",
      resultados: payload.resultados || "",
      subtareas: Array.isArray(payload.subtareas)
  ? payload.subtareas.map((s) => ({
      titulo: texto(s.titulo || s.title),
      done: Boolean(s.done ?? s.completada ?? false),
    }))
  : [],
    };

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/crear-tarea/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    return normalizeTask(data);
  },

  async updateTask(teamId, taskId, payload) {
    const body = {};

    if ("lista" in payload) body.lista = Number(payload.lista);
    if ("titulo" in payload) body.titulo = texto(payload.titulo);
    if ("descripcion" in payload) body.descripcion = texto(payload.descripcion);
    if ("prioridad" in payload) {
      body.prioridad = texto(payload.prioridad || "MEDIUM").toUpperCase();
    }
    if ("inicio" in payload) body.inicio = payload.inicio || null;
    if ("vence" in payload) body.vence = payload.vence || null;
    if ("asignados_ids" in payload) {
      body.asignados_ids = Array.isArray(payload.asignados_ids)
        ? payload.asignados_ids.map(Number).filter(Number.isFinite)
        : [];
    }

    if ("descripcion_problema" in payload) {
      body.descripcion_problema = payload.descripcion_problema ?? "";
    }
    if ("causa" in payload) body.causa = payload.causa ?? "";
    if ("raiz" in payload) body.raiz = payload.raiz ?? "";
    if ("desarrollo_estrategia" in payload) {
      body.desarrollo_estrategia = payload.desarrollo_estrategia ?? "";
    }
    if ("resultados" in payload) body.resultados = payload.resultados ?? "";

   if ("subtareas" in payload) {
  body.subtareas = Array.isArray(payload.subtareas)
    ? payload.subtareas.map((s) => ({
        titulo: texto(s.titulo || s.title),
        done: Boolean(s.done ?? s.completada ?? false),
      }))
    : [];
    
}

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/tareas/${Number(taskId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );

    return normalizeTask(data);
  },

  async deleteTask(teamId, taskId) {
    return await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/tareas/${Number(taskId)}/eliminar/`,
      { method: "DELETE" },
    );
  },

  async uploadTaskEvidence(teamId, taskId, payload) {
    let formData;

    if (payload instanceof FormData) {
      formData = payload;
    } else {
      formData = new FormData();
      formData.append("tipo", payload?.tipo || "RESOLUTION");
      formData.append("comentario", payload?.comentario || "");

      const archivos = Array.isArray(payload?.archivos) ? payload.archivos : [];
      archivos.forEach((file) => {
        formData.append("archivos", file);
      });
    }

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/tareas/${Number(taskId)}/evidencias/`,
      {
        method: "POST",
        body: formData,
      },
    );

    return Array.isArray(data) ? data.map(normalizeEvidence) : [];
  },

  async searchUsers(q, limit = 10) {
    const data = await http(
      `${API_BASE}/usuarios/buscar/?q=${encodeURIComponent(q || "")}&limit=${Number(limit)}`,
    );

    return Array.isArray(data) ? data.map(normalizeUser) : [];
  },

  async createReport(payload) {
    const formData = new FormData();

    formData.append("tipo", texto(payload?.tipo || "BUG").toUpperCase());
    formData.append("titulo", texto(payload?.titulo));
    formData.append("descripcion", texto(payload?.descripcion));

    const imagenes = Array.isArray(payload?.imagenes) ? payload.imagenes : [];
    imagenes.forEach((file) => {
      formData.append("imagenes", file);
    });

    return await http(`${API_BASE}/reportes/`, {
      method: "POST",
      body: formData,
    });
  },

  async listNotifications() {
    const data = await http(`${API_BASE}/notificaciones/`);
    return Array.isArray(data) ? data.map(normalizeNotification) : [];
  },

  async dismissNotification(notificationId) {
    return await http(
      `${API_BASE}/notificaciones/${Number(notificationId)}/descartar/`,
      { method: "POST" },
    );
  },

  async readNotification(notificationId) {
    return await http(
      `${API_BASE}/notificaciones/${Number(notificationId)}/leer/`,
      { method: "POST" },
    );
  },

  // ========== FUNCIONES AGREGADAS PARA INVITACIONES Y MIEMBROS ==========

  async getTeamMembers(teamId) {
    const data = await http(`${API_BASE}/equipos/${Number(teamId)}/miembros/`);
    return Array.isArray(data) ? data.map(normalizeMember) : [];
  },

  async cancelInvite(teamId, inviteId) {
    return await http(`${API_BASE}/equipos/${Number(teamId)}/invitaciones/${Number(inviteId)}/cancelar/`, {
      method: "POST",
    });
  },

  async removeMember(teamId, userId) {
    return await http(`${API_BASE}/equipos/${Number(teamId)}/miembros/${Number(userId)}/eliminar/`, {
      method: "DELETE",
    });
  },

  async inviteToTeam(teamId, data) {
    return await this.invite(teamId, data);
  },

  async listUserInvites() {
    try {
      const data = await http(`${API_BASE}/invitaciones/`);
      if (!Array.isArray(data)) return [];
      return data
        .filter(inv => inv.estado === "PENDING")
        .map(inv => normalizeInvite(inv));
    } catch (e) {
      console.error("Error listUserInvites:", e);
      return [];
    }
  },
};