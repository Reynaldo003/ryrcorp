// FORMATOS DE EVALUACIÓN POR PUESTO

export const FORMATOS_EVALUACION = {
    // === FORMATO TIPO ESCALA 1-5 (Excelente a Malo) ===
    
    "ASISTENTE DE SERVICIO": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 35,
        criterios: [
            "Gestión de citas",
            "Atención al cliente",
            "Seguimiento de unidades",
            "Control administrativo",
            "Calidad en el servicio",
            "Cumplimiento de procesos",
            "Trabajo en equipo y actitud"
        ]
    },
    
    "CONTACT CENTER": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 25,
        criterios: [
            "Orientación a resultados",
            "Actitud y compromiso",
            "Trabajo en equipo",
            "Conocimiento del producto",
            "Habilidad de comunicación"
        ]
    },
    
    "HOSTESS": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 25,
        criterios: [
            "Atención y servicio al cliente",
            "Control de piso",
            "Uso del Sales force",
            "Trabajo en equipo",
            "Comunicación efectiva"
        ]
    },
    
    "TECNICO MECANICO": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 50,
        criterios: [
            "Conocimientos técnicos",
            "Calidad del trabajo",
            "Productividad y uso del tiempo",
            "Diagnóstico de fallas",
            "Orden y limpieza",
            "Cumplimiento de normas de seguridad",
            "Trabajo en equipo",
            "Actitud y responsabilidad",
            "Atención a retrabajos y garantías",
            "Actualización y capacitación"
        ]
    },
    
    "ASESOR DE SERVICIO": {
        tipo: "semanal",
        unidades: ["semana 1", "semana 2", "semana 3", "semana 4"],
        criterios: [
            { nombre: "Entradas promedio", meta: null },
            { nombre: "Ticket promedio de M.O.", meta: null },
            { nombre: "Venta de adicionales", meta: null },
            { nombre: "J.D. Power satisfacción", meta: 5 },
            { nombre: "Inconformidades", meta: "0%" },
            { nombre: "Puntualidad", meta: "100%" },
            { nombre: "Faltas injustificadas", meta: "0%" },
            { nombre: "Porta el uniforme completo", meta: "100%" },
            { nombre: "Orden y limpieza de su área", meta: "100%" },
            { nombre: "Cumplimiento de cursos asignados", meta: "100%" },
            { nombre: "Asistencia a juntas", meta: "100%" },
            { nombre: "Asistencia a eventos", meta: "100%" }
        ]
    },
    
    "ASESOR DE VENTAS SEMINUEVOS": {
        tipo: "semanal",
        unidades: ["semana 1", "semana 2", "semana 3", "semana 4"],
        criterios: [
            { nombre: "Unidades facturadas", meta: null },
            { nombre: "Unidades entregadas", meta: null },
            { nombre: "Financiera (ingresado)", meta: null },
            { nombre: "Financiera (validado)", meta: null },
            { nombre: "Long drive", meta: null },
            { nombre: "Garantía extendida", meta: null },
            { nombre: "GAP", meta: null },
            { nombre: "Venta de seguro", meta: null },
            { nombre: "Avaluos", meta: null },
            { nombre: "Toma de usados", meta: null },
            { nombre: "Contratos de Afasa", meta: null },
            { nombre: "Pruebas de manejo", meta: null },
            { nombre: "J.D. Power (encuestas)", meta: null },
            { nombre: "J.D power (calificación)", meta: 5 },
            { nombre: "Citas remarketing", meta: null },
            { nombre: "Puntualidad", meta: "100%" },
            { nombre: "Asistencia a juntas", meta: "100%" },
            { nombre: "Asistencia a eventos", meta: "100%" },
            { nombre: "Orden y limpieza del área", meta: "100%" },
            { nombre: "Porta el uniforme completo", meta: "100%" }
        ]
    },
    
    "ASESOR DIGITAL": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 25,
        criterios: [
            "Cumplimiento de objetivos (facturación)",
            "Tiempo de respuesta y seguimiento",
            "Manejo de herramientas digitales (CRM, FB, etc)",
            "Atención al cliente",
            "Trabajo en equipo y comunicación interna"
        ]
    },
    
    "CONTROL DE CALIDAD": {
        tipo: "semanal",
        unidades: ["semana 1", "semana 2", "semana 3", "semana 4"],
        criterios: [
            { nombre: "Entrega de autos con las reparaciones correctas", meta: "100%" },
            { nombre: "Entrega de autos con trabajos o reparaciones completas", meta: "100%" },
            { nombre: "Reporte de análisis de reincidencias y áreas de mejora", meta: "100%" },
            { nombre: "Inconformidades", meta: "0%" },
            { nombre: "Orden y limpieza de su área de trabajo", meta: "100%" },
            { nombre: "Porta el uniforme completo y EPP completo", meta: "100%" },
            { nombre: "Puntualidad", meta: "100%" },
            { nombre: "Faltas injustificadas", meta: "0%" },
            { nombre: "Asistencia a eventos", meta: "100%" },
            { nombre: "Cumplimiento de cursos asignados", meta: "100%" },
            { nombre: "Asistencia a juntas", meta: "100%" }
        ]
    },
    
    "DESEMPEÑO CONTACT CENTER": {
        tipo: "semanal",
        unidades: ["semana 1", "semana 2", "semana 3", "semana 4"],
        criterios: [
            { nombre: "Citas agendadas", meta: null },
            { nombre: "Citas efectivas", meta: null },
            { nombre: "Seguimiento experiencia del cliente", meta: null },
            { nombre: "Orden y limpieza de su área de trabajo", meta: "100%" },
            { nombre: "Porta el uniforme completo", meta: "100%" },
            { nombre: "Puntualidad", meta: "100%" },
            { nombre: "Faltas injustificadas", meta: "0%" },
            { nombre: "Cumplimiento de cursos asignados", meta: "100%" },
            { nombre: "Asistencia a eventos", meta: "100%" },
            { nombre: "Asistencia a juntas", meta: "100%" }
        ]
    },
    
    "DESEMPEÑO LAVADOR": {
        tipo: "semanal",
        unidades: ["semana 1", "semana 2", "semana 3", "semana 4"],
        criterios: [
            { nombre: "Lava los vehículos cumpliendo los estándares de la marca", meta: "100%" },
            { nombre: "Insatisfacciones", meta: "0%" },
            { nombre: "Orden y limpieza de su área de trabajo", meta: "100%" },
            { nombre: "Porta el uniforme y EPP completo", meta: "100%" },
            { nombre: "Puntualidad", meta: "100%" },
            { nombre: "Faltas injustificadas", meta: "0%" },
            { nombre: "Asistencia a juntas", meta: "100%" }
        ]
    },
    
    "DESEMPEÑO TECNICO MECANICO": {
        tipo: "semanal",
        unidades: ["semana 1", "semana 2", "semana 3", "semana 4"],
        criterios: [
            { nombre: "Tiempo medio de reparación", meta: null },
            { nombre: "Lleva el registro de las operaciones efectuadas", meta: null },
            { nombre: "Tasa de resolución en la primera visita", meta: null },
            { nombre: "Insatisfacciones", meta: 0 },
            { nombre: "Protocolo de piezas desmontadas", meta: "100%" },
            { nombre: "Tareas completadas dentro del plazo", meta: "100%" },
            { nombre: "Informa defectos adicionales encontrados", meta: "100%" },
            { nombre: "Horas producidas", meta: null },
            { nombre: "Reparaciones repetidas / Tasa de retrabajo", meta: null },
            { nombre: "Orden y limpieza de su área de trabajo", meta: "100%" },
            { nombre: "Porta el uniforme y EPP completo", meta: "100%" },
            { nombre: "Puntualidad", meta: "100%" },
            { nombre: "Faltas injustificadas", meta: "0%" },
            { nombre: "Cumplimiento de cursos asignados", meta: "100%" },
            { nombre: "Asistencia a juntas", meta: "100%" }
        ]
    },
    
    "ASESOR HyP": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 35,
        criterios: [
            "Atención al cliente",
            "Seguimiento y gestión de las unidades",
            "Cumplimiento de objetivos",
            "Calidad administrativa",
            "Trabajo en equipo",
            "Organización y gestión del tiempo",
            "Conocimiento técnico"
        ]
    },
    
    "ESPECIALISTA DE ENTREGAS": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 35,
        criterios: [
            "Planificación de entregas",
            "Coordinación interdepartamental",
            "Supervisión de preparación del vehículo",
            "Gestión documental",
            "Atención y experiencia del cliente",
            "Resolución de problemas",
            "Trabajo en equipo y actitud"
        ]
    },
    
    "ENCARGADO DE ALMACEN": {
        tipo: "escala",
        escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
        maxPuntaje: 30,
        criterios: [
            "Exactitud del inventario",
            "Conteos cíclicos",
            "Recepción de refacciones",
            "Orden y organización del almacén",
            "Nivel de servicio a taller / ventas",
            "Trabajo en equipo y servicio interno"
        ]
    },
    
    "EVALUACION GENERAL RH TUXPAN": {
        tipo: "escala_10",
        escala: { 10: "Excelente", 9: "Muy bien", 8: "Bien", 7: "Bien", 6: "Regular", 5: "Regular", 4: "Malo", 3: "Malo", 2: "Muy mal", 1: "Muy mal", 0: "Muy mal" },
        maxPuntaje: 70,
        criterios: [
            "Calidad en el trabajo",
            "Cumplimiento de objetivos por sus responsabilidades",
            "Disciplina",
            "Puntualidad",
            "Asistencia",
            "Cooperación (trabajo en equipo)",
            "Seguimiento de instrucciones de trabajo por jefe inmediato"
        ]
    }
};

