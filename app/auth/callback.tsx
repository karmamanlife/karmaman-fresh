import { useRouter } from "expo-router";
import { useEffect } from "react";
import { getSupabase } from '../../src/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/"); // ✅ redirect to home if logged in
      } else {
        router.replace("/login"); // fallback
      }
    });
  }, []);

  return null;
}
