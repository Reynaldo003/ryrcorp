import { http } from "./apiClient";

const BASE = "/api/BitacoraMantenimiento";

export const apiBitacora = {
    async listar() {
        const data = await http(`${BASE}/bitacoras/lista/`);
        return Array.isArray(data) ? data : [];
    },
};