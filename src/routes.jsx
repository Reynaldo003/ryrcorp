// src/routes.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AppShell from "./app/AppShell";
import Home from "./pages/Home";
import SafetyDashboard from "./pages/SafetyDashboard";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import NotFound from "./pages/NotFound";

// CRM layout + pages
import CrmLayout from "./pages/crm/CrmLayout";
import CrmOverview from "./pages/crm/CrmOverview";
import CrmCases from "./pages/crm/CrmCases";
import CrmClients from "./pages/crm/CrmClients";
import CrmActions from "./pages/crm/CrmActions";
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
                    { index: true, element: <CrmOverview /> },
                    { path: "casos", element: <CrmCases /> },
                    { path: "clientes", element: <CrmClients /> },
                    { path: "clientesVir", element: <CrmClients /> },
                    //  { path: "acciones", element: <CrmActions /> },
                    // { path: "configuracion", element: <CrmSettings /> },
                ],
            },
            { path: "safety", element: <SafetyDashboard /> },
            { path: "proyectos", element: <ProjectsDashboard /> },

            { path: "*", element: <NotFound /> },
        ],
    },

    { path: "*", element: <NotFound /> },
]);
