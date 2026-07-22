// src/routes.jsx
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import EncuestasWhats from "./pages/EncuestasWhats/EncuestasWhats";

import CatalogoPreciosLayout from "./pages/CatalogoPrecios/CatalogoPreciosLayout";
import CatalogoPreciosIndex from "./pages/CatalogoPrecios/CatalogoPreciosIndex";

import TimeForActionLayout from "./pages/TimeForAction/TimeForActionLayout";
import TimeForAction from "./pages/TimeForAction/TimeForAction";

import ProtectedLayout from "./auth/ProtectedLayout";
import RequirePermission from "./auth/RequirePermission";
import { useAuth } from "./auth/AuthContext";

import AppShell from "./app/AppShell";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/LoginRegistro/LoginRegistro";

import Settings from "./pages/Settings";
import QR from "./pages/QR/GeneradorQR";

import CrmLayout from "./pages/crm/CrmLayout";
import CrmOverview from "./pages/crm/CrmOverview";
import CrmCases from "./pages/crm/CrmCases";

import DigitalesLayout from "./pages/Digitales/DigitalesLayout";
import DigitalesOverView from "./pages/Digitales/DigitalesOverView";
import DigitalesProspectos from "./pages/Digitales/DigitalesProspectos";
import DigitalesContacto from "./pages/Digitales/DigitalesContacto";
import DigitalesBandeja from "./pages/Digitales/DigitalesBandeja";
import DigitalesPlantillas from "./pages/Plantillas/Plantillas";

import CitasLayout from "./pages/Citas/CitasLayout";
import CitasOverView from "./pages/Citas/CitasOverView";
import RegistroCitas from "./pages/Citas/RegistroCitas";

import CitasPisoLayout from "./pages/CitasPiso/CitasPisoLayout";
import CitasPisoOverView from "./pages/CitasPiso/CitasPisoOverView";
import RegistroCitasPiso from "./pages/CitasPiso/RegistroCitasPiso";

import TraficoPiso from "./pages/TraficoPiso/TraficoPiso";

import PruebaManejoLayout from "./pages/PruebasManejo/PruebaManejoLayout";
import RegistroPruebaManejo from "./pages/PruebasManejo/RegistroPruebaManejo";

import EntregasLayout from "./pages/Entregas/EntregasLayout";
import RegistroEntregas from "./pages/Entregas/RegistroEntregas";

import CalidadLayout from "./pages/Calidad/CalidadLayout";
import CalidadIndex from "./pages/Calidad/CalidadIndex";

import ComercialLayout from "./pages/Comercial/ComercialLayout";
import ComercialIndex from "./pages/Comercial/ComercialIndex";

import UsadosIndex from "./pages/Usados/UsadosIndex";
import UsadosLayout from "./pages/Usados/UsadosLayout";

import FinancierosLayout from "./pages/Financieros/FinancierosLayout";
import FinancierosIndex from "./pages/Financieros/FinanierosIndex";

import AvaluosLayout from "./pages/Avaluos/AvaluosLayout";
import RegistroAvaluos from "./pages/Avaluos/RegistroAvaluos";

import PostVentaLayout from "./pages/PostVenta/PostVentaLayout";
import PostVentaIndex from "./pages/PostVenta/PostVentaIndex";

import AdministrativosIndex from "./pages/Administrativos/AdministrativosIndex";
import AdministrativosLayout from "./pages/Administrativos/AdministrativosLayout";

import CreditoLayout from "./pages/Credito/CreditoLayout";
import RegistroCredito from "./pages/Credito/RegistroCredito";

import LongDriveLayout from "./pages/LongDrive/LongLayout";
import RegistroLongDrive from "./pages/LongDrive/RegistroLong";

import RegistroSatisfaccion from "./pages/Satisfaccion/RegistroSatisfaccion";
import RegistroServicio from "./pages/Servicio/RegistroServicio";