// Mapeo de qué puesto usa qué formato
export const FORMATO_POR_PUESTO = {
    "Asesor de ventas nuevos": "ASESOR DE VENTAS SEMINUEVOS",
    "Asesor de ventas seminuevos": "ASESOR DE VENTAS SEMINUEVOS",
    "Asistente de ventas": "ASISTENTE DE SERVICIO",
    "Servicios Financieros": "ASESOR HYP",
    "Coordinador de AFASA": "ASESOR HYP",
    "Preparador": "DESEMPEÑO TECNICO MECANICO",
    "Lavador": "DESEMPEÑO LAVADOR",
    "Cajera": "EVALUACION GENERAL RH TUXPAN",
    "Auxiliar contable": "EVALUACION GENERAL RH TUXPAN",
    "Contador General": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de ventas": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de Servicio": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de refacciones": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de postventa": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de HYP": "EVALUACION GENERAL RH TUXPAN",
    "Asesor de HYP": "ASESOR HYP",
    "Técnico Hojalatero": "DESEMPEÑO TECNICO MECANICO",
    "Técnico pintor": "DESEMPEÑO TECNICO MECANICO",
    "Técnico mecanico": "DESEMPEÑO TECNICO MECANICO",
    "Asesor de servicio": "ASESOR DE SERVICIO",
    "Asistente de servicio": "ASISTENTE DE SERVICIO",
    "Administrador de garantía": "DESEMPEÑO TECNICO MECANICO",
    "Jefe de taller": "DESEMPEÑO TECNICO MECANICO",
    "Técnico Master": "DESEMPEÑO TECNICO MECANICO",
    "Asesor de refacciones mostrador taller": "ENCARGADO DE ALMACEN",
    "Asesor de refacciones mostrador publico": "ENCARGADO DE ALMACEN",
    "Asesor de refacciones promotoria NORA": "ENCARGADO DE ALMACEN",
    "Encargado de almacen": "ENCARGADO DE ALMACEN",
    "Asesor de ventas digitales": "ASESOR DIGITAL",
    "Coordinador de ventas digitales": "ASESOR DIGITAL",
    "Auditor interno": "EVALUACION GENERAL RH TUXPAN",
    "Contador Fiscal": "EVALUACION GENERAL RH TUXPAN",
    "Gerente General": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de marketing": "EVALUACION GENERAL RH TUXPAN",
    "Consultor de procesos": "EVALUACION GENERAL RH TUXPAN",
    "Coordinador de marketing": "EVALUACION GENERAL RH TUXPAN",
    "Hostess": "HOSTESS",
    "Contact Center": "CONTACT CENTER",
    "Trasladista": "DESEMPEÑO LAVADOR",
    "Valuador de seminuevos": "ASESOR DE VENTAS SEMINUEVOS",
    "Control de calidad": "CONTROL DE CALIDAD",
    "Afanador": "DESEMPEÑO LAVADOR",
    "Vigilancia": "EVALUACION GENERAL RH TUXPAN",
    "Oficial de cumplimiento": "EVALUACION GENERAL RH TUXPAN",
    "Especialista de entregas": "ESPECIALISTA DE ENTREGAS",
    "Desarrollo organizacional": "EVALUACION GENERAL RH TUXPAN",
    "Gerente de calidad": "CONTROL DE CALIDAD",
    "Gerente de postventa grupo": "EVALUACION GENERAL RH TUXPAN",
    "Credito y cobranza divisional": "EVALUACION GENERAL RH TUXPAN",
    "Sistemas": "EVALUACION GENERAL RH TUXPAN",
    "Contador General de fondos y valores": "EVALUACION GENERAL RH TUXPAN",
    "Desarrollo organizacional grupo": "EVALUACION GENERAL RH TUXPAN",
    "Recursos humanos divisional": "EVALUACION GENERAL RH TUXPAN",
    "Analista de datos y programación": "EVALUACION GENERAL RH TUXPAN",
    "Auxiliar de diseño y producción": "EVALUACION GENERAL RH TUXPAN"
};

// Función para obtener el formato de evaluación de un puesto
export const obtenerFormatoEvaluacion = (nombrePuesto) => {
    const formatoKey = FORMATO_POR_PUESTO[nombrePuesto];
    if (!formatoKey) {
        // Formato por defecto si no hay mapeo
        return {
            tipo: "escala",
            escala: { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" },
            maxPuntaje: 25,
            criterios: [
                "Cumplimiento de objetivos",
                "Calidad del trabajo",
                "Trabajo en equipo",
                "Puntualidad",
                "Actitud y compromiso"
            ]
        };
    }
    return FORMATOS_EVALUACION[formatoKey];
};