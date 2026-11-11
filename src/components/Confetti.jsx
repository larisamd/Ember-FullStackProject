import { useEffect, useState } from 'react';
import { useStore } from '../store/StoreContext';

const COLORS = ['#7c5cff', '#ff3d81', '#ffb340', '#c8ff3e', '#ffffff'];

export default function Confetti() {
  const { state } = useStore();
  const [bits, setBits] = useState([]);

  useEffect(() => {
    if (!state.confetti) return;
    setBits(
      Array.from({ length: 70 }, (_, i) => ({
        id: `${state.confetti}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
      }))
    );
    const t = setTimeout(() => setBits([]), 3800);
    return () => clearTimeout(t);
  }, [state.confetti]);

  return (
    <div className="confetti">
      {bits.map((b) => (
        <i
          key={b.id}
          style={{
            left: b.left + '%',
            background: b.color,
            width: b.size,
            height: b.size * 0.5,
            animationDelay: b.delay + 's',
            animationDuration: b.dur + 's',
          }}
        />
      ))}
    </div>
  );
}