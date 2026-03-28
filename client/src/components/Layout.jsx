import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

// Clean SVG icons matching Calendly's style
const Icons = {
  EventTypes: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>
    </svg>
  ),
  Availability: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Meetings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Logo: () => (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="8" fill="#0069ff"/>
      <path d="M15 7C10.58 7 7 10.58 7 15s3.58 8 8 8 8-3.58 8-8" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="15" cy="10" r="1.5" fill="white"/>
    </svg>
  ),
};

const NAV = [
  { to: '/',             Icon: Icons.EventTypes,  label: 'Event Types'  },
  { to: '/availability', Icon: Icons.Availability, label: 'Availability' },
  { to: '/meetings',     Icon: Icons.Meetings,     label: 'Meetings'     },
];

export default function Layout() {
  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Icons.Logo />
          <span className="logo-text">calendly</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <span className="nav-icon"><Icon /></span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="user-row">
            <div className="user-avatar">SM</div>
            <div className="user-info">
              <div className="user-name">Saksham Maheshwari</div>
              <div className="user-plan">Free Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-logo">
          <Icons.Logo />
          <span className="logo-text">calendly</span>
        </div>
        <div className="mobile-nav">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
              title={label}
            >
              <Icon />
            </NavLink>
          ))}
        </div>
      </div>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}