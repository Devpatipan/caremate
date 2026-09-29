import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';

// จำเป็นสำหรับปิด browser หลัง OAuth เสร็จ (Android/iOS)
WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  /** true เมื่อยังโหลด session อยู่ */
  loading: boolean;
  /** true เมื่อ .env ตั้งค่า Supabase ครบ (ถ้า false = โหมดดู UI อย่างเดียว) */
  configured: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  /** เข้าสู่ระบบด้วย Google (ใช้ได้เฉพาะบน build จริง/APK ไม่ทำงานใน Expo Go) — คืน false เมื่อผู้ใช้ยกเลิก */
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    // ต่ออายุ token อัตโนมัติเมื่อแอปกลับมา foreground
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      sub.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      configured: supabaseConfigured,
      session,
      user: session?.user ?? null,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, name) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        const redirectTo = Linking.createURL('auth-callback');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (!data?.url) throw new Error('เริ่มการเข้าสู่ระบบด้วย Google ไม่ได้');

        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        // ผู้ใช้ปิด/ยกเลิกหน้าต่าง — ไม่ถือเป็น error
        if (res.type !== 'success' || !res.url) return false;

        const parsed = Linking.parse(res.url);
        const q = parsed.queryParams ?? {};
        const errDesc = (q.error_description ?? q.error) as string | undefined;
        if (errDesc) throw new Error(decodeURIComponent(String(errDesc)));
        const code = q.code as string | undefined;
        if (!code) throw new Error('ไม่พบรหัสยืนยันจาก Google');

        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) throw exErr;
        return true;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
