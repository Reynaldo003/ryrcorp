// src/config/asesoresGestionComercial.js

// ---------------------------------------------------------
// Asesores digitales
// ---------------------------------------------------------

export const NOMBRES_ASESORES_DIGITALES = Object.freeze({
  IA_VAGEN: "IA Vagen",
  LIZBETH_CANO_CLARA: "Lizbeth Cano Clara",
  ERENDIRA_SANTOS_COYOTZI: "Erendira Santos Coyotzi",
  MARELLY_TENORIO_SALINAS: "Marelly Tenorio Salinas",
  JULIO_RAMIREZ_LOPEZ: "Julio Ramirez Lopez",
  EDGAR_OMAR_NOGUERA_SOLIS: "Edgar Omar Noguera Solis",
  DULCE_ABIGAIL_GARCIA_OLIVARES: "Dulce Abigail Garcia Olivares",
  BIANCA_CHAVEZ_ALARCON: "Bianca Chavez Alarcon",
  CANDY_DENISSE_MARQUEZ: "Candy Denisse Marquez",
  EQUIPO_DIGITAL_TUXTEPEC: "Equipo Digital Tuxtepec",
});

export const ASESORES_DIGITALES = [
  NOMBRES_ASESORES_DIGITALES.LIZBETH_CANO_CLARA,
  NOMBRES_ASESORES_DIGITALES.ERENDIRA_SANTOS_COYOTZI,
  NOMBRES_ASESORES_DIGITALES.MARELLY_TENORIO_SALINAS,
  NOMBRES_ASESORES_DIGITALES.IA_VAGEN,
  NOMBRES_ASESORES_DIGITALES.EDGAR_OMAR_NOGUERA_SOLIS,
  NOMBRES_ASESORES_DIGITALES.DULCE_ABIGAIL_GARCIA_OLIVARES,
  NOMBRES_ASESORES_DIGITALES.BIANCA_CHAVEZ_ALARCON,
  NOMBRES_ASESORES_DIGITALES.CANDY_DENISSE_MARQUEZ,
  NOMBRES_ASESORES_DIGITALES.JULIO_RAMIREZ_LOPEZ,
];

export const ASESORES_TUXTEPEC = [
  {
    usuario: "ADTuxte",
    nombre: NOMBRES_ASESORES_DIGITALES.MARELLY_TENORIO_SALINAS,
    activo: true,
  },
  {
    usuario: "julioRL",
    nombre: NOMBRES_ASESORES_DIGITALES.JULIO_RAMIREZ_LOPEZ,
    activo: true,
  },
];

// ---------------------------------------------------------
// Asesores de piso
// ---------------------------------------------------------

