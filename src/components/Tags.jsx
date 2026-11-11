import { Flame, Leaf } from 'lucide-react';

export default function Tags({ item }) {
  return (
    <div className="tags">
      {item.tags.includes('vegan') && <span className="tag t-green"><Leaf size={11} /> Vegan</span>}
      {item.tags.includes('veg') && <span className="tag t-green">Veg</span>}
      {item.tags.includes('gf') && <span className="tag t-amber">GF</span>}
      {item.spice > 0 && (
        <span className="tag t-red">
          {Array.from({ length: item.spice }).map((_, i) => <Flame key={i} size={11} />)}
        </span>
      )}
    </div>
  );
}