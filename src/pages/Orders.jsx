import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { ago, money } from '../utils';
import { useNow } from '../hooks';

const STEPS = [
  { k: 'new', label: 'Received', e: '🧾' },
  { k: 'cooking', label: 'On the fire', e: '🔥' },
  { k: 'ready', label: 'Ready', e: '🛎️' },
  { k: 'served', label: 'Served', e: '😋' },
];
const ETA = {
  new: 'Chef will pick this up in a moment…',
  cooking: 'Your food is on the fire. About 8 min.',
  ready: 'Ready! It is coming your way.',
  served: 'Enjoy every bite 💜',
};

export default function Orders() {
  const { user, orders, menu, dispatch, toast } = useStore();
  useNow(30000);
  const mine = orders.filter((o) => o.customerId === user.id).sort((a, b) => b.createdAt - a.createdAt);

  const reorder = (o) => {
    o.items.forEach((i) => {
      const m = menu.find((x) => x.id === i.id);
      if (m?.available) for (let k = 0; k < i.qty; k++) dispatch({ type: 'CART_ADD', id: i.id });
    });
    dispatch({ type: 'CART_UI', open: true });
    toast('Items added to your bag');
  };

  return (
    <>
      <div className="page-head">
        <h1>My <span className="grad-text">orders</span></h1>
        <p className="muted"><i className="live-dot" /> Live-synced with the kitchen. No refresh needed.</p>
      </div>

      {mine.length === 0 ? (
        <div className="empty"><span style={{ fontSize: 52 }}>🍽️</span><p>No orders yet.</p><Link to="/menu" className="btn btn-primary">Browse the menu</Link></div>
      ) : (
        <div className="stack">
          {mine.map((o) => {
            const idx = STEPS.findIndex((s) => s.k === o.status);
            return (
              <motion.div layout key={o.id} className="order glass" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div className="order-head">
                  <div><b>{o.id}</b><small className="muted"> · {ago(o.createdAt)} · {o.type === 'dine-in' ? 'Dine in' : 'Pickup'}</small></div>
                  <b className="price">{money(o.total)}</b>
                </div>

                <div className="tracker">
                  <div className="track-line"><motion.div className="track-fill" animate={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} /></div>
                  {STEPS.map((s, i) => (
                    <div key={s.k} className={`step ${i <= idx ? 'done' : ''} ${i === idx && o.status !== 'served' ? 'now' : ''}`}>
                      <span className="dot">{i < idx ? <Check size={14} /> : s.e}</span>
                      <small>{s.label}</small>
                    </div>
                  ))}
                </div>
                <p className="eta">{ETA[o.status]}</p>

                <div className="order-items">
                  {o.items.map((i) => <span key={i.id} className="pillbox">{i.emoji} {i.qty}× {i.name}</span>)}
                </div>
                <button className="btn btn-sm" onClick={() => reorder(o)}><RotateCcw size={14} /> Reorder</button>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}