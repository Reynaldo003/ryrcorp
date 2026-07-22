// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./routes.jsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";
import NotificacionesWhatsappRoot from "./app/NotificacionesWhatsappRoot";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificacionesWhatsappRoot />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);