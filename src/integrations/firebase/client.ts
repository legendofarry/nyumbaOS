// src\integrations\firebase\client.ts
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
  query as firebaseQuery,
  setDoc,
  updateDoc,
  where as firebaseWhere,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "nyumbaos",
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

function normalizeDate(value: any) {
  if (!value) return value;
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeFloor(value: any) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "0").trim().toLowerCase();
  if (!text || text === "ground" || text === "g") return 0;
  if (text === "first" || text === "1st") return 1;
  if (text === "second" || text === "2nd") return 2;
  if (text === "third" || text === "3rd") return 3;
  const match = text.match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

function normalizeStatus(value: any) {
  const text = String(value ?? "Vacant").trim().toLowerCase();
  if (text === "occupied") return "Occupied";
  if (text === "maintenance") return "Maintenance";
  return "Vacant";
}

function normalizeBedrooms(value: any) {
  const text = String(value ?? "Bedsitter").trim();
  const lower = text.toLowerCase();
  if (lower === "bedsitter" || lower === "studio") return "Bedsitter";
  const match = lower.match(/\d+/);
  if (match) return `${Number(match[0])} Bedroom`;
  return text;
}

function normalizeRow(table: string, id: string, data: any) {
  const row = {
    id,
    ...data,
    created_at: normalizeDate(data.created_at),
    updated_at: normalizeDate(data.updated_at),
    date: normalizeDate(data.date),
    expires_at: normalizeDate(data.expires_at),
    lease_start: normalizeDate(data.lease_start),
    lease_end: normalizeDate(data.lease_end),
  };

  if (table === "units") {
    return {
      ...row,
      number: String(data.number ?? data.unit_number ?? data.name ?? id),
      floor: normalizeFloor(data.floor),
      bedrooms: normalizeBedrooms(data.bedrooms ?? data.type ?? data.bedroom_type),
      rent: Number(data.rent ?? data.monthly_rent ?? 0),
      status: normalizeStatus(data.status),
      created_at: normalizeDate(data.created_at) ?? new Date(0).toISOString(),
    };
  }

  return row;
}

function withInsertDefaults(table: string, data: any) {
  const now = new Date().toISOString();
  const item = { ...data };

  if (!item.created_at) item.created_at = now;

  if (table === "units") {
    item.number = String(item.number ?? "");
    item.floor = normalizeFloor(item.floor);
    item.bedrooms = normalizeBedrooms(item.bedrooms);
    item.rent = Number(item.rent ?? 0);
    item.status = normalizeStatus(item.status);
  }

  if (table === "profiles") {
    if (!item.updated_at) item.updated_at = now;
    if (item.phone === undefined) item.phone = null;
    if (item.unit_id === undefined) item.unit_id = null;
  }

  if (table === "payments") {
    if (!item.date) item.date = now.slice(0, 10);
    if (item.note === undefined) item.note = null;
    item.amount = Number(item.amount ?? 0);
  }

  if (table === "tickets") {
    if (item.description === undefined) item.description = null;
    if (item.unit_id === undefined) item.unit_id = null;
    if (item.created_by === undefined) item.created_by = null;
    if (!item.priority) item.priority = "Normal";
    if (!item.status) item.status = "Open";
    item.cost = Number(item.cost ?? 0);
  }

  if (table === "notices") {
    item.pinned = Boolean(item.pinned);
  }

  if (table === "readings" || table === "events") {
    if (!item.date) item.date = now.slice(0, 10);
  }

  return item;
}

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
          for (const rawItem of insertData) {
            const item = withInsertDefaults(table, rawItem);
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

        const item = withInsertDefaults(table, insertData);
        if (item?.id) {
          await setDoc(doc(db, table, item.id), item);
          return { data: [{ id: item.id, ...item }] };
        }

        const result = await addDoc(colRef, item);
        return { data: [{ id: result.id, ...item }] };
      } catch (error) {
        return { data: null, error };
      }
    }

    if (mode === "update" || mode === "delete") {
      try {
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
      } catch (error) {
        return { data: null, error };
      }
    }

    const idFilter = filters.find((filter) => filter.field === "id" && filter.op === "==");
    if (idFilter) {
      const snap = await getDoc(doc(db, table, idFilter.value));
      const data = snap.exists() ? [normalizeRow(table, snap.id, snap.data() as any)] : [];
      if (single) return { data: data[0] ?? null };
      return { data };
    }

    try {
      const clauses = buildWhereClauses();
      const queryRef = clauses.length ? firebaseQuery(colRef, ...clauses) : firebaseQuery(colRef);
      const snap = await getDocs(queryRef as any);
      let data = snap.docs.map((item) => normalizeRow(table, item.id, item.data() as any));

      data = applyClientOrdering(data);
      if (limitNum) data = data.slice(0, limitNum);

      if (single) return { data: data[0] ?? null };
      return { data };
    } catch (error) {
      return { data: single ? null : [], error };
    }
  }

  function buildWhereClauses() {
    const clauses: any[] = [];
    for (const filter of filters) {
      if (filter.op === "==") clauses.push(firebaseWhere(filter.field, "==", filter.value));
      if (filter.op === "not_null") clauses.push(firebaseWhere(filter.field, "!=", null));
    }
    return clauses;
  }

  function applyClientOrdering(rows: any[]) {
    if (!orders.length) return rows;

    return [...rows].sort((a, b) => {
      for (const order of orders) {
        const left = a[order.field];
        const right = b[order.field];
        const direction = order.dir === "asc" ? 1 : -1;

        if (left == null && right == null) continue;
        if (left == null) return 1;
        if (right == null) return -1;

        const result =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });

        if (result !== 0) return result * direction;
      }
      return 0;
    });
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
  async rpc(name: string, _params: any) {
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
