import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerAsesores,
  nombresUnicosAsesores,
} from "../lib/apiAsesores";

import {
  ASESORES_DIGITALES,
  ASESORES_PISO,
  NOMBRES_ASESORES_DIGITALES,
} from "../config/asesoresGestionComercial";


function esTipoDigital(asesor) {
  return (
    String(asesor?.tipo_asesor || "")
      .trim()
      .toLocaleLowerCase() === "digital"
  );
}


export function useAsesoresGestionComercial() {
  const [catalogo, setCatalogo] =
    useState(null);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    let montado = true;

    obtenerAsesores({
      activo: true,
    })
      .then((data) => {
        if (!montado) {
          return;
        }

        setCatalogo(data);
        setError(null);
      })
      .catch((err) => {
        if (!montado) {
          return;
        }

        console.error(
          "No fue posible cargar el catalogo de asesores:",
          err
        );

        setError(err);
      });

    return () => {
      montado = false;
    };
  }, []);


  const nombresAsesoresActivos =
    useMemo(() => {
      // Mientras carga o si falla la API,
      // conservamos temporalmente la lista anterior.
      if (catalogo === null) {
        return [...ASESORES_PISO];
      }

      return nombresUnicosAsesores(
        catalogo
      );
    }, [catalogo]);


  const nombresAsesoresDigitales =
    useMemo(() => {
      if (catalogo === null) {
        return [...ASESORES_DIGITALES];
      }

      const digitalesHumanos =
        nombresUnicosAsesores(
          catalogo.filter(
            esTipoDigital
          )
        );

      // IA Vagen no es una persona del catálogo,
      // pero sigue siendo una opción funcional
      // existente en Gestión Comercial.
      return nombresUnicosAsesores([
        ...digitalesHumanos,
        NOMBRES_ASESORES_DIGITALES
          .IA_VAGEN,
      ]);
    }, [catalogo]);


  return {
    catalogoAsesores:
      catalogo ?? [],

    nombresAsesoresActivos,

    nombresAsesoresDigitales,

    cargando:
      catalogo === null &&
      !error,

    usandoFallback:
      catalogo === null &&
      Boolean(error),

    error,
  };
}