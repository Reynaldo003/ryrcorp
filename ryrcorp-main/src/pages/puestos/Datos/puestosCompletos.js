// src/pages/Puestos/Datos/puestosCompletos.js

export const PUESTOS_COMPLETOS = [
    // ========== VENTAS (IDs 1-5, 11, 29-30, 40, 45) ==========
    {
        id: 1,
        nombre: "Ejecutivo de Ventas",
        categoria: "Ventas",
        perfilVWAG: "Ejecutivo de Ventas, Digital Genius, Product Genius",
        perfilVWM: "Ejecutivo de Ventas",
        perfilVolkswagenAcademy: "Ejecutivo de Ventas, Ejecutivo de Ventas Genius",
        colaboradorActual: "Edgar Jesús Gómez Pérez",
        fechaInsercion: "14/01/2020",
        objetivoGeneral: "Asesorar a los clientes en la compra de vehículos nuevos, brindando información detallada sobre modelos, características, financiamiento y promociones.",
        nivelEstudios: "Preparatoria o Licenciatura en Administración, Mercadotecnia o afín.",
        experiencia: "1 año de experiencia en ventas.",
        funciones: [
            "Atención al cliente en sala de ventas - Recibir al cliente de manera cordial y profesional, identificar necesidades y preferencias",
            "Pruebas de manejo - Verificar licencia de conducir, explicar ruta y características del vehículo",
            "Negociación y cierre de ventas - Presentar opciones de financiamiento, negociar precios y promociones",
            "Seguimiento post-venta - Contactar al cliente después de la entrega, gestionar proceso de entrega"
        ],
        competencias: ["Orientación a resultados", "Trabajo en equipo", "Comunicación efectiva", "Negociación", "Servicio al cliente"]
    },
    {
        id: 2,
        nombre: "Asesor de ventas seminuevos",
        categoria: "Ventas",
        objetivoGeneral: "Asesorar a clientes en la compra y venta de vehículos seminuevos, garantizando transacciones seguras y rentables.",
        nivelEstudios: "Preparatoria terminada o Licenciatura en curso",
        experiencia: "6 meses en ventas de autos usados",
        funciones: [
            "Evaluación y valuación de vehículos seminuevos",
            "Negociación con clientes compradores y vendedores",
            "Gestión de trámites de transferencia",
            "Mantenimiento de inventario actualizado"
        ],
        competencias: ["Honestidad", "Capacidad de negociación", "Conocimiento de mercado"]
    },
    {
        id: 3,
        nombre: "Asistente de ventas",
        categoria: "Ventas",
        objetivoGeneral: "Apoyar al equipo de ventas en tareas administrativas y operativas para optimizar el proceso de venta.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "Deseable experiencia en atención al cliente",
        funciones: [
            "Apoyo en documentación de ventas y contratos",
            "Gestión de agendas de asesores",
            "Atención telefónica y recepción de clientes",
            "Mantenimiento y limpieza del showroom"
        ],
        competencias: ["Organización", "Atención al detalle", "Trabajo bajo presión"]
    },
    {
        id: 4,
        nombre: "Servicios Financieros",
        categoria: "Ventas",
        objetivoGeneral: "Gestionar opciones de financiamiento y crédito para clientes, asegurando las mejores condiciones.",
        nivelEstudios: "Licenciatura en Finanzas, Administración o afín",
        experiencia: "1 año en instituciones financieras o autofinanciamiento",
        funciones: [
            "Análisis de crédito de clientes",
            "Gestión con bancos y financieras",
            "Elaboración de contratos de financiamiento",
            "Seguimiento de cartera vencida"
        ],
        competencias: ["Análisis financiero", "Negociación", "Atención al cliente"]
    },
    {
        id: 5,
        nombre: "Coordinador de AFASA",
        categoria: "Ventas",
        objetivoGeneral: "Coordinar el área de Autofinanciamiento, asegurando el cumplimiento de metas y procesos.",
        nivelEstudios: "Licenciatura en Administración o Mercadotecnia",
        experiencia: "2 años en autofinanciamiento o ventas",
        funciones: [
            "Supervisión del equipo AFASA",
            "Cumplimiento de metas mensuales",
            "Capacitación al equipo",
            "Reportes de gestión"
        ],
        competencias: ["Liderazgo", "Planeación estratégica", "Toma de decisiones"]
    },
    {
        id: 11,
        nombre: "Gerente de ventas",
        categoria: "Ventas",
        objetivoGeneral: "Dirigir y coordinar el equipo de ventas para alcanzar los objetivos comerciales de la empresa.",
        nivelEstudios: "Licenciatura en Administración, Mercadotecnia o afín",
        experiencia: "3 años en puestos de liderazgo en ventas",
        funciones: [
            "Planificación de estrategias de venta",
            "Supervisión y capacitación del equipo",
            "Análisis de métricas y reportes",
            "Negociación con proveedores y clientes clave"
        ],
        competencias: ["Liderazgo", "Visión estratégica", "Toma de decisiones", "Gestión de equipos"]
    },
    {
        id: 29,
        nombre: "Asesor de ventas digitales",
        categoria: "Ventas",
        objetivoGeneral: "Atender y asesorar a clientes a través de canales digitales para la compra de vehículos.",
        nivelEstudios: "Preparatoria o Licenciatura en Marketing Digital",
        experiencia: "1 año en ventas digitales",
        funciones: [
            "Atención por chat, WhatsApp y redes sociales",
            "Agendamiento de citas para pruebas de manejo",
            "Seguimiento digital post-venta",
            "Manejo de CRM y plataformas digitales"
        ],
        competencias: ["Comunicación digital", "Manejo de herramientas tecnológicas", "Servicio al cliente"]
    },
    {
        id: 30,
        nombre: "Coordinador de ventas digitales",
        categoria: "Ventas",
        objetivoGeneral: "Coordinar el equipo de ventas digitales y optimizar los canales online.",
        nivelEstudios: "Licenciatura en Marketing Digital o afín",
        experiencia: "2 años en ventas digitales",
        funciones: [
            "Supervisión del equipo digital",
            "Análisis de métricas y conversiones",
            "Implementación de estrategias digitales",
            "Coordinación con marketing"
        ],
        competencias: ["Liderazgo digital", "Analítica web", "Estrategias de conversión"]
    },
    {
        id: 40,
        nombre: "Valuador de seminuevos",
        categoria: "Ventas",
        objetivoGeneral: "Evaluar y determinar el valor comercial de vehículos seminuevos.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en valuación de autos",
        funciones: [
            "Inspección física de vehículos",
            "Investigación de precios de mercado",
            "Emisión de dictámenes de valuación",
            "Negociación con clientes"
        ],
        competencias: ["Conocimiento automotriz", "Honestidad", "Capacidad de negociación"]
    },
    {
        id: 45,
        nombre: "Especialista de entregas",
        categoria: "Ventas",
        objetivoGeneral: "Gestionar y coordinar la entrega de vehículos a clientes garantizando una experiencia satisfactoria.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en atención al cliente",
        funciones: [
            "Coordinación de entregas programadas",
            "Revisión de documentación",
            "Explicación de funciones del vehículo",
            "Encuesta de satisfacción post-entrega"
        ],
        competencias: ["Organización", "Servicio al cliente", "Atención al detalle"]
    },

    // ========== SERVICIO (IDs 12, 19-24) ==========
    {
        id: 12,
        nombre: "Gerente de Servicio",
        categoria: "Servicio",
        objetivoGeneral: "Dirigir el área de servicio para garantizar la satisfacción del cliente y la rentabilidad del taller.",
        nivelEstudios: "Licenciatura en Ingeniería o Administración",
        experiencia: "3 años en gestión de talleres automotrices",
        funciones: [
            "Supervisión de operaciones del taller",
            "Gestión de indicadores de servicio",
            "Capacitación del equipo técnico",
            "Atención a quejas y reclamaciones"
        ],
        competencias: ["Liderazgo", "Gestión operativa", "Servicio al cliente", "Resolución de problemas"]
    },
    {
        id: 19,
        nombre: "Técnico mecánico",
        categoria: "Servicio",
        objetivoGeneral: "Realizar diagnósticos y reparaciones mecánicas en vehículos de todas las marcas del grupo.",
        nivelEstudios: "Carrera técnica en Mecánica Automotriz",
        experiencia: "2 años en talleres mecánicos",
        funciones: [
            "Diagnóstico de fallas mecánicas",
            "Reparación de sistemas (motor, transmisión, frenos)",
            "Mantenimiento preventivo y correctivo",
            "Pruebas de funcionamiento post-reparación"
        ],
        competencias: ["Conocimiento técnico", "Precisión", "Resolución de problemas"]
    },
    {
        id: 20,
        nombre: "Asesor de servicio",
        categoria: "Servicio",
        objetivoGeneral: "Atender a clientes en el taller, gestionando órdenes de servicio y garantizando su satisfacción.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en atención al cliente automotriz",
        funciones: [
            "Recepción de clientes y vehículos",
            "Generación de órdenes de servicio",
            "Comunicación con taller sobre avances",
            "Facturación y cierre de servicios"
        ],
        competencias: ["Servicio al cliente", "Comunicación", "Organización"]
    },
    {
        id: 21,
        nombre: "Asistente de servicio",
        categoria: "Servicio",
        objetivoGeneral: "Apoyar al asesor de servicio en tareas administrativas y de coordinación del taller.",
        nivelEstudios: "Preparatoria en curso",
        experiencia: "No requerida",
        funciones: [
            "Apoyo en registro de órdenes",
            "Gestión de citas de servicio",
            "Archivo de documentación",
            "Atención telefónica"
        ],
        competencias: ["Organización", "Proactividad", "Trabajo en equipo"]
    },
    {
        id: 22,
        nombre: "Administrador de garantía",
        categoria: "Servicio",
        objetivoGeneral: "Gestionar y administrar las reclamaciones de garantía ante las marcas.",
        nivelEstudios: "Licenciatura en Administración o afín",
        experiencia: "2 años en gestión de garantías automotrices",
        funciones: [
            "Revisión de reclamaciones de garantía",
            "Gestión ante las marcas (VW, etc.)",
            "Control de inventario de piezas de garantía",
            "Reportes de costos y recuperaciones"
        ],
        competencias: ["Atención al detalle", "Gestión administrativa", "Negociación"]
    },
    {
        id: 23,
        nombre: "Jefe de taller",
        categoria: "Servicio",
        objetivoGeneral: "Supervisar las operaciones diarias del taller y al equipo técnico.",
        nivelEstudios: "Ingeniería o Técnico Superior",
        experiencia: "2 años en supervisión de talleres",
        funciones: [
            "Asignación de trabajos a técnicos",
            "Control de tiempos y eficiencia",
            "Supervisión de calidad en reparaciones",
            "Reportes de productividad"
        ],
        competencias: ["Liderazgo", "Gestión de equipos", "Conocimiento técnico"]
    },
    {
        id: 24,
        nombre: "Técnico Master",
        categoria: "Servicio",
        objetivoGeneral: "Atender fallas complejas y de alta tecnología en vehículos, certificado por la marca.",
        nivelEstudios: "Ingeniería o Técnico Superior certificado",
        experiencia: "5 años en diagnóstico automotriz",
        funciones: [
            "Diagnóstico avanzado de fallas electrónicas",
            "Reparación de sistemas complejos",
            "Capacitación a técnicos junior",
            "Atención de casos especiales"
        ],
        competencias: ["Alto conocimiento técnico", "Diagnóstico avanzado", "Formación de equipos"]
    },

    // ========== REFACCIONES (IDs 13, 25-28) ==========
    {
        id: 13,
        nombre: "Gerente de refacciones",
        categoria: "Refacciones",
        objetivoGeneral: "Dirigir el área de refacciones para maximizar ventas y rentabilidad.",
        nivelEstudios: "Licenciatura en Administración o Logística",
        experiencia: "3 años en gestión de refacciones",
        funciones: [
            "Planificación de inventarios",
            "Negociación con proveedores",
            "Supervisión de equipo de ventas",
            "Análisis de rotación y rentabilidad"
        ],
        competencias: ["Liderazgo", "Gestión de inventarios", "Negociación"]
    },
    {
        id: 25,
        nombre: "Asesor de refacciones mostrador taller",
        categoria: "Refacciones",
        objetivoGeneral: "Vender refacciones al taller de servicio interno.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en ventas de refacciones",
        funciones: [
            "Atención a pedidos del taller",
            "Búsqueda de refacciones en sistema",
            "Control de salidas a taller",
            "Facturación interna"
        ],
        competencias: ["Conocimiento de refacciones", "Servicio al cliente", "Rapidez"]
    },
    {
        id: 26,
        nombre: "Asesor de refacciones mostrador público",
        categoria: "Refacciones",
        objetivoGeneral: "Vender refacciones al público en general.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en atención al cliente",
        funciones: [
            "Atención a clientes en mostrador",
            "Identificación de refacciones requeridas",
            "Cotización y venta",
            "Seguimiento a pedidos especiales"
        ],
        competencias: ["Servicio al cliente", "Conocimiento de productos", "Honestidad"]
    },
    {
        id: 27,
        nombre: "Asesor de refacciones promotoria NORA",
        categoria: "Refacciones",
        objetivoGeneral: "Atender pedidos de refacciones vía telefónica y digital para clientes externos.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en telemarketing o ventas",
        funciones: [
            "Atención telefónica de pedidos",
            "Cotización y seguimiento",
            "Coordinación con almacén",
            "Facturación y envío"
        ],
        competencias: ["Comunicación telefónica", "Manejo de sistemas", "Servicio al cliente"]
    },
    {
        id: 28,
        nombre: "Encargado de almacén",
        categoria: "Refacciones",
        objetivoGeneral: "Gestionar el almacén de refacciones, asegurando inventarios correctos.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "2 años en almacenes",
        funciones: [
            "Recepción y ubicación de mercancía",
            "Control de inventarios",
            "Coordinación de surtido",
            "Reportes de mermas y devoluciones"
        ],
        competencias: ["Organización", "Control de inventarios", "Liderazgo de equipo"]
    },

    // ========== POSTVENTA (IDs 6, 14, 17-18, 48) ==========
    {
        id: 6,
        nombre: "Preparador",
        categoria: "Postventa",
        objetivoGeneral: "Preparar vehículos nuevos y seminuevos para entrega a clientes, asegurando calidad en la presentación.",
        nivelEstudios: "Secundaria terminada",
        experiencia: "Deseable en detallado automotriz",
        funciones: [
            "Limpieza profunda de vehículos",
            "Revisión de detalles estéticos",
            "Instalación de accesorios básicos",
            "Control de calidad pre-entrega"
        ],
        competencias: ["Atención al detalle", "Calidad de trabajo", "Responsabilidad"]
    },
    {
        id: 14,
        nombre: "Gerente de postventa",
        categoria: "Postventa",
        objetivoGeneral: "Dirigir estrategias de postventa para fidelizar clientes y generar ingresos recurrentes.",
        nivelEstudios: "Licenciatura en Administración o Marketing",
        experiencia: "3 años en áreas de postventa",
        funciones: [
            "Planificación de programas de fidelización",
            "Coordinación con servicio y refacciones",
            "Análisis de satisfacción al cliente",
            "Gestión de encuestas y mejora continua"
        ],
        competencias: ["Visión estratégica", "Servicio al cliente", "Análisis de datos"]
    },
    {
        id: 17,
        nombre: "Técnico Hojalatero",
        categoria: "Postventa",
        objetivoGeneral: "Realizar reparaciones de carrocería en vehículos accidentados.",
        nivelEstudios: "Carrera técnica en Hojalatería",
        experiencia: "2 años en talleres de hojalatería",
        funciones: [
            "Reparación de golpes y abolladuras",
            "Alineación de estructuras",
            "Aplicación de masilla y lijado",
            "Preparación para pintura"
        ],
        competencias: ["Precisión", "Conocimiento de estructuras", "Calidad de trabajo"]
    },
    {
        id: 18,
        nombre: "Técnico pintor",
        categoria: "Postventa",
        objetivoGeneral: "Realizar trabajos de pintura automotriz con altos estándares de calidad.",
        nivelEstudios: "Carrera técnica en Pintura Automotriz",
        experiencia: "2 años en pintura automotriz",
        funciones: [
            "Preparación de superficies",
            "Aplicación de pintura base y clear",
            "Pulido y acabado",
            "Mantenimiento de cabina de pintura"
        ],
        competencias: ["Atención al detalle", "Conocimiento de productos", "Calidad estética"]
    },
    {
        id: 48,
        nombre: "Gerente de postventa grupo",
        categoria: "Postventa",
        objetivoGeneral: "Dirigir la estrategia de postventa a nivel grupo de agencias.",
        nivelEstudios: "Licenciatura en Administración o afín",
        experiencia: "5 años en gestión de postventa",
        funciones: [
            "Estrategias grupales de postventa",
            "Coordinación con gerencias de agencia",
            "Análisis de indicadores grupales",
            "Implementación de mejores prácticas"
        ],
        competencias: ["Liderazgo estratégico", "Análisis corporativo", "Gestión de equipos"]
    },

    // ========== HYP (IDs 15-16) ==========
    {
        id: 15,
        nombre: "Gerente de HYP",
        categoria: "HYP",
        objetivoGeneral: "Dirigir el área de Hojalatería y Pintura para garantizar rentabilidad y calidad.",
        nivelEstudios: "Ingeniería o Licenciatura en Administración",
        experiencia: "3 años en gestión de talleres HYP",
        funciones: [
            "Supervisión de producción HYP",
            "Control de costos y tiempos",
            "Coordinación con seguros",
            "Capacitación técnica"
        ],
        competencias: ["Liderazgo", "Gestión de proyectos", "Conocimiento técnico HYP"]
    },
    {
        id: 16,
        nombre: "Asesor de HYP",
        categoria: "HYP",
        objetivoGeneral: "Atender clientes del área de hojalatería y pintura, gestionando reparaciones con seguros.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en atención al cliente",
        funciones: [
            "Recepción de vehículos accidentados",
            "Gestión con ajustadores de seguros",
            "Cotización de reparaciones",
            "Seguimiento al cliente"
        ],
        competencias: ["Servicio al cliente", "Gestión de seguros", "Organización"]
    },

    // ========== ADMINISTRACIÓN (IDs 8-10, 31-33, 44, 51) ==========
    {
        id: 8,
        nombre: "Cajera",
        categoria: "Administración",
        objetivoGeneral: "Realizar cobros y gestionar pagos de clientes y proveedores con exactitud y honestidad.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "6 meses en caja o manejo de efectivo",
        funciones: [
            "Registro de pagos en sistema",
            "Corte de caja diario",
            "Atención a clientes en caja",
            "Conciliación de ingresos"
        ],
        competencias: ["Honestidad", "Manejo de números", "Atención al cliente"]
    },
    {
        id: 9,
        nombre: "Auxiliar contable",
        categoria: "Administración",
        objetivoGeneral: "Apoyar en el registro y control de operaciones contables de la empresa.",
        nivelEstudios: "Licenciatura en Contaduría (titulado o en último semestre)",
        experiencia: "1 año en puesto similar",
        funciones: [
            "Registro de facturas y comprobantes",
            "Conciliaciones bancarias",
            "Apoyo en declaraciones fiscales",
            "Archivo de documentación contable"
        ],
        competencias: ["Organización", "Atención al detalle", "Conocimiento de ley fiscal"]
    },
    {
        id: 10,
        nombre: "Contador General",
        categoria: "Administración",
        objetivoGeneral: "Dirigir y controlar la contabilidad general de la empresa, asegurando cumplimiento fiscal.",
        nivelEstudios: "Licenciatura en Contaduría (titulado)",
        experiencia: "3 años en puesto similar",
        funciones: [
            "Elaboración de estados financieros",
            "Declaraciones fiscales mensuales y anuales",
            "Coordinación con auditoría externa",
            "Control presupuestal"
        ],
        competencias: ["Liderazgo", "Análisis financiero", "Conocimiento fiscal profundo"]
    },
    {
        id: 31,
        nombre: "Auditor interno",
        categoria: "Administración",
        objetivoGeneral: "Realizar auditorías internas para verificar cumplimiento de procesos y políticas.",
        nivelEstudios: "Licenciatura en Contaduría o Administración",
        experiencia: "2 años en auditoría",
        funciones: [
            "Planificación de auditorías internas",
            "Revisión de procesos y controles",
            "Elaboración de reportes de hallazgos",
            "Seguimiento a planes de acción"
        ],
        competencias: ["Análisis crítico", "Atención al detalle", "Objetividad"]
    },
    {
        id: 32,
        nombre: "Contador Fiscal",
        categoria: "Administración",
        objetivoGeneral: "Gestionar las obligaciones fiscales de la empresa ante el SAT.",
        nivelEstudios: "Licenciatura en Contaduría (titulado)",
        experiencia: "3 años en fiscal",
        funciones: [
            "Cálculo y pago de impuestos",
            "Declaraciones mensuales y anuales",
            "Atención a auditorías fiscales",
            "Planeación fiscal"
        ],
        competencias: ["Conocimiento fiscal profundo", "Análisis", "Gestión de riesgos"]
    },
    {
        id: 33,
        nombre: "Gerente General",
        categoria: "Administración",
        objetivoGeneral: "Dirigir la operación general de la agencia para alcanzar objetivos corporativos.",
        nivelEstudios: "Licenciatura o Maestría en Administración",
        experiencia: "5 años en dirección general",
        funciones: [
            "Planificación estratégica",
            "Toma de decisiones ejecutivas",
            "Gestión de resultados financieros",
            "Representación ante marcas"
        ],
        competencias: ["Liderazgo ejecutivo", "Visión estratégica", "Toma de decisiones"]
    },
    {
        id: 44,
        nombre: "Oficial de cumplimiento",
        categoria: "Administración",
        objetivoGeneral: "Garantizar el cumplimiento normativo y de políticas internas.",
        nivelEstudios: "Licenciatura en Derecho o Administración",
        experiencia: "2 años en compliance",
        funciones: [
            "Revisión de cumplimiento normativo",
            "Gestión de riesgos legales",
            "Capacitación en políticas",
            "Atención a auditorías regulatorias"
        ],
        competencias: ["Conocimiento legal", "Atención al detalle", "Ética profesional"]
    },
    {
        id: 51,
        nombre: "Contador General de fondos y valores",
        categoria: "Administración",
        objetivoGeneral: "Controlar y gestionar los fondos y valores de la empresa.",
        nivelEstudios: "Licenciatura en Contaduría",
        experiencia: "2 años en tesorería o fondos",
        funciones: [
            "Control de fondos fijos y cajas chicas",
            "Gestión de valores e inversiones",
            "Conciliación de cuentas bancarias",
            "Reportes de tesorería"
        ],
        competencias: ["Manejo de efectivo", "Organización", "Honestidad"]
    },

    // ========== OPERACIONES (IDs 7, 37-39, 42-43) ==========
    {
        id: 7,
        nombre: "Lavador",
        categoria: "Operaciones",
        objetivoGeneral: "Mantener la limpieza e higiene de los vehículos en exhibición y servicio.",
        nivelEstudios: "Secundaria terminada",
        experiencia: "No requerida",
        funciones: [
            "Lavado interior y exterior de autos",
            "Aspirado y limpieza de tapices",
            "Mantenimiento de áreas de lavado",
            "Uso adecuado de productos químicos"
        ],
        competencias: ["Responsabilidad", "Atención al detalle", "Trabajo rápido"]
    },
    {
        id: 37,
        nombre: "Hostess",
        categoria: "Operaciones",
        objetivoGeneral: "Recibir y atender a clientes en la entrada de la agencia.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "Atención al cliente",
        funciones: [
            "Recepción de clientes en sala de ventas",
            "Ofrecimiento de bebidas y servicios",
            "Registro de visitas",
            "Coordinación con asesores"
        ],
        competencias: ["Servicio al cliente", "Buena presentación", "Comunicación"]
    },
    {
        id: 38,
        nombre: "Contact Center",
        categoria: "Operaciones",
        objetivoGeneral: "Atender llamadas y mensajes de clientes para agendar citas y resolver dudas.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en call center",
        funciones: [
            "Atención telefónica a clientes",
            "Agendamiento de citas de servicio y ventas",
            "Seguimiento a prospectos",
            "Base de datos de clientes"
        ],
        competencias: ["Comunicación telefónica", "Paciencia", "Servicio al cliente"]
    },
    {
        id: 39,
        nombre: "Trasladista",
        categoria: "Operaciones",
        objetivoGeneral: "Realizar traslados de vehículos entre agencias y clientes.",
        nivelEstudios: "Secundaria terminada",
        experiencia: "2 años de experiencia como chofer",
        funciones: [
            "Traslado de vehículos entre agencias",
            "Entrega de autos a clientes",
            "Revisión de documentos y seguros",
            "Mantenimiento básico de unidad"
        ],
        competencias: ["Responsabilidad", "Manejo defensivo", "Puntualidad"]
    },
    {
        id: 42,
        nombre: "Afanador",
        categoria: "Operaciones",
        objetivoGeneral: "Mantener limpias las instalaciones de la agencia.",
        nivelEstudios: "Secundaria terminada",
        experiencia: "No requerida",
        funciones: [
            "Limpieza de oficinas y áreas comunes",
            "Mantenimiento de sanitarios",
            "Recolección de basura",
            "Apoyo en limpieza de vehículos"
        ],
        competencias: ["Responsabilidad", "Atención al detalle", "Puntualidad"]
    },
    {
        id: 43,
        nombre: "Vigilancia",
        categoria: "Operaciones",
        objetivoGeneral: "Garantizar la seguridad de las instalaciones, vehículos y personal.",
        nivelEstudios: "Secundaria terminada",
        experiencia: "1 año en seguridad",
        funciones: [
            "Control de acceso de personas",
            "Rondines de seguridad",
            "Revisión de vehículos",
            "Reporte de incidentes"
        ],
        competencias: ["Responsabilidad", "Atención", "Toma de decisiones bajo presión"]
    },

    // ========== MARKETING (IDs 34-36, 55) ==========
    {
        id: 34,
        nombre: "Gerente de marketing",
        categoria: "Marketing",
        objetivoGeneral: "Dirigir estrategias de marketing para posicionar la marca y generar leads.",
        nivelEstudios: "Licenciatura en Marketing o Publicidad",
        experiencia: "3 años en marketing automotriz",
        funciones: [
            "Planificación de campañas",
            "Gestión de presupuesto de marketing",
            "Coordinación con agencias de publicidad",
            "Análisis de ROI de campañas"
        ],
        competencias: ["Creatividad", "Análisis de datos", "Liderazgo de equipos"]
    },
    {
        id: 35,
        nombre: "Consultor de procesos",
        categoria: "Marketing",
        objetivoGeneral: "Optimizar procesos de marketing y ventas para mejorar la eficiencia.",
        nivelEstudios: "Licenciatura en Administración o Marketing",
        experiencia: "2 años en consultoría de procesos",
        funciones: [
            "Análisis de procesos actuales",
            "Propuesta de mejoras",
            "Implementación de cambios",
            "Medición de resultados"
        ],
        competencias: ["Análisis de procesos", "Resolución de problemas", "Comunicación"]
    },
    {
        id: 36,
        nombre: "Coordinador de marketing",
        categoria: "Marketing",
        objetivoGeneral: "Ejecutar las estrategias de marketing y coordinar al equipo operativo.",
        nivelEstudios: "Licenciatura en Marketing",
        experiencia: "2 años en marketing",
        funciones: [
            "Ejecución de campañas",
            "Coordinación de eventos",
            "Gestión de redes sociales",
            "Reportes de resultados"
        ],
        competencias: ["Organización", "Creatividad", "Gestión de proyectos"]
    },
    {
        id: 55,
        nombre: "Auxiliar de diseño y producción",
        categoria: "Marketing",
        objetivoGeneral: "Apoyar en la creación de materiales gráficos y producción de contenidos.",
        nivelEstudios: "Diseño Gráfico o afín",
        experiencia: "1 año en diseño",
        funciones: [
            "Diseño de materiales promocionales",
            "Edición de video y foto",
            "Producción de contenido para redes",
            "Apoyo en eventos"
        ],
        competencias: ["Creatividad", "Manejo de Adobe", "Atención al detalle"]
    },

    // ========== CALIDAD (IDs 41, 47) ==========
    {
        id: 41,
        nombre: "Control de calidad",
        categoria: "Calidad",
        objetivoGeneral: "Verificar la calidad en procesos y entregas de vehículos.",
        nivelEstudios: "Preparatoria terminada",
        experiencia: "1 año en control de calidad",
        funciones: [
            "Inspección de vehículos antes de entrega",
            "Verificación de procesos",
            "Reporte de no conformidades",
            "Seguimiento a correcciones"
        ],
        competencias: ["Atención al detalle", "Honestidad", "Método"]
    },
    {
        id: 47,
        nombre: "Gerente de calidad",
        categoria: "Calidad",
        objetivoGeneral: "Implementar y mantener el sistema de gestión de calidad.",
        nivelEstudios: "Ingeniería o Licenciatura en Calidad",
        experiencia: "3 años en gestión de calidad",
        funciones: [
            "Implementación de ISO y estándares",
            "Auditorías internas de calidad",
            "Capacitación en calidad",
            "Reportes a dirección"
        ],
        competencias: ["Liderazgo", "Conocimiento de normas", "Análisis de procesos"]
    },

    // ========== SISTEMAS (IDs 50, 54) ==========
    {
        id: 50,
        nombre: "Sistemas",
        categoria: "Sistemas",
        objetivoGeneral: "Administrar y mantener los sistemas informáticos de la empresa.",
        nivelEstudios: "Ingeniería en Sistemas o afín",
        experiencia: "2 años en administración de sistemas",
        funciones: [
            "Mantenimiento de servidores",
            "Soporte a usuarios",
            "Respaldo de información",
            "Seguridad informática"
        ],
        competencias: ["Conocimiento técnico", "Resolución de problemas", "Servicio"]
    },
    {
        id: 54,
        nombre: "Analista de datos y programación",
        categoria: "Sistemas",
        objetivoGeneral: "Analizar datos y desarrollar soluciones tecnológicas para la empresa.",
        nivelEstudios: "Ingeniería en Sistemas o afín",
        experiencia: "2 años en análisis de datos",
        funciones: [
            "Análisis y reporte de datos",
            "Desarrollo de aplicaciones internas",
            "Mantenimiento de bases de datos",
            "Automatización de procesos"
        ],
        competencias: ["Programación", "Análisis de datos", "Resolución de problemas"]
    },

    // ========== RECURSOS HUMANOS (IDs 46, 52-53) ==========
    {
        id: 46,
        nombre: "Desarrollo organizacional",
        categoria: "Recursos Humanos",
        objetivoGeneral: "Gestionar programas de desarrollo y cultura organizacional.",
        nivelEstudios: "Licenciatura en Psicología o RH",
        experiencia: "2 años en DO",
        funciones: [
            "Diseño de programas de capacitación",
            "Gestión de clima laboral",
            "Evaluaciones de desempeño",
            "Planes de carrera"
        ],
        competencias: ["Psicología organizacional", "Comunicación", "Planeación"]
    },
    {
        id: 52,
        nombre: "Desarrollo organizacional grupo",
        categoria: "Recursos Humanos",
        objetivoGeneral: "Dirigir estrategias de desarrollo organizacional a nivel grupo.",
        nivelEstudios: "Licenciatura en Psicología o RH",
        experiencia: "4 años en DO",
        funciones: [
            "Estrategias grupales de DO",
            "Gestión de talento corporativo",
            "Programas de liderazgo",
            "Cultura organizacional"
        ],
        competencias: ["Liderazgo", "Visión estratégica", "Gestión del talento"]
    },
    {
        id: 53,
        nombre: "Recursos humanos divisional",
        categoria: "Recursos Humanos",
        objetivoGeneral: "Gestionar procesos de RH a nivel divisional.",
        nivelEstudios: "Licenciatura en Psicología o RH",
        experiencia: "3 años en RH",
        funciones: [
            "Reclutamiento y selección",
            "Administración de nómina",
            "Relaciones laborales",
            "Capacitación"
        ],
        competencias: ["Gestión de personal", "Comunicación", "Liderazgo"]
    },

    // ========== FINANZAS (ID 49) ==========
    {
        id: 49,
        nombre: "Crédito y cobranza divisional",
        categoria: "Finanzas",
        objetivoGeneral: "Gestionar la cartera de crédito y cobranza a nivel divisional.",
        nivelEstudios: "Licenciatura en Finanzas o Contaduría",
        experiencia: "3 años en crédito y cobranza",
        funciones: [
            "Análisis de cartera vencida",
            "Gestión de cobranza",
            "Políticas de crédito",
            "Reportes financieros"
        ],
        competencias: ["Análisis financiero", "Negociación", "Gestión de riesgos"]
    }
];

