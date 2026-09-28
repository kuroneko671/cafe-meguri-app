import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { to: '/',        icon: '🏠', label: 'ホーム' },
  { to: '/shops',   icon: '☕', label: '店舗一覧' },
  { to: '/map',     icon: '🗺️', label: '地図' },
  { to: '/settings', icon: '⚙️', label: '設定' },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* オーバーレイ（モバイル） */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <nav className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* ロゴ */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">☕</span>
          <div>
            <div className="sidebar-logo-title">カフェめぐり</div>
            <div className="sidebar-logo-sub">記録アプリ</div>
          </div>
        </div>

        {/* ナビリンク */}
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* 新規登録ボタン */}
        <div className="sidebar-action">
          <NavLink to="/shops/new" className="btn btn-accent" style={{ width: '100%' }} onClick={onClose}>
            <span>＋</span>
            <span>新しい店舗を登録</span>
          </NavLink>
        </div>

        {/* フッター */}
        <div className="sidebar-footer">
          <button className="sidebar-signout" onClick={handleSignOut}>
            <span>🚪</span>
            <span>ログアウト</span>
          </button>
        </div>
      </nav>
    </>
  );
};
