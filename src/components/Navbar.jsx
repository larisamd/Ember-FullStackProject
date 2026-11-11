import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays, ChefHat, Flame, LayoutDashboard, LogOut, Receipt, ShoppingBag, UtensilsCrossed,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';

const LINKS = {
  customer: [
    { to: '/', label: 'Home', icon: Flame, end: true },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/reserve', label: 'Reserve', icon: CalendarDays },
    { to: '/orders', label: 'My Orders', icon: Receipt },
  ],
  chef: [
    { to: '/kitchen', label: 'Kitchen', icon: ChefHat },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/kitchen', label: 'Kitchen', icon: ChefHat },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  ],
};

export default function Navbar() {
  const { user, logout, cartCount, dispatch } = useStore();
  const links = LINKS[user.role];

  return (
    <header className="nav">
      <div className="logo">ember<span>.</span></div>
      <nav className="nav-links">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link">
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <Icon size={16} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="nav-right">
        {user.role === 'customer' && (
          <button className="icon-btn cart-btn" onClick={() => dispatch({ type: 'CART_UI', open: true })} aria-label="Open cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span key={cartCount} className="badge">{cartCount}</span>}
          </button>
        )}
        <div className="user-chip">
          <span className="avatar">{user.name[0]}</span>
          <span className="user-meta">
            <b>{user.name.split(' ')[0]}</b>
            <small className={`role r-${user.role}`}>{user.role}</small>
          </span>
        </div>
        <button className="icon-btn" onClick={logout} aria-label="Log out"><LogOut size={17} /></button>
      </div>
    </header>
  );
}