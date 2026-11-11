import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';
import Tags from './Tags';
import { useStore } from '../store/StoreContext';
import { money } from '../utils';

export default function DishCard({ item, onOpen, badge }) {
  const { user, favorites, toggleFavorite, addToCart } = useStore();
  const ref = useRef(null);
  const isGuest = user?.role === 'customer';
  const fav = isGuest && (favorites[user.id] || []).includes(item.id);

  const move = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const leave = () => {
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <div
        ref={ref}
        className={`dish ${!item.available ? 'soldout' : ''}`}
        style={{ '--h': item.hue }}
        onMouseMove={move}
        onMouseLeave={leave}
        onClick={() => onOpen(item)}
      >
        <div className="art">
          <span className="emoji">{item.emoji}</span>
          {badge && <span className="dish-badge">{badge}</span>}
          {isGuest && (
            <button
              className={`fav ${fav ? 'on' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, !fav); }}
              aria-label="Favorite"
            >
              <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
            </button>
          )}
          {!item.available && <span className="sold-label">Sold out</span>}
        </div>
        <div className="dish-body">
          <div className="dish-top">
            <h3>{item.name}</h3>
            <span className="price">{money(item.price)}</span>
          </div>
          <p className="muted clamp">{item.desc}</p>
          <div className="dish-foot">
            <Tags item={item} />
            {isGuest && (
              <button
                className="add"
                disabled={!item.available}
                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                aria-label={`Add ${item.name}`}
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}