// Firebase Admin initializer for server-side use.
// Exports `adminAuth` and `adminDb` for privileged operations.
import admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps && admin.apps.length) return admin;

  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!svc) {
    const message = `Missing Firebase service account credentials (FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_JSON).`;
    console.error(message);
    throw new Error(message);
  }

  let credObj: any;
  try {
    if (svc.trim().startsWith('{')) {
      credObj = JSON.parse(svc);
    } else {
      credObj = JSON.parse(Buffer.from(svc, 'base64').toString('utf8'));
    }
  } catch (e) {
    console.error('Failed to parse Firebase service account JSON', e);
    throw e;
  }

  admin.initializeApp({ credential: admin.credential.cert(credObj) });
  return admin;
}

const _admin = initAdmin();
export const adminAuth = _admin.auth();
export const adminDb = _admin.firestore();
