import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import './AppLayout.css';

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 4 }} />
        <span>読み込み中...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {/* PC・モバイル兼用サイドバー */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* メインコンテンツ */}
      <div className="main-content">
        {/* モバイル用トップバー */}
        <header className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="メニューを開く"
          >
            <span /><span /><span />
          </button>
          <span className="mobile-topbar-title">☕ カフェめぐり</span>
          <div style={{ width: 40 }} />
        </header>

        {/* ページコンテンツ */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>

      {/* スマホ用ボトムナビ */}
      <BottomNav />
    </div>
  );
};
