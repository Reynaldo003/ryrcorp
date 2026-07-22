// src/config/lineasWhatsApp.js
export const NUMERO_WHATSAPP_TUXTEPEC = "522871232641";

export const LINEAS_WHATSAPP = {
  522712638803: {
    key: "cordoba-ia",
    asesor_digital: "IA Vagen",
    agencia: "VW Cordoba",
    etiqueta: "Córdoba IA",
    compartida: false,
    asesores: [],
  },

  522721111244: {
    key: "orizaba",
    asesor_digital: "Lizbeth Cano Clara",
    agencia: "VW Orizaba",
    etiqueta: "VW Orizaba",
    compartida: false,
    asesores: [],
  },

  522713133332: {
    key: "cordoba",
    asesor_digital: "Erendira Santos Coyotzi",
    agencia: "VW Cordoba",
    etiqueta: "VW Córdoba",
    compartida: false,
    asesores: [],
  },

  522871232641: {
    key: "tuxtepec",
    asesor_digital: "Equipo Digital Tuxtepec",

    agencia: "VW Tuxtepec",
    etiqueta: "VW Tuxtepec",
    compartida: true,
    asesores: [
      {
        usuario: "ADTuxte",
        nombre: "Marelly Tenorio Salinas",
        activo: true,
      },
      {
        usuario: "julioRL",
        nombre: "Julio Ramirez Lopez",
        activo: true,
      },
    ],
  },

  527831263814: {
    key: "tuxpan",
    asesor_digital: "Edgar Omar Noguera Solis",
    agencia: "VW Tuxpan",
    etiqueta: "VW Tuxpan",
    compartida: false,
    asesores: [],
  },

  527821820706: {
    key: "poza-rica",
    asesor_digital: "Dulce Abigail Garcia Olivares",
    agencia: "VW Poza Rica",
    etiqueta: "VW Poza Rica",
    compartida: false,
    asesores: [],
  },

  522712837999: {
    key: "cordoba-usados",
    asesor_digital: "Bianca Chavez Alarcon",
    agencia: "VW Cordoba Usados",
    etiqueta: "Córdoba Usados",
    compartida: false,
    asesores: [],
  },

  522721986539: {
    key: "orizaba-usados",
    asesor_digital: "Candy Denisse Marquez",
    agencia: "VW Orizaba Usados",
    etiqueta: "Orizaba Usados",
    compartida: false,
    asesores: [],
  },
};

export function normalizarNumeroWhatsApp(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("521") && digits.length === 13) {
    return `52${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `52${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits;
  }

  return digits;
}

export function normalizarUsuarioCrm(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es-MX");
}

export function obtenerUsuarioCrm(user) {
  return String(
    user?.usuario ||
      user?.username ||
      user?.user ||
      user?.nombre_usuario ||
      user?.correo ||
      user?.email ||
      "",
  ).trim();
}

export function obtenerNumerosWhatsAppUsuario(user) {
  const raw =
    user?.telefonos_whatsapp ??
    user?.telefonos ??
    user?.telefono ??
    user?.numero_asesor ??
    user?.whatsapp_number ??
    "";

  const valores = Array.isArray(raw)
    ? raw
    : String(raw || "").split(/[|,;\n]+/);

  return [
    ...new Set(
      valores
        .map(normalizarNumeroWhatsApp)
        .filter((numero) => /^52\d{10}$/.test(numero)),
    ),
  ];
}

export function obtenerContextoLinea(numero) {
  const normalizado = normalizarNumeroWhatsApp(numero);

  return LINEAS_WHATSAPP[normalizado] || null;
}

export function lineaWhatsAppEsCompartida(numero) {
  const contexto = obtenerContextoLinea(numero);

  return Boolean(contexto?.compartida);
}

export function obtenerAsesorLineaParaUsuario(numero, user) {
  const contexto = obtenerContextoLinea(numero);

  if (!contexto) {
    return null;
  }
  if (!contexto.compartida) {
    return {
      usuario: obtenerUsuarioCrm(user),
      nombre: contexto.asesor_digital || "",
      activo: true,
    };
  }

  const usuarioActual = normalizarUsuarioCrm(obtenerUsuarioCrm(user));

  if (!usuarioActual) {
    return null;
  }

  return (
    contexto.asesores?.find(
      (asesor) =>
        asesor?.activo !== false &&
        normalizarUsuarioCrm(asesor?.usuario) === usuarioActual,
    ) || null
  );
}

export function obtenerEtiquetaLinea(numero) {
  const normalizado = normalizarNumeroWhatsApp(numero);
  const contexto = LINEAS_WHATSAPP[normalizado];

  return contexto?.etiqueta || contexto?.agencia || normalizado;
}

export function obtenerNombreAsesorSesion(numero, user) {
  const asesor = obtenerAsesorLineaParaUsuario(numero, user);

  return asesor?.nombre || "";
}
