import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Clock, Flame } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useNow } from '../hooks';
import Switch from '../components/Switch';

const FLOW = {
  new: { next: 'cooking', cta: 'Start cooking', icon: Flame },
  cooking: { next: 'ready', cta: 'Mark ready', icon: Bell },
  ready: { next: 'served', cta: 'Mark served', icon: Check },
};
const COLS = [['new', '🧾 New orders'], ['cooking', '🔥 On the fire'], ['ready', '🛎️ Ready']];

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch {}
}

function Ticket({ o, now, onAdvance }) {
  const mins = Math.max(0, Math.floor((now - o.createdAt) / 60000));
  const late = mins >= 12 && o.status !== 'ready';
  const f = FLOW[o.status];
  const Icon = f.icon;
  return (
    <motion.div
      layout layoutId={o.id} className={`ticket ${late ? 'late' : ''}`}
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="ticket-head">
        <b>{o.id}</b>
        <span className={`timer ${late ? 'late' : ''}`}><Clock size={13} /> {mins}m</span>
      </div>
      <small className="muted">{o.customerName} · {o.type === 'dine-in' ? 'Dine in' : 'Pickup'}</small>
      <ul>{o.items.map((i) => <li key={i.id}><b>{i.qty}×</b> {i.emoji} {i.name}</li>)}</ul>
      {o.note && <p className="ticket-note">⚠️ {o.note}</p>}
      <button className="btn btn-sm btn-primary wide" onClick={() => onAdvance(o, f.next)}><Icon size={14} /> {f.cta}</button>
    </motion.div>
  );
}

export default function Kitchen() {
  const { orders, menu, setOrderStatus, setAvailability, toast } = useStore();
  const now = useNow(20000);
  const active = orders.filter((o) => o.status !== 'served').sort((a, b) => a.createdAt - b.createdAt);
  const sod = new Date().setHours(0, 0, 0, 0);
  const servedToday = orders.filter((o) => o.status === 'served' && o.createdAt >= sod).length;

  // chime + toast whenever a brand new ticket arrives (even from another tab)
  const seen = useRef(null);
  useEffect(() => {
    const ids = new Set(orders.filter((o) => o.status === 'new').map((o) => o.id));
    if (seen.current) {
      const fresh = [...ids].filter((id) => !seen.current.has(id));
      if (fresh.length) { beep(); toast('🔔 New order just came in!'); }
    }
    seen.current = ids;
  }, [orders, toast]);

  const advance = (o, next) => setOrderStatus(o.id, next);

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>Kitchen <span className="grad-text">live</span></h1>
          <p className="muted"><i className="live-dot" /> {active.length} active · {servedToday} served today</p>
        </div>
      </div>

      <div className="board">
        {COLS.map(([key, title]) => {
          const items = active.filter((o) => o.status === key);
          return (
            <div className="col" key={key}>
              <div className="col-head"><b>{title}</b><span>{items.length}</span></div>
              {items.map((o) => <Ticket key={o.id} o={o} now={now} onAdvance={advance} />)}
              {items.length === 0 && <div className="col-empty">All clear</div>}
            </div>
          );
        })}
      </div>

      <section className="section">
        <h2>86 board <small className="muted">— toggle a dish off when you run out</small></h2>
        <div className="eighty">
          {menu.map((i) => (
            <div key={i.id} className={`eighty-row glass ${!i.available ? 'off' : ''}`}>
              <span>{i.emoji} {i.name}</span>
              <Switch on={i.available} onChange={async () => {
                const result = await setAvailability(i.id, !i.available);
                if (result) toast(i.available ? `${i.name} marked sold out` : `${i.name} is back on`);
              }} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}