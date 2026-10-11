import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; message?: string }>;
};

const LOCAL_STORAGE_USER_KEY = 'cafe_app_local_user';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'cafe_app_local_accounts';

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Supabaseが設定されている場合
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // ローカルストレージ動作モード
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.id === 'local-demo-user') {
            // 旧デモ・ゲストユーザー情報は削除して未ログイン状態にする
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            setUser(null);
          } else {
            setUser(parsed);
          }
        } catch {
          setUser(null);
        }
      } else {
        // 未ログイン状態のままにする
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: 'メールアドレスまたはパスワードが正しくありません' };
      }
      setUser(data.user);
      setSession(data.session);
      return { error: null };
    } else {
      // ローカルストレージ動作モードでのログイン照合
      const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      const accounts: { id: string; email: string; password: string }[] = accountsRaw
        ? JSON.parse(accountsRaw)
        : [];
      const found = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (!found || found.password !== password) {
        return {
          error: 'メールアドレスまたはパスワードが正しくありません。アカウントをお持ちでない場合は「新規アカウントを作成」から登録してください。',
        };
      }
      const localUser = {
        id: found.id,
        email: found.email,
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(localUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null; message?: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: 'アカウントの作成に失敗しました: ' + error.message };
      }
      return { error: null, message: '確認メールを送信しました。' };
    } else {
      // ローカルストレージ動作モードでのアカウント作成
      const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      const accounts: { id: string; email: string; password: string }[] = accountsRaw
        ? JSON.parse(accountsRaw)
        : [];
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        return { error: 'このメールアドレスは既に登録されています' };
      }
      const newId = 'user-' + Date.now();
      accounts.push({ id: newId, email, password });
      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      return { error: null, message: 'アカウントを作成しました。ログイン画面からログインしてください。' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider の内部で使用してください');
  }
  return context;
};