import RegistroPiezas from "./pages/PedidoPiezas/RegistroPiezas";
import HojaIngresos from "./pages/HojaIngresos/HojaIngresos";
import Taller from "./pages/Taller/Taller";

import Safety from "./pages/SafetyCulture/Safety";

import Reclutamiento from "./pages/Reclutamiento/Reclutamiento";
import Puestos from "./pages/puestos/Puestos";
import AltaPersonal from "./pages/AltaPersonal/AltaPersonal";
import AmbienteLaboral from "./pages/AmbienteLaboral/AmbienteLaboral";

import CampanasMeta from "./pages/CampanasMeta/CampanasMeta";
import Retencion from "./pages/Retencion/Retencion";
import JDPower from "./pages/JDPower/JDPower";
import JDPowerServicio from "./pages/encuestaJDpowerservicio/JDPowerServicio";

import WhatsLayout from "./pages/EnvioWhats/EnvioLayout";
import WhatsIndex from "./pages/EnvioWhats/EnvioIndex";

import EncPiso from "./pages/Calidad/EncPiso";
import ConfigIA from "./pages/IA/ConfigIA";
import FlujoProcesos from "./pages/FlujoProcesos/FlujoProcesos";

import InventarioLayout from "./pages/Inventario/InventarioLayout";
import InventarioIndex from "./pages/Inventario/InventarioIndex";
import BitacoraMantenimiento from "./pages/Inventario/BitacoraMantenimiento";
import NoConformidad from "./pages/Calidad/NoConformidad";
import DigitalesRendimiento from "./pages/Digitales/DigitalesRendimiento";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

function tienePermiso(permisos = [], permisosPermitidos = []) {
    if (permisos.includes("ALL")) return true;
    return permisosPermitidos.some((permiso) => permisos.includes(permiso));
}

function obtenerRutaInicialPorUsuario(user) {
    const permisos = user?.permisos || [];

    if (
        tienePermiso(permisos, [
            "ALL",
            "USUARIOS_ADMIN",
            "CRM_CALIDAD",
            "CRM_RECLAMACIONES",
        ])
    ) {
        return "/";
    }

    if (permisos.includes("CRM_CALL_CENTER")) {
        return "/comercial/entregas";
    }

    if (permisos.includes("CRM_POSTVENTA")) {
        return "/postventa";
    }

    if (
        permisos.includes("CRM_DIGITALES") ||
        permisos.includes("CRM_VENTAS") ||
        permisos.includes("CRM_COORDINADOR_DIGITAL")
    ) {
        return "/comercial";
    }

    if (permisos.includes("CRM_FINANCIEROS")) {
        return "/financieros";
    }

    if (permisos.includes("CRM_RRHH")) {
        return "/administrativos";
    }

    return "/";
}

function InicioPorPermisos() {
    const { user, ready } = useAuth();

    if (ready === false) {
        return null;
    }

    const rutaInicial = obtenerRutaInicialPorUsuario(user);

    if (rutaInicial === "/") {
        return <Home />;
    }

    return <Navigate to={rutaInicial} replace />;
}

function ComercialIndexPorPermisos() {
    const { user, ready } = useAuth();

    if (ready === false) {
        return null;
    }

    const permisos = user?.permisos || [];

    const puedeVerIndexComercial = tienePermiso(permisos, [
        "ALL",
        "CRM_RECLAMACIONES",
        "CRM_DIGITALES",
        "CRM_VENTAS",
        "USUARIOS_ADMIN",
        "CRM_CALIDAD",
        "CRM_COORDINADOR_DIGITAL"
    ]);

    if (!puedeVerIndexComercial && permisos.includes("CRM_CALL_CENTER")) {
        return <Navigate to="/comercial/entregas" replace />;
    }

    return <ComercialIndex />;
}

