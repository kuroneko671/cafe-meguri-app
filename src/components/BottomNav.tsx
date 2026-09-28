import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { to: '/',        icon: '🏠', label: 'ホーム' },
  { to: '/shops',   icon: '☕', label: '店舗' },
  { to: '/shops/new', icon: '＋', label: '追加', isAction: true },
  { to: '/map',     icon: '🗺️', label: '地図' },
  { to: '/settings', icon: '⚙️', label: '設定' },
];

export const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/' || item.to === '/shops/new'}
          className={({ isActive }) =>
            `bottom-nav-item${item.isAction ? ' action' : ''}${isActive && !item.isAction ? ' active' : ''}`
          }
        >
          <span className={`bottom-nav-icon${item.isAction ? ' action-icon' : ''}`}>
            {item.icon}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
