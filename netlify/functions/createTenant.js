const admin = require('firebase-admin');

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
    const body = event.body ? JSON.parse(event.body) : {};
    const { full_name, phone, unit_id, agreed_rent, initial_payment = 0, payment_note } = body;
    if (!full_name || !unit_id || typeof agreed_rent === 'undefined') {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    const auth = admin.auth();
    const firestore = admin.firestore();

    // generate unique 4-digit code
    const OWNER_CODE = '2000';
    let code = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      const c = String(Math.floor(1000 + Math.random() * 9000));
      if (c === OWNER_CODE) continue;
      const q = await firestore.collection('profiles').where('login_code', '==', c).limit(1).get();
      if (q.empty) { code = c; break; }
    }
    if (!code) return { statusCode: 500, body: 'Could not generate unique code' };

    const email = `t-${code}@apt.local`;
    const password = `tenant-secret-${code}-aptv1`;
    const created = await auth.createUser({ email, password, emailVerified: true });
    const userId = created.uid;

    await firestore.collection('profiles').doc(userId).set({
      id: userId,
      role: 'tenant',
      full_name,
      phone: phone || null,
      unit_id,
      agreed_rent,
      login_code: code,
    });

    if (initial_payment > 0) {
      await firestore.collection('payments').add({
        tenant_id: userId,
        amount_ksh: initial_payment,
        kind: 'rent',
        note: payment_note || 'Initial payment on registration',
        created_at: new Date().toISOString(),
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, code, userId }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err) };
  }
};
