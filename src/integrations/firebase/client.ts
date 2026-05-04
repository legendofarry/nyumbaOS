import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit as firebaseLimit,
  orderBy as firebaseOrderBy,
  query as firebaseQuery,
  setDoc,
  updateDoc,
  where as firebaseWhere,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Firebase is missing configuration values: ${missing.join(", ")}`);
  }
}

function initializeFirebaseApp(): FirebaseApp {
  assertFirebaseConfig();
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp = initializeFirebaseApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

const REMEMBER_UNTIL_KEY = "nyumbaos.auth.rememberUntil";
const OWNER_CODE = "OWNER2026";
const ASSISTANT_CODE = "ASSISTANT2026";

function setRememberUntil(rememberForWeek?: boolean) {
  if (typeof window === "undefined") return;

  if (!rememberForWeek) {
    window.localStorage.removeItem(REMEMBER_UNTIL_KEY);
    return;
  }

  const weekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  window.localStorage.setItem(REMEMBER_UNTIL_KEY, String(weekFromNow));
}

export function shouldForgetRememberedSession() {
  if (typeof window === "undefined") return false;

  const raw = window.localStorage.getItem(REMEMBER_UNTIL_KEY);
  if (!raw) return false;

  const expiry = Number(raw);
  return Number.isFinite(expiry) && Date.now() > expiry;
}

async function applyAuthPersistence(rememberForWeek?: boolean) {
  await setPersistence(
    auth,
    rememberForWeek ? browserLocalPersistence : browserSessionPersistence,
  );
  setRememberUntil(rememberForWeek);
}

async function roleExists(role: "owner" | "assistant") {
  const rolesQuery = firebaseQuery(
    collection(db, "user_roles"),
    firebaseWhere("role", "==", role),
    firebaseLimit(1),
  );
  const rolesSnap = await getDocs(rolesQuery as any);
  return !rolesSnap.empty;
}

function wrapUser(user: any) {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email ?? null,
  };
}

function createBuilder(table: string) {
  let mode: "select" | "insert" | "update" | "delete" = "select";
  const filters: Array<any> = [];
  const orders: Array<{ field: string; dir: "asc" | "desc" }> = [];
  let updates: any = undefined;
  let insertData: any = undefined;
  let single = false;
  let limitNum: number | undefined = undefined;

  const api: any = {
    select() {
      return api;
    },
    order(field: string, opts?: { ascending?: boolean }) {
      orders.push({ field, dir: opts?.ascending === false ? "desc" : "asc" });
      return api;
    },
    not(field: string, op: string, val: any) {
      if (op === "is" && val === null) filters.push({ field, op: "not_null" });
      return api;
    },
    maybeSingle() {
      single = true;
      return api;
    },
    limit(n: number) {
      limitNum = n;
      return api;
    },
    insert(data: any) {
      mode = "insert";
      insertData = data;
      return api;
    },
    update(data: any) {
      mode = "update";
      updates = data;
      return api;
    },
    delete() {
      mode = "delete";
      return api;
    },
    eq(field: string, value: any) {
      filters.push({ field, op: "==", value });
      return api;
    },
    async then(resolve: any, reject: any) {
      try {
        const res = await execute();
        if (resolve) return resolve(res);
        return res;
      } catch (error) {
        if (reject) return reject(error);
        throw error;
      }
    },
  };

  async function execute() {
    const colRef = collection(db, table);

    if (mode === "insert") {
      try {
        if (Array.isArray(insertData)) {
          const results: any[] = [];
          for (const item of insertData) {
            if (item.id) {
              await setDoc(doc(db, table, item.id), item);
              results.push({ id: item.id, ...item });
            } else {
              const result = await addDoc(colRef, item);
              results.push({ id: result.id, ...item });
            }
          }
          return { data: results };
        }

        if (insertData?.id) {
          await setDoc(doc(db, table, insertData.id), insertData);
          return { data: [{ id: insertData.id, ...insertData }] };
        }

        const result = await addDoc(colRef, insertData);
        return { data: [{ id: result.id, ...insertData }] };
      } catch (error) {
        return { data: null, error };
      }
    }

    if (mode === "update" || mode === "delete") {
      const idFilter = filters.find((filter) => filter.field === "id" && filter.op === "==");

      if (idFilter) {
        const ref = doc(db, table, idFilter.value);
        if (mode === "delete") {
          await deleteDoc(ref);
          return { data: null };
        }

        await updateDoc(ref, updates);
        const updated = await getDoc(ref);
        return {
          data: updated.exists() ? { id: updated.id, ...(updated.data() as any) } : null,
        };
      }

      let queryRef = colRef as any;
      const whereClauses = buildWhereClauses();
      if (whereClauses.length) queryRef = firebaseQuery(colRef, ...whereClauses);

      const snap = await getDocs(queryRef as any);
      for (const item of snap.docs) {
        if (mode === "delete") await deleteDoc(item.ref);
        else await updateDoc(item.ref, updates);
      }

      return { data: null };
    }

    const idFilter = filters.find((filter) => filter.field === "id" && filter.op === "==");
    if (idFilter) {
      const snap = await getDoc(doc(db, table, idFilter.value));
      const data = snap.exists() ? [{ id: snap.id, ...(snap.data() as any) }] : [];
      if (single) return { data: data[0] ?? null };
      return { data };
    }

    const clauses = [
      ...buildWhereClauses(),
      ...orders.map((order) => firebaseOrderBy(order.field, order.dir)),
    ];
    if (limitNum) clauses.push(firebaseLimit(limitNum));

    const queryRef = clauses.length ? firebaseQuery(colRef, ...clauses) : firebaseQuery(colRef);
    const snap = await getDocs(queryRef as any);
    const data = snap.docs.map((item) => ({ id: item.id, ...(item.data() as any) }));

    if (single) return { data: data[0] ?? null };
    return { data };
  }

  function buildWhereClauses() {
    const clauses: any[] = [];
    for (const filter of filters) {
      if (filter.op === "==") clauses.push(firebaseWhere(filter.field, "==", filter.value));
      if (filter.op === "not_null") clauses.push(firebaseWhere(filter.field, "!=", null));
    }
    return clauses;
  }

  return api;
}

export const firebaseClient = {
  auth: {
    onAuthStateChange(cb: (event: string, session: any) => void) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        cb(user ? "SIGNED_IN" : "SIGNED_OUT", user ? { user: wrapUser(user) } : null);
      });

      return { data: { subscription: { unsubscribe } } };
    },
    async getSession() {
      const user = auth.currentUser;
      return { data: { session: user ? { user: wrapUser(user) } : null } };
    },
    async getUser() {
      const user = auth.currentUser;
      return { data: { user: user ? wrapUser(user) : null } };
    },
    async signUp({ email, password, options, rememberForWeek }: any) {
      try {
        await applyAuthPersistence(rememberForWeek);
        const data = options?.data ?? {};
        const now = new Date().toISOString();
        const privilegedRole =
          data.owner_code === OWNER_CODE
            ? "owner"
            : data.assistant_code === ASSISTANT_CODE
              ? "assistant"
              : null;

        if (data.owner_code && data.owner_code !== OWNER_CODE) {
          throw new Error("Invalid owner code.");
        }

        if (data.assistant_code && data.assistant_code !== ASSISTANT_CODE) {
          throw new Error("Invalid assistant code.");
        }

        if (privilegedRole && (await roleExists(privilegedRole))) {
          throw new Error(
            privilegedRole === "owner"
              ? "An owner account already exists. Please sign in."
              : "An owner assistant account already exists. Please sign in.",
          );
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        await setDoc(doc(db, "profiles", uid), {
          full_name: data.full_name ?? "",
          phone: data.phone ?? null,
          unit_id: null,
          login_email: data.account_type === "tenant" ? email : null,
          created_at: now,
          updated_at: now,
        });

        if (privilegedRole) {
          await setDoc(doc(db, "user_roles", uid), {
            user_id: uid,
            role: privilegedRole,
            created_at: now,
          });
        }

        if (data.account_type === "tenant") {
          await setDoc(doc(db, "user_roles", uid), {
            user_id: uid,
            role: "tenant",
            created_at: now,
          });
        }

        if (data.invite_code) {
          const inviteQuery = firebaseQuery(
            collection(db, "invites"),
            firebaseWhere("code", "==", data.invite_code),
            firebaseWhere("used", "==", false),
          );
          const inviteSnap = await getDocs(inviteQuery as any);
          const inviteDoc = inviteSnap.docs[0];

          if (inviteDoc) {
            const invite = inviteDoc.data() as any;
            await setDoc(doc(db, "profiles", uid), {
              full_name: invite.full_name ?? data.full_name ?? "",
              phone: invite.phone ?? null,
              unit_id: invite.unit_id,
              login_email: email,
              created_at: now,
              updated_at: now,
            });
            await setDoc(doc(db, "user_roles", uid), {
              user_id: uid,
              role: "tenant",
              created_at: now,
            });
            await updateDoc(inviteDoc.ref, { used: true, used_by: uid, used_at: now });
            if (invite.unit_id) {
              await updateDoc(doc(db, "units", invite.unit_id), { status: "Occupied" });
            }
          }
        }

        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    async signInWithPassword({ email, password, rememberForWeek }: any) {
      try {
        await applyAuthPersistence(rememberForWeek);
        await signInWithEmailAndPassword(auth, email, password);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    async signOut() {
      setRememberUntil(false);
      await firebaseSignOut(auth);
    },
  },
  from(table: string) {
    return createBuilder(table);
  },
  async rpc(name: string, params: any) {
    if (name === "lookup_invite") {
      const inviteQuery = firebaseQuery(
        collection(db, "invites"),
        firebaseWhere("code", "==", params._code),
      );
      const snap = await getDocs(inviteQuery as any);
      const out: any[] = [];

      for (const item of snap.docs) {
        const invite = item.data() as any;
        const unit = await getDoc(doc(db, "units", invite.unit_id));
        out.push({
          id: item.id,
          unit_id: invite.unit_id,
          unit_number: unit.exists() ? (unit.data() as any).number : null,
          full_name: invite.full_name,
          used: invite.used,
        });
      }

      return { data: out };
    }

    return { data: null, error: new Error(`RPC not implemented: ${name}`) };
  },
  async privilegedAccountStatus() {
    const [owner, assistant] = await Promise.all([
      roleExists("owner"),
      roleExists("assistant"),
    ]);

    return { owner, assistant };
  },
};

export default firebaseClient;
