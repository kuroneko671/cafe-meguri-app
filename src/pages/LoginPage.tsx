import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        navigate('/');
      }
    } else {
      signInAsGuest();
      navigate('/');
    }
    setLoading(false);
  };

  const handleGuestLogin = () => {
    signInAsGuest();
    navigate('/');
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* ロゴ */}
        <div className="auth-logo">
          <div className="auth-logo-icon">☕</div>
          <h1 className="auth-logo-title">カフェめぐり</h1>
          <p className="auth-logo-sub">記録アプリ</p>
        </div>

        <h2 className="auth-heading">ログイン</h2>

        {error && <div className="auth-error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'ログイン'}
          </button>
        </form>

        <div className="auth-links">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleGuestLogin}
          >
            👤 ゲストとして今すぐ試す
          </button>

          <Link to="/reset-password" className="auth-link">
            パスワードを忘れた方はこちら
          </Link>
          <div className="auth-divider">
            <span>アカウントをお持ちでない方</span>
          </div>
          <Link
            to="/signup"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            新規アカウントを作成
          </Link>
        </div>
      </div>
    </div>
  );
};
