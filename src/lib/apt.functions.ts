import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { OWNER_CODE, OWNER_EMAIL, emailForCode, passwordForCode } from "./codes";

/** Ensure owner auth user + profile exist. Called on app boot. */
export const ensureOwner = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Try to find by email
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let owner = list?.users?.find((u) => u.email === OWNER_EMAIL);

  if (!owner) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: `owner-secret-${OWNER_CODE}-aptv1`,
      email_confirm: true,
    });
    if (created.error) throw new Error(created.error.message);
    owner = created.data.user!;
    await supabaseAdmin.from("profiles").upsert({
      id: owner.id,
      role: "owner",
      full_name: "Owner",
      login_code: OWNER_CODE,
    });
  } else {
    // ensure profile exists
    const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("id", owner.id).maybeSingle();
    if (!prof) {
      await supabaseAdmin.from("profiles").upsert({
        id: owner.id,
        role: "owner",
        full_name: "Owner",
        login_code: OWNER_CODE,
      });
    }
  }
  return { ok: true };
});

const CreateTenantSchema = z.object({
  full_name: z.string().min(1).max(80),
  phone: z.string().max(20).optional(),
  unit_id: z.string().uuid(),
  agreed_rent: z.number().nonnegative(),
  initial_payment: z.number().nonnegative().default(0),
  payment_note: z.string().max(120).optional(),
});

export const createTenant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateTenantSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Generate a unique 4-digit code (avoid owner code)
    let code = "";
    for (let attempt = 0; attempt < 20; attempt++) {
      const c = String(Math.floor(1000 + Math.random() * 9000));
      if (c === OWNER_CODE) continue;
      const { data: ex } = await supabaseAdmin.from("profiles").select("id").eq("login_code", c).maybeSingle();
      if (!ex) { code = c; break; }
    }
    if (!code) throw new Error("Could not generate a unique code, try again");

    const email = emailForCode(code);
    const password = passwordForCode(code);

    const created = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (created.error) throw new Error(created.error.message);
    const userId = created.data.user!.id;

    const { error: pErr } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      role: "tenant",
      full_name: data.full_name,
      phone: data.phone ?? null,
      unit_id: data.unit_id,
      agreed_rent: data.agreed_rent,
      login_code: code,
    });
    if (pErr) throw new Error(pErr.message);

    if (data.initial_payment > 0) {
      await supabaseAdmin.from("payments").insert({
        tenant_id: userId,
        amount_ksh: data.initial_payment,
        kind: "rent",
        note: data.payment_note ?? "Initial payment on registration",
      });
    }

    return { ok: true, code, userId };
  });

const DeleteTenantSchema = z.object({ tenant_id: z.string().uuid() });
export const deleteTenant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeleteTenantSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(data.tenant_id);
    return { ok: true };
  });

const AiSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() })).max(40),
  role: z.enum(["owner", "tenant"]),
  context_json: z.string().max(8000).optional(),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AiSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI key missing");

    const sys = data.role === "owner"
      ? `You are 'Nest AI', a sharp, friendly property-management copilot for an apartment OWNER in Kenya. Currency is always KSh. Be concise, proactive, and surface unsettled rent, overdue tenants, recent posts, and money owed. Use bullet points when listing. When summarising, format with bold headings.`
      : `You are 'Nest AI', a warm, helpful assistant for a TENANT in an apartment. Currency is always KSh. Help with rent balances, posting notices, contacting neighbours, and general apartment life questions. Be concise and friendly.`;

    const ctx = data.context_json ? `\n\nLIVE CONTEXT (JSON):\n${data.context_json}` : "";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys + ctx }, ...data.messages],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    return { text: json.choices?.[0]?.message?.content ?? "" };
  });