// Función para obtener un puesto por ID (busca en COMPLETOS o genera de PuestosData)
export const obtenerPuestoCompleto = (id) => {
    // Buscar en los datos completos
    const puestoExistente = PUESTOS_COMPLETOS.find(p => p.id === id);
    if (puestoExistente) return puestoExistente;
    
    // Si no existe, buscar en PuestosData y crear datos genéricos
    const { PUESTOS } = require('./PuestosData');
    const puestoBase = PUESTOS.find(p => p.id === id);
    if (puestoBase) {
        return {
            id: puestoBase.id,
            nombre: puestoBase.nombre,
            categoria: puestoBase.categoria,
            objetivoGeneral: `Gestionar y ejecutar las actividades relacionadas con ${puestoBase.nombre} en Grupo Automotriz R&R, asegurando el cumplimiento de los estándares de calidad y servicio.`,
            nivelEstudios: "Preparatoria o Licenciatura en área afín",
            experiencia: "1-2 años de experiencia en puesto similar",
            funciones: [
                "Realizar las funciones propias del puesto según los lineamientos establecidos",
                "Mantener comunicación efectiva con el equipo de trabajo",
                "Reportar avances y novedades a supervisión inmediata",
                "Cumplir con los indicadores de desempeño establecidos"
            ],
            competencias: ["Responsabilidad", "Trabajo en equipo", "Comunicación efectiva", "Proactividad"]
        };
    }
    return null;
};

// Obtener TODOS los puestos completos (55 puestos)
export const obtenerTodosPuestosCompletos = () => {
    const { PUESTOS } = require('./PuestosData');
    return PUESTOS.map(puesto => obtenerPuestoCompleto(puesto.id));
};