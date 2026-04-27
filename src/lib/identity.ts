import { useState, useEffect, useCallback } from "react";

export const AVATARS = ["⚾️", "🧤", "🏏", "🧢", "🥜", "🌭", "🍿", "⭐️"];

export interface Identity {
  name: string;
  avatar: string;
}

const KEY = "ballpark-identity";

export function getIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function saveIdentity(id: Identity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    // ignore
  }
}

export function useIdentity() {
  const [identity, setIdentityState] = useState<Identity | null>(() =>
    getIdentity(),
  );
  useEffect(() => {
    setIdentityState(getIdentity());
  }, []);
  const setIdentity = useCallback((id: Identity) => {
    saveIdentity(id);
    setIdentityState(id);
  }, []);
  return { identity, setIdentity };
}
