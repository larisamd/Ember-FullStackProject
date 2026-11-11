import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Tag, X } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { money } from '../utils';

export default function CartDrawer() {
  const { state, dispatch, cartItems, subtotal, toast, applyPromo, createOrder } = useStore();
  const nav = useNavigate();
  const [tipPct, setTipPct] = useState(15);
  const [type, setType] = useState('dine-in');
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState(null);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);

  const close = () => dispatch({ type: 'CART_UI', open: false });
  const discount = promo ? (promo.type === 'pct' ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal)) : 0;
  const tip = ((subtotal - discount) * tipPct) / 100;
  const total = subtotal - discount + tip;
  const blocked = cartItems.some((i) => !i.available);

  const apply = async () => {
    const result = await applyPromo(code.trim());
    if (result) {
      setPromo(result);
      toast(`Promo applied: ${result.label} 🎉`);
    }
  };

  const place = async () => {
    if (placing) return;
    setPlacing(true);
    try {
      const result = await createOrder({
        items: cartItems.map((item) => ({ id: item.id, qty: item.qty })),
        type,
        note,
        tipPct,
        promoCode: promo?.code,
      });
      if (!result) return;
      setPromo(null); setCode(''); setNote('');
      toast('Order sent to the kitchen 🔥');
      nav('/orders');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {state.cartOpen && (
        <>
          <motion.div className="overlay" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="drawer-head">
              <h2>Your order</h2>
              <button className="icon-btn" onClick={close}><X size={18} /></button>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty"><ShoppingBag size={38} /><p>Your bag is empty.<br />Go find something delicious.</p></div>
            ) : (
              <>
                <div className="drawer-body">
                  <div className="seg">
                    {['dine-in', 'pickup'].map((t) => (
                      <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
                        {t === 'dine-in' ? 'Dine in' : 'Pickup'}
                      </button>
                    ))}
                  </div>

                  {cartItems.map((i) => (
                    <div className="line" key={i.id}>
                      <span className="line-emoji">{i.emoji}</span>
                      <div className="line-info">
                        <b>{i.name}</b>
                        <small className={i.available ? 'muted' : 'err-text'}>{i.available ? money(i.price) : 'Sold out — remove'}</small>
                      </div>
                      <div className="qty">
                        <button onClick={() => dispatch({ type: 'CART_QTY', id: i.id, delta: -1 })}><Minus size={14} /></button>
                        <span>{i.qty}</span>
                        <button onClick={() => dispatch({ type: 'CART_QTY', id: i.id, delta: 1 })}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}

                  <div className="promo">
                    <Tag size={16} />
                    <input placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} />
                    <button className="btn btn-sm" onClick={apply}>Apply</button>
                  </div>

                  <textarea className="note" placeholder="Allergies or special requests…" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />

                  <div className="tip-row">
                    <span className="muted">Tip the kitchen</span>
                    <div className="seg small">
                      {[0, 10, 15, 20].map((t) => (
                        <button key={t} className={tipPct === t ? 'on' : ''} onClick={() => setTipPct(t)}>{t}%</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="drawer-foot">
                  <div className="sum"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  {discount > 0 && <div className="sum good"><span>Discount</span><span>−{money(discount)}</span></div>}
                  <div className="sum"><span>Tip</span><span>{money(tip)}</span></div>
                  <div className="sum total"><span>Total</span><span>{money(total)}</span></div>
                  <button className="btn btn-primary wide" disabled={blocked || placing} onClick={place}>{placing ? 'Sending…' : `Place order · ${money(total)}`}</button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}