import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useCountUp } from '../hooks';
import DishCard from '../components/DishCard';
import CravingCompass from '../components/CravingCompass';

function Stat({ value, label, live }) {
  const v = useCountUp(value);
  return (
    <div className="stat glass">
      <b>{Math.round(v)}</b>
      <span>{live && <i className="live-dot" />}{label}</span>
    </div>
  );
}

export default function Home() {
  const { menu, orders, user } = useStore();
  const nav = useNavigate();
  const active = orders.filter((o) => o.status !== 'served').length;
  const served = orders.filter((o) => o.status === 'served').length;

  const top = useMemo(() => {
    const c = {};
    orders.forEach((o) => o.items.forEach((i) => (c[i.id] = (c[i.id] || 0) + i.qty)));
    return menu
      .filter((m) => m.available)
      .sort((a, b) => (c[b.id] || 0) - (c[a.id] || 0))
      .slice(0, 3)
      .map((m) => ({ ...m, sold: c[m.id] || 0 }));
  }, [menu, orders]);

  const names = menu.map((m) => m.name);

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">🔥 Now serving · Fusion kitchen</span>
          <h1>Taste the <span className="grad-text">afterglow.</span></h1>
          <p className="lead muted">
            Hey {user.name.split(' ')[0]}. Wood-fired, globally inspired plates with a little bit of chaos. Order ahead, grab a table, and watch your food go from fire to plate in real time.
          </p>
          <div className="hero-cta">
            <Link to="/menu" className="btn btn-primary">Explore the menu <ArrowRight size={16} /></Link>
            <Link to="/reserve" className="btn">Reserve a table</Link>
          </div>
          <div className="stats">
            <Stat value={active} label="cooking now" live />
            <Stat value={menu.length} label="dishes" />
            <Stat value={served} label="plates served" />
          </div>
        </div>
        <div className="hero-art">
          <div className="glowdisc" />
          <div className="orbit big">
            {['🍣', '🍔', '🌮', '🍹', '🍰', '🍝'].map((e, i) => (
              <span className="slot" style={{ '--i': i }} key={i}><i>{e}</i></span>
            ))}
          </div>
          <div className="plate">🍜</div>
        </div>
      </section>

      <div className="marquee">
        <div>{[...names, ...names].map((n, i) => <span key={i}>{n} <em>✦</em></span>)}</div>
      </div>

      <section className="section">
        <div className="section-head"><h2>Most loved this week</h2><Link to="/menu" className="muted link">See all →</Link></div>
        <div className="grid">
          {top.map((t) => (
            <DishCard key={t.id} item={t} badge={`🔥 ${t.sold} sold`} onOpen={() => nav('/menu')} />
          ))}
        </div>
      </section>

      <section className="section"><CravingCompass /></section>
    </>
  );
}