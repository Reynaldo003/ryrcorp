import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "1729-2806-10a6-6-2142-49ed-5b4d-d374-ac68.ngrok-free.app",
      "ryrcorp.vercel.app",
    ],
  },
});
