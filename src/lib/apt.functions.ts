import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { OWNER_CODE, OWNER_EMAIL, emailForCode, passwordForCode } from "./codes";
import { DEFAULT_UNITS } from "./defaults";

/** Ensure owner auth user + profile exist. Called on app boot. */
export const ensureOwner = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/client.server");
  // Try to find by email
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  let owner = list?.users?.find((u: any) => u.email === OWNER_EMAIL);

  if (!owner) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: `owner-secret-${OWNER_CODE}-aptv1`,
      email_confirm: true,
    });
    if (created.error) throw new Error(created.error.message || String(created.error));
    owner = created.data.user;
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

  // Seed default units if none exist
  const { data: someUnits } = await supabaseAdmin.from("units").select("*").limit(1);
  if (!someUnits || (Array.isArray(someUnits) && someUnits.length === 0)) {
    for (const u of DEFAULT_UNITS) {
      await supabaseAdmin.from("units").upsert(u);
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
    const { supabaseAdmin } = await import("@/integrations/client.server");

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
    const { supabaseAdmin } = await import("@/integrations/client.server");
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
    // Lovable AI integration removed. Configure an alternative AI provider
    // (e.g., OpenAI, Google, or a self-hosted model) and update this function.
    throw new Error("Lovable AI integration removed. Configure an alternative AI provider.");
  });