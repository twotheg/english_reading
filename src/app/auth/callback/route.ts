import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    
    // 1. 코드를 로그인 세션으로 교환 시도합니다.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    // 2. PKCE 에러(더블 요청 버그)가 났더라도, 
    // 0.1초 전에 이미 로그인이 성공했는지 한 번 더 확인합니다.
    const { data: { session } } = await supabase.auth.getSession();

    // 에러가 아예 없거나, 에러가 났어도 이미 로그인이 되어 있다면 메인 화면으로 통과!
    if (!error || session) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 실패 시 그냥 메인 화면으로 부드럽게 돌려보냅니다.
  return NextResponse.redirect(`${origin}`);
}
