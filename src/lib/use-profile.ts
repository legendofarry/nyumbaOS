import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export type Profile = {
  id: string;
  role: "owner" | "tenant";
  full_name: string;
  login_code: string | null;
  unit_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  agreed_rent: number | null;
  theme_accent: string | null;
};

export function useSessionProfile() {
  return useQuery({
    queryKey: ["session-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data as Profile | null;
    },
  });
}