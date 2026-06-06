// Helper to produce auth headers for server API calls. Returns an object or empty object.
import { supabase } from './client';

export async function attachSupabaseAuth() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
