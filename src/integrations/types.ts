export type AppRole = "owner" | "tenant";
export type UserRole = AppRole | "assistant";

export type Profile = {
  id: string;
  role: AppRole;
  full_name: string;
  login_code: string | null;
  unit_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  agreed_rent: number | null;
  theme_accent: string | null;
  created_at: string;
  updated_at: string;
};

export type Unit = {
  id: string;
  floor: string;
  label: string;
  rent_amount: number;
  unit_type: string;
  created_at: string;
};

export type Payment = {
  id: string;
  tenant_id: string;
  amount_ksh: number;
  kind: string;
  note: string | null;
  paid_for_month: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  content: string;
  audience: string;
  category: string | null;
  target_ids: string[] | null;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};
