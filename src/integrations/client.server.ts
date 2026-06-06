import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    } else {
      admin.initializeApp();
    }
  } catch (e) {
    // fallback if already initialized
  }
}

const firestore = admin.firestore();

function makeServerBuilder(collectionName: string) {
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
          await firestore.collection(collectionName).doc(payload.id).set(data);
          return { data: { id: payload.id, ...data }, error: null };
        }
        const ref = await firestore.collection(collectionName).add(data);
        return { data: { id: ref.id, ...data }, error: null };
      } catch (err: any) { return { data: null, error: err }; }
    },
    upsert: async (payload: any) => {
      try {
        const now = new Date().toISOString();
        const data = { ...payload, updated_at: payload.updated_at ?? now };
        if (payload.id) {
          await firestore.collection(collectionName).doc(payload.id).set(data, { merge: true });
          return { data: { id: payload.id, ...data }, error: null };
        }
        const ref = await firestore.collection(collectionName).add(data);
        return { data: { id: ref.id, ...data }, error: null };
      } catch (err: any) { return { data: null, error: err }; }
    },
    then(resolve: any, reject: any) {
      (async () => {
        try {
          if (orRaw) {
            const snaps = await firestore.collection(collectionName).get();
            const rows = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
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

          let q: any = firestore.collection(collectionName);
          for (const f of filters) q = q.where(f.field as any, f.op as any, f.value);
          for (const o of orders) q = q.orderBy(o.field as any, o.dir);
          if (_limit) q = q.limit(_limit);
          const snaps = await q.get();
          const rows = snaps.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
          const data = wantSingle ? (rows[0] ?? null) : rows;
          resolve({ data, error: null });
        } catch (err) { reject(err); }
      })();
    },
  };

  return builder;
}

export const supabaseAdmin: any = {
  auth: {
    admin: {
      listUsers: async () => {
        const list = await admin.auth().listUsers(1000);
        return { data: { users: list.users.map((u) => ({ id: u.uid, email: u.email, displayName: u.displayName })) }, error: null };
      },
      createUser: async (opts: any) => {
        const user = await admin.auth().createUser({ email: opts.email, password: opts.password, emailVerified: !!opts.email_confirm });
        return { data: { user: { id: user.uid, email: user.email } }, error: null };
      },
      deleteUser: async (id: string) => { await admin.auth().deleteUser(id); return { data: null, error: null }; },
    },
  },
  from: (table: string) => makeServerBuilder(table),
};
