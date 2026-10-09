//src/hooks/useAsesoresGestionComercial.js
import { useEffect, useMemo, useState } from "react";
import {
  obtenerAsesores,
  leerAsesoresCache,
  nombresUnicosAsesores,
  suscribirseInvalidacionAsesores,
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
  const [catalogo, setCatalogo] = useState(() =>
    leerAsesoresCache({ activo: true }),
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    let montado = true;
    const cargar = () => {
      obtenerAsesores({ activo: true })
        .then((datos) => {
          if (!montado) return;
          setCatalogo(datos);
          setError(null);
        })
        .catch((err) => {
          if (!montado) return;
          console.error("No fue posible cargar el catálogo de asesores:", err);
          setError(err);
        });
    };
    const desuscribir = suscribirseInvalidacionAsesores(cargar);
    cargar();
    return () => {
      montado = false;
      desuscribir();
    };
  }, []);

  const nombresAsesoresActivos = useMemo(() => {
    if (catalogo === null) return [...ASESORES_PISO];
    return nombresUnicosAsesores(catalogo);
  }, [catalogo]);

  const nombresAsesoresDigitales = useMemo(() => {
    if (catalogo === null) return [...ASESORES_DIGITALES];
    const digitalesHumanos = nombresUnicosAsesores(
      catalogo.filter(esTipoDigital),
    );
    return nombresUnicosAsesores([
      ...digitalesHumanos,
      NOMBRES_ASESORES_DIGITALES.IA_VAGEN,
    ]);
  }, [catalogo]);

  return {
    catalogoAsesores: catalogo ?? [],
    nombresAsesoresActivos,
    nombresAsesoresDigitales,
    cargando: catalogo === null && !error,
    usandoFallback: catalogo === null && Boolean(error),
    error,
  };
}
