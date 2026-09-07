import { supabase } from "@/integrations/supabase/client";

export type AuthResult = { ok: true } | { ok: false; error: string };

function friendlyAuthError(message: string): string {
  if (/already registered/i.test(message)) return "An account with that email already exists.";
  if (/invalid login credentials/i.test(message)) return "Wrong email or password.";
  if (/password should be at least/i.test(message))
    return "Password must be at least 6 characters.";
  return message;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
