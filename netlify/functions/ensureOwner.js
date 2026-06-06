const admin = require('firebase-admin');

const OWNER_CODE = '2000';
const OWNER_EMAIL = 'owner@apt.local';

const DEFAULT_UNITS = [
  { id: 'unit-1', label: '1A', floor: '1', rent_amount: 20000, unit_type: '1BR', created_at: new Date().toISOString() },
  { id: 'unit-2', label: '1B', floor: '1', rent_amount: 18000, unit_type: 'Studio', created_at: new Date().toISOString() },
  { id: 'unit-3', label: '2A', floor: '2', rent_amount: 22000, unit_type: '2BR', created_at: new Date().toISOString() },
  { id: 'unit-4', label: '2B', floor: '2', rent_amount: 20000, unit_type: '1BR', created_at: new Date().toISOString() },
];

function initAdmin() {
  if ((globalThis).__fbAdminInit) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    } catch (e) {
      admin.initializeApp();
    }
  } else {
    admin.initializeApp();
  }
  globalThis.__fbAdminInit = true;
}

exports.handler = async function (event) {
  initAdmin();
  try {
    const auth = admin.auth();
    const firestore = admin.firestore();

    // list users and find owner by email
    const list = await auth.listUsers(1000);
    let owner = list.users.find((u) => u.email === OWNER_EMAIL);

    if (!owner) {
      const created = await auth.createUser({ email: OWNER_EMAIL, password: `owner-secret-${OWNER_CODE}-aptv1`, emailVerified: true });
      owner = created;
      await firestore.collection('profiles').doc(created.uid).set({ id: created.uid, role: 'owner', full_name: 'Owner', login_code: OWNER_CODE });
    } else {
      // ensure profile exists
      const profRef = firestore.collection('profiles').doc(owner.uid);
      const profSnap = await profRef.get();
      if (!profSnap.exists) {
        await profRef.set({ id: owner.uid, role: 'owner', full_name: 'Owner', login_code: OWNER_CODE });
      }
    }

    // seed default units if none exist
    const unitsSnap = await firestore.collection('units').limit(1).get();
    if (unitsSnap.empty) {
      for (const u of DEFAULT_UNITS) {
        await firestore.collection('units').doc(u.id).set(u);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err) };
  }
};
