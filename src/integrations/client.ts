import { deleteApp, getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
};

function readFirebaseConfig(): FirebaseConfig {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  const missing = [
    ...(!apiKey ? ["VITE_FIREBASE_API_KEY"] : []),
    ...(!authDomain ? ["VITE_FIREBASE_AUTH_DOMAIN"] : []),
    ...(!projectId ? ["VITE_FIREBASE_PROJECT_ID"] : []),
    ...(!messagingSenderId ? ["VITE_FIREBASE_MESSAGING_SENDER_ID"] : []),
    ...(!appId ? ["VITE_FIREBASE_APP_ID"] : []),
  ];

  if (missing.length > 0) {
    throw new Error(`Missing Firebase environment variable(s): ${missing.join(", ")}`);
  }

  return {
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
  };
}

export const firebaseConfig = readFirebaseConfig();

function createMainApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

function createMainAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    return getAuth(app);
  }
}

export const firebaseApp = createMainApp();
export const auth = createMainAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export async function withEphemeralAuth<T>(run: (ephemeralAuth: Auth) => Promise<T>): Promise<T> {
  const app = initializeApp(firebaseConfig, `ephemeral-${crypto.randomUUID()}`);
  const ephemeralAuth = initializeAuth(app, { persistence: inMemoryPersistence });

  try {
    return await run(ephemeralAuth);
  } finally {
    await deleteApp(app).catch(() => {});
  }
}
