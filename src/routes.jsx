import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AppShell from "./app/AppShell";
import Home from "./pages/Home";
import SafetyDashboard from "./pages/SafetyDashboard";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/LoginRegistro/LoginRegistro";

import CrmLayout from "./pages/crm/CrmLayout";
import CrmOverview from "./pages/crm/CrmOverview";
import CrmCases from "./pages/crm/CrmCases";
import CrmEditaCaso from "./pages/crm/CrmEditaCaso";
import CrmSettings from "./pages/crm/CrmSettings";

export const router = createBrowserRouter([
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
            { path: "safety", element: <SafetyDashboard /> },
            { path: "proyectos", element: <ProjectsDashboard /> },

            { path: "*", element: <NotFound /> },
        ],
    },
    { path: "/crm/casos/:chasis/editar", element: <CrmEditaCaso /> },
    { path: "/login", element: <Login /> },
    { path: "*", element: <NotFound /> },
]);
