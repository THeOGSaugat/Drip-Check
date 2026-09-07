import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

/** Reactive Supabase auth state. `loading` is true only until the first session check resolves. */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({ user: null, session: null, loading: true });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
