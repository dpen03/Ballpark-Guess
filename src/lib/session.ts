import { useState, useEffect } from "react";

export interface PlayerSession {
  code: string;
  playerId: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

export function getSession(code: string): PlayerSession | null {
  try {
    const data = localStorage.getItem(`ballpark-session-${code}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: PlayerSession) {
  try {
    localStorage.setItem(`ballpark-session-${session.code}`, JSON.stringify(session));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

export function useSession(code: string) {
  const [session, setSession] = useState<PlayerSession | null>(() => getSession(code));

  useEffect(() => {
    const current = getSession(code);
    setSession(current);
  }, [code]);

  const updateSession = (newSession: PlayerSession) => {
    saveSession(newSession);
    setSession(newSession);
  };

  return { session, updateSession };
}
