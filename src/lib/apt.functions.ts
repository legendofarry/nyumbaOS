import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import { z } from "zod";

import { auth, db, withEphemeralAuth } from "@/integrations/client";
import type { Message, Payment, Post, Profile, UserRole } from "@/integrations/types";
import { fromCollection, nowIso, uniqueById } from "./firestore";
import { OWNER_CODE, emailForCode, passwordForCode } from "./codes";

function isBootstrapOwnerError(error: unknown) {
  const code = (error as { code?: string } | undefined)?.code;
  return code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password";
}

function isEmailAlreadyInUseError(error: unknown) {
  return (error as { code?: string } | undefined)?.code === "auth/email-already-in-use";
}

async function seedOwnerProfile(user: User) {
  const profileRef = doc(db, "profiles", user.uid);
  const profileSnapshot = await getDoc(profileRef);
  const timestamp = nowIso();

  const profile: Profile = {
    id: user.uid,
    role: "owner",
    full_name: "Owner",
    login_code: OWNER_CODE,
    unit_id: null,
    phone: null,
    avatar_url: null,
    bio: null,
    agreed_rent: null,
    theme_accent: null,
    created_at: profileSnapshot.exists() ? (profileSnapshot.data() as Profile).created_at : timestamp,
    updated_at: timestamp,
  };

  const role: { user_id: string; role: UserRole; created_at: string; updated_at: string } = {
    user_id: user.uid,
    role: "owner",
    created_at: timestamp,
    updated_at: timestamp,
  };

  await Promise.all([
    setDoc(doc(db, "user_roles", user.uid), role, { merge: true }),
    setDoc(profileRef, profile, { merge: true }),
  ]);
}

export async function signInWithCode(code: string) {
  const email = emailForCode(code);
  const password = passwordForCode(code);

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (code === OWNER_CODE) {
      await seedOwnerProfile(credential.user);
    }
    return credential.user;
  } catch (error) {
    if (code !== OWNER_CODE || !isBootstrapOwnerError(error)) {
      throw error;
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await seedOwnerProfile(credential.user);
    return credential.user;
  }
}

const CreateTenantSchema = z.object({
  full_name: z.string().min(1).max(80),
  phone: z.string().max(20).optional(),
  // unit_id can be a Firestore UUID or a short static id like 'G1'/'F2'
  unit_id: z.string().min(1),
  agreed_rent: z.number().nonnegative(),
  initial_payment: z.number().nonnegative().default(0),
  payment_note: z.string().max(120).optional(),
});

