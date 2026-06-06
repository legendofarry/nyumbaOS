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
    const { tenant_id } = body;
    if (!tenant_id) return { statusCode: 400, body: 'Missing tenant_id' };

    const auth = admin.auth();
    await auth.deleteUser(tenant_id);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err) };
  }
};
