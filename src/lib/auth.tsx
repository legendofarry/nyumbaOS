import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { firebaseClient, shouldForgetRememberedSession } from "@/integrations/firebase/client";
type User = { id: string; email?: string | null };
type Session = { user: User } | null;
import type { Role, Profile } from "./types";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, role: null, profile: null, loading: true,
  signOut: async () => {}, refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (uid: string) => {
    const [{ data: roles }, { data: prof }] = await Promise.all([
      firebaseClient.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
      firebaseClient.from("profiles").select("*").eq("id", uid).maybeSingle(),
    ]);
    setRole((roles?.role as Role) ?? null);
    setProfile((prof as Profile) ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = firebaseClient.auth.onAuthStateChange(async (_e, sess) => {
      setLoading(true);

      if (sess?.user && shouldForgetRememberedSession()) {
        await firebaseClient.auth.signOut();
        setSession(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(sess);
      if (sess?.user) {
        await loadExtras(sess.user.id);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (session?.user) await loadExtras(session.user.id);
  };

  const signOut = async () => {
    await firebaseClient.auth.signOut();
    setRole(null);
    setProfile(null);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, role, profile, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
