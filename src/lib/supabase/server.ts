import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 함수 앞에 async 추가
export async function createClient() {
  // cookies() 앞에 await 추가
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 쿠키를 설정하려고 할 때 무시하기 위한 처리
          }
        },
      },
    }
  );
}