function PostVentaIndexPorPermisos() {
    const { user, ready } = useAuth();

    if (ready === false) {
        return null;
    }

    const permisos = user?.permisos || [];

    const puedeVerIndexPostVenta = tienePermiso(permisos, [
        "ALL",
        "USUARIOS_ADMIN",
        "CRM_POSTVENTA",
        "CRM_CALIDAD",
    ]);

    if (!puedeVerIndexPostVenta && permisos.includes("CRM_CALL_CENTER")) {
        return <Navigate to="/postventa/hoja_ingresos" replace />;
    }

    return <PostVentaIndex />;
}

export const router = createBrowserRouter(
    [
        {
            path: "/login",
            element: <Login />,
        },
        {
            element: <ProtectedLayout />,
            children: [
                {
                    path: "/",
                    element: <AppShell />,
                    children: [
                        {
                            index: true,
                            element: <InicioPorPermisos />,
                        },

                        {
                            path: "calidad",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "USUARIOS_ADMIN",
                                        "CRM_CALIDAD",
                                    ]}
                                >
                                    <CalidadLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <CalidadIndex />,
                                },
                                {
                                    path: "reclamaciones",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_RECLAMACIONES",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <CrmLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <CrmCases />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CrmOverview />,
                                        },
                                    ],
                                },
                                {
                                    path: "enc_servicio",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_POSTVENTA",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <RegistroServicio />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "enc_satisfaccion",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <RegistroSatisfaccion />
                                        </RequirePermission>
                                    ),
                                },

                                {
                                    path: "jdpower",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_POSTVENTA",
                                            ]}
                                        >
                                            <JDPower />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "jdpower-servicio",
                                    element: (
                                        <RequirePermission anyOf={["CRM_DIGITALES", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_POSTVENTA"]}>
                                            <JDPowerServicio />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "no-conformidad",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <NoConformidad />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "enc_piso",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <EncPiso />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },
                        {
                            path: "comercial",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "CRM_DIGITALES",
                                        "CRM_VENTAS",
                                        "USUARIOS_ADMIN",
                                        "CRM_CALIDAD",
                                        "CRM_CALL_CENTER",
                                        "CRM_COORDINADOR_DIGITAL",
                                    ]}
                                >
                                    <ComercialLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <ComercialIndexPorPermisos />,
                                },
                                {
                                    path: "campanas_meta",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_VENTAS",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <CampanasMeta />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "prospectos",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_VENTAS",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <DigitalesLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <DigitalesProspectos />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <DigitalesOverView />,
                                        },
                                        {
                                            path: "plantillas",
                                            element: <DigitalesPlantillas />,
                                        },
                                        {
                                            path: "rendimiento_digitales",
                                            element: <DigitalesRendimiento />,
                                        },
                                        {
                                            path: "contacto",
                                            element: <DigitalesContacto />,
                                        },
                                        {
                                            path: "bandeja",
                                            element: <DigitalesBandeja />,
                                        },
                                    ],
                                },
                                {
                                    path: "citas",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <CitasLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCitas />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CitasOverView />,
                                        },
                                    ],
                                },
                                {
                                    path: "control_piso",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <CitasPisoLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCitasPiso />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CitasPisoOverView />,
                                        },
                                    ],
                                },
                                {
                                    path: "trafico_piso",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <TraficoPiso />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "pruebas_manejo",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <PruebaManejoLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroPruebaManejo />,
                                        },
                                    ],
                                },
                                {
                                    path: "entregas",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_CALL_CENTER",
                                                "CRM_COORDINADOR_DIGITAL",
                                            ]}
                                        >
                                            <EntregasLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroEntregas />,
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            path: "encuesta_whats",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "USUARIOS_ADMIN",
                                        "CRM_POSTVENTA",
                                    ]}
                                >
                                    <WhatsLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <WhatsIndex />,
                                },
                                {
                                    path: "envio_satisfaccion",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_POSTVENTA",
                                            ]}
                                        >
                                            <EncuestasWhats />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "usados",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "CRM_DIGITALES",
                                        "CRM_VENTAS",
                                        "USUARIOS_ADMIN",
                                        "CRM_CALIDAD",
                                    ]}
                                >
                                    <UsadosLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <UsadosIndex />,
                                },
                                {
                                    path: "avaluos",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "USUARIOS_ADMIN",
                                                "CRM_VENTAS",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <AvaluosLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroAvaluos />,
                                        },
                                    ],
                                },
                                {
                                    path: "ventas_cruzadas",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "USUARIOS_ADMIN",
                                                "CRM_VENTAS",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <DigitalesLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <DigitalesProspectos />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <DigitalesOverView />,
                                        },
                                        {
                                            path: "contacto",
                                            element: <DigitalesContacto />,
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            path: "financieros",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "CRM_FINANCIEROS",
                                        "CRM_DIGITALES",
                                        "CRM_VENTAS",
                                        "USUARIOS_ADMIN",
                                        "CRM_CALIDAD",
                                    ]}
                                >
                                    <FinancierosLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <FinancierosIndex />,
                                },
                                {
                                    path: "credito",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_FINANCIEROS",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <CreditoLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCredito />,
                                        },
                                    ],
                                },
                                {
                                    path: "long_drive",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_FINANCIEROS",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <LongDriveLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroLongDrive />,
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            path: "postventa",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "USUARIOS_ADMIN",
                                        "CRM_POSTVENTA",
                                        "CRM_CALIDAD",
                                        "CRM_CALL_CENTER",
                                    ]}
                                >
                                    <PostVentaLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <PostVentaIndexPorPermisos />,
                                },

                                {
                                    path: "pedidos_piezas",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_POSTVENTA",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <RegistroPiezas />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "hoja_ingresos",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_POSTVENTA",
                                                "CRM_CALIDAD",
                                                "CRM_CALL_CENTER",
                                            ]}
                                        >
                                            <HojaIngresos />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "taller",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_POSTVENTA",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <Taller />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "retencion",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_POSTVENTA",
                                            ]}
                                        >
                                            <Retencion />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "safety",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_CALIDAD",
                                                "CRM_POSTVENTA",
                                            ]}
                                        >
                                            <Safety />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "inventario",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"]}>
                                    <InventarioLayout />
                                </RequirePermission>
                            ),
                            children: [
                                { index: true, element: <InventarioIndex /> },
                                {
                                    path: "bitacora_mantenimiento",
                                    element: (
                                        <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"]}>
                                            <BitacoraMantenimiento />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "administrativos",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "USUARIOS_ADMIN",
                                        "CRM_RRHH",
                                        "CRM_CALIDAD",
                                    ]}
                                >
                                    <AdministrativosLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <AdministrativosIndex />,
                                },
                                {
                                    path: "reclutamiento",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_RRHH",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <Reclutamiento />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "alta-personal",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_RRHH",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <AltaPersonal />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "puestos",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_RRHH",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <Puestos />
                                        </RequirePermission>
                                    ),
                                },
                                {
                                    path: "ambiente-laboral",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "USUARIOS_ADMIN",
                                                "CRM_RRHH",
                                                "CRM_CALIDAD",
                                            ]}
                                        >
                                            <AmbienteLaboral />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "timeforaction",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "USUARIOS_ADMIN",
                                        "CRM_CALIDAD",
                                    ]}
                                >
                                    <TimeForActionLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <TimeForAction />,
                                },
                            ],
                        },

                        {
                            path: "qr",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN"]}>
                                    <QR />
                                </RequirePermission>
                            ),
                        },

                        {
                            path: "flujo_procesos",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN"]}>
                                    <FlujoProcesos />
                                </RequirePermission>
                            ),
                        },

                        {
                            path: "configuracion_ia",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_DIGITALES", "CRM_COORDINADOR_DIGITAL"]}>
                                    <ConfigIA />
                                </RequirePermission>
                            ),
                        },

                        {
                            path: "configuracion",
                            element: <Settings />,
                        },

                        {
                            path: "*",
                            element: <NotFound />,
                        },
                    ],
                },
            ],
        },

        {
            path: "*",
            element: <NotFound />,
        },
    ],
    {
        basename,
    }
);