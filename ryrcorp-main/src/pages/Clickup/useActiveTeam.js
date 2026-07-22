// src/pages/Clickup/useActiveTeam.js
import { useCallback, useState } from "react";

const STORAGE_KEY = "clickup_team_id";

function readStoredTeamId() {
  const value = localStorage.getItem(STORAGE_KEY);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export function useActiveTeam() {
  const [teamId, setTeamIdState] = useState(readStoredTeamId);

  const setTeam = useCallback((id) => {
    const numberValue = Number(id);
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      localStorage.removeItem(STORAGE_KEY);
      setTeamIdState(null);
      return;
    }
    localStorage.setItem(STORAGE_KEY, String(numberValue));
    setTeamIdState(numberValue);
  }, []);

  const clearTeam = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTeamIdState(null);
  }, []);

  return { teamId, setTeam, clearTeam };
}
