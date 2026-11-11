import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/StoreContext';
import { homeFor } from './utils';
import Navbar from './components/Navbar';
import CursorGlow from './components/CursorGlow';
import CartDrawer from './components/CartDrawer';
import Toaster from './components/Toaster';
import Confetti from './components/Confetti';
import Page from './components/Page';
import Login from './pages/Login';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Reserve from './pages/Reserve';
import Orders from './pages/Orders';
import Kitchen from './pages/Kitchen';
import Admin from './pages/Admin';

function Protected({ roles, children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <Page>{children}</Page>;
}

export default function App() {
  const location = useLocation();
  const { user, state, retryLoad } = useStore();

  return (
    <>
      <div className="aurora"><i /><i /><i /></div>
      <CursorGlow />
      {user && <Navbar />}
      {state.error && (
        <div className="system-error" role="alert">
          <span>{state.error}</span>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}
      <main className="container">
        {state.loading ? (
          <div className="empty">Connecting to the restaurant database…</div>
        ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<Page><Login /></Page>} />
              <Route path="/" element={<Protected roles={['customer']}><Home /></Protected>} />
              <Route path="/menu" element={<Protected><Menu /></Protected>} />
              <Route path="/reserve" element={<Protected roles={['customer']}><Reserve /></Protected>} />
              <Route path="/orders" element={<Protected roles={['customer']}><Orders /></Protected>} />
              <Route path="/kitchen" element={<Protected roles={['chef', 'admin']}><Kitchen /></Protected>} />
              <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        )}
      </main>
      {user?.role === 'customer' && <CartDrawer />}
      <Toaster />
      <Confetti />
    </>
  );
}