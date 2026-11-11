import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { todayISO } from '../utils';

export default function Reserve() {
  const { user, reservations, slots, tables, createReservation, deleteReservation, toast } = useStore();
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('19:00');
  const [size, setSize] = useState(2);
  const [table, setTable] = useState(null);
  const [name, setName] = useState(user.name);
  const [note, setNote] = useState('');

  const taken = useMemo(
    () => new Set(reservations.filter((r) => r.date === date && r.time === time).map((r) => r.table)),
    [reservations, date, time]
  );
  const isOff = (t) => taken.has(t.id) || t.seats < size;
  const selected = table && !isOff(tables.find((t) => t.id === table)) ? table : null;

  const mine = reservations
    .filter((r) => r.userId === user.id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const submit = async () => {
    if (!selected) return toast('Pick a table on the floor plan first', 'err');
    const result = await createReservation({ name, date, time, size, table: selected, note });
    if (!result) return;
    setTable(null); setNote('');
    toast(`Table ${selected} reserved for ${time} ✨`);
  };

  return (
    <>
      <div className="page-head">
        <h1>Reserve a <span className="grad-text">table</span></h1>
        <p className="muted">Choose your time, then tap a table. Greyed-out tables are booked or too small for your party.</p>
      </div>

      <div className="split">
        <div className="panel glass">
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Date<input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></label>

          <div className="field">
            <span className="lbl">Time</span>
            <div className="slots">
              {slots.map((s) => (
                <button key={s} className={`slot-btn ${time === s ? 'on' : ''}`} onClick={() => setTime(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="lbl">Party size</span>
            <div className="stepper">
              <button onClick={() => setSize((s) => Math.max(1, s - 1))}><Minus size={16} /></button>
              <b>{size}</b>
              <button onClick={() => setSize((s) => Math.min(8, s + 1))}><Plus size={16} /></button>
            </div>
          </div>

          <label>Notes<input placeholder="Birthday, allergies, high chair…" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className="btn btn-primary wide" onClick={submit}><CalendarDays size={16} /> Confirm reservation</button>
        </div>

        <div className="panel glass">
          <div className="floor-head"><b>Floor plan</b>
            <span className="legend-inline"><i className="k free" />Free <i className="k sel" />Yours <i className="k booked" />Unavailable</span>
          </div>
          <div className="floor">
            {tables.map((t) => (
              <motion.button
                key={t.id} whileTap={{ scale: 0.94 }} layout
                disabled={isOff(t)}
                className={`table t-${t.shape} ${selected === t.id ? 'sel' : ''} ${taken.has(t.id) ? 'booked' : ''}`}
                onClick={() => setTable(t.id)}
              >
                <b>{t.id}</b><small>{taken.has(t.id) ? 'Booked' : `${t.seats} seats`}</small>
              </motion.button>
            ))}
          </div>
          <div className="floor-foot"><span>🪟 Window</span><span>🍸 Bar side</span><span>🔥 Open kitchen</span></div>
        </div>
      </div>

      <section className="section">
        <h2>Your reservations</h2>
        {mine.length === 0 ? <p className="muted">Nothing booked yet.</p> : (
          <div className="res-list">
            {mine.map((r) => (
              <div className="res glass" key={r.id}>
                <div><b>{r.date}</b> · {r.time}</div>
                <div className="muted">{r.name} · party of {r.size} · table {r.table}</div>
                <button className="icon-btn" onClick={async () => {
                  if (await deleteReservation(r.id)) toast('Reservation cancelled');
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}