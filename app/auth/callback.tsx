import { useRouter } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../../src/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/"); 
      } else {
        router.replace("/login");
      }
    });
  }, []);

  return null;
}

