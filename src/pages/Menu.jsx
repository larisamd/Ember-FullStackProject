import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { money } from '../utils';
import DishCard from '../components/DishCard';
import Tags from '../components/Tags';

const DIETS = [
  { k: 'vegan', label: '🌱 Vegan' },
  { k: 'veg', label: '🥕 Vegetarian' },
  { k: 'gf', label: '🌾 Gluten-free' },
  { k: 'spicy', label: '🌶️ Spicy' },
];

export default function Menu() {
  const { menu, user, favorites, categories, addToCart } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [diets, setDiets] = useState([]);
  const [sort, setSort] = useState('featured');
  const [openId, setOpenId] = useState(null);

  const isGuest = user.role === 'customer';
  const favs = favorites[user.id] || [];
  const filters = isGuest ? [...DIETS, { k: 'fav', label: '♥ Favorites' }] : DIETS;

  const list = useMemo(() => {
    let l = menu.filter((i) => {
      if (cat !== 'All' && i.category !== cat) return false;
      if (q && !(i.name + i.desc).toLowerCase().includes(q.toLowerCase())) return false;
      return diets.every((d) =>
        d === 'vegan' ? i.tags.includes('vegan')
        : d === 'veg' ? i.tags.includes('veg') || i.tags.includes('vegan')
        : d === 'gf' ? i.tags.includes('gf')
        : d === 'spicy' ? i.spice > 0
        : favs.includes(i.id)
      );
    });
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);
    if (sort === 'cal') l = [...l].sort((a, b) => a.cal - b.cal);
    return l;
  }, [menu, q, cat, diets, sort, favs]);

  const toggleDiet = (k) => setDiets((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));
  const open = menu.find((m) => m.id === openId);

  return (
    <>
      <div className="page-head">
        <h1>The <span className="grad-text">menu</span></h1>
        <p className="muted">{isGuest ? 'Tap a card for details. Hover for a little magic.' : 'Staff view — ordering is disabled.'}</p>
      </div>

      <div className="toolbar">
        <label className="search"><Search size={16} />
          <input placeholder="Search dishes…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button onClick={() => setQ('')}><X size={14} /></button>}
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Sort: Featured</option>
          <option value="low">Price: Low → High</option>
          <option value="high">Price: High → Low</option>
          <option value="cal">Lightest first</option>
        </select>
      </div>

      <div className="tabs">
        {['All', ...categories].map((c) => (
          <button key={c} className={`tab ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {cat === c && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
            <span>{c}</span>
          </button>
        ))}
      </div>
      <div className="chips">
        {filters.map((d) => (
          <button key={d.k} className={`chip ${diets.includes(d.k) ? 'on' : ''}`} onClick={() => toggleDiet(d.k)}>{d.label}</button>
        ))}
        <span className="muted count">{list.length} dishes</span>
      </div>

      <motion.div layout className="grid">
        <AnimatePresence mode="popLayout">
          {list.map((i) => <DishCard key={i.id} item={i} onOpen={(it) => setOpenId(it.id)} />)}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <div className="empty"><span style={{ fontSize: 48 }}>🫥</span><p>Nothing matches. Try loosening a filter.</p></div>}

      <AnimatePresence>
        {open && (
          <motion.div className="overlay center" onClick={() => setOpenId(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal glass" style={{ '--h': open.hue }} onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <button className="icon-btn close" onClick={() => setOpenId(null)}><X size={18} /></button>
              <div className="modal-art"><span>{open.emoji}</span></div>
              <div className="modal-body">
                <small className="muted">{open.category}</small>
                <h2>{open.name}</h2>
                <Tags item={open} />
                <p className="muted">{open.desc}</p>
                <div className="facts">
                  <div><b>{open.cal}</b><small>kcal</small></div>
                  <div><b>{'🌶️'.repeat(open.spice) || '—'}</b><small>heat</small></div>
                  <div><b>{money(open.price)}</b><small>price</small></div>
                </div>
                {isGuest && (
                  <button className="btn btn-primary wide" disabled={!open.available} onClick={() => { addToCart(open); setOpenId(null); }}>
                    <Plus size={16} /> {open.available ? 'Add to order' : 'Sold out'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}