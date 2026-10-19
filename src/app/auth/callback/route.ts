import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 에러가 없으면 정상적으로 메인 화면으로 이동
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // 🚨 로그인 실패 시 404 페이지로 보내지 말고, 진짜 원인을 화면에 출력!
      return NextResponse.json({ 
        title: "로그인 처리 중 진짜 에러가 발견되었습니다!", 
        message: error.message 
      });
    }
  }

  // 코드가 아예 없을 경우의 원인 출력
  return NextResponse.json({ message: "구글에서 인증 코드를 주지 않았습니다." });
}
