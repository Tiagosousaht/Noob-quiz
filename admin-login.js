import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://kkouwjzemhdkqidjrhrn.supabase.co",
  "sb_publishable_0qwp4AYBKAo1OprIQrwj3Q_EblkPeeG"
);

export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", data.user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    throw new Error("Acesso negado.");
  }

  return { user: data.user, profile };
}