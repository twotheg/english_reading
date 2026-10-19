"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut } from "lucide-react";

export function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. 페이지가 로딩될 때 현재 로그인 유저 확인
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // 2. 브라우저가 직접 인증 코드(?code=...)를 감지하고 가로채서 로그인 세션을 만들어줍니다!
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ⭐ 핵심: 에러가 나던 callback 파일을 아예 거치지 않고 곧바로 메인 화면으로 돌아옵니다.
        redirectTo: `${location.origin}/`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.user_metadata.avatar_url && (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-slate-700"
          />
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-900/20"
    >
      <LogIn className="h-4 w-4" />
      Google Login
    </button>
  );
}
