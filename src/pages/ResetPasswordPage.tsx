import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AuthPages.css';

export const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError('再設定メールの送信に失敗しました: ' + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-success">
            <div className="auth-success-icon">✉️</div>
            <h2>再設定メールを送信しました</h2>
            <p>メールに記載のリンクからパスワードを再設定してください。</p>
            <Link to="/login" className="btn btn-secondary" style={{ marginTop: 16 }}>
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">☕</div>
          <h1 className="auth-logo-title">カフェめぐり</h1>
        </div>

        <h2 className="auth-heading">パスワード再設定</h2>
        <p className="auth-description">
          登録したメールアドレスに再設定用リンクを送信します。
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-email">メールアドレス</label>
            <input
              id="reset-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="登録したメールアドレス"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '再設定メールを送信'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="auth-link">← ログイン画面に戻る</Link>
        </div>
      </div>
    </div>
  );
};
