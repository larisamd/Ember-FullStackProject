import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { money } from '../utils';

const MOODS = [
  { k: 'comfort', label: 'Comfort', e: '🛋️' },
  { k: 'fresh', label: 'Fresh', e: '🌿' },
  { k: 'adventure', label: 'Adventurous', e: '🧭' },
  { k: 'indulge', label: 'Indulgent', e: '💎' },
];
const SPICE = [
  { v: 0, label: 'No heat' }, { v: 1, label: 'Mild' }, { v: 2, label: 'Medium' }, { v: 3, label: 'Fiery' },
];
const DIETS = [{ k: 'any', label: 'Anything' }, { k: 'veg', label: 'Vegetarian' }, { k: 'vegan', label: 'Vegan' }];
const C = 2 * Math.PI * 42;

export default function CravingCompass() {
  const { menu, user, addToCart } = useStore();
  const [mood, setMood] = useState(null);
  const [spice, setSpice] = useState(1);
  const [diet, setDiet] = useState('any');

  const results = useMemo(() => {
    if (!mood) return [];
    return menu
      .filter((i) => i.available)
      .filter((i) => diet === 'any' || (diet === 'vegan' ? i.tags.includes('vegan') : i.tags.includes('veg') || i.tags.includes('vegan')))
      .map((i) => {
        const diff = Math.abs(i.spice - spice);
        const pct = Math.max(12, Math.min(99, 15 + (i.mood.includes(mood) ? 45 : 0) + (40 - diff * 13)));
        return { ...i, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [menu, mood, spice, diet]);

  const best = results[0];

  return (
    <section className="compass glass">
      <div className="compass-left">
        <span className="eyebrow"><Sparkles size={14} /> Craving Compass</span>
        <h2>Not sure what to eat?</h2>
        <p className="muted">Tell us your mood and we will point you to your perfect plate.</p>

        <h4>I am feeling…</h4>
        <div className="opts">
          {MOODS.map((m) => (
            <button key={m.k} className={`opt ${mood === m.k ? 'on' : ''}`} onClick={() => setMood(m.k)}>
              <span>{m.e}</span>{m.label}
            </button>
          ))}
        </div>
        <h4>Heat level</h4>
        <div className="opts row">
          {SPICE.map((s) => (
            <button key={s.v} className={`opt sm ${spice === s.v ? 'on' : ''}`} onClick={() => setSpice(s.v)}>{s.label}</button>
          ))}
        </div>
        <h4>Diet</h4>
        <div className="opts row">
          {DIETS.map((d) => (
            <button key={d.k} className={`opt sm ${diet === d.k ? 'on' : ''}`} onClick={() => setDiet(d.k)}>{d.label}</button>
          ))}
        </div>
      </div>

      <div className="compass-right">
        {!best ? (
          <div className="empty"><span style={{ fontSize: 56 }}>🧭</span><p>Pick a mood to reveal<br />your match.</p></div>
        ) : (
          <motion.div key={best.id + mood + spice + diet} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="result">
            <div className="ring-wrap">
              <svg viewBox="0 0 100 100" className="ring">
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" /><stop offset="60%" stopColor="#ff3d81" /><stop offset="100%" stopColor="#ffb340" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" className="ring-bg" />
                <motion.circle
                  cx="50" cy="50" r="42" className="ring-fg" stroke="url(#rg)" strokeDasharray={C}
                  initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - best.pct / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="ring-center"><span className="big-emoji">{best.emoji}</span><b>{best.pct}% match</b></div>
            </div>
            <h3>{best.name}</h3>
            <p className="muted">{best.desc}</p>
            <div className="result-actions">
              <span className="price">{money(best.price)}</span>
              {user?.role === 'customer' && (
                <button className="btn btn-primary" onClick={() => addToCart(best)}>Add to order</button>
              )}
            </div>
            {results.length > 1 && (
              <div className="mini-results">
                <small className="muted">Also great</small>
                {results.slice(1).map((r) => (
                  <div key={r.id} className="mini"><span>{r.emoji} {r.name}</span><b>{r.pct}%</b></div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}