export const ASESORES_PISO = [
  "Adrian Galvez Roldan",
  "Aura Marlizeth Fernandez Lopez",
  "Bianca Isabel Chavez Alarcon",
  "Blanca Patricia Hernandez Hernandez",
  "Candy Denisse Marquez Cortes",
  "Carlos Arturo Garces Venegas",
  "Cesar Ivan Salazar Reyes",
  "Cristian Fernando Rivera Godinez",
  "David Uriel García Navarro",
  "Delmar Javier Illescas Dominguez",
  "Dulce Abigail Garcia Olivares",
  "Edgar Jesus Gomez Perez",
  "Edgar Omar Noguera Solis",
  "Elia Ines Arano Reyes",
  "Erendira Santos Coyotzi",
  "Estefano Marlom De Azcue Aparicio",
  "Felix Emmanuel Solis Angeles",
  "Geovani Nava Diaz",
  "German Jarith Salazar Miranda",
  "Gustavo Chontal Romero",
  "Hector Rodriguez",
  "Idalmy Jimenez Sanchez",
  "Irene Del Carmen Guiza Lopez",
  "Iris Yazmín Gómez Velázquez",
  "Israel Garcia Juarez",
  "Ivan Juarez Ortega",
  "Javier Perez Meraz",
  "Jessica Olivares Campos",
  "Jesus Xitlama Gomez",
  "Jorge Antonio Rodriguez Martinez",
  "Jorge Luis Alamillo Rodriguez",
  "Jose Alberto Sedas Flores",
  "Jose Alfredo Barranca Reyes",
  "Jose De Jesus Garcia Roman",
  "Juan Jesus Marquez Aquino",
  "Juan Manuel Sobrevilla Vicencio",
  "Julio Ramirez Lopez",
  "Lizbeth Cano Clara",
  "Luis Alberto Ramirez Santamaria",
  "Luis Alfonso Coria Marroquin",
  "Luis Armando Almora Perez",
  "Luis Manuel Alvarez Martinez",
  "Luis Manuel Hernández Espejo",
  "Luis Manuel Palomares Olayo",
  "Mara Erubey Soto Villegas",
  "Marcos Raul Diaz Ramos",
  "Marelly Tenorio Salinas",
  "Maria De Guadalupe Vanvollenhoven Diaz",
  "Maria Del Carmen Zavala Velazquez",
  "Maria Monserrath Zarate Gamboa",
  "Mario Alberto Lopez Ramos",
  "Marisol Lagunes Gonzalez",
  "Miguel Capitanachi Paredes",
  "Nallely Hernandez Garcia",
  "Octavio Bruno Gonzalez",
  "Olimpia Vazquez Mendez",
  "Omar Villiers Mondragon",
  "Paul Serrano Vera",
  "Roberto Ramses Luna Fajardo",
  "Rogelio Vazquez Sanchez",
  "Ruben Alberto Tosquy Adriano",
  "Ruben Romero Valdes",
  "Saja Azzam Mohammad Jamous",
  "Sandra Luz Prieto Perez",
  "Sergio Ivan Quintana Martinez",
  "Sergio Rene Delgado Sarmiento",
  "Valeria Zilli Durante",
  "Vanessa Jimenez Medina",
  "Veronica Castillo Fuentes",
  "Yamil Misael Rodriguez Aguilar",
  "Yoseth Ruiz Castellanos",
  "Zeila Navarro Contreras",
];

// ---------------------------------------------------------
// Agencias utilizadas por Gestión Comercial
// ---------------------------------------------------------

export const AGENCIAS_DIGITALES = [
  "VW Cordoba",
  "VW Orizaba",
  "VW Poza Rica",
  "VW Tuxtepec",
  "VW Tuxpan",
  "Automotriz R&R",
];

// ---------------------------------------------------------
// Equivalencias de nombres digitales
// NO modifica la BD. Solo unifica visualmente nombres existentes.
// La normalización de BD corresponde a la tarea 6.
// ---------------------------------------------------------

function normalizarNombre(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const ASESOR_DIGITAL_CANONICO = new Map([
  ["lizbeth cano clara", "Lizbeth Cano Clara"],
  ["erendira santos coyotzi", "Erendira Santos Coyotzi"],
  ["marelly tenorio salinas", "Marelly Tenorio Salinas"],
  ["ia vagen", "IA Vagen"],
  ["edgar omar noguera solis", "Edgar Omar Noguera Solis"],
  ["dulce abigail garcia olivares", "Dulce Abigail Garcia Olivares"],

  ["bianca chavez alarcon", "Bianca Chavez Alarcon"],
  ["bianca isabel chavez alarcon", "Bianca Chavez Alarcon"],

  ["candy denisse marquez", "Candy Denisse Marquez"],
  ["candy denisse marquez cortes", "Candy Denisse Marquez"],

  ["julio ramirez lopez", "Julio Ramirez Lopez"],
]);

export function canonicalAsesorDigital(value) {
  const normalized = normalizarNombre(value);

  if (!normalized) {
    return "";
  }

  return (
    ASESOR_DIGITAL_CANONICO.get(normalized) ||
    String(value || "").trim()
  );
}

// ---------------------------------------------------------
// Configuración visual de asesores de línea compartida
// ---------------------------------------------------------

export const ASESORES_VISUALES = {
  "marelly tenorio salinas": {
    nombreCorto: "Marelly",
    color: "#7C3AED",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },

  "julio ramirez lopez": {
    nombreCorto: "Julio",
    color: "#0891B2",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
};