import React from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedLayout from "./auth/ProtectedLayout";

import AppShell from "./app/AppShell";
import Home from "./pages/Home";
import SafetyDashboard from "./pages/SafetyDashboard";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/LoginRegistro/LoginRegistro";

import CrmLayout from "./pages/crm/CrmLayout";
import CrmOverview from "./pages/crm/CrmOverview";
import CrmCases from "./pages/crm/CrmCases";

import Settings from "./pages/Settings";

import DigitalesLayout from "./pages/Digitales/DigitalesLayout";
import DigitalesOverView from "./pages/Digitales/DigitalesOverView";
import DigitalesProspectos from "./pages/Digitales/DigitalesProspectos";
import DigitalesContacto from "./pages/Digitales/DigitalesContacto";

export const router = createBrowserRouter([
    // Públicas
    { path: "/login", element: <Login /> },

    // Protegidas
    {
        element: <ProtectedLayout />,
        children: [
            {
                path: "/",
                element: <AppShell />,
                children: [
                    { index: true, element: <Home /> },
                    {
                        path: "crm",
                        element: <CrmLayout />,
                        children: [
                            { index: true, element: <CrmCases /> },
                            { path: "resumen", element: <CrmOverview /> },
                        ],
                    },
                    {
                        path: "crm_digitales",
                        element: <DigitalesLayout />,
                        children: [
                            { index: true, element: <DigitalesProspectos /> },
                            { path: "resumen", element: <DigitalesOverView /> },
                            { path: "contacto", element: <DigitalesContacto /> },
                        ],
                    },
                    { path: "safety", element: <SafetyDashboard /> },
                    { path: "proyectos", element: <ProjectsDashboard /> },
                    { path: "*", element: <NotFound /> },
                ],
            },

            // Si /configuracion también debe ser privada, déjala aquí:
            { path: "/configuracion", element: <Settings /> },
        ],
    },

    // Fallback global
    { path: "*", element: <NotFound /> },
]);