function buildTenantProfile({
  userId,
  code,
  fullName,
  phone,
  unitId,
  agreedRent,
}: {
  userId: string;
  code: string;
  fullName: string;
  phone?: string | null;
  unitId: string;
  agreedRent: number;
}): Profile {
  const timestamp = nowIso();
  return {
    id: userId,
    role: "tenant",
    full_name: fullName,
    login_code: code,
    unit_id: unitId,
    phone: phone ?? null,
    avatar_url: null,
    bio: null,
    agreed_rent: agreedRent,
    theme_accent: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function createTenant(input: unknown) {
  const data = CreateTenantSchema.parse(input);

  const existingProfiles = fromCollection<Profile>(await getDocs(collection(db, "profiles")));
  const usedCodes = new Set(existingProfiles.map((profile) => profile.login_code).filter((code): code is string => !!code));

  let code = "";
  let userId = "";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (candidate === OWNER_CODE || usedCodes.has(candidate)) {
      continue;
    }

    const email = emailForCode(candidate);
    const password = passwordForCode(candidate);

    try {
      await withEphemeralAuth(async (provisionAuth) => {
        const credential = await createUserWithEmailAndPassword(provisionAuth, email, password);
        userId = credential.user.uid;

        try {
          const profile = buildTenantProfile({
            userId,
            code: candidate,
            fullName: data.full_name,
            phone: data.phone ?? null,
            unitId: data.unit_id,
            agreedRent: data.agreed_rent,
          });

          const role: { user_id: string; role: UserRole; created_at: string; updated_at: string } = {
            user_id: userId,
            role: "tenant",
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };

          const batch = writeBatch(db);
          batch.set(doc(db, "profiles", userId), profile);
          batch.set(doc(db, "user_roles", userId), role);

          if (data.initial_payment > 0) {
            batch.set(doc(collection(db, "payments")), {
              tenant_id: userId,
              amount_ksh: data.initial_payment,
              kind: "rent",
              note: data.payment_note ?? "Initial payment on registration",
              paid_for_month: null,
              created_at: nowIso(),
            } satisfies Omit<Payment, "id">);
          }

          await batch.commit();

          code = candidate;
        } catch (error) {
          await deleteUser(credential.user).catch(() => {});
          throw error;
        }
      });

      if (code) {
        break;
      }
    } catch (error) {
      if (isEmailAlreadyInUseError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (!code) {
    throw new Error("Could not generate a unique code, try again");
  }

  return { ok: true, code, userId };
}

const DeleteTenantSchema = z.object({ tenant_id: z.string().uuid() });
export async function deleteTenant(input: unknown) {
  const data = DeleteTenantSchema.parse(input);
  const profileSnapshot = await getDoc(doc(db, "profiles", data.tenant_id));

  if (profileSnapshot.exists()) {
    const profile = profileSnapshot.data() as Profile;
    const code = profile.login_code;

    if (code) {
      try {
        await withEphemeralAuth(async (provisionAuth) => {
          const credential = await signInWithEmailAndPassword(
            provisionAuth,
            emailForCode(code),
            passwordForCode(code),
          );

          await deleteUser(credential.user).catch(() => {});
        });
      } catch {
        // The Auth account may already be gone. Continue removing Firestore data.
      }
    }
  }

  const paymentsSnapshot = await getDocs(query(collection(db, "payments"), where("tenant_id", "==", data.tenant_id)));
  const postsSnapshot = await getDocs(query(collection(db, "posts"), where("author_id", "==", data.tenant_id)));
  const senderMessagesSnapshot = await getDocs(query(collection(db, "messages"), where("sender_id", "==", data.tenant_id)));
  const recipientMessagesSnapshot = await getDocs(query(collection(db, "messages"), where("recipient_id", "==", data.tenant_id)));

  const messages = uniqueById<Message>([
    ...fromCollection<Message>(senderMessagesSnapshot),
    ...fromCollection<Message>(recipientMessagesSnapshot),
  ]);

  await Promise.all([
    ...fromCollection<Payment>(paymentsSnapshot).map((payment) => deleteDoc(doc(db, "payments", payment.id))),
    ...fromCollection<Post>(postsSnapshot).map((post) => deleteDoc(doc(db, "posts", post.id))),
    ...messages.map((message) => deleteDoc(doc(db, "messages", message.id))),
    deleteDoc(doc(db, "profiles", data.tenant_id)),
    deleteDoc(doc(db, "user_roles", data.tenant_id)),
  ]);

  return { ok: true };
}

const AiSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() })).max(40),
  role: z.enum(["owner", "tenant"]),
  context_json: z.string().max(8000).optional(),
});

export async function askAssistant(input: unknown) {
  const data = AiSchema.parse(input);
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("AI key missing");
  }

  const sys =
    data.role === "owner"
      ? `You are 'Nest AI', a sharp, friendly property-management copilot for an apartment OWNER in Kenya. Currency is always KSh. Be concise, proactive, and surface unsettled rent, overdue tenants, recent posts, and money owed. Use bullet points when listing. When summarising, format with bold headings.`
      : `You are 'Nest AI', a warm, helpful assistant for a TENANT in an apartment. Currency is always KSh. Help with rent balances, posting notices, contacting neighbours, and general apartment life questions. Be concise and friendly.`;

  const ctx = data.context_json ? `\n\nLIVE CONTEXT (JSON):\n${data.context_json}` : "";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Apartment",
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_OPENROUTER_MODEL ?? "openrouter/auto",
      messages: [{ role: "system", content: sys + ctx }, ...data.messages],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return { text: json.choices?.[0]?.message?.content ?? "" };
}
