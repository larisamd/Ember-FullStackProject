import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Flame, Plus, Receipt, RotateCcw, Trash2, TrendingUp } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useCountUp } from '../hooks';
import { ago, money } from '../utils';
import Switch from '../components/Switch';

const COLORS = ['#7c5cff', '#ff3d81', '#ffb340', '#c8ff3e', '#5ad1ff'];
const blank = { name: '', emoji: '🍽️', category: '', price: '', desc: '', vegan: false, veg: false, gf: false, spice: 0 };

function Kpi({ label, value, fmt, icon: Icon }) {
  const v = useCountUp(value);
  return (
    <div className="kpi glass">
      <span className="kpi-ic"><Icon size={18} /></span>
      <span className="muted">{label}</span>
      <b>{fmt(v)}</b>
    </div>
  );
}

export default function Admin() {
  const { menu, orders, reservations, categories, addMenuItem, updateMenuPrice, setAvailability, deleteMenuItem, deleteReservation, retryLoad, toast } = useStore();
  const [tab, setTab] = useState('overview');
  const [draft, setDraft] = useState(blank);

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const start = d.getTime();
      const total = orders.filter((o) => o.createdAt >= start && o.createdAt < start + 86400000).reduce((s, o) => s + o.total, 0);
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), total };
    });
    const dish = {};
    const cat = {};
    orders.forEach((o) => o.items.forEach((i) => {
      dish[i.name] = (dish[i.name] || 0) + i.qty;
      const c = menu.find((m) => m.id === i.id)?.category || 'Other';
      cat[c] = (cat[c] || 0) + i.price * i.qty;
    }));
    const topDishes = Object.entries(dish).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const cats = Object.entries(cat).map(([name, value]) => ({ name, value }));
    return { revenue, days, topDishes, cats, catTotal: cats.reduce((s, c) => s + c.value, 0) || 1 };
  }, [orders, menu]);

  const maxDay = Math.max(...stats.days.map((d) => d.total), 1);
  const maxDish = stats.topDishes[0]?.[1] || 1;
  const C = 2 * Math.PI * 54;
  let acc = 0;

  const addItem = async () => {
    const price = Number(draft.price);
    if (!draft.name.trim() || !Number.isFinite(price) || price <= 0 || !draft.desc.trim()) {
      return toast('Name, a valid price, and description are required', 'err');
    }
    const tags = [draft.vegan && 'vegan', draft.veg && 'veg', draft.gf && 'gf'].filter(Boolean);
    const result = await addMenuItem({
      name: draft.name.trim(),
      emoji: draft.emoji || '🍽️',
      category: draft.category || categories[0],
      price,
      desc: draft.desc.trim(),
      tags,
      spice: Number(draft.spice),
      cal: 0,
      mood: [],
      hue: 0,
    });
    if (!result) return;
    setDraft(blank);
    toast('Dish added to the menu ✨');
  };

  const sortedRes = [...reservations].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <>
      <div className="page-head row-between">
        <div><h1>Manager <span className="grad-text">dashboard</span></h1><p className="muted">Numbers, menu and bookings in one place.</p></div>
        <button className="btn btn-sm" onClick={retryLoad}><RotateCcw size={14} /> Refresh data</button>
      </div>

      <div className="tabs">
        {[['overview', 'Overview'], ['menu', 'Menu manager'], ['res', 'Reservations']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {tab === k && <motion.span layoutId="admin-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
            <span>{l}</span>
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="kpis">
            <Kpi label="Total revenue" value={stats.revenue} fmt={(v) => money(v)} icon={DollarSign} />
            <Kpi label="Orders" value={orders.length} fmt={(v) => Math.round(v)} icon={Receipt} />
            <Kpi label="Avg. order" value={stats.revenue / (orders.length || 1)} fmt={(v) => money(v)} icon={TrendingUp} />
            <Kpi label="In kitchen now" value={orders.filter((o) => o.status !== 'served').length} fmt={(v) => Math.round(v)} icon={Flame} />
          </div>

          <div className="charts">
            <div className="glass chart">
              <h3>Revenue · last 7 days</h3>
              <div className="bars">
                {stats.days.map((d, i) => (
                  <div className="bar-col" key={i} title={money(d.total)}>
                    <span className="bar-val">{money(d.total).replace('.00', '')}</span>
                    <div className="bar-track">
                      <motion.div className="bar" initial={{ height: 0 }} animate={{ height: `${(d.total / maxDay) * 100}%` }} transition={{ delay: i * 0.07, type: 'spring', stiffness: 120, damping: 18 }} />
                    </div>
                    <small>{d.label}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass chart">
              <h3>Revenue by category</h3>
              <div className="donut-wrap">
                <svg viewBox="0 0 140 140" className="donut">
                  {stats.cats.map((c, i) => {
                    const frac = c.value / stats.catTotal;
                    const el = (
                      <circle key={c.name} cx="70" cy="70" r="54" fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="18"
                        strokeDasharray={`${Math.max(frac * C - 2, 0)} ${C}`} strokeDashoffset={-acc * C} />
                    );
                    acc += frac;
                    return el;
                  })}
                </svg>
                <ul className="legend">
                  {stats.cats.map((c, i) => (
                    <li key={c.name}><i style={{ background: COLORS[i % COLORS.length] }} />{c.name}<b>{Math.round((c.value / stats.catTotal) * 100)}%</b></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass chart">
              <h3>Top dishes</h3>
              {stats.topDishes.map(([name, qty], i) => (
                <div className="hbar" key={name}>
                  <span>{name}</span>
                  <div className="hbar-track"><motion.div initial={{ width: 0 }} animate={{ width: `${(qty / maxDish) * 100}%` }} transition={{ delay: i * 0.08, duration: 0.7 }} /></div>
                  <b>{qty}</b>
                </div>
              ))}
            </div>

            <div className="glass chart">
              <h3>Recent orders</h3>
              <table className="data">
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td><b>{o.id}</b></td><td>{o.customerName}</td>
                      <td><span className={`status s-${o.status}`}>{o.status}</span></td>
                      <td className="muted">{ago(o.createdAt)}</td><td className="r">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'menu' && (
        <>
          <div className="glass panel add-form">
            <h3>Add a new dish</h3>
            <div className="form-grid">
              <input placeholder="Dish name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <input placeholder="Emoji" value={draft.emoji} maxLength={4} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
              <select value={draft.category || categories[0] || ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
              <input placeholder="Price" type="number" min="0" step="0.5" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              <input className="span2" placeholder="Short description" value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} />
              <select value={draft.spice} onChange={(e) => setDraft({ ...draft, spice: e.target.value })}>
                <option value={0}>No heat</option><option value={1}>Mild</option><option value={2}>Medium</option><option value={3}>Fiery</option>
              </select>
              <div className="checks">
                {['vegan', 'veg', 'gf'].map((k) => (
                  <label key={k}><input type="checkbox" checked={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })} /> {k}</label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={addItem}><Plus size={16} /> Add to menu</button>
          </div>

          <div className="glass table-wrap">
            <table className="data">
              <thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Available</th><th /></tr></thead>
              <tbody>
                {menu.map((i) => (
                  <tr key={i.id}>
                    <td>{i.emoji} <b>{i.name}</b></td>
                    <td className="muted">{i.category}</td>
                    <td>
                      <input className="price-in" type="number" step="0.5" min="0" defaultValue={i.price} key={i.price}
                        onBlur={async (e) => {
                          const price = parseFloat(e.target.value);
                          if (price > 0 && price !== i.price && await updateMenuPrice(i.id, price)) toast('Price updated');
                        }} />
                    </td>
                    <td><Switch on={i.available} onChange={() => setAvailability(i.id, !i.available)} /></td>
                    <td className="r"><button className="icon-btn" onClick={async () => {
                      if (await deleteMenuItem(i.id)) toast(`${i.name} removed`);
                    }}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'res' && (
        <div className="glass table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Party</th><th>Table</th><th>Notes</th><th /></tr></thead>
            <tbody>
              {sortedRes.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td><td>{r.time}</td><td><b>{r.name}</b></td><td>{r.size}</td><td>{r.table}</td>
                  <td className="muted">{r.note || '—'}</td>
                  <td className="r"><button className="icon-btn" onClick={async () => {
                    if (await deleteReservation(r.id)) toast('Reservation cancelled');
                  }}><Trash2 size={15} /></button></td>
                </tr>
              ))}
              {sortedRes.length === 0 && <tr><td colSpan="7" className="muted">No reservations.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}