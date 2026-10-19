import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 로그인 성공 시 원래 가려던 페이지나 메인으로 이동
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 로그인 실패 시 에러 페이지나 메인으로 이동
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
