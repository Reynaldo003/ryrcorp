// src/hooks/useUserColors.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClickup } from "../lib/apiClickup";

export const USER_COLOR_PALETTE = [
    "#131E5C",
    "#0f766e",
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ea580c",
    "#ef4444",
    "#7c3aed",
    "#db2777",
    "#0d9488",
    "#4f46e5",
    "#64748b",
];

const COLOR_CHANGED_EVENT = "ryr:user-colors-changed";

function normalizeUserId(userId) {
    return Number(userId);
}

/**
 * Devuelve el color asignado a un usuario, o uno por defecto y estable
 * derivado de su id si aún no tiene color personalizado.
 */
export function userColorOf(userColors, userId) {
    const key = normalizeUserId(userId);
    if (!key) return USER_COLOR_PALETTE[0];
    return (
        userColors?.[key]
        || USER_COLOR_PALETTE[key % USER_COLOR_PALETTE.length]
    );
}

/**
 * Carga los miembros del equipo activo con su color asignado,
 * y permite cambiar el color de cada usuario (guardado en la BD compartida).
 */
export function useUserColors(teamId) {
    const [members, setMembers] = useState([]);
    const [version, setVersion] = useState(0);
    const aliveRef = useRef(true);

    useEffect(() => {
        aliveRef.current = true;
        if (!teamId) {
            setMembers([]);
            return undefined;
        }

        let alive = true;
        apiClickup
            .getTeamMembers(Number(teamId))
            .then((list) => {
                if (alive) setMembers(list);
            })
            .catch((error) => {
                console.error("Error cargando miembros:", error);
            });

        const onColorChanged = () => setVersion((prev) => prev + 1);
        window.addEventListener(COLOR_CHANGED_EVENT, onColorChanged);

        return () => {
            alive = false;
            aliveRef.current = false;
            window.removeEventListener(COLOR_CHANGED_EVENT, onColorChanged);
        };
    }, [teamId, version]);

    const userColors = useMemo(() => {
        const out = {};
        for (const member of members) {
            const uid = normalizeUserId(member?.user_id);
            if (uid && member?.color) {
                out[uid] = member.color;
            }
        }
        return out;
    }, [members]);

    const setUserColor = useCallback(
        async (userId, color) => {
            if (!teamId) return;
            const uid = normalizeUserId(userId);
            const member = members.find((m) => normalizeUserId(m.user_id) === uid);
            if (!member || !member.id) return;

            await apiClickup.setMemberColor(
                Number(teamId),
                Number(member.id),
                color
            );
            window.dispatchEvent(new CustomEvent(COLOR_CHANGED_EVENT));
        },
        [teamId, members]
    );

    return {
        members,
        userColors,
        colorForUser: useMemo(
            () => (userId) => userColorOf(userColors, userId),
            [userColors]
        ),
        setUserColor,
    };
}