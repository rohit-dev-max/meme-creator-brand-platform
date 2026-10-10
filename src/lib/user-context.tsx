"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CurrentUser {
  id: string;
  handle: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  bio: string;
  role: string;
  xp: number;
  level: number;
  followers: number;
  verified: boolean;
}

interface UserContextValue {
  user: CurrentUser | null;
  users: CurrentUser[];
  loading: boolean;
  switchUser: (id: string) => void;
  refreshUsers: () => Promise<void>;
  createUser: (handle: string, displayName: string) => Promise<CurrentUser | null>;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = "memearena-user-id";

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      const list: CurrentUser[] = data.users ?? [];
      setUsers(list);
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (list.length > 0) {
        const found = saved ? list.find((u) => u.id === saved) : null;
        setUser(found ?? list[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const switchUser = (id: string) => {
    const found = users.find((u) => u.id === id);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  const createUser = async (handle: string, displayName: string) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, displayName }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await refreshUsers();
    if (data.user) {
      setUser(data.user);
      localStorage.setItem(STORAGE_KEY, data.user.id);
    }
    return data.user ?? null;
  };

  return (
    <UserContext.Provider value={{ user, users, loading, switchUser, refreshUsers, createUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider");
  return ctx;
}

export function timeAgo(dateStr: string | Date) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export function levelProgress(xp: number) {
  const inLevel = xp % 1000;
  return Math.round((inLevel / 1000) * 100);
}
