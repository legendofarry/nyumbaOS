// Firebase-backed compatibility layer exposing a minimal supabase-like API
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query as fsQuery,
  where as fsWhere,
  orderBy as fsOrderBy,
  getDocs,
  addDoc,
  setDoc,
  doc as fsDoc,
  limit as fsLimit,
  onSnapshot,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: any;
if (getApps().length === 0) {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('[Firebase] Missing VITE_FIREBASE_* env vars.');
  }
  try { app = initializeApp(firebaseConfig); } catch (e) { app = getApp(); }
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

function makeBuilder(collectionName: string) {
  const filters: Array<{ field: string; op: any; value: any }> = [];
  const orders: Array<{ field: string; dir: 'asc' | 'desc' }> = [];
  let _limit: number | undefined;
  let wantSingle = false;
  let orRaw: string | null = null;

  const builder: any = {
    select(_fields?: string) { return builder; },
    eq(field: string, value: any) { filters.push({ field, op: '==', value }); return builder; },
    order(field: string, opts?: { ascending?: boolean }) { orders.push({ field, dir: opts && opts.ascending === false ? 'desc' : 'asc' }); return builder; },
    limit(n: number) { _limit = n; return builder; },
    or(str: string) { orRaw = str; return builder; },
    maybeSingle() { wantSingle = true; return builder; },
    insert: async (payload: any) => {
      try {
        const now = new Date().toISOString();
        const data = { ...payload, created_at: payload.created_at ?? now };
        if (payload.id) {
          await setDoc(fsDoc(db, collectionName, payload.id), data);
          return { data: { id: payload.id, ...data }, error: null };
        }
        const ref = await addDoc(collection(db, collectionName), data);
        return { data: { id: ref.id, ...data }, error: null };
      } catch (err: any) { return { data: null, error: err }; }
    },
    upsert: async (payload: any) => {
      try {
        const now = new Date().toISOString();
        const data = { ...payload, updated_at: payload.updated_at ?? now };
        if (payload.id) {
          await setDoc(fsDoc(db, collectionName, payload.id), data, { merge: true });
          return { data: { id: payload.id, ...data }, error: null };
        }
        const ref = await addDoc(collection(db, collectionName), data);
        return { data: { id: ref.id, ...data }, error: null };
      } catch (err: any) { return { data: null, error: err }; }
    },
    then(resolve: any, reject: any) {
      (async () => {
        try {
          // If complex OR filters present, fallback to client-side filtering.
          if (orRaw) {
            const snaps = await getDocs(collection(db, collectionName));
            const rows = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            // Very small parser for patterns like 'and(a.eq.X,b.eq.Y),and(a.eq.Y,b.eq.X)'
            const conds = orRaw.split("),").map((s) => s.replace(/^\(?|\)?$/g, ""));
            const matches = rows.filter((r) => {
              return conds.some((c) => {
                const parts = c.split(",");
                return parts.every((p) => {
                  const m = p.match(/(\w+)\.eq\.([^,]+)/);
                  if (!m) return false;
                  const [, f, v] = m;
                  return String(r[f]) === String(v);
                });
              });
            });
            const data = wantSingle ? (matches[0] ?? null) : matches;
            resolve({ data, error: null });
            return;
          }

          const clauses: any[] = [];
          for (const f of filters) clauses.push(fsWhere(f.field as any, f.op as any, f.value));
          for (const o of orders) clauses.push(fsOrderBy(o.field as any, o.dir));
          if (_limit) clauses.push(fsLimit(_limit));
          const q = clauses.length ? fsQuery(collection(db, collectionName), ...clauses) : fsQuery(collection(db, collectionName));
          const snaps = await getDocs(q);
          const rows = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          const data = wantSingle ? (rows[0] ?? null) : rows;
          resolve({ data, error: null });
        } catch (err) { reject(err); }
      })();
    },
  };

  return builder;
}

export const supabase: any = {
  auth: {
    getSession: async () => {
      const user = auth.currentUser;
      if (!user) return { data: { session: null } };
      const token = await user.getIdToken();
      return { data: { session: { access_token: token, user: { uid: user.uid, email: user.email } } } };
    },
    onAuthStateChange: (cb: any) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) cb('SIGNED_OUT', null);
        else {
          const token = await user.getIdToken();
          cb('SIGNED_IN', { session: { access_token: token, user: { uid: user.uid, email: user.email } } });
        }
      });
      return { data: { subscription: { unsubscribe: unsub } } };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try { await signInWithEmailAndPassword(auth, email, password); return { error: null }; } catch (err: any) { return { error: err }; }
    },
    signOut: async () => { try { await fbSignOut(auth); return { error: null }; } catch (err: any) { return { error: err }; } },
  },
  from: (table: string) => makeBuilder(table),
  channel: (name: string) => {
    let _onCb: any;
    let _filter: any;
    return {
      on: (_event: string, _filterObj: any, cb: any) => { _onCb = cb; _filter = _filterObj; return { on: () => {} }; },
      subscribe: () => {
        const parts = name.split(":");
        if (parts[0] !== 'messages') return { unsubscribe: () => {} };
        const a = parts[1]; const b = parts[2];
        const unsub = onSnapshot(fsQuery(collection(db, 'messages'), fsOrderBy('created_at')), (snap) => {
          snap.docChanges().forEach((ch) => {
            if (ch.type === 'added') {
              const d: any = { id: ch.doc.id, ...(ch.doc.data() as any) };
              if ((d.sender_id === a && d.recipient_id === b) || (d.sender_id === b && d.recipient_id === a)) {
                if (_onCb) _onCb();
              }
            }
          });
        });
        return { unsubscribe: unsub };
      },
    };
  },
  removeChannel: (ch: any) => { try { ch.unsubscribe?.(); } catch (e) {} },
};


