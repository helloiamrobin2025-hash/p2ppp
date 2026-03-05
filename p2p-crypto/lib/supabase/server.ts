import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client suitable for use in Server Components,
 * Server Actions, and Route Handlers (App Router).
 */
export const createSupabaseServerClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(tokensToSet) {
        try {
          for (const { name, value, options } of tokensToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll can fail when called from a Server Component.
          // This is expected — the middleware will refresh the session.
        }
      },
    },
  });
};
