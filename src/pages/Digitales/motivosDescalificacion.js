export const MOTIVOS_DESCALIFICACION_POR_CATEGORIA = [
    {
        key: "contacto",
        label: "Contacto",
        icon: "contacto",
        opciones: ["No responde", "Abandonó proceso", "Falta documentación", "Compra futura"],
    },
    {
        key: "desinteres",
        label: "Desinterés",
        icon: "desinteres",
        opciones: ["Sin interés", "Compró con competencia"],
    },
    {
        key: "financiamiento",
        label: "Financiamiento",
        icon: "financiamiento",
        opciones: ["Crédito no viable", "Sin capacidad / enganche"],
    },
    {
        key: "lead_invalido",
        label: "Lead inválido",
        icon: "lead_invalido",
        opciones: ["Datos incorrectos", "Duplicado"],
    },
    {
        key: "otro",
        label: "Otro",
        icon: "otro",
        opciones: ["Servicio", "Refacciones", "Busca trabajo", "Ofrece otros servicios"],
    },
];

export const MOTIVOS_DESCALIFICACION = MOTIVOS_DESCALIFICACION_POR_CATEGORIA.flatMap(
    (categoria) => categoria.opciones,
);

export function esMotivoEstandar(value) {
    return MOTIVOS_DESCALIFICACION.includes(String(value || "").trim());
}

export function encontrarCategoriaDeMotivo(value) {
    const v = String(value || "").trim();

    if (!v) return null;

    for (const categoria of MOTIVOS_DESCALIFICACION_POR_CATEGORIA) {
        if (categoria.opciones.includes(v)) return categoria.key;
    }

    return "otro";
}
