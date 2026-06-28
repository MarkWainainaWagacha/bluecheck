import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Attendee {
  id: string;
  name: string;
  studentId: string;
  enrolledAt: number;
  signalStrength: number;
}

export interface Session {
  id: string;
  name: string;
  courseCode: string;
  lecturerName: string;
  lecturerId: string;
  bluetoothId: string;
  sessionCode: string;
  location: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  attendees: Attendee[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: "lecturer" | "student";
  studentId?: string;
}

interface AppContextType {
  user: UserProfile | null;
  sessions: Session[];
  setUser: (user: UserProfile) => Promise<void>;
  createSession: (
    data: Omit<Session, "id" | "attendees" | "isActive" | "startTime" | "lecturerName" | "lecturerId" | "bluetoothId" | "sessionCode">
  ) => Promise<Session>;
  terminateSession: (sessionId: string) => Promise<void>;
  enrollInSession: (
    sessionId: string,
    attendee: Omit<Attendee, "enrolledAt">
  ) => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearUser: () => Promise<void>;
}

const SESSIONS_KEY = "attendance_radar_sessions_v2";
const USER_KEY = "attendance_radar_user_v2";

const AppContext = createContext<AppContextType | null>(null);

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function genBluetoothId(): string {
  const hex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0");
  return `AR-${hex()}${hex()}-${hex()}${hex()}`;
}

function genSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [u, s] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(SESSIONS_KEY),
        ]);
        if (u) setUserState(JSON.parse(u));
        if (s) setSessions(JSON.parse(s));
      } catch {}
    })();
  }, []);

  const saveSessions = async (updated: Session[]) => {
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  };

  const setUser = async (u: UserProfile) => {
    setUserState(u);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const clearUser = async () => {
    setUserState(null);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const createSession = async (
    data: Omit<Session, "id" | "attendees" | "isActive" | "startTime" | "lecturerName" | "lecturerId" | "bluetoothId">
  ): Promise<Session> => {
    if (!user) throw new Error("No user");
    const session: Session = {
      ...data,
      id: genId(),
      bluetoothId: genBluetoothId(),
      sessionCode: genSessionCode(),
      lecturerName: user.name,
      lecturerId: user.id,
      startTime: Date.now(),
      isActive: true,
      attendees: [],
    };
    const updated = [...sessions, session];
    await saveSessions(updated);
    return session;
  };

  const terminateSession = async (sessionId: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, isActive: false, endTime: Date.now() } : s
    );
    await saveSessions(updated);
  };

  const enrollInSession = async (
    sessionId: string,
    attendee: Omit<Attendee, "enrolledAt">
  ) => {
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const alreadyEnrolled = s.attendees.some((a) => a.id === attendee.id);
      if (alreadyEnrolled) return s;
      return {
        ...s,
        attendees: [
          ...s.attendees,
          { ...attendee, enrolledAt: Date.now() },
        ],
      };
    });
    await saveSessions(updated);
  };

  const refreshSessions = useCallback(async () => {
    try {
      const s = await AsyncStorage.getItem(SESSIONS_KEY);
      if (s) setSessions(JSON.parse(s));
    } catch {}
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        sessions,
        setUser,
        createSession,
        terminateSession,
        enrollInSession,
        refreshSessions,
        clearUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
