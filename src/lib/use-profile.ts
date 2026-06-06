import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "@/integrations/client";
import type { Profile } from "@/integrations/types";

type SessionProfileState = {
  data: Profile | null;
  isLoading: boolean;
  user: User | null;
};

export function useSessionProfile(): SessionProfileState {
  const [data, setData] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (nextUser) => {
      profileUnsubscribe?.();
      setUser(nextUser);

      if (!nextUser) {
        setData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      profileUnsubscribe = onSnapshot(
        doc(db, "profiles", nextUser.uid),
        (snapshot) => {
          setData(snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Profile) } as Profile) : null);
          setIsLoading(false);
        },
        (error) => {
          console.error(error);
          setData(null);
          setIsLoading(false);
        },
      );
    });

    return () => {
      profileUnsubscribe?.();
      authUnsubscribe();
    };
  }, []);

  return { data, isLoading, user };
